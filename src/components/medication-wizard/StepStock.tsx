import { useState } from "react";
import { Package, AlertTriangle } from "lucide-react";
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
  { value: "unidades", label: "Unidades", emoji: "📦" },
];

export default function StepStock({ stock, dosesPerDay, onStockChange, onComplete }: StepStockProps) {
  const daysRemaining = stock.unitsTotal > 0 && dosesPerDay > 0 
    ? Math.floor(stock.unitsTotal / dosesPerDay) 
    : 0;

  const isLowStock = daysRemaining > 0 && daysRemaining <= 7;

  return (
    <div className="space-y-4">
      <StepTooltip type="info">
        Ative o controle de estoque para receber alertas quando o medicamento estiver acabando. O sistema desconta automaticamente quando você marca doses como tomadas.
      </StepTooltip>

      {/* Enable toggle */}
      <div className="flex items-center justify-between p-4 rounded-xl border-2 transition-all">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2.5 rounded-full",
            stock.enabled ? "bg-primary/10" : "bg-muted"
          )}>
            <Package className={cn(
              "h-5 w-5",
              stock.enabled ? "text-primary" : "text-muted-foreground"
            )} />
          </div>
          <div>
            <p className="font-medium">Controlar estoque</p>
            <p className="text-sm text-muted-foreground">Alertas automáticos</p>
          </div>
        </div>
        <Switch
          checked={stock.enabled}
          onCheckedChange={(checked) => onStockChange({ ...stock, enabled: checked })}
        />
      </div>

      {/* Stock details */}
      {stock.enabled && (
        <div className="space-y-4 p-4 bg-muted/30 rounded-lg border animate-in fade-in duration-300">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="units" className="text-sm">Quantidade atual</Label>
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit-type" className="text-sm">Unidade</Label>
              <Select
                value={stock.unitLabel}
                onValueChange={(value) => onStockChange({ ...stock, unitLabel: value })}
              >
                <SelectTrigger id="unit-type">
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
              "p-4 rounded-lg",
              isLowStock 
                ? "bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800" 
                : "bg-primary/5"
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isLowStock && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                  <span className="text-sm font-medium">Duração estimada:</span>
                </div>
                <span className={cn(
                  "font-bold",
                  isLowStock ? "text-amber-600 dark:text-amber-400" : "text-primary"
                )}>
                  ~{daysRemaining} dias
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stock.unitsTotal} {stock.unitLabel} ÷ {dosesPerDay} doses/dia
              </p>
            </div>
          )}
        </div>
      )}

      <Button 
        onClick={onComplete}
        className="w-full h-11"
      >
        {stock.enabled ? "Continuar" : "Pular esta etapa"}
      </Button>
    </div>
  );
}
