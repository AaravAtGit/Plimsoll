type TickerProps = {
  items: string[];
  className?: string;
};

/** Horizontal CSS marquee for the announcement bar. */
export default function Ticker({ items, className = "" }: TickerProps) {
  const Row = ({ hidden = false }: { hidden?: boolean }) => (
    <div
      aria-hidden={hidden}
      className="flex w-max shrink-0 items-center animate-marquee"
    >
      {items.map((item, i) => (
        <span key={i} className="label-mono flex items-center whitespace-nowrap">
          <span className="px-5">{item}</span>
          <span className="inline-block h-1.5 w-1.5 bg-signal" />
        </span>
      ))}
    </div>
  );

  return (
    <div className={`overflow-hidden ${className}`}>
      <div className="flex w-max">
        <Row />
        <Row hidden />
      </div>
    </div>
  );
}
