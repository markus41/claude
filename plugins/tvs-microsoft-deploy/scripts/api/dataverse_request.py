#!/usr/bin/env python3
import os

from _core import ApiClient, emit_response, parse_args, parse_json


if __name__ == "__main__":
    args = parse_args()
    dataverse_url = os.getenv("TVS_DATAVERSE_ENV_URL") or os.getenv("DATAVERSE_ENV_URL")
    if not dataverse_url:
        raise SystemExit("Set TVS_DATAVERSE_ENV_URL or DATAVERSE_ENV_URL")
    base = dataverse_url.rstrip("/") + "/api/data/v9.2"
    client = ApiClient(base, token_env="DATAVERSE_TOKEN")
    resp = client.request(args.method, args.path, params=parse_json(args.params), json_body=parse_json(args.body))
    emit_response(resp, args.entity)
