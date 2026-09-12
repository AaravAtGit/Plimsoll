import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import StarBorder from "../components/bits/StarBorder";
import { LoadDisc } from "../components/LoadLine";

const LINKS = [
  { label: "OVERVIEW", href: "/#question" },
  { label: "PIPELINE", href: "/#survey" },
  { label: "GUIDE", href: "/guide" },
  { label: "STACK", href: "/#stack" },
];

export default function Nav() {
  return (
    <header className="border-b border-ink/10 bg-paper">
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-5 md:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <LoadDisc className="h-5 w-12 text-ink" />
          <span className="font-doto text-lg font-black tracking-tight">
            PLIMSOLL
          </span>
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="label-mono text-ink/70 transition-colors hover:text-signal"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <StarBorder className="group">
          <Link
            href="/guide"
            className="label-mono flex items-center gap-1.5 bg-paper px-4 py-2 text-ink transition-colors group-hover:text-signal"
          >
            READ THE GUIDE
            <ArrowUpRight size={13} strokeWidth={1.5} />
          </Link>
        </StarBorder>
      </nav>
    </header>
  );
}

