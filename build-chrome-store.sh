#!/bin/bash

# LanguageBridge - Chrome Web Store Build Script
# Creates a clean ZIP file ready for Chrome Web Store submission

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Building LanguageBridge for Chrome Web Store...${NC}"

# Get version from manifest.json
VERSION=$(grep '"version"' manifest.json | head -1 | sed 's/.*"version": "\(.*\)".*/\1/')
echo -e "${GREEN}📦 Version: ${VERSION}${NC}"

# Output filename
OUTPUT_FILE="languagebridge-v${VERSION}-chrome-store.zip"

# Remove old build if it exists
if [ -f "$OUTPUT_FILE" ]; then
  echo -e "${YELLOW}🗑️  Removing old build...${NC}"
  rm "$OUTPUT_FILE"
fi

echo -e "${BLUE}📁 Creating package...${NC}"

# Create ZIP with only necessary files
# Exclude: node_modules, development files, git files, scripts, docs
zip -r "$OUTPUT_FILE" . \
  -x "node_modules/*" \
  -x ".*" \
  -x ".git/*" \
  -x ".gitignore" \
  -x "*.md" \
  -x "scripts/*" \
  -x "docs/*" \
  -x "netlify/*" \
  -x "netlify.toml" \
  -x "package.json" \
  -x "package-lock.json" \
  -x "build-chrome-store.sh" \
  -x "*.zip" \
  -x "screenshot.jpg" \
  -x "privacy-policy-alpha.html" \
  -x "admin-dashboard.html" \
  -x "netlify-functions-deploy.zip" \
  -x "*.backup" \
  -x "*/*.backup" \
  -x "*/*/*.backup"

# Get file size
SIZE=$(ls -lh "$OUTPUT_FILE" | awk '{print $5}')

echo -e "${GREEN}✅ Build complete!${NC}"
echo -e "${GREEN}📦 Package: ${OUTPUT_FILE}${NC}"
echo -e "${GREEN}💾 Size: ${SIZE}${NC}"
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo -e "  1. Go to: ${YELLOW}https://chrome.google.com/webstore/devconsole${NC}"
echo -e "  2. Click: ${YELLOW}New Item${NC}"
echo -e "  3. Upload: ${YELLOW}${OUTPUT_FILE}${NC}"
echo -e "  4. Fill in store listing details"
echo -e "  5. Submit for review"
echo ""
echo -e "${BLUE}📄 Don't forget:${NC}"
echo -e "  • Privacy Policy URL: ${YELLOW}https://languagebridge.app/privacy${NC}"
echo -e "  • Support Email: ${YELLOW}info@languagebridge.app${NC}"
echo -e "  • Category: ${YELLOW}Productivity${NC} or ${YELLOW}Education${NC}"
echo ""
