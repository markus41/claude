#!/usr/bin/env python3
"""Provision Microsoft Teams workspace for TVS Holdings Virtual Assistants.

Creates a team with dedicated channels and adds VA members via Graph API.

Required env vars:
    GRAPH_TOKEN - Bearer token for Microsoft Graph API with Team.Create,
                  Channel.Create, and TeamMember.ReadWrite.All permissions
"""

import os
import sys
import time

import requests

GRAPH_API = "https://graph.microsoft.com/v1.0"

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


def get_headers():
    token = os.environ.get("GRAPH_TOKEN")
    if not token:
        print("ERROR: GRAPH_TOKEN environment variable is not set", file=sys.stderr)
        sys.exit(1)
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


def create_team(headers):
    payload = {
        "template@odata.bind": "https://graph.microsoft.com/v1.0/teamsTemplates('standard')",
        "displayName": TEAM_NAME,
        "description": TEAM_DESCRIPTION,
        "visibility": "Private",
    }
    resp = requests.post(f"{GRAPH_API}/teams", headers=headers, json=payload)
    resp.raise_for_status()
    location = resp.headers.get("Location", "")
    team_id = location.split("'")[1] if "'" in location else resp.headers.get("Content-Location", "").split("/")[-1]
    print(f"Team creation initiated: {TEAM_NAME} (id: {team_id})")
    print("Waiting for team provisioning...")
    time.sleep(10)
    return team_id


def create_channel(headers, team_id, channel):
    if channel["displayName"] == "General":
        print(f"  Channel: General (built-in, skipped)")
        return
    resp = requests.post(f"{GRAPH_API}/teams/{team_id}/channels", headers=headers, json=channel)
    resp.raise_for_status()
    ch = resp.json()
    print(f"  Channel: {ch['displayName']} -> {ch['id']}")


def add_member(headers, team_id, email):
    resp = requests.post(f"{GRAPH_API}/teams/{team_id}/members", headers=headers, json={
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
    headers = get_headers()

    print("=== Creating Teams Workspace ===")
    team_id = create_team(headers)

    print("\n=== Creating Channels ===")
    for channel in CHANNELS:
        create_channel(headers, team_id, channel)

    print("\n=== Adding VA Members ===")
    for email in VA_MEMBERS:
        add_member(headers, team_id, email)

    print(f"\nDone. Team ID: {team_id}")


if __name__ == "__main__":
    main()
