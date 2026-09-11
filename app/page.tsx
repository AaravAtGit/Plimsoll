import AnnouncementBar from "@/sections/AnnouncementBar";
import MotionProvider from "@/components/MotionProvider";
import Nav from "@/sections/Nav";
import Hero from "@/sections/Hero";
import Marquee from "@/sections/Marquee";
import TheQuestion from "@/sections/TheQuestion";
import Pipeline from "@/sections/Pipeline";
import Glossary from "@/sections/Glossary";
import HonestLimits from "@/sections/HonestLimits";
import Stack from "@/sections/Stack";
import Footer from "@/sections/Footer";

export default function Page() {
  return (
    <MotionProvider>
      <div className="min-h-screen bg-paper text-ink">
        <div className="sticky top-0 z-50">
          <AnnouncementBar />
          <Nav />
        </div>
        <main>
          <Hero />
          <Marquee />
          <TheQuestion />
          <Pipeline />
          <Glossary />
          <HonestLimits />
          <Stack />
        </main>
        <Footer />
      </div>
    </MotionProvider>
  );
}
