import { useState } from "react";
import { Link } from "react-router-dom";
import { Activity, Calendar, FileText, Heart, TrendingUp, Stethoscope, Brain } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { cn } from "@/lib/utils";

export default function Saude() {
  const healthSections = [
    {
      title: "Agenda de Saúde",
      description: "Calendário com todos seus compromissos",
      icon: Calendar,
      path: "/saude/agenda",
      color: "from-purple-500 to-purple-600",
    },
    {
      title: "Consultas Médicas",
      description: "Agende e acompanhe suas consultas",
      icon: Stethoscope,
      path: "/consultas",
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "Exames Laboratoriais",
      description: "Gerencie resultados de exames",
      icon: FileText,
      path: "/exames",
      color: "from-green-500 to-green-600",
    },
    {
      title: "Sinais Vitais",
      description: "Monitore pressão, peso, glicemia",
      icon: Heart,
      path: "/sinais-vitais",
      color: "from-red-500 to-red-600",
    },
    {
      title: "Dashboard de Saúde",
      description: "Visão geral dos seus dados",
      icon: TrendingUp,
      path: "/dashboard-saude",
      color: "from-purple-500 to-purple-600",
    },
    {
      title: "Linha do Tempo",
      description: "Histórico completo de saúde",
      icon: Calendar,
      path: "/linha-do-tempo",
      color: "from-orange-500 to-orange-600",
    },
    {
      title: "Análise com IA",
      description: "Insights inteligentes sobre sua saúde",
      icon: Brain,
      path: "/analise-saude",
      color: "from-pink-500 to-pink-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Header />
      
      <main className="container mx-auto px-4 py-6 pb-24 max-w-4xl pt-24">{/* pt-24 para compensar o header fixo */}
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl">
              <Activity className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Saúde</h1>
              <p className="text-muted-foreground">
                Seu centro de saúde completo
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
            <CardTitle className="text-lg">Resumo Rápido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">--</div>
                <div className="text-xs text-muted-foreground">Consultas</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">--</div>
                <div className="text-xs text-muted-foreground">Exames</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">--</div>
                <div className="text-xs text-muted-foreground">Medições</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <Navigation />
    </div>
  );
}
