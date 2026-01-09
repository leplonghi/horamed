import { Stethoscope, FileText, Syringe, Activity } from "lucide-react";
import StatsGridBase, { StatItem } from "@/components/shared/StatsGridBase";
import { useLanguage } from "@/contexts/LanguageContext";

interface HealthStatsGridProps {
  appointmentsCount: number;
  examsCount: number;
  vaccinesCount: number;
  measurementsCount: number;
  onStatClick?: (type: string) => void;
}

export default function HealthStatsGrid({ 
  appointmentsCount,
  examsCount,
  vaccinesCount,
  measurementsCount,
  onStatClick 
}: HealthStatsGridProps) {
  const { language } = useLanguage();

  const stats: StatItem[] = [
    {
      id: "appointments",
      label: language === 'pt' ? 'Consultas' : 'Appointments',
      value: appointmentsCount,
      icon: <Stethoscope className="h-4 w-4 text-blue-500" />,
      color: "bg-blue-500/10 text-blue-500",
      onClick: () => onStatClick?.("appointments")
    },
    {
      id: "exams",
      label: language === 'pt' ? 'Exames' : 'Exams',
      value: examsCount,
      icon: <FileText className="h-4 w-4 text-green-500" />,
      color: "bg-green-500/10 text-green-500",
      onClick: () => onStatClick?.("exams")
    },
    {
      id: "vaccines",
      label: language === 'pt' ? 'Vacinas' : 'Vaccines',
      value: vaccinesCount,
      icon: <Syringe className="h-4 w-4 text-purple-500" />,
      color: "bg-purple-500/10 text-purple-500",
      onClick: () => onStatClick?.("vaccines")
    },
    {
      id: "measurements",
      label: language === 'pt' ? 'Medições' : 'Measurements',
      value: measurementsCount,
      icon: <Activity className="h-4 w-4 text-orange-500" />,
      color: "bg-orange-500/10 text-orange-500",
      onClick: () => onStatClick?.("measurements")
    }
  ];

  return <StatsGridBase stats={stats} columns={4} />;
}
