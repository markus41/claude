# Excel Processing Toolkit

Provides workbook schema profiles, chunked parsers, and a validation engine used by TAIA readiness gates.

## Included modules

- `schema_profiles.py` — profile definitions for `commission_reconciliation`, `carrier_mapping`, and `buyer_packet_support` workbook families.
- `parsers.py` — read-only, chunked parsing utilities designed to avoid loading full sheets into memory.
- `validation_engine.py` — validation checks for formulas, named ranges, hidden sheets, merged cells, and type drift with weighted scoring.
