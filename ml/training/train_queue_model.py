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

def train_queue_model():
    print(f"Loading Queue_10min from {DATASET_PATH}...")
    df = pd.read_excel(DATASET_PATH, sheet_name="Queue_10min")
    print(f"Loaded {len(df)} rows.")

    # Ensure timestamp sorted chronologically
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    df = df.sort_values('timestamp').reset_index(drop=True)

    # Feature Engineering
    # Lag features
    df['queue_lag_1'] = df['queue_length'].shift(1).fillna(df['queue_length'])
    df['queue_lag_2'] = df['queue_length'].shift(2).fillna(df['queue_length'])
    df['queue_lag_3'] = df['queue_length'].shift(3).fillna(df['queue_length'])

    # Rolling statistics
    df['rolling_queue_mean_3'] = df['queue_length'].rolling(window=3, min_periods=1).mean()
    df['rolling_arrival_mean_3'] = df['arrivals_10min'].rolling(window=3, min_periods=1).mean()
    df['rolling_service_mean_3'] = df['served_10min'].rolling(window=3, min_periods=1).mean()

    # Day of week mapping
    day_map = {'Monday': 0, 'Tuesday': 1, 'Wednesday': 2, 'Thursday': 3, 'Friday': 4, 'Saturday': 5, 'Sunday': 6}
    df['day_of_week_num'] = df['day_of_week'].map(day_map).fillna(0).astype(int)

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

    target_col = 'next_10min_queue'

    # Chronological Split (70% train, 15% val, 15% test)
    n = len(df)
    train_end = int(n * 0.70)
    val_end = int(n * 0.85)

    train_df = df.iloc[:train_end]
    val_df = df.iloc[train_end:val_end]
    test_df = df.iloc[val_end:]

    X_train, y_train = train_df[feature_cols], train_df[target_col]
    X_val, y_val = val_df[feature_cols], val_df[target_col]
    X_test, y_test = test_df[feature_cols], test_df[target_col]

    print(f"Train size: {len(X_train)}, Val size: {len(X_val)}, Test size: {len(X_test)}")

    # Train XGBoost Regressor
    model = xgb.XGBRegressor(
        n_estimators=150,
        learning_rate=0.05,
        max_depth=5,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        tree_method='hist'
    )

    model.fit(
        X_train, y_train,
        eval_set=[(X_val, y_val)],
        verbose=False
    )

    # Evaluate on Test Set
    preds_test = model.predict(X_test)
    # Clip negative queue predictions to 0
    preds_test = np.clip(preds_test, 0, None)

    mae = float(mean_absolute_error(y_test, preds_test))
    rmse = float(np.sqrt(mean_squared_error(y_test, preds_test)))
    r2 = float(r2_score(y_test, preds_test))

    print(f"Test Evaluation Results:")
    print(f"MAE:  {mae:.4f}")
    print(f"RMSE: {rmse:.4f}")
    print(f"R²:   {r2:.4f}")

    # Feature importances
    feature_importance = dict(zip(feature_cols, [float(x) for x in model.feature_importances_]))

    model_path = os.path.join(MODEL_DIR, "queue_xgboost_model.joblib")
    joblib.dump(model, model_path)
    print(f"Model saved to {model_path}")

    metrics = {
        "modelName": "Queue Congestion Regressor",
        "algorithm": "XGBoost Regressor",
        "version": "v1.0",
        "dataset": "Queue_10min (RetailMind 1-Year Dataset)",
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

    metrics_path = os.path.join(MODEL_DIR, "queue_model_metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"Metrics saved to {metrics_path}")

if __name__ == "__main__":
    train_queue_model()
