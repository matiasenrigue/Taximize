import requests

url = "http://127.0.0.1:5000/score_xgb"

payload = {
  "pickup_zone": "Penn Station/Madison Sq West",
  "dropoff_zone": "East Village",
  "pickup_datetime": "07/19/2025 11:00:00 AM"
}


try:
    response = requests.post(url, json=payload)
    response.raise_for_status()
    print("Status Code:", response.status_code)
    print("Response JSON:", response.json())
except requests.exceptions.RequestException as e:
    print("Request failed:", e)
    print("Response:", response.text if response else "No response")




