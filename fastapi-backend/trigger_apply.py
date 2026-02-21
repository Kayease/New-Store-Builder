import requests
import json

url = "http://localhost:8000/api/v1/platform/themes/apply"
payload = {
    "store_slug": "my-crust",
    "theme_slug": "nexus-mall"
}
headers = {
    "Content-Type": "application/json"
}

try:
    response = requests.post(url, data=json.dumps(payload), headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
