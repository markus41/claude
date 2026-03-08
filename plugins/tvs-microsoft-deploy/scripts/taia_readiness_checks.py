#!/usr/bin/env python3
"""Fail-fast TAIA readiness quality checks for Fabric and workbook outputs."""

import argparse
import json
import sys
from pathlib import Path


def load_json(path: Path):
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def evaluate(metrics: dict, thresholds: dict):
    failures = []
    score = 0.0
    max_score = 0.0

    carrier_count = metrics.get("carrier_count", 0)
    max_score += 25
    if carrier_count < thresholds["carrier_count_min"]:
        failures.append(
            f"carrier_count {carrier_count} < min {thresholds['carrier_count_min']}"
        )
    else:
        score += 25

    commission_source = float(metrics.get("commission_total_source", 0.0))
    commission_modeled = float(metrics.get("commission_total_modeled", 0.0))
    variance = abs(commission_modeled - commission_source)
    variance_pct = (variance / commission_source) if commission_source else 1.0
    max_score += 25
    if variance_pct > thresholds["commission_total_variance_pct_max"]:
        failures.append(
            "commission variance "
            f"{variance_pct:.4f} > max {thresholds['commission_total_variance_pct_max']:.4f}"
        )
    else:
        score += 25

    hierarchy_consistency = float(metrics.get("agent_hierarchy_consistency", 0.0))
    max_score += 20
    if hierarchy_consistency < thresholds["agent_hierarchy_consistency_min"]:
        failures.append(
            "agent_hierarchy_consistency "
            f"{hierarchy_consistency:.4f} < min {thresholds['agent_hierarchy_consistency_min']:.4f}"
        )
    else:
        score += 20

    workbook_quality_score = float(metrics.get("workbook_quality_score", 0.0))
    workbook_gate_min = float(thresholds.get("workbook_quality_score_min", 90.0))
    max_score += 20
    if workbook_quality_score < workbook_gate_min:
        failures.append(
            f"workbook_quality_score {workbook_quality_score:.2f} < min {workbook_gate_min:.2f}"
        )
    else:
        score += 20

    workbook_gate_pass_rate = float(metrics.get("workbook_quality_gate_pass_rate", 0.0))
    gate_pass_rate_min = float(thresholds.get("workbook_quality_gate_pass_rate_min", 1.0))
    max_score += 10
    if workbook_gate_pass_rate < gate_pass_rate_min:
        failures.append(
            "workbook_quality_gate_pass_rate "
            f"{workbook_gate_pass_rate:.2f} < min {gate_pass_rate_min:.2f}"
        )
    else:
        score += 10

    return failures, round((score / max_score) * 100.0, 2)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--metrics", required=True, help="Path to metrics JSON")
    parser.add_argument(
        "--thresholds",
        default="plugins/tvs-microsoft-deploy/fabric/quality/taia_thresholds.json",
        help="Path to TAIA threshold JSON",
    )
    args = parser.parse_args()

    metrics = load_json(Path(args.metrics))
    thresholds = load_json(Path(args.thresholds))

    failures, readiness_score = evaluate(metrics, thresholds)
    print(f"TAIA readiness score: {readiness_score:.2f}")

    if failures:
        print("TAIA readiness FAILED:")
        for failure in failures:
            print(f" - {failure}")
        sys.exit(1)

    print("TAIA readiness PASSED")


if __name__ == "__main__":
    main()
