import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { HelmetProvider } from "react-helmet-async";
import { lazy, Suspense, useState, useEffect } from "react";
import { isLandingDomain } from "@/lib/domainConfig";
import { SubscriptionProvider } from "./contexts/SubscriptionContext";
import { ProfileCacheProvider } from "./contexts/ProfileCacheContext";
import { trackAppOpened } from "./hooks/useAppMetrics";
import { usePushNotifications } from "./hooks/usePushNotifications";

// Critical components loaded immediately
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import SplashScreen from "./components/SplashScreen";
import Navigation from "./components/Navigation";
import ProtectedRoute from "./components/ProtectedRoute";

// Lazy loaded components for code splitting
const TodayRedesign = lazy(() => import("./pages/TodayRedesign"));
const MedicamentosHub = lazy(() => import("./pages/MedicamentosHub"));
const Progress = lazy(() => import("./pages/Progress"));
const Achievements = lazy(() => import("./pages/Achievements"));
const Gamification = lazy(() => import("./pages/Gamification"));
const Cofre = lazy(() => import("./pages/Cofre"));
const Profile = lazy(() => import("./pages/Profile"));
const Auth = lazy(() => import("./pages/Auth"));
const AddItem = lazy(() => import("./pages/AddItem"));
const AddItemRedirect = lazy(() => import("./pages/AddItemRedirect"));
const EditItemRedirect = lazy(() => import("./pages/EditItemRedirect"));
const AddMedicationPage = lazy(() => import("./pages/AddItemRedirect"));
const StockDetails = lazy(() => import("./pages/StockDetails"));
const MedicationHistory = lazy(() => import("./pages/MedicationHistory"));
const AnalyticsDetails = lazy(() => import("./pages/AnalyticsDetails"));
const Agenda = lazy(() => import("./pages/Agenda"));
const MedicalAppointments = lazy(() => import("./pages/MedicalAppointments"));
const TravelMode = lazy(() => import("./pages/TravelMode"));
const SideEffectsDiary = lazy(() => import("./pages/SideEffectsDiary"));
const CarteiraVacina = lazy(() => import("./pages/CarteiraVacina"));
const MedicalReports = lazy(() => import("./pages/MedicalReports"));
const Charts = lazy(() => import("./pages/Charts"));
const HealthDashboard = lazy(() => import("./pages/HealthDashboard"));
const HealthTimeline = lazy(() => import("./pages/HealthTimeline"));
const HealthAnalysis = lazy(() => import("./pages/HealthAnalysis"));
const ProfileCreate = lazy(() => import("./pages/ProfileCreate"));
const ProfileEdit = lazy(() => import("./pages/ProfileEdit"));
const IndiqueGanhe = lazy(() => import("./pages/IndiqueGanhe"));
const Recompensas = lazy(() => import("./pages/Recompensas"));
const WeightHistory = lazy(() => import("./pages/WeightHistory"));
const SubscriptionManagement = lazy(() => import("./pages/SubscriptionManagement"));
const SubscriptionSuccess = lazy(() => import("./pages/SubscriptionSuccess"));
const SubscriptionCanceled = lazy(() => import("./pages/SubscriptionCanceled"));
const NotificationSettings = lazy(() => import("./pages/NotificationSettings"));
const NotificationSetup = lazy(() => import("./pages/NotificationSetup"));
const DataExport = lazy(() => import("./pages/DataExport"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Tutorial = lazy(() => import("./pages/Tutorial"));
const OnboardingFlow = lazy(() => import("./components/onboarding/OnboardingFlow"));
const QuickOnboarding = lazy(() => import("./components/onboarding/QuickOnboarding"));
const Welcome = lazy(() => import("./pages/Welcome"));
const HelpSupport = lazy(() => import("./pages/HelpSupport"));
const AlarmSettings = lazy(() => import("./pages/AlarmSettings"));
const AlarmDiagnostics = lazy(() => import("./pages/AlarmDiagnostics"));
const Emergency = lazy(() => import("./pages/Emergency"));
const Plans = lazy(() => import("./pages/Plans"));
const CofreUpload = lazy(() => import("./pages/CofreUpload"));
const CofreManualCreate = lazy(() => import("./pages/CofreManualCreate"));
const CofreDocumentReview = lazy(() => import("./pages/CofreDocumentReview"));
const CofreDocumentoEdit = lazy(() => import("./pages/CofreDocumentoEdit"));
const CofreDocumento = lazy(() => import("./pages/CofreDocumento"));
const CompartilharDocumento = lazy(() => import("./pages/CompartilharDocumento"));
const DocumentScan = lazy(() => import("./pages/DocumentScan"));
const History = lazy(() => import("./pages/History"));
const More = lazy(() => import("./pages/More"));
const WeeklyCalendar = lazy(() => import("./pages/WeeklyCalendar"));
const CaregiverAccept = lazy(() => import("./pages/CaregiverAccept"));
const ConsultationCardView = lazy(() => import("./pages/ConsultationCardView"));
// Admin route removed - feature flags managed via Supabase Dashboard only
const NotFound = lazy(() => import("./pages/NotFound"));
const HealthAIButton = lazy(() => import("./components/HealthAIButton"));
const PWAInstallPrompt = lazy(() => import("./components/PWAInstallPrompt"));
const NotificationPermissionPrompt = lazy(() => import("./components/NotificationPermissionPrompt"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

function AppContent() {
  // Initialize push notifications and get the permission request function
  const { requestNotificationPermission } = usePushNotifications();
  
  // Track app opened
  useEffect(() => {
    trackAppOpened();
  }, []);
  const location = useLocation();
  const hideNavigationPaths = ["/auth", "/onboarding", "/onboarding-rapido", "/bem-vindo", "/"];
  const showNavigation = !hideNavigationPaths.includes(location.pathname);

  return (
    <>
      <Toaster />
      <Sonner />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<Index />} />
          <Route path="/landing-preview" element={<Landing />} />
          
          {/* Main navigation routes - HoraMed 2.0 */}
          <Route path="/hoje" element={<ProtectedRoute><TodayRedesign /></ProtectedRoute>} />
          <Route path="/rotina" element={<ProtectedRoute><MedicamentosHub /></ProtectedRoute>} />
          <Route path="/progresso" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
          <Route path="/conquistas" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
          <Route path="/jornada" element={<ProtectedRoute><Gamification /></ProtectedRoute>} />
          <Route path="/carteira" element={<ProtectedRoute><Cofre /></ProtectedRoute>} />
          <Route path="/perfil" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          
          {/* Super Página de Saúde - Hub unificado */}
          <Route path="/medicamentos" element={<ProtectedRoute><MedicamentosHub /></ProtectedRoute>} />
          <Route path="/saude" element={<ProtectedRoute><MedicamentosHub /></ProtectedRoute>} />
          
          {/* Medicamentos subroutes */}
          <Route path="/adicionar" element={<ProtectedRoute><AddItemRedirect /></ProtectedRoute>} />
          <Route path="/adicionar-medicamento" element={<ProtectedRoute><AddMedicationPage /></ProtectedRoute>} />
          <Route path="/add" element={<ProtectedRoute><AddItemRedirect /></ProtectedRoute>} />
          <Route path="/edit/:id" element={<ProtectedRoute><EditItemRedirect /></ProtectedRoute>} />
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
          <Route path="/recompensas" element={<ProtectedRoute><Recompensas /></ProtectedRoute>} />
          <Route path="/peso/historico" element={<ProtectedRoute><WeightHistory /></ProtectedRoute>} />
          <Route path="/assinatura" element={<ProtectedRoute><SubscriptionManagement /></ProtectedRoute>} />
          <Route path="/assinatura/sucesso" element={<ProtectedRoute><SubscriptionSuccess /></ProtectedRoute>} />
          <Route path="/assinatura/cancelado" element={<ProtectedRoute><SubscriptionCanceled /></ProtectedRoute>} />
          <Route path="/notificacoes-config" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />
          <Route path="/notificacoes" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />
          <Route path="/configurar-notificacoes" element={<ProtectedRoute><NotificationSetup /></ProtectedRoute>} />
          <Route path="/configuracoes/notificacoes" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />
          <Route path="/exportar" element={<ProtectedRoute><DataExport /></ProtectedRoute>} />
          <Route path="/exportar-dados" element={<ProtectedRoute><DataExport /></ProtectedRoute>} />
          <Route path="/privacidade" element={<Privacy />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/termos" element={<Terms />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/tutorial" element={<ProtectedRoute><Tutorial /></ProtectedRoute>} />
                          <Route path="/onboarding" element={<OnboardingFlow />} />
                          <Route path="/onboarding-rapido" element={<QuickOnboarding />} />
          <Route path="/bem-vindo" element={<Welcome />} />
          <Route path="/ajuda" element={<ProtectedRoute><HelpSupport /></ProtectedRoute>} />
          <Route path="/help-support" element={<ProtectedRoute><HelpSupport /></ProtectedRoute>} />
          <Route path="/alarmes" element={<ProtectedRoute><AlarmSettings /></ProtectedRoute>} />
          <Route path="/alarme" element={<ProtectedRoute><AlarmSettings /></ProtectedRoute>} />
          <Route path="/alarmes/diagnostico" element={<ProtectedRoute><AlarmDiagnostics /></ProtectedRoute>} />
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
          
          {/* Admin route removed - feature flags managed via Supabase Dashboard only */}
          
          {/* Catch all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      {showNavigation && <Navigation />}
      {/* Unified Floating Action Hub (Clara + Voice) */}
      {showNavigation && (
        <Suspense fallback={null}>
          <HealthAIButton />
        </Suspense>
      )}
      {/* PWA prompt should always be available */}
      <Suspense fallback={null}>
        <PWAInstallPrompt />
      </Suspense>
      {/* Notification permission prompt */}
      <Suspense fallback={null}>
        <NotificationPermissionPrompt onRequestPermission={requestNotificationPermission} />
      </Suspense>
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
            <LanguageProvider>
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
            </LanguageProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
};

export default App;
