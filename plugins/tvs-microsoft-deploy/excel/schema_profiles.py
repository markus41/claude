"""Schema profiles for common TAIA workbook types."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List


@dataclass(frozen=True)
class ColumnRule:
    name: str
    required: bool = True
    expected_type: str = "string"


@dataclass(frozen=True)
class WorkbookProfile:
    id: str
    description: str
    required_sheets: List[str]
    required_named_ranges: List[str]
    formula_columns: List[str]
    columns_by_sheet: Dict[str, List[ColumnRule]]


PROFILES: Dict[str, WorkbookProfile] = {
    "commission_reconciliation": WorkbookProfile(
        id="commission_reconciliation",
        description="Commission source-to-modeled reconciliation workbook.",
        required_sheets=["Reconciliation", "CarrierSummary", "Validation"],
        required_named_ranges=["recon_period", "commission_total_source", "commission_total_modeled"],
        formula_columns=["variance", "variance_pct"],
        columns_by_sheet={
            "Reconciliation": [
                ColumnRule("carrier_id", expected_type="string"),
                ColumnRule("policy_id", expected_type="string"),
                ColumnRule("commission_source", expected_type="number"),
                ColumnRule("commission_modeled", expected_type="number"),
                ColumnRule("variance", expected_type="formula"),
                ColumnRule("variance_pct", expected_type="formula"),
            ]
        },
    ),
    "carrier_mapping": WorkbookProfile(
        id="carrier_mapping",
        description="Canonical carrier mapping and fuzzy-merge decisions.",
        required_sheets=["CarrierMap", "Exceptions"],
        required_named_ranges=["effective_date", "owner"],
        formula_columns=["confidence_score"],
        columns_by_sheet={
            "CarrierMap": [
                ColumnRule("carrier_variant", expected_type="string"),
                ColumnRule("carrier_canonical", expected_type="string"),
                ColumnRule("mapping_method", expected_type="string"),
                ColumnRule("confidence_score", expected_type="formula"),
            ]
        },
    ),
    "buyer_packet_support": WorkbookProfile(
        id="buyer_packet_support",
        description="Buyer packet workbook with due-diligence support tabs.",
        required_sheets=["BuyerPacket", "Narrative", "Checks"],
        required_named_ranges=["buyer_name", "snapshot_date", "prepared_by"],
        formula_columns=["delta_to_target", "coverage_ratio"],
        columns_by_sheet={
            "BuyerPacket": [
                ColumnRule("metric", expected_type="string"),
                ColumnRule("actual", expected_type="number"),
                ColumnRule("target", expected_type="number"),
                ColumnRule("delta_to_target", expected_type="formula"),
            ]
        },
    ),
}


def get_profile(profile_id: str) -> WorkbookProfile:
    """Return a workbook profile by id."""
    if profile_id not in PROFILES:
        valid = ", ".join(sorted(PROFILES))
        raise ValueError(f"Unknown profile '{profile_id}'. Expected one of: {valid}")
    return PROFILES[profile_id]
