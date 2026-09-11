import type { Metadata } from "next";
import AnnouncementBar from "@/sections/AnnouncementBar";
import Nav from "@/sections/Nav";
import Footer from "@/sections/Footer";
import MotionProvider from "@/components/MotionProvider";
import ProtocolGuide from "@/components/guide/ProtocolGuide";

export const metadata: Metadata = {
  title: "Protocol Guide & Architecture — Plimsoll",
  description:
    "Comprehensive guide to the Plimsoll protocol. Learn about AWS Nitro enclave confidentiality boundaries, Chainlink CRE workflows, valuation haircuts, Standing anti-flash-loan proofs, and Bazantic 2-service recipes.",
};

export default function GuidePage() {
  return (
    <MotionProvider>
      <div className="min-h-screen bg-paper text-ink">
        <div className="sticky top-0 z-50">
          <AnnouncementBar />
          <Nav />
        </div>
        <main className="py-6">
          <ProtocolGuide />
        </main>
        <Footer />
      </div>
    </MotionProvider>
  );
}
