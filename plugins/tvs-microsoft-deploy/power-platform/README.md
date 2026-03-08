# Power Platform ALM Assets

Canonical ALM definitions for Dataverse, Power Automate, model-driven apps, and Copilot Studio bots.

## Structure

- `manifests/`: canonical solution manifests + versioned release metadata.
- `profiles/`: environment deployment profiles (dev/test/prod).
- `validation/`: schema compatibility and release-gate policy files.
- `rollback-packages/`: rollback artifacts required for business-critical releases.

## Lifecycle

1. Precheck: `scripts/power_platform_alm.py --action precheck`
2. Unpack/Pack: `--action unpack|pack`
3. Import: `--action import`
4. Promote: `--action promote`

Copilot Studio bot assets are governed in the same chain via the `tvs-copilot-studio.solution.json` manifest.
