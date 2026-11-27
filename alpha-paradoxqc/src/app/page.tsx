import { Navbar } from "@/components/Navbar";
import { QuantumScrollytelling } from "@/components/QuantumScrollytelling";
import { TechnologySection } from "@/components/TechnologySection";
import { AboutSection } from "@/components/AboutSection";
import { ProductsSection } from "@/components/ProductsSection";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-[#3B0A6B] selection:text-[#00E5FF]">
      <Navbar />
      <QuantumScrollytelling />
      <TechnologySection />
      <AboutSection />
      <ProductsSection />
    </main>
  );
}
