import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Fingerprint, Heart, Shield, Clock, ArrowLeft, Sparkles, Users, Bell, ChevronRight, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/horamed-logo-optimized.webp";
import { useBiometricAuth } from "@/hooks/useBiometricAuth";
import { useAuth } from "@/contexts/AuthContext";
import { APP_DOMAIN } from "@/lib/domainConfig";
import { useDeviceFingerprint } from "@/hooks/useDeviceFingerprint";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

const features = [
  { icon: Bell, text: "Lembretes inteligentes", color: "text-primary" },
  { icon: Users, text: "Cuidado em família", color: "text-emerald-500" },
  { icon: Shield, text: "100% seguro e privado", color: "text-amber-500" },
];

const FeatureItem = ({ icon: Icon, text, color, delay }: { icon: any; text: string; color: string; delay: number }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="flex items-center gap-2"
  >
    <div className={cn("p-1.5 rounded-full bg-muted/50", color)}>
      <Icon className="h-3 w-3" />
    </div>
    <span className="text-sm text-muted-foreground">{text}</span>
  </motion.div>
);

export default function Auth() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [activeTab, setActiveTab] = useState("login");
  const { isAvailable, isLoading: biometricLoading, loginWithBiometric, isBiometricEnabled, setupBiometricLogin } = useBiometricAuth();
  const { fingerprint } = useDeviceFingerprint();

  // Capturar código de referral da URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    if (refCode) {
      setReferralCode(refCode);
    }
  }, []);

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleGoogleLogin = useCallback(async () => {
    try {
      setLoading(true);
      
      const redirectUrl = `${APP_DOMAIN}/`;
      console.log('Initiating Google OAuth with redirect:', redirectUrl);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error("Google OAuth error:", error);
        throw error;
      }
      
      console.log('Google OAuth initiated successfully:', data);
    } catch (error: any) {
      console.error("Exception during Google login:", error);
      toast.error(error.message || t('auth.googleError'));
      setLoading(false);
    }
  }, [t]);

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(t('auth.fillAllFields'));
      return;
    }

    if (!acceptedTerms) {
      toast.error(t('auth.acceptTerms'));
      return;
    }

    // Password validation
    if (password.length < 8) {
      toast.error(t('auth.passwordMin'));
      return;
    }
    if (!/[A-Z]/.test(password)) {
      toast.error(t('auth.passwordUppercase'));
      return;
    }
    if (!/[a-z]/.test(password)) {
      toast.error(t('auth.passwordLowercase'));
      return;
    }
    if (!/[0-9]/.test(password)) {
      toast.error(t('auth.passwordNumber'));
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${APP_DOMAIN}/`,
        },
      });

      if (error) throw error;
      
      if (data.user && referralCode) {
        try {
          // Validar referral com anti-fraude
          const { data: validationResult, error: validationError } = await supabase.rpc(
            'validate_referral_signup',
            {
              p_referred_user_id: data.user.id,
              p_referral_code: referralCode,
              p_device_fingerprint: fingerprint || 'unknown',
              p_ip_address: '0.0.0.0' // IP will be captured by the function
            }
          );

          if (validationError) {
            console.error('Referral validation error:', validationError);
          } else if (validationResult) {
            const result = validationResult as { success?: boolean; fraud_detected?: boolean; reasons?: string[] };
            if (!result.success && result.fraud_detected) {
              console.warn('Referral fraud detected:', result.reasons);
            }
          }
        } catch (refError) {
          console.error('Error processing referral:', refError);
        }
      }
      
      if (data.user) {
        toast.success(t('auth.accountCreated'));
        navigate("/bem-vindo");
        return;
      }
      
      toast.success(t('auth.accountCreatedLogin'));
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || t('auth.signupError'));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(t('auth.fillAllFields'));
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      toast.success(t('auth.loginSuccess'));
      
      if (isAvailable && !isBiometricEnabled) {
        setTimeout(() => {
          if (window.confirm(t('auth.enableBiometric'))) {
            setupBiometricLogin(email, password);
          }
        }, 1000);
      }
      
      navigate("/");
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || t('auth.loginError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity,
            ease: "easeInOut" 
          }}
        />
        <motion.div 
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-primary/15 to-transparent rounded-full blur-3xl"
          animate={{ 
            scale: [1.1, 1, 1.1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ 
            duration: 10, 
            repeat: Infinity,
            ease: "easeInOut" 
          }}
        />
        
        {/* Floating pills decoration */}
        <motion.div
          className="absolute top-20 left-10 w-3 h-3 bg-primary/30 rounded-full"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-40 right-20 w-2 h-2 bg-primary/20 rounded-full"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.div
          className="absolute bottom-32 left-1/4 w-4 h-4 bg-primary/25 rounded-full"
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-all mb-6 group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            {t('auth.backToHome')}
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="p-6 sm:p-8 shadow-2xl border-0 bg-card/95 backdrop-blur-md rounded-2xl">
            {/* Header */}
            <div className="text-center space-y-4 mb-6">
              <motion.div 
                className="flex justify-center"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
              >
                <div className="relative">
                  <div className="p-4 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl shadow-lg">
                    <img src={logo} alt="HoraMed" width={68} height={64} className="h-14 w-auto" />
                  </div>
                  <motion.div
                    className="absolute -top-1 -right-1 p-1 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full shadow-lg"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                  >
                    <Sparkles className="h-3 w-3 text-white" />
                  </motion.div>
                </div>
              </motion.div>
              
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  {activeTab === "login" ? "Bem-vindo de volta!" : "Crie sua conta grátis"}
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base">
                  {activeTab === "login" 
                    ? "Acesse sua conta e continue cuidando da sua saúde" 
                    : "Organize seus medicamentos e nunca mais esqueça uma dose"
                  }
                </p>
              </motion.div>
            </div>

            {/* Trust Signals with animation */}
            <motion.div 
              className="flex flex-wrap items-center justify-center gap-4 mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Grátis para começar</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 rounded-full border border-amber-500/20">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400">7 dias Premium</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 rounded-full border border-primary/20">
                <Shield className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium text-primary">Sem cartão</span>
              </div>
            </motion.div>

            <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 h-12 bg-muted/30 p-1 rounded-xl">
                <TabsTrigger 
                  value="login" 
                  className="text-sm sm:text-base font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all duration-200"
                >
                  Entrar
                </TabsTrigger>
                <TabsTrigger 
                  value="signup" 
                  className="text-sm sm:text-base font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all duration-200"
                >
                  Criar conta
                </TabsTrigger>
              </TabsList>

              <AnimatePresence mode="wait">
                <TabsContent value="login" className="space-y-4 mt-0" key="login">
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    {/* Google Login - Primary CTA */}
                    <Button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={loading}
                      className="w-full h-12 bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 shadow-sm transition-all hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] rounded-xl"
                    >
                      <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      Continuar com Google
                    </Button>

                    {isAvailable && isBiometricEnabled && (
                      <Button
                        type="button"
                        onClick={async () => {
                          const result = await loginWithBiometric();
                          if (result && typeof result === 'object' && 'email' in result) {
                            setEmail(result.email);
                            toast.info(t('auth.biometricConfirmed'));
                          }
                        }}
                        disabled={biometricLoading}
                        className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-[1.01] rounded-xl"
                      >
                        <Fingerprint className="h-5 w-5 mr-2" />
                        {biometricLoading ? t('auth.authenticating') : "Entrar com biometria"}
                      </Button>
                    )}

                    <div className="relative py-3">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border/50" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-3 text-muted-foreground/70">ou com e-mail</span>
                      </div>
                    </div>

                    <form onSubmit={handleEmailSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email" className="text-sm font-medium">E-mail</Label>
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="seu@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="h-12 rounded-xl border-muted-foreground/20 focus:border-primary transition-colors"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="login-password" className="text-sm font-medium">Senha</Label>
                          <Link to="/recuperar-senha" className="text-xs text-primary hover:underline">
                            Esqueceu a senha?
                          </Link>
                        </div>
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="h-12 rounded-xl border-muted-foreground/20 focus:border-primary transition-colors"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99] group"
                      >
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <motion.div
                              className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            />
                            Entrando...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Entrar
                            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </span>
                        )}
                      </Button>
                    </form>
                  </motion.div>
                </TabsContent>

                <TabsContent value="signup" className="space-y-4 mt-0" key="signup">
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    {/* Google Signup - Primary CTA */}
                    <Button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={loading}
                      className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg transition-all hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] rounded-xl group"
                    >
                      <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      Começar com Google
                      <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                    </Button>

                    <div className="relative py-3">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border/50" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-3 text-muted-foreground/70">ou com e-mail</span>
                      </div>
                    </div>

                    <form onSubmit={handleEmailSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-email" className="text-sm font-medium">E-mail</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="seu@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="h-12 rounded-xl border-muted-foreground/20 focus:border-primary transition-colors"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-password" className="text-sm font-medium">Crie uma senha</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={8}
                          className="h-12 rounded-xl border-muted-foreground/20 focus:border-primary transition-colors"
                        />
                        <p className="text-xs text-muted-foreground/80 flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          Mínimo 8 caracteres, com maiúsculas, minúsculas e números
                        </p>
                      </div>

                      {referralCode && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 rounded-xl border border-emerald-500/20"
                        >
                          <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-2">
                            <span className="text-lg">🎁</span>
                            Código de indicação: <span className="font-bold">{referralCode}</span>
                          </p>
                        </motion.div>
                      )}

                      <div className="flex items-start space-x-3 py-1 p-3 bg-muted/30 rounded-xl">
                        <Checkbox
                          id="terms"
                          checked={acceptedTerms}
                          onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                          className="mt-0.5"
                        />
                        <label
                          htmlFor="terms"
                          className="text-sm text-muted-foreground leading-relaxed cursor-pointer"
                        >
                          Aceito os{" "}
                          <Link 
                            to="/termos" 
                            target="_blank"
                            className="text-primary hover:underline font-medium"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Termos de Uso
                          </Link>
                          {" "}e a{" "}
                          <Link 
                            to="/privacidade" 
                            target="_blank"
                            className="text-primary hover:underline font-medium"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Política de Privacidade
                          </Link>
                        </label>
                      </div>

                      <Button
                        type="submit"
                        disabled={loading || !acceptedTerms}
                        className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary disabled:opacity-50 text-primary-foreground rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99] group"
                      >
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <motion.div
                              className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            />
                            Criando conta...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            Criar conta grátis
                            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </span>
                        )}
                      </Button>
                    </form>
                  </motion.div>
                </TabsContent>
              </AnimatePresence>
            </Tabs>
          </Card>
        </motion.div>

        {/* Features list */}
        <motion.div 
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {features.map((feature, index) => (
            <FeatureItem key={feature.text} {...feature} delay={0.6 + index * 0.1} />
          ))}
        </motion.div>

        {/* Social proof */}
        <motion.p 
          className="text-center text-xs text-muted-foreground/70 mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Mais de <span className="font-semibold text-foreground/80">10.000 famílias</span> já usam o HoraMed
        </motion.p>
      </div>
    </div>
  );
}
