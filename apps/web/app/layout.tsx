import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Plimsoll — The load line for autonomous agents",
  description:
    "Plimsoll — the load line for autonomous agents. Proof of enough, not proof of how much. A credit check that requires no disclosure.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Doto:wght@100..900&family=IBM+Plex+Mono:wght@400;500&family=Space+Grotesk:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
