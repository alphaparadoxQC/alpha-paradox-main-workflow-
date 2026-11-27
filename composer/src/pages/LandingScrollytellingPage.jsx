import React from 'react';
import Navbar from '../components/landing/Navbar';
import QuantumScrollytelling from '../components/landing/QuantumScrollytelling';
import { TechnologySection } from '../components/landing/TechnologySection';
import ProductsSection from '../components/landing/ProductsSection';
import { AboutSection } from '../components/landing/AboutSection';
import '../styles/alpha-paradoxqc.css';

export default function LandingScrollytellingPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-[#3B0A6B] selection:text-[#00E5FF]">
      <Navbar />
      <QuantumScrollytelling />
      <TechnologySection />
      <ProductsSection />
      <AboutSection />
    </main>
  );
}
