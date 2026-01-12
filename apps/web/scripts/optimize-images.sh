#!/bin/bash

# Script to optimize images for responsive design
# Generates multiple sizes (640, 768, 1024, 1280, 1920px) for each image
# Requires: sharp-cli (npm install -g sharp-cli)

set -e

IMAGES_DIR="public/images"
SIZES=(640 768 1024 1280 1920)

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Image Optimization Script${NC}"
echo -e "${BLUE}========================${NC}\n"

# Check if sharp-cli is installed
if ! command -v sharp &> /dev/null; then
    echo -e "${RED}Error: sharp-cli is not installed${NC}"
    echo "Install it with: npm install -g sharp-cli"
    exit 1
fi

# Check if images directory exists
if [ ! -d "$IMAGES_DIR" ]; then
    echo -e "${RED}Error: $IMAGES_DIR directory not found${NC}"
    exit 1
fi

# Find all original images (those without size suffix)
ORIGINAL_IMAGES=$(find "$IMAGES_DIR" -type f \( -name "*.avif" -o -name "*.webp" -o -name "*.jpg" -o -name "*.png" \) ! -name "*-[0-9]*.*")

if [ -z "$ORIGINAL_IMAGES" ]; then
    echo -e "${RED}No images found in $IMAGES_DIR${NC}"
    exit 0
fi

echo -e "${GREEN}Found images to optimize:${NC}"
echo "$ORIGINAL_IMAGES"
echo ""

# Process each image
for img in $ORIGINAL_IMAGES; do
    filename=$(basename "$img")
    extension="${filename##*.}"
    basename="${filename%.*}"
    dir=$(dirname "$img")

    echo -e "${BLUE}Processing: $filename${NC}"

    for size in "${SIZES[@]}"; do
        output="$dir/${basename}-${size}.${extension}"

        # Skip if already exists
        if [ -f "$output" ]; then
            echo -e "  ⏭  Skipping ${size}px (already exists)"
            continue
        fi

        echo -e "  ✓ Generating ${size}px width..."
        sharp -i "$img" -o "$output" --resize $size
    done

    echo ""
done

echo -e "${GREEN}✓ Image optimization complete!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Update your image paths in the code to use the base name (without size suffix)"
echo "2. Angular NgOptimizedImage will automatically use the responsive versions"
echo "3. Deploy and test with different viewport sizes"
