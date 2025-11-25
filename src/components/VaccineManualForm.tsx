import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateVaccinationRecord } from "@/hooks/useVaccinationRecords";
import { X } from "lucide-react";

interface VaccineManualFormProps {
  profileId?: string;
  vaccineType: 'adulto' | 'infantil';
  onClose: () => void;
}

// Vacinas do Calendário Nacional (Ministério da Saúde)
const ADULT_VACCINES = [
  { name: "dT (Difteria/Tétano)", prevention: "Difteria e Tétano" },
  { name: "dTpa (Tríplice Acelular)", prevention: "Difteria, Tétano e Coqueluche" },
  { name: "Hepatite B", prevention: "Hepatite B" },
  { name: "Febre Amarela", prevention: "Febre Amarela" },
  { name: "Tríplice Viral (SCR)", prevention: "Sarampo, Caxumba e Rubéola" },
  { name: "Influenza (Gripe)", prevention: "Influenza" },
  { name: "Pneumocócica 23-valente", prevention: "Pneumonia" },
  { name: "Meningocócica ACWY", prevention: "Meningite" },
  { name: "COVID-19", prevention: "COVID-19" },
];

const CHILD_VACCINES = [
  { name: "BCG", prevention: "Tuberculose" },
  { name: "Hepatite B", prevention: "Hepatite B" },
  { name: "Pentavalente", prevention: "Difteria, Tétano, Coqueluche, Hepatite B, Hib" },
  { name: "VIP/VOP (Poliomielite)", prevention: "Poliomielite" },
  { name: "Rotavírus", prevention: "Rotavírus" },
  { name: "Pneumocócica 10-valente", prevention: "Pneumonia" },
  { name: "Meningocócica C", prevention: "Meningite C" },
  { name: "Febre Amarela", prevention: "Febre Amarela" },
  { name: "Tríplice Viral (SCR)", prevention: "Sarampo, Caxumba e Rubéola" },
  { name: "Tetraviral", prevention: "Sarampo, Caxumba, Rubéola e Varicela" },
  { name: "Hepatite A", prevention: "Hepatite A" },
  { name: "DTP", prevention: "Difteria, Tétano e Coqueluche" },
  { name: "Varicela", prevention: "Varicela (Catapora)" },
  { name: "HPV", prevention: "Papilomavírus Humano" },
];

export default function VaccineManualForm({ profileId, vaccineType, onClose }: VaccineManualFormProps) {
  const createMutation = useCreateVaccinationRecord();
  const vaccines = vaccineType === 'adulto' ? ADULT_VACCINES : CHILD_VACCINES;

  const [formData, setFormData] = useState({
    vaccine_name: "",
    disease_prevention: "",
    dose_description: "",
    application_date: "",
    next_dose_date: "",
    vaccination_location: "",
    vaccinator_name: "",
    batch_number: "",
    manufacturer: "",
    notes: "",
  });

  const handleVaccineSelect = (name: string) => {
    const vaccine = vaccines.find(v => v.name === name);
    setFormData({
      ...formData,
      vaccine_name: name,
      disease_prevention: vaccine?.prevention || "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      profile_id: profileId,
      vaccine_type: vaccineType,
      official_source: "Manual",
    });
    onClose();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
          {vaccineType === 'adulto' ? '💉 Adicionar Vacina (Adulto)' : '👶 Adicionar Vacina (Infantil)'}
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vaccine_name">Vacina *</Label>
            <Select value={formData.vaccine_name} onValueChange={handleVaccineSelect} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a vacina" />
              </SelectTrigger>
              <SelectContent>
                {vaccines.map((vaccine) => (
                  <SelectItem key={vaccine.name} value={vaccine.name}>
                    {vaccine.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.disease_prevention && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <span className="font-semibold">Previne:</span> {formData.disease_prevention}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dose_description">Dose</Label>
              <Input
                id="dose_description"
                value={formData.dose_description}
                onChange={(e) => setFormData({ ...formData, dose_description: e.target.value })}
                placeholder="Ex: 1ª dose, Reforço"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="application_date">Data de Aplicação *</Label>
              <Input
                id="application_date"
                type="date"
                value={formData.application_date}
                onChange={(e) => setFormData({ ...formData, application_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="next_dose_date">Próxima Dose (se houver)</Label>
            <Input
              id="next_dose_date"
              type="date"
              value={formData.next_dose_date}
              onChange={(e) => setFormData({ ...formData, next_dose_date: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vaccination_location">Local de Aplicação</Label>
            <Input
              id="vaccination_location"
              value={formData.vaccination_location}
              onChange={(e) => setFormData({ ...formData, vaccination_location: e.target.value })}
              placeholder="Ex: UBS Centro, Clínica Saúde"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vaccinator_name">Vacinador</Label>
            <Input
              id="vaccinator_name"
              value={formData.vaccinator_name}
              onChange={(e) => setFormData({ ...formData, vaccinator_name: e.target.value })}
              placeholder="Nome do profissional"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="batch_number">Lote</Label>
              <Input
                id="batch_number"
                value={formData.batch_number}
                onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                placeholder="Número do lote"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="manufacturer">Fabricante</Label>
              <Input
                id="manufacturer"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                placeholder="Ex: Butantan, Fiocruz"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Reações adversas, observações..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Salvando..." : "Salvar Registro"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
