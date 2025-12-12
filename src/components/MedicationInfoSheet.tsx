import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Pill, Tag, FileText, Info } from "lucide-react";
import { MedicationInfo } from "@/hooks/useMedicationInfo";

interface MedicationInfoSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medicationName: string;
  info: MedicationInfo | null;
  isLoading: boolean;
  error: string | null;
}

export default function MedicationInfoSheet({
  open,
  onOpenChange,
  medicationName,
  info,
  isLoading,
  error,
}: MedicationInfoSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl overflow-y-auto">
        <SheetHeader className="text-left pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Pill className="h-6 w-6 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-xl">{medicationName}</SheetTitle>
              <SheetDescription>Informações sobre o medicamento</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{error}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Consulte um médico ou farmacêutico para mais informações.
              </p>
            </div>
          )}

          {info && !isLoading && (
            <>
              {/* Indication */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Para que serve</h3>
                </div>
                <p className="text-muted-foreground pl-7 leading-relaxed">
                  {info.indication || info.description || "Informação não disponível"}
                </p>
              </div>

              {/* Therapeutic Class */}
              {info.therapeuticClass && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Tag className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-foreground">Classe terapêutica</h3>
                  </div>
                  <div className="pl-7">
                    <Badge variant="secondary" className="text-sm">
                      {info.therapeuticClass}
                    </Badge>
                  </div>
                </div>
              )}

              {/* Active Ingredient */}
              {info.activeIngredient && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Pill className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-foreground">Princípio ativo</h3>
                  </div>
                  <p className="text-muted-foreground pl-7">
                    {info.activeIngredient}
                  </p>
                </div>
              )}

              {/* Warnings */}
              {info.warnings && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-warning" />
                    <h3 className="font-semibold text-foreground">Cuidados importantes</h3>
                  </div>
                  <p className="text-muted-foreground pl-7 leading-relaxed">
                    {info.warnings}
                  </p>
                </div>
              )}

              {/* Disclaimer */}
              <div className="mt-8 p-4 bg-muted rounded-lg">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Estas informações são apenas para fins educacionais e não substituem
                    a orientação de um profissional de saúde. Sempre consulte seu médico
                    ou farmacêutico antes de iniciar, alterar ou interromper qualquer
                    tratamento.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}