import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  ArrowLeft, Check, Crown, Shield, Sparkles, Star, Zap, Gift, Loader2,
  Pill, Bell, BarChart3, FileText, Users, Bot, Camera, FileCheck, Ban,
  HeartPulse, X
} from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { getReferralDiscountForUser } from "@/lib/referrals";
import { useLanguage } from "@/contexts/LanguageContext";
import { PRICING } from "@/lib/stripeConfig";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Plans() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");
  const [referralDiscount, setReferralDiscount] = useState(0);
  const [countryCode, setCountryCode] = useState<string>('BR');
  const { isPremium, subscription, isOnTrial, trialDaysLeft } = useSubscription();

  useEffect(() => {
    const detectCountry = async () => {
      try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (timezone.includes('Sao_Paulo') || timezone.includes('Brasilia')) {
          setCountryCode('BR');
        } else {
          setCountryCode(language === 'pt' ? 'BR' : 'US');
        }
      } catch {
        setCountryCode(language === 'pt' ? 'BR' : 'US');
      }
    };
    detectCountry();
  }, [language]);

  const isBrazil = countryCode === 'BR';
  const pricing = isBrazil ? PRICING.brl : PRICING.usd;
  const monthlyPrice = pricing.monthly;
  const annualPrice = pricing.annual;
  const annualMonthly = annualPrice / 12;
  const savingsPercent = Math.round((1 - annualMonthly / monthlyPrice) * 100);

  useEffect(() => {
    loadReferralDiscount();
  }, []);

  const loadReferralDiscount = async () => {
    if (!isPremium) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const discount = await getReferralDiscountForUser(user.id);
      setReferralDiscount(discount);
    } catch (error) {
      console.error('Error loading referral discount:', error);
    }
  };

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const planType = billingCycle === 'annual' ? 'annual' : 'monthly';
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { planType, countryCode }
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(t('plans.checkoutError'));
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    if (isBrazil) {
      return `R$${price.toFixed(2).replace('.', ',')}`;
    }
    return `$${price.toFixed(2)}`;
  };

  const freeFeatures = [
    { icon: <Pill className="h-4 w-4" />, text: t('plans.feature.1medication'), included: true },
    { icon: <Bell className="h-4 w-4" />, text: t('plans.feature.basicNotifications'), included: true },
    { icon: <BarChart3 className="h-4 w-4" />, text: t('plans.feature.limitedHistory'), included: true },
    { icon: <Ban className="h-4 w-4" />, text: t('plans.feature.withAds'), included: false },
  ];

  const premiumFeatures = [
    { icon: <Pill className="h-4 w-4" />, text: t('plans.unlimitedMeds'), highlight: true },
    { icon: <Bell className="h-4 w-4" />, text: t('plans.smartReminders') },
    { icon: <BarChart3 className="h-4 w-4" />, text: t('plans.completeHistory') },
    { icon: <FileText className="h-4 w-4" />, text: t('plans.labTracking') },
    { icon: <Bot className="h-4 w-4" />, text: t('plans.aiAssistant'), highlight: true },
    { icon: <Camera className="h-4 w-4" />, text: t('plans.prescriptionScanner') },
    { icon: <Users className="h-4 w-4" />, text: t('plans.familyProfiles') },
    { icon: <FileCheck className="h-4 w-4" />, text: t('plans.monthlyReports') },
    { icon: <HeartPulse className="h-4 w-4" />, text: t('plans.feature.drugInteractions') },
    { icon: <Ban className="h-4 w-4" />, text: t('plans.noAds') },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">{t('plans.chooseYourPlan')}</h1>
        </div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-4xl mx-auto px-4 py-8 space-y-8"
      >
        {/* Hero Section */}
        <motion.div variants={itemVariants} className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-full">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">{t('plans.freeTrialBadge')}</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            {t('plans.unlockPremium')}
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            {t('plans.completeCareSub')}
          </p>
        </motion.div>

        {/* Billing Toggle */}
        <motion.div variants={itemVariants} className="flex justify-center">
          <div className="inline-flex bg-muted/50 p-1.5 rounded-2xl shadow-inner">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={cn(
                "px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300",
                billingCycle === "monthly" 
                  ? "bg-background shadow-lg text-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t('plans.monthly')}
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={cn(
                "px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 relative",
                billingCycle === "annual" 
                  ? "bg-background shadow-lg text-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t('plans.annual')}
              <Badge className="absolute -top-2 -right-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-[10px] px-2 border-0 shadow-lg">
                -{savingsPercent}%
              </Badge>
            </button>
          </div>
        </motion.div>

        {/* Plans Grid */}
        <motion.div variants={itemVariants} className="grid md:grid-cols-2 gap-6">
          {/* Free Plan */}
          <div className={cn(
            "rounded-3xl p-6 relative overflow-hidden",
            "bg-gradient-to-br from-card to-muted/30",
            "border border-border/50",
            "shadow-[var(--shadow-glass)]"
          )}>
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center">
                  <HeartPulse className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{t('plans.freePlan')}</h3>
                  <p className="text-sm text-muted-foreground">{t('plans.freePlanDesc')}</p>
                </div>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">{formatPrice(0)}</span>
                <span className="text-muted-foreground">/{t('plans.mo')}</span>
              </div>

              <div className="space-y-3">
                {freeFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className={cn(
                      "p-1.5 rounded-lg",
                      feature.included ? "bg-muted text-muted-foreground" : "bg-destructive/10 text-destructive"
                    )}>
                      {feature.included ? feature.icon : <X className="h-4 w-4" />}
                    </div>
                    <span className={cn(
                      "text-sm",
                      !feature.included && "text-muted-foreground line-through"
                    )}>
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>

              <Button 
                variant="outline" 
                className="w-full h-12 rounded-xl"
                onClick={() => navigate('/hoje')}
              >
                {t('plans.continueWithFree')}
              </Button>
            </div>
          </div>

          {/* Premium Plan */}
          <div className={cn(
            "rounded-3xl p-6 relative overflow-hidden",
            "bg-gradient-to-br from-primary/10 via-purple-500/5 to-primary/10",
            "border-2 border-primary/30",
            "shadow-[0_0_60px_-15px_hsl(var(--primary)/0.3)]"
          )}>
            {/* Glow effect */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />

            {/* Popular badge */}
            <div className="absolute top-4 right-4">
              <Badge className="bg-gradient-to-r from-primary to-purple-500 text-primary-foreground border-0 shadow-lg">
                {t('plans.mostPopular')}
              </Badge>
            </div>

            <div className="relative space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-lg">
                  <Crown className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{t('plans.premiumPlan')}</h3>
                  <p className="text-sm text-muted-foreground">{t('plans.fullAccess')}</p>
                </div>
              </div>

              <div className="space-y-1">
                {billingCycle === "annual" && (
                  <p className="text-sm text-muted-foreground line-through">
                    {formatPrice(monthlyPrice)}/{t('plans.mo')}
                  </p>
                )}
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                    {formatPrice(billingCycle === "annual" ? annualMonthly : monthlyPrice)}
                  </span>
                  <span className="text-muted-foreground">/{t('plans.mo')}</span>
                </div>
                {billingCycle === "annual" && (
                  <p className="text-sm text-muted-foreground">
                    {formatPrice(annualPrice)} {t('plans.billedAnnually')}
                  </p>
                )}
              </div>

              {/* Referral Discount */}
              {referralDiscount > 0 && (
                <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <Gift className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">
                    {t('plans.referralDiscountApplied', { percent: referralDiscount.toString() })}
                  </span>
                </div>
              )}

              {/* CTA Button */}
              {isPremium ? (
                <div className="flex items-center gap-2 p-4 bg-primary/10 rounded-xl border border-primary/20">
                  <Check className="h-5 w-5 text-primary" />
                  <span className="font-medium text-primary">
                    {isOnTrial 
                      ? `${t('plans.youArePremium')} (${trialDaysLeft} ${t('profile.daysRemaining')})`
                      : t('plans.youArePremium')
                    }
                  </span>
                </div>
              ) : (
                <Button 
                  size="lg"
                  className={cn(
                    "w-full h-14 text-lg font-semibold rounded-xl",
                    "bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90",
                    "shadow-[0_8px_30px_-10px_hsl(var(--primary)/0.5)]",
                    "transition-all duration-300 hover:shadow-[0_12px_40px_-10px_hsl(var(--primary)/0.6)]"
                  )}
                  onClick={handleUpgrade}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      {t('plans.loading')}
                    </>
                  ) : (
                    <>
                      <Zap className="h-5 w-5 mr-2" />
                      {t('plans.startFreeTrial')}
                    </>
                  )}
                </Button>
              )}

              <p className="text-xs text-center text-muted-foreground">
                {t('plans.cancelAnytime')}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Premium Features List */}
        <motion.div variants={itemVariants} className="space-y-4">
          <h3 className="font-semibold text-center text-lg">{t('plans.everythingIncluded')}</h3>
          <div className="grid sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
            {premiumFeatures.map((feature, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl transition-colors",
                  feature.highlight 
                    ? "bg-primary/10 border border-primary/20" 
                    : "bg-muted/30 hover:bg-muted/50"
                )}
              >
                <div className={cn(
                  "p-2 rounded-lg",
                  feature.highlight ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  {feature.icon}
                </div>
                <span className={cn(
                  "text-sm font-medium",
                  feature.highlight && "text-primary"
                )}>
                  {feature.text}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Social Proof */}
        <motion.div 
          variants={itemVariants}
          className={cn(
            "rounded-2xl p-6 text-center",
            "bg-gradient-to-br from-muted/50 to-muted/30",
            "border border-border/50"
          )}
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-3">
                {['👨', '👩', '👴', '👧', '👨‍⚕️'].map((emoji, i) => (
                  <div 
                    key={i} 
                    className="h-10 w-10 rounded-full bg-muted border-2 border-background flex items-center justify-center text-lg shadow-sm"
                  >
                    {emoji}
                  </div>
                ))}
              </div>
              <span className="text-sm text-muted-foreground font-medium">+10.000</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map((i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="font-bold text-lg">4.8</span>
              <span className="text-sm text-muted-foreground">{t('plans.avgRating')}</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            {t('plans.joinThousands')}
          </p>
        </motion.div>

        {/* Trust Badges */}
        <motion.div 
          variants={itemVariants}
          className="flex flex-wrap items-center justify-center gap-6 py-4"
        >
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shield className="h-5 w-5 text-green-500" />
            <span className="text-sm">{t('plans.secure')}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Check className="h-5 w-5 text-green-500" />
            <span className="text-sm">{t('plans.noCommitment')}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Zap className="h-5 w-5 text-yellow-500" />
            <span className="text-sm">{t('plans.stripePayment')}</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}