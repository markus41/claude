#!/bin/bash

# Theme Sync Hook
# Detects theme file changes and reminds to update tenant-specific themes

set -e

# Configuration
TENANTS="${TENANTS:-thelobbi,brooksidebi}"
KEYCLOAK_THEME_DIR="${KEYCLOAK_THEME_DIR:-./themes/keycloak}"

# Get the file being modified from arguments
FILE_PATH="${1:-}"

if [ -z "$FILE_PATH" ]; then
  echo "⚠️  No file path provided to theme sync hook"
  exit 0
fi

# Only check theme/token files
if [[ ! "$FILE_PATH" =~ (theme|tokens).*\.(ts|json|css)$ ]]; then
  exit 0
fi

# Only check if file exists
if [ ! -f "$FILE_PATH" ]; then
  exit 0
fi

echo "🎨 Theme file modified: $FILE_PATH"

# Parse tenants into array
IFS=',' read -ra TENANT_ARRAY <<< "$TENANTS"

echo ""
echo "📋 Theme Sync Checklist:"
echo ""

# Check if this is a design token file
if [[ "$FILE_PATH" =~ tokens ]]; then
  echo "   🔄 Design tokens were modified"
  echo ""
  echo "   Consider updating:"
  for tenant in "${TENANT_ARRAY[@]}"; do
    echo "      • $tenant theme configuration"
  done
  echo ""
fi

# Check if this is a theme file
if [[ "$FILE_PATH" =~ theme ]]; then
  echo "   🎨 Theme file was modified"
  echo ""
  echo "   Tenant-specific themes that may need updates:"
  for tenant in "${TENANT_ARRAY[@]}"; do
    echo "      • src/themes/${tenant}-theme.ts (if exists)"
    echo "      • src/styles/${tenant}-overrides.css (if exists)"
  done
  echo ""
fi

# Check Keycloak theme directory
if [ -d "$KEYCLOAK_THEME_DIR" ]; then
  echo "   🔐 Keycloak themes detected at: $KEYCLOAK_THEME_DIR"
  echo "   Consider syncing changes to Keycloak theme files:"
  echo "      • ${KEYCLOAK_THEME_DIR}/login/resources/css/"
  echo "      • ${KEYCLOAK_THEME_DIR}/account/resources/css/"
  echo ""
fi

# Provide helpful commands
echo "💡 Helpful Commands:"
echo "   # Build all tenant themes"
echo "   npm run build:themes"
echo ""
echo "   # Test theme changes"
echo "   npm run storybook"
echo ""
echo "   # Sync to Keycloak"
echo "   npm run sync:keycloak-themes"
echo ""

# Check if theme builder exists
THEME_BUILDER="./scripts/build-themes.sh"
if [ -f "$THEME_BUILDER" ]; then
  echo "   # Auto-generate tenant themes"
  echo "   ./scripts/build-themes.sh"
  echo ""
fi

# List related files that might need updates
echo "📁 Related Files to Review:"
if [[ "$FILE_PATH" =~ \.ts$ ]]; then
  # Look for CSS files with similar names
  CSS_FILE="${FILE_PATH%.ts}.css"
  if [ -f "$CSS_FILE" ]; then
    echo "   • $CSS_FILE"
  fi
fi

# Look for theme export files
THEME_INDEX="./src/themes/index.ts"
if [ -f "$THEME_INDEX" ]; then
  echo "   • $THEME_INDEX (verify theme is exported)"
fi

echo ""
echo "✅ Theme sync reminder complete"
exit 0
