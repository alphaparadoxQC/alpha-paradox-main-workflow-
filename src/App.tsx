import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { GoogleAnalytics } from "./components/GoogleAnalytics";
import { lazy, Suspense } from "react";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import { HelmetProvider } from "react-helmet-async";

const Gallery = lazy(() => import("./pages/Gallery"));
const Jobs = lazy(() => import("./pages/Jobs"));
const Chemistry = lazy(() => import("./pages/Chemistry"));
const ChemistryCircuitBuilder = lazy(() => import("./pages/ChemistryCircuitBuilder"));
const About = lazy(() => import("./pages/About"));
const CircuitBuilderLanding = lazy(() => import("./pages/products/CircuitBuilderLanding"));
const ChemistrySimulationLanding = lazy(() => import("./pages/products/ChemistrySimulationLanding"));
const ElectronicsBuilder = lazy(() => import("./pages/ElectronicsBuilder"));
// Note: Settings route is disabled because Settings component doesn't exist yet

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <GoogleAnalytics />
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/about" element={
                <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>}>
                  <About />
                </Suspense>
              } />
              <Route path="/products/circuit-builder" element={
                <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>}>
                  <CircuitBuilderLanding />
                </Suspense>
              } />
              <Route path="/products/chemistry-simulation" element={
                <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>}>
                  <ChemistrySimulationLanding />
                </Suspense>
              } />
              <Route path="/builder" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/chemistry/circuit-builder" element={
                <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>}>
                  <ChemistryCircuitBuilder />
                </Suspense>
              } />
              <Route path="/gallery" element={
                <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>}>
                  <Gallery />
                </Suspense>
              } />
              <Route path="/jobs" element={
                <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>}>
                  <Jobs />
                </Suspense>
              } />
              <Route path="/chemistry" element={
                <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>}>
                  <Chemistry />
                </Suspense>
              } />
              <Route path="/circuits" element={
                <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>}>
                  <ElectronicsBuilder />
                </Suspense>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
