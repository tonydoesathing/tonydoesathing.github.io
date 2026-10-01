#!/usr/bin/env bash
set -euo pipefail

# The named volume keeps Linux dependencies separate from host dependencies.
# A new volume is owned by root; match the dev container user's mapped UID.
sudo chown "$(id -u):$(id -g)" node_modules
npm ci

printf '\nReady. Start the site with:\n  npm run dev -- --host 0.0.0.0\n\n'
