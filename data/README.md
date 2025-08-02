# Data Science and Modeling for Taximize

This folder contains all components related to data preparation, machine learning model development, and backend API integration for the NYC Taxi Trip Prediction Project, **Taximize**.

## Folder Structure

```
TaxiApp/data/
├── cleaning_exploration/        # EDA, notebooks, exploratory analysis
│   ├── Data_Cleaning&_Initial_Exploration/  # Initial data processing notebooks
│   ├── Initial_Models/          # Baseline model experiments  
│   ├── Scoring_Models/          # Model training for trip scoring
│   └── Zone_POIs.ipynb          # Zone-level point of interest analysis
│
├── Coordinates_to_Zone/         # Mapping between zones and coordinates (lat/lon)
│   ├── zone_coordinates.csv     # Zone centroid lookup table
│   └── process_zones_complete.py # Script to compute zone centroids
│
├── Dockerfile.production        # Production container configuration
│
├── README.md                    # This file
│
└── data_models_api/             # All model logic and API integration
    ├── combined_flask_app/      # Unified Flask API server
    │   ├── flask_app.py         # Main API entry point (port 5050)
    │   └── requirements.txt     # Python dependencies
    │         
    ├── scoring_model/           # Trip scoring logic and model assets
    │   ├── scoring_utils.py     # Core feature engineering functions
    │   ├── models/              # Model artifacts and metadata
    │   └── {month}/             # Monthly model files (july, august, etc.)
    │
    └── hotspot_model/           # Zone demand prediction logic
        ├── feature_engineering.py    # Temporal/spatial feature generation
        ├── utils.py                  # Helper functions
        ├── models/                   # Hourly prediction models
        └── zone_stats_with_all_densities.csv  # POI density features

```

## Folder Explanation

### 1. `Coordinates_to_Zone/`

Contains scripts and outputs for mapping **NYC taxi zones to geographic coordinates**.

- Uses official TLC zone shapefiles to compute **centroid latitude/longitude** for each zone polygon via `process_zones_complete.py`
- Outputs `zone_coordinates.csv` containing zone IDs with their centroid coordinates
- Critical for both spatial feature engineering and frontend mapping visualizations

### 2. `cleaning_exploration/`

Jupyter notebooks and scripts for:
- **Data_Cleaning&_Initial_Exploration/**: Raw data preprocessing, joining monthly datasets, and data quality analysis
- **Initial_Models/**: Baseline model experiments with random/monthly splits and feature importance analysis  
- **Scoring_Models/**: Training pipeline for XGBoost and LightGBM trip scoring models
- Time-based feature engineering with historical lags (`generate_historical_lags.ipynb`)
- Zone-level POI (Point of Interest) density analysis for spatial features
- Exploratory data analysis and demand pattern visualizations

---

### 3. `data_models_api/`

Main folder for model logic and deployment.

#### a. `scoring_model/`

- **Dual-model approach**: XGBoost and LightGBM models trained to score individual trips based on profitability metrics
- **Monthly models**: Separate models for each month (July, August, etc.) to capture seasonal patterns
- **Feature engineering**: `scoring_utils.py` handles dynamic feature generation including:
  - Zone "hotness" (historical demand density)
  - Duration variability for route predictability
  - Borough-based features and time-of-day patterns
- **Score normalization**: Uses 5th-95th percentile scaling to ensure UI-friendly 0-1 range
- **Testing utilities**: `test_score.py` for API endpoint validation

#### b. `hotspot_model/`

- **Hourly prediction models**: 11 separate LightGBM models (one per hour) predicting `log1p(trip_count)` 
- **Advanced feature engineering** via `feature_engineering.py`:
  - Historical lag features (demand from 1-2 hours ago)
  - Target-encoded interaction features (zone×hour, zone×weekend, zone×holiday)
  - POI density features from `zone_stats_with_all_densities.csv`
- **Encoding maps**: Precomputed target encodings stored in `models/encoding_maps/`
- **Performance tracking**: Model metrics logged in `training_results.csv`

#### c. `combined_flask_app/`

- **Unified API server** exposing both scoring and hotspot prediction endpoints:
  - `POST /score_xgb` and `POST /score_lgbm` — Score individual trips with respective models
  - `GET /hotspots?time=...` — Predict zone-level demand for any datetime
- **Production-ready**: Configured to run on port 5050 with all dependencies
- **Model integration**: Dynamically loads models from sibling directories based on request parameters

---

# Setup and Running

## Local Development

1. Navigate to the Flask app directory:
   ```bash
   cd data_models_api/combined_flask_app
   ```

2. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the API server:
   ```bash
   python flask_app.py
   ```

4. The API will be available at:
   ```bash
   http://localhost:5050/
   ```

## Docker Production Deployment

For production deployment, use the included Dockerfile:

```bash
# From the project root (parent of data/ folder)
docker build -f data/Dockerfile.production -t taximize-api .
docker run -p 5050:5050 taximize-api
```

The Docker image includes:
- Python 3.11 slim base image
- LightGBM system dependencies (libgomp1)
- All model files and utilities
- Flask server configured for production

# API Endpoints

## Trip Scoring Endpoints

### `POST /score_xgb` and `POST /score_lgbm`
Score individual trips using XGBoost or LightGBM models respectively.

**Request Body:**
```json
{
  "pickup_zone": "Times Sq/Theatre District",
  "dropoff_zone": "Upper West Side North", 
  "pickup_datetime": "07/14/2025 10:00:00 AM"
}
```

**Response:**
```json
{
  "predicted_score": 1.31,    // Raw model output
  "final_score": 0.013        // Normalized 0-1 score for UI
}
```

## Hotspot Prediction Endpoint

### `GET /hotspots?time=MM/DD/YYYY HH:MM:SS AM/PM`
Predicts pickup demand for all zones at a specified time.

**Example Request:**
```
GET /hotspots?time=07/14/2025 01:00:00 PM
```

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
  }
]
```

# Notes 

- All models and required reference files are stored inside scoring_model and hotspot_model directories
- The frontend can call the backend endpoints without needing access to training logic
- Model predictions use log-transformed values for ranking zones, not raw trip counts
- The API automatically selects the appropriate monthly model based on the input datetime

## Model Availability

Only July and August models are included in the repository to manage size. Additional months (February-December 2023) are available at:

**Scoring Models**: https://drive.google.com/drive/folders/1OqawUIecsM4yhQDphoMm26Tem7bxy-Dy?usp=sharing

# Architecture & Design Decisions

## Model Architecture

- **Scoring Model**: Ensemble of XGBoost and LightGBM with feature-weighted averaging
- **Hotspot Model**: Hourly LightGBM models (11 total) with extensive categorical encoding
- **Feature Engineering**: Combines temporal patterns, spatial relationships, and historical demand

## Production Considerations

- Models are pre-trained and loaded at startup for fast inference
- All feature transformations are deterministic and reproducible
- Docker deployment ensures consistent environment across platforms
- API responses are optimized for frontend consumption with normalized scores

# Versioning & Contributions

This folder is organized for reproducibility, modularity, and API integration:

- All initial data cleaning and exploration notebooks are preserved
- Model training pipelines are fully documented in Jupyter notebooks
- Production-ready API with comprehensive error handling
- Docker integration for seamless deployment
