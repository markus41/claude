# TAIA quality and reconciliation gates

`taia_readiness_checks.py` enforces automated readiness gates against core sale metrics:

- **Carrier counts** must meet minimum expected breadth.
- **Commission totals** must reconcile to source-of-truth within tolerance.
- **Agent hierarchy consistency** must remain above governance threshold.

Pipelines should invoke the script after silver and gold updates. Any threshold violation exits non-zero and should fail release readiness.
