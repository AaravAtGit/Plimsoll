#!/usr/bin/env bash
# Regenerate the typed ABIs the gateway imports. Run after any contract change.
set -euo pipefail
cd "$(dirname "$0")/.."

gen() {
  echo "export const $2 = $(forge inspect --root contracts "$1" abi --json) as const;" \
    > "apps/gateway/src/abi/$3.ts"
  echo "  apps/gateway/src/abi/$3.ts"
}

echo "generating ABIs from contracts/"
gen PlimsollRegistry plimsollRegistryAbi plimsollRegistry
gen CreditDesk creditDeskAbi creditDesk
