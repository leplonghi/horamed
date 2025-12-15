import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Pill, Leaf, Heart, Package, Check, ChevronsUpDown, HelpCircle, Search } from "lucide-react";
import { useFilteredMedicamentos } from "@/hooks/useMedicamentosBrasileiros";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
    { 
      value: "medicamento", 
      label: "Medicamento", 
      icon: Pill, 
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
      borderColor: "border-blue-200 dark:border-blue-800",
      description: "Remédios prescritos ou de farmácia"
    },
    { 
      value: "vitamina", 
      label: "Vitamina", 
      icon: Leaf, 
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-950/30",
      borderColor: "border-green-200 dark:border-green-800",
      description: "Vitaminas e minerais"
    },
    { 
      value: "suplemento", 
      label: "Suplemento", 
      icon: Heart, 
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
      borderColor: "border-purple-200 dark:border-purple-800",
      description: "Suplementos alimentares"
    },
    { 
      value: "outro", 
      label: "Outro", 
      icon: Package, 
      color: "text-gray-500",
      bgColor: "bg-gray-50 dark:bg-gray-950/30",
      borderColor: "border-gray-200 dark:border-gray-800",
      description: "Outros produtos de saúde"
    },
  ];

  const { medicamentos, loading } = useFilteredMedicamentos(searchTerm, 50);
  
  const detectCategory = (medName: string): string => {
    const nameLower = medName.toLowerCase();
    
    if (nameLower.includes('vitamina') || 
        nameLower.includes('vit.') ||
        nameLower.includes('complexo b') ||
        nameLower.match(/\bvit\s*[abcdek]/)) {
      return 'vitamina';
    }
    
    if (nameLower.includes('suplemento') ||
        nameLower.includes('whey') ||
        nameLower.includes('creatina') ||
        nameLower.includes('omega') ||
        nameLower.includes('colageno') ||
        nameLower.includes('probiotico')) {
      return 'suplemento';
    }
    
    return 'medicamento';
  };
  
  const handleSelectMedication = (selectedName: string) => {
    const category = detectCategory(selectedName);
    updateData({ 
      name: selectedName,
      category: category 
    });
    setOpen(false);
    setSearchTerm("");
  };

  const selectedCategory = categories.find(c => c.value === data.category);

  return (
    <div className="space-y-8">
      {/* Header explicativo */}
      <Alert className="bg-primary/5 border-primary/20">
        <HelpCircle className="h-4 w-4 text-primary" />
        <AlertDescription className="text-sm">
          <strong>O que é isso?</strong> Digite o nome do medicamento que você quer lembrar de tomar. 
          Você pode buscar na lista ou digitar manualmente.
        </AlertDescription>
      </Alert>

      {/* Nome do medicamento */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Label className="text-lg font-semibold">
            Qual medicamento você quer adicionar?
          </Label>
          <span className="text-destructive">*</span>
        </div>
        
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className={cn(
                "w-full h-16 justify-between text-lg font-normal transition-all",
                data.name ? "border-primary bg-primary/5" : "border-dashed"
              )}
            >
              <div className="flex items-center gap-3">
                <Search className="h-5 w-5 text-muted-foreground" />
                {data.name ? (
                  <span className="font-medium">{data.name}</span>
                ) : (
                  <span className="text-muted-foreground">Buscar medicamento...</span>
                )}
              </div>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[calc(100vw-4rem)] max-w-[500px] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput 
                placeholder="Digite o nome do medicamento..." 
                value={searchTerm}
                onValueChange={setSearchTerm}
                className="h-12"
              />
              <CommandList className="max-h-[250px]">
                <CommandEmpty className="py-6 text-center text-sm">
                  {loading ? (
                    <span className="text-muted-foreground">Buscando...</span>
                  ) : searchTerm.length < 2 ? (
                    <span className="text-muted-foreground">Digite pelo menos 2 letras</span>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-muted-foreground">Não encontrado na lista</p>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          updateData({ name: searchTerm });
                          setOpen(false);
                        }}
                      >
                        Usar "{searchTerm}"
                      </Button>
                    </div>
                  )}
                </CommandEmpty>
                {searchTerm.length >= 2 && (
                  <CommandGroup>
                    {medicamentos.map((med) => (
                      <CommandItem
                        key={med.nome}
                        value={med.nome}
                        onSelect={() => handleSelectMedication(med.nome)}
                        className="py-3 cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            data.name === med.nome ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span>{med.nome}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Input manual */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">ou digite diretamente</span>
          </div>
        </div>

        <Input
          placeholder="Ex: Losartana 50mg, Vitamina D3..."
          value={data.name}
          onChange={(e) => updateData({ name: e.target.value })}
          className="h-14 text-base"
        />
      </div>

      {/* Categoria */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">
          Que tipo de produto é esse?
        </Label>
        
        <div className="grid grid-cols-2 gap-3">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = data.category === cat.value;
            return (
              <Card
                key={cat.value}
                onClick={() => updateData({ category: cat.value })}
                className={cn(
                  "p-4 cursor-pointer transition-all hover:shadow-md",
                  isSelected 
                    ? `${cat.bgColor} ${cat.borderColor} border-2 shadow-md` 
                    : "hover:border-primary/30"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    isSelected ? cat.bgColor : "bg-muted"
                  )}>
                    <Icon className={cn("w-5 h-5", cat.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{cat.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {cat.description}
                    </p>
                  </div>
                  {isSelected && (
                    <Check className="w-5 h-5 text-primary shrink-0" />
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Observações */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">
            Alguma observação? (opcional)
          </Label>
          <span className="text-xs text-muted-foreground">
            {data.notes.length}/200
          </span>
        </div>
        <Textarea
          placeholder="Ex: Tomar com água, evitar com leite, guardar na geladeira..."
          value={data.notes}
          onChange={(e) => updateData({ notes: e.target.value.slice(0, 200) })}
          rows={2}
          className="resize-none"
        />
      </div>
    </div>
  );
}