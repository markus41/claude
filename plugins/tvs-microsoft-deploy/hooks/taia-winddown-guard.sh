#!/bin/bash
# TAIA guard now routes through centralized identity policy engine.
set -euo pipefail

ENGINE_SCRIPT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/identity-policy-engine.sh"
exec "$ENGINE_SCRIPT"
