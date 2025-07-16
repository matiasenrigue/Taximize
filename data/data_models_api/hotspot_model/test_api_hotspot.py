import unittest
import json
from app import app  # Make sure `app.py` defines `app = Flask(__name__)`

class TestHotspotAPI(unittest.TestCase):

    def setUp(self):
        self.client = app.test_client()
        self.url = "/api/hotspots/"
        self.valid_query = {"time": "07/11/2025 10:00:00 AM"}

    def test_endpoint_available(self):
        response = self.client.get(self.url, query_string=self.valid_query)
        self.assertNotEqual(response.status_code, 404, "Route not found")

    def test_valid_response_structure(self):
        response = self.client.get(self.url, query_string=self.valid_query)
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
        response = self.client.get(self.url, query_string=self.valid_query)
        data = response.get_json()
        predicted_values = [d["predicted_trip_count"] for d in data]
        self.assertEqual(predicted_values, sorted(predicted_values, reverse=True))

if __name__ == "__main__":
    unittest.main()
