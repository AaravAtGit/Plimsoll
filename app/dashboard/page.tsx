import type { Metadata } from "next";
import AnnouncementBar from "@/sections/AnnouncementBar";
import Nav from "@/sections/Nav";
import Footer from "@/sections/Footer";
import MotionProvider from "@/components/MotionProvider";
import ProtocolDashboard from "@/components/dashboard/ProtocolDashboard";

export const metadata: Metadata = {
  title: "Console & Dashboard — Plimsoll Protocol",
  description:
    "Connect to Plimsoll protocol. Run the Bazantic composed 2-service underwriting flow, provision private hold credentials into Chainlink Vault DON, manage Line ladders, and inspect onchain Marks.",
};

export default function DashboardPage() {
  return (
    <MotionProvider>
      <div className="min-h-screen bg-paper text-ink">
        <div className="sticky top-0 z-50">
          <AnnouncementBar />
          <Nav />
        </div>
        <main className="py-6">
          <ProtocolDashboard />
        </main>
        <Footer />
      </div>
    </MotionProvider>
  );
}
