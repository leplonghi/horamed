import { useState } from "react";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import HealthCalendar from "@/components/HealthCalendar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Agenda() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6 pb-20 pt-24">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{t('agenda.title')}</h1>
              <p className="text-muted-foreground">
                {t('agenda.subtitle')}
              </p>
            </div>
            <Button onClick={() => navigate('/saude/consultas')} className="w-full md:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              {t('agenda.newAppointment')}
            </Button>
          </div>

          <HealthCalendar onDateSelect={setSelectedDate} />

        </div>
      </main>

      <Navigation />
    </div>
  );
}