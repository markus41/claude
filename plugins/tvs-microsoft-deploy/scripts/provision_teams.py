#!/usr/bin/env python3
"""Provision Microsoft Teams workspace for TVS Holdings Virtual Assistants."""

import sys
import time
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent / "api"))
from _core import ApiClient  # noqa: E402

TEAM_NAME = "TVS Holdings VA Workspace"
TEAM_DESCRIPTION = "Central workspace for TVS Holdings virtual assistants across all entities"

CHANNELS = [
    {"displayName": "General", "description": "General VA announcements and updates"},
    {"displayName": "TVS-Operations", "description": "TVS virtual staffing operations and task coordination"},
    {"displayName": "Consulting", "description": "Consulting entity support and engagement tracking"},
    {"displayName": "Training", "description": "VA training materials, SOPs, and onboarding resources"},
    {"displayName": "IT-Support", "description": "Technical support, access requests, and system issues"},
    {"displayName": "Social", "description": "Team social, kudos, and informal communication"},
]

VA_MEMBERS = [
    "va-lead@tvsholdings.com",
    "va-ops-01@tvsholdings.com",
    "va-ops-02@tvsholdings.com",
    "va-ops-03@tvsholdings.com",
    "va-consulting-01@tvsholdings.com",
    "va-consulting-02@tvsholdings.com",
    "va-admin-01@tvsholdings.com",
    "va-admin-02@tvsholdings.com",
    "va-media-01@tvsholdings.com",
    "va-training-01@tvsholdings.com",
    "va-it-support-01@tvsholdings.com",
]


def create_team(client: ApiClient):
    payload = {
        "template@odata.bind": "https://graph.microsoft.com/v1.0/teamsTemplates('standard')",
        "displayName": TEAM_NAME,
        "description": TEAM_DESCRIPTION,
        "visibility": "Private",
    }
    resp = client.request("POST", "/teams", json_body=payload)
    resp.raise_for_status()
    location = resp.headers.get("Location", "")
    team_id = location.split("'")[1] if "'" in location else resp.headers.get("Content-Location", "").split("/")[-1]
    print(f"Team creation initiated: {TEAM_NAME} (id: {team_id})")
    print("Waiting for team provisioning...")
    time.sleep(10)
    return team_id


def create_channel(client: ApiClient, team_id, channel):
    if channel["displayName"] == "General":
        print("  Channel: General (built-in, skipped)")
        return
    resp = client.request("POST", f"/teams/{team_id}/channels", json_body=channel)
    resp.raise_for_status()
    ch = resp.json()
    print(f"  Channel: {ch['displayName']} -> {ch['id']}")


def add_member(client: ApiClient, team_id, email):
    resp = client.request("POST", f"/teams/{team_id}/members", json_body={
        "@odata.type": "#microsoft.graph.aadUserConversationMember",
        "roles": ["owner"] if email == "va-lead@tvsholdings.com" else ["member"],
        "user@odata.bind": f"https://graph.microsoft.com/v1.0/users('{email}')",
    })
    if resp.status_code in (200, 201):
        role = "owner" if email == "va-lead@tvsholdings.com" else "member"
        print(f"  Added {role}: {email}")
    else:
        print(f"  WARNING: Could not add {email}: {resp.status_code} {resp.text}", file=sys.stderr)


def main():
    client = ApiClient("https://graph.microsoft.com/v1.0", token_env="GRAPH_TOKEN")

    print("=== Creating Teams Workspace ===")
    team_id = create_team(client)

    print("\n=== Creating Channels ===")
    for channel in CHANNELS:
        create_channel(client, team_id, channel)

    print("\n=== Adding VA Members ===")
    for email in VA_MEMBERS:
        add_member(client, team_id, email)

    print(f"\nDone. Team ID: {team_id}")


if __name__ == "__main__":
    main()
