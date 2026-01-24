import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Activity, Calendar, FileText, Stethoscope, Brain, ArrowRight, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import PageHeroHeader from "@/components/shared/PageHeroHeader";
import HealthQuickActions from "@/components/health/HealthQuickActions";
import SmartHealthInsights from "@/components/health/SmartHealthInsights";
import HealthStatsGrid from "@/components/health/HealthStatsGrid";
import DrugInteractionAlert from "@/components/health/DrugInteractionAlert";
import MedicalReportButton from "@/components/health/MedicalReportButton";
import OceanBackground from "@/components/ui/OceanBackground";

export default function Saude() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    appointments: 0,
    exams: 0,
    vaccines: 0,
    measurements: 0,
    nextAppointmentDate: undefined as string | undefined,
    lastCheckupDate: undefined as string | undefined
  });
  
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [appointmentsRes, examsRes, vaccinesRes, measurementsRes, nextAppointmentRes] = await Promise.all([
        supabase.from('consultas_medicas').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('exames_laboratoriais').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('documentos_saude').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('categoria_id', 'vacinacao'),
        supabase.from('sinais_vitais').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('consultas_medicas')
          .select('data_consulta')
          .eq('user_id', user.id)
          .gte('data_consulta', new Date().toISOString())
          .order('data_consulta', { ascending: true })
          .limit(1)
      ]);

      const lastCheckupRes = await supabase
        .from('consultas_medicas')
        .select('data_consulta')
        .eq('user_id', user.id)
        .lt('data_consulta', new Date().toISOString())
        .order('data_consulta', { ascending: false })
        .limit(1);

      setStats({
        appointments: appointmentsRes.count || 0,
        exams: examsRes.count || 0,
        vaccines: vaccinesRes.count || 0,
        measurements: measurementsRes.count || 0,
        nextAppointmentDate: nextAppointmentRes.data?.[0]?.data_consulta,
        lastCheckupDate: lastCheckupRes.data?.[0]?.data_consulta
      });
    } catch (error) {
      console.error("Error loading health stats:", error);
    }
  };

  const handleStatClick = (type: string) => {
    const routes: Record<string, string> = {
      appointments: '/consultas',
      exams: '/exames',
      vaccines: '/carteira-vacina',
      measurements: '/dashboard-saude'
    };
    if (routes[type]) {
      navigate(routes[type]);
    }
  };
  
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

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-background relative">
      <OceanBackground variant="page" />
      <Header />
      
      <main className="container max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-6 page-container relative z-10">
        {/* Hero Header */}
        <PageHeroHeader
          icon={<Activity className="h-6 w-6 text-primary" />}
          title={t('saude.title')}
          subtitle={t('saude.subtitle')}
        />

        {/* Quick Actions */}
        <HealthQuickActions
          onScheduleAppointment={() => navigate('/consultas')}
          onAddExam={() => navigate('/exames')}
          onAddVaccine={() => navigate('/carteira-vacina')}
          onViewTimeline={() => navigate('/linha-do-tempo')}
        />

        {/* Drug Interactions Alert */}
        <DrugInteractionAlert className="w-full" />

        {/* Medical Report Card */}
        <MedicalReportButton variant="card" />

        {/* Smart Insights */}
        <SmartHealthInsights
          data={{
            appointmentsCount: stats.appointments,
            examsCount: stats.exams,
            vaccinesCount: stats.vaccines,
            nextAppointmentDate: stats.nextAppointmentDate,
            lastCheckupDate: stats.lastCheckupDate
          }}
          onActionClick={(action) => navigate(action)}
        />

        {/* Stats Grid */}
        <HealthStatsGrid
          appointmentsCount={stats.appointments}
          examsCount={stats.exams}
          vaccinesCount={stats.vaccines}
          measurementsCount={stats.measurements}
          onStatClick={handleStatClick}
        />

        {/* Health Sections Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          {healthSections.map((section) => (
            <motion.div key={section.path} variants={itemVariants}>
              <Link to={section.path}>
                <Card className={cn(
                  "group cursor-pointer transition-all duration-300",
                  "bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-xl",
                  "border border-border/30 shadow-[var(--shadow-glass)]",
                  "hover:shadow-[var(--shadow-glass-hover)] hover:border-border/50 hover:scale-[1.02]"
                )}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2.5 rounded-xl bg-gradient-to-br group-hover:scale-110 transition-transform",
                          section.color
                        )}>
                          <section.icon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{section.title}</CardTitle>
                          <CardDescription className="text-xs mt-0.5 line-clamp-1">
                            {section.description}
                          </CardDescription>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </main>

      <Navigation />
    </div>
  );
}
