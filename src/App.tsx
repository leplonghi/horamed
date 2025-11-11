import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PageErrorBoundary } from "@/components/PageErrorBoundary";
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
import HealthDashboard from "./pages/HealthDashboard";
import MedicationHistory from "./pages/MedicationHistory";
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
import HealthTimeline from "./pages/HealthTimeline";
import OnboardingScreens from "./components/OnboardingScreens";
import { SubscriptionProvider } from "./contexts/SubscriptionContext";

function AppContent() {
  const location = useLocation();
  const showNavigation = location.pathname !== "/auth";

  return (
    <>
      <OnboardingScreens />
      <Toaster />
      <Sonner />
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={<Index />} />
        
        {/* Main Navigation Routes */}
        <Route path="/hoje" element={<ProtectedRoute><PageErrorBoundary><Today /></PageErrorBoundary></ProtectedRoute>} />
        <Route path="/medicamentos" element={<ProtectedRoute><PageErrorBoundary><Medications /></PageErrorBoundary></ProtectedRoute>} />
        <Route path="/historico" element={<ProtectedRoute><PageErrorBoundary><History /></PageErrorBoundary></ProtectedRoute>} />
        <Route path="/mais" element={<ProtectedRoute><PageErrorBoundary><More /></PageErrorBoundary></ProtectedRoute>} />
        
        {/* Secondary Routes */}
        <Route path="/adicionar" element={<ProtectedRoute><PageErrorBoundary><AddItem /></PageErrorBoundary></ProtectedRoute>} />
        <Route path="/estoque" element={<ProtectedRoute><PageErrorBoundary><StockManagement /></PageErrorBoundary></ProtectedRoute>} />
        <Route path="/cofre" element={<ProtectedRoute><PageErrorBoundary><Cofre /></PageErrorBoundary></ProtectedRoute>} />
        <Route path="/cofre/upload" element={<ProtectedRoute><PageErrorBoundary><CofreUpload /></PageErrorBoundary></ProtectedRoute>} />
        <Route path="/cofre/:id" element={<ProtectedRoute><PageErrorBoundary><CofreDocumento /></PageErrorBoundary></ProtectedRoute>} />
        <Route path="/compartilhar/:token" element={<PageErrorBoundary><CompartilharDocumento /></PageErrorBoundary>} />
        <Route path="/relatorios" element={<ProtectedRoute><PageErrorBoundary><MedicalReports /></PageErrorBoundary></ProtectedRoute>} />
        <Route path="/perfil" element={<ProtectedRoute><PageErrorBoundary><Profile /></PageErrorBoundary></ProtectedRoute>} />
        <Route path="/profile/edit" element={<ProtectedRoute><PageErrorBoundary><ProfileEdit /></PageErrorBoundary></ProtectedRoute>} />
        <Route path="/perfis/novo" element={<ProtectedRoute><PageErrorBoundary><ProfileCreate /></PageErrorBoundary></ProtectedRoute>} />
        <Route path="/graficos" element={<ProtectedRoute><PageErrorBoundary><Charts /></PageErrorBoundary></ProtectedRoute>} />
        <Route path="/calendario" element={<ProtectedRoute><PageErrorBoundary><WeeklyCalendar /></PageErrorBoundary></ProtectedRoute>} />
        <Route path="/evolucao" element={<ProtectedRoute><PageErrorBoundary><HealthDashboard /></PageErrorBoundary></ProtectedRoute>} />
        <Route path="/timeline" element={<ProtectedRoute><PageErrorBoundary><HealthTimeline /></PageErrorBoundary></ProtectedRoute>} />
        <Route path="/medicamentos/:id/historico" element={<ProtectedRoute><PageErrorBoundary><MedicationHistory /></PageErrorBoundary></ProtectedRoute>} />
        
        {/* Settings & Account */}
        <Route path="/tutorial" element={<ProtectedRoute><PageErrorBoundary><Tutorial /></PageErrorBoundary></ProtectedRoute>} />
        <Route path="/ajuda" element={<ProtectedRoute><PageErrorBoundary><HelpSupport /></PageErrorBoundary></ProtectedRoute>} />
        <Route path="/notificacoes" element={<ProtectedRoute><PageErrorBoundary><NotificationSettings /></PageErrorBoundary></ProtectedRoute>} />
        <Route path="/alarme" element={<ProtectedRoute><PageErrorBoundary><AlarmSettings /></PageErrorBoundary></ProtectedRoute>} />
        <Route path="/privacy" element={<ProtectedRoute><PageErrorBoundary><Privacy /></PageErrorBoundary></ProtectedRoute>} />
        <Route path="/terms" element={<ProtectedRoute><PageErrorBoundary><Terms /></PageErrorBoundary></ProtectedRoute>} />
        <Route path="/help-support" element={<ProtectedRoute><PageErrorBoundary><HelpSupport /></PageErrorBoundary></ProtectedRoute>} />
        <Route path="/assinatura" element={<ProtectedRoute><PageErrorBoundary><SubscriptionManagement /></PageErrorBoundary></ProtectedRoute>} />
        <Route path="/planos" element={<ProtectedRoute><PageErrorBoundary><Plans /></PageErrorBoundary></ProtectedRoute>} />
        <Route path="/exportar-dados" element={<ProtectedRoute><PageErrorBoundary><DataExport /></PageErrorBoundary></ProtectedRoute>} />
        
        {/* Utility Routes */}
        <Route path="/digitalizar" element={<ProtectedRoute><PageErrorBoundary><DocumentScan /></PageErrorBoundary></ProtectedRoute>} />
        <Route path="/cuidador/aceitar/:token" element={<PageErrorBoundary><CaregiverAccept /></PageErrorBoundary>} />
        <Route path="/consulta/:token" element={<PageErrorBoundary><ConsultationCardView /></PageErrorBoundary>} />
        <Route path="/admin" element={<ProtectedRoute><PageErrorBoundary><Admin /></PageErrorBoundary></ProtectedRoute>} />
        
        <Route path="*" element={<NotFound />} />
          </Routes>
      {showNavigation && <Navigation />}
    </>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 seconds
      gcTime: 300000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  console.log('App initializing', {
    hasSupabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
    hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    mode: import.meta.env.MODE
  });

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SubscriptionProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <TooltipProvider>
              <BrowserRouter>
                <AppContent />
              </BrowserRouter>
            </TooltipProvider>
          </ThemeProvider>
        </SubscriptionProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
