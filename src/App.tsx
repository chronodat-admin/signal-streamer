import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/hooks/useTheme";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Strategies from "./pages/Strategies";
import StrategyDetail from "./pages/StrategyDetail";
import Signals from "./pages/Signals";
import Integrations from "./pages/Integrations";
import PublicStrategy from "./pages/PublicStrategy";
import Pricing from "./pages/Pricing";
import Billing from "./pages/Billing";
import Preferences from "./pages/Preferences";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/strategies" element={<Strategies />} />
              <Route path="/dashboard/strategies/:id" element={<StrategyDetail />} />
              <Route path="/dashboard/signals" element={<Signals />} />
              <Route path="/dashboard/integrations" element={<Integrations />} />
              <Route path="/s/:slug" element={<PublicStrategy />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/dashboard/billing" element={<Billing />} />
              <Route path="/dashboard/preferences" element={<Preferences />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
