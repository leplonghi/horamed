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
import Saude from "./pages/Saude";
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
import MedicalAppointments from "./pages/MedicalAppointments";
import HealthTimeline from "./pages/HealthTimeline";
import HealthAnalysis from "./pages/HealthAnalysis";
import Emergency from "./pages/Emergency";
import Notifications from "./pages/Notifications";
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
        
        {/* Main navigation routes - HoraMed 2.0 */}
        <Route path="/hoje" element={<ProtectedRoute><Today /></ProtectedRoute>} />
        <Route path="/medicamentos" element={<ProtectedRoute><Medications /></ProtectedRoute>} />
        <Route path="/saude" element={<ProtectedRoute><Saude /></ProtectedRoute>} />
        <Route path="/cofre" element={<ProtectedRoute><Cofre /></ProtectedRoute>} />
        <Route path="/perfil" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        
        {/* Medicamentos subroutes */}
        <Route path="/adicionar" element={<ProtectedRoute><AddItem /></ProtectedRoute>} />
        <Route path="/add" element={<ProtectedRoute><AddItem /></ProtectedRoute>} />
        <Route path="/edit/:id" element={<ProtectedRoute><AddItem /></ProtectedRoute>} />
        <Route path="/estoque" element={<ProtectedRoute><StockManagement /></ProtectedRoute>} />
        <Route path="/historico-medicamentos" element={<ProtectedRoute><MedicationHistory /></ProtectedRoute>} />
        <Route path="/medicamentos/:id/historico" element={<ProtectedRoute><MedicationHistory /></ProtectedRoute>} />
        
        {/* Saúde subroutes */}
        <Route path="/consultas" element={<ProtectedRoute><MedicalAppointments /></ProtectedRoute>} />
        <Route path="/exames" element={<ProtectedRoute><MedicalReports /></ProtectedRoute>} />
        <Route path="/relatorios" element={<ProtectedRoute><MedicalReports /></ProtectedRoute>} />
        <Route path="/relatorios-medicos" element={<ProtectedRoute><MedicalReports /></ProtectedRoute>} />
        <Route path="/sinais-vitais" element={<ProtectedRoute><Charts /></ProtectedRoute>} />
        <Route path="/graficos" element={<ProtectedRoute><Charts /></ProtectedRoute>} />
        <Route path="/dashboard-saude" element={<ProtectedRoute><HealthDashboard /></ProtectedRoute>} />
        <Route path="/linha-do-tempo" element={<ProtectedRoute><HealthTimeline /></ProtectedRoute>} />
        <Route path="/analise-saude" element={<ProtectedRoute><HealthAnalysis /></ProtectedRoute>} />
        
        {/* Perfil subroutes */}
        <Route path="/perfil/criar" element={<ProtectedRoute><ProfileCreate /></ProtectedRoute>} />
        <Route path="/perfis/novo" element={<ProtectedRoute><ProfileCreate /></ProtectedRoute>} />
        <Route path="/perfil/editar/:id" element={<ProtectedRoute><ProfileEdit /></ProtectedRoute>} />
        <Route path="/profile/edit" element={<ProtectedRoute><ProfileEdit /></ProtectedRoute>} />
        <Route path="/assinatura" element={<ProtectedRoute><SubscriptionManagement /></ProtectedRoute>} />
        <Route path="/notificacoes-config" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />
        <Route path="/notificacoes" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />
        <Route path="/exportar" element={<ProtectedRoute><DataExport /></ProtectedRoute>} />
        <Route path="/exportar-dados" element={<ProtectedRoute><DataExport /></ProtectedRoute>} />
        <Route path="/privacidade" element={<ProtectedRoute><Privacy /></ProtectedRoute>} />
        <Route path="/privacy" element={<ProtectedRoute><Privacy /></ProtectedRoute>} />
        <Route path="/termos" element={<ProtectedRoute><Terms /></ProtectedRoute>} />
        <Route path="/terms" element={<ProtectedRoute><Terms /></ProtectedRoute>} />
        <Route path="/tutorial" element={<ProtectedRoute><Tutorial /></ProtectedRoute>} />
        <Route path="/ajuda" element={<ProtectedRoute><HelpSupport /></ProtectedRoute>} />
        <Route path="/help-support" element={<ProtectedRoute><HelpSupport /></ProtectedRoute>} />
        <Route path="/alarmes" element={<ProtectedRoute><AlarmSettings /></ProtectedRoute>} />
        <Route path="/alarme" element={<ProtectedRoute><AlarmSettings /></ProtectedRoute>} />
        <Route path="/emergencia" element={<ProtectedRoute><Emergency /></ProtectedRoute>} />
        <Route path="/planos" element={<ProtectedRoute><Plans /></ProtectedRoute>} />
        
        {/* Cofre subroutes */}
        <Route path="/cofre/upload" element={<ProtectedRoute><CofreUpload /></ProtectedRoute>} />
        <Route path="/cofre/:id" element={<ProtectedRoute><CofreDocumento /></ProtectedRoute>} />
        <Route path="/cofre/documento/:id" element={<ProtectedRoute><CofreDocumento /></ProtectedRoute>} />
        <Route path="/compartilhar/:token" element={<CompartilharDocumento />} />
        <Route path="/scan" element={<ProtectedRoute><DocumentScan /></ProtectedRoute>} />
        <Route path="/digitalizar" element={<ProtectedRoute><DocumentScan /></ProtectedRoute>} />
        
        {/* Legacy/deprecated routes (mantidos para compatibilidade) */}
        <Route path="/historico" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/mais" element={<ProtectedRoute><More /></ProtectedRoute>} />
        <Route path="/rotina" element={<ProtectedRoute><Today /></ProtectedRoute>} />
        <Route path="/evolucao" element={<ProtectedRoute><HealthDashboard /></ProtectedRoute>} />
        <Route path="/calendario" element={<ProtectedRoute><WeeklyCalendar /></ProtectedRoute>} />
        
        {/* External share routes (no auth required) */}
        <Route path="/historico-compartilhado/:token" element={<div>Histórico Compartilhado</div>} />
        <Route path="/cuidador/aceitar/:token" element={<CaregiverAccept />} />
        <Route path="/consulta/:token" element={<ConsultationCardView />} />
        
        {/* Admin */}
        <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
        
        {/* Catch all */}
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
            <SubscriptionProvider>
              <BrowserRouter>
                <AppContent />
              </BrowserRouter>
            </SubscriptionProvider>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
