import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import logo from "@/assets/horamed-logo-transparent.png";
import heroImage from "@/assets/landing-hero-family.jpg";
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
import { useLanguage } from "@/contexts/LanguageContext";
import { PRICING, BRL_COUNTRIES } from "@/lib/stripeConfig";

const Landing = () => {
  const authUrl = getAuthRedirectUrl();
  const { t, language, country } = useLanguage();
  
  // Determine pricing based on country
  const isBrazil = BRL_COUNTRIES.includes(country.code);
  const pricing = isBrazil ? PRICING.brl : PRICING.usd;
  const priceDisplay = `${pricing.symbol}${pricing.monthly.toFixed(2)}`;
  const priceLabel = language === 'pt' ? '/mês' : '/month';

  const benefits = [
    {
      icon: Bell,
      title: t('landing.benefit1Title'),
      description: t('landing.benefit1Desc')
    },
    {
      icon: FileText,
      title: t('landing.benefit2Title'),
      description: t('landing.benefit2Desc')
    },
    {
      icon: Users,
      title: t('landing.benefit3Title'),
      description: t('landing.benefit3Desc')
    },
    {
      icon: Shield,
      title: t('landing.benefit4Title'),
      description: t('landing.benefit4Desc')
    },
    {
      icon: Brain,
      title: t('landing.benefit5Title'),
      description: t('landing.benefit5Desc')
    },
    {
      icon: Calendar,
      title: t('landing.benefit6Title'),
      description: t('landing.benefit6Desc')
    }
  ];

  const testimonials = language === 'pt' ? [
    {
      name: "Maria Helena",
      role: "Filha cuidadora",
      content: "Minha mãe tem 78 anos e toma 6 medicamentos. Antes eu ligava 3 vezes por dia para lembrar. Agora tenho paz de saber que ela está cuidada.",
      rating: 5,
    },
    {
      name: "Roberto",
      role: "Paciente cardíaco",
      content: "Depois do infarto, a disciplina virou questão de vida. O HoraMed me dá essa segurança todo dia, sem falhar.",
      rating: 5,
    },
    {
      name: "Carla",
      role: "Mãe de 3 filhos",
      content: "Organizo as vacinas das crianças e os remédios dos meus pais idosos no mesmo app. Simplificou minha vida.",
      rating: 5,
    }
  ] : [
    {
      name: "Mary H.",
      role: "Caregiver daughter",
      content: "My mom is 78 and takes 6 medications. I used to call 3 times a day to remind her. Now I have peace of mind knowing she's taken care of.",
      rating: 5,
    },
    {
      name: "Robert",
      role: "Heart patient",
      content: "After my heart attack, discipline became a matter of life. HoraMed gives me that security every day, without fail.",
      rating: 5,
    },
    {
      name: "Carol",
      role: "Mother of 3",
      content: "I organize my kids' vaccines and my elderly parents' medications in the same app. It simplified my life.",
      rating: 5,
    }
  ];

  const freeFeatures = [
    t('landing.feature1'),
    t('landing.feature2'),
    t('landing.feature3'),
    t('landing.feature4'),
  ];

  const premiumFeatures = [
    t('landing.featurePremium1'),
    t('landing.featurePremium2'),
    t('landing.featurePremium3'),
    t('landing.featurePremium4'),
    t('landing.featurePremium5'),
  ];

  const steps = [
    { step: "1", title: t('landing.step1Title'), desc: t('landing.step1Desc') },
    { step: "2", title: t('landing.step2Title'), desc: t('landing.step2Desc') },
    { step: "3", title: t('landing.step3Title'), desc: t('landing.step3Desc') },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title={language === 'pt' ? "HoraMed - Cuidar de quem você ama ficou mais simples" : "HoraMed - Caring for your loved ones made simple"} 
        description={language === 'pt' 
          ? "Lembretes de medicamentos para você e sua família. Organize a saúde de quem você ama com tranquilidade e confiança."
          : "Medication reminders for you and your family. Organize the health of your loved ones with peace and confidence."
        }
      />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logo} alt="HoraMed" className="h-10 w-auto" />
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => window.location.href = authUrl}>
              {t('landing.login')}
            </Button>
            <Button onClick={() => window.location.href = authUrl}>
              {t('landing.startFree')}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
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
                {language === 'pt' ? (
                  <>A tranquilidade de saber que <span className="text-primary">quem você ama está cuidado</span></>
                ) : (
                  <>The peace of knowing <span className="text-primary">your loved ones are taken care of</span></>
                )}
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed">
                {t('landing.heroSubtitle')}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button 
                  size="lg" 
                  onClick={() => window.location.href = authUrl}
                  className="h-14 px-8 text-lg font-medium"
                >
                  {t('landing.ctaPrimary')}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-6 text-sm text-muted-foreground pt-2">
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" /> {t('landing.noCreditCard')}
                </span>
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" /> {t('landing.freeTrial')}
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
                  alt={language === 'pt' ? "Filha cuidando da mãe idosa" : "Daughter caring for elderly mother"} 
                  className="w-full h-auto object-cover"
                />
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
              "{t('landing.emotionalQuote')}"
            </p>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('landing.emotionalText')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t('landing.worksTitle')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('landing.worksSubtitle')}
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

      {/* Social Proof */}
      <section className="py-12 px-4 border-y border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-12 text-center">
            <div>
              <p className="text-3xl font-bold text-foreground">10,000+</p>
              <p className="text-sm text-muted-foreground">{t('landing.dosesRemembered')}</p>
            </div>
            <div className="w-px h-10 bg-border/50 hidden sm:block" />
            <div>
              <p className="text-3xl font-bold text-foreground">500+</p>
              <p className="text-sm text-muted-foreground">{t('landing.familiesOrganized')}</p>
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
              {t('landing.howItWorksTitle')}
            </h2>
            <p className="text-lg text-muted-foreground">
              {t('landing.howItWorksSubtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {steps.map((item, i) => (
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

      {/* Testimonials */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t('landing.testimonialsTitle')}
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
                alt={language === 'pt' ? "Idoso feliz usando smartphone" : "Happy senior using smartphone"} 
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
                {t('landing.simpleTitle')}
              </h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {t('landing.simpleDesc')}
              </p>
              <div className="flex items-center gap-4">
                <Smartphone className="w-8 h-8 text-primary" />
                <span className="text-muted-foreground">{t('landing.worksOnPhone')}</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t('landing.pricingTitle')}
            </h2>
            <p className="text-lg text-muted-foreground">
              {t('landing.pricingSubtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free Plan */}
            <Card className="p-8 border-border/50 bg-card">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-foreground">{t('landing.planFree')}</h3>
                <p className="text-muted-foreground">{t('landing.planFreeDesc')}</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-foreground">{pricing.symbol}0</span>
                <span className="text-muted-foreground">{priceLabel}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {freeFeatures.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-muted-foreground">
                    <Check className="w-4 h-4 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full" onClick={() => window.location.href = authUrl}>
                {t('landing.startFree')}
              </Button>
            </Card>

            {/* Premium Plan */}
            <Card className="p-8 border-primary/30 bg-card relative">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                {t('landing.mostPopular')}
              </Badge>
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-foreground">{t('landing.planPremium')}</h3>
                <p className="text-muted-foreground">{t('landing.planPremiumDesc')}</p>
              </div>
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-foreground">{priceDisplay}</span>
                  <span className="text-muted-foreground">{priceLabel}</span>
                </div>
                <p className="text-sm text-primary mt-1">{t('landing.freeTrial')}</p>
              </div>
              <ul className="space-y-3 mb-8">
                {premiumFeatures.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-foreground">
                    <Check className="w-4 h-4 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full" onClick={() => window.location.href = authUrl}>
                {t('landing.tryFree')}
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-3">
                {language === 'pt' ? 'Cancele quando quiser, sem burocracia' : 'Cancel anytime, no hassle'}
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
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
              {t('landing.finalCtaTitle')}
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-xl mx-auto">
              {t('landing.finalCtaDesc')}
            </p>
            <Button 
              size="lg" 
              onClick={() => window.location.href = authUrl}
              className="h-14 px-10 text-lg font-medium"
            >
              {t('landing.ctaPrimary')}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              {t('landing.noCreditCard')} • {language === 'pt' ? 'Pronto em 2 minutos' : 'Ready in 2 minutes'}
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
                {t('landing.footerTerms')}
              </a>
              <a href="/privacidade" className="hover:text-foreground transition-colors">
                {t('landing.footerPrivacy')}
              </a>
              <button onClick={() => window.location.href = authUrl} className="hover:text-foreground transition-colors">
                {t('landing.login')}
              </button>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border/30 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} HoraMed. {t('landing.footerRights')}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
