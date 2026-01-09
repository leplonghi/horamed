import { Calendar, FileText, Stethoscope, Syringe, Activity, Plus } from "lucide-react";
import QuickActionsBase, { QuickAction } from "@/components/shared/QuickActionsBase";
import { useLanguage } from "@/contexts/LanguageContext";

interface HealthQuickActionsProps {
  onScheduleAppointment: () => void;
  onAddExam: () => void;
  onAddVaccine: () => void;
  onViewTimeline: () => void;
}

export default function HealthQuickActions({
  onScheduleAppointment,
  onAddExam,
  onAddVaccine,
  onViewTimeline
}: HealthQuickActionsProps) {
  const { language } = useLanguage();

  const actions: QuickAction[] = [
    {
      id: "appointment",
      icon: <Stethoscope className="h-5 w-5 text-blue-500" />,
      label: language === 'pt' ? 'Consulta' : 'Appointment',
      color: "bg-blue-500/10",
      onClick: onScheduleAppointment
    },
    {
      id: "exam",
      icon: <FileText className="h-5 w-5 text-green-500" />,
      label: language === 'pt' ? 'Exame' : 'Exam',
      color: "bg-green-500/10",
      onClick: onAddExam
    },
    {
      id: "vaccine",
      icon: <Syringe className="h-5 w-5 text-purple-500" />,
      label: language === 'pt' ? 'Vacina' : 'Vaccine',
      color: "bg-purple-500/10",
      onClick: onAddVaccine
    },
    {
      id: "timeline",
      icon: <Calendar className="h-5 w-5 text-orange-500" />,
      label: language === 'pt' ? 'Timeline' : 'Timeline',
      color: "bg-orange-500/10",
      onClick: onViewTimeline
    }
  ];

  return <QuickActionsBase actions={actions} columns={4} />;
}
