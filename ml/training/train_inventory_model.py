import os
import json
import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib

DATASET_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "RetailMind_1Year_Synthetic_Dataset.xlsx"))
MODEL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models"))
os.makedirs(MODEL_DIR, exist_ok=True)

def train_inventory_model():
    print(f"Loading Inventory_Shelf_Daily from {DATASET_PATH}...")
    df = pd.read_excel(DATASET_PATH, sheet_name="Inventory_Shelf_Daily")
    print(f"Loaded {len(df)} rows.")

    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date').reset_index(drop=True)

    # Feature engineering
    df['day_of_week'] = df['date'].dt.dayofweek
    df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)

    # Demand level encoding
    demand_map = {'Low': 1, 'Medium': 2, 'High': 3}
    df['demand_level_num'] = df['demand_level'].map(demand_map).fillna(2)

    # Lag / rolling features per SKU
    df['rolling_sales_3d'] = df.groupby('sku')['daily_units_sold_est'].transform(lambda s: s.rolling(3, min_periods=1).mean())
    df['rolling_stock_3d'] = df.groupby('sku')['current_stock'].transform(lambda s: s.rolling(3, min_periods=1).mean())

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

    target_col = 'stockout_risk_0_to_1'

    n = len(df)
    train_end = int(n * 0.70)
    val_end = int(n * 0.85)

    train_df = df.iloc[:train_end]
    val_df = df.iloc[train_end:val_end]
    test_df = df.iloc[val_end:]

    X_train, y_train = train_df[feature_cols], train_df[target_col]
    X_val, y_val = val_df[feature_cols], val_df[target_col]
    X_test, y_test = test_df[feature_cols], test_df[target_col]

    model = xgb.XGBRegressor(
        n_estimators=100,
        learning_rate=0.05,
        max_depth=4,
        random_state=42,
        tree_method='hist'
    )

    model.fit(
        X_train, y_train,
        eval_set=[(X_val, y_val)],
        verbose=False
    )

    preds_test = model.predict(X_test)
    preds_test = np.clip(preds_test, 0, 1.0)

    mae = float(mean_absolute_error(y_test, preds_test))
    rmse = float(np.sqrt(mean_squared_error(y_test, preds_test)))
    r2 = float(r2_score(y_test, preds_test))

    print(f"Inventory Stock-out Risk Test Evaluation Results:")
    print(f"MAE:  {mae:.4f}")
    print(f"RMSE: {rmse:.4f}")
    print(f"R²:   {r2:.4f}")

    feature_importance = dict(zip(feature_cols, [float(x) for x in model.feature_importances_]))

    model_path = os.path.join(MODEL_DIR, "inventory_xgboost_model.joblib")
    joblib.dump(model, model_path)
    print(f"Model saved to {model_path}")

    metrics = {
        "modelName": "Inventory Stock-out Risk Predictor",
        "algorithm": "XGBoost Regressor",
        "version": "v1.0",
        "dataset": "Inventory_Shelf_Daily (RetailMind 1-Year Dataset)",
        "trainSamples": len(X_train),
        "valSamples": len(X_val),
        "testSamples": len(X_test),
        "target": target_col,
        "featureColumns": feature_cols,
        "metrics": {
            "mae": round(mae, 4),
            "rmse": round(rmse, 4),
            "r2": round(r2, 4)
        },
        "featureImportance": feature_importance
    }

    metrics_path = os.path.join(MODEL_DIR, "inventory_model_metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"Metrics saved to {metrics_path}")

if __name__ == "__main__":
    train_inventory_model()
