import Ticker from "../components/bits/Ticker";

const ITEMS = [
  "ETHONLINE 2026",
  "CHAINLINK CONFIDENTIAL WORKFLOWS",
  "BAZANTIC RECIPES",
  "SEPOLIA TESTNET",
  "PROOF OF ENOUGH",
];

export default function AnnouncementBar() {
  return (
    <div className="border-b border-ink/10 bg-paper py-2">
      <Ticker items={ITEMS} />
    </div>
  );
}
