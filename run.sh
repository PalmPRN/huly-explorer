#!/bin/bash
# Huly Integration CLI launcher for macOS/Linux

# Stop on any error
set -e

# Change directory to the script's directory
cd "$(dirname "$0")"

echo "====================================================="
echo "        HULY INTEGRATION CLI LAUNCHER (macOS/Linux)  "
echo "====================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  echo "❌ Error: Node.js is not installed. Please install Node.js (v18 or higher)."
  exit 1
fi

# Check for .env file
if [ ! -f .env ]; then
  echo "⚠️  .env file not found. Initializing .env from template..."
  cp .env.example .env
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d node_modules ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

# Run the CLI
echo "🚀 Launching Huly Terminal Dashboard..."
npm run cli
