import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface WizardStepStockProps {
  data: {
    unitsTotal: number;
    unitLabel: string;
    lowStockThreshold: number;
  };
  updateData: (data: Partial<any>) => void;
}

export function WizardStepStock({ data, updateData }: WizardStepStockProps) {
  const unitOptions = [
    { value: "comprimidos", label: "Comprimidos" },
    { value: "cápsulas", label: "Cápsulas" },
    { value: "gotas", label: "Gotas" },
    { value: "ml", label: "Mililitros (ml)" },
    { value: "frascos", label: "Frascos" },
    { value: "ampolas", label: "Ampolas" },
    { value: "aplicações", label: "Aplicações" },
    { value: "sachês", label: "Sachês" },
    { value: "unidades", label: "Unidades" },
  ];

  const daysRemaining = Math.floor(data.unitsTotal / 1); // Simplified calculation

  return (
    <div className="space-y-6">
      <Alert>
        <Package className="h-4 w-4" />
        <AlertDescription>
          O controle de estoque ajuda você a nunca ficar sem seu medicamento.
          O app desconta automaticamente quando você marca as doses como tomadas.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label htmlFor="unitsTotal" className="text-lg font-semibold">
          Quantidade disponível *
        </Label>
        <Input
          id="unitsTotal"
          type="number"
          min="1"
          value={data.unitsTotal}
          onChange={(e) => updateData({ unitsTotal: parseInt(e.target.value) || 1 })}
          className="text-2xl h-16 text-center font-bold"
        />
        <p className="text-sm text-muted-foreground text-center">
          Quantas unidades você tem agora?
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="unitLabel" className="text-base font-medium">
          Tipo de unidade
        </Label>
        <Select value={data.unitLabel} onValueChange={(value) => updateData({ unitLabel: value })}>
          <SelectTrigger id="unitLabel" className="h-12 text-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {unitOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-lg">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="lowStockThreshold" className="text-base font-medium">
          Alerta de estoque baixo
        </Label>
        <Input
          id="lowStockThreshold"
          type="number"
          min="1"
          value={data.lowStockThreshold}
          onChange={(e) => updateData({ lowStockThreshold: parseInt(e.target.value) || 5 })}
          className="text-lg h-12"
        />
        <p className="text-sm text-muted-foreground">
          Você será avisado quando o estoque chegar a este número
        </p>
      </div>

      {/* Stock Preview */}
      <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
        <div className="flex items-start space-x-2">
          <Package className="w-5 h-5 text-primary mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">Resumo do estoque</p>
            <div className="text-sm text-muted-foreground space-y-1 mt-1">
              <p>• Total: {data.unitsTotal} {data.unitLabel}</p>
              <p>• Alerta quando restar: {data.lowStockThreshold} {data.unitLabel}</p>
              {data.unitsTotal > 0 && (
                <p className="text-green-600 font-medium mt-2">
                  ✓ Estoque suficiente para aproximadamente {daysRemaining} dias
                </p>
              )}
            </div>
          </div>
        </div>
        
        {data.unitsTotal <= data.lowStockThreshold && (
          <Alert variant="destructive" className="mt-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Atenção: Seu estoque inicial já está no limite de alerta!
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="pt-2 text-center">
        <p className="text-sm text-muted-foreground">
          💡 Dica: Mantenha sempre uma margem de segurança no estoque para não ficar sem o medicamento
        </p>
      </div>
    </div>
  );
}
