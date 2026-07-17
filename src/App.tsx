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
const Pharma = lazy(() => import("./pages/Pharma"));
const Chemistry = lazy(() => import("./pages/Chemistry"));
const ChemistryCircuitBuilder = lazy(() => import("./pages/ChemistryCircuitBuilder"));
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
              <Route path="/pharma" element={
                <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>}>
                  <Pharma />
                </Suspense>
              } />
              <Route path="/chemistry" element={
                <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>}>
                  <Chemistry />
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
