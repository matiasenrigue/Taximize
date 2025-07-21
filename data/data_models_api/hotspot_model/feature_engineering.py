from datetime import datetime
import holidays
import pandas as pd
import joblib
import os
import numpy as np

# Load allowed features from training time
try:
    allowed_features = joblib.load("model_features.pkl")
except FileNotFoundError:
    allowed_features = None

us_holidays = holidays.US(years=[2023, 2024, 2025])

def is_us_holiday(dt):
    return dt.date() in us_holidays

def get_time_of_day(hour):
    if 0 <= hour < 5:
        return 'Early Morning'
    elif 5 <= hour < 10:
        return 'Morning Rush'
    elif 10 <= hour < 15:
        return 'Midday'
    elif 15 <= hour < 19:
        return 'Evening Rush'
    else:
        return 'Night'

def load_poi_dict(csv_path):
    poi_df = pd.read_csv(csv_path)
    poi_df = poi_df.drop_duplicates(subset="zone", keep="first")
    numeric_cols = poi_df.select_dtypes(include=['number']).columns
    poi_df_filtered = poi_df[['zone'] + list(numeric_cols)]
    return poi_df_filtered.set_index("zone").T.to_dict()

def build_feature_row(pickup_zone, pickup_datetime, poi_dict=None):
    pickup_month = pickup_datetime.month  
    is_holiday = is_us_holiday(pickup_datetime)
    pickup_hour = pickup_datetime.hour
    pickup_day_of_week = pickup_datetime.weekday()
    is_weekend = int(pickup_day_of_week >= 5)
    time_of_day = get_time_of_day(pickup_hour)

    # Raw categorical features for target encoding
    raw_cats = {
        "pickup_zone": pickup_zone,
        "day_time_interaction": f"{pickup_day_of_week}_{time_of_day}",
        "holiday_time_interaction": f"{int(is_holiday)}_{time_of_day}",
        "zone_hour_interaction": f"{pickup_zone}_{pickup_hour}",
        "zone_isweekend_interaction": f"{pickup_zone}_{is_weekend}",
        "hour_isweekend_interaction": f"{pickup_hour}_{is_weekend}",
        "zone_time_isweekend_interaction": f"{pickup_zone}_{time_of_day}_{is_weekend}",
        "zone_hour_isweekend_interaction": f"{pickup_zone}_{pickup_hour}_{is_weekend}",
        "zone_hour_holiday_interaction": f"{pickup_zone}_{pickup_hour}_{int(is_holiday)}"
    }

    # Base numeric features
    row = {
        "pickup_month": float(pickup_month),
        "pickup_hour": float(pickup_hour),
        "pickup_day_of_week": float(pickup_day_of_week),
        "is_weekend": float(is_weekend),
        "time_of_day_encoded": float({
            'Early Morning': 0,
            'Morning Rush': 1,
            'Midday': 2,
            'Evening Rush': 3,
            'Night': 4
        }.get(time_of_day, -1))
    }

    # Add POI features
    if poi_dict and pickup_zone in poi_dict:
        pois = poi_dict[pickup_zone]
        for poi_type, density in pois.items():
            row[f"{poi_type}"] = density
            row[f"{poi_type}_x_isweekend"] = density * is_weekend
            row[f"{poi_type}_x_{time_of_day.replace(' ', '_')}"] = density
        if "nightlife_density_per_sq_mile" in pois and "hotel_density_per_sq_mile" in pois:
            row["nightlife_x_hotels"] = pois["nightlife_density_per_sq_mile"] * pois["hotel_density_per_sq_mile"]
        if "restaurant_density_per_sq_mile" in pois and "tourism_density_per_sq_mile" in pois:
            row["restaurants_x_tourism"] = pois["restaurant_density_per_sq_mile"] * pois["tourism_density_per_sq_mile"]

    # Add raw categoricals for later encoding
    row.update(raw_cats)

    return row

def generate_features_for_time(pickup_datetime, poi_dict=None, zone_list_path="zone_list.pkl"):
    # Load list of zones used during training
    with open(zone_list_path, "rb") as f:
        zones = pickle.load(f)

    rows = []
    for zone in zones:
        row = build_feature_row(zone, pickup_datetime, poi_dict)
        row["zoneID"] = zone
        rows.append(row)

    df = pd.DataFrame(rows)

    if allowed_features:
        # Keep allowed features + raw categoricals for encoding
        df = df[[col for col in df.columns if col in allowed_features or col in [
            "pickup_zone", "day_time_interaction", "holiday_time_interaction",
            "zone_hour_interaction", "zone_isweekend_interaction", "hour_isweekend_interaction",
            "zone_time_isweekend_interaction", "zone_hour_isweekend_interaction",
            "zone_hour_holiday_interaction", "zoneID"
        ]]]

    return df

def apply_target_encoding(feature_df, encoding_dir="encoding_maps"):
    for filename in os.listdir(encoding_dir):
        if filename.endswith("_target_encoding.pkl"):
            col_name = filename.replace("_target_encoding.pkl", "")
            mapping = joblib.load(os.path.join(encoding_dir, filename))
            encoded_col = f"{col_name}_target_encoded"
            feature_df[encoded_col] = feature_df[col_name].map(mapping)
            feature_df[encoded_col] = feature_df[encoded_col].fillna(np.mean(list(mapping.values())))

    # Drop the raw object categorical features
    raw_cols = [
        "pickup_zone", "day_time_interaction", "holiday_time_interaction",
        "zone_hour_interaction", "zone_isweekend_interaction", "hour_isweekend_interaction",
        "zone_time_isweekend_interaction", "zone_hour_isweekend_interaction",
        "zone_hour_holiday_interaction"
    ]
    feature_df = feature_df.drop(columns=[col for col in raw_cols if col in feature_df.columns], errors="ignore")
    
    # Ensure feature_df has only the allowed features
    if allowed_features:
        # We include 'zoneID' if needed for response formatting
        allowed_cols = allowed_features + ["zoneID"]
        feature_df = feature_df[[col for col in allowed_cols if col in feature_df.columns]]

    return feature_df

def align_with_model_features(feature_df, feature_list_path=None):
    if feature_list_path is None:
        feature_list_path = os.path.join(os.path.dirname(__file__), "model_features.pkl")

    try:
        allowed_features = joblib.load(feature_list_path)
    except Exception as e:
        raise ValueError(f"Could not load model_features.pkl: {e}")

    for col in allowed_features:
        if col not in feature_df.columns:
            feature_df[col] = 0.0

    return feature_df[allowed_features]

