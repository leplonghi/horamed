import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Fingerprint, Heart, Shield, Clock, ArrowLeft } from "lucide-react";
import logo from "@/assets/horamed-logo-optimized.webp";
import { z } from "zod";
import { useBiometricAuth } from "@/hooks/useBiometricAuth";
import { useAuth } from "@/contexts/AuthContext";
import { APP_DOMAIN } from "@/lib/domainConfig";

const passwordSchema = z.string()
  .min(8, "A senha deve ter no mínimo 8 caracteres")
  .regex(/[A-Z]/, "A senha deve conter pelo menos uma letra maiúscula")
  .regex(/[a-z]/, "A senha deve conter pelo menos uma letra minúscula")
  .regex(/[0-9]/, "A senha deve conter pelo menos um número");

export default function Auth() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const { isAvailable, isLoading: biometricLoading, loginWithBiometric, isBiometricEnabled, setupBiometricLogin } = useBiometricAuth();

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

  const handleGoogleLogin = async () => {
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
      toast.error(error.message || "Erro ao fazer login com Google. Verifique se o Google Auth está configurado no backend.");
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Preencha todos os campos");
      return;
    }

    if (!acceptedTerms) {
      toast.error("Você precisa aceitar os Termos de Uso e Política de Privacidade para criar uma conta");
      return;
    }

    const validation = passwordSchema.safeParse(password);
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
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
          const { data: referrerProfile } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('referral_code', referralCode)
            .single();

          if (referrerProfile) {
            await supabase
              .from('referrals')
              .insert({
                referrer_user_id: referrerProfile.user_id,
                referred_user_id: data.user.id,
                referral_code_used: referralCode,
                plan_type: 'free',
                status: 'pending'
              });
          }
        } catch (refError) {
          console.error('Error processing referral:', refError);
        }
      }
      
      if (data.user) {
        toast.success("Conta criada! 🎉");
        navigate("/bem-vindo");
        return;
      }
      
      toast.success("Conta criada! Você já pode fazer login 🎉");
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Preencha todos os campos");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      toast.success("Login realizado! 💚");
      
      if (isAvailable && !isBiometricEnabled) {
        setTimeout(() => {
          if (window.confirm("Deseja ativar login por biometria?")) {
            setupBiometricLogin(email, password);
          }
        }, 1000);
      }
      
      navigate("/");
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5 flex items-center justify-center p-4 sm:p-6">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Back button */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Voltar para a página inicial
        </Link>

        <Card className="p-6 sm:p-8 shadow-xl border-0 bg-card/80 backdrop-blur-sm animate-fade-in">
          {/* Header */}
          <div className="text-center space-y-4 mb-6">
            <div className="flex justify-center">
              <div className="p-3 bg-primary/10 rounded-2xl">
                <img src={logo} alt="HoraMed" className="h-16 w-auto" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Bem-vindo ao HoraMed
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Cuide de quem você ama com tranquilidade
              </p>
            </div>
          </div>

          {/* Trust Signals */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-6 text-xs sm:text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Heart className="h-3.5 w-3.5 text-primary" />
              <span>Grátis para começar</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>7 dias Premium</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span>Sem cartão</span>
            </div>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 h-12 bg-muted/50">
              <TabsTrigger value="login" className="text-sm sm:text-base font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Entrar
              </TabsTrigger>
              <TabsTrigger value="signup" className="text-sm sm:text-base font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Criar conta
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4 mt-0">
              {/* Google Login - Primary CTA */}
              <Button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full h-12 bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 shadow-sm transition-all hover:shadow-md"
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
                  onClick={loginWithBiometric}
                  disabled={biometricLoading}
                  className="w-full h-12"
                  variant="outline"
                >
                  <Fingerprint className="h-5 w-5 mr-2" />
                  {biometricLoading ? "Autenticando..." : "Entrar com Biometria"}
                </Button>
              )}

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-3 text-muted-foreground">ou com email</span>
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
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-sm font-medium">Senha</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-primary hover:bg-primary/90"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 mt-0">
              {/* Google Signup - Primary CTA */}
              <Button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all hover:shadow-lg"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Criar conta com Google
              </Button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-3 text-muted-foreground">ou com email</span>
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
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-sm font-medium">Senha</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">
                    Mínimo 8 caracteres, maiúscula, minúscula e número
                  </p>
                </div>

                {referralCode && (
                  <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
                    <p className="text-sm text-green-700 dark:text-green-400 font-medium flex items-center gap-2">
                      <span>🎁</span>
                      Código de indicação aplicado: {referralCode}
                    </p>
                  </div>
                )}

                <div className="flex items-start space-x-3 py-1">
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
                    {" "}e{" "}
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
                  className="w-full h-11 bg-primary hover:bg-primary/90 disabled:opacity-50"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {loading ? "Criando conta..." : "Criar conta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* Footer text */}
          <p className="text-xs text-center text-muted-foreground mt-6">
            Ao continuar, você concorda com nossos termos de serviço e política de privacidade.
          </p>
        </Card>

        {/* Social proof */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Mais de 10.000 famílias já confiam no HoraMed
        </p>
      </div>
    </div>
  );
}
