import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import logo from "@/assets/horamed-logo.png";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    console.log('Index page mounted, user:', user?.email);
    if (!loading && user) {
      navigate("/hoje");
    }
  }, [user, loading, navigate]);

  const handleGoogleLogin = async () => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      console.log('Initiating Google login with redirect:', redirectUrl);
      
      const { error } = await supabase.auth.signInWithOAuth({
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
        console.error("Google login error:", error);
        toast.error('Erro ao fazer login com Google. Verifique se está configurado no backend.');
      }
    } catch (error) {
      console.error("Exception during Google login:", error);
      toast.error('Erro ao fazer login com Google');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-6 animate-fade-in">
      <Card className="w-full max-w-lg p-8 space-y-8 shadow-2xl animate-fade-in-scale">
        <div className="text-center space-y-6">
          <div className="flex justify-center animate-bounce-subtle">
            <img 
              src={logo} 
              alt="HoraMed" 
              className="h-40 w-auto" 
              width="170" 
              height="160"
              fetchPriority="high"
              decoding="async"
            />
          </div>
          <div className="animate-slide-up">
            <p className="text-lg text-muted-foreground">
              Gestão completa da sua saúde em um só lugar
            </p>
          </div>
        </div>

        <div className="space-y-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <Button
            onClick={handleGoogleLogin}
            size="lg"
            className="w-full h-14 text-lg font-semibold bg-white hover:bg-gray-50 text-gray-800 border-2 border-gray-200 shadow-md hover:shadow-lg transition-all hover-lift"
          >
            <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Entrar com Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm uppercase">
              <span className="bg-card px-3 text-muted-foreground">ou</span>
            </div>
          </div>

          <Button
            onClick={() => navigate("/auth")}
            variant="outline"
            size="lg"
            className="w-full h-14 text-lg"
          >
            Entrar com E-mail
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Não tem uma conta?{" "}
          <button
            onClick={() => navigate("/auth")}
            className="text-primary font-semibold hover:underline"
          >
            Cadastre-se aqui
          </button>
        </p>
      </Card>
    </div>
  );
};

export default Index;
