import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateVaccinationRecord } from "@/hooks/useVaccinationRecords";
import { X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const { t } = useLanguage();
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
          {vaccineType === 'adulto' ? `💉 ${t('vaccines.addVaccineAdult')}` : `👶 ${t('vaccines.addVaccineChild')}`}
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vaccine_name">{t('vaccines.selectVaccine')} *</Label>
            <Select value={formData.vaccine_name} onValueChange={handleVaccineSelect} required>
              <SelectTrigger>
                <SelectValue placeholder={t('vaccines.selectVaccine')} />
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
                <span className="font-semibold">{t('vaccines.prevents')}:</span> {formData.disease_prevention}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dose_description">{t('vaccines.doseLabel')}</Label>
              <Input
                id="dose_description"
                value={formData.dose_description}
                onChange={(e) => setFormData({ ...formData, dose_description: e.target.value })}
                placeholder={t('vaccines.dosePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="application_date">{t('vaccines.applicationDate')} *</Label>
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
            <Label htmlFor="next_dose_date">{t('vaccines.nextDoseIfAny')}</Label>
            <Input
              id="next_dose_date"
              type="date"
              value={formData.next_dose_date}
              onChange={(e) => setFormData({ ...formData, next_dose_date: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vaccination_location">{t('vaccines.applicationLocation')}</Label>
            <Input
              id="vaccination_location"
              value={formData.vaccination_location}
              onChange={(e) => setFormData({ ...formData, vaccination_location: e.target.value })}
              placeholder={t('vaccines.locationPlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vaccinator_name">{t('vaccines.vaccinatorName')}</Label>
            <Input
              id="vaccinator_name"
              value={formData.vaccinator_name}
              onChange={(e) => setFormData({ ...formData, vaccinator_name: e.target.value })}
              placeholder={t('vaccines.vaccinatorPlaceholder')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="batch_number">{t('vaccines.batchNumber')}</Label>
              <Input
                id="batch_number"
                value={formData.batch_number}
                onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                placeholder={t('vaccines.batchPlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="manufacturer">{t('vaccines.manufacturerLabel')}</Label>
              <Input
                id="manufacturer"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                placeholder={t('vaccines.manufacturerPlaceholder')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t('vaccines.observations')}</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder={t('vaccines.observationsPlaceholder')}
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1" disabled={createMutation.isPending}>
              {createMutation.isPending ? t('vaccines.saving') : t('vaccines.saveRecord')}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}