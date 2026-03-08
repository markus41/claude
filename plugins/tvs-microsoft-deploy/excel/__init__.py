"""Excel quality toolkit for TVS Microsoft deploy workflows."""

from .schema_profiles import PROFILES, get_profile
from .validation_engine import validate_workbook

__all__ = ["PROFILES", "get_profile", "validate_workbook"]
