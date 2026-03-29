import requests, os, json, sys

with open("backend/supabase.env", "r") as f:
    for line in f:
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, val = line.split("=", 1)
        os.environ[key.strip()] = val.strip().strip('"').strip("'")

url = os.environ.get("SUPABASE_URL", "").rstrip("/")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
headers = {"apikey": key, "Authorization": f"Bearer {key}"}

# Profiles
r = requests.get(f"{url}/rest/v1/profiles", params={"select": "*"}, headers=headers, timeout=10)
profiles = r.json()
print("PROFILES:")
for p in profiles:
    print(json.dumps(p, indent=2))

# Auth users
auth_r = requests.get(f"{url}/auth/v1/admin/users", headers={**headers, "Content-Type": "application/json"}, timeout=10)
if auth_r.status_code == 200:
    users = auth_r.json().get("users", [])
    print("\nAUTH USERS:")
    for u in users:
        print(f"  {u.get('email')} => {u.get('id')}")

# Pending
r3 = requests.get(f"{url}/rest/v1/interaction", params={"select": "*", "status": "eq.pending"}, headers=headers, timeout=10)
print(f"\nPENDING INTERACTIONS: {len(r3.json())}")
for i in r3.json():
    print(f"  id={i['id']} {i['med1_type']}#{i['med1_id']} <-> {i['med2_type']}#{i['med2_id']} severity={i['severity']}")
