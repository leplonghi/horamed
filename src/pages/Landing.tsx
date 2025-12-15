import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import logo from "@/assets/horamed-logo-optimized.webp";
import heroImage from "@/assets/landing-hero-family.jpg";
import caringHandsImage from "@/assets/landing-caring-hands.jpg";
import happySeniorImage from "@/assets/landing-happy-senior.jpg";
import { 
  Bell, 
  FileText, 
  Users, 
  Shield, 
  Heart,
  Star,
  Check,
  ArrowRight,
  Calendar,
  Brain,
  Smartphone,
  Quote
} from "lucide-react";
import { motion } from "framer-motion";
import { getAuthRedirectUrl } from "@/lib/domainConfig";
import SEOHead from "@/components/SEOHead";

const Landing = () => {
  const authUrl = getAuthRedirectUrl();

  const benefits = [
    {
      icon: Bell,
      title: "Lembretes no Horário Certo",
      description: "Notificações personalizadas para cada medicamento. Você cuida de quem ama, nós cuidamos do horário."
    },
    {
      icon: FileText,
      title: "Carteira de Saúde Digital",
      description: "Receitas, exames e vacinas organizados. Tudo pronto para mostrar ao médico quando precisar."
    },
    {
      icon: Users,
      title: "Cuidado em Família",
      description: "Acompanhe a saúde dos seus pais, filhos e dependentes. Cada um com seu perfil individual."
    },
    {
      icon: Shield,
      title: "Controle de Estoque",
      description: "Saiba quando comprar mais. Evite a angústia de ficar sem medicamento."
    },
    {
      icon: Brain,
      title: "Assistente Inteligente",
      description: "Tire dúvidas sobre seus medicamentos de forma simples e acessível."
    },
    {
      icon: Calendar,
      title: "Histórico Completo",
      description: "Acompanhe sua evolução e compartilhe relatórios profissionais com seu médico."
    }
  ];

  const testimonials = [
    {
      name: "Maria Helena",
      role: "Filha cuidadora",
      content: "Minha mãe tem 78 anos e toma 6 medicamentos. Antes eu ligava 3 vezes por dia para lembrar. Agora tenho paz de saber que ela está cuidada.",
      rating: 5,
      image: null
    },
    {
      name: "Roberto",
      role: "Paciente cardíaco",
      content: "Depois do infarto, a disciplina virou questão de vida. O HoraMed me dá essa segurança todo dia, sem falhar.",
      rating: 5,
      image: null
    },
    {
      name: "Carla",
      role: "Mãe de 3 filhos",
      content: "Organizo as vacinas das crianças e os remédios dos meus pais idosos no mesmo app. Simplificou minha vida.",
      rating: 5,
      image: null
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="HoraMed - Cuidar de quem você ama ficou mais simples" 
        description="Lembretes de medicamentos para você e sua família. Organize a saúde de quem você ama com tranquilidade e confiança."
      />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logo} alt="HoraMed" className="h-10 w-auto" />
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => window.location.href = authUrl}>
              Entrar
            </Button>
            <Button onClick={() => window.location.href = authUrl}>
              Começar Grátis
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section - Emotional */}
      <section className="pt-24 pb-16 md:pb-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                A tranquilidade de saber que <span className="text-primary">quem você ama está cuidado</span>
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed">
                Lembretes de medicamentos que funcionam. Para você, seus pais, toda a família. 
                Simples como deveria ser.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button 
                  size="lg" 
                  onClick={() => window.location.href = authUrl}
                  className="h-14 px-8 text-lg font-medium"
                >
                  Começar Agora — É Grátis
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-6 text-sm text-muted-foreground pt-2">
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" /> Sem cartão de crédito
                </span>
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" /> 7 dias Premium grátis
                </span>
              </div>
            </motion.div>

            <motion.div 
              className="relative"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src={heroImage} 
                  alt="Filha cuidando da mãe idosa com seus medicamentos" 
                  className="w-full h-auto object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-card rounded-xl shadow-lg p-4 border border-border max-w-xs hidden md:block">
                <p className="text-sm text-muted-foreground italic">
                  "Agora tenho certeza de que minha mãe tomou o remédio, mesmo de longe."
                </p>
                <p className="text-xs text-primary mt-2 font-medium">— Maria Helena, 52 anos</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Emotional Value Proposition */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <Quote className="w-10 h-10 text-primary/30 mx-auto mb-6" />
            <p className="text-2xl md:text-3xl font-medium text-foreground leading-relaxed mb-6">
              "Você sabe quantas vezes seu pai esqueceu de tomar o remédio da pressão essa semana?"
            </p>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Para quem cuida de familiares ou gerencia múltiplos medicamentos, cada dose esquecida é uma preocupação. 
              O HoraMed existe para trazer paz de espírito a quem precisa cuidar.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Funciona de verdade. Todo dia.
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Desenvolvido pensando em quem mais precisa: idosos, cuidadores e famílias.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="p-6 h-full hover:shadow-md transition-shadow border-border/50 bg-card">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <benefit.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof - Subtle */}
      <section className="py-12 px-4 border-y border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-12 text-center">
            <div>
              <p className="text-3xl font-bold text-foreground">10.000+</p>
              <p className="text-sm text-muted-foreground">Doses lembradas</p>
            </div>
            <div className="w-px h-10 bg-border/50 hidden sm:block" />
            <div>
              <p className="text-3xl font-bold text-foreground">500+</p>
              <p className="text-sm text-muted-foreground">Famílias organizadas</p>
            </div>
            <div className="w-px h-10 bg-border/50 hidden sm:block" />
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />)}
              <span className="ml-2 font-semibold text-foreground">4.9</span>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Comece em 2 minutos
            </h2>
            <p className="text-lg text-muted-foreground">
              Sem complicação. Se você sabe usar o celular, sabe usar o HoraMed.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              { 
                step: "1", 
                title: "Cadastre seus medicamentos", 
                desc: "Digite o nome ou fotografe a receita. A gente organiza tudo." 
              },
              { 
                step: "2", 
                title: "Receba lembretes", 
                desc: "No horário exato. Push, alarme ou até WhatsApp." 
              },
              { 
                step: "3", 
                title: "Tenha tranquilidade", 
                desc: "Saiba que você ou seu familiar está cuidado." 
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.15 }}
                viewport={{ once: true }}
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 text-primary text-xl font-bold flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials - Emotional */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Histórias reais de quem cuida
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="p-6 h-full bg-card border-border/50">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-foreground mb-6 leading-relaxed">"{testimonial.content}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-medium">{testimonial.name[0]}</span>
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

      {/* Image Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <img 
                src={happySeniorImage} 
                alt="Idoso feliz usando smartphone" 
                className="rounded-2xl shadow-lg w-full"
              />
            </motion.div>
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl md:text-3xl font-bold text-foreground">
                Tão simples que até seu pai vai conseguir usar
              </h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Desenvolvemos pensando em quem precisa de simplicidade. Botões grandes, textos claros, 
                e uma única função: lembrar de tomar o remédio.
              </p>
              <div className="flex items-center gap-4">
                <Smartphone className="w-8 h-8 text-primary" />
                <span className="text-muted-foreground">Funciona no celular que você já tem</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Section - Clean */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Comece grátis, evolua quando quiser
            </h2>
            <p className="text-lg text-muted-foreground">
              Sem surpresas. Sem letras pequenas.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free Plan */}
            <Card className="p-8 border-border/50 bg-card">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-foreground">Gratuito</h3>
                <p className="text-muted-foreground">Para começar</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-foreground">R$ 0</span>
                <span className="text-muted-foreground">/mês</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "1 medicamento ativo",
                  "Lembretes por push",
                  "Histórico básico",
                  "5 documentos na carteira"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-muted-foreground">
                    <Check className="w-4 h-4 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full" onClick={() => window.location.href = authUrl}>
                Começar Grátis
              </Button>
            </Card>

            {/* Premium Plan */}
            <Card className="p-8 border-primary/30 bg-card relative">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                Mais popular
              </Badge>
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-foreground">Premium</h3>
                <p className="text-muted-foreground">Para quem cuida de verdade</p>
              </div>
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-foreground">R$ 19,90</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                <p className="text-sm text-primary mt-1">7 dias grátis para experimentar</p>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "Medicamentos ilimitados",
                  "Documentos ilimitados",
                  "Gestão familiar completa",
                  "WhatsApp + Push + Alarme",
                  "Relatório mensal em PDF",
                  "Assistente IA ilimitado"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-foreground">
                    <Check className="w-4 h-4 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full" onClick={() => window.location.href = authUrl}>
                Experimentar 7 Dias Grátis
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-3">
                Cancele quando quiser, sem burocracia
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA - Emotional */}
      <section className="py-24 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <Heart className="w-12 h-12 text-primary mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Cuidar de quem você ama não precisa ser difícil
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-xl mx-auto">
              Cada lembrete é uma dose de tranquilidade. Para você e para quem depende de você.
            </p>
            <Button 
              size="lg" 
              onClick={() => window.location.href = authUrl}
              className="h-14 px-10 text-lg font-medium"
            >
              Começar Agora — É Grátis
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              Sem cartão de crédito • Pronto em 2 minutos
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-card border-t border-border/50">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <img src={logo} alt="HoraMed" className="h-8 w-auto" />
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="/termos" className="hover:text-foreground transition-colors">
                Termos de Uso
              </a>
              <a href="/privacidade" className="hover:text-foreground transition-colors">
                Privacidade
              </a>
              <button onClick={() => window.location.href = authUrl} className="hover:text-foreground transition-colors">
                Entrar
              </button>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border/30 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} HoraMed. Feito com cuidado para quem cuida.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;