# AGRI-GUARD: Climate Risk & Crop Advisory System

An AI-powered system designed to analyze weather, soil, and environmental data to predict climate risks (like floods and droughts) and generate plain-language agricultural advisory warnings for farmers in Bangladesh.

---

## 📂 Repository Structure

The project is divided into two main components:

1. **`dashboard/`**: The modern, interactive React + Vite + Tailwind CSS web dashboard.
2. **`prototype/`**: The machine learning model pipeline, a Python Flask API for serving risk predictions, and a legacy HTML dashboard.

---

## 🚀 How to Run the Project

### 1. Modern Web Dashboard (`/dashboard`)
This is the main, interactive user interface built with React, Vite, Tailwind CSS, and Recharts.

#### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)

#### Steps to Run
1. Navigate to the dashboard directory:
   ```bash
   cd dashboard
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open the displayed URL in your browser (usually `http://localhost:5173/`).

---

### 2. Machine Learning API & Legacy Prototype (`/prototype`)
This contains the Python backend that simulates and trains the risk models, and a Flask API to serve those predictions.

#### Prerequisites
- [Python 3.9+](https://www.python.org/)

#### Steps to Run
1. Navigate to the prototype directory:
   ```bash
   cd prototype
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Train the machine learning models (generates data and saves model files):
   ```bash
   cd model
   # Runs data generation and model training script
   python train_model.py
   ```
   This will train the models and output two serialized files: `flood_model.pkl` and `drought_model.pkl` along with `synthetic_dataset.csv`.

4. Start the Flask API:
   ```bash
   cd ../api
   python app.py
   ```
   This will launch the prediction API server on `http://127.0.0.1:5000/`.

5. Open the legacy prototype dashboard:
   - Open `prototype/dashboard/index.html` directly in your web browser (double-click the file).

---

## 📊 Demo Testing Scenarios
To test the models and dashboard advisory features, you can input the following parameters:

| Scenario | Rainfall (mm) | River Level (m) | Temp (°C) | Soil Moisture (%) | Month | Expected Result |
|---|---|---|---|---|---|---|
| **Monsoon Flood** | 250 | 4.5 | 30 | 85 | July | High Flood Risk → advisories to drain fields |
| **Dry-Season Drought** | 5 | 0.8 | 34 | 12 | January | High Drought Risk → advisories to delay planting |
| **Normal Conditions** | 60 | 1.8 | 26 | 45 | March | Low Risk → normal advisory guidelines |

---

## 🛠️ Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, Recharts, Framer Motion, Lucide Icons.
- **Backend & ML**: Python, Flask, Scikit-Learn, Pandas, NumPy, Joblib.