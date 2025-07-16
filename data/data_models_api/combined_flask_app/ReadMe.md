# Combined Trip Scoring & Hotspot Prediction API

This Flask app serves as the unified backend for two models:
- **Trip Scoring Model**: Scores individual taxi trips based on pickup/dropoff zones, time, and other features.
- **Hotspot Prediction Model**: Predicts the expected number of pickups in different zones for a given time.

please note that this is just the combined flask app for both models please look into the subfolders hotspot_model, and scoring_model for the rest of the requirements to run

---

##  Folder Structure

This folder contains:
- `app.py` — Main Flask app combining both APIs.
- `requirements.txt` — Dependencies to run the app.
- `README.md` — You’re reading it!

Model and utility files are stored in sibling folders:
- `../scoring_model/` — scoring models + features
- `../hotspot_model/` — hotspot models + encodings

---

##  How to Run the API

Make sure you're in the root project directory. Then run:

bash
cd data/data_models_api/combined_flask_app
pip install -r requirements.txt
python flask_app.py

---


# Available Endpoints

POST /score_xgb
Score a trip using the XGBoost model.

{
  "pickup_zone": "Penn Station/Madison Sq West",
  "dropoff_zone": "Financial District North",
  "pickup_datetime": "07/14/2025 01:00:00 PM"
}

POST /score_lgbm
Same as above but using the LightGBM model.

GET /hotspot?time=MM/DD/YYYY HH:MM:SS AM/PM
Returns predicted pickup volume per zone at a given time.  #Ellie will add more details here


---

# Dependencies

Ensure that you have both the hotspot_model and scoring_model folders that are populated with models, csv and utils before running 