# Prompt — Plimsoll Landing Page

Copy everything below the line into your builder (v0 / Lovable / Claude Code / a frontend dev). It is self-contained.

---

Build the landing page for **Plimsoll** — "the load line for autonomous agents." Plimsoll is a credit check for AI agents that requires no disclosure: a counterparty asks one question — *"Is this agent above the line?"* — and a Chainlink confidential workflow, running inside an AWS Nitro enclave, reads the subject agent's private holdings, values them at Chainlink prices, and emits exactly one bit onchain: a boolean **Mark**. No balance, no price, no amounts — ever. Tagline to keep everywhere: **"Proof of enough, not proof of how much."**

You are building a single-page marketing site with one signature scroll experience. The aesthetic is **Nothing (the phone brand) dot-matrix industrialism, crossed with maritime instrumentation, executed with Myrad-level (myradhq.xyz) cleanliness**: white paper background, black dot-grid type, one signal-red accent, hairline rules, technical micro-labels, and a horizontal-scrolling pipeline section. Monochrome discipline everywhere — red is used for exactly four things: the load line, `BELOW` verdicts, live status dots, and primary CTA hover.

## Stack

- Vite + React 18 + TypeScript + Tailwind CSS
- `motion` (framer-motion) for scroll-driven animation
- **React Bits** components (reactbits.dev — install via `npx @react-bits/add`, use the Tailwind/CSS variant). If any component name below has changed in the current catalog, substitute the nearest equivalent.
- Icons: `lucide-react` (prefer `Plus`, `Minus`, `ArrowRight`, `Anchor`, `ShieldCheck`, `Radio` — thin strokes, 1.5px)
- No other UI kit. No gradients. No glassmorphism. No drop shadows except a single flat offset shadow on cards (hard-edged, black 100%, no blur — like a printed card).

## Design system

**Colors**
- Paper: `#FAFAF7` (page background)
- Ink: `#0A0A0A` (text, borders, dots)
- Signal red: `#D71921` (Nothing red — the only accent)
- Enclave black: `#050505` with dots in `#1E1E1E` for the dark sections
- Above-line chip: ink on paper. Below-line chip: red on paper.

**Typography**
- Display / numerals: **Doto** (Google Fonts, variable dot-matrix) — weight 700–900 for the hero and all big numbers. This is the Nothing Ndot-55 look. Use it ONLY for display; never for body.
- Body: **Space Grotesk** (or Satoshi via Fontshare) 400/500.
- Technical labels: **IBM Plex Mono** or **Space Mono**, uppercase, `tracking-[0.2em]`, 11px.
- Every section gets a Nothing-style micro-label top-left: `01 / THE QUESTION`, `02 / THE SURVEY`, `03 / THE GLOSSARY`, `04 / THE HONEST LIMITS`, `05 / THE STACK` — mono, ink, with a small red square bullet.

**Texture & rules**
- 1px ink hairlines divide everything; square corners (`rounded-none`); generous whitespace.
- Dot-grid texture as the only ornament — React Bits `DotGrid` (or a static dot-grid CSS background at 8% opacity) behind the hero and footer.
- Nothing-style toggles/plus-minus affordances for interactive bits.
- The load line motif: a horizontal red rule with a small circle-and-crossbars Plimsoll disc (the classic load-line mark: a circle with a horizontal line through it) used as a divider, section marker, and scroll-progress indicator. Draw it as inline SVG.

## Page structure (top to bottom)

### 0 · Announcement bar (fixed top)
React Bits **Ticker** — thin ink bar on paper: `ETHONLINE 2026 ● CHAINLINK CONFIDENTIAL WORKFLOWS ● BAZANTIC RECIPES ● SEPOLIA TESTNET ●` repeating. 11px mono.

### 1 · Nav
Left: dot-matrix wordmark `PLIMSOLL` in Doto with the load-line disc as the O. Right: mono links (The Question, The Survey, Glossary, Stack) + a React Bits **StarBorder** button `GET A MARK` (square corners, red on hover). Nav is hairline-bordered, paper background, `backdrop-blur` never — flat print look.

### 2 · Hero
- Background: React Bits **DotGrid**, low opacity, cursor-reactive (this is the site's "alive" texture).
- Center: React Bits **SplitText** on the Doto headline, char-stagger on load:
  `PROOF OF ENOUGH,` (line 1, ink) `NOT PROOF OF HOW MUCH.` (line 2, the word `MUCH` in signal red dots).
- Subhead (Space Grotesk, one sentence): "A counterparty asks one question — is this agent above the line? — and a Chainlink enclave answers with a single onchain bit. No balances. No disclosure."
- Two CTAs: primary `REQUEST A SURVEY` (React Bits **Magnet** + **ClickSpark** on click), secondary `READ THE CONTRACT` as a plain underlined mono link.
- Bottom of hero: the **load line** — a full-width horizontal red line crossing a faint ship-hull silhouette (inline SVG, hairline stroke), with the classic Plimsoll ladder of marks (TF / T / W / S / F) ticked in mono. As the user scrolls, the hull "sinks" a few pixels past the line and settles back — subtle, 4px max.

### 3 · Marquee
React Bits **ScrollVelocity** tied to scroll speed: `ONE BIT · NO AMOUNTS · IN AN ENCLAVE · ONCHAIN · NEVER LOGGED · NEVER WRITTEN ·` — Doto 900, large, ink on paper, hairlines above and below.

### 4 · The Question (static section, light)
Three flat cards in a hairline grid (use React Bits **GlareHover** or **SpotlightCard** styled monochrome — white glare only):
1. `DISCLOSE EVERYTHING` — "Now the counterparty knows exactly how hard to squeeze. So does anyone they leak it to."
2. `TRUST THE WORD` — "Which is worth nothing."
3. `ASK THE LINE` (this card inverted: ink background, paper dots, red disc) — "Is this agent above the line? Yes or no. That is the whole product."

### 5 · THE SURVEY — horizontal scroll pipeline (the signature section)
This is the Myrad-style horizontal scroll hack and the centerpiece. Five panels tell the pipeline as a left-to-right journey through a ship:

**Implementation (non-negotiable spec):**
```tsx
const sectionRef = useRef(null);
const { scrollYProgress } = useScroll({ target: sectionRef });
const x = useTransform(scrollYProgress, [0, 1], ["0%", "-80%"]); // track = 5 × 100vw minus one viewport
// <section ref={sectionRef} className="relative h-[500vh]">
//   <div className="sticky top-0 h-screen overflow-hidden">
//     <motion.div style={{ x }} className="flex h-full w-[500vw]">{panels}</motion.div>
//   </div>
// </section>
```
A fixed progress bar at the bottom of the sticky viewport: the load line filling left→right in red, panel index `01–05` in mono beside it. On mobile (<768px) and for `prefers-reduced-motion`, collapse to a native `overflow-x-auto` scroll-snap carousel of the same panels.

**The panels** (each 100vw, hairline-separated, numbered):
1. **01 / THE QUESTION** — the deal: a buyer agent wants `60 ETH of compute, net-30`. Big Doto `60 ETH` → `$246,000` exposure → the derived Line: `observed_net_assets_usd ≥ 250,000`. Show the arithmetic as printed ledger lines.
2. **02 / THE HOLD** — background flips to Enclave black (dots `#1E1E1E`). AWS Nitro enclave drawn as a hairline container labeled `cre.handlerInTee · nitro · us-west-2`. Inside: `runtime.getSecret()` → Vault DON; holdings fetched; prices fetched. Every line in mono. React Bits **ScrambleText** on the secret id `CEX_RO_…` to make it feel live. A Nothing-style red status dot pulses.
3. **03 / THE VALUATION** — still dark. The haircut table as an instrument panel, printed flat: USDC/USDT `1.00` · ETH/WETH/BTC `0.90` · all else `0.75`. A Doto counter (React Bits **CountUp**) ticks up to the haircut value, then immediately redacts to `██████` — the number appears for 400ms and is struck through. Caption: "You don't get to see this. Neither does the node operator."
4. **04 / THE CROSSING** — the one-way door. A vertical red hairline splits the panel; left side dark (enclave), right side paper (DON). `runtime.usingTheDons()` as a labeled gate. The crossing payload printed as a struct on the door: `{ surveyId, subjectId, lineId, verdict, asOf, sourceSetHash }` — and below, crossed out in red: `balance · price · headroom`. This panel is the money shot; give it the most craft.
5. **05 / THE MARK** — back on paper. A single onchain Mark rendered as a printed certificate card (hairline border, hard offset shadow): verdict `ABOVE`, `asOf`, `expiry`, `surveyId`, `workflowId` — React Bits **StarBorder** slow pulse on the verdict chip. Caption: "Public and verifiable. Containing nothing."

### 6 · The Glossary
Five terms as flat index cards in a hairline grid, each with a Doto numeral and React Bits **AnimatedList** stagger on scroll-in: **HOLD** (the private balance sheet; never leaves the enclave) · **LINE** (the threshold predicate) · **SURVEY** (one confidential execution) · **MARK** (the signed onchain boolean) · **STANDING** (an unbroken run of true Marks — what a counterparty actually underwrites against).

### 7 · The Honest Limits
Four plain statements in a 2×2 hairline grid, mono labels, no icons — confidence through plainness: "The Line ladder *is* the disclosure." / "A false verdict leaks more than a true one." / "The code is public; only the data is private." / "Rate limits are the privacy mechanism."

### 8 · The Stack
Two flat cards side by side: **CHAINLINK** (CRE Confidential Workflows · Nitro enclave · Price Feeds · Vault DON · Sepolia) and **BAZANTIC** (x402-paid Survey gateway · MCP server · the `underwrite_counterparty` Recipe). Between them, an arrow labeled `data moves →` (price → Line → verdict). Below, a React Bits **IconCloud** or a simple hairline logo row: ETHOnline 2026 · Chainlink · Bazantic · Base-less — keep it monochrome.

### 9 · Final CTA + Footer
Enclave-black full-bleed. React Bits **ShinyText** sweep across a giant Doto line: `ASK THE LINE.` Primary CTA repeats (Magnet + ClickSpark, now inverted paper-on-ink). Footer: dot-matrix `PLIMSOLL` wordmark, the load-line disc, mono links (Registry on Sepolia, Recipe, Demo video, GitHub), and one last ticker line: "Never logged. Never written. Never seen."

## Motion rules

- Restrained. Entrances: 150–250ms, 12px rise, `ease-out`. No parallax soup, no scroll-hijacking outside section 5.
- The only long animations: the horizontal pipeline (scrubbed by scroll) and slow pulses on StarBorder verdicts.
- All text stays real text (accessibility): Doto is display-only, body copy is Space Grotesk; respect `prefers-reduced-motion` (kill DotGrid interactivity, SplitText, and the scrub; show static panels).
- Performance: one canvas background at a time; lazy-mount panels 2–5 of the pipeline; target 60fps mid-scroll on a 2019 laptop, Lighthouse Performance ≥ 90.

## Copy tone

Terse, declarative, zero hype — the README's voice. Short sentences. No "revolutionary," no "seamless," no exclamation marks. Numbers are written like instrument readings, not marketing stats.

## Definition of done

1. A visitor who has never heard of Plimsoll can, after one scroll, explain what a Mark is and why no amounts appear onchain.
2. The horizontal pipeline works with wheel, trackpad, touch, and keyboard (Tab through panels on mobile), and degrades gracefully.
3. Monochrome + red discipline holds on every screen; no color exists outside the system.
4. Everything is responsive 360px → 1920px; the dot-matrix never renders below 24px (illegible dots).
