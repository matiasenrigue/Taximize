# Data Science and Modeling for Taximize

This folder contains all components related to data preparation, modeling, and backend API integration for the NYC Taxi Trip Prediction Project.

## Folder Structure 

Data/
├── cleaning_exploration/         #EDA, notebooks, exploratory analysis
│
│   ├── zone_coordinates.csv/      #Load zone → borough map (used for encoding)
│
└── data_models_api/
    ├── combined_flask/            # Used for Integration
    │         
    ├── scoring_model/            # Scoring logic and model assets
    │
    └── hotspot_model/             # Hotspot logic and model assets 

## Folder Explanition

(1) cleaning_exploration: 

- Jupyter notebooks and scripts used for:
  - Cleaning raw datasets
  - Feature engineering
  - Data exploration & visualizations
  - Summary statistics and distribution analysis

(2) data_models_api/

Main integration folder for all model-related code and APIs. Contains three components:

(a) scoring_model/

- Trained models (XGBoost & LightGBM) by month
- Scoring weights (JSON)
- Scalers (MinMax)
- Hotness/duration feature CSVs
- `scoring_utils.py` and `test_score.py` for API logic and testing

(b) hotspot_model/ 

Ellie will add 

(c) combined_flask/

- Unified Flask API that serves both:
  - Trip scoring model (`/score_xgb`, `/score_lgbm`)
  - Hotspot prediction model (`/hotspot`)
- Includes `requirements.txt` and Flask entry script (`app.py`)
 

# Setup and Running

1. Navigate to the `combined_flask` directory:
   bash
   cd data_models_api/combined_flask

2. Install required Python packages:
    pip install -r requirements.txt

3. Start the API
    python app.py

4. Visit: http://localhost:5000/ to verify it's running.


# Notes 

All models and required reference files are stored inside scoring_model and hotspot_model.

The frontend can call the backend endpoints without needing access to training logic.

# Versioning & Contributions

This folder is organized for reproducibility and API integration.

All inital cleaning and exploration as well as essential files for serving predictions are included .

Docker integration handled separately
