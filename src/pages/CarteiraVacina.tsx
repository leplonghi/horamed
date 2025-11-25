import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import ProfileSelector from "@/components/ProfileSelector";
import VaccineCard from "@/components/VaccineCard";
import VaccineManualForm from "@/components/VaccineManualForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Upload, Info, ExternalLink } from "lucide-react";
import { useVaccinationRecordsByType, useDeleteVaccinationRecord } from "@/hooks/useVaccinationRecords";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function CarteiraVacina() {
  const navigate = useNavigate();
  const { activeProfile } = useUserProfiles();
  const [activeTab, setActiveTab] = useState<'adulto' | 'infantil'>('adulto');
  const [showManualForm, setShowManualForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: adultVaccines, isLoading: loadingAdult } = useVaccinationRecordsByType('adulto', activeProfile?.id);
  const { data: childVaccines, isLoading: loadingChild } = useVaccinationRecordsByType('infantil', activeProfile?.id);
  const deleteMutation = useDeleteVaccinationRecord();

  const currentVaccines = activeTab === 'adulto' ? adultVaccines : childVaccines;
  const isLoading = activeTab === 'adulto' ? loadingAdult : loadingChild;

  const handleUploadDocument = () => {
    navigate('/cofre/upload');
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
    setDeleteId(null);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <div className="container max-w-4xl mx-auto px-4 py-6 pt-24">
        <PageHeader
          title="Caderneta de Vacinação"
          description="Registro completo de vacinas seguindo o Calendário Nacional"
        />

        <ProfileSelector />

        {/* Info Card */}
        <Card className="mb-6 border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950">
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <CardTitle className="text-base text-blue-900 dark:text-blue-100">
                  Caderneta de Vacinação Digital Brasileira
                </CardTitle>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Baseada no Calendário Nacional de Vacinação do Ministério da Saúde e na Caderneta Digital da Criança.
                  Mantenha seu histórico de vacinas sempre atualizado e organizado.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => window.open('https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/c/calendario-nacional-de-vacinacao', '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Calendário Nacional
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => window.open('https://www.gov.br/saude/pt-br/assuntos/saude-da-crianca/caderneta-de-saude-da-crianca', '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Caderneta Digital da Criança
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button onClick={() => setShowManualForm(true)} className="flex-1 sm:flex-none">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Manualmente
          </Button>
          <Button variant="outline" onClick={handleUploadDocument} className="flex-1 sm:flex-none">
            <Upload className="h-4 w-4 mr-2" />
            Escanear Carteira
          </Button>
        </div>

        {/* Manual Form */}
          <div className="mb-6">
            <VaccineManualForm
              profileId={activeProfile?.id}
              vaccineType={activeTab}
              onClose={() => setShowManualForm(false)}
            />
          </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'adulto' | 'infantil')}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="adulto" className="flex items-center gap-2">
              💉 Adulto
              {adultVaccines && adultVaccines.length > 0 && (
                <Badge variant="secondary">{adultVaccines.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="infantil" className="flex items-center gap-2">
              👶 Infantil
              {childVaccines && childVaccines.length > 0 && (
                <Badge variant="secondary">{childVaccines.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="adulto" className="space-y-4">
            {loadingAdult ? (
              <>
                <Skeleton className="h-40" />
                <Skeleton className="h-40" />
              </>
            ) : !adultVaccines || adultVaccines.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground mb-4">
                    Nenhuma vacina de adulto registrada ainda.
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Adicione suas vacinas manualmente ou escaneie sua carteira de vacinação.
                  </p>
                  <Button onClick={() => setShowManualForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Primeira Vacina
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {adultVaccines.map((record) => (
                  <VaccineCard
                    key={record.id}
                    record={record}
                    onDelete={(id) => setDeleteId(id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="infantil" className="space-y-4">
            {loadingChild ? (
              <>
                <Skeleton className="h-40" />
                <Skeleton className="h-40" />
              </>
            ) : !childVaccines || childVaccines.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground mb-4">
                    Nenhuma vacina infantil registrada ainda.
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Adicione as vacinas da criança manualmente ou escaneie a carteirinha.
                  </p>
                  <Button onClick={() => setShowManualForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Primeira Vacina
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {childVaccines.map((record) => (
                  <VaccineCard
                    key={record.id}
                    record={record}
                    onDelete={(id) => setDeleteId(id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Registro de Vacina?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O registro será permanentemente excluído.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Navigation />
    </div>
  );
}
