#!/bin/bash
set -e

echo "Building server..."
cd server
npm ci
npm run build

echo "Building client..."
cd ../client
npm ci
npm run build

echo "Build completed successfully!"
