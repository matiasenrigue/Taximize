import os
import pandas as pd
from datetime import datetime
from feature_engineering import build_feature_row, load_poi_dict

# Get path to current file (i.e. hotspot_model/)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Load zone lookup and POI data once using absolute paths
ZONE_CSV_PATH = os.path.join(BASE_DIR, "zone_coordinates.csv")
zone_lookup_df = pd.read_csv(ZONE_CSV_PATH)
zone_name_to_id = dict(zip(zone_lookup_df["zone"], zone_lookup_df["OBJECTID"]))

POI_CSV_PATH = os.path.join(BASE_DIR, "zone_stats_with_all_densities.csv")
poi_dict = load_poi_dict(POI_CSV_PATH)

LAG_CSV_PATH = os.path.join(BASE_DIR, "historical_lags.csv")

def get_multiple_proxy_lags(pickup_time, lag_hours_list=[1, 2], lookup_path=LAG_CSV_PATH):
    """
    Returns multiple proxy lag features using historical zone-level trip counts.

    Args:
        pickup_time (datetime): Target prediction datetime.
        lag_hours_list (list): List of lag hours to fetch (e.g., [1, 2]).
        lookup_path (str): Path to historical lag CSV.

    Returns:
        dict: Dictionary with keys:
            - "trip_count_1h_ago"
            - "trip_count_2h_ago"
            - "rolling_avg_2h"
          Each maps to: {pickup_zone: value}
    """
    df = pd.read_csv(lookup_path)
    df["pickup_date"] = pd.to_datetime(df["pickup_date"]).dt.date

    ref_date = pickup_time.replace(year=2023).date()

    lag_dicts = {}
    for lag in lag_hours_list:
        ref_hour = (pickup_time.hour - lag) % 24
        filtered = df[(df["pickup_date"] == ref_date) & (df["pickup_hour"] == ref_hour)]
        lag_key = f"trip_count_{lag}h_ago"
        lag_dicts[lag_key] = filtered.set_index("pickup_zone")["trip_count"].to_dict()

    # Compute rolling average over specified lags
    rolling_avg = {}
    all_zones = set().union(*[d.keys() for d in lag_dicts.values()])
    for zone in all_zones:
        values = [lag_dicts[f"trip_count_{lag}h_ago"].get(zone, 0) for lag in lag_hours_list]
        rolling_avg[zone] = sum(values) / len(values)

    lag_dicts["rolling_avg_2h"] = rolling_avg

    return lag_dicts


def generate_features_for_time(pickup_datetime):
    """
    Generates features for all zones at a given pickup_datetime.
    """
    all_rows = []
    for _, row in zone_lookup_df.iterrows():
        zone_name = row["zone"]
        zone_id = row["OBJECTID"]

        features = build_feature_row(
            pickup_zone=zone_name,
            pickup_datetime=pickup_datetime,
            poi_dict=poi_dict
        )
        features["zoneID"] = zone_id  # Ensure model gets this expected feature
        features["pickup_zone"] = zone_name
        all_rows.append(features)

    feature_df = pd.DataFrame(all_rows)
    return feature_df
