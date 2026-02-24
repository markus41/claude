#!/bin/bash
# Compatibility wrapper around centralized identity policy engine.
set -euo pipefail

ENGINE_SCRIPT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/identity-policy-engine.sh"
exec "$ENGINE_SCRIPT"
