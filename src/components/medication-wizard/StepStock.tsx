import { Package, AlertTriangle, HelpCircle, Bell, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import StepTooltip from "./StepTooltip";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StockData {
  enabled: boolean;
  unitsTotal: number;
  unitLabel: string;
}

interface StepStockProps {
  stock: StockData;
  dosesPerDay: number;
  onStockChange: (stock: StockData) => void;
  onComplete: () => void;
}

const unitOptions = [
  { value: "comprimidos", label: "Comprimidos", emoji: "💊" },
  { value: "cápsulas", label: "Cápsulas", emoji: "💊" },
  { value: "gotas", label: "Gotas", emoji: "💧" },
  { value: "ml", label: "Mililitros (ml)", emoji: "🧴" },
  { value: "sachês", label: "Sachês", emoji: "📦" },
  { value: "adesivos", label: "Adesivos", emoji: "🩹" },
  { value: "ampolas", label: "Ampolas", emoji: "💉" },
  { value: "unidades", label: "Unidades", emoji: "📦" },
];

const quickQuantities = [10, 20, 30, 60, 90];

export default function StepStock({ stock, dosesPerDay, onStockChange, onComplete }: StepStockProps) {
  const daysRemaining = stock.unitsTotal > 0 && dosesPerDay > 0 
    ? Math.floor(stock.unitsTotal / dosesPerDay) 
    : 0;

  const isLowStock = daysRemaining > 0 && daysRemaining <= 7;
  const endDate = daysRemaining > 0 
    ? new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')
    : null;

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <StepTooltip type="info">
          <strong>Controle de estoque</strong> te avisa quando o medicamento está acabando. O sistema desconta automaticamente a cada dose tomada.
        </StepTooltip>

        {/* Enable toggle */}
        <button
          type="button"
          onClick={() => onStockChange({ ...stock, enabled: !stock.enabled })}
          className={cn(
            "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left",
            stock.enabled 
              ? "border-primary bg-primary/10 shadow-md ring-2 ring-primary/20" 
              : "border-border hover:border-primary/30 bg-background"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-3 rounded-full",
              stock.enabled ? "bg-primary/20" : "bg-muted"
            )}>
              <Package className={cn(
                "h-6 w-6",
                stock.enabled ? "text-primary" : "text-muted-foreground"
              )} />
            </div>
            <div>
              <p className="font-semibold">Controlar estoque</p>
              <p className="text-sm text-muted-foreground">Alertas quando estiver acabando</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-[200px]">
                <p className="text-xs">Você receberá alertas quando o estoque estiver baixo para não ficar sem medicamento.</p>
              </TooltipContent>
            </Tooltip>
            <Switch
              checked={stock.enabled}
              onCheckedChange={(checked) => onStockChange({ ...stock, enabled: checked })}
            />
          </div>
        </button>

        {/* Stock details */}
        {stock.enabled && (
          <div className="space-y-4 p-4 bg-muted/30 rounded-xl border-2 border-primary/20 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Quick quantities */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                Quantidade atual
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Quantas unidades você tem agora</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {quickQuantities.map((qty) => (
                  <Tooltip key={qty}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => onStockChange({ ...stock, unitsTotal: qty })}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                          stock.unitsTotal === qty
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "bg-background border hover:border-primary/50"
                        )}
                      >
                        {qty}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">{qty} unidades</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="units" className="text-sm">Ou digite a quantidade</Label>
                <Input
                  id="units"
                  type="number"
                  min="1"
                  placeholder="Ex: 30"
                  value={stock.unitsTotal || ""}
                  onChange={(e) => onStockChange({ 
                    ...stock, 
                    unitsTotal: parseInt(e.target.value) || 0 
                  })}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit-type" className="text-sm flex items-center gap-2">
                  Tipo de unidade
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Formato do medicamento</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Select
                  value={stock.unitLabel}
                  onValueChange={(value) => onStockChange({ ...stock, unitLabel: value })}
                >
                  <SelectTrigger id="unit-type" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {unitOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.emoji} {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Projection */}
            {stock.unitsTotal > 0 && dosesPerDay > 0 && (
              <div className={cn(
                "p-4 rounded-xl",
                isLowStock 
                  ? "bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-700" 
                  : "bg-primary/5 border border-primary/20"
              )}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {isLowStock ? (
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-primary" />
                    )}
                    <span className="font-semibold">Duração estimada</span>
                  </div>
                  <span className={cn(
                    "text-lg font-bold",
                    isLowStock ? "text-amber-600 dark:text-amber-400" : "text-primary"
                  )}>
                    ~{daysRemaining} dias
                  </span>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>{stock.unitsTotal} {stock.unitLabel} ÷ {dosesPerDay} dose(s)/dia</p>
                  {endDate && (
                    <p className="flex items-center gap-1">
                      <Bell className="h-3.5 w-3.5" />
                      Previsão de término: <strong>{endDate}</strong>
                    </p>
                  )}
                </div>
                {isLowStock && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-medium">
                    ⚠️ Estoque baixo! Considere comprar mais.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <Button 
          onClick={onComplete}
          className="w-full h-12 text-base font-semibold"
        >
          {stock.enabled ? "Finalizar" : "Pular e finalizar"}
        </Button>
      </div>
    </TooltipProvider>
  );
}
