#!/bin/sh
# Pull the latest main into ../wealth-tracker-src and rebuild/restart the MCP container.
#   cd ~/wealth-tracker-db && ./scripts/deploy-mcp.sh
set -e
cd "$(dirname "$0")/.."
SRC="${MCP_SRC_DIR:-../wealth-tracker-src}"
if [ ! -d "$SRC/.git" ]; then
  git clone --depth 1 https://github.com/hwennnn/wealth-tracker.git "$SRC"
else
  git -C "$SRC" fetch --depth 1 origin main && git -C "$SRC" reset --hard origin/main
fi
docker compose up -d --build mcp
docker compose ps mcp
