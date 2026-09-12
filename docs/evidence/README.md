# Evidence - Chainlink "Best Confidential Workflow"

The track accepts a Confidential Workflow simulation with the CRE CLI as qualifying evidence.

| File | What it shows |
| --- | --- |
| `simulate-above.log` | Full simulator output for the $50-rung Survey. `handlerInTee` requested TEE execution (AWS Nitro, us-west-2), the enclave leg ran, the report crossed back, `writeReport` executed. |
| `simulate-below.log` | The same for the $1000-rung Survey. |

Both runs used `config.staging.json` with `debug: false`, so no log line crosses the enclave
boundary - which is why the verdict is not printed. The verdicts are on Sepolia instead:

- ABOVE: https://sepolia.etherscan.io/tx/0x8c9ff398bbe53c86b7202f35a94eab088f20f4b73ef2d4ebab7d9c79973214d8
- BELOW: https://sepolia.etherscan.io/tx/0x2e6b30b63ab4688e8d9f918b95891598d5b13f4758f094dd2f16a886ec5c736c

Both were posted by the same workflow via `--broadcast` through the MockKeystoneForwarder the
registry was deployed against, from the request transactions named in the logs.
