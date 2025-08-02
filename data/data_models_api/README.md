# Data Models API

This directory contains the machine learning models and API infrastructure for the Taximize NYC taxi optimization platform. The system provides two core predictive capabilities through a unified Flask API: trip scoring and hotspot prediction.

## Overview

The data_models_api consists of three main components:

1. **Hotspot Model** - Predicts high-demand pickup zones for drivers
2. **Scoring Model** - Evaluates profitability of individual trips
3. **Combined Flask App** - Unified API serving both models

## Architecture

```
data_models_api/
├── hotspot_model/           # Zone demand prediction system
├── scoring_model/           # Trip profitability scoring system
└── combined_flask_app/      # Flask API serving both models
```

## Quick Start

1. Navigate to the Flask app directory:
```bash
cd data/data_models_api/combined_flask_app
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the API server:
```bash
python flask_app.py
```

The API will start on `http://0.0.0.0:5050`

## API Endpoints

### Health Check
- **GET** `/`
- Returns: API running status

### Trip Scoring
- **POST** `/score_xgb` - Score using XGBoost model
- **POST** `/score_lgbm` - Score using LightGBM model
- Supports: July and August 2023 data

Example request:
```json
{
  "pickup_zone": "Times Sq/Theatre District",
  "dropoff_zone": "Upper West Side North",
  "pickup_datetime": "07/14/2025 10:00:00 AM"
}
```

### Hotspot Prediction
- **GET** `/hotspots?time=YYYY-MM-DDTHH:MM:SSZ`
- Supports: February through December 2023 (January not available)
- Returns: Top demand zones sorted by predicted trip count

Example: `GET /hotspots?time=2025-07-14T17:00:00Z`

## Model Components

### Hotspot Model (`/hotspot_model`)

Predicts zone-level pickup demand using:
- **11 month-specific LightGBM models** (Feb-Dec 2023)
- **Temporal features**: Historical lags, time-of-day patterns, holidays
- **Spatial features**: Zone statistics, POI densities
- **Target encodings**: Pre-computed categorical interactions

Key features:
- Average R² ~0.96 across all models
- Real-time lag features from historical data
- Zone-hour-holiday interaction patterns
- US holiday detection integration

### Scoring Model (`/scoring_model`)

Evaluates trip profitability using ensemble approach:
- **XGBoost and LightGBM models** for each month
- **Normalized scoring**: 0-1 range for UI display
- **Borough and airport detection**
- **Historical hotness and duration variability lookups**

Key components per month:
- Trained models (XGB & LGB)
- Hotness tables (zone demand by time)
- Duration variability data
- Scalers and scoring weights

## Technical Details

### Data Processing
- **Time zones**: Automatic UTC to NYC (America/New_York) conversion
- **Feature engineering**: Consistent across training and inference
- **Path resolution**: Works in local, Docker, and production environments

### Model Performance
- **Hotspot models**: R² ~0.96, RMSE 11.98-23.48
- **Scoring models**: Percentile-based normalization (5th-95th)
- **Training approach**: Month-to-month validation

### Dependencies
The system requires:
- pandas, numpy, scikit-learn
- xgboost, lightgbm
- Flask, pytz
- Zone coordinate and statistics data files

## Testing

Each model includes test scripts:
- `hotspot_model/test_api_hotspot.py` - Validates hotspot endpoint
- `scoring_model/test_score.py` - Tests scoring endpoints

Run tests with Flask server active on port 5050.

## Important Notes

1. **Month Support**:
   - Scoring: July and August only
   - Hotspots: February through December (no January)

2. **Input Formats**:
   - Scoring: MM/DD/YYYY HH:MM:SS AM/PM
   - Hotspots: ISO 8601 UTC (YYYY-MM-DDTHH:MM:SSZ)

3. **Production Considerations**:
   - Use `final_score` (not `predicted_score`) for UI display
   - Models reference 2023 historical data
   - Debug mode disabled for stability

## File Organization

### Model Storage Pattern
Each month's models follow consistent naming:
- Models: `model_{month}_{algorithm}.pkl`
- Hotspot: `hotspot_model_{prev}_to_{curr}.pkl`
- Metadata: `{feature}_{month}.{ext}`

### Required Data Files
- `zone_coordinates.csv` - Zone ID mappings and locations
- `zone_stats_with_all_densities.csv` - POI and zone features
- `historical_lags.csv` - Historical demand patterns
- Encoding maps for categorical features

## Development

When extending the system:
1. Maintain consistent feature engineering between training and inference
2. Update `model_features.pkl` when adding new features
3. Ensure zone data files remain synchronized
4. Test with appropriate month data before deployment

For detailed information about each component, refer to the README files in the respective subdirectories.