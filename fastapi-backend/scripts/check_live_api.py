import requests
import json

def test_live_api():
    url = "http://127.0.0.1:8000/api/v1/platform/stores/d7402757-8b2f-4635-aefe-e1a2fcff67db"
    print(f"--- Fetching: {url} ---")
    try:
        # Note: This might fail if auth is required, but platform/stores usually requires auth.
        # However, I can check if it returns 401/403 or the actual data.
        # Since I am running locally, maybe I can bypass or just see the structure.
        resp = requests.get(url)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            print("Response Keys:", data.keys())
            if "stats" in data:
                print("Stats found:", json.dumps(data["stats"], indent=2))
            else:
                print("Stats NOT found in response!")
        else:
            print(f"Error: {resp.text}")
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    test_live_api()
