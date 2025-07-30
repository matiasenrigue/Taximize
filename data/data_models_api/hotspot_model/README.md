# Hotspot Prediction Module – `hotspot_model/`

This folder contains all code, data, and model artifacts used for **predicting high-demand pickup zones** in NYC. It powers the hotspot recommendation engine in the backend.

---

## Directory Overview

| File / Folder                         | Description                                                                                      |
|--------------------------------------|--------------------------------------------------------------------------------------------------|
| `Hotspot Prediction Function.ipynb`  | Jupyter notebook outlining the full training pipeline: preprocessing, feature engineering, model training, and evaluation. |
| `feature_engineering.py`             | Main script for temporal, spatial, and POI-based feature transformations. Used in both training and real-time inference. Includes holiday detection, time-of-day categorization, and target encoding preparations. |
| `model_features.pkl`                 | Serialized list of features selected during training. Ensures consistency between training and prediction. |
| `test_api_hotspot.py`                | Test script for validating the Flask `/hotspots` endpoint. Checks input formatting (ISO 8601), output schema, and model behavior. Tests sorting order and error handling. |
| `training_results.csv`               | Output log of model performance metrics (R², RMSE, MAE) for month-to-month model training. Shows parameters and model file paths. Average R² ~0.96 across all months. |
| `utils.py`                           | Utility functions for zone mapping, datetime parsing, and loading external zone statistics. Contains `get_multiple_proxy_lags()` for historical demand lookups and `generate_features_for_time()` for batch predictions. |
| `zone_coordinates.csv`               | Lookup table for latitude and longitude of each taxi zone. Maps zone names to OBJECTID. Supports spatial merging and mapping. |
| `zone_stats_with_all_densities.csv`  | Precomputed zone-level data including POI densities and interaction terms, used during feature generation. |
| `models/`                            | Directory containing month-specific trained model files (`hotspot_model_1_to_2.pkl`, etc.) and `encoding_maps/` subdirectory with pickled target encoding dictionaries for various categorical interactions. |
| `models/encoding_maps/`              | Contains 9 pickle files with target encodings for categorical features (e.g., zone×hour, zone×weekend, holiday×time interactions). |
| `historical_lags.csv`                | Precomputed zone-hour-level demand from previous months (2023 data), used to simulate real-time lag features (e.g., trip count 1 hour ago, 2 hours ago, rolling averages). |
| `__pycache__/`                       | Auto-generated cache from Python interpreter (safe to ignore). |
| `README.md`                          | Documentation for the hotspot prediction module, including file descriptions, model usage, and feature overview.  |

---

## How It Works

### 1. Training Pipeline (Offline)

- Launch `Hotspot Prediction Function.ipynb`
- Builds a zone-hour grid for each day
- Applies feature transformations via `feature_engineering.py`
- Loads zone-level statistics (`zone_stats_with_all_densities.csv`)
- Trains month-specific models (LightGBM with learning_rate=0.05, max_depth=7, n_estimators=200)
- Logs results to `training_results.csv` (includes RMSE, MAE, R² metrics)
- Saves selected features to `model_features.pkl`
- Stores target encodings in `models/encoding_maps/` for consistent inference

### 2. Real-Time Scoring (Production)

- Input: pickup hour and day (ISO 8601 format via API)
- Load appropriate month-specific model from `models/` directory
- Use `utils.generate_features_for_time()` to create features for all zones
- Apply lagged trip counts from `historical_lags.csv` (1h ago, 2h ago, rolling avg)
- Load POI data from `zone_stats_with_all_densities.csv`
- Apply saved target encodings from `models/encoding_maps/`
- Predict demand scores per zone
- Return top hotspots sorted by predicted trip count

---

## API Testing

Use `test_api_hotspot.py` to validate that your model endpoint responds correctly. The test suite includes:

- Endpoint availability checks
- Valid response structure validation (pickup_zone, location_id, predicted_trip_count)
- Sorting order verification (results sorted by predicted_trip_count descending)
- ISO 8601 time format validation
- Error handling for invalid time formats

```bash
python test_api_hotspot.py
```
Ensure the Flask server is running and accessible at the correct URL. The endpoint expects time in ISO 8601 format (e.g., `2025-07-11T10:00:00Z`).

---

## Model Performance

Model evaluation metrics are saved in `training_results.csv`:

- **Average R²**: ~0.96 across all monthly models
- **RMSE Range**: 11.98 - 23.48 (August model shows higher error)
- **MAE Range**: 5.68 - 10.77
- **Model Architecture**: LightGBM with consistent hyperparameters
- **Training Approach**: Month-to-month models (train on month N, test on month N+1)

---

## Key Features Used in the Model

- **Temporal demand signals**:
  - Recent trip counts from 1–2 hours ago (via `historical_lags.csv` lookup)
  - Rolling averages over prior hours to smooth out noise
  - Time-of-day categories: Early Morning (0-5), Morning Rush (5-10), Midday (10-15), Evening Rush (15-19), Night (19-24)

- **Interaction features (target-encoded)**:
  - Zone × Hour (e.g., average demand in a specific zone at a specific hour)
  - Zone × Weekend (e.g., whether demand shifts on weekends by zone)
  - Zone × Holiday (e.g., holiday-adjusted demand patterns using US holidays library)
  - Zone × Hour × Weekend/Holiday (triple interactions)
  - Day-of-week × Time-of-day (e.g., Monday morning vs. Saturday evening)
  - Holiday × Time-of-day (e.g., midday demand during public holidays)

- **Zone-level categorical encodings**:
  - Historical average demand for each zone (target encoding)
  - Zone ID mapping from `zone_coordinates.csv`
  - POI densities and features from `zone_stats_with_all_densities.csv`

- **Raw time features**:
  - Pickup hour, day of week, month
  - Weekend indicator (Saturday/Sunday)
  - US holiday indicator

---

## Notes

- All inputs should be validated prior to inference (ISO 8601 format required for API)
- Ensure `zone_stats_with_all_densities.csv` and `zone_coordinates.csv` are kept up-to-date
- The final feature list must exactly match `model_features.pkl` for consistent predictions
- Historical lag data references 2023 data - update `historical_lags.csv` for current year performance
- Models are trained monthly to capture seasonal patterns (12 separate model files)
- Target encodings are precomputed and stored in `models/encoding_maps/` to prevent data leakage
- The Flask app path is expected at `../combined_flask_app/flask_app.py` relative to this directory

