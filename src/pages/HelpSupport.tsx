import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Mail, FileText, ExternalLink, BookOpen, Lightbulb, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";

export default function HelpSupport() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleContactSupport = () => {
    window.location.href = "mailto:appmedhora@gmail.com";
  };

  return (
    <>
      <div className="min-h-screen bg-background p-6 pb-24">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-foreground">{t('help.title')}</h2>
              <p className="text-muted-foreground">{t('help.subtitle')}</p>
            </div>
          </div>

          <Tabs defaultValue="tutorial" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="tutorial">
                <Play className="h-4 w-4 mr-2" />
                {t('help.tabTutorial')}
              </TabsTrigger>
              <TabsTrigger value="dicas">
                <Lightbulb className="h-4 w-4 mr-2" />
                {t('help.tabTips')}
              </TabsTrigger>
              <TabsTrigger value="faq">
                <FileText className="h-4 w-4 mr-2" />
                {t('help.tabFaq')}
              </TabsTrigger>
            </TabsList>

            {/* Tutorial Tab */}
            <TabsContent value="tutorial" className="space-y-4">
              <Card className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">{t('help.howItWorks')}</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-foreground">{t('help.step1Title')}</h4>
                    <p className="text-sm text-muted-foreground">{t('help.step1Desc')}</p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-foreground">{t('help.step2Title')}</h4>
                    <p className="text-sm text-muted-foreground">{t('help.step2Desc')}</p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside ml-2">
                      <li>{t('help.step2Item1')}</li>
                      <li>{t('help.step2Item2')}</li>
                      <li>{t('help.step2Item3')}</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-foreground">{t('help.step3Title')}</h4>
                    <p className="text-sm text-muted-foreground">{t('help.step3Desc')}</p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-foreground">{t('help.step4Title')}</h4>
                    <p className="text-sm text-muted-foreground">{t('help.step4Desc')}</p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-foreground">{t('help.step5Title')}</h4>
                    <p className="text-sm text-muted-foreground">{t('help.step5Desc')}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 space-y-4">
                <h3 className="font-semibold text-foreground">{t('help.mainFeatures')}</h3>
                
                <div className="space-y-3">
                  <div className="bg-primary/5 p-3 rounded-lg">
                    <h4 className="font-semibold text-sm mb-1">{t('help.stockControl')}</h4>
                    <p className="text-xs text-muted-foreground">{t('help.stockControlDesc')}</p>
                  </div>

                  <div className="bg-primary/5 p-3 rounded-lg">
                    <h4 className="font-semibold text-sm mb-1">{t('help.healthHistory')}</h4>
                    <p className="text-xs text-muted-foreground">{t('help.healthHistoryDesc')}</p>
                  </div>

                  <div className="bg-primary/5 p-3 rounded-lg">
                    <h4 className="font-semibold text-sm mb-1">{t('help.sharing')}</h4>
                    <p className="text-xs text-muted-foreground">{t('help.sharingDesc')}</p>
                  </div>

                  <div className="bg-primary/5 p-3 rounded-lg">
                    <h4 className="font-semibold text-sm mb-1">{t('help.monthlyReports')}</h4>
                    <p className="text-xs text-muted-foreground">{t('help.monthlyReportsDesc')}</p>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Tips Tab */}
            <TabsContent value="dicas" className="space-y-4">
              <Card className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">{t('help.tipsTitle')}</h3>
                </div>

                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="tip-1">
                    <AccordionTrigger>{t('help.tip1Title')}</AccordionTrigger>
                    <AccordionContent className="space-y-2">
                      <p>{t('help.tip1Intro')}</p>
                      <ul className="list-disc list-inside ml-2 text-sm space-y-1">
                        <li>{t('help.tip1Item1')}</li>
                        <li>{t('help.tip1Item2')}</li>
                        <li>{t('help.tip1Item3')}</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="tip-2">
                    <AccordionTrigger>{t('help.tip2Title')}</AccordionTrigger>
                    <AccordionContent className="space-y-2">
                      <p>{t('help.tip2Intro')}</p>
                      <ul className="list-disc list-inside ml-2 text-sm space-y-1">
                        <li>{t('help.tip2Item1')}</li>
                        <li>{t('help.tip2Item2')}</li>
                        <li>{t('help.tip2Item3')}</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="tip-3">
                    <AccordionTrigger>{t('help.tip3Title')}</AccordionTrigger>
                    <AccordionContent className="space-y-2">
                      <p>{t('help.tip3Intro')}</p>
                      <ul className="list-disc list-inside ml-2 text-sm space-y-1">
                        <li>{t('help.tip3Item1')}</li>
                        <li>{t('help.tip3Item2')}</li>
                        <li>{t('help.tip3Item3')}</li>
                        <li>{t('help.tip3Item4')}</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="tip-4">
                    <AccordionTrigger>{t('help.tip4Title')}</AccordionTrigger>
                    <AccordionContent className="space-y-2">
                      <p>{t('help.tip4Intro')}</p>
                      <ul className="list-disc list-inside ml-2 text-sm space-y-1">
                        <li>{t('help.tip4Item1')}</li>
                        <li>{t('help.tip4Item2')}</li>
                        <li>{t('help.tip4Item3')}</li>
                        <li>{t('help.tip4Item4')}</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="tip-5">
                    <AccordionTrigger>{t('help.tip5Title')}</AccordionTrigger>
                    <AccordionContent className="space-y-2">
                      <p>{t('help.tip5Intro')}</p>
                      <ul className="list-disc list-inside ml-2 text-sm space-y-1">
                        <li>{t('help.tip5Item1')}</li>
                        <li>{t('help.tip5Item2')}</li>
                        <li>{t('help.tip5Item3')}</li>
                        <li>{t('help.tip5Item4')}</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </Card>

              <Card className="p-4 bg-accent/50">
                <p className="text-sm text-foreground">
                  <strong>{t('help.proTip')}</strong> {t('help.proTipText')}
                </p>
              </Card>
            </TabsContent>

            {/* FAQ Tab */}
            <TabsContent value="faq" className="space-y-4">
              <Card className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">{t('help.faqTitle')}</h3>
                </div>

                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="faq-1">
                    <AccordionTrigger>{t('help.faq1Q')}</AccordionTrigger>
                    <AccordionContent>{t('help.faq1A')}</AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-2">
                    <AccordionTrigger>{t('help.faq2Q')}</AccordionTrigger>
                    <AccordionContent>{t('help.faq2A')}</AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-3">
                    <AccordionTrigger>{t('help.faq3Q')}</AccordionTrigger>
                    <AccordionContent>{t('help.faq3A')}</AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-4">
                    <AccordionTrigger>{t('help.faq4Q')}</AccordionTrigger>
                    <AccordionContent>{t('help.faq4A')}</AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-5">
                    <AccordionTrigger>{t('help.faq5Q')}</AccordionTrigger>
                    <AccordionContent>{t('help.faq5A')}</AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-6">
                    <AccordionTrigger>{t('help.faq6Q')}</AccordionTrigger>
                    <AccordionContent>{t('help.faq6A')}</AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-7">
                    <AccordionTrigger>{t('help.faq7Q')}</AccordionTrigger>
                    <AccordionContent>{t('help.faq7A')}</AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-8">
                    <AccordionTrigger>{t('help.faq8Q')}</AccordionTrigger>
                    <AccordionContent>{t('help.faq8A')}</AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-9">
                    <AccordionTrigger>{t('help.faq9Q')}</AccordionTrigger>
                    <AccordionContent>{t('help.faq9A')}</AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-10">
                    <AccordionTrigger>{t('help.faq10Q')}</AccordionTrigger>
                    <AccordionContent>{t('help.faq10A')}</AccordionContent>
                  </AccordionItem>
                </Accordion>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Contact Section */}
          <Card className="p-4 hover:bg-accent/50 transition-colors">
            <button
              onClick={handleContactSupport}
              className="w-full text-left flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{t('help.needMoreHelp')}</p>
                  <p className="text-sm text-muted-foreground">appmedhora@gmail.com</p>
                </div>
              </div>
              <ExternalLink className="h-5 w-5 text-muted-foreground" />
            </button>
          </Card>

          <Card className="p-4 bg-primary/5 border-primary/20">
            <p className="text-sm text-foreground">
              <span className="font-semibold">{t('help.responseTime')}</span> {t('help.responseTimeValue')}
            </p>
          </Card>

          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate("/terms")}
          >
            <FileText className="h-4 w-4 mr-2" />
            {t('help.viewTerms')}
          </Button>
        </div>
      </div>
      <Navigation />
    </>
  );
}