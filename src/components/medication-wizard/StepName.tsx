import { useState } from "react";
import { Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useFilteredMedicamentos } from "@/hooks/useMedicamentosBrasileiros";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import StepTooltip from "./StepTooltip";

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
    <div className="space-y-4">
      <StepTooltip type="tip">
        Digite o nome do seu medicamento. Você pode selecionar da lista de medicamentos brasileiros ou digitar um nome personalizado.
      </StepTooltip>

      <div className="space-y-2">
        <Label htmlFor="med-name" className="text-sm font-medium">
          Nome do medicamento ou suplemento
        </Label>
        
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className={cn(
                "w-full justify-between h-12 text-left font-normal text-base",
                !name && "text-muted-foreground"
              )}
            >
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">
                  {name || "Buscar medicamento..."}
                </span>
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-popover z-50" align="start">
            <Command shouldFilter={false}>
              <CommandInput 
                placeholder="Digite para buscar..." 
                value={name}
                onValueChange={onNameChange}
                className="h-11"
              />
              <CommandList className="max-h-[200px]">
                <CommandEmpty>
                  <div className="p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-3">
                      Não encontrado na lista
                    </p>
                    {name.length >= 2 && (
                      <Button 
                        size="sm"
                        onClick={() => setOpen(false)}
                        className="w-full"
                      >
                        Usar "{name}"
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
                      className="py-3"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          name === med.nome ? "opacity-100" : "opacity-0"
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
          <p className="text-xs text-muted-foreground">
            ✓ Medicamento: <span className="font-medium text-foreground">{name}</span>
          </p>
        )}
      </div>

      <Button 
        onClick={onComplete}
        disabled={!isValid}
        className="w-full h-11"
      >
        Continuar
      </Button>
    </div>
  );
}
