import { useMemo } from "react";
import { Calendar, Stethoscope, FileText, Syringe, Clock } from "lucide-react";
import SmartInsightsBase, { Insight } from "@/components/shared/SmartInsightsBase";
import { useLanguage } from "@/contexts/LanguageContext";
import { format, differenceInDays, addMonths } from "date-fns";

interface HealthData {
  appointmentsCount?: number;
  examsCount?: number;
  vaccinesCount?: number;
  nextAppointmentDate?: string;
  lastCheckupDate?: string;
}

interface SmartHealthInsightsProps {
  data: HealthData;
  onActionClick: (action: string) => void;
}

export default function SmartHealthInsights({ 
  data, 
  onActionClick 
}: SmartHealthInsightsProps) {
  const { language } = useLanguage();

  const insights = useMemo(() => {
    const result: Insight[] = [];
    const now = new Date();

    // Next appointment reminder
    if (data.nextAppointmentDate) {
      const appointmentDate = new Date(data.nextAppointmentDate);
      const daysUntil = differenceInDays(appointmentDate, now);
      
      if (daysUntil >= 0 && daysUntil <= 7) {
        result.push({
          id: "next-appointment",
          type: daysUntil <= 2 ? "warning" : "info",
          icon: <Stethoscope className="h-5 w-5 text-blue-500" />,
          title: language === 'pt' 
            ? `Consulta em ${daysUntil === 0 ? 'hoje' : daysUntil === 1 ? 'amanhã' : `${daysUntil} dias`}`
            : `Appointment in ${daysUntil === 0 ? 'today' : daysUntil === 1 ? 'tomorrow' : `${daysUntil} days`}`,
          description: format(appointmentDate, "dd/MM 'às' HH:mm"),
          action: {
            label: language === 'pt' ? 'Ver' : 'View',
            onClick: () => onActionClick('/consultas')
          }
        });
      }
    }

    // Checkup reminder
    if (data.lastCheckupDate) {
      const lastCheckup = new Date(data.lastCheckupDate);
      const sixMonthsAgo = addMonths(now, -6);
      
      if (lastCheckup < sixMonthsAgo) {
        const monthsAgo = Math.floor(differenceInDays(now, lastCheckup) / 30);
        result.push({
          id: "checkup-reminder",
          type: "info",
          icon: <Clock className="h-5 w-5 text-primary" />,
          title: language === 'pt' 
            ? `Faz ${monthsAgo} meses desde o último check-up`
            : `It's been ${monthsAgo} months since your last checkup`,
          description: language === 'pt'
            ? 'Considere agendar uma consulta de rotina'
            : 'Consider scheduling a routine appointment',
          action: {
            label: language === 'pt' ? 'Agendar' : 'Schedule',
            onClick: () => onActionClick('/consultas')
          }
        });
      }
    } else if ((data.appointmentsCount || 0) === 0) {
      result.push({
        id: "no-checkup",
        type: "info",
        icon: <Stethoscope className="h-5 w-5 text-primary" />,
        title: language === 'pt' 
          ? 'Agende seu primeiro check-up'
          : 'Schedule your first checkup',
        description: language === 'pt'
          ? 'Mantenha sua saúde em dia com consultas regulares'
          : 'Keep your health up to date with regular appointments',
        action: {
          label: language === 'pt' ? 'Agendar' : 'Schedule',
          onClick: () => onActionClick('/consultas')
        }
      });
    }

    // Success insight
    if ((data.appointmentsCount || 0) > 0 && (data.examsCount || 0) > 0 && result.length === 0) {
      result.push({
        id: "health-ok",
        type: "success",
        title: language === 'pt' ? 'Saúde em dia!' : 'Health up to date!',
        description: language === 'pt'
          ? 'Você está acompanhando sua saúde regularmente'
          : 'You are monitoring your health regularly'
      });
    }

    return result;
  }, [data, language, onActionClick]);

  return <SmartInsightsBase insights={insights} maxVisible={2} />;
}
