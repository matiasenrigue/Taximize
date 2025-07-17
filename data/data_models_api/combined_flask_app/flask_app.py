from flask import Flask, request, jsonify
import pandas as pd
import joblib
import numpy as np
from datetime import datetime
import os
import sys
import traceback
from pytz import timezone
import pytz

# ==== trip scoring imports ====
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "scoring_model")))
from scoring_utils import load_reference_files, score_trip

# ==== hotspot imports ====
CURRENT_DIR = os.path.dirname(__file__)
HOTSPOT_UTILS_PATH = os.path.abspath(os.path.join(CURRENT_DIR, "..", "hotspot_model"))
sys.path.insert(0, HOTSPOT_UTILS_PATH)
from utils import generate_features_for_time, zone_name_to_id
import feature_engineering

app = Flask(__name__)
loaded_resources = {}

# -----------------------------
# SHARED HELPERS
# -----------------------------
def extract_month_from_datetime(dt_string):
    try:
        dt = datetime.strptime(dt_string, "%m/%d/%Y %I:%M:%S %p")
        return dt.strftime('%b').lower()  # e.g. "jul"
    except Exception:
        return None

def get_resources_for_month(month_str):
    if month_str not in loaded_resources:
        loaded_resources[month_str] = load_reference_files(month_str)
    return loaded_resources[month_str]

# -----------------------------
# SCORING ENDPOINTS
# -----------------------------
@app.route("/score_xgb", methods=["POST"])
def score_xgb():
    data = request.json
    month = extract_month_from_datetime(data.get("pickup_datetime", ""))
    if not month:
        return jsonify({"error": "Invalid pickup_datetime format"}), 400
    try:
        resources = get_resources_for_month(month)
        result = score_trip(
            pickup_zone=data["pickup_zone"],
            dropoff_zone=data["dropoff_zone"],
            pickup_datetime=data["pickup_datetime"],
            model=resources["xgb_model"],
            weights=resources["final_weights"],
            scaler=resources["scaler"],
            hotness_table=resources["hotness_df"],
            duration_table=resources["duration_df"],
            borough_map=resources["borough_map"],
            expected_columns=resources["expected_columns"]
        )

        #debugging output
        print("DEBUG input to score_trip:", data)
        print("Returned result:", result)

        if result:
            return jsonify(result), 200
        else:
            return jsonify({"error": "Could not score trip"}), 400

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/score_lgbm", methods=["POST"])
def score_lgbm():
    data = request.json
    month = extract_month_from_datetime(data.get("pickup_datetime", ""))
    if not month:
        return jsonify({"error": "Invalid pickup_datetime format"}), 400
    try:
        resources = get_resources_for_month(month)
        result = score_trip(
            pickup_zone=data["pickup_zone"],
            dropoff_zone=data["dropoff_zone"],
            pickup_datetime=data["pickup_datetime"],
            model=resources["lgb_model"],
            weights=resources["final_weights"],
            scaler=resources["scaler"],
            hotness_table=resources["hotness_df"],
            duration_table=resources["duration_df"],
            borough_map=resources["borough_map"],
            expected_columns=resources["expected_columns"]
        )
        if result:
            return jsonify(result), 200
        else:
            return jsonify({"error": "Could not score trip"}), 400
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# -----------------------------
# HOTSPOT ENDPOINT
# -----------------------------
MONTH_MODEL_MAP = {
    2: "hotspot_model_1_to_2.pkl",
    3: "hotspot_model_2_to_3.pkl",
    4: "hotspot_model_3_to_4.pkl",
    5: "hotspot_model_4_to_5.pkl",
    6: "hotspot_model_5_to_6.pkl",
    7: "hotspot_model_6_to_7.pkl",
    8: "hotspot_model_7_to_8.pkl",
    9: "hotspot_model_8_to_9.pkl",
    10: "hotspot_model_9_to_10.pkl",
    11: "hotspot_model_10_to_11.pkl",
    12: "hotspot_model_11_to_12.pkl",
}

def load_model_for_month(month):
    model_file = MONTH_MODEL_MAP.get(month)
    if not model_file:
        raise ValueError(f"No model for month {month}")
    path = os.path.join(HOTSPOT_UTILS_PATH, "models", model_file)
    if not os.path.exists(path):
        raise FileNotFoundError(f"Model not found: {path}")
    return joblib.load(path)

@app.route("/hotspots", methods=["GET"])
def predict_hotspots():
    NYC = timezone("America/New_York")
    try:
        time_str = request.args.get("time")

        if time_str:
            try:
                # Accept ISO 8601 UTC format: "YYYY-MM-DDTHH:MM:SSZ"
                dt_utc = datetime.strptime(time_str, "%Y-%m-%dT%H:%M:%SZ")
                dt_utc = dt_utc.replace(tzinfo=pytz.utc)
                pickup_time = dt_utc.astimezone(NYC)
            except ValueError:
                return jsonify({
                    "error": "Invalid time format. Use ISO format: YYYY-MM-DDTHH:MM:SSZ"
                }), 400
        else:
            # Use current system time in UTC, convert to NYC
            now_utc = datetime.now(pytz.utc).replace(minute=0, second=0, microsecond=0)
            pickup_time = now_utc.astimezone(NYC)

        month = pickup_time.month

        print("DEBUG - pickup_time (NYC):", pickup_time)
        print("DEBUG - pickup_time.month:", month)
        if month == 1:
            return jsonify({"error": "January predictions not supported."}), 400

        
        model = load_model_for_month(month)
        df = generate_features_for_time(pickup_time)

        if df.empty:
            return jsonify({"error": "Feature generation failed."}), 500

        # Save pickup_zone before transformations
        if "pickup_zone" not in df.columns:
            return jsonify({"error": "Missing 'pickup_zone' column in features", "columns": df.columns.tolist()}), 500
        zone_names = df["pickup_zone"].copy()

        encoding_dir = os.path.join("models", "encoding_maps")
        if not os.path.exists(encoding_dir):
            return jsonify({"error": "Encoding dir not found."}), 500

        df = feature_engineering.apply_target_encoding(df, encoding_dir)
        df = feature_engineering.align_with_model_features(df)

        preds = np.expm1(model.predict(df))

        response = []
        for zone, pred in zip(zone_names, preds):
            zone_id = zone_name_to_id.get(zone)
            if zone_id is not None:
                response.append({
                    "pickup_zone": zone,
                    "location_id": int(zone_id),
                    "predicted_trip_count": float(pred)
                })

        response.sort(key=lambda x: x["predicted_trip_count"], reverse=True)
        return jsonify(response)

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": "Internal server error", "details": str(e)}), 500

# -----------------------------
# Health Check or Root Route
# -----------------------------
@app.route("/")
def home():
    return "Combined Trip Scoring + Hotspot Prediction API is running!"

if __name__ == "__main__":
    app.run(debug=True, port=5000)
