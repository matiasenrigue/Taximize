# scoring_utils.py

import pandas as pd
import numpy as np
import os
import json
import pickle
import joblib
from datetime import datetime
from sklearn.preprocessing import MinMaxScaler


# Load zone → borough map (used for encoding)
ZONE_COORDINATES_PATH = os.path.join("Data", "zone_coordinates.csv")

try:
    zones_df = pd.read_csv(ZONE_COORDINATES_PATH, encoding="ISO-8859-1")
    borough_map = zones_df.set_index("zone")["borough"].to_dict()
except Exception as e:
    print(f"Failed to load borough map: {e}")
    borough_map = {}  # fallback


# Load all required files for a given month
def load_reference_files(month_abbr):
    # Map 3-letter abbreviation to full lowercase month name
    month_lookup = {
        "jan": "january", "feb": "february", "mar": "march", "apr": "april",
        "may": "may", "jun": "june", "jul": "july", "aug": "august",
        "sep": "september", "oct": "october", "nov": "november", "dec": "december"
    }

    month_folder = month_lookup.get(month_abbr.lower())  # e.g., "july"
    if not month_folder:
        raise ValueError(f"Invalid month abbreviation: {month_abbr}")

    # Debug: Print current working directory and path construction
    print(f"DEBUG: Current working directory: {os.getcwd()}")
    print(f"DEBUG: __file__ location: {__file__}")
    print(f"DEBUG: Month abbreviation: {month_abbr}")
    print(f"DEBUG: Month folder: {month_folder}")
    
    # Try multiple possible paths, prioritizing relative to this file
    script_dir = os.path.dirname(os.path.abspath(__file__))
    possible_paths = [
        # First, try relative to this script file (works both locally and in Docker)
        os.path.join(script_dir, "models", month_folder),
        os.path.join(script_dir, "Models", month_folder),  # Capital M version

        os.path.join(script_dir, month_folder),
        
        os.path.join("/app", "data", "data_models_api", "scoring_model", "models", month_folder),
        os.path.join("/app", "data", "data_models_api", "scoring_model", month_folder),

        os.path.join("data", "data_models_api", "scoring_model", "models", month_folder),
        os.path.join("data", "data_models_api", "scoring_model", "Models", month_folder),  # Capital M
        os.path.join("data", "data_models_api", "scoring_model", month_folder),

        os.path.join("models", month_folder),  # Original relative path
        os.path.join("Models", month_folder),  # Capital M version
        month_folder  
    ]
    
    base_path = None
    for path in possible_paths:
        print(f"DEBUG: Checking path: {path}")
        test_file = os.path.join(path, f"model_{month_folder}_xgb.pkl")
        if os.path.exists(test_file):
            print(f"DEBUG: Found models at: {path}")
            base_path = path
            break
        else:
            print(f"DEBUG: Path not found: {test_file}")
    
    if base_path is None:
        print(f"DEBUG: No valid path found. Listing directory contents:")
        print(f"DEBUG: Script directory: {script_dir}")
        print(f"DEBUG: Contents of script directory: {os.listdir(script_dir)}")
        print(f"DEBUG: Contents of current directory: {os.listdir('.')}")
        if os.path.exists("data"):
            print(f"DEBUG: Contents of data/: {os.listdir('data')}")
        raise FileNotFoundError(f"Could not find models directory for month: {month_folder}")

    try:
        with open(os.path.join(base_path, f"model_{month_folder}_xgb.pkl"), "rb") as f:
            xgb_model = pickle.load(f)
        with open(os.path.join(base_path, f"model_{month_folder}_lgb.pkl"), "rb") as f:
            lgb_model = pickle.load(f)
        with open(os.path.join(base_path, f"scoring_weights_{month_folder}.json"), "r") as f:
            final_weights = json.load(f)
        with open(os.path.join(base_path, f"scaler_{month_folder}.json"), "r") as f:
            scaler = json.load(f)


        hotness_df = pd.read_csv(
        os.path.join(base_path, f"hotness_table_{month_folder}.csv")
        ).rename(columns=lambda x: x.strip())
        print(" Hotness columns:", hotness_df.columns.tolist())  # ← add this line

        duration_df = pd.read_csv(
        os.path.join(base_path, f"duration_variability_{month_folder}.csv")
        ).rename(columns=lambda x: x.strip())
        
        # Try multiple paths for expected_columns
        possible_expected_paths = [
            # In models directory
            os.path.join(script_dir, "models", "expected_columns"),
            # As sibling to month folder
            os.path.join(os.path.dirname(base_path), "expected_columns"),
            # In script directory directly
            os.path.join(script_dir, "expected_columns"),
            # Absolute Docker paths
            os.path.join("/app", "data", "data_models_api", "scoring_model", "models", "expected_columns"),
            os.path.join("/app", "data", "data_models_api", "scoring_model", "expected_columns"),
            # From working directory
            os.path.join("data", "data_models_api", "scoring_model", "models", "expected_columns"),
            os.path.join("data", "data_models_api", "scoring_model", "expected_columns"),
            # Legacy paths
            os.path.join("models", "expected_columns"),
            "expected_columns"
        ]
        
        expected_columns_path = None
        for path in possible_expected_paths:
            print(f"DEBUG: Checking expected_columns path: {path}")
            if os.path.exists(os.path.join(path, "expected_columns_xgb.pkl")):
                expected_columns_path = path
                print(f"DEBUG: Found expected_columns at: {path}")
                break
        
        if expected_columns_path is None:
            raise FileNotFoundError("Could not find expected_columns directory")
        
        expected_columns_xgb = joblib.load(os.path.join(expected_columns_path, "expected_columns_xgb.pkl"))
        expected_columns_lgb = joblib.load(os.path.join(expected_columns_path, "expected_columns_lgb.pkl"))

        return {
            "xgb_model": xgb_model,
            "lgb_model": lgb_model,
            "final_weights": final_weights,
            "scaler": scaler,
            "hotness_df": hotness_df,
            "duration_df": duration_df,
            "expected_columns": {
                "xgb": expected_columns_xgb,
                "lgb": expected_columns_lgb
            },
            "borough_map": borough_map
        }
    except FileNotFoundError as e:
        print(f" File not found in '{base_path}': {e}")
        raise


# Feature generation logic (from raw input)
def prepare_input(pickup_zone, dropoff_zone, pickup_datetime_str, model_type, refs):
    try:
        pickup_datetime = datetime.strptime(pickup_datetime_str, "%m/%d/%Y %I:%M:%S %p")
    except ValueError:
        return None, "Invalid datetime format. Expected: MM/DD/YYYY HH:MM:SS AM/PM"

    df = pd.DataFrame([{
        "pickup_zone": pickup_zone,
        "dropoff_zone": dropoff_zone,
        "pickup_datetime": pickup_datetime
    }])

    # Extract time-based features
    df["pickup_hour"] = df["pickup_datetime"].dt.hour
    df["pickup_day_of_week"] = df["pickup_datetime"].dt.dayofweek
    df["dropoff_day_of_week"] = df["pickup_day_of_week"]
    df["is_weekend"] = df["pickup_day_of_week"].isin([5, 6]).astype(int)
    df["sin_hour"] = np.sin(2 * np.pi * df["pickup_hour"] / 24)
    df["cos_hour"] = np.cos(2 * np.pi * df["pickup_hour"] / 24)
    df["dropoff_hour"] = df["pickup_hour"]

    # Merge dropoff hotness (with column rename fix)
    hotness_df = refs["hotness_df"].rename(columns={
    "pickup_day_of_week": "hotness_day_of_week",
    "pickup_hour": "hotness_hour"
    })
    df = df.merge(
        hotness_df,
        how="left",
        left_on=["dropoff_zone", "dropoff_day_of_week", "dropoff_hour"],
        right_on=["dropoff_zone", "hotness_day_of_week", "hotness_hour"]
    )
    df["dropoff_zone_hotness"] = df["dropoff_zone_hotness"].fillna(0)

    # Merge trip duration variability (no rename needed)
    df = df.merge(
        refs["duration_df"],
        how="left",
        on=["pickup_zone", "dropoff_zone", "pickup_day_of_week", "pickup_hour"]
    )
    df["trip_duration_variability"] = df["trip_duration_variability"].fillna(0)

    # Map boroughs
    borough_map = refs["borough_map"]
    df["pickup_borough"] = df["pickup_zone"].map(borough_map).fillna("Unknown")
    df["dropoff_borough"] = df["dropoff_zone"].map(borough_map).fillna("Unknown")

    # Flag airport trips
    df["is_airport_trip"] = (
        df["pickup_zone"].str.contains("Airport") |
        df["dropoff_zone"].str.contains("Airport")
    ).astype(int)

    # One-hot encode
    cat_cols = ["is_airport_trip", "pickup_borough", "dropoff_borough"]
    df_encoded = pd.get_dummies(df[cat_cols], drop_first=True)

    # Combine numeric + encoded
    numeric_cols = ["dropoff_zone_hotness", "trip_duration_variability", "sin_hour", "cos_hour", "is_weekend"]
    full_df = pd.concat([df[numeric_cols], df_encoded], axis=1)

    # Align columns
    expected_cols = refs["expected_columns"][model_type]
    for col in expected_cols:
        if col not in full_df.columns:
            full_df[col] = 0
    full_df = full_df[expected_cols]

    return full_df, None

# Final prediction + normalization
def score_input(input_df, model, scaler):
    raw_score = model.predict(input_df)[0]

    # Use stored percentile-based range
    p_min = scaler["min"]
    p_max = scaler["max"]

    clipped = np.clip(raw_score, p_min, p_max)
    norm_score = (clipped - p_min) / (p_max - p_min)
    norm_score = np.clip(norm_score, 0, 1)

    return raw_score, norm_score


def score_trip(pickup_zone, dropoff_zone, pickup_datetime, model, weights, scaler, hotness_table, duration_table, borough_map, expected_columns):
    refs = {
        "hotness_df": hotness_table,
        "duration_df": duration_table,
        "final_weights": weights,
        "scaler": scaler,
        "borough_map": borough_map,
        "expected_columns": expected_columns
    }

    model_type = "xgb" if "XGB" in type(model).__name__ else "lgb"

    input_df, err = prepare_input(pickup_zone, dropoff_zone, pickup_datetime, model_type, refs)
    if err:
        print("Error during feature prep:", err)
        return None
    
     #  Add  DEBUG block
    print("\n DEBUG INFO")
    print("Pickup zone:", pickup_zone)
    print("Dropoff zone:", dropoff_zone)
    print("Pickup datetime:", pickup_datetime)
    print("Prepared input row:")
    print(input_df.head(1).to_dict(orient='records'))
    if "dropoff_zone_hotness" in input_df.columns:
        print("Hotness:", input_df['dropoff_zone_hotness'].iloc[0])
    if "trip_duration_variability" in input_df.columns:
        print("Duration variability:", input_df['trip_duration_variability'].iloc[0])
    #  End DEBUG block
    
    try:
        predicted_score, final_score = score_input(input_df, model, scaler)
        print(f"Scaler min/max: {scaler['min']} – {scaler['max']}")
        return {
            "predicted_score": round(float(predicted_score), 2),
            "final_score": round(float(final_score), 4)
        }
    except Exception as e:
        print("Scoring failed:", e)
        return None



