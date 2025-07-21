# Hotspot Prediction Module – `hotspot_model/`

This folder contains all code, data, and model artifacts used for **predicting high-demand pickup zones** in NYC. It powers the hotspot recommendation engine in the backend.

---

## Directory Overview

| File / Folder                         | Description                                                                                      |
|--------------------------------------|--------------------------------------------------------------------------------------------------|
| `Hotspot Prediction Function.ipynb`  | Jupyter notebook outlining the full training pipeline: preprocessing, feature engineering, model training, and evaluation. |
| `feature_engineering.py`             | Main script for temporal, spatial, and POI-based feature transformations. Used in both training and real-time inference. |
| `model_features.pkl`                 | Serialized list of features selected during training. Ensures consistency between training and prediction. |
| `test_api_hotspot.py`                | Test script for validating the Flask `/predict_hotspots` endpoint. Checks input formatting, output schema, and model behavior. |
| `training_results.csv`               | Output log of model performance metrics (R², RMSE). Useful for comparing model versions. |
| `utils.py`                           | Utility functions for zone mapping, datetime parsing, and loading external zone statistics. |
| `zone_coordinates.csv`               | Lookup table for latitude and longitude of each taxi zone. Supports spatial merging and mapping. |
| `zone_stats_with_all_densities.csv`  | Precomputed zone-level data including POI densities and interaction terms, used during feature generation. |
| `models/`                            | Directory (not shown here) for storing trained model files (e.g., LightGBM `.txt`, XGBoost `.json`) for inference. |
| `__pycache__/`                       | Auto-generated cache from Python interpreter (safe to ignore). |

---

## How It Works

### 1. Training Pipeline (Offline)

- Launch `Hotspot Prediction Function.ipynb`
- Builds a zone-hour grid for each day
- Applies feature transformations via `feature_engineering.py`
- Loads zone-level statistics (`zone_stats_with_all_densities.csv`)
- Trains and evaluates models (LightGBM)
- Logs results to `training_results.csv`
- Saves selected features to `model_features.pkl`

### 2. Real-Time Scoring (Production)

- Input: pickup hour and day
- Load model + `model_features.pkl`
- Use latest zone stats and POI data
- Predict demand scores per zone
- Return top hotspots to frontend

---

## API Testing

Use `test_api_hotspot.py` to validate that your model endpoint responds correctly.

```bash
python test_api_hotspot.py
```
Ensure the Flask server is running and accessible at the correct URL (e.g., `http://localhost:5050/hotspots`).

---

## Model Performance

Model evaluation metrics (`R²`, `RMSE`, `MAE`) are saved in `training_results.csv`.  

---

## Key Features Used in the Model

- **Temporal demand signals**:
  - Recent trip counts from 1–2 hours ago
  - Rolling averages over prior hours to smooth out noise

- **Interaction features (target-encoded)**:
  - Zone × Hour (e.g., average demand in a specific zone at a specific hour)
  - Zone × Weekend (e.g., whether demand shifts on weekends by zone)
  - Zone × Holiday (e.g., holiday-adjusted demand patterns)
  - Day-of-week × Time-of-day (e.g., Monday morning vs. Saturday evening)
  - Holiday × Time-of-day (e.g., midday demand during public holidays)

- **Zone-level categorical encodings**:
  - Historical average demand for each zone (target encoding)
  - Borough indicators (e.g., Manhattan vs. Brooklyn)

- **Raw time features**:
  - Pickup hour used as a base time signal (less predictive on its own)

---

## Notes

- All inputs should be validated prior to inference
- Ensure `zone_stats_with_all_densities.csv` and `zone_coordinates.csv` are kept up-to-date
- The final feature list must exactly match `model_features.pkl` for consistent predictions

