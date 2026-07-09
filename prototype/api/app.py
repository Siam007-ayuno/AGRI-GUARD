"""
app.py

Flask API for the AI-Powered Climate Risk & Crop Advisory System.

Loads the two trained models (flood_model.pkl, drought_model.pkl) and exposes
a single endpoint, /predict, that the dashboard calls with current
rainfall/river/soil/temperature readings and returns a risk score + a plain
-language advisory action.

Run:
    pip install -r requirements.txt
    python train_model.py        # (from /model, only needed once)
    python app.py                # starts the API on http://127.0.0.1:5000
"""

import os
import joblib
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # allows the dashboard (opened as a local file) to call this API

MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "model")
FEATURES = ["rainfall_7day_mm", "river_level_m", "temperature_c", "soil_moisture_pct", "is_monsoon"]

flood_model = joblib.load(os.path.join(MODEL_DIR, "flood_model.pkl"))
drought_model = joblib.load(os.path.join(MODEL_DIR, "drought_model.pkl"))


def risk_level(score):
    if score >= 66:
        return "High"
    elif score >= 33:
        return "Medium"
    return "Low"


def build_advisory(flood_score, drought_score):
    flood_lvl = risk_level(flood_score)
    drought_lvl = risk_level(drought_score)

    # Whichever risk is more severe drives the recommended action
    if flood_score >= drought_score:
        if flood_lvl == "High":
            action = "Drain low-lying fields now and delay any new planting until water recedes."
        elif flood_lvl == "Medium":
            action = "Monitor river levels closely and clear drainage channels as a precaution."
        else:
            action = "Conditions are stable. Proceed with your normal planting schedule."
    else:
        if drought_lvl == "High":
            action = "Delay planting or switch to a drought-resistant variety; conserve irrigation water."
        elif drought_lvl == "Medium":
            action = "Increase irrigation frequency and monitor soil moisture over the next few days."
        else:
            action = "Conditions are stable. Proceed with your normal planting schedule."

    return action, flood_lvl, drought_lvl


@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json(force=True)

    try:
        rainfall_7day_mm = float(data["rainfall_7day_mm"])
        river_level_m = float(data["river_level_m"])
        temperature_c = float(data["temperature_c"])
        soil_moisture_pct = float(data["soil_moisture_pct"])
        month = int(data["month"])
    except (KeyError, ValueError, TypeError):
        return jsonify({"error": "Missing or invalid field. Required: rainfall_7day_mm, river_level_m, "
                                  "temperature_c, soil_moisture_pct, month"}), 400

    is_monsoon = 1 if month in (6, 7, 8, 9) else 0

    row = pd.DataFrame([{
        "rainfall_7day_mm": rainfall_7day_mm,
        "river_level_m": river_level_m,
        "temperature_c": temperature_c,
        "soil_moisture_pct": soil_moisture_pct,
        "is_monsoon": is_monsoon,
    }])[FEATURES]

    flood_score = float(flood_model.predict(row)[0])
    drought_score = float(drought_model.predict(row)[0])
    flood_score = max(0, min(100, flood_score))
    drought_score = max(0, min(100, drought_score))

    advisory, flood_lvl, drought_lvl = build_advisory(flood_score, drought_score)

    return jsonify({
        "flood_risk_score": round(flood_score, 1),
        "flood_risk_level": flood_lvl,
        "drought_risk_score": round(drought_score, 1),
        "drought_risk_level": drought_lvl,
        "advisory": advisory,
    })


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
