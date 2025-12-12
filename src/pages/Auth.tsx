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
import { Mail, Chrome, Fingerprint } from "lucide-react";
import logo from "@/assets/horamed-logo.png";
import { z } from "zod";
import { useBiometricAuth } from "@/hooks/useBiometricAuth";
import { useAuth } from "@/contexts/AuthContext";

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
    // Auto-redirect if already logged in
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      
      const redirectUrl = `${window.location.origin}/`;
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
      
      // OAuth will handle the redirect, don't show error toast
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

    // Validate password strength
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
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;
      
      // Processar referral se houver código
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
          // Não bloquear o signup se falhar o referral
        }
      }
      
      // Check if user needs onboarding
      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("user_id", data.user.id)
          .single();

        // Always go to welcome page for new users
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
      
      // Ask if user wants to enable biometric login
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
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md p-8 space-y-6 shadow-2xl border-primary/10">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <img src={logo} alt="HoraMed" className="h-24 w-auto" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground">
              Sua saúde no horário certo
            </h1>
            <p className="text-muted-foreground">
              Gerencie medicamentos e documentos de saúde
            </p>
          </div>
        </div>

        {/* Trust Signals */}
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span>✓ Grátis</span>
          <span>•</span>
          <span>✓ 7 dias Premium</span>
          <span>•</span>
          <span>✓ Sem cartão</span>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Entrar</TabsTrigger>
            <TabsTrigger value="signup">Criar conta</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            {/* Google Login First - Primary CTA */}
            <Button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full h-12 bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 shadow-sm"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Entrar com Google
            </Button>

            {isAvailable && isBiometricEnabled && (
              <Button
                type="button"
                onClick={loginWithBiometric}
                disabled={biometricLoading}
                className="w-full"
                variant="outline"
              >
                <Fingerprint className="h-4 w-4 mr-2" />
                {biometricLoading ? "Autenticando..." : "Entrar com Biometria"}
              </Button>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">ou com email</span>
              </div>
            </div>

            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">E-mail</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Senha</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full"
                variant="outline"
              >
                <Mail className="h-4 w-4 mr-2" />
                {loading ? "Entrando..." : "Entrar com E-mail"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4">
            {/* Google Signup First - Primary CTA */}
            <Button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Criar conta com Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">ou com email</span>
              </div>
            </div>

            <form onSubmit={handleEmailSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email">E-mail</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">Senha</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <p className="text-xs text-muted-foreground">
                  Mínimo 8 caracteres, maiúscula, minúscula e número
                </p>
              </div>

              {referralCode && (
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-sm text-primary font-medium">
                    🎁 Código de indicação aplicado: {referralCode}
                  </p>
                </div>
              )}

              <div className="flex items-start space-x-3 py-2">
                <Checkbox
                  id="terms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                  className="mt-0.5"
                />
                <label
                  htmlFor="terms"
                  className="text-sm text-muted-foreground leading-tight cursor-pointer"
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
                </label>
              </div>

              <Button
                type="submit"
                disabled={loading || !acceptedTerms}
                className="w-full"
                variant="outline"
              >
                <Mail className="h-4 w-4 mr-2" />
                {loading ? "Criando conta..." : "Criar com E-mail"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        {/* Back to Landing */}
        <div className="text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Voltar para a página inicial
          </Link>
        </div>
      </Card>
    </div>
  );
}