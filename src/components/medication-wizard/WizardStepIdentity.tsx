import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Pill, Leaf, Heart, Package, Check, ChevronsUpDown } from "lucide-react";
import { useFilteredMedicamentos } from "@/hooks/useMedicamentosBrasileiros";
import { cn } from "@/lib/utils";

interface WizardStepIdentityProps {
  data: {
    name: string;
    category: string;
    notes: string;
  };
  updateData: (data: Partial<any>) => void;
}

export function WizardStepIdentity({ data, updateData }: WizardStepIdentityProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const categories = [
    { value: "medicamento", label: "Medicamento", icon: Pill, color: "text-blue-500" },
    { value: "vitamina", label: "Vitamina", icon: Leaf, color: "text-green-500" },
    { value: "suplemento", label: "Suplemento", icon: Heart, color: "text-purple-500" },
    { value: "outro", label: "Outro", icon: Package, color: "text-gray-500" },
  ];

  // Get filtered medications from CSV (only VÁLIDO)
  const { medicamentos, loading } = useFilteredMedicamentos(searchTerm, 50);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-lg font-semibold">
          Nome do Medicamento *
        </Label>
        
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full h-14 justify-between text-lg font-normal"
            >
              {data.name || "Buscar medicamento..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput 
                placeholder="Buscar medicamento..." 
                value={searchTerm}
                onValueChange={setSearchTerm}
              />
              <CommandList>
                <CommandEmpty>
                  {loading ? "Carregando..." : "Nenhum medicamento encontrado."}
                </CommandEmpty>
                <CommandGroup>
                  {medicamentos.map((med) => (
                    <CommandItem
                      key={med.nome}
                      value={med.nome}
                      onSelect={(currentValue) => {
                        updateData({ name: currentValue });
                        setOpen(false);
                        setSearchTerm("");
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          data.name === med.nome ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {med.nome}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        
        <p className="text-sm text-muted-foreground">
          Busque na lista de medicamentos registrados ou digite manualmente
        </p>
        
        {/* Manual input option */}
        <Input
          placeholder="Ou digite manualmente"
          value={data.name}
          onChange={(e) => updateData({ name: e.target.value })}
          className="text-base"
        />
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
