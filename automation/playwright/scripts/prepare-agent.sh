#!/usr/bin/env bash
# Preparation only: Squash Orchestrator starts the tests and collects their results.
set -euo pipefail
script_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
project_dir="$(CDPATH= cd -- "$script_dir/.." && pwd)"
cd "$project_dir"
node -e 'if(Number(process.versions.node.split(".")[0])<20)throw new Error("Node 20 ou supérieur requis sur cet agent")'
lock_hash="$(sha256sum package-lock.json | cut -d ' ' -f 1)"
if [ ! -f node_modules/.eclat-lock.sha256 ] || [ "$(cat node_modules/.eclat-lock.sha256)" != "$lock_hash" ]; then
  npm ci --no-audit --no-fund
  printf '%s\n' "$lock_hash" > node_modules/.eclat-lock.sha256
fi
# OS dependencies and the global Playwright CLI must be prepared once by the administrator.
npx --no-install playwright install chromium firefox webkit
