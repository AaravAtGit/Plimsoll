/** The classic Plimsoll load-line disc: a circle struck through by a horizontal line. */
export function LoadDisc({
  className = "",
  lineClass = "stroke-signal",
}: {
  className?: string;
  lineClass?: string;
}) {
  return (
    <svg viewBox="0 0 56 24" className={className} aria-hidden>
      <circle
        cx="28"
        cy="12"
        r="9"
        fill="none"
        className="stroke-current"
        strokeWidth="1.5"
      />
      <line
        x1="0"
        y1="12"
        x2="56"
        y2="12"
        className={lineClass}
        strokeWidth="1.5"
      />
    </svg>
  );
}

/**
 * Hairline ship hull crossed by the red summer load line, with the TF/F/T/S/W
 * ladder of marks. `hullY` shifts the hull vertically (the sink-and-settle effect).
 */
export function HullLine({
  className = "",
  hullY = 0,
}: {
  className?: string;
  hullY?: number;
}) {
  const waterY = 118;
  const ladder: { label: string; y: number; red?: boolean }[] = [
    { label: "TF", y: 38 },
    { label: "F", y: 64 },
    { label: "T", y: 90 },
    { label: "S", y: waterY, red: true },
    { label: "W", y: 146 },
  ];

  return (
    <svg
      viewBox="0 0 1200 240"
      className={className}
      role="img"
      aria-label="A ship hull at the summer load line, with the TF, F, T, S and W draft marks"
    >
      {/* ladder of draft marks, left of the hull */}
      <g className="stroke-current" strokeWidth="1">
        {ladder.map((m) => (
          <g key={m.label}>
            <line
              x1="52"
              y1={m.y}
              x2="132"
              y2={m.y}
              className={m.red ? "stroke-signal" : undefined}
              strokeWidth={m.red ? 2 : 1}
            />
            <text
              x="12"
              y={m.y + 3.5}
              className="fill-current font-mono"
              fontSize="11"
              letterSpacing="2"
            >
              {m.label}
            </text>
          </g>
        ))}
      </g>

      {/* hull silhouette — sinks/rises with hullY while the waterline stays fixed */}
      <g style={{ transform: `translateY(${hullY}px)` }}>
        <path
          d="M210 28 H990 L968 152 C948 212 872 232 780 234 H420 C328 232 252 212 232 152 Z"
          fill="none"
          className="stroke-current"
          strokeWidth="1"
        />
        <line
          x1="210"
          y1="66"
          x2="990"
          y2="66"
          className="stroke-current"
          strokeWidth="1"
          strokeDasharray="3 6"
        />
        <text
          x="600"
          y="56"
          textAnchor="middle"
          className="fill-current font-mono"
          fontSize="10"
          letterSpacing="3"
        >
          DECK
        </text>
        <text
          x="600"
          y="150"
          textAnchor="middle"
          className="fill-current font-mono"
          fontSize="10"
          letterSpacing="3"
        >
          HOLD — SEALED
        </text>
      </g>

      {/* the load line itself: full width, red, through the S mark */}
      <line
        x1="0"
        y1={waterY}
        x2="1200"
        y2={waterY}
        className="stroke-signal"
        strokeWidth="1.5"
      />
      {/* disc on the line, mid-hull */}
      <g>
        <circle
          cx="600"
          cy={waterY}
          r="20"
          fill="none"
          className="stroke-current"
          strokeWidth="1.5"
        />
      </g>
    </svg>
  );
}
