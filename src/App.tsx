import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { HelmetProvider } from "react-helmet-async";
import { lazy, useState, useEffect } from "react";
import { isLandingDomain } from "@/lib/domainConfig";
import Index from "./pages/Index";
import SplashScreen from "./components/SplashScreen";
import TodayRedesign from "./pages/TodayRedesign";
import Medications from "./pages/Medications";
import MedicamentosHub from "./pages/MedicamentosHub";
import Saude from "./pages/Saude";
import Agenda from "./pages/Agenda";
import History from "./pages/History";
import More from "./pages/More";
import AddItem from "./pages/AddItem";
import AddItemRedirect from "./pages/AddItemRedirect";
import AddMedicationWizard from "./pages/AddMedicationWizard";
import StockManagement from "./pages/StockManagement";
import MedicalReports from "./pages/MedicalReports";
import Charts from "./pages/Charts";
import WeeklyCalendar from "./pages/WeeklyCalendar";
import Progress from "./pages/Progress";
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
import CofreDocumentoEdit from "./pages/CofreDocumentoEdit";
import CofreDocumentReview from "./pages/CofreDocumentReview";
import CofreManualCreate from "./pages/CofreManualCreate";
import CompartilharDocumento from "./pages/CompartilharDocumento";
import DataExport from './pages/DataExport';
import DocumentScan from './pages/DocumentScan';
import CaregiverAccept from './pages/CaregiverAccept';
import ConsultationCardView from './pages/ConsultationCardView';
import Admin from './pages/Admin';
import NotificationSettings from "./pages/NotificationSettings";
import Tutorial from "./pages/Tutorial";
import Achievements from "./pages/Achievements";
import MedicalAppointments from "./pages/MedicalAppointments";
import HealthTimeline from "./pages/HealthTimeline";
import HealthAnalysis from "./pages/HealthAnalysis";
import Emergency from "./pages/Emergency";
import Notifications from "./pages/Notifications";
import SmartOnboarding from "./components/onboarding/SmartOnboarding";
import { SubscriptionProvider } from "./contexts/SubscriptionContext";
import { ProfileCacheProvider } from "./contexts/ProfileCacheContext";
import TravelMode from "./pages/TravelMode";
import SideEffectsDiary from "./pages/SideEffectsDiary";
import CarteiraVacina from "./pages/CarteiraVacina";
import WeightHistory from "./pages/WeightHistory";
import StockDetails from "./pages/StockDetails";
import AnalyticsDetails from "./pages/AnalyticsDetails";
import IndiqueGanhe from "./pages/IndiqueGanhe";
import HealthAIButton from "./components/HealthAIButton";
import Welcome from "./pages/Welcome";
import QuickOnboarding from "./components/onboarding/QuickOnboarding";
import { OverdueDosesBanner } from "./components/OverdueDosesBanner";
import { trackAppOpened } from "./hooks/useAppMetrics";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import SubscriptionCanceled from "./pages/SubscriptionCanceled";

function AppContent() {
  // Track app opened
  useEffect(() => {
    trackAppOpened();
  }, []);
  const location = useLocation();
  const hideNavigationPaths = ["/auth", "/onboarding", "/onboarding-rapido", "/bem-vindo", "/"];
  const showNavigation = !hideNavigationPaths.includes(location.pathname);

  return (
    <>
      <OverdueDosesBanner />
      <Toaster />
      <Sonner />
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={<Index />} />
        
        {/* Main navigation routes - HoraMed 2.0 */}
        <Route path="/hoje" element={<ProtectedRoute><TodayRedesign /></ProtectedRoute>} />
        <Route path="/rotina" element={<ProtectedRoute><MedicamentosHub /></ProtectedRoute>} />
        <Route path="/progresso" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
        <Route path="/conquistas" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
        <Route path="/carteira" element={<ProtectedRoute><Cofre /></ProtectedRoute>} />
        <Route path="/perfil" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        
        {/* Super Página de Saúde - Hub unificado */}
        <Route path="/medicamentos" element={<ProtectedRoute><MedicamentosHub /></ProtectedRoute>} />
        <Route path="/saude" element={<ProtectedRoute><MedicamentosHub /></ProtectedRoute>} />
        
        {/* Medicamentos subroutes */}
        <Route path="/adicionar" element={<ProtectedRoute><AddItemRedirect /></ProtectedRoute>} />
        <Route path="/adicionar-medicamento" element={<ProtectedRoute><AddMedicationWizard /></ProtectedRoute>} />
        <Route path="/add" element={<ProtectedRoute><AddItemRedirect /></ProtectedRoute>} />
        <Route path="/edit/:id" element={<ProtectedRoute><AddItem /></ProtectedRoute>} />
        <Route path="/estoque" element={<ProtectedRoute><MedicamentosHub /></ProtectedRoute>} />
        <Route path="/estoque/:itemId" element={<ProtectedRoute><StockDetails /></ProtectedRoute>} />
        <Route path="/historico-medicamentos" element={<ProtectedRoute><MedicationHistory /></ProtectedRoute>} />
        <Route path="/medicamentos/:id/historico" element={<ProtectedRoute><MedicationHistory /></ProtectedRoute>} />
        
        {/* Progresso/Analytics detail routes */}
        <Route path="/progresso/detalhes" element={<ProtectedRoute><AnalyticsDetails /></ProtectedRoute>} />
        <Route path="/analise-detalhada" element={<ProtectedRoute><AnalyticsDetails /></ProtectedRoute>} />

        {/* Saúde subroutes */}
        <Route path="/saude/agenda" element={<ProtectedRoute><Agenda /></ProtectedRoute>} />
        <Route path="/consultas" element={<ProtectedRoute><MedicalAppointments /></ProtectedRoute>} />
        <Route path="/viagem" element={<ProtectedRoute><TravelMode /></ProtectedRoute>} />
        <Route path="/diario-efeitos" element={<ProtectedRoute><SideEffectsDiary /></ProtectedRoute>} />
        <Route path="/carteira-vacina" element={<ProtectedRoute><CarteiraVacina /></ProtectedRoute>} />
        <Route path="/vacinas" element={<ProtectedRoute><CarteiraVacina /></ProtectedRoute>} />
        <Route path="/exames" element={<ProtectedRoute><MedicalReports /></ProtectedRoute>} />
        <Route path="/relatorios" element={<ProtectedRoute><MedicalReports /></ProtectedRoute>} />
        <Route path="/relatorios-medicos" element={<ProtectedRoute><MedicalReports /></ProtectedRoute>} />
        <Route path="/graficos" element={<ProtectedRoute><Charts /></ProtectedRoute>} />
        <Route path="/dashboard-saude" element={<ProtectedRoute><HealthDashboard /></ProtectedRoute>} />
        <Route path="/linha-do-tempo" element={<ProtectedRoute><HealthTimeline /></ProtectedRoute>} />
        <Route path="/timeline" element={<ProtectedRoute><HealthTimeline /></ProtectedRoute>} />
        <Route path="/analise-saude" element={<ProtectedRoute><HealthAnalysis /></ProtectedRoute>} />
        
        {/* Perfil subroutes */}
        <Route path="/perfil/criar" element={<ProtectedRoute><ProfileCreate /></ProtectedRoute>} />
        <Route path="/perfis/novo" element={<ProtectedRoute><ProfileCreate /></ProtectedRoute>} />
        <Route path="/perfil/editar/:id" element={<ProtectedRoute><ProfileEdit /></ProtectedRoute>} />
        <Route path="/profile/edit" element={<ProtectedRoute><ProfileEdit /></ProtectedRoute>} />
        <Route path="/perfil/indique-e-ganhe" element={<ProtectedRoute><IndiqueGanhe /></ProtectedRoute>} />
        <Route path="/indique-ganhe" element={<ProtectedRoute><IndiqueGanhe /></ProtectedRoute>} />
        <Route path="/peso/historico" element={<ProtectedRoute><WeightHistory /></ProtectedRoute>} />
        <Route path="/assinatura" element={<ProtectedRoute><SubscriptionManagement /></ProtectedRoute>} />
        <Route path="/assinatura/sucesso" element={<ProtectedRoute><SubscriptionSuccess /></ProtectedRoute>} />
        <Route path="/assinatura/cancelado" element={<ProtectedRoute><SubscriptionCanceled /></ProtectedRoute>} />
        <Route path="/notificacoes-config" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />
        <Route path="/notificacoes" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />
        <Route path="/exportar" element={<ProtectedRoute><DataExport /></ProtectedRoute>} />
        <Route path="/exportar-dados" element={<ProtectedRoute><DataExport /></ProtectedRoute>} />
        <Route path="/privacidade" element={<Privacy />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/termos" element={<Terms />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/tutorial" element={<ProtectedRoute><Tutorial /></ProtectedRoute>} />
        <Route path="/progresso" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
        <Route path="/onboarding" element={<SmartOnboarding />} />
        <Route path="/onboarding-rapido" element={<QuickOnboarding />} />
        <Route path="/bem-vindo" element={<Welcome />} />
        <Route path="/ajuda" element={<ProtectedRoute><HelpSupport /></ProtectedRoute>} />
        <Route path="/help-support" element={<ProtectedRoute><HelpSupport /></ProtectedRoute>} />
        <Route path="/alarmes" element={<ProtectedRoute><AlarmSettings /></ProtectedRoute>} />
        <Route path="/alarme" element={<ProtectedRoute><AlarmSettings /></ProtectedRoute>} />
        <Route path="/emergencia" element={<ProtectedRoute><Emergency /></ProtectedRoute>} />
        <Route path="/planos" element={<ProtectedRoute><Plans /></ProtectedRoute>} />
        
        {/* Carteira subroutes */}
        <Route path="/carteira/upload" element={<ProtectedRoute><CofreUpload /></ProtectedRoute>} />
        <Route path="/carteira/criar-manual" element={<ProtectedRoute><CofreManualCreate /></ProtectedRoute>} />
        <Route path="/carteira/:id/review" element={<ProtectedRoute><CofreDocumentReview /></ProtectedRoute>} />
        <Route path="/carteira/:id/editar" element={<ProtectedRoute><CofreDocumentoEdit /></ProtectedRoute>} />
        <Route path="/carteira/:id" element={<ProtectedRoute><CofreDocumento /></ProtectedRoute>} />
        <Route path="/carteira/documento/:id" element={<ProtectedRoute><CofreDocumento /></ProtectedRoute>} />
        <Route path="/compartilhar/:token" element={<CompartilharDocumento />} />
        <Route path="/scan" element={<ProtectedRoute><DocumentScan /></ProtectedRoute>} />
        <Route path="/digitalizar" element={<ProtectedRoute><DocumentScan /></ProtectedRoute>} />
        
        {/* Legacy/deprecated routes (mantidos para compatibilidade) */}
        <Route path="/historico" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/mais" element={<ProtectedRoute><More /></ProtectedRoute>} />
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
      <HealthAIButton />
    </>
  );
}

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  
  console.log('App initializing', {
    hasSupabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
    hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    mode: import.meta.env.MODE
  });

  // Only show splash on app domain, never on landing domain
  useEffect(() => {
    // Never show splash on landing domain - landing page should load instantly
    if (isLandingDomain()) {
      setShowSplash(false);
      return;
    }
    
    // On app domain, only show splash on first load
    const hasSeenSplash = sessionStorage.getItem('horamed_splash_shown');
    if (hasSeenSplash) {
      setShowSplash(false);
    }
  }, []);

  const handleSplashComplete = () => {
    sessionStorage.setItem('horamed_splash_shown', 'true');
    setShowSplash(false);
  };

  return (
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <TooltipProvider>
              <ProfileCacheProvider>
                <SubscriptionProvider>
                  <BrowserRouter>
                    <AuthProvider>
                      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
                      <AppContent />
                    </AuthProvider>
                  </BrowserRouter>
                </SubscriptionProvider>
              </ProfileCacheProvider>
            </TooltipProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
};

export default App;
