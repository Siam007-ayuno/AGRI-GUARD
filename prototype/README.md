# AI-Powered Climate Risk & Crop Advisory System — Working Prototype

WSDG 2026 · Bangladesh National Round · Innovation Project

## What this is

A working demo of the pipeline described in the project poster:

```
weather/soil data  →  ML risk model  →  risk score  →  plain-language advisory
```

It has three parts:

```
prototype/
├── model/
│   ├── train_model.py         # generates data + trains the ML models
│   ├── synthetic_dataset.csv  # created after you run train_model.py
│   ├── flood_model.pkl        # created after you run train_model.py
│   └── drought_model.pkl      # created after you run train_model.py
├── api/
│   └── app.py                 # Flask API that serves predictions
├── dashboard/
│   └── index.html             # the farmer-facing dashboard (open in a browser)
└── requirements.txt
```

## Important note on data

This prototype uses a **synthetic dataset** that mimics Bangladesh's seasonal
rainfall/river/soil patterns — it stands in for real Bangladesh Meteorological
Department (BMD) historical records, which aren't bundled here. The pipeline
itself (features → model → risk score) is exactly what you'd use with real
data; you'd only need to swap the data-generation step in `train_model.py`
for a loader that reads real BMD rainfall/river-gauge/soil-moisture CSVs.
Say this plainly if a judge asks — it's a legitimate, common way to prove out
a pipeline before a real data-sharing agreement is in place.

## How to run it

**1. Install dependencies** (Python 3.9+ recommended):
```bash
pip install -r requirements.txt
```

**2. Train the models** (only needs to be done once):
```bash
cd model
python train_model.py
```
This prints accuracy metrics (MAE and R²) for both models and saves:
- `flood_model.pkl`
- `drought_model.pkl`
- `synthetic_dataset.csv` (useful if a judge wants to see the training data)

**3. Start the API:**
```bash
cd ../api
python app.py
```
Leave this running — it serves predictions at `http://127.0.0.1:5000/predict`.

**4. Open the dashboard:**
Open `dashboard/index.html` directly in your browser (double-click it, or
right-click → Open With → your browser). Enter rainfall, river level,
temperature, and soil moisture, pick a month, and click **Get Risk Advisory**.

## Demo scenarios worth showing judges

| Scenario | Rainfall (mm) | River level (m) | Temp (°C) | Soil moisture (%) | Month | Result |
|---|---|---|---|---|---|---|
| Monsoon flood | 250 | 4.5 | 30 | 85 | July | High flood risk → drain fields now |
| Dry-season drought | 5 | 0.8 | 34 | 12 | January | High drought risk → delay planting / switch variety |
| Normal conditions | 60 | 1.8 | 26 | 45 | March | Low risk → proceed as normal |

## What to say if asked "how accurate is this?"

Be honest: this is a proof-of-concept trained on synthetic data standing in
for real records, and the reported MAE/R² describe how well the model learned
the *synthetic* pattern — not real-world accuracy yet. The next step for a
production version is a data-sharing agreement with BMD (or use of their open
datasets) to retrain on real historical rainfall, river-gauge, and flood
records, at which point the same pipeline can be validated against actual
past flood events.
