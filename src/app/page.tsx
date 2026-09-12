import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ContactSection from "@/components/ContactSection";
import AppOverview from "@/components/AppOverview";
import PricingSection from "@/components/PricingSection";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-black text-white antialiased">
      <Navbar />
      <Hero />
      <AppOverview />
      <PricingSection />
      <ContactSection />
    </main>
  );
}
