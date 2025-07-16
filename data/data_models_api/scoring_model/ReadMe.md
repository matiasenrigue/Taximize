#  Trip Scoring Model (Integration-Ready Module)

This folder contains everything needed to score the app Taximize (NYC) using trained XGBoost and LightGBM models. It's designed to plug directly into the backend for real-time scoring.

# Folder Structure

Please note in the readme I will only be adding the structure for the month of July but everything that goes into that month applies to all months (February-December 2023)! 

Scoring_model/

```
├── scoring_utils.py         # Core feature engineering + model scoring
├── test_score.py            # Simple script to test scoring via API
├── models/
│ ├── expected_columns/      # saved training columns for inference
│ │ ├── expected_columns_xgb.pkl  
│ │ └── expected_columns_lgb.pkl
│ ├── july/                   # each month will have all these files (Feb-Dec)
│ │ ├── model_july_xgb.pkl
│ │ ├── model_july_lgb.pkl
│ │ ├── hotness_table_july.csv
│ │ ├── duration_variability_july.csv
│ │ ├── scoring_weights_july.json
│ │ └── scaler_july.pkl

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
| `scaler_july.pkl`               | MinMaxScaler object used to normalize scores to a 0–1 range              |


# Local Testing

Ensure your Flask server is running
Run the API with: 

```bash
python test_score.py
```

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

# Final Notes 

Scores are based on dropoff zone hotness, duration variability, boroughs, and time of day features.

Normalization is done using MinMaxScaler trained on realistic predicted scores (excluding outliers)

Each month has its own trained models and metadata
