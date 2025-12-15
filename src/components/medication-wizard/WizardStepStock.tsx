import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, AlertTriangle, HelpCircle, CheckCircle2, Bell } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface WizardStepStockProps {
  data: {
    unitsTotal: number;
    unitLabel: string;
    lowStockThreshold: number;
  };
  updateData: (data: Partial<any>) => void;
  dosesPerDay?: number;
}

export function WizardStepStock({ data, updateData, dosesPerDay = 1 }: WizardStepStockProps) {
  const unitOptions = [
    { value: "comprimidos", label: "Comprimidos", emoji: "💊" },
    { value: "cápsulas", label: "Cápsulas", emoji: "💊" },
    { value: "gotas", label: "Gotas", emoji: "💧" },
    { value: "ml", label: "Mililitros (ml)", emoji: "🧪" },
    { value: "frascos", label: "Frascos", emoji: "🧴" },
    { value: "ampolas", label: "Ampolas", emoji: "💉" },
    { value: "aplicações", label: "Aplicações", emoji: "💉" },
    { value: "sachês", label: "Sachês", emoji: "📦" },
    { value: "unidades", label: "Unidades", emoji: "📦" },
  ];

  // Cálculos
  const daysRemaining = data.unitsTotal > 0 ? Math.floor(data.unitsTotal / dosesPerDay) : 0;
  const percentRemaining = data.unitsTotal > 0 ? Math.min(100, (data.unitsTotal / (data.lowStockThreshold * 3)) * 100) : 0;
  const isLowStock = data.unitsTotal <= data.lowStockThreshold;
  const willAlertSoon = data.unitsTotal <= data.lowStockThreshold * 1.5 && !isLowStock;

  return (
    <div className="space-y-8">
      {/* Header explicativo */}
      <Alert className="bg-primary/5 border-primary/20">
        <HelpCircle className="h-4 w-4 text-primary" />
        <AlertDescription className="text-sm">
          <strong>Por que controlar o estoque?</strong> O app desconta automaticamente quando você toma 
          e avisa quando estiver acabando. Assim você nunca fica sem!
        </AlertDescription>
      </Alert>

      {/* Quantidade */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">
          Quantos você tem agora?
        </Label>
        
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Input
              type="number"
              min="0"
              value={data.unitsTotal || ""}
              onChange={(e) => updateData({ unitsTotal: parseInt(e.target.value) || 0 })}
              className="text-3xl h-20 text-center font-bold"
              placeholder="0"
            />
          </div>
          <div className="w-40">
            <Select value={data.unitLabel} onValueChange={(value) => updateData({ unitLabel: value })}>
              <SelectTrigger className="h-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {unitOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <span className="flex items-center gap-2">
                      <span>{opt.emoji}</span>
                      <span>{opt.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Alerta de estoque baixo */}
      <div className="space-y-4">
        <Label className="text-base font-medium flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Avisar quando restar:
        </Label>
        
        <div className="flex items-center gap-4">
          <Input
            type="number"
            min="1"
            value={data.lowStockThreshold}
            onChange={(e) => updateData({ lowStockThreshold: parseInt(e.target.value) || 5 })}
            className="w-24 h-12 text-center text-lg font-medium"
          />
          <span className="text-muted-foreground">{data.unitLabel}</span>
        </div>
        
        <p className="text-sm text-muted-foreground">
          Você receberá uma notificação quando o estoque chegar a este número
        </p>
      </div>

      {/* Preview do estoque */}
      {data.unitsTotal > 0 && (
        <Card className={cn(
          "p-5 space-y-4",
          isLowStock 
            ? "border-destructive/50 bg-destructive/5" 
            : willAlertSoon 
              ? "border-yellow-500/50 bg-yellow-500/5"
              : "border-green-500/50 bg-green-500/5"
        )}>
          <div className="flex items-start gap-3">
            {isLowStock ? (
              <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
            ) : (
              <CheckCircle2 className={cn(
                "w-5 h-5 mt-0.5",
                willAlertSoon ? "text-yellow-500" : "text-green-500"
              )} />
            )}
            <div className="flex-1 space-y-3">
              <div>
                <p className="font-medium">
                  {isLowStock 
                    ? "Estoque baixo!" 
                    : willAlertSoon 
                      ? "Estoque ficando baixo"
                      : "Estoque em dia"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {data.unitsTotal} {data.unitLabel} disponíveis
                </p>
              </div>
              
              <Progress 
                value={percentRemaining} 
                className={cn(
                  "h-2",
                  isLowStock 
                    ? "[&>div]:bg-destructive" 
                    : willAlertSoon 
                      ? "[&>div]:bg-yellow-500"
                      : "[&>div]:bg-green-500"
                )}
              />

              <div className="grid grid-cols-2 gap-4 pt-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Duração estimada</p>
                  <p className="font-semibold text-lg">
                    ~{daysRemaining} dias
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Alerta em</p>
                  <p className="font-semibold text-lg">
                    {Math.max(0, data.unitsTotal - data.lowStockThreshold)} doses
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Dica */}
      <div className="text-center text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
        <Package className="w-5 h-5 mx-auto mb-2 text-primary" />
        <p>
          <strong>Dica:</strong> Mantenha sempre uma margem de segurança. 
          Assim você tem tempo de comprar mais antes de acabar.
        </p>
      </div>
    </div>
  );
}