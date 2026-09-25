import os
import json
import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

MODEL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models"))
QUEUE_MODEL_PATH = os.path.join(MODEL_DIR, "queue_xgboost_model.joblib")
QUEUE_METRICS_PATH = os.path.join(MODEL_DIR, "queue_model_metrics.json")
INVENTORY_MODEL_PATH = os.path.join(MODEL_DIR, "inventory_xgboost_model.joblib")
INVENTORY_METRICS_PATH = os.path.join(MODEL_DIR, "inventory_model_metrics.json")

app = FastAPI(title="RetailMind ML Microservice", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory models & metrics cache
models_cache = {}

def load_models():
    if os.path.exists(QUEUE_MODEL_PATH):
        models_cache['queue_model'] = joblib.load(QUEUE_MODEL_PATH)
    if os.path.exists(QUEUE_METRICS_PATH):
        with open(QUEUE_METRICS_PATH, "r") as f:
            models_cache['queue_metrics'] = json.load(f)
    if os.path.exists(INVENTORY_MODEL_PATH):
        models_cache['inventory_model'] = joblib.load(INVENTORY_MODEL_PATH)
    if os.path.exists(INVENTORY_METRICS_PATH):
        with open(INVENTORY_METRICS_PATH, "r") as f:
            models_cache['inventory_metrics'] = json.load(f)

load_models()

class QueuePredictionRequest(BaseModel):
    queue_length: float
    arrivals_10min: float
    served_10min: float
    active_counters: int = 2
    avg_wait_minutes: float = 2.0
    avg_service_minutes: float = 2.0
    footfall_index: float = 0.6
    hour: int = 14
    minute: int = 30
    day_of_week_num: int = 0
    is_weekend: int = 0
    queue_lag_1: Optional[float] = None
    queue_lag_2: Optional[float] = None
    queue_lag_3: Optional[float] = None
    rolling_queue_mean_3: Optional[float] = None
    rolling_arrival_mean_3: Optional[float] = None
    rolling_service_mean_3: Optional[float] = None
    high_threshold: float = 10.0
    critical_threshold: float = 15.0

class InventoryPredictionRequest(BaseModel):
    current_stock: float
    expected_stock: float
    daily_units_sold_est: float = 3.0
    planogram_compliance_pct: float = 95.0
    misplacement_detected: int = 0
    demand_level_num: int = 2
    day_of_week: int = 0
    is_weekend: int = 0
    rolling_sales_3d: Optional[float] = None
    rolling_stock_3d: Optional[float] = None

@app.get("/health")
def health_check():
    queue_ready = 'queue_model' in models_cache
    inv_ready = 'inventory_model' in models_cache
    return {
        "status": "ready" if (queue_ready and inv_ready) else "loading",
        "models": {
            "queue_model": "loaded" if queue_ready else "not_loaded",
            "inventory_model": "loaded" if inv_ready else "not_loaded"
        },
        "queue_metrics": models_cache.get('queue_metrics', {}).get('metrics'),
        "inventory_metrics": models_cache.get('inventory_metrics', {}).get('metrics')
    }

@app.post("/predict/queue")
def predict_queue(req: QueuePredictionRequest):
    if 'queue_model' not in models_cache:
        load_models()
    if 'queue_model' not in models_cache:
        raise HTTPException(status_code=503, detail="Queue model is not trained/loaded yet")

    model = models_cache['queue_model']

    q_lag1 = req.queue_lag_1 if req.queue_lag_1 is not None else req.queue_length
    q_lag2 = req.queue_lag_2 if req.queue_lag_2 is not None else q_lag1
    q_lag3 = req.queue_lag_3 if req.queue_lag_3 is not None else q_lag2
    roll_q = req.rolling_queue_mean_3 if req.rolling_queue_mean_3 is not None else req.queue_length
    roll_arr = req.rolling_arrival_mean_3 if req.rolling_arrival_mean_3 is not None else req.arrivals_10min
    roll_srv = req.rolling_service_mean_3 if req.rolling_service_mean_3 is not None else req.served_10min

    feature_cols = [
        'queue_length',
        'arrivals_10min',
        'served_10min',
        'active_counters',
        'avg_wait_minutes',
        'avg_service_minutes',
        'footfall_index',
        'hour',
        'minute',
        'day_of_week_num',
        'is_weekend',
        'queue_lag_1',
        'queue_lag_2',
        'queue_lag_3',
        'rolling_queue_mean_3',
        'rolling_arrival_mean_3',
        'rolling_service_mean_3'
    ]

    features = pd.DataFrame([[
        req.queue_length,
        req.arrivals_10min,
        req.served_10min,
        req.active_counters,
        req.avg_wait_minutes,
        req.avg_service_minutes,
        req.footfall_index,
        req.hour,
        req.minute,
        req.day_of_week_num,
        req.is_weekend,
        q_lag1,
        q_lag2,
        q_lag3,
        roll_q,
        roll_arr,
        roll_srv
    ]], columns=feature_cols)

    pred = float(model.predict(features)[0])
    pred = max(0.0, pred)
    pred_int = int(round(pred))

    # Congestion Level
    if pred >= req.critical_threshold:
        congestion_level = "CRITICAL"
        recommendation = "CRITICAL: Immediately open additional counters (e.g. Counter 3 & Counter 4)."
    elif pred >= req.high_threshold:
        congestion_level = "HIGH"
        recommendation = "Open Counter 3 to relieve customer queue pressure."
    elif pred >= 6:
        congestion_level = "MODERATE"
        recommendation = "Monitor queue progression; alert floor supervisor."
    else:
        congestion_level = "NORMAL"
        recommendation = "Current counter allocation is optimal."

    # Explainable "WHY?"
    arrival_trend = "High" if req.arrivals_10min > req.served_10min else "Balanced"
    explanation = (
        f"Current queue: {int(req.queue_length)} customers. "
        f"Arrival rate ({int(req.arrivals_10min)}/10 min) exceeds service capacity ({int(req.served_10min)}/10 min) "
        f"with {req.active_counters} active counters. "
        f"Predicted footfall index {req.footfall_index:.2f} indicates {arrival_trend.lower()} shopper inflow. "
        f"Model projects {pred_int} customers waiting in next 10 minutes."
    )

    metrics_data = models_cache.get('queue_metrics', {})

    return {
        "predictedQueue": pred_int,
        "predictedQueueExact": round(pred, 2),
        "congestionLevel": congestion_level,
        "recommendation": recommendation,
        "explanation": explanation,
        "inputSummary": {
            "currentQueue": req.queue_length,
            "arrivals10min": req.arrivals_10min,
            "served10min": req.served_10min,
            "activeCounters": req.active_counters,
            "footfallIndex": req.footfall_index
        },
        "model": metrics_data.get('algorithm', 'XGBoost Regressor'),
        "modelVersion": metrics_data.get('version', 'v1.0'),
        "metrics": metrics_data.get('metrics', {})
    }

@app.post("/predict/inventory")
def predict_inventory(req: InventoryPredictionRequest):
    if 'inventory_model' not in models_cache:
        load_models()
    if 'inventory_model' not in models_cache:
        raise HTTPException(status_code=503, detail="Inventory model is not trained/loaded yet")

    model = models_cache['inventory_model']

    stock_pct = (req.current_stock / req.expected_stock * 100) if req.expected_stock > 0 else 0
    roll_sales = req.rolling_sales_3d if req.rolling_sales_3d is not None else req.daily_units_sold_est
    roll_stock = req.rolling_stock_3d if req.rolling_stock_3d is not None else req.current_stock

    feature_cols = [
        'current_stock',
        'expected_stock',
        'stock_percentage',
        'daily_units_sold_est',
        'planogram_compliance_pct',
        'misplacement_detected',
        'demand_level_num',
        'day_of_week',
        'is_weekend',
        'rolling_sales_3d',
        'rolling_stock_3d'
    ]

    features = pd.DataFrame([[
        req.current_stock,
        req.expected_stock,
        stock_pct,
        req.daily_units_sold_est,
        req.planogram_compliance_pct,
        req.misplacement_detected,
        req.demand_level_num,
        req.day_of_week,
        req.is_weekend,
        roll_sales,
        roll_stock
    ]], columns=feature_cols)

    risk = float(model.predict(features)[0])
    risk = max(0.0, min(1.0, risk))

    # Calculate estimated minutes to stockout
    # Hourly consumption rate based on daily sales (assuming 14 store hours)
    hourly_rate = max(0.2, req.daily_units_sold_est / 14.0)
    hours_left = req.current_stock / hourly_rate
    minutes_left = max(0, int(round(hours_left * 60)))

    # Shelf Health Score (0 - 100)
    # Stock availability: 40%, Planogram compliance: 25%, Demand stability: 15%, Stock-out risk: 20%
    stock_avail_score = min(100.0, stock_pct) * 0.40
    plano_score = req.planogram_compliance_pct * 0.25
    demand_stability = (100.0 - (req.demand_level_num * 15.0)) * 0.15
    risk_factor = ((1.0 - risk) * 100.0) * 0.20
    shelf_health_score = int(round(stock_avail_score + plano_score + demand_stability + risk_factor))
    shelf_health_score = max(0, min(100, shelf_health_score))

    # Status
    if req.current_stock <= 0:
        stock_status = "Out of Stock"
    elif stock_pct <= 30.0:
        stock_status = "Low Stock"
    else:
        stock_status = "Healthy"

    reorder_qty = max(0, int(req.expected_stock - req.current_stock))
    recommendation = f"Replenish {reorder_qty} units" if req.current_stock < req.expected_stock * 0.4 else "Stock level satisfactory."

    metrics_data = models_cache.get('inventory_metrics', {})

    return {
        "stockoutRisk": round(risk, 3),
        "predictedStockoutMinutes": minutes_left,
        "stockStatus": stock_status,
        "stockPercentage": round(stock_pct, 1),
        "shelfHealthScore": shelf_health_score,
        "recommendation": recommendation,
        "reorderQuantity": reorder_qty,
        "model": metrics_data.get('algorithm', 'XGBoost Regressor'),
        "modelVersion": metrics_data.get('version', 'v1.0'),
        "metrics": metrics_data.get('metrics', {})
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
