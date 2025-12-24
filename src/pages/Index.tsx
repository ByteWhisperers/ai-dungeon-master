import Navbar from "@/components/game/Navbar";
import HeroSection from "@/components/game/HeroSection";
import FeaturesSection from "@/components/game/FeaturesSection";
import AttributesSection from "@/components/game/AttributesSection";
import ArchitectureSection from "@/components/game/ArchitectureSection";
import CTASection from "@/components/game/CTASection";
import Footer from "@/components/game/Footer";

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <section id="features">
        <FeaturesSection />
      </section>
      <section id="system">
        <AttributesSection />
      </section>
      <section id="architecture">
        <ArchitectureSection />
      </section>
      <CTASection />
      <Footer />
    </main>
  );
};

export default Index;
