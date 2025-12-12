import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import logo from "@/assets/horamed-logo.png";
import { 
  Bell, 
  FileText, 
  Users, 
  Shield, 
  Clock, 
  Heart,
  Star,
  Check,
  ArrowRight,
  Sparkles,
  Calendar,
  Brain,
  Smartphone,
  Zap,
  TrendingUp,
  AlertTriangle,
  Timer,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Landing = () => {
  const navigate = useNavigate();
  const [liveSignups, setLiveSignups] = useState(47);
  const [showUrgencyBanner, setShowUrgencyBanner] = useState(true);
  const [recentActivity, setRecentActivity] = useState<string | null>(null);

  // Simulate live signups counter
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveSignups(prev => prev + Math.floor(Math.random() * 3));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Simulate recent activity notifications
  useEffect(() => {
    const activities = [
      "Maria de São Paulo acabou de criar uma conta",
      "João do Rio de Janeiro adicionou 3 medicamentos",
      "Ana de Belo Horizonte ativou o Premium",
      "Carlos de Curitiba nunca mais esqueceu uma dose",
      "Fernanda de Salvador organizou toda a família"
    ];
    
    const showActivity = () => {
      const activity = activities[Math.floor(Math.random() * activities.length)];
      setRecentActivity(activity);
      setTimeout(() => setRecentActivity(null), 4000);
    };

    const interval = setInterval(showActivity, 12000);
    setTimeout(showActivity, 3000); // First one after 3s
    return () => clearInterval(interval);
  }, []);

  const benefits = [
    {
      icon: Bell,
      title: "Lembretes Inteligentes",
      description: "Nunca mais esqueça um medicamento. Notificações personalizadas no horário certo."
    },
    {
      icon: FileText,
      title: "Carteira de Saúde Digital",
      description: "Receitas, exames e vacinas organizados em um só lugar. Leitura automática por OCR."
    },
    {
      icon: Users,
      title: "Gestão Familiar",
      description: "Cuide de toda a família. Perfis individuais para filhos, pais e dependentes."
    },
    {
      icon: Shield,
      title: "Controle de Estoque",
      description: "Saiba quando comprar mais. Alertas automáticos antes de acabar."
    },
    {
      icon: Brain,
      title: "Assistente de Saúde IA",
      description: "Tire dúvidas sobre medicamentos e receba orientações personalizadas."
    },
    {
      icon: Calendar,
      title: "Relatórios Mensais",
      description: "Acompanhe seu progresso e compartilhe com seu médico em PDF profissional."
    }
  ];

  const testimonials = [
    {
      name: "Maria Silva",
      role: "Cuidadora de idosos",
      content: "O HoraMed salvou minha rotina! Cuido de 3 idosos e agora nunca mais esqueço nenhum medicamento.",
      rating: 5
    },
    {
      name: "João Santos",
      role: "Pai de família",
      content: "Uso para toda a família. Vacinas das crianças, remédios dos avós... tudo organizado em um lugar só.",
      rating: 5
    },
    {
      name: "Ana Costa",
      role: "Paciente crônica",
      content: "Tomo 8 medicamentos por dia. Antes vivia perdida, agora tenho controle total da minha saúde.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Urgency Banner */}
      <AnimatePresence>
        {showUrgencyBanner && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 px-4"
          >
            <div className="container mx-auto flex items-center justify-center gap-3 text-sm">
              <Timer className="w-4 h-4 animate-pulse" />
              <span>
                <strong>Oferta limitada:</strong> 7 dias de Premium GRÁTIS para novos usuários
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline font-semibold">{liveSignups} pessoas se cadastraram hoje</span>
              <button onClick={() => setShowUrgencyBanner(false)} className="ml-2 opacity-70 hover:opacity-100">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Activity Toast */}
      <AnimatePresence>
        {recentActivity && (
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="fixed bottom-24 left-4 z-50 bg-card border border-border shadow-lg rounded-lg p-3 max-w-xs"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <p className="text-sm text-foreground">{recentActivity}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border" style={{ top: showUrgencyBanner ? "36px" : 0 }}>
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logo} alt="HoraMed" className="h-10 w-auto" />
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/auth")}>
              Entrar
            </Button>
            <Button onClick={() => navigate("/auth")} className="bg-primary hover:bg-primary/90 animate-pulse">
              Começar Grátis
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className={`pb-20 px-4 bg-gradient-to-b from-primary/5 via-background to-background ${showUrgencyBanner ? "pt-40" : "pt-32"}`}>
        <div className="container mx-auto max-w-6xl">
          <motion.div 
            className="text-center space-y-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Live Counter Badge */}
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge variant="secondary" className="px-4 py-1.5 text-sm font-medium">
                <Sparkles className="w-4 h-4 mr-2 inline" />
                +22.000 doses lembradas este mês
              </Badge>
              <Badge className="px-4 py-1.5 text-sm font-medium bg-green-500/10 text-green-600 border-green-500/20">
                <TrendingUp className="w-4 h-4 mr-2 inline" />
                {liveSignups} novos usuários hoje
              </Badge>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
              Sua saúde no <span className="text-primary">horário certo</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              O app que lembra seus medicamentos, organiza seus documentos de saúde e cuida de toda a família. 
              <strong className="text-foreground"> Simples como deveria ser.</strong>
            </p>

            {/* Urgency CTA */}
            <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-xl p-4 max-w-md mx-auto">
              <div className="flex items-center justify-center gap-2 text-orange-600 dark:text-orange-400 mb-2">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-semibold">Oferta por tempo limitado</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Cadastre-se agora e ganhe <strong className="text-foreground">7 dias de Premium grátis</strong>. 
                Sem cartão de crédito.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                size="lg" 
                onClick={() => navigate("/auth")}
                className="h-14 px-8 text-lg font-semibold bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all group"
              >
                Começar Grátis Agora
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate("/auth")}
                className="h-14 px-8 text-lg"
              >
                <Smartphone className="mr-2 w-5 h-5" />
                Ver Demonstração
              </Button>
            </div>

            <div className="flex flex-wrap gap-4 justify-center text-sm text-muted-foreground pt-2">
              <span className="flex items-center gap-1">
                <Check className="w-4 h-4 text-green-500" /> Grátis para sempre
              </span>
              <span className="flex items-center gap-1">
                <Check className="w-4 h-4 text-green-500" /> Sem cartão de crédito
              </span>
              <span className="flex items-center gap-1">
                <Check className="w-4 h-4 text-green-500" /> 7 dias Premium grátis
              </span>
            </div>
          </motion.div>

          {/* App Preview Mockup */}
          <motion.div 
            className="mt-16 relative"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-3xl p-8 md:p-12">
              <div className="bg-card rounded-2xl shadow-2xl p-6 max-w-md mx-auto border border-border">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">Próximas doses</h3>
                    <Badge variant="outline" className="text-primary border-primary">Hoje</Badge>
                  </div>
                  
                  {[
                    { name: "Losartana 50mg", time: "08:00", status: "taken" },
                    { name: "Metformina 850mg", time: "12:00", status: "pending" },
                    { name: "Omeprazol 20mg", time: "19:00", status: "pending" }
                  ].map((med, i) => (
                    <div key={i} className={`flex items-center justify-between p-3 rounded-lg ${
                      med.status === 'taken' ? 'bg-primary/10' : 'bg-muted/50'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          med.status === 'taken' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        }`}>
                          {med.status === 'taken' ? <Check className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{med.name}</p>
                          <p className="text-sm text-muted-foreground">{med.time}</p>
                        </div>
                      </div>
                      {med.status === 'taken' && (
                        <Badge className="bg-primary/20 text-primary border-0">Tomado</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="py-8 bg-muted/30 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-8 text-center">
            <div>
              <p className="text-3xl font-bold text-primary">10.000+</p>
              <p className="text-sm text-muted-foreground">Doses lembradas</p>
            </div>
            <div className="w-px h-12 bg-border hidden sm:block" />
            <div>
              <p className="text-3xl font-bold text-primary">500+</p>
              <p className="text-sm text-muted-foreground">Famílias protegidas</p>
            </div>
            <div className="w-px h-12 bg-border hidden sm:block" />
            <div>
              <p className="text-3xl font-bold text-primary">98%</p>
              <p className="text-sm text-muted-foreground">Taxa de adesão</p>
            </div>
            <div className="w-px h-12 bg-border hidden sm:block" />
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />)}
              <span className="ml-2 font-semibold">4.9</span>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Tudo que você precisa para cuidar da sua saúde
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Funcionalidades pensadas para quem toma medicamentos diariamente e cuida de familiares.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="p-6 h-full hover:shadow-lg transition-shadow border-border bg-card">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <benefit.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Como funciona
            </h2>
            <p className="text-lg text-muted-foreground">
              Comece a usar em menos de 2 minutos
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Cadastre seus medicamentos", desc: "Digite ou fotografe a receita. Nossa IA extrai tudo automaticamente." },
              { step: "2", title: "Receba lembretes", desc: "Notificações no horário certo. Push, WhatsApp ou alarme." },
              { step: "3", title: "Acompanhe seu progresso", desc: "Veja sua evolução e compartilhe relatórios com seu médico." }
            ].map((item, i) => (
              <motion.div
                key={i}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.15 }}
                viewport={{ once: true }}
              >
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              O que dizem nossos usuários
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="p-6 h-full bg-card border-border">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, j) => (
                      <Star key={j} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-foreground mb-4 italic">"{testimonial.content}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-primary font-semibold">{testimonial.name[0]}</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-orange-500/10 text-orange-600 border-orange-500/20">
              <Timer className="w-4 h-4 mr-2 inline" />
              Oferta por tempo limitado
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Planos simples e transparentes
            </h2>
            <p className="text-lg text-muted-foreground">
              Comece grátis. Upgrade quando quiser.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free Plan - with limitations highlighted */}
            <Card className="p-8 border-border bg-card relative">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-foreground">Grátis</h3>
                <p className="text-muted-foreground">Para experimentar</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-foreground">R$ 0</span>
                <span className="text-muted-foreground">/mês</span>
              </div>
              <ul className="space-y-3 mb-6">
                {[
                  { text: "1 medicamento ativo", limited: true },
                  { text: "5 documentos na carteira", limited: true },
                  { text: "2 consultas IA por dia", limited: true },
                  { text: "Lembretes push básicos", limited: false },
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-muted-foreground">
                    {feature.limited ? (
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                    ) : (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                    <span className={feature.limited ? "text-muted-foreground" : ""}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>
              
              {/* FOMO message for free */}
              <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-3 mb-6">
                <p className="text-xs text-orange-600 dark:text-orange-400">
                  ⚠️ Com apenas 1 medicamento, você pode perder doses importantes. 
                  <strong> 73% dos usuários fazem upgrade no primeiro mês.</strong>
                </p>
              </div>

              <Button variant="outline" className="w-full" onClick={() => navigate("/auth")}>
                Começar Grátis
              </Button>
            </Card>

            {/* Premium Plan - highlighted */}
            <Card className="p-8 border-2 border-primary bg-gradient-to-br from-primary/5 to-primary/10 relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-4 py-1.5 rounded-bl-lg">
                🔥 MAIS ESCOLHIDO
              </div>
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-foreground">Premium</h3>
                <p className="text-muted-foreground">Para quem leva a saúde a sério</p>
              </div>
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-foreground">R$ 19,90</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                    7 dias GRÁTIS
                  </Badge>
                  <span className="text-xs text-muted-foreground">sem compromisso</span>
                </div>
              </div>
              <ul className="space-y-3 mb-6">
                {[
                  "✅ Medicamentos ILIMITADOS",
                  "✅ Documentos ILIMITADOS",
                  "✅ IA ILIMITADA",
                  "✅ WhatsApp + Push + Alarme",
                  "✅ Relatório mensal para médico",
                  "✅ Gestão familiar completa",
                  "✅ Suporte prioritário"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-foreground font-medium">
                    {feature}
                  </li>
                ))}
              </ul>

              {/* Urgency */}
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-6">
                <p className="text-sm text-center">
                  <span className="font-bold text-primary">{liveSignups} pessoas</span> já se cadastraram hoje
                </p>
              </div>

              <Button 
                className="w-full h-12 bg-primary hover:bg-primary/90 text-lg font-semibold animate-pulse" 
                onClick={() => navigate("/auth")}
              >
                Começar 7 Dias Grátis
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-3">
                Menos de R$ 0,67/dia • Cancele quando quiser
              </p>
            </Card>
          </div>

          {/* Money back guarantee */}
          <div className="text-center mt-8">
            <div className="inline-flex items-center gap-2 bg-card border border-border rounded-full px-6 py-3">
              <Shield className="w-5 h-5 text-green-500" />
              <span className="text-sm text-muted-foreground">
                <strong className="text-foreground">Garantia de 7 dias</strong> — não gostou, cancele grátis
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-primary">
        <div className="container mx-auto max-w-3xl text-center">
          <Heart className="w-12 h-12 text-primary-foreground mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Comece a cuidar melhor da sua saúde hoje
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-8">
            Junte-se a milhares de brasileiros que já transformaram sua rotina de medicamentos.
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => navigate("/auth")}
            className="h-14 px-8 text-lg font-semibold"
          >
            Criar Minha Conta Grátis
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <p className="text-sm text-primary-foreground/60 mt-4">
            Sem cartão de crédito · Cancele quando quiser
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-card border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <img src={logo} alt="HoraMed" className="h-8 w-auto" />
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <button onClick={() => navigate("/termos")} className="hover:text-foreground transition-colors">
                Termos de Uso
              </button>
              <button onClick={() => navigate("/privacidade")} className="hover:text-foreground transition-colors">
                Privacidade
              </button>
              <button onClick={() => navigate("/auth")} className="hover:text-foreground transition-colors">
                Entrar
              </button>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} HoraMed. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
