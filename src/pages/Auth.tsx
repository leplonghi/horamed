import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";
import { Fingerprint, Shield, ArrowLeft, Users, Bell, Eye, EyeOff, Clock, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useBiometricAuth } from "@/hooks/useBiometricAuth";
import { useAuth } from "@/contexts/AuthContext";
import { APP_DOMAIN } from "@/lib/domainConfig";
import { useDeviceFingerprint } from "@/hooks/useDeviceFingerprint";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo_HoraMed.png";
import authBackground from "@/assets/auth-background.png";
const features = [{
  icon: Bell,
  text: "Lembretes",
  color: "from-blue-500 to-cyan-400"
}, {
  icon: Users,
  text: "Família",
  color: "from-emerald-500 to-teal-400"
}, {
  icon: Shield,
  text: "Seguro",
  color: "from-violet-500 to-purple-400"
}];
export default function Auth() {
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const {
    t
  } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const {
    isAvailable,
    isLoading: biometricLoading,
    loginWithBiometric,
    isBiometricEnabled,
    setupBiometricLogin
  } = useBiometricAuth();
  const {
    fingerprint
  } = useDeviceFingerprint();
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
      const {
        error
      } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });
      if (error) throw error;
    } catch (error: any) {
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
      const {
        data,
        error
      } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${APP_DOMAIN}/`
        }
      });
      if (error) throw error;
      if (data.user && referralCode) {
        try {
          await supabase.rpc('validate_referral_signup', {
            p_referred_user_id: data.user.id,
            p_referral_code: referralCode,
            p_device_fingerprint: fingerprint || 'unknown',
            p_ip_address: '0.0.0.0'
          });
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
      const {
        error
      } = await supabase.auth.signInWithPassword({
        email,
        password
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
      toast.error(error.message || t('auth.loginError'));
    } finally {
      setLoading(false);
    }
  };
  return <div className="h-[100dvh] flex flex-col lg:flex-row overflow-hidden">
      {/* Left Panel - Branding (hidden on mobile/tablet, only on desktop) */}
      <motion.div initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} transition={{
      duration: 0.6
    }} className="hidden lg:flex relative lg:w-1/2 p-12 flex-col justify-between overflow-hidden"
      style={{ 
        backgroundImage: `url(${authBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
        {/* Subtle overlay for better text readability */}
        <div className="absolute inset-0 bg-black/10" />

        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8 group">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span className="text-sm">Voltar</span>
          </Link>
          
          {/* Logo/Brand */}
          <motion.div className="flex items-center gap-3 mb-6" initial={{
          y: 20,
          opacity: 0
        }} animate={{
          y: 0,
          opacity: 1
        }} transition={{
          delay: 0.2
        }}>
            <img alt="HoraMed" className="h-16 w-auto object-cover" src={logo} />
          </motion.div>
          
          <motion.h1 className="text-4xl font-bold text-white leading-tight mb-4" initial={{
          y: 20,
          opacity: 0
        }} animate={{
          y: 0,
          opacity: 1
        }} transition={{
          delay: 0.3
        }}>
            Sua saúde,{" "}
            <span className="bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-secondary">organizada.</span>
          </motion.h1>
          
          <motion.p className="text-white/60 text-lg max-w-md" initial={{
          y: 20,
          opacity: 0
        }} animate={{
          y: 0,
          opacity: 1
        }} transition={{
          delay: 0.4
        }}>
            Gerencie medicamentos, exames e consultas. Nunca mais esqueça uma dose importante.
          </motion.p>
        </div>

        {/* Features */}
        <motion.div className="relative z-10 flex flex-wrap gap-4" initial={{
        y: 20,
        opacity: 0
      }} animate={{
        y: 0,
        opacity: 1
      }} transition={{
        delay: 0.5
      }}>
          {features.map((feature, i) => <motion.div key={feature.text} className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10" initial={{
          scale: 0.8,
          opacity: 0
        }} animate={{
          scale: 1,
          opacity: 1
        }} transition={{
          delay: 0.6 + i * 0.1
        }}>
              <div className={cn("p-1.5 rounded-full bg-gradient-to-br", feature.color)}>
                <feature.icon className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-sm text-white/80 font-medium">{feature.text}</span>
            </motion.div>)}
        </motion.div>
      </motion.div>

      {/* Right Panel - Form (with gradient on mobile) */}
      <div className="flex-1 flex flex-col justify-center relative overflow-hidden">
        {/* Mobile gradient background - blue at bottom, white at top */}
        <div className="absolute inset-0 lg:hidden bg-gradient-to-t from-primary/20 via-primary/5 to-white">
          <motion.div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3]
        }} transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }} />
          <motion.div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-400/10 rounded-full blur-3xl" animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2]
        }} transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }} />
        </div>
        
        <motion.div className="relative z-10 w-full max-w-md mx-auto p-4 sm:p-6 lg:p-12" initial={{
        opacity: 0,
        x: 20
      }} animate={{
        opacity: 1,
        x: 0
      }} transition={{
        duration: 0.5,
        delay: 0.2
      }}>
          {/* Mobile Header with Logo */}
          <div className="lg:hidden flex flex-col items-center justify-center gap-2 mb-6">
            <motion.div className="p-3 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-primary/10" initial={{
            scale: 0.8,
            opacity: 0
          }} animate={{
            scale: 1,
            opacity: 1
          }} transition={{
            delay: 0.1
          }}>
              <img alt="HoraMed" className="h-12 w-auto" src="/lovable-uploads/c1440d3b-2638-409a-8761-9ce3834a1fb1.png" />
            </motion.div>
            <span className="text-xl font-bold text-foreground">HoraMed</span>
          </div>

          {/* Header */}
          <div className="text-center lg:text-left mb-4 sm:mb-6">
            <motion.div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 backdrop-blur-sm rounded-full mb-3" initial={{
            scale: 0.9,
            opacity: 0
          }} animate={{
            scale: 1,
            opacity: 1
          }} transition={{
            delay: 0.3
          }}>
              <Sun className="h-3 w-3 text-primary" />
              <span className="text-xs font-medium text-primary">7 dias grátis Premium</span>
            </motion.div>
            
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-1">
              {isLogin ? "Bem-vindo de volta!" : "Crie sua conta"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isLogin ? "Entre para continuar cuidando da sua saúde" : "Comece a organizar seus medicamentos hoje"}
            </p>
          </div>

          {/* Auth Buttons */}
          <div className="space-y-3">
            {/* Google */}
            <Button type="button" onClick={handleGoogleLogin} disabled={loading} className="w-full h-11 bg-white hover:bg-gray-50 text-foreground border border-border shadow-sm transition-all hover:shadow-md rounded-xl font-medium text-sm">
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continuar com Google
            </Button>

            {/* Biometric */}
            {isAvailable && isBiometricEnabled && isLogin && <Button type="button" onClick={async () => {
            const result = await loginWithBiometric();
            if (result && typeof result === 'object' && 'email' in result) {
              setEmail(result.email);
              toast.info(t('auth.biometricConfirmed'));
            }
          }} disabled={biometricLoading} variant="outline" className="w-full h-11 rounded-xl font-medium text-sm bg-white/50 backdrop-blur-sm">
                <Fingerprint className="h-4 w-4 mr-2" />
                {biometricLoading ? "Autenticando..." : "Entrar com biometria"}
              </Button>}

            {/* Divider */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background/80 backdrop-blur-sm px-3 text-xs text-muted-foreground">ou com e-mail</span>
              </div>
            </div>

            {/* Email Form */}
            <form onSubmit={isLogin ? handleEmailSignIn : handleEmailSignUp} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="email" className="text-sm font-medium">E-mail</Label>
                <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required className="h-11 rounded-xl bg-white/70 backdrop-blur-sm border-border/50 focus:border-primary transition-colors" />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
                  {isLogin && <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                      Esqueceu?
                    </Link>}
                </div>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required className="h-11 rounded-xl bg-white/70 backdrop-blur-sm border-border/50 focus:border-primary transition-colors pr-10" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {!isLogin && <p className="text-[10px] text-muted-foreground">
                    Mín. 8 caracteres, maiúscula, minúscula e número
                  </p>}
              </div>

              {/* Terms checkbox for signup */}
              <AnimatePresence>
                {!isLogin && <motion.div initial={{
                opacity: 0,
                height: 0
              }} animate={{
                opacity: 1,
                height: "auto"
              }} exit={{
                opacity: 0,
                height: 0
              }} className="flex items-start gap-2 pt-1">
                    <Checkbox id="terms" checked={acceptedTerms} onCheckedChange={checked => setAcceptedTerms(checked as boolean)} className="mt-0.5" />
                    <Label htmlFor="terms" className="text-xs text-muted-foreground leading-tight cursor-pointer">
                      Aceito os{" "}
                      <Link to="/termos" className="text-primary hover:underline">Termos</Link>
                      {" "}e{" "}
                      <Link to="/privacidade" className="text-primary hover:underline">Privacidade</Link>
                    </Label>
                  </motion.div>}
              </AnimatePresence>

              <Button type="submit" disabled={loading || !isLogin && !acceptedTerms} className="w-full h-11 rounded-xl font-semibold text-sm bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30">
                {loading ? <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Aguarde...</span>
                  </div> : isLogin ? "Entrar" : "Criar conta grátis"}
              </Button>
            </form>

            {/* Toggle Login/Signup */}
            <p className="text-center text-xs text-muted-foreground pt-3">
              {isLogin ? "Não tem conta?" : "Já tem conta?"}{" "}
              <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-primary font-medium hover:underline">
                {isLogin ? "Criar" : "Entrar"}
              </button>
            </p>
          </div>

          {/* Trust badges - hidden on very small screens */}
          <motion.div className="hidden sm:flex items-center justify-center gap-4 mt-4 pt-4 border-t border-border/30" initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          delay: 0.6
        }}>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Shield className="h-3 w-3" />
              <span className="text-[10px]">Criptografado</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span className="text-[10px]">30s cadastro</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>;
}