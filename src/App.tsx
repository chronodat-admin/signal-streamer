import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/hooks/useTheme";
import { PreferencesProvider } from "@/hooks/usePreferences";
import { LanguageProvider } from "@/i18n";
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
import AlertLogs from "./pages/AlertLogs";
import ApiKeys from "./pages/ApiKeys";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Contact from "./pages/Contact";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Leaderboard from "./pages/Leaderboard";
import CreatorDashboard from "./pages/CreatorDashboard";
import NotFound from "./pages/NotFound";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { UserManagement } from "./pages/admin/UserManagement";
import { SubscribedUsers } from "./pages/admin/SubscribedUsers";
import { ContactMessages } from "./pages/admin/ContactMessages";
import { UserFeedback } from "./pages/admin/UserFeedback";
import { ErrorLogs } from "./pages/admin/ErrorLogs";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <PreferencesProvider>
        <LanguageProvider>
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
              <Route path="/dashboard/logs" element={<AlertLogs />} />
              <Route path="/dashboard/api-keys" element={<ApiKeys />} />
              <Route path="/s/:slug" element={<PublicStrategy />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/dashboard/billing" element={<Billing />} />
              <Route path="/dashboard/preferences" element={<Preferences />} />
              <Route path="/dashboard/creator" element={<CreatorDashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<UserManagement />} />
              <Route path="/admin/subscriptions" element={<SubscribedUsers />} />
              <Route path="/admin/contact" element={<ContactMessages />} />
              <Route path="/admin/feedback" element={<UserFeedback />} />
              <Route path="/admin/errors" element={<ErrorLogs />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </LanguageProvider>
      </PreferencesProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
