import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import Today from "./pages/Today";
import Medications from "./pages/Medications";
import History from "./pages/History";
import More from "./pages/More";
import AddItem from "./pages/AddItem";
import StockManagement from "./pages/StockManagement";
import MedicalReports from "./pages/MedicalReports";
import Charts from "./pages/Charts";
import WeeklyCalendar from "./pages/WeeklyCalendar";
import Profile from "./pages/Profile";
import ProfileEdit from "./pages/ProfileEdit";
import ProfileCreate from "./pages/ProfileCreate";
import Privacy from "./pages/Privacy";
import SubscriptionManagement from "./pages/SubscriptionManagement";
import HelpSupport from "./pages/HelpSupport";
import Terms from "./pages/Terms";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Plans from "./pages/Plans";
import AlarmSettings from "./pages/AlarmSettings";
import Navigation from "./components/Navigation";
import ProtectedRoute from "./components/ProtectedRoute";
import Cofre from "./pages/Cofre";
import CofreUpload from "./pages/CofreUpload";
import CofreDocumento from "./pages/CofreDocumento";
import CompartilharDocumento from "./pages/CompartilharDocumento";
import DataExport from './pages/DataExport';
import DocumentScan from './pages/DocumentScan';
import CaregiverAccept from './pages/CaregiverAccept';
import ConsultationCardView from './pages/ConsultationCardView';
import Admin from './pages/Admin';
import NotificationSettings from "./pages/NotificationSettings";
import Tutorial from "./pages/Tutorial";
import OnboardingTour from "./components/OnboardingTour";

function AppContent() {
  const location = useLocation();
  const showNavigation = location.pathname !== "/auth";

  return (
    <>
      <OnboardingTour />
      <Toaster />
      <Sonner />
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={<Index />} />
        
        {/* Main Navigation Routes */}
        <Route path="/hoje" element={<ProtectedRoute><Today /></ProtectedRoute>} />
        <Route path="/medicamentos" element={<ProtectedRoute><Medications /></ProtectedRoute>} />
        <Route path="/historico" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/mais" element={<ProtectedRoute><More /></ProtectedRoute>} />
        
        {/* Secondary Routes */}
        <Route path="/adicionar" element={<ProtectedRoute><AddItem /></ProtectedRoute>} />
        <Route path="/estoque" element={<ProtectedRoute><StockManagement /></ProtectedRoute>} />
        <Route path="/cofre" element={<ProtectedRoute><Cofre /></ProtectedRoute>} />
        <Route path="/cofre/upload" element={<ProtectedRoute><CofreUpload /></ProtectedRoute>} />
        <Route path="/cofre/:id" element={<ProtectedRoute><CofreDocumento /></ProtectedRoute>} />
        <Route path="/compartilhar/:token" element={<CompartilharDocumento />} />
        <Route path="/relatorios" element={<ProtectedRoute><MedicalReports /></ProtectedRoute>} />
        <Route path="/perfil" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/profile/edit" element={<ProtectedRoute><ProfileEdit /></ProtectedRoute>} />
        <Route path="/perfis/novo" element={<ProtectedRoute><ProfileCreate /></ProtectedRoute>} />
        <Route path="/graficos" element={<ProtectedRoute><Charts /></ProtectedRoute>} />
        <Route path="/calendario" element={<ProtectedRoute><WeeklyCalendar /></ProtectedRoute>} />
        
        {/* Settings & Account */}
        <Route path="/tutorial" element={<ProtectedRoute><Tutorial /></ProtectedRoute>} />
        <Route path="/ajuda" element={<ProtectedRoute><HelpSupport /></ProtectedRoute>} />
        <Route path="/notificacoes" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />
        <Route path="/alarme" element={<ProtectedRoute><AlarmSettings /></ProtectedRoute>} />
        <Route path="/privacy" element={<ProtectedRoute><Privacy /></ProtectedRoute>} />
        <Route path="/terms" element={<ProtectedRoute><Terms /></ProtectedRoute>} />
        <Route path="/help-support" element={<ProtectedRoute><HelpSupport /></ProtectedRoute>} />
        <Route path="/assinatura" element={<ProtectedRoute><SubscriptionManagement /></ProtectedRoute>} />
        <Route path="/planos" element={<ProtectedRoute><Plans /></ProtectedRoute>} />
        <Route path="/exportar-dados" element={<ProtectedRoute><DataExport /></ProtectedRoute>} />
        
        {/* Utility Routes */}
        <Route path="/digitalizar" element={<ProtectedRoute><DocumentScan /></ProtectedRoute>} />
        <Route path="/cuidador/aceitar/:token" element={<CaregiverAccept />} />
        <Route path="/consulta/:token" element={<ConsultationCardView />} />
        <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
        
        <Route path="*" element={<NotFound />} />
          </Routes>
      {showNavigation && <Navigation />}
    </>
  );
}

const queryClient = new QueryClient();

const App = () => {
  console.log('App initializing', {
    hasSupabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
    hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    mode: import.meta.env.MODE
  });

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
