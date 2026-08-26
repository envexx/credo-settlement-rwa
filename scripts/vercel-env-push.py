"""Push required env vars to Vercel (production) without echoing secret values.

Reads .env.local locally, uploads via `vercel env add <KEY> production` stdin.
Skips keys that already exist. Never prints values.
"""
import os
import subprocess

REQUIRED = {
    "SEPOLIA_RPC_URL": True,
    "SESSION_SECRET": True,
    "SETTLE_RWA_ADDRESS": False,
    "PAYMENT_VERIFIER_USC_ADDRESS": False,
    "TEST_RWA_ADDRESS": False,
    "CREDITCOIN_RPC_FALLBACK_URL": False,
}

# Parse .env.local
values: dict[str, str] = {}
with open(".env.local", encoding="utf-8") as f:
    for line in f:
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        values[k.strip()] = v.strip().strip('"').strip("'")

existing = subprocess.run(
    ["vercel", "env", "ls", "production"],
    capture_output=True, text=True, shell=True,
).stdout

for key, secret in REQUIRED.items():
    val = values.get(key)
    if not val:
        print(f"SKIP {key} (not in .env.local)")
        continue
    if key in existing:
        print(f"EXISTS {key}")
        continue
    r = subprocess.run(
        ["vercel", "env", "add", key, "production"],
        input=val.encode(), capture_output=True, shell=True,
    )
    ok = r.returncode == 0
    print(("SET " if ok else "FAIL ") + key + ("" if ok else " :: " + r.stderr.decode()[:120]))

print("done")
