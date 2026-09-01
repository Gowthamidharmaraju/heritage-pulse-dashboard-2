#!/bin/bash
cd "$(dirname "$0")"

echo "=========================================================="
echo "   🚀 Starting Heritage Pulse Content Ops Dashboard...    "
echo "=========================================================="

export PATH="$(pwd)/bin/bin:/usr/local/bin:/opt/homebrew/bin:$PATH"

# Open browser automatically
(sleep 1 && open "http://localhost:3000") &

# Start Node.js Express server
node server/index.js
