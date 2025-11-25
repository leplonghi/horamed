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
  const { isAvailable, isLoading: biometricLoading, loginWithBiometric, isBiometricEnabled, setupBiometricLogin } = useBiometricAuth();

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
      
      // Check if user needs onboarding
      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("user_id", data.user.id)
          .single();

        if (!profile?.onboarding_completed) {
          toast.success("Conta criada! 🎉");
          navigate("/onboarding");
          return;
        }
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
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md p-8 space-y-6 shadow-xl">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <img src={logo} alt="HoraMed" className="h-32 w-auto" />
          </div>
          <p className="text-muted-foreground text-lg">
            Sua saúde no horário certo.
          </p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Entrar</TabsTrigger>
            <TabsTrigger value="signup">Criar conta</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
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
              >
                <Mail className="h-4 w-4 mr-2" />
                {loading ? "Entrando..." : "Entrar com E-mail"}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">ou</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full"
            >
              <Chrome className="h-4 w-4 mr-2" />
              Entrar com Google
            </Button>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4">
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
                  Mínimo de 8 caracteres, com letras maiúsculas, minúsculas e números
                </p>
              </div>

              <div className="flex items-start space-x-3 py-3">
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
                  Li e aceito os{" "}
                  <Link 
                    to="/termos" 
                    target="_blank"
                    className="text-primary hover:underline font-medium"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Termos de Uso e Política de Privacidade
                  </Link>
                </label>
              </div>

              <Button
                type="submit"
                disabled={loading || !acceptedTerms}
                className="w-full"
              >
                <Mail className="h-4 w-4 mr-2" />
                {loading ? "Criando conta..." : "Criar conta"}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">ou</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full"
            >
              <Chrome className="h-4 w-4 mr-2" />
              Cadastrar com Google
            </Button>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}