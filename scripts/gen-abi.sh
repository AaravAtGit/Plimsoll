#!/usr/bin/env bash
# Regenerate the typed ABIs the API routes import. Run after any contract change.
set -euo pipefail
cd "$(dirname "$0")/.."

gen() {
  echo "export const $2 = $(forge inspect --root contracts "$1" abi --json) as const;" \
    > "src/server/abi/$3.ts"
  echo "  src/server/abi/$3.ts"
}

echo "generating ABIs from contracts/"
gen PlimsollRegistry plimsollRegistryAbi plimsollRegistry
gen CreditDesk creditDeskAbi creditDesk
