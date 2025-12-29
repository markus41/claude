#!/bin/bash
# ha-health-check.sh - Check Home Assistant health status

set -e

HA_URL="${HA_URL:-http://homeassistant.local:8123}"
HA_TOKEN="${HA_TOKEN}"

if [ -z "$HA_TOKEN" ]; then
    echo "Warning: HA_TOKEN not set, skipping health check"
    exit 0
fi

echo "=== Home Assistant Health Check ==="

# Check API availability
echo -n "API Status: "
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $HA_TOKEN" \
    "$HA_URL/api/")

if [ "$API_STATUS" = "200" ]; then
    echo "OK (200)"
else
    echo "ERROR ($API_STATUS)"
    exit 1
fi

# Get HA version and info
echo -n "Version: "
VERSION=$(curl -s -H "Authorization: Bearer $HA_TOKEN" \
    "$HA_URL/api/" | jq -r '.version // "unknown"')
echo "$VERSION"

# Check core config validity
echo -n "Config: "
CONFIG_STATUS=$(curl -s -H "Authorization: Bearer $HA_TOKEN" \
    "$HA_URL/api/config/core/check_config" | jq -r '.result // "unknown"')
if [ "$CONFIG_STATUS" = "valid" ]; then
    echo "Valid"
else
    echo "INVALID - $CONFIG_STATUS"
fi

# Count entities
echo -n "Entities: "
ENTITY_COUNT=$(curl -s -H "Authorization: Bearer $HA_TOKEN" \
    "$HA_URL/api/states" | jq 'length')
echo "$ENTITY_COUNT total"

# Check for unavailable entities
echo -n "Unavailable: "
UNAVAILABLE=$(curl -s -H "Authorization: Bearer $HA_TOKEN" \
    "$HA_URL/api/states" | jq '[.[] | select(.state == "unavailable")] | length')
if [ "$UNAVAILABLE" -gt 10 ]; then
    echo "$UNAVAILABLE (WARNING: High number)"
else
    echo "$UNAVAILABLE"
fi

# Check automation count
echo -n "Automations: "
AUTOMATIONS=$(curl -s -H "Authorization: Bearer $HA_TOKEN" \
    "$HA_URL/api/states" | jq '[.[] | select(.entity_id | startswith("automation."))] | length')
echo "$AUTOMATIONS"

echo "=== Health Check Complete ==="
