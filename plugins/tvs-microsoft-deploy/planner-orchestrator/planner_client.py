"""Planner API adapter with optional dry-run mode.

Provides helper methods for plans, buckets, tasks, task details, checklist,
labels, and assignments for workflow orchestration.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any, Dict, Mapping, MutableMapping, Optional
from urllib import error, request


class PlannerError(RuntimeError):
    """Planner adapter error."""


@dataclass
class PlannerClient:
    token: str
    base_url: str = "https://graph.microsoft.com/v1.0/planner"
    timeout_s: int = 30
    dry_run: bool = False

    def _headers(self, etag: Optional[str] = None) -> Dict[str, str]:
        headers = {"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"}
        if etag:
            headers["If-Match"] = etag
        return headers

    def _request(
        self,
        method: str,
        path: str,
        *,
        json_payload: Optional[Mapping[str, Any]] = None,
        etag: Optional[str] = None,
    ) -> MutableMapping[str, Any]:
        if self.dry_run and method.upper() != "GET":
            return {"dryRun": True, "method": method.upper(), "path": path, "payload": dict(json_payload or {})}

        url = f"{self.base_url}{path}"
        body = None
        if json_payload is not None:
            body = json.dumps(dict(json_payload)).encode("utf-8")

        req = request.Request(url=url, method=method.upper(), data=body, headers=self._headers(etag=etag))
        try:
            with request.urlopen(req, timeout=self.timeout_s) as resp:
                raw = resp.read().decode("utf-8")
        except error.HTTPError as exc:
            detail = exc.read().decode("utf-8")
            raise PlannerError(f"Planner API error {exc.code}: {detail}") from exc
        except error.URLError as exc:
            raise PlannerError(f"Planner API connection error: {exc}") from exc

        if raw:
            return json.loads(raw)
        return {}

    def create_plan(self, owner_group_id: str, title: str) -> MutableMapping[str, Any]:
        return self._request("POST", "/plans", json_payload={"owner": owner_group_id, "title": title})

    def get_plan(self, plan_id: str) -> MutableMapping[str, Any]:
        return self._request("GET", f"/plans/{plan_id}")

    def create_bucket(self, plan_id: str, name: str, order_hint: str) -> MutableMapping[str, Any]:
        return self._request("POST", "/buckets", json_payload={"name": name, "planId": plan_id, "orderHint": order_hint})

    def list_buckets(self, plan_id: str) -> MutableMapping[str, Any]:
        return self._request("GET", f"/plans/{plan_id}/buckets")

    def list_tasks(self, plan_id: str) -> MutableMapping[str, Any]:
        return self._request("GET", f"/plans/{plan_id}/tasks")

    def create_task(
        self,
        plan_id: str,
        bucket_id: str,
        title: str,
        *,
        assignments: Optional[Mapping[str, Any]] = None,
        labels: Optional[Mapping[str, bool]] = None,
        due_date_time: Optional[str] = None,
    ) -> MutableMapping[str, Any]:
        body: Dict[str, Any] = {"planId": plan_id, "bucketId": bucket_id, "title": title}
        if assignments:
            body["assignments"] = dict(assignments)
        if labels:
            body["appliedCategories"] = dict(labels)
        if due_date_time:
            body["dueDateTime"] = due_date_time
        return self._request("POST", "/tasks", json_payload=body)

    def get_task(self, task_id: str) -> MutableMapping[str, Any]:
        return self._request("GET", f"/tasks/{task_id}")

    def get_task_details(self, task_id: str) -> MutableMapping[str, Any]:
        return self._request("GET", f"/tasks/{task_id}/details")

    def update_task(self, task_id: str, etag: str, **fields: Any) -> MutableMapping[str, Any]:
        return self._request("PATCH", f"/tasks/{task_id}", json_payload=fields, etag=etag)

    def update_task_details(
        self,
        task_id: str,
        etag: str,
        *,
        checklist: Optional[Mapping[str, Any]] = None,
        references: Optional[Mapping[str, Any]] = None,
        description: Optional[str] = None,
    ) -> MutableMapping[str, Any]:
        body: Dict[str, Any] = {}
        if checklist is not None:
            body["checklist"] = dict(checklist)
        if references is not None:
            body["references"] = dict(references)
        if description is not None:
            body["description"] = description
        return self._request("PATCH", f"/tasks/{task_id}/details", json_payload=body, etag=etag)

    def set_labels(self, task_id: str, etag: str, labels: Mapping[str, bool]) -> MutableMapping[str, Any]:
        return self.update_task(task_id, etag, appliedCategories=dict(labels))

    def set_assignments(self, task_id: str, etag: str, assignments: Mapping[str, Any]) -> MutableMapping[str, Any]:
        return self.update_task(task_id, etag, assignments=dict(assignments))
