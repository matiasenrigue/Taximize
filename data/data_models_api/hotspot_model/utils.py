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
