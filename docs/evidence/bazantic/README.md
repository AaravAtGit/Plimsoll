# Evidence - Bazantic "Best Recipe that uses ETHGlobal Hackathon Sponsor APIs"

Four paid calls made with `baz curl --account demo` through the two live gateways, x402 settled
in test USDC on Base Sepolia (sandbox mode). Each file is the CLI's `--json` envelope:
`{ok, status, paid, body}` - `paid` carries the settlement transaction.

| Call | Gateway | HTTP | Settled on | Payment tx |
| --- | --- | --- | --- | --- |
| `1-getLadder.json` | plimsoll-survey `getLadder` | 200 | base-sepolia | [`0x46e45f9f…`](https://sepolia.basescan.org/tx/0x46e45f9f38444ee85619356b95d95d6ebc6a556f5a6ddbe6b44cb1be0c4fd461) |
| `2-deriveLine.json` | chainlink-price `deriveLine` | 200 | base-sepolia | [`0xa83943d3…`](https://sepolia.basescan.org/tx/0xa83943d32f29ceb10555406826312212dc00773c702590a8456564b541d66b86) |
| `3-requestSurvey.json` | plimsoll-survey `requestSurvey` | 202 | base-sepolia | [`0x351e541e…`](https://sepolia.basescan.org/tx/0x351e541ee13bcb13276d3ca848feb68e20147162c0024b8f9662d3df2e5c7725) |
| `4-getMark.json` | plimsoll-survey `getMark` | 200 | base-sepolia | [`0x016e3e5d…`](https://sepolia.basescan.org/tx/0x016e3e5d8ce9e9506b2921b296610f89af35d7f0fc2d6669907107649a039e4a) |

The flow is the composed Recipe, step by step: price the exposure at Chainlink and derive the Line
(call 2, gateway 1), request a Survey at that Line (call 3, gateway 2 - this sent a real Sepolia
transaction from the Plimsoll gateway wallet), then read the Mark back (call 4). Between 3 and 4
the CRE Survey workflow ran against the request transaction and posted the Mark through the
Forwarder; `4-getMark.json` shows it `settled` with its verdict.

Recipes: https://bazantic.com/recipes/underwrite-counterparty · https://bazantic.com/recipes/request-mark
