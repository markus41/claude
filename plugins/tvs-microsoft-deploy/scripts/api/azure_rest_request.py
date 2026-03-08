#!/usr/bin/env python3
from _core import ApiClient, emit_response, parse_args, parse_json

BASE_URL = "https://management.azure.com"


if __name__ == "__main__":
    args = parse_args()
    client = ApiClient(BASE_URL, token_env="ARM_TOKEN")
    resp = client.request(args.method, args.path, params=parse_json(args.params), json_body=parse_json(args.body))
    emit_response(resp, args.entity)
