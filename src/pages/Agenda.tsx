import { useState } from "react";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import HealthCalendar from "@/components/HealthCalendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Plus, Calendar, Stethoscope, Activity } from "lucide-react";

export default function Agenda() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6 pb-20 pt-24">{/* pt-24 para compensar o header fixo */}
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Agenda de Saúde</h1>
              <p className="text-muted-foreground">
                Visualize e gerencie seus compromissos de saúde em um só lugar
              </p>
            </div>
          </div>

          <HealthCalendar onDateSelect={setSelectedDate} />

          <div className="grid md:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate('/saude/consultas')}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Nova Consulta
                </CardTitle>
                <Stethoscope className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Agendar Consulta
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate('/saude/exames')}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Novo Exame
                </CardTitle>
                <Activity className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Exame
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate('/medicamentos')}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Novo Medicamento
                </CardTitle>
                <Calendar className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Medicamento
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sobre a Integração com Google Agenda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                A sincronização com o Google Agenda permite que todos os seus compromissos de saúde 
                sejam automaticamente adicionados ao seu calendário do Google:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Consultas médicas programadas</li>
                <li>Horários de exames laboratoriais</li>
                <li>Lembretes de medicamentos</li>
                <li>Eventos de saúde agendados</li>
              </ul>
              <p>
                Você receberá notificações tanto no HoraMed quanto no Google Agenda, 
                garantindo que não perca nenhum compromisso importante de saúde.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Navigation />
    </div>
  );
}
