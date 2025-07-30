#  Trip Scoring Model (Integration-Ready Module)

This folder contains everything needed to score the app Taximize (NYC) using trained XGBoost and LightGBM models. It's designed to plug directly into the backend for real-time scoring.

# Folder Structure

Please note in the readme I will only be adding the structure for the month of July  but everything that goes into that month applies to all months (February-December 2023)! 

Scoring_model/

```
├── scoring_utils.py         # Core feature engineering + model scoring
├── test_score.py            # Simple script to test scoring via API
├── models/
│ ├── expected_columns/      # saved training columns for inference
│ │ ├── expected_columns_xgb.pkl  
│ │ └── expected_columns_lgb.pkl
├── july/                    # each month will have all these files (Feb-Dec)
│ ├── model_july_xgb.pkl
│ ├── model_july_lgb.pkl
│ ├── hotness_table_july.csv
│ ├── duration_variability_july.csv
│ ├── scoring_weights_july.json
│ └── scaler_july.json
├── august/                  # same structure as July folder
│ └── ...

```
## What Each File In a Monthly Model Folder Does
Each month (e.g., `july/`) contains:

| File Name                       | Purpose                                                                  |
|---------------------------------|--------------------------------------------------------------------------|
| `model_july_xgb.pkl`            | Trained XGBoost model for scoring trips                                  |
| `model_july_lgb.pkl`            | Trained LightGBM model (used for ensemble scoring weights)               |
| `hotness_table_july.csv`        | Lookup table with average trip density ("hotness") by time and zone      |
| `duration_variability_july.csv` | Lookup table of historical trip time variability by route and time       |
| `scoring_weights_july.json`     | Combined feature weights from both models for final score calculation    |
| `scaler_july.json`              | MinMaxScaler object used to normalize scores to a 0–1 range              |


# How the Scoring Works

The scoring model uses an ensemble approach combining XGBoost and LightGBM models with the following key features:

1. **Time-based Features**: Extracts hour, day of week, weekend flags, and cyclic hour encoding (sin/cos)
2. **Zone Hotness**: Looks up historical trip density for the dropoff zone at the specific day/hour
3. **Duration Variability**: Retrieves historical trip time variability for the pickup-dropoff route
4. **Borough Mapping**: Maps zones to boroughs (Manhattan, Brooklyn, Queens, etc.) using zone_coordinates.csv
5. **Airport Detection**: Flags trips to/from airports based on zone names

The model outputs two scores:
- **predicted_score**: Raw model output representing profitability per minute
- **final_score**: Normalized score (0-1) using percentile-based scaling for UI display

# Local Testing

Ensure your Flask server is running on port 5050
Run the API test with: 

```bash
python test_score.py
```

This script tests the `/score_xgb` endpoint with multiple sample trips including regular city trips and airport trips.

# Required Input 

```json
{
  "pickup_zone": "Times Sq/Theatre District",
  "dropoff_zone": "Upper West Side North",
  "pickup_datetime": "07/14/2025 10:00:00 AM"
}
```
``` text
pickup_zone: TLC zone name
dropoff_zone: TLC zone name 
pickup_datetime: String in MM/DD/YYYY HH:MM:SS AM/PM format
```

# Output Format

```json
{
  "predicted_score": 1.31,
  "final_score": 0.013
}
```
```text
predicted_score: raw model predicitions (proxy for profitability per minute)
final_score: Normalized value between 0-1 (safe to display in UI)
```

# Implementation Details

## Month Abbreviation Mapping
The scoring system accepts 3-letter month abbreviations which are mapped to full month names:
- `jan` → `january`
- `feb` → `february`
- `mar` → `march`
- ... and so on

## Path Resolution
The scoring_utils.py includes robust path resolution that works in multiple environments:
- Local development (relative to script location)
- Docker containers (absolute paths under /app)
- Different working directories

## Model Loading
When loading models for a specific month, the system:
1. Loads both XGBoost and LightGBM models
2. Loads the hotness and duration variability lookup tables
3. Loads the scaler configuration for score normalization
4. Loads expected column configurations to ensure feature alignment

## Dependencies
The scoring module requires:
- pandas, numpy for data processing
- pickle, joblib for model loading
- sklearn for MinMaxScaler
- Borough mapping data from zone_coordinates.csv

# Final Notes 

Scores are based on dropoff zone hotness, duration variability, boroughs, and time of day features.

For backend when using this model please take the results from final_score rather than predicted

Normalization is performed using the 5th and 95th percentiles of predicted scores to reduce the impact of outliers and improve score spread across the 0–1 range.

Each month has its own trained models and metadata
