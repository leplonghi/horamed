import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import Today from "./pages/Today";
import Rotina from "./pages/Rotina";
import AddItem from "./pages/AddItem";
import StockManagement from "./pages/StockManagement";
import MedicalReports from "./pages/MedicalReports";
import Charts from "./pages/Charts";
import WeeklyCalendar from "./pages/WeeklyCalendar";
import Profile from "./pages/Profile";
import ProfileEdit from "./pages/ProfileEdit";
import ProfileCreate from "./pages/ProfileCreate";
import Notifications from "./pages/Notifications";
import Privacy from "./pages/Privacy";
import SubscriptionManagement from "./pages/SubscriptionManagement";
import HelpSupport from "./pages/HelpSupport";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Plans from "./pages/Plans";
import AlarmSettings from "./pages/AlarmSettings";
import Navigation from "./components/Navigation";
import ProtectedRoute from "./components/ProtectedRoute";
import Pharmacy from "./pages/Pharmacy";
import Emergency from "./pages/Emergency";
import MyDoses from "./pages/MyDoses";
import Cofre from "./pages/Cofre";
import CofreUpload from "./pages/CofreUpload";
import CofreDocumento from "./pages/CofreDocumento";
import CompartilharDocumento from "./pages/CompartilharDocumento";

function AppContent() {
  const location = useLocation();
  const showNavigation = location.pathname !== "/auth";

  return (
    <>
      <Toaster />
      <Sonner />
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={<ProtectedRoute><Today /></ProtectedRoute>} />
        <Route path="/index" element={<Index />} />
        <Route path="/rotina" element={<ProtectedRoute><Rotina /></ProtectedRoute>} />
        <Route path="/calendario" element={<ProtectedRoute><WeeklyCalendar /></ProtectedRoute>} />
        <Route path="/adicionar" element={<ProtectedRoute><AddItem /></ProtectedRoute>} />
        <Route path="/estoque" element={<ProtectedRoute><StockManagement /></ProtectedRoute>} />
        <Route path="/perfil" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/relatorios" element={<ProtectedRoute><MedicalReports /></ProtectedRoute>} />
        <Route path="/profile/edit" element={<ProtectedRoute><ProfileEdit /></ProtectedRoute>} />
        <Route path="/perfis/novo" element={<ProtectedRoute><ProfileCreate /></ProtectedRoute>} />
        <Route path="/assinatura" element={<ProtectedRoute><SubscriptionManagement /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/alarme" element={<ProtectedRoute><AlarmSettings /></ProtectedRoute>} />
        <Route path="/privacy" element={<ProtectedRoute><Privacy /></ProtectedRoute>} />
        <Route path="/help-support" element={<ProtectedRoute><HelpSupport /></ProtectedRoute>} />
        <Route path="/graficos" element={<ProtectedRoute><Charts /></ProtectedRoute>} />
        <Route path="/planos" element={<ProtectedRoute><Plans /></ProtectedRoute>} />
        <Route path="/farmacia" element={<ProtectedRoute><Pharmacy /></ProtectedRoute>} />
        <Route path="/emergencia" element={<ProtectedRoute><Emergency /></ProtectedRoute>} />
        <Route path="/doses" element={<ProtectedRoute><MyDoses /></ProtectedRoute>} />
        <Route path="/cofre" element={<ProtectedRoute><Cofre /></ProtectedRoute>} />
        <Route path="/cofre/upload" element={<ProtectedRoute><CofreUpload /></ProtectedRoute>} />
        <Route path="/cofre/:id" element={<ProtectedRoute><CofreDocumento /></ProtectedRoute>} />
        <Route path="/compartilhar/:token" element={<CompartilharDocumento />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {showNavigation && <Navigation />}
    </>
  );
}

const queryClient = new QueryClient();

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <TooltipProvider>
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
