"""
train_model.py

Trains two models for the AI-Powered Climate Risk & Crop Advisory System:
  1. flood_model    -> predicts a Flood Risk Score (0-100)
  2. drought_model  -> predicts a Drought Risk Score (0-100)

NOTE ON DATA: This script generates a realistic SYNTHETIC dataset that mimics
Bangladesh's seasonal rainfall/river/soil patterns, because live BMD (Bangladesh
Meteorological Department) historical records aren't bundled with this prototype.
The pipeline (features -> model -> risk score) is exactly what you'd use with
real BMD rainfall/river-gauge/soil-moisture data -- you would only need to swap
generate_synthetic_dataset() for a CSV loader of real records.

Run:
    pip install -r requirements.txt
    python train_model.py
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import os

RNG = np.random.default_rng(42)
N_SAMPLES = 4000


def generate_synthetic_dataset(n=N_SAMPLES):
    """Generate synthetic weather/soil/river records with realistic seasonal
    patterns for Bangladesh, plus rule-based flood/drought risk labels with
    added noise (so the model has to actually learn the pattern, not memorize
    a formula)."""

    month = RNG.integers(1, 13, size=n)
    is_monsoon = np.isin(month, [6, 7, 8, 9]).astype(int)     # Jun-Sep
    is_dry_season = np.isin(month, [11, 12, 1, 2]).astype(int)  # Nov-Feb

    # Rainfall (mm, trailing 7-day total)
    base_rain = np.where(is_monsoon == 1, 180, np.where(is_dry_season == 1, 15, 70))
    rainfall_7day_mm = np.clip(RNG.normal(base_rain, base_rain * 0.4 + 5), 0, None)

    # River level (m above danger mark baseline), correlated with rainfall
    river_level_m = np.clip(
        0.02 * rainfall_7day_mm + RNG.normal(1.5, 0.6, size=n) + is_monsoon * 1.2,
        0, None
    )

    # Temperature (C), seasonal
    base_temp = np.where(is_dry_season == 1, 20, np.where(is_monsoon == 1, 31, 27))
    temperature_c = RNG.normal(base_temp, 2.5)

    # Soil moisture (%), rises with rain, falls with heat/evaporation
    soil_moisture_pct = np.clip(
        30 + 0.15 * rainfall_7day_mm - 0.8 * (temperature_c - 25) + RNG.normal(0, 5, size=n),
        2, 100
    )

    # --- Rule-based ground truth risk scores (with noise) ---
    flood_risk_score = np.clip(
        0.35 * rainfall_7day_mm / 2.2
        + 18 * river_level_m
        + 0.25 * soil_moisture_pct
        - 20
        + RNG.normal(0, 8, size=n),
        0, 100
    )

    drought_risk_score = np.clip(
        (100 - soil_moisture_pct) * 0.7
        + (temperature_c - 24) * 2.2
        - 0.15 * rainfall_7day_mm
        + RNG.normal(0, 8, size=n),
        0, 100
    )

    df = pd.DataFrame({
        "month": month,
        "is_monsoon": is_monsoon,
        "rainfall_7day_mm": rainfall_7day_mm.round(1),
        "river_level_m": river_level_m.round(2),
        "temperature_c": temperature_c.round(1),
        "soil_moisture_pct": soil_moisture_pct.round(1),
        "flood_risk_score": flood_risk_score.round(1),
        "drought_risk_score": drought_risk_score.round(1),
    })
    return df


FEATURES = ["rainfall_7day_mm", "river_level_m", "temperature_c", "soil_moisture_pct", "is_monsoon"]


def train_and_save():
    df = generate_synthetic_dataset()
    os.makedirs(os.path.dirname(__file__), exist_ok=True)
    df.to_csv(os.path.join(os.path.dirname(__file__), "synthetic_dataset.csv"), index=False)

    X = df[FEATURES]
    results = {}

    for target, filename in [
        ("flood_risk_score", "flood_model.pkl"),
        ("drought_risk_score", "drought_model.pkl"),
    ]:
        y = df[target]
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        model = RandomForestRegressor(n_estimators=200, max_depth=8, random_state=42)
        model.fit(X_train, y_train)

        preds = model.predict(X_test)
        mae = mean_absolute_error(y_test, preds)
        r2 = r2_score(y_test, preds)
        results[target] = {"mae": round(mae, 2), "r2": round(r2, 3)}

        joblib.dump(model, os.path.join(os.path.dirname(__file__), filename))
        print(f"Saved {filename}  |  MAE: {mae:.2f}  |  R^2: {r2:.3f}")

    return results


if __name__ == "__main__":
    print("Generating synthetic dataset and training models...\n")
    metrics = train_and_save()
    print("\nDone. Models saved to model/flood_model.pkl and model/drought_model.pkl")
    print("Dataset saved to model/synthetic_dataset.csv (for judges who want to inspect it)")
