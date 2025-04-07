#!/bin/bash

set -e  # Exit if any command fails

# Step 1: Run Frontend
echo "Step 1: Starting Frontend..."
cd coralx-frontend || { echo "Failed to navigate to coralx-frontend"; exit 1; }
pnpm dev || { echo "Failed to start frontend"; exit 1; }