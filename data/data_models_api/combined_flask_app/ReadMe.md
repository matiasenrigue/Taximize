# Combined Trip Scoring & Hotspot Prediction API

This Flask app serves as the unified backend for two predictive models used in the Taximize project:

- **Trip Scoring Model**  
  Scores individual NYC taxi trips based on pickup/dropoff zones, time of day, and features such as fare efficiency and proximity to high-demand areas.

- **Hotspot Prediction Model**  
  Forecasts zone-level pickup demand for a specific datetime, helping drivers decide where to position themselves next.

Note: This repository contains only the Flask API interface. The trained model files, encoders, and utilities are stored in sibling directories:

- `../scoring_model/`
- `../hotspot_model/`

---

##  Folder Structure

This folder contains:
- `flaks_app.py` — Main Flask app exposing both APIs.
- `requirements.txt` — Dependencies to run the app.
- `README.md` — You’re reading it!

Model and utility files are stored in sibling folders:
- `../scoring_model/` — scoring models + features
- `../hotspot_model/` — hotspot models + encodings

---

##  How to Run the API

Make sure you're in the root project directory. Then run:

```bash
cd data/data_models_api/combined_flask_app
pip install -r requirements.txt
python flask_app.py
```

---


# Available Endpoints

### POST /score_xgb
Score a trip using the XGBoost model.

**Response:**
```json
{
  "pickup_zone": "Penn Station/Madison Sq West",
  "dropoff_zone": "Financial District North",
  "pickup_datetime": "07/14/2025 01:00:00 PM"
}
```

### POST /score_lgbm
Same as above but using the LightGBM model.

### GET /hotspots?time=MM/DD/YYYY HH:MM:SS AM/PM
Returns a dictionary mapping each zone to its predicted number of pickups at the specified time.

**Request:**
GET /hotspots?time=07/14/2025 01:00:00 PM

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

Note: The predicted values represent log-transformed trip counts (log1p(trip_count)), which are useful for ranking zones by expected activity, not as raw counts.


---

# Dependencies

Ensure that both `../scoring_model/` and `../hotspot_model/` directories are populated with the following before running the app:

- Trained model files (XGBoost, LightGBM)
- Encoders and feature engineering scripts
- CSV files for POI data (used by the hotspot model)

Install required Python packages using:

```bash
pip install -r requirements.txt
