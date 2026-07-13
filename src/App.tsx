import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { SEO } from "./components/SEO";
import { GoogleAnalytics } from "./components/GoogleAnalytics";
import { lazy, Suspense } from "react";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";

const Gallery = lazy(() => import("./pages/Gallery"));
const Jobs = lazy(() => import("./pages/Jobs"));
const Pharma = lazy(() => import("./pages/Pharma"));
const Chemistry = lazy(() => import("./pages/Chemistry"));
const ChemistryCircuitBuilder = lazy(() => import("./pages/ChemistryCircuitBuilder"));
// Note: Settings route is disabled because Settings component doesn't exist yet

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <GoogleAnalytics />
          <Routes>
            <Route path="/" element={<><SEO title="Alpha ParadoxQC — Quantum Computing in Your Browser" description="Build, simulate, and run quantum circuits on real hardware. Free QPU credits included." url="/" /><Landing /></>} />
            <Route path="/builder" element={<><SEO title="Circuit Builder | Alpha ParadoxQC" description="Design and simulate quantum circuits visually before deploying to real QPUs." url="/builder" /><Index /></>} />
            <Route path="/auth" element={<><SEO title="Login | Alpha ParadoxQC" description="Sign in to Alpha ParadoxQC to access quantum computing resources and cloud hardware." url="/auth" /><Auth /></>} />
            <Route path="/chemistry/circuit-builder" element={
              <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>}>
                <SEO title="Chemistry Circuit Builder | Alpha ParadoxQC" description="Build specialized quantum circuits for molecular simulation and quantum chemistry." url="/chemistry/circuit-builder" />
                <ChemistryCircuitBuilder />
              </Suspense>
            } />
            <Route path="/gallery" element={
              <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>}>
                <SEO title="Quantum Circuit Gallery | Alpha ParadoxQC" description="Explore pre-built quantum algorithms and community-shared quantum circuits." url="/gallery" />
                <Gallery />
              </Suspense>
            } />
            <Route path="/jobs" element={
              <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>}>
                <SEO title="Job Manager | Alpha ParadoxQC" description="Track the status and results of your quantum computing jobs on cloud hardware." url="/jobs" />
                <Jobs />
              </Suspense>
            } />
            <Route path="/pharma" element={
              <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>}>
                <SEO title="Quantum Pharma | Alpha ParadoxQC" description="Accelerate drug discovery using quantum simulation and molecular modeling." url="/pharma" />
                <Pharma />
              </Suspense>
            } />
            <Route path="/chemistry" element={
              <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>}>
                <SEO title="Quantum Chemistry | Alpha ParadoxQC" description="Solve complex quantum chemistry problems utilizing real quantum processors." url="/chemistry" />
                <Chemistry />
              </Suspense>
            } />
            <Route path="*" element={<><SEO title="Page Not Found | Alpha ParadoxQC" description="The requested page could not be found." /><NotFound /></>} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
