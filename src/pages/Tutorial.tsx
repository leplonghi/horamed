import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Clock,
  Pill,
  Package,
  FolderHeart,
  Calendar,
  Bell,
  Camera,
  Share2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Tutorial() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("inicio");

  const tutorials = [
    {
      id: "inicio",
      title: t('tutorial.firstSteps'),
      icon: CheckCircle2,
      sections: [
        {
          title: t('tutorial.addMedQ'),
          icon: Plus,
          steps: [
            t('tutorial.addMedStep1'),
            t('tutorial.addMedStep2'),
            t('tutorial.addMedStep3'),
            t('tutorial.addMedStep4'),
            t('tutorial.addMedStep5'),
            t('tutorial.addMedStep6'),
          ],
          tip: t('tutorial.addMedTip'),
        },
        {
          title: t('tutorial.confirmDoseQ'),
          icon: CheckCircle2,
          steps: [
            t('tutorial.confirmDoseStep1'),
            t('tutorial.confirmDoseStep2'),
            t('tutorial.confirmDoseStep3'),
            t('tutorial.confirmDoseStep4'),
          ],
          tip: t('tutorial.confirmDoseTip'),
        },
      ],
    },
    {
      id: "medicamentos",
      title: t('tutorial.manageMeds'),
      icon: Pill,
      sections: [
        {
          title: t('tutorial.editScheduleQ'),
          icon: Clock,
          steps: [
            t('tutorial.editScheduleStep1'),
            t('tutorial.editScheduleStep2'),
            t('tutorial.editScheduleStep3'),
            t('tutorial.editScheduleStep4'),
          ],
        },
        {
          title: t('tutorial.stockQ'),
          icon: Package,
          steps: [
            t('tutorial.stockStep1'),
            t('tutorial.stockStep2'),
            t('tutorial.stockStep3'),
            t('tutorial.stockStep4'),
            t('tutorial.stockStep5'),
          ],
          tip: t('tutorial.stockTip'),
        },
        {
          title: t('tutorial.durationQ'),
          icon: Calendar,
          steps: [
            t('tutorial.durationStep1'),
            t('tutorial.durationStep2'),
            t('tutorial.durationStep3'),
            t('tutorial.durationStep4'),
            t('tutorial.durationStep5'),
          ],
        },
      ],
    },
    {
      id: "carteira",
      title: t('tutorial.wallet'),
      icon: FolderHeart,
      sections: [
        {
          title: t('tutorial.addDocsQ'),
          icon: Camera,
          steps: [
            t('tutorial.addDocsStep1'),
            t('tutorial.addDocsStep2'),
            t('tutorial.addDocsStep3'),
            t('tutorial.addDocsStep4'),
            t('tutorial.addDocsStep5'),
            t('tutorial.addDocsStep6'),
          ],
        },
        {
          title: t('tutorial.shareDocQ'),
          icon: Share2,
          steps: [
            t('tutorial.shareDocStep1'),
            t('tutorial.shareDocStep2'),
            t('tutorial.shareDocStep3'),
            t('tutorial.shareDocStep4'),
            t('tutorial.shareDocStep5'),
            t('tutorial.shareDocStep6'),
          ],
          tip: t('tutorial.shareDocTip'),
        },
      ],
    },
    {
      id: "notificacoes",
      title: t('tutorial.notifications'),
      icon: Bell,
      sections: [
        {
          title: t('tutorial.enableNotifQ'),
          icon: Bell,
          steps: [
            t('tutorial.enableNotifStep1'),
            t('tutorial.enableNotifStep2'),
            t('tutorial.enableNotifStep3'),
            t('tutorial.enableNotifStep4'),
            t('tutorial.enableNotifStep5'),
          ],
          tip: t('tutorial.enableNotifTip'),
        },
      ],
    },
  ];

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background pt-20 p-6 pb-24">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{t('tutorial.title')}</h1>
            <p className="text-muted-foreground mt-2">{t('tutorial.subtitle')}</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              {tutorials.map((tutorial) => (
                <TabsTrigger key={tutorial.id} value={tutorial.id} className="gap-2">
                  <tutorial.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tutorial.title}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {tutorials.map((tutorial) => (
              <TabsContent key={tutorial.id} value={tutorial.id} className="space-y-4">
                {tutorial.sections.map((section, idx) => (
                  <Card key={idx}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <section.icon className="h-5 w-5 text-primary" />
                        {section.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ol className="space-y-2">
                        {section.steps.map((step, stepIdx) => (
                          <li key={stepIdx} className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                              {stepIdx + 1}
                            </span>
                            <span className="text-sm pt-0.5">{step}</span>
                          </li>
                        ))}
                      </ol>

                      {section.tip && (
                        <div className="flex gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                          <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <p className="text-sm">
                            <strong>{t('tutorial.tip')}</strong> {section.tip}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            ))}
          </Tabs>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold mb-1">{t('tutorial.stillHaveQuestions')}</h3>
                  <p className="text-sm text-muted-foreground">{t('tutorial.visitHelp')}</p>
                </div>
                <Button onClick={() => navigate("/ajuda")}>
                  {t('tutorial.helpBtn')}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Navigation />
    </>
  );
}