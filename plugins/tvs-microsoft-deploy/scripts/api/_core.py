#!/usr/bin/env python3
"""Shared auth/token/cache/retry helpers for TVS API request scripts."""

from __future__ import annotations

import argparse
import json
import os
import time
from pathlib import Path
from typing import Any

import requests

CACHE_PATH = Path(__file__).resolve().parent / ".token_cache.json"


class ApiClient:
    def __init__(self, base_url: str, token_env: str, timeout: int = 30):
        self.base_url = base_url.rstrip("/")
        self.token_env = token_env
        self.timeout = timeout

    def _read_cache(self) -> dict[str, Any]:
        if not CACHE_PATH.exists():
            return {}
        return json.loads(CACHE_PATH.read_text())

    def _write_cache(self, payload: dict[str, Any]) -> None:
        CACHE_PATH.write_text(json.dumps(payload, indent=2))

    def _resolve_token(self) -> str:
        token = os.getenv(self.token_env)
        if token:
            return token

        cache = self._read_cache()
        cached = cache.get(self.token_env)
        now = int(time.time())
        if cached and int(cached.get("expires_at", 0)) > now:
            return str(cached["access_token"])

        raise SystemExit(f"Missing token. Set {self.token_env}.")

    def cache_token(self, access_token: str, expires_in: int = 3000) -> None:
        cache = self._read_cache()
        cache[self.token_env] = {
            "access_token": access_token,
            "expires_at": int(time.time()) + expires_in,
        }
        self._write_cache(cache)

    def request(self, method: str, path: str, *, params: dict[str, Any] | None = None, json_body: Any = None, retries: int = 3) -> requests.Response:
        token = self._resolve_token()
        url = f"{self.base_url}/{path.lstrip('/')}"
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

        backoff = 1.0
        for attempt in range(1, retries + 1):
            response = requests.request(
                method=method.upper(),
                url=url,
                headers=headers,
                params=params,
                json=json_body,
                timeout=self.timeout,
            )
            if response.status_code < 500 and response.status_code != 429:
                return response
            if attempt == retries:
                return response
            time.sleep(backoff)
            backoff *= 2
        return response


def parse_args(default_method: str = "GET") -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("path", help="Relative API path, e.g. /me")
    parser.add_argument("--method", default=default_method)
    parser.add_argument("--params", help="JSON object of query params")
    parser.add_argument("--body", help="JSON body")
    parser.add_argument("--entity", default=os.getenv("TVS_ENTITY", "tvs"), help="Entity scope tag (tvs|consulting|media)")
    return parser.parse_args()


def parse_json(value: str | None) -> Any:
    if not value:
        return None
    return json.loads(value)


def emit_response(response: requests.Response, entity: str) -> None:
    print(f"# entity_scope={entity}")
    print(f"# status={response.status_code}")
    text = response.text.strip()
    if not text:
        return
    try:
        print(json.dumps(response.json(), indent=2))
    except Exception:
        print(text)

