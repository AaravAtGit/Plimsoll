import type {Metadata} from "next";
import AnnouncementBar from "@/sections/AnnouncementBar";
import Nav from "@/sections/Nav";
import Footer from "@/sections/Footer";
import MotionProvider from "@/components/MotionProvider";
import HarbourBoard from "@/components/dashboard/HarbourBoard";

export const metadata: Metadata = {
  title: "Harbour Board — Plimsoll",
  description:
    "A live console over the Plimsoll registry on Sepolia. Derive a Line from a deal, request a confidential Survey, and watch the enclave answer with one bit.",
};

export default function DashboardPage() {
  return (
    <MotionProvider>
      <div className="min-h-screen bg-enclave">
        <div className="sticky top-0 z-50 text-ink">
          <AnnouncementBar />
          <Nav />
        </div>
        <main>
          <HarbourBoard />
        </main>
        <Footer />
      </div>
    </MotionProvider>
  );
}
