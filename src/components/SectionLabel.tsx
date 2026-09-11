type SectionLabelProps = {
  index: string;
  title: string;
  dark?: boolean;
  className?: string;
};

/** Nothing-style technical micro-label with red square bullet and trailing hairline. */
export default function SectionLabel({
  index,
  title,
  dark = false,
  className = "",
}: SectionLabelProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="h-2 w-2 shrink-0 bg-signal" aria-hidden />
      <span className={`label-mono ${dark ? "text-paper/70" : "text-ink"}`}>
        {index} / {title}
      </span>
      <span
        aria-hidden
        className={`h-px flex-1 ${dark ? "bg-paper/20" : "bg-ink/15"}`}
      />
    </div>
  );
}
