import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Pill, Leaf, Heart, Package, Check, ChevronsUpDown, HelpCircle, Search, Zap, Moon, Shield, Droplets, Dumbbell } from "lucide-react";
import { useFilteredMedicamentos } from "@/hooks/useMedicamentosBrasileiros";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
interface WizardStepIdentityProps {
  data: {
    name: string;
    category: string;
    notes: string;
    supplementCategory?: string;
  };
  updateData: (data: Partial<any>) => void;
}

const supplementCategories = [
  { value: "energy", label: "Energia", icon: Zap, color: "text-amber-500", bgColor: "bg-amber-50 dark:bg-amber-950/30", description: "Pré-treino, cafeína, B12" },
  { value: "sleep", label: "Sono", icon: Moon, color: "text-purple-500", bgColor: "bg-purple-50 dark:bg-purple-950/30", description: "Melatonina, magnésio, camomila" },
  { value: "immunity", label: "Imunidade", icon: Shield, color: "text-green-500", bgColor: "bg-green-50 dark:bg-green-950/30", description: "Vitamina C, D, zinco" },
  { value: "performance", label: "Performance", icon: Dumbbell, color: "text-orange-500", bgColor: "bg-orange-50 dark:bg-orange-950/30", description: "Whey, creatina, BCAA" },
  { value: "hydration", label: "Hidratação", icon: Droplets, color: "text-blue-500", bgColor: "bg-blue-50 dark:bg-blue-950/30", description: "Eletrólitos, isotônicos" },
];

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
    <div className="space-y-6">
      {/* Nome do medicamento */}
      <div className="space-y-3">
        <Label className="text-base font-semibold flex items-center gap-1">
          Nome do medicamento
          <span className="text-destructive">*</span>
        </Label>
        
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className={cn(
                "w-full h-12 justify-between text-left font-normal",
                data.name ? "border-primary bg-primary/5" : "border-dashed"
              )}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className={cn("truncate", !data.name && "text-muted-foreground")}>
                  {data.name || "Buscar medicamento..."}
                </span>
              </div>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[calc(100vw-3rem)] max-w-[400px] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput 
                placeholder="Digite o nome..." 
                value={searchTerm}
                onValueChange={setSearchTerm}
                className="h-11"
              />
              <CommandList className="max-h-[200px]">
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
                        className="py-2.5 cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            data.name === med.nome ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="truncate">{med.nome}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Input manual alternativo */}
        <Input
          placeholder="Ou digite o nome aqui..."
          value={data.name}
          onChange={(e) => updateData({ name: e.target.value })}
          className="h-11"
        />
      </div>

      {/* Categoria */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Tipo</Label>
        
        <div className="grid grid-cols-2 gap-2">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = data.category === cat.value;
            return (
              <Card
                key={cat.value}
                onClick={() => updateData({ category: cat.value })}
                className={cn(
                  "p-3 cursor-pointer transition-all active:scale-[0.98]",
                  isSelected 
                    ? `${cat.bgColor} ${cat.borderColor} border-2` 
                    : "hover:border-primary/30"
                )}
              >
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    isSelected ? cat.bgColor : "bg-muted"
                  )}>
                    <Icon className={cn("w-4 h-4", cat.color)} />
                  </div>
                  <span className="text-sm font-medium truncate">{cat.label}</span>
                  {isSelected && (
                    <Check className="w-4 h-4 text-primary ml-auto shrink-0" />
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Categoria do Suplemento - só aparece se for vitamina ou suplemento */}
      {(data.category === 'vitamina' || data.category === 'suplemento') && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            Para que você usa? <span className="text-muted-foreground font-normal">(opcional)</span>
          </Label>
          
          <div className="flex flex-wrap gap-1.5">
            {supplementCategories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = data.supplementCategory === cat.value;
              return (
                <Button
                  key={cat.value}
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateData({ 
                    supplementCategory: isSelected ? undefined : cat.value 
                  })}
                  className="h-8 gap-1.5 text-xs"
                >
                  <Icon className={cn("h-3.5 w-3.5", isSelected ? "text-primary-foreground" : cat.color)} />
                  {cat.label}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Observações */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            Observação <span className="text-muted-foreground font-normal">(opcional)</span>
          </Label>
          <span className="text-xs text-muted-foreground">
            {data.notes.length}/200
          </span>
        </div>
        <Textarea
          placeholder="Ex: Tomar com água, após as refeições..."
          value={data.notes}
          onChange={(e) => updateData({ notes: e.target.value.slice(0, 200) })}
          rows={2}
          className="resize-none text-sm min-h-[60px]"
        />
      </div>
    </div>
  );
}