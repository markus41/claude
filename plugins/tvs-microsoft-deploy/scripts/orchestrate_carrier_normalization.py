#!/usr/bin/env python3
"""Carrier normalization for A3 Archive data.

Reads carrier data from the a3_archive lakehouse via Fabric REST API,
applies fuzzy matching for deduplication, normalizes carrier names using
a canonical mapping, and writes results back.

Required env vars:
    FABRIC_TOKEN      - Bearer token for Fabric REST API
    A3_ARCHIVE_WS_ID  - A3 Archive workspace ID
    A3_LAKEHOUSE_ID   - A3 Extract lakehouse ID
"""

import json
import os
import sys
from difflib import SequenceMatcher

import requests

FABRIC_API = "https://api.fabric.microsoft.com/v1"

# Canonical carrier name mapping: common variations -> normalized name
CARRIER_NAME_MAP = {
    "aetna": "Aetna",
    "aetna inc": "Aetna",
    "aetna insurance": "Aetna",
    "anthem": "Anthem Blue Cross",
    "anthem bcbs": "Anthem Blue Cross",
    "anthem blue cross blue shield": "Anthem Blue Cross",
    "blue cross": "Blue Cross Blue Shield",
    "bcbs": "Blue Cross Blue Shield",
    "blue cross blue shield": "Blue Cross Blue Shield",
    "cigna": "Cigna",
    "cigna health": "Cigna",
    "cigna healthcare": "Cigna",
    "humana": "Humana",
    "humana inc": "Humana",
    "kaiser": "Kaiser Permanente",
    "kaiser permanente": "Kaiser Permanente",
    "metlife": "MetLife",
    "met life": "MetLife",
    "metropolitan life": "MetLife",
    "united healthcare": "UnitedHealthcare",
    "unitedhealthcare": "UnitedHealthcare",
    "uhc": "UnitedHealthcare",
    "united health": "UnitedHealthcare",
    "wellcare": "WellCare",
    "well care": "WellCare",
    "molina": "Molina Healthcare",
    "molina healthcare": "Molina Healthcare",
    "centene": "Centene",
    "centene corp": "Centene",
    "guardian": "Guardian Life",
    "guardian life": "Guardian Life",
    "mutual of omaha": "Mutual of Omaha",
    "mutual omaha": "Mutual of Omaha",
}

FUZZY_THRESHOLD = 0.85


def get_headers():
    token = os.environ.get("FABRIC_TOKEN")
    if not token:
        print("ERROR: FABRIC_TOKEN is not set", file=sys.stderr)
        sys.exit(1)
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


def read_carriers(headers, ws_id, lh_id):
    resp = requests.get(
        f"{FABRIC_API}/workspaces/{ws_id}/lakehouses/{lh_id}/tables/carriers/rows",
        headers=headers,
        params={"maxRows": 10000},
    )
    if resp.status_code != 200:
        print(f"ERROR reading carriers: {resp.status_code}", file=sys.stderr)
        resp.raise_for_status()
    data = resp.json()
    rows = data.get("value", data.get("rows", []))
    print(f"Read {len(rows)} carrier records")
    return rows


def normalize_name(raw_name):
    if not raw_name:
        return raw_name
    key = raw_name.strip().lower()
    if key in CARRIER_NAME_MAP:
        return CARRIER_NAME_MAP[key]

    best_match = None
    best_score = 0.0
    for variant, canonical in CARRIER_NAME_MAP.items():
        score = SequenceMatcher(None, key, variant).ratio()
        if score > best_score:
            best_score = score
            best_match = canonical

    if best_score >= FUZZY_THRESHOLD:
        return best_match
    return raw_name.strip().title()


def deduplicate_carriers(carriers, name_field="carrier_name"):
    seen = {}
    deduped = []
    duplicates = 0

    for carrier in carriers:
        normalized = normalize_name(carrier.get(name_field, ""))
        carrier_id = carrier.get("id", carrier.get("carrier_id", ""))

        if normalized.lower() in seen:
            duplicates += 1
            existing = seen[normalized.lower()]
            existing.setdefault("merged_ids", []).append(carrier_id)
        else:
            carrier[name_field] = normalized
            carrier["normalized"] = True
            seen[normalized.lower()] = carrier
            deduped.append(carrier)

    print(f"Deduplicated: {len(carriers)} -> {len(deduped)} ({duplicates} duplicates merged)")
    return deduped


def write_results(headers, ws_id, lh_id, carriers):
    resp = requests.put(
        f"{FABRIC_API}/workspaces/{ws_id}/lakehouses/{lh_id}/tables/carriers_normalized/rows",
        headers=headers,
        json={"rows": carriers},
    )
    if resp.status_code in (200, 201, 204):
        print(f"Wrote {len(carriers)} normalized carrier records")
    else:
        print(f"ERROR writing results: {resp.status_code} {resp.text}", file=sys.stderr)


def main():
    ws_id = os.environ.get("A3_ARCHIVE_WS_ID")
    lh_id = os.environ.get("A3_LAKEHOUSE_ID")
    if not ws_id or not lh_id:
        print("ERROR: A3_ARCHIVE_WS_ID and A3_LAKEHOUSE_ID must be set", file=sys.stderr)
        sys.exit(1)

    headers = get_headers()

    print("=== Carrier Normalization Pipeline ===")
    print("\n1. Reading carrier data from a3_archive...")
    carriers = read_carriers(headers, ws_id, lh_id)

    if not carriers:
        print("No carrier records found. Exiting.")
        sys.exit(0)

    print("\n2. Normalizing and deduplicating...")
    normalized = deduplicate_carriers(carriers)

    name_counts = {}
    for c in normalized:
        name = c.get("carrier_name", "Unknown")
        name_counts[name] = name_counts.get(name, 0) + 1

    print(f"\n3. Normalized carrier distribution (top 15):")
    for name, count in sorted(name_counts.items(), key=lambda x: -x[1])[:15]:
        print(f"    {name}: {count}")

    print("\n4. Writing normalized results...")
    write_results(headers, ws_id, lh_id, normalized)

    print(f"\n=== Complete: {len(normalized)} carriers normalized ===")


if __name__ == "__main__":
    main()
