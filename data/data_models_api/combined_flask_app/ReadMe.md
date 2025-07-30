# Combined Trip Scoring & Hotspot Prediction API

This Flask app serves as the unified backend for two predictive models used in the Taximize project:

- **Trip Scoring Model**  
  Scores individual NYC taxi trips based on pickup/dropoff zones, time of day, and features such as fare efficiency and proximity to high-demand areas. The model uses both XGBoost and LightGBM implementations with month-specific training data.

- **Hotspot Prediction Model**  
  Forecasts zone-level pickup demand for a specific datetime, helping drivers decide where to position themselves next. Uses separate models for each month (except January) with lag features and various temporal/spatial encodings.

Note: This repository contains only the Flask API interface. The trained model files, encoders, and utilities are stored in sibling directories:

- `../scoring_model/`
- `../hotspot_model/`

---

##  Folder Structure

This folder contains:
- `flask_app.py` — Main Flask app exposing both APIs (runs on port 5050).
- `requirements.txt` — Dependencies to run the app.
- `README.md` — You're reading it!

Model and utility files are stored in sibling folders:
- `../scoring_model/` — Contains month-specific models (July, August), scalers, scoring weights, hotness tables, duration variability data, and utility functions
  - `july/` and `august/` — Month-specific model files and reference data
  - `models/expected_columns/` — Expected column configurations for each model type
  - `scoring_utils.py` — Utility functions for trip scoring
- `../hotspot_model/` — Contains monthly prediction models, feature engineering scripts, and zone data
  - `models/` — 11 monthly models (Feb-Dec) and encoding maps for various feature interactions
  - `models/encoding_maps/` — Target encoding files for different feature combinations
  - `utils.py` and `feature_engineering.py` — Helper functions for prediction
  - Zone reference data (coordinates, statistics, historical lags)

---

##  How to Run the API

Make sure you're in the root project directory. Then run:

```bash
cd data/data_models_api/combined_flask_app
pip install -r requirements.txt
python flask_app.py
```

The API will start on `http://0.0.0.0:5050` (accessible from any network interface).

**Configuration Notes:**
- The app runs with `debug=False` for production stability
- Time zones: The hotspot API automatically converts UTC times to NYC timezone (America/New_York)
- Month support: 
  - Trip scoring: July and August only
  - Hotspot prediction: February through December (January not supported)

---


# Available Endpoints

### GET /
Health check endpoint to verify the API is running.

**Response:**
```
Combined Trip Scoring + Hotspot Prediction API is running!
```

### POST /score_xgb
Score a trip using the XGBoost model. Supports July and August datetime inputs.

**Request:**
```json
{
  "pickup_zone": "Penn Station/Madison Sq West",
  "dropoff_zone": "Financial District North",
  "pickup_datetime": "07/14/2025 01:00:00 PM"
}
```

**Response:**
Returns a score object with trip metrics and recommendations. The exact structure depends on the scoring_utils implementation.

### POST /score_lgbm
Same as above but using the LightGBM model. Supports July and August datetime inputs.

**Request:**
```json
{
  "pickup_zone": "Penn Station/Madison Sq West",
  "dropoff_zone": "Financial District North",
  "pickup_datetime": "07/14/2025 01:00:00 PM"
}
```

### GET /hotspots?time=YYYY-MM-DDTHH:MM:SSZ
Returns predicted pickup demand for all zones at the specified time. Supports February through December (January not supported).

**Request:**
GET /hotspots?time=2025-07-14T17:00:00Z

Note: The API accepts ISO 8601 UTC format. If no time parameter is provided, it uses the current system time (rounded to the hour).

**Response:**
```json
[
  {
    "location_id": 186,
    "pickup_zone": "Penn Station/Madison Sq West",
    "predicted_trip_count": 7.14
  },
  {
    "location_id": 43,
    "pickup_zone": "Central Park",
    "predicted_trip_count": 7.10
  },
  ...
]
```

Note: The response is sorted by predicted_trip_count in descending order. The predicted values are actual trip counts (after applying expm1 transformation to model outputs).


---

# Dependencies

Ensure that both `../scoring_model/` and `../hotspot_model/` directories are populated with the following before running the app:

**Scoring Model Requirements (`../scoring_model/`):**
- Month-specific model files: `model_{month}_xgb.pkl` and `model_{month}_lgb.pkl`
- Scalers: `scaler_{month}.json`
- Scoring weights: `scoring_weights_{month}.json`
- Reference tables: `hotness_table_{month}.csv` and `duration_variability_{month}.csv`
- Expected columns configuration in `models/expected_columns/`
- The `scoring_utils.py` module

**Hotspot Model Requirements (`../hotspot_model/`):**
- Monthly prediction models: `hotspot_model_{prev_month}_to_{curr_month}.pkl` (e.g., `hotspot_model_1_to_2.pkl` for February predictions)
- Encoding maps in `models/encoding_maps/` for various feature interactions
- Zone data files: `zone_coordinates.csv`, `zone_stats_with_all_densities.csv`, `historical_lags.csv`
- The `utils.py` and `feature_engineering.py` modules

Install required Python packages using:

```bash
pip install -r requirements.txt
