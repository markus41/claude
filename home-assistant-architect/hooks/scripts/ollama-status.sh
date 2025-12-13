#!/bin/bash
# ollama-status.sh - Check Ollama server and model status

set -e

OLLAMA_URL="${OLLAMA_URL:-http://localhost:11434}"

echo "=== Ollama Status Check ==="

# Check server availability
echo -n "Server: "
if curl -s --connect-timeout 5 "$OLLAMA_URL/api/tags" > /dev/null 2>&1; then
    echo "Running"
else
    echo "NOT RUNNING"
    echo "Start Ollama with: ollama serve"
    exit 1
fi

# List loaded models
echo "Loaded Models:"
curl -s "$OLLAMA_URL/api/ps" | jq -r '.models[] | "  - \(.name) (\(.size | . / 1024 / 1024 / 1024 | . * 100 | floor / 100)GB)"' 2>/dev/null || echo "  (none currently loaded)"

# List available models
echo "Available Models:"
curl -s "$OLLAMA_URL/api/tags" | jq -r '.models[] | "  - \(.name) (\(.size | . / 1024 / 1024 / 1024 | . * 100 | floor / 100)GB)"' 2>/dev/null || echo "  (no models installed)"

# Check for HA-recommended models
echo ""
echo "Recommended Models for Home Assistant:"
MODELS=$(curl -s "$OLLAMA_URL/api/tags" | jq -r '.models[].name' 2>/dev/null)

check_model() {
    if echo "$MODELS" | grep -q "^$1"; then
        echo "  [✓] $1 - installed"
    else
        echo "  [ ] $1 - not installed (ollama pull $1)"
    fi
}

check_model "llama3.2:3b"
check_model "fixt/home-3b-v3"
check_model "mistral:7b"

echo "=== Ollama Check Complete ==="
