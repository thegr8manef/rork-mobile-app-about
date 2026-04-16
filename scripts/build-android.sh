#!/bin/bash
set -e

# ──────────────────────────────────────
# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Log functions
info()    { echo -e "${CYAN}[INFO]${NC}  $1"; }
success() { echo -e "${GREEN}[✔]${NC}    $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $1"; }
error()   { echo -e "${RED}[✘]${NC}    $1"; }
step()    { echo -e "\n${BOLD}${BLUE}━━━ $1 ━━━${NC}"; }
divider() { echo -e "${BLUE}──────────────────────────────────────${NC}"; }

# ──────────────────────────────────────
# Detect OS / Shell environment
detect_env() {
  if [[ "$OSTYPE" == "darwin"* ]]; then
    ENV_NAME="macOS"
    TEMP_DIR="$(pwd)/.expo-bundle-temp"
  elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    ENV_NAME="Windows (Git Bash)"
    TEMP_DIR="$(pwd)/.expo-bundle-temp"
  elif [[ "$OS" == "Windows_NT" ]]; then
    ENV_NAME="Windows (PowerShell/CMD)"
    TEMP_DIR="$(pwd)/.expo-bundle-temp"
  else
    ENV_NAME="Linux"
    TEMP_DIR="$(pwd)/.expo-bundle-temp"
  fi
}

# Detect cross-env availability
detect_cross_env() {
  if command -v cross-env &> /dev/null; then
    CROSS_ENV="cross-env"
  elif [ -f "node_modules/.bin/cross-env" ]; then
    CROSS_ENV="./node_modules/.bin/cross-env"
  else
    warn "cross-env not found, using direct env export"
    export APP_ENV=production
    CROSS_ENV=""
  fi
}

# Trap errors
trap 'error "Build failed at line $LINENO. Check logs above."; exit 1' ERR

# ──────────────────────────────────────
detect_env
detect_cross_env

divider
echo -e "${BOLD}${GREEN}  🚀 Attijari Up — Android Release Build${NC}"
echo -e "${CYAN}  ENV: production | Platform: Android${NC}"
echo -e "${CYAN}  Shell: $ENV_NAME${NC}"
echo -e "${CYAN}  Temp: $TEMP_DIR${NC}"
divider

# ──────────────────────────────────────
step "STEP 1 — Clean old bundle"

BUNDLE_PATH="android/app/src/main/assets/index.android.bundle"
ASSETS_PATH="android/app/src/main/assets"

if [ -f "$BUNDLE_PATH" ]; then
  rm -f "$BUNDLE_PATH"
  success "Old bundle removed"
else
  warn "No old bundle found, skipping"
fi

# Clean old temp if exists
if [ -d "$TEMP_DIR" ]; then
  rm -rf "$TEMP_DIR"
  success "Old temp folder cleaned"
fi

# ──────────────────────────────────────
step "STEP 2 — Check dependencies"

if [ ! -d "node_modules" ]; then
  warn "node_modules not found, running npm install..."
  npm install 2>&1 | while IFS= read -r line; do
    echo -e "${CYAN}  [NPM]${NC} $line"
  done
  success "Dependencies installed"
else
  success "node_modules found ✓"
fi

if [ -z "$CROSS_ENV" ]; then
  info "cross-env: using direct export (APP_ENV=production)"
else
  info "cross-env: $CROSS_ENV"
fi

# ──────────────────────────────────────
step "STEP 3 — Bundle JS with Metro (Expo)"

info "Entry:   index.js"
info "Output:  $BUNDLE_PATH"
info "Mode:    production (dev=false)"
info "Temp:    $TEMP_DIR"

echo ""

# Run expo export
if [ -n "$CROSS_ENV" ]; then
  $CROSS_ENV APP_ENV=production npx expo export \
    --platform android \
    --output-dir "$TEMP_DIR" 2>&1 | while IFS= read -r line; do
      if echo "$line" | grep -qi "error"; then
        echo -e "${RED}  [METRO]${NC} $line"
      elif echo "$line" | grep -qi "warn"; then
        echo -e "${YELLOW}  [METRO]${NC} $line"
      elif echo "$line" | grep -qi "Bundled\|Exported\|✓\|success"; then
        echo -e "${GREEN}  [METRO]${NC} $line"
      else
        echo -e "${CYAN}  [METRO]${NC} $line"
      fi
    done
else
  npx expo export \
    --platform android \
    --output-dir "$TEMP_DIR" 2>&1 | while IFS= read -r line; do
      if echo "$line" | grep -qi "error"; then
        echo -e "${RED}  [METRO]${NC} $line"
      elif echo "$line" | grep -qi "warn"; then
        echo -e "${YELLOW}  [METRO]${NC} $line"
      elif echo "$line" | grep -qi "Bundled\|Exported\|✓\|success"; then
        echo -e "${GREEN}  [METRO]${NC} $line"
      else
        echo -e "${CYAN}  [METRO]${NC} $line"
      fi
    done
fi

echo ""

# ──────────────────────────────────────
step "STEP 4 — Copy bundle to assets"

info "Searching for bundle in: $TEMP_DIR"

# Find .hbc first (Hermes bytecode), fallback to .js
EXPORTED_BUNDLE=$(find "$TEMP_DIR" -type f \( -name "*.hbc" -o -name "*.js" \) | grep -i "android" | head -1)

if [ -z "$EXPORTED_BUNDLE" ]; then
  error "No Android bundle found in $TEMP_DIR"
  info "Contents of temp dir:"
  find "$TEMP_DIR" -type f | while IFS= read -r f; do
    echo -e "${YELLOW}    $f${NC}"
  done
  exit 1
fi

info "Found bundle: $EXPORTED_BUNDLE"

# Ensure assets dir exists
mkdir -p "$ASSETS_PATH"

# Copy bundle
cp "$EXPORTED_BUNDLE" "$BUNDLE_PATH"
success "Bundle copied to $BUNDLE_PATH"

# Copy assets (images, fonts, etc.)
if [ -d "$TEMP_DIR/assets" ]; then
  cp -r "$TEMP_DIR/assets/." "android/app/src/main/res/" 2>/dev/null || true
  success "Assets copied"
else
  warn "No assets folder found in temp dir"
fi

# Bundle size
BUNDLE_SIZE=$(du -sh "$BUNDLE_PATH" | cut -f1)
info "Bundle size: ${BOLD}${GREEN}$BUNDLE_SIZE${NC}"

# Cleanup temp
rm -rf "$TEMP_DIR"
info "Temp folder cleaned"

# ──────────────────────────────────────
step "STEP 5 — Gradle: Generate Codegen Artifacts"

info "Running generateCodegenArtifactsFromSchema..."
echo ""

run_gradle() {
  ./android/gradlew -p android "$@" 2>&1 | while IFS= read -r line; do
    if echo "$line" | grep -qi "^> Task\|:task"; then
      echo -e "${BLUE}  [GRADLE]${NC} $line"
    elif echo "$line" | grep -qi "error\|failure\|failed"; then
      echo -e "${RED}  [GRADLE]${NC} $line"
    elif echo "$line" | grep -qi "warning\|deprecated"; then
      echo -e "${YELLOW}  [GRADLE]${NC} $line"
    elif echo "$line" | grep -qi "BUILD SUCCESSFUL"; then
      echo -e "${GREEN}  [GRADLE]${NC} ${BOLD}$line${NC}"
    elif echo "$line" | grep -qi "UP-TO-DATE\|SKIPPED\|FROM-CACHE"; then
      echo -e "${CYAN}  [GRADLE]${NC} $line"
    else
      echo -e "  ${NC}$line"
    fi
  done
}

if [ -n "$CROSS_ENV" ]; then
  $CROSS_ENV APP_ENV=production bash -c "$(declare -f run_gradle); run_gradle generateCodegenArtifactsFromSchema"
else
  run_gradle generateCodegenArtifactsFromSchema
fi

success "Codegen artifacts generated"

# ──────────────────────────────────────
step "STEP 6 — Gradle: Assemble Release APK"

info "Building release APK..."
echo ""

if [ -n "$CROSS_ENV" ]; then
  $CROSS_ENV APP_ENV=production bash -c "$(declare -f run_gradle); run_gradle assembleRelease"
else
  run_gradle assembleRelease
fi

# ──────────────────────────────────────
step "STEP 7 — Output"

APK_PATH="android/app/build/outputs/apk/release/app-release.apk"
AAB_PATH="android/app/build/outputs/bundle/release/app-release.aab"

divider
if [ -f "$APK_PATH" ]; then
  APK_SIZE=$(du -sh "$APK_PATH" | cut -f1)
  success "Build completed successfully! 🎉"
  echo ""
  echo -e "${GREEN}  📦 APK${NC}"
  echo -e "     Path: ${BOLD}$APK_PATH${NC}"
  echo -e "     Size: ${BOLD}${GREEN}$APK_SIZE${NC}"
else
  warn "APK not found at: $APK_PATH"
fi

if [ -f "$AAB_PATH" ]; then
  AAB_SIZE=$(du -sh "$AAB_PATH" | cut -f1)
  echo ""
  echo -e "${GREEN}  📦 AAB (Play Store)${NC}"
  echo -e "     Path: ${BOLD}$AAB_PATH${NC}"
  echo -e "     Size: ${BOLD}${GREEN}$AAB_SIZE${NC}"
fi

if [ ! -f "$APK_PATH" ] && [ ! -f "$AAB_PATH" ]; then
  error "No APK or AAB found. Build may have failed silently."
  exit 1
fi

echo ""
divider
echo -e "${BOLD}${GREEN}  ✅ All done!${NC}"-
divider