"""Planner workflow state manager and operational reports."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, List, Mapping, MutableMapping

PHASE_ORDER: List[str] = ["EXPLORE", "PLAN", "CODE", "TEST", "FIX", "DOCUMENT"]
TASK_PERCENT_COMPLETE = {"pending": 0, "in-progress": 50, "blocked": 50, "completed": 100}
BLOCKER_LABEL = "category6"


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class WorkflowStateManager:
    planner_client: Any

    def _phase_index(self, phase_name: str) -> int:
        normalized = phase_name.upper()
        if normalized not in PHASE_ORDER:
            raise ValueError(f"Invalid phase '{phase_name}'.")
        return PHASE_ORDER.index(normalized)

    def _validate_dependencies(self, workflow: Mapping[str, Any]) -> List[str]:
        phase_map = {phase["id"]: phase for phase in workflow.get("phases", [])}
        issues: List[str] = []
        for phase in workflow.get("phases", []):
            current_index = self._phase_index(phase["name"])
            for dep in phase.get("dependencies", []):
                dep_id = dep["phaseId"]
                if dep_id not in phase_map:
                    issues.append(f"{phase['id']}: missing dependency {dep_id}")
                    continue
                dep_index = self._phase_index(phase_map[dep_id]["name"])
                if dep_index >= current_index:
                    issues.append(f"{phase['id']}: dependency {dep_id} is not earlier phase")
        return issues

    def evaluate_phase_state(self, tasks: List[Mapping[str, Any]]) -> str:
        if not tasks:
            return "pending"
        if any(task.get("appliedCategories", {}).get(BLOCKER_LABEL) for task in tasks):
            return "blocked"
        completion = [task.get("percentComplete", 0) for task in tasks]
        if all(v == 100 for v in completion):
            return "completed"
        if any(v > 0 for v in completion):
            return "in-progress"
        return "pending"

    def _sync_phase_tasks(self, phase: Mapping[str, Any]) -> None:
        desired = TASK_PERCENT_COMPLETE[phase["state"]]
        for task_id in phase.get("planner", {}).get("taskIds", []):
            task = self.planner_client.get_task(task_id)
            etag = task.get("@odata.etag")
            if not etag:
                continue
            labels: Dict[str, bool] = dict(task.get("appliedCategories") or {})
            labels[BLOCKER_LABEL] = phase["state"] == "blocked"
            self.planner_client.update_task(task_id, etag, percentComplete=desired, appliedCategories=labels)

    def init_plan(self, workflow: MutableMapping[str, Any], group_id: str, title: str) -> MutableMapping[str, Any]:
        plan = self.planner_client.create_plan(group_id, title)
        plan_id = plan.get("id", "")
        workflow.setdefault("planner", {})["planId"] = plan_id
        workflow["planner"]["groupId"] = group_id

        for idx, phase in enumerate(workflow.get("phases", []), start=1):
            bucket = self.planner_client.create_bucket(plan_id, phase["name"], order_hint=f" !{idx}")
            bucket_id = bucket.get("id", "")
            phase.setdefault("planner", {})["bucketId"] = bucket_id
            phase["planner"]["taskIds"] = []

            for task_tpl in phase.get("taskTemplates", []):
                task = self.planner_client.create_task(plan_id, bucket_id, task_tpl["title"])
                task_id = task.get("id")
                if not task_id:
                    continue
                phase["planner"]["taskIds"].append(task_id)
                details = self.planner_client.get_task_details(task_id)
                details_etag = details.get("@odata.etag")
                if details_etag and (task_tpl.get("checklist") or task_tpl.get("description")):
                    checklist = {
                        f"item-{i}": {"title": item, "isChecked": False, "orderHint": f" !{i}"}
                        for i, item in enumerate(task_tpl.get("checklist", []), start=1)
                    }
                    self.planner_client.update_task_details(
                        task_id,
                        details_etag,
                        checklist=checklist,
                        description=task_tpl.get("description"),
                    )

        return workflow

    def sync_workflow(self, workflow: MutableMapping[str, Any]) -> MutableMapping[str, Any]:
        for phase in workflow.get("phases", []):
            task_ids = phase.get("planner", {}).get("taskIds", [])
            tasks = [self.planner_client.get_task(task_id) for task_id in task_ids]
            phase["state"] = self.evaluate_phase_state(tasks)

        workflow.setdefault("metadata", {})["lastSyncedAt"] = utc_now_iso()
        workflow["metadata"]["dependencyIssues"] = self._validate_dependencies(workflow)
        return workflow

    def advance_phase(self, workflow: MutableMapping[str, Any], phase_name: str) -> MutableMapping[str, Any]:
        target_index = self._phase_index(phase_name)
        for phase in workflow.get("phases", []):
            idx = self._phase_index(phase["name"])
            phase["state"] = "completed" if idx < target_index else "in-progress" if idx == target_index else "pending"
            self._sync_phase_tasks(phase)
        workflow.setdefault("metadata", {})["advancedAt"] = utc_now_iso()
        workflow["metadata"]["activePhase"] = phase_name.upper()
        return workflow

    def blocker_report(self, workflow: Mapping[str, Any]) -> Dict[str, Any]:
        blocked_phases: List[Dict[str, Any]] = []
        for phase in workflow.get("phases", []):
            task_ids = phase.get("planner", {}).get("taskIds", [])
            blocked_tasks = []
            for task_id in task_ids:
                task = self.planner_client.get_task(task_id)
                if task.get("appliedCategories", {}).get(BLOCKER_LABEL):
                    blocked_tasks.append({"id": task_id, "title": task.get("title", ""), "percentComplete": task.get("percentComplete", 0)})
            if blocked_tasks:
                blocked_phases.append(
                    {
                        "phaseId": phase["id"],
                        "phase": phase["name"],
                        "owners": phase.get("owners", []),
                        "sla": phase.get("sla", {}),
                        "blockedTasks": blocked_tasks,
                    }
                )

        return {"workflowId": workflow.get("workflowId"), "generatedAt": utc_now_iso(), "blockedPhases": blocked_phases}

    def closeout_pack(self, workflow: MutableMapping[str, Any]) -> Dict[str, Any]:
        synced = self.sync_workflow(workflow)
        phase_summary = []
        for phase in synced.get("phases", []):
            phase_summary.append(
                {
                    "phase": phase["name"],
                    "state": phase["state"],
                    "sla": phase.get("sla", {}),
                    "evidenceLinks": phase.get("evidenceLinks", []),
                    "taskCount": len(phase.get("planner", {}).get("taskIds", [])),
                }
            )

        return {
            "workflowId": synced.get("workflowId"),
            "workflowName": synced.get("name"),
            "generatedAt": utc_now_iso(),
            "dependencyIssues": synced.get("metadata", {}).get("dependencyIssues", []),
            "phaseSummary": phase_summary,
            "allPhasesCompleted": all(item["state"] == "completed" for item in phase_summary),
        }
