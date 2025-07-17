import unittest
import json
import sys
import os

# Add path to the Flask app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "combined_flask_app")))
from flask_app import app

class TestHotspotAPI(unittest.TestCase):

    def setUp(self):
        self.client = app.test_client()
        self.url = "/hotspots"
        self.valid_iso_query = {"time": "2025-07-11T10:00:00Z"}  # valid ISO UTC
        self.invalid_format_query = {"time": "07/11/2025 10:00:00 AM"}  # invalid

    def test_endpoint_available(self):
        response = self.client.get(self.url, query_string=self.valid_iso_query)
        self.assertNotEqual(response.status_code, 404, "Route not found")

    def test_valid_response_structure(self):
        response = self.client.get(self.url, query_string=self.valid_iso_query)
        self.assertEqual(response.status_code, 200)

        data = json.loads(response.data)
        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 0)

        for item in data:
            self.assertIn("pickup_zone", item)
            self.assertIn("location_id", item)
            self.assertIn("predicted_trip_count", item)

            self.assertIsInstance(item["pickup_zone"], str)
            self.assertIsInstance(item["location_id"], int)
            self.assertIsInstance(item["predicted_trip_count"], float)

    def test_predictions_sorted_descending(self):
        response = self.client.get(self.url, query_string=self.valid_iso_query)
        data = response.get_json()
        self.assertIsInstance(data, list)
        if data:
            predicted_values = [d["predicted_trip_count"] for d in data]
            self.assertEqual(predicted_values, sorted(predicted_values, reverse=True))

    def test_invalid_time_format_returns_400(self):
        response = self.client.get(self.url, query_string=self.invalid_format_query)
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertIn("error", data)
        self.assertIn("Invalid time format", data["error"])

if __name__ == "__main__":
    unittest.main()
