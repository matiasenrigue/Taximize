# Data Science and Modeling for Taximize

This folder contains all components related to data preparation, machine learning model development, and backend API integration for the NYC Taxi Trip Prediction Project, **Taximize**.

## Folder Structure

```
TaxiApp/data/
├── cleaning_exploration/        # EDA, notebooks, exploratory analysis
│
├── Coordinates_to_Zone/         # Mapping between zones and coordinates (lat/lon)
│
├── ReadME.md                    # This file
│
└── data_models_api/             # All model logic and API integration
    ├── combined_flask_app/           # Used for Integration
    │         
    ├── scoring_model/                # Scoring logic and model assets
    │
    └── hotspot_model/                # Hotspot logic and model assets

```

## Folder Explanition

### 1. `Coordinates_to_Zone/`

Contains scripts and outputs for mapping **NYC taxi zones to geographic coordinates**.

- Uses official TLC zone shapefiles to compute **centroid latitude/longitude** for each zone polygon.
- Outputs are used in downstream modeling and frontend mapping.

### 2. `cleaning_exploration/`

Jupyter notebooks and scripts for:
- Cleaning and preprocessing raw datasets
- Time-based feature engineering
- Exploratory data analysis and visualizations
- Demand heatmaps and zone clustering
- Borough-level and hourly breakdowns

---

### 3. `data_models_api/`

Main folder for model logic and deployment.

#### a. `scoring_model/`

- XGBoost and LightGBM models trained to score trips
- Monthly model files
- Feature scalers and weighting schemes
- `scoring_utils.py` and `test_score.py` for serving and testing trip scores
- Precomputed zone-level features (e.g., duration averages, hotness)

#### b. `hotspot_model/`

- LightGBM regression model predicting `log1p(trip_count)` for each zone-hour
- Feature engineering: POI density, zone interactions, holidays, time-of-day
- Encoders and target transformation
- `generate_features_for_time()` and related prediction utilities

#### c. `combined_flask_app/`

- Flask server exposing the following routes:
  - `POST /score_xgb` and `POST /score_lgbm` — Score an individual trip
  - `GET /hotspots?time=...` — Predict zone-level demand for a given time
- Contains:
  - `flask_app.py` (Flask entry point)
  - `requirements.txt` (dependency list)

---

# Setup and Running

1. Navigate to the `combined_flask` directory:
   ```bash
   cd data_models_api/combined_flask

2. Install required Python packages:
   ```bash
   pip install -r requirements.txt

4. Run the API
   ```bash
    python flask_app.py

6. Open your browser to:
   ```bash
   http://localhost:5050/

# Notes 

All models and required reference files are stored inside scoring_model and hotspot_model.

The frontend can call the backend endpoints without needing access to training logic.

Only a few months for the models will be pushed on here in order to not overwhelm GitHub with data. To access the rest of the remaining months please follow this link to download the data and models needed for the predictions

For the Scoring Model:
https://drive.google.com/drive/folders/1OqawUIecsM4yhQDphoMm26Tem7bxy-Dy?usp=sharing 

# Versioning & Contributions

This folder is organized for reproducibility, modularity, and API integration.

- All initial data cleaning, exploration notebooks, and modeling scripts are included.
- All files required to serve predictions (trained models, encoders, feature utilities) are provided.
- Docker integration is handled separately and not included in this directory.
