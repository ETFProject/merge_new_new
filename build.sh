#!/bin/bash
# Custom build script for Vercel that skips all linting

echo "Starting build without linting..."

# Install dependencies
npm install

# Build without linting
NEXT_SKIP_LINT=true NEXT_SKIP_TYPE_CHECK=true npx next build --no-lint

echo "Build completed!" 