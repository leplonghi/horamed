import { useState } from "react";
import { Check, Search, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useFilteredMedicamentos } from "@/hooks/useMedicamentosBrasileiros";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import StepTooltip from "./StepTooltip";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";

interface StepNameProps {
  name: string;
  onNameChange: (name: string) => void;
  onComplete: () => void;
}

export default function StepName({ name, onNameChange, onComplete }: StepNameProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const { medicamentos } = useFilteredMedicamentos(name, 50);

  const handleSelect = (selectedName: string) => {
    onNameChange(selectedName);
    setOpen(false);
  };

  const isValid = name.trim().length >= 2;

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <StepTooltip type="tip">
          Digite o nome do medicamento, vitamina ou suplemento. Você pode selecionar da lista de medicamentos brasileiros ou digitar um nome personalizado.
        </StepTooltip>

        <div className="space-y-2">
          <Label htmlFor="med-name" className="text-sm font-medium flex items-center gap-2">
            Nome do medicamento ou suplemento
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[220px]">
                <p className="text-xs">Digite pelo menos 2 caracteres para buscar. Se não encontrar, pode usar qualquer nome.</p>
              </TooltipContent>
            </Tooltip>
          </Label>
          
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className={cn(
                  "w-full justify-between h-14 text-left font-normal text-base border-2",
                  !name && "text-muted-foreground",
                  name && "border-primary/50 bg-primary/5"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-full",
                    name ? "bg-primary/10" : "bg-muted"
                  )}>
                    <Search className={cn(
                      "h-4 w-4",
                      name ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>
                  <span className="truncate">
                    {name || "Buscar medicamento..."}
                  </span>
                </div>
                {name && (
                  <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-popover z-50" align="start">
              <Command shouldFilter={false}>
                <CommandInput 
                  placeholder="Digite para buscar..." 
                  value={name}
                  onValueChange={onNameChange}
                  className="h-12"
                />
                <CommandList className="max-h-[250px]">
                  <CommandEmpty>
                    <div className="p-4 text-center">
                      <p className="text-sm text-muted-foreground mb-3">
                        Não encontrado na lista de medicamentos
                      </p>
                      {name.length >= 2 && (
                        <Button 
                          size="sm"
                          onClick={() => setOpen(false)}
                          className="w-full"
                        >
                          ✓ Usar "{name}"
                        </Button>
                      )}
                    </div>
                  </CommandEmpty>
                  <CommandGroup>
                    {medicamentos.map((med) => (
                      <CommandItem
                        key={med.nome}
                        value={med.nome}
                        onSelect={() => handleSelect(med.nome)}
                        className="py-3 cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            name === med.nome ? "opacity-100 text-primary" : "opacity-0"
                          )}
                        />
                        <span className="truncate">{med.nome}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {name && !open && (
            <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-lg border border-primary/20">
              <Check className="h-4 w-4 text-primary" />
              <p className="text-sm">
                <span className="font-semibold text-primary">{name}</span>
              </p>
            </div>
          )}
        </div>

        <Button 
          onClick={onComplete}
          disabled={!isValid}
          className="w-full h-12 text-base font-semibold"
        >
          Continuar
        </Button>
      </div>
    </TooltipProvider>
  );
}
