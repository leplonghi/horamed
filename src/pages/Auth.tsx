import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Mail, Chrome, Fingerprint } from "lucide-react";
import logo from "@/assets/horamend-logo.png";
import { z } from "zod";
import { useBiometric } from "@/hooks/useBiometric";

const passwordSchema = z.string()
  .min(8, "A senha deve ter no mínimo 8 caracteres")
  .regex(/[A-Z]/, "A senha deve conter pelo menos uma letra maiúscula")
  .regex(/[a-z]/, "A senha deve conter pelo menos uma letra minúscula")
  .regex(/[0-9]/, "A senha deve conter pelo menos um número");

export default function Auth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { isAvailable, isNativePlatform, authenticate, getBiometryName } = useBiometric();
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    // Check if user has biometric credentials saved
    const checkBiometricSetup = async () => {
      const hasBiometric = localStorage.getItem('biometric_enabled');
      setBiometricEnabled(hasBiometric === 'true');
    };
    checkBiometricSetup();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Erro ao fazer login com Google");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Preencha todos os campos");
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
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;
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
      
      // If biometric is available and not yet enabled, offer to enable it
      if (isAvailable && isNativePlatform && !biometricEnabled) {
        localStorage.setItem('biometric_email', email);
        localStorage.setItem('biometric_enabled', 'true');
        setBiometricEnabled(true);
        toast.success(`Login realizado! ${getBiometryName()} ativada 💚`);
      } else {
        toast.success("Login realizado! 💚");
      }
      
      navigate("/");
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      setLoading(true);
      
      // Authenticate with biometrics
      await authenticate(`Use ${getBiometryName()} para entrar no HoraMed`);
      
      // Get stored email
      const storedEmail = localStorage.getItem('biometric_email');
      if (!storedEmail) {
        toast.error("Credenciais biométricas não encontradas. Faça login com e-mail primeiro.");
        return;
      }

      // Get current session or prompt for password
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        toast.success("Login realizado com biometria! 💚");
        navigate("/");
      } else {
        toast.error("Sessão expirada. Faça login com e-mail novamente.");
        localStorage.removeItem('biometric_enabled');
        setBiometricEnabled(false);
      }
    } catch (error: any) {
      console.error("Biometric login error:", error);
      toast.error("Falha na autenticação biométrica");
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
            Gerencie sua rotina de medicamentos com facilidade
          </p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Entrar</TabsTrigger>
            <TabsTrigger value="signup">Criar conta</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
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

            {isAvailable && isNativePlatform && biometricEnabled && (
              <>
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
                  onClick={handleBiometricLogin}
                  disabled={loading}
                  className="w-full"
                >
                  <Fingerprint className="h-4 w-4 mr-2" />
                  Entrar com {getBiometryName()}
                </Button>
              </>
            )}
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

              <Button
                type="submit"
                disabled={loading}
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