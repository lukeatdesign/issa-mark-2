"""
Seed 10 mock user accounts into Supabase.

Run after applying the Supabase migrations in `supabase/migrations/`,
including `002_mock_auth_tables.sql`.

Then run:
    cd backend
    python seed_users.py
"""

import os
import requests
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash

load_dotenv(override=True)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates",
}

accounts = [
    {"username": f"test{i:02d}", "password": f"password{i:02d}"}
    for i in range(1, 11)
]

users = [
    {
        "username": a["username"],
        "password_hash": generate_password_hash(a["password"]),
    }
    for a in accounts
]

resp = requests.post(
    f"{SUPABASE_URL}/rest/v1/mock_users",
    headers=headers,
    json=users,
)

if resp.ok:
    print(f"Seeded {len(users)} users successfully.")
    for a in accounts:
        print(f"  {a['username']} / {a['password']}")
else:
    print(f"Error {resp.status_code}: {resp.text}")
