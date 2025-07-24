import requests

url = "http://127.0.0.1:5050/score_xgb"

test_cases = [
    {
        "pickup_zone": "Midtown Center",
        "dropoff_zone": "SoHo",
        "pickup_datetime": "07/24/2025 3:00:00 PM"
    },
    {
        "pickup_zone": "Upper West Side South",
        "dropoff_zone": "Midtown East",
        "pickup_datetime": "07/22/2025 8:30:00 AM"
    },
    {
        "pickup_zone": "Times Sq/Theatre District",
        "dropoff_zone": "Central Park",
        "pickup_datetime": "07/20/2025 2:00:00 PM"
    },
    {
        "pickup_zone": "JFK Airport",
        "dropoff_zone": "Upper East Side South",
        "pickup_datetime": "07/25/2025 9:00:00 AM"
    }
]

for i, payload in enumerate(test_cases, 1):
    print(f"\n--- Test Case {i} ---")
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        print("Input:", payload)
        print("Response:", response.json())
    except requests.exceptions.RequestException as e:
        print("Request failed:", e)