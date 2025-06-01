#!/bin/zsh

# Switch to zsh if not already in it
if [ -z "$ZSH_VERSION" ]; then
  exec /bin/zsh -l "$0" "$@"
fi

# Ensure bun is available
if ! command -v bun &> /dev/null; then
  echo "Bun is not installed or not in PATH. Please install Bun: https://bun.sh"
  exit 1
fi

# Print info
echo "Starting Next.js development server with Bun..."
echo "Node version: $(node -v)"
echo "Bun version: $(bun -v)"

# Run the development server
bun run --bun next dev --turbopack 