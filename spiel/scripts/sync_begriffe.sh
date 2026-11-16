#!/usr/bin/env bash
# Copy the course glossary (begriffe.yml at the root of this repository) into spiel/data/begriffe.yml.
# The glossary is maintained on the website only (decision 0003); this script
# is the one way the copy here changes.
#
#   spiel/scripts/sync_begriffe.sh
set -euo pipefail
src="${1:-$(dirname "$0")/../../begriffe.yml}"
dst="$(dirname "$0")/../data/begriffe.yml"
if [ ! -f "$src" ]; then
  echo "source not found: $src" >&2
  exit 1
fi
if cmp -s "$src" "$dst"; then
  echo "data/begriffe.yml is already identical to $src"
  exit 0
fi
cp "$src" "$dst"
echo "copied $src -> data/begriffe.yml"
echo "entries: $(grep -c '^  - term:' "$dst")"
