import { useState } from "react";
import { Link } from "react-router-dom";
import { Activity, Calendar, FileText, Heart, TrendingUp, Stethoscope, Brain } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Saude() {
  const { t } = useLanguage();
  
  const healthSections = [
    {
      title: t('saude.healthAgenda'),
      description: t('saude.healthAgendaDesc'),
      icon: Calendar,
      path: "/saude/agenda",
      color: "from-purple-500 to-purple-600",
    },
    {
      title: t('saude.medicalAppointments'),
      description: t('saude.medicalAppointmentsDesc'),
      icon: Stethoscope,
      path: "/consultas",
      color: "from-blue-500 to-blue-600",
    },
    {
      title: t('saude.labExams'),
      description: t('saude.labExamsDesc'),
      icon: FileText,
      path: "/exames",
      color: "from-green-500 to-green-600",
    },
    {
      title: t('saude.healthDashboard'),
      description: t('saude.healthDashboardDesc'),
      icon: TrendingUp,
      path: "/dashboard-saude",
      color: "from-purple-500 to-purple-600",
    },
    {
      title: t('saude.timeline'),
      description: t('saude.timelineDesc'),
      icon: Calendar,
      path: "/linha-do-tempo",
      color: "from-orange-500 to-orange-600",
    },
    {
      title: t('saude.aiAnalysis'),
      description: t('saude.aiAnalysisDesc'),
      icon: Brain,
      path: "/analise-saude",
      color: "from-pink-500 to-pink-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Header />
      
      <main className="container mx-auto px-4 py-6 pb-24 max-w-4xl pt-24">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl">
              <Activity className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{t('saude.title')}</h1>
              <p className="text-muted-foreground">
                {t('saude.subtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* Health Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {healthSections.map((section) => (
            <Link key={section.path} to={section.path}>
              <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer border-2 hover:border-primary/50">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2 mb-2">
                        <div className={cn(
                          "p-2 rounded-lg bg-gradient-to-br group-hover:scale-110 transition-transform",
                          section.color
                        )}>
                          <section.icon className="h-5 w-5 text-white" />
                        </div>
                        {section.title}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {section.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Stats */}
        <Card className="mt-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">{t('saude.quickSummary')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">--</div>
                <div className="text-xs text-muted-foreground">{t('saude.appointments')}</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">--</div>
                <div className="text-xs text-muted-foreground">{t('saude.exams')}</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">--</div>
                <div className="text-xs text-muted-foreground">{t('saude.measurements')}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <Navigation />
    </div>
  );
}
