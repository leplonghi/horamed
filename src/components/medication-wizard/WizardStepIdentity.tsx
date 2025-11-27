import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Pill, Leaf, Heart, Package } from "lucide-react";

interface WizardStepIdentityProps {
  data: {
    name: string;
    category: string;
    notes: string;
  };
  updateData: (data: Partial<any>) => void;
}

export function WizardStepIdentity({ data, updateData }: WizardStepIdentityProps) {
  const categories = [
    { value: "medicamento", label: "Medicamento", icon: Pill, color: "text-blue-500" },
    { value: "vitamina", label: "Vitamina", icon: Leaf, color: "text-green-500" },
    { value: "suplemento", label: "Suplemento", icon: Heart, color: "text-purple-500" },
    { value: "outro", label: "Outro", icon: Package, color: "text-gray-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-lg font-semibold">
          Nome do Medicamento *
        </Label>
        <Input
          id="name"
          placeholder="Ex: Losartana 50mg"
          value={data.name}
          onChange={(e) => updateData({ name: e.target.value })}
          className="text-lg h-14"
          autoFocus
        />
        <p className="text-sm text-muted-foreground">
          Digite o nome exatamente como aparece na caixa ou receita
        </p>
      </div>

      <div className="space-y-3">
        <Label className="text-lg font-semibold">Categoria</Label>
        <RadioGroup
          value={data.category}
          onValueChange={(value) => updateData({ category: value })}
          className="grid grid-cols-2 gap-3"
        >
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <div key={cat.value}>
                <RadioGroupItem
                  value={cat.value}
                  id={cat.value}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={cat.value}
                  className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-primary peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 h-full`}
                >
                  <Icon className={`w-8 h-8 mb-2 ${cat.color}`} />
                  <span className="font-medium">{cat.label}</span>
                </Label>
              </div>
            );
          })}
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes" className="text-base font-medium">
          Observações (opcional)
        </Label>
        <Textarea
          id="notes"
          placeholder="Ex: Tomar com água, evitar álcool..."
          value={data.notes}
          onChange={(e) => updateData({ notes: e.target.value })}
          rows={3}
          className="resize-none"
        />
        <p className="text-sm text-muted-foreground">
          Adicione instruções especiais ou lembretes
        </p>
      </div>
    </div>
  );
}
