import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Crown, Shield, Sparkles, Coffee, Candy, Star, TrendingUp, Users, Gift } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getReferralDiscountForUser } from "@/lib/referrals";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Plans() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [referralDiscount, setReferralDiscount] = useState(0);
  const { isPremium, subscription } = useSubscription();

  const testimonials = [
    {
      name: t('plans.testimonial1.name'),
      role: t('plans.testimonial1.role'),
      avatar: "MS",
      text: t('plans.testimonial1.text'),
      rating: 5
    },
    {
      name: t('plans.testimonial2.name'),
      role: t('plans.testimonial2.role'),
      avatar: "JS",
      text: t('plans.testimonial2.text'),
      rating: 5
    },
    {
      name: t('plans.testimonial3.name'),
      role: t('plans.testimonial3.role'),
      avatar: "AC",
      text: t('plans.testimonial3.text'),
      rating: 5
    }
  ];

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
        body: { planType }
      });
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(t('plans.checkoutError'));
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error('Portal error:', error);
      toast.error(t('plans.portalError'));
    } finally {
      setLoading(false);
    }
  };

  const freePlanFeatures = [
    t('plans.feature.1medication'),
    t('plans.feature.basicNotifications'),
    t('plans.feature.limitedHistory'),
    t('plans.feature.withAds')
  ];

  const premiumPlanFeatures = [
    t('plans.feature.unlimitedMeds'),
    t('plans.feature.supplementRoutine'),
    t('plans.feature.medicalHistory'),
    t('plans.feature.labExams'),
    t('plans.feature.medicalAgenda'),
    t('plans.feature.wellnessWidgets'),
    t('plans.feature.drugInteractions'),
    t('plans.feature.nutritionalAnalysis'),
    t('plans.feature.familyProfiles'),
    t('plans.feature.unlimitedAI'),
    t('plans.feature.ocrDocs'),
    t('plans.feature.noAds'),
    t('plans.feature.prioritySupport')
  ];

  // Pricing - aligned with Stripe products
  const monthlyPrice = 19.90;
  const annualPrice = 199.90;
  
  const discountMultiplier = isPremium ? (1 - referralDiscount / 100) : 1;
  const discountedMonthlyPrice = monthlyPrice * discountMultiplier;
  const discountedAnnualPrice = annualPrice * discountMultiplier;
  
  const annualMonthlyEquivalent = (discountedAnnualPrice / 12).toFixed(2);
  const annualSavings = (discountedMonthlyPrice * 12 - discountedAnnualPrice).toFixed(2);

  const formatPrice = (price: number) => {
    if (language === 'en') {
      return `$${(price / 5).toFixed(2)}`;
    }
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
  };

  const dailyPrice = billingCycle === "monthly" ? "0.66" : "0.55";
  const dailyPriceEN = billingCycle === "monthly" ? "0.13" : "0.11";

  return (
    <div className="min-h-screen bg-background p-4 pb-24 max-w-4xl mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/perfil")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">{t('plans.title')}</h1>
        </div>

        {/* Hero Section - Social Proof */}
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-foreground">
              {t('plans.joinUsers')}
            </h2>
            <p className="text-muted-foreground">
              {t('plans.transformedCare')}
            </p>
            
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <p className="text-2xl font-bold text-foreground">91%</p>
                </div>
                <p className="text-xs text-muted-foreground">{t('plans.avgAdherence')}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1">
                  <Users className="h-4 w-4 text-primary" />
                  <p className="text-2xl font-bold text-foreground">3M+</p>
                </div>
                <p className="text-xs text-muted-foreground">{t('plans.dosesRecorded')}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1">
                  <Star className="h-4 w-4 text-primary" />
                  <p className="text-2xl font-bold text-foreground">4.8</p>
                </div>
                <p className="text-xs text-muted-foreground">{t('plans.avgRating')}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-3 p-3 bg-muted/30 rounded-lg">
          <Button
            variant={billingCycle === "monthly" ? "default" : "ghost"}
            size="sm"
            onClick={() => setBillingCycle("monthly")}
          >
            {t('plans.monthly')}
          </Button>
          <Button
            variant={billingCycle === "annual" ? "default" : "ghost"}
            size="sm"
            onClick={() => setBillingCycle("annual")}
            className="relative"
          >
            {t('plans.annual')}
            <Badge className="ml-2 bg-primary text-primary-foreground text-xs">
              {t('plans.save')} {language === 'en' ? `$${(parseFloat(annualSavings) / 5).toFixed(0)}` : annualSavings}
            </Badge>
          </Button>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Free Plan */}
          <Card className="p-4 border-2">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground text-lg">{t('plans.freePlan')}</h3>
                  <p className="text-sm text-muted-foreground">{t('plans.freePlanDesc')}</p>
                </div>
              </div>

              <div className="space-y-2">
                {freePlanFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <p className="text-2xl font-bold text-foreground">{language === 'en' ? '$0' : 'R$ 0'}</p>
                <p className="text-sm text-muted-foreground">{t('plans.trialDays')}</p>
              </div>

              {!isPremium && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleUpgrade}
                >
                  {t('plans.startNow')}
                </Button>
              )}
            </div>
          </Card>

          {/* Premium Plan */}
          <Card className="p-4 border-2 border-primary bg-primary/5 relative overflow-hidden">
            <div className="absolute top-3 right-3 flex gap-2">
              <Badge className="bg-destructive text-destructive-foreground">
                <Sparkles className="h-3 w-3 mr-1" />
                {t('plans.mostPopular')}
              </Badge>
            </div>

            <div className="space-y-4 mt-8">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Crown className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground text-lg">{t('plans.premiumPlan')}</h3>
                  <p className="text-sm text-muted-foreground">{t('plans.premiumPlanDesc')}</p>
                </div>
              </div>

              <div className="space-y-2">
                {premiumPlanFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-foreground">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Price Highlight */}
              <div className="pt-2 space-y-3">
                {isPremium && referralDiscount > 0 && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mb-2">
                    <p className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-2">
                      <Gift className="h-4 w-4" />
                      {t('plans.referralDiscount', { percent: String(referralDiscount) })}
                    </p>
                  </div>
                )}
                
                <div>
                  {billingCycle === "monthly" ? (
                    <>
                      {isPremium && referralDiscount > 0 && (
                        <p className="text-lg line-through text-muted-foreground">
                          {formatPrice(monthlyPrice)}
                        </p>
                      )}
                      <p className="text-3xl font-bold text-foreground">
                        {formatPrice(discountedMonthlyPrice)}
                        <span className="text-base font-normal text-muted-foreground">{t('common.perMonth')}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">{t('plans.chargedMonthly')}</p>
                    </>
                  ) : (
                    <>
                      <div className="space-y-1">
                        {isPremium && referralDiscount > 0 && (
                          <p className="text-lg line-through text-muted-foreground">
                            {formatPrice(annualPrice / 12)}{t('common.perMonth')}
                          </p>
                        )}
                        <p className="text-3xl font-bold text-foreground">
                          {language === 'en' ? `$${(parseFloat(annualMonthlyEquivalent) / 5).toFixed(2)}` : `R$ ${annualMonthlyEquivalent.replace('.', ',')}`}
                          <span className="text-base font-normal text-muted-foreground">{t('common.perMonth')}</span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatPrice(discountedAnnualPrice)} {t('plans.chargedAnnually')}
                        </p>
                        <Badge variant="secondary" className="gap-1">
                          ✨ {t('plans.bestValue')} {language === 'en' ? `$${(parseFloat(annualSavings) / 5).toFixed(0)}` : `R$ ${annualSavings}`}
                        </Badge>
                      </div>
                    </>
                  )}
                </div>

                {/* Daily Cost Comparison */}
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Candy className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium text-foreground">
                      {t('plans.perDay', { price: language === 'en' ? dailyPriceEN : dailyPrice })}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground pl-6">
                    {t('plans.cheaperThanCandy')}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <Coffee className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      {t('plans.cheaperThanCoffee')}
                    </p>
                  </div>
                </div>
              </div>

              {isPremium ? (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleManageSubscription}
                >
                  {t('subscription.manageSubscription')}
                </Button>
              ) : (
                <div className="space-y-3">
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90 text-lg py-6"
                    onClick={handleUpgrade}
                    disabled={loading}
                  >
                    {loading ? t('plans.processing') : t('plans.try7DaysFree')}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    {t('plans.noCommitment')}
                  </p>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">
                      {t('plans.referralHint')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Testimonials Section */}
        <div className="space-y-4 pt-4">
          <h3 className="text-lg font-semibold text-foreground text-center">
            {t('plans.whatUsersSay')}
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {testimonial.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-sm text-foreground">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground italic">"{testimonial.text}"</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Trust Badges */}
        <Card className="p-4 bg-muted/30">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-center">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground">{t('plans.securePayment')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground">{t('plans.doctorApproved')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground">{t('plans.satisfiedUsers')}</span>
            </div>
          </div>
        </Card>

        {/* Security Info */}
        <Card className="p-4 bg-muted/30">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">{t('plans.stripePayment')}</p>
              <p className="text-xs text-muted-foreground">
                {t('plans.dataProtection')}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}