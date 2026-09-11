import SectionLabel from "@/components/SectionLabel";

const LIMITS: { n: string; title: string; body: string }[] = [
  {
    n: "L1",
    title: "THE LADDER IS THE DISCLOSURE.",
    body: "A subject registering four Lines publishes two bits of its balance to anyone willing to pay four times. Consented, quantised — not magic. We say so.",
  },
  {
    n: "L2",
    title: "FALSE LEAKS MORE THAN TRUE.",
    body: "A true Mark gives a lower bound. A false one gives an upper bound — the more sensitive direction. Subjects opt in per Line to having false published at all.",
  },
  {
    n: "L3",
    title: "THE CODE IS PUBLIC.",
    body: "CRE protects the data processed inside the enclave, not the logic. Haircuts and the Line grammar are public by design.",
  },
  {
    n: "L4",
    title: "RATE LIMITS ARE THE PRIVACY MECHANISM.",
    body: "A few cents deters no one. The pair-scoped counter — per subject, per requester — is what does.",
  },
];

/**
 * Each cell draws a red border on hover: four hairlines scale in sequence
 * (top → right → bottom → left), like an instrument marking the cell.
 */
function BorderDraw() {
  const sides = [
    "left-0 top-0 h-px w-full origin-left scale-x-0 delay-[0ms]",
    "right-0 top-0 h-full w-px origin-top scale-y-0 delay-[90ms]",
    "bottom-0 left-0 h-px w-full origin-right scale-x-0 delay-[180ms]",
    "left-0 bottom-0 h-full w-px origin-bottom scale-y-0 delay-[270ms]",
  ];
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0">
      {sides.map((s) => (
        <span
          key={s}
          className={`absolute bg-signal transition-transform duration-200 ease-out group-hover:scale-x-100 group-hover:scale-y-100 ${s}`}
        />
      ))}
    </span>
  );
}

export default function HonestLimits() {
  return (
    <section className="border-b border-ink/10">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <SectionLabel index="04" title="THE HONEST LIMITS" className="mb-12" />
        <div className="grid gap-px border border-ink/20 bg-ink/15 md:grid-cols-2">
          {LIMITS.map((l) => (
            <div
              key={l.n}
              className="group relative bg-paper p-7 transition-colors duration-200 hover:bg-white md:p-10"
            >
              <BorderDraw />
              <div className="flex items-baseline gap-4">
                <span className="label-mono text-signal">{l.n}</span>
                <h3 className="font-doto text-lg font-black tracking-tight transition-transform duration-200 group-hover:translate-x-1 md:text-xl">
                  {l.title}
                </h3>
              </div>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-ink/70">
                {l.body}
              </p>
              <span
                aria-hidden
                className="absolute right-6 top-6 hidden h-1.5 w-1.5 bg-signal opacity-0 transition-opacity duration-200 group-hover:opacity-100 md:block"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
