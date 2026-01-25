import { ArrowLeft, ExternalLink, Mail, Shield, FileText, Heart, Info, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { OceanBackground } from "@/components/ui/OceanBackground";

// App version - update this with each release
const APP_VERSION = "1.0.0";
const BUILD_NUMBER = "1";

const About = () => {
  const navigate = useNavigate();

  const openLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-background relative">
      <OceanBackground variant="page" />
      
      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/50">
          <div className="flex items-center gap-3 px-4 py-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Sobre o App</h1>
          </div>
        </header>

        <main className="px-4 py-6 pb-32 max-w-lg mx-auto space-y-6">
          {/* Logo and Version */}
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-cyan-500/20 flex items-center justify-center shadow-lg">
              <img 
                src="/logo_HoraMed.png" 
                alt="HoraMed" 
                className="w-16 h-16 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">HoraMed</h2>
              <p className="text-muted-foreground mt-1">
                Sua rotina de saúde, sem esquecimentos.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-full">
              <Smartphone className="h-4 w-4" />
              <span>Versão {APP_VERSION}</span>
              <span className="text-muted-foreground/50">•</span>
              <span>Build {BUILD_NUMBER}</span>
            </div>
          </div>

          <Separator />

          {/* Mission */}
          <Card className="card-clean">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Heart className="h-5 w-5 text-rose-500" />
                Nossa Missão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Ajudar você e sua família a nunca mais esquecer de tomar medicamentos. 
                O HoraMed foi criado pensando em quem cuida e em quem precisa de cuidado, 
                oferecendo lembretes confiáveis e uma experiência simples de usar.
              </p>
            </CardContent>
          </Card>

          {/* Features */}
          <Card className="card-clean">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Info className="h-5 w-5 text-primary" />
                Recursos Principais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <FeatureItem 
                icon="🔔" 
                title="Lembretes Inteligentes"
                description="Alarmes que funcionam mesmo com o celular bloqueado"
              />
              <FeatureItem 
                icon="👨‍👩‍👧‍👦" 
                title="Perfis Familiares"
                description="Cuide de toda a família em uma só conta"
              />
              <FeatureItem 
                icon="📋" 
                title="Carteira de Saúde"
                description="Guarde receitas, exames e vacinas de forma segura"
              />
              <FeatureItem 
                icon="🤖" 
                title="Clara - Assistente IA"
                description="Tire dúvidas sobre medicamentos e interações"
              />
              <FeatureItem 
                icon="📊" 
                title="Acompanhamento"
                description="Estatísticas e relatórios para suas consultas"
              />
            </CardContent>
          </Card>

          {/* Legal Links */}
          <Card className="card-clean">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-5 w-5 text-emerald-500" />
                Privacidade e Termos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-between h-auto py-3"
                onClick={() => navigate('/privacidade')}
              >
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Política de Privacidade
                </span>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-between h-auto py-3"
                onClick={() => navigate('/termos')}
              >
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Termos de Uso
                </span>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </Button>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="card-clean">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail className="h-5 w-5 text-blue-500" />
                Contato e Suporte
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Dúvidas, sugestões ou problemas? Estamos aqui para ajudar.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => openLink('mailto:contato@horamed.net')}
              >
                <Mail className="h-4 w-4 mr-2" />
                contato@horamed.net
              </Button>
            </CardContent>
          </Card>

          {/* Credits */}
          <div className="text-center text-xs text-muted-foreground space-y-2 pt-4">
            <p>
              Desenvolvido com ❤️ para você e sua família
            </p>
            <p>
              © {new Date().getFullYear()} HoraMed. Todos os direitos reservados.
            </p>
            <p className="text-muted-foreground/60">
              CNPJ: 00.000.000/0001-00
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

interface FeatureItemProps {
  icon: string;
  title: string;
  description: string;
}

const FeatureItem = ({ icon, title, description }: FeatureItemProps) => (
  <div className="flex items-start gap-3">
    <span className="text-xl">{icon}</span>
    <div>
      <p className="font-medium text-sm">{title}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  </div>
);

export default About;
