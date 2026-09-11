import type { ReactNode } from "react";

type StarBorderProps = {
  children: ReactNode;
  className?: string;
};

/**
 * A rotating red arc traveling around a square border (the "star" ring).
 * The ring lives in CSS (.star-ring in index.css); content sits above it.
 */
export default function StarBorder({ children, className = "" }: StarBorderProps) {
  return (
    <div className={`relative ${className}`}>
      <span className="star-ring" aria-hidden />
      {children}
    </div>
  );
}
