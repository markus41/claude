---
name: tvs:quick-start
description: End-to-end bootstrap for TVS Microsoft Deploy that can initialize a fresh repo or configure an existing repo to the required baseline
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
---

> Docs Hub: [CLI Hub](../docs/cli/README.md#command-index)

# Quick Start Bootstrap

Run a single command to prepare a repository for TVS Microsoft Deploy, wire required folder structure/configuration, and validate readiness with dry-run checks.

## Usage

```bash
/tvs:quick-start [--repo <path>] [--create-repo <path>] [--env dev|test|prod] [--tenant <tenant-id>] [--entity tvs|consulting|taia|all] [--dry-run]
```

## Modes

- `--repo <path>`: Use an existing repository and configure it.
- `--create-repo <path>`: Create a brand-new repository at the given path, then configure it.

Exactly one of `--repo` or `--create-repo` must be provided.

## Bootstrap flow

1. Validate tooling (`git`, `node`, `python3`, `pac`, `az`, `gh`).
2. Create or select target repository.
3. Ensure required baseline paths exist:
   - `plugins/tvs-microsoft-deploy/`
   - `plugins/tvs-microsoft-deploy/control-plane/manifests/`
   - `plugins/tvs-microsoft-deploy/control-plane/out/`
   - `docs/cli/`
4. Copy TVS plugin assets and command contracts into the target repo.
5. Initialize environment configuration from profile templates (`power-platform/profiles/{env}.json`).
6. Validate identity policy preconditions:

```bash
python3 plugins/tvs-microsoft-deploy/scripts/identity_policy_checks.py --json
```

7. Generate deployment and status plans:

```bash
node plugins/tvs-microsoft-deploy/control-plane/planner.mjs \
  --manifest plugins/tvs-microsoft-deploy/control-plane/manifests/base.yaml \
  --overlay plugins/tvs-microsoft-deploy/control-plane/manifests/overlays/${ENV:-dev}.yaml \
  --mode dry-run \
  --out plugins/tvs-microsoft-deploy/control-plane/out/deploy.dry-run.json

node plugins/tvs-microsoft-deploy/control-plane/planner.mjs \
  --manifest plugins/tvs-microsoft-deploy/control-plane/manifests/base.yaml \
  --overlay plugins/tvs-microsoft-deploy/control-plane/manifests/overlays/${ENV:-dev}.yaml \
  --mode dry-run \
  --out plugins/tvs-microsoft-deploy/control-plane/out/status.dry-run.json
```

8. Run readiness validation:

```bash
/tvs:status-check --env ${ENV:-dev} --entity ${ENTITY:-tvs} --tenant ${TENANT}
```

## Required outputs

- `plugins/tvs-microsoft-deploy/control-plane/out/deploy.dry-run.json`
- `plugins/tvs-microsoft-deploy/control-plane/out/status.dry-run.json`
- `docs/cli/COMMANDS.md`

## Unified Command Contract

### Contract
- **Schema:** `../cli/command.schema.json`
- **Required shared arguments:** `--entity`, `--tenant`
- **Optional shared safety arguments:** `--strict`, `--dry-run`, `--export-json`, `--plan-id`
- **Error catalog:** `../cli/error-codes.json`
- **Operator remediation format:** `../cli/operator-remediation.md`

### Shared argument patterns
```text
--entity <tvs|consulting|taia|all>
--tenant <tenant-id>
--strict
--dry-run
--export-json <path>
--plan-id <plan-id>
```

### Unified examples
```bash
# Configure an existing repo
/tvs:quick-start --repo . --env dev --entity tvs --tenant tvs-dev --plan-id PLAN-BOOTSTRAP-TVS-001

# Create and configure a fresh repo
/tvs:quick-start --create-repo ../tvs-greenfield --env test --entity consulting --tenant consulting-test --strict --dry-run --plan-id PLAN-BOOTSTRAP-CONSULTING-001
```
