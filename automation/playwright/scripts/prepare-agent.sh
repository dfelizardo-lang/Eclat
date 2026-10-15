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
# The provider invokes npx from the checkout parent, not this project directory.
# Share this exact installation there to avoid a second Playwright runner.
node "$script_dir/link-workspace-runner.cjs"
# OS browser dependencies must be prepared once by the administrator.
node node_modules/playwright/cli.js install chromium firefox webkit
