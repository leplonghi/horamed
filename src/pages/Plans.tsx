import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Check, Crown, Shield, Sparkles, Star, Zap, Gift, Loader2 } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { getReferralDiscountForUser } from "@/lib/referrals";
import { useLanguage } from "@/contexts/LanguageContext";
import { PRICING } from "@/lib/stripeConfig";

export default function Plans() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");
  const [referralDiscount, setReferralDiscount] = useState(0);
  const [countryCode, setCountryCode] = useState<string>('BR');
  const { isPremium, subscription } = useSubscription();

  // Detect country from browser or use language as fallback
  useEffect(() => {
    const detectCountry = async () => {
      try {
        // Try to get country from timezone
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (timezone.includes('Sao_Paulo') || timezone.includes('Brasilia')) {
          setCountryCode('BR');
        } else {
          // Default based on language
          setCountryCode(language === 'pt' ? 'BR' : 'US');
        }
      } catch {
        setCountryCode(language === 'pt' ? 'BR' : 'US');
      }
    };
    detectCountry();
  }, [language]);

  // Get pricing based on country
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

  const premiumFeatures = [
    { icon: "💊", text: t('plans.unlimitedMeds') },
    { icon: "🔔", text: t('plans.smartReminders') },
    { icon: "📊", text: t('plans.completeHistory') },
    { icon: "🧪", text: t('plans.labTracking') },
    { icon: "🤖", text: t('plans.aiAssistant') },
    { icon: "📷", text: t('plans.prescriptionScanner') },
    { icon: "👨‍👩‍👧", text: t('plans.familyProfiles') },
    { icon: "📈", text: t('plans.monthlyReports') },
    { icon: "🚫", text: t('plans.noAds') },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">{t('plans.chooseYourPlan')}</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Hero */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-primary text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            {t('plans.freeTrialBadge')}
          </div>
          <h2 className="text-2xl font-bold text-foreground">
            {t('plans.unlockPremium')}
          </h2>
          <p className="text-muted-foreground text-sm">
            {t('plans.completeCareSub')}
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="bg-muted/50 p-1 rounded-xl flex">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              billingCycle === "monthly" 
                ? "bg-background shadow-sm text-foreground" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t('plans.monthly')}
          </button>
          <button
            onClick={() => setBillingCycle("annual")}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all relative ${
              billingCycle === "annual" 
                ? "bg-background shadow-sm text-foreground" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t('plans.annual')}
            <Badge className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] px-1.5">
              -{savingsPercent}%
            </Badge>
          </button>
        </div>

        {/* Price Card */}
        <Card className="p-6 border-2 border-primary bg-gradient-to-br from-primary/5 to-primary/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
          
          <div className="relative space-y-4">
            {/* Plan Header */}
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
                <Crown className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-foreground">Premium</h3>
                <p className="text-sm text-muted-foreground">
                  {t('plans.fullAccess')}
                </p>
              </div>
            </div>

            {/* Price Display */}
            <div className="space-y-1">
              {billingCycle === "annual" && (
                <p className="text-sm text-muted-foreground line-through">
                  {formatPrice(monthlyPrice)}/{t('plans.mo')}
                </p>
              )}
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-foreground">
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
              <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <Gift className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">
                  {t('plans.referralDiscountApplied', { percent: referralDiscount.toString() })}
                </span>
              </div>
            )}

            {/* CTA Button */}
            {isPremium ? (
              <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
                <Check className="h-5 w-5 text-primary" />
                <span className="font-medium text-primary">
                  {t('plans.youArePremium')}
                </span>
              </div>
            ) : (
              <Button 
                size="lg"
                className="w-full h-14 text-lg font-semibold shadow-lg"
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
        </Card>

        {/* Features List */}
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">
            {t('plans.everythingIncluded')}
          </h3>
          <div className="grid gap-2">
            {premiumFeatures.map((feature, index) => (
              <div 
                key={index} 
                className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
              >
                <span className="text-lg">{feature.icon}</span>
                <span className="text-sm text-foreground">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Social Proof */}
        <Card className="p-4 bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {['👨', '👩', '👴', '👧'].map((emoji, i) => (
                  <div key={i} className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-sm">
                    {emoji}
                  </div>
                ))}
              </div>
              <span className="text-sm text-muted-foreground">+10k</span>
            </div>
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map((i) => (
                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ))}
              <span className="text-sm font-medium ml-1">4.8</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {t('plans.joinThousands')}
          </p>
        </Card>

        {/* Trust Badges */}
        <div className="flex items-center justify-center gap-6 py-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span className="text-xs">{t('plans.secure')}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Check className="h-4 w-4" />
            <span className="text-xs">{t('plans.noCommitment')}</span>
          </div>
        </div>

        {/* Free Plan Link */}
        {!isPremium && (
          <button 
            onClick={() => navigate('/hoje')}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            {t('plans.continueWithFree')}
          </button>
        )}
      </div>
    </div>
  );
}