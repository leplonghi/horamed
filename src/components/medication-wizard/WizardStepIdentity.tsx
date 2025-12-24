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
    <div className="space-y-5 sm:space-y-8">
      {/* Header explicativo - Compacto no mobile */}
      <Alert className="bg-primary/5 border-primary/20 py-2 px-3 sm:py-3 sm:px-4">
        <HelpCircle className="h-4 w-4 text-primary shrink-0" />
        <AlertDescription className="text-xs sm:text-sm">
          <strong>Dica:</strong> Busque na lista ou digite diretamente.
        </AlertDescription>
      </Alert>

      {/* Nome do medicamento */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center gap-2">
          <Label className="text-base sm:text-lg font-semibold">
            Qual medicamento?
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
                "w-full h-12 sm:h-14 justify-between text-sm sm:text-base font-normal transition-all",
                data.name ? "border-primary bg-primary/5" : "border-dashed"
              )}
            >
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <Search className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
                {data.name ? (
                  <span className="font-medium truncate">{data.name}</span>
                ) : (
                  <span className="text-muted-foreground">Buscar...</span>
                )}
              </div>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[calc(100vw-4rem)] max-w-[500px] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput 
                placeholder="Digite o nome..." 
                value={searchTerm}
                onValueChange={setSearchTerm}
                className="h-11 sm:h-12"
              />
              <CommandList className="max-h-[200px] sm:max-h-[250px]">
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
        <div className="relative my-3 sm:my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-[10px] sm:text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">ou digite</span>
          </div>
        </div>

        <Input
          placeholder="Ex: Losartana 50mg..."
          value={data.name}
          onChange={(e) => updateData({ name: e.target.value })}
          className="h-11 sm:h-12 text-sm sm:text-base"
        />
      </div>

      {/* Categoria - Grid otimizado para mobile */}
      <div className="space-y-3 sm:space-y-4">
        <Label className="text-base sm:text-lg font-semibold">
          Tipo de produto
        </Label>
        
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = data.category === cat.value;
            return (
              <Card
                key={cat.value}
                onClick={() => updateData({ category: cat.value })}
                className={cn(
                  "p-2.5 sm:p-4 cursor-pointer transition-all active:scale-[0.98]",
                  isSelected 
                    ? `${cat.bgColor} ${cat.borderColor} border-2 shadow-md` 
                    : "hover:border-primary/30"
                )}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className={cn(
                    "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0",
                    isSelected ? cat.bgColor : "bg-muted"
                  )}>
                    <Icon className={cn("w-4 h-4 sm:w-5 sm:h-5", cat.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-medium">{cat.label}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1 hidden sm:block">
                      {cat.description}
                    </p>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Categoria do Suplemento - só aparece se for vitamina ou suplemento */}
      {(data.category === 'vitamina' || data.category === 'suplemento') && (
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Label className="text-sm sm:text-base font-semibold">
              Para que você usa?
            </Label>
            <Badge variant="outline" className="text-[10px] sm:text-xs">Opcional</Badge>
          </div>
          
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
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
                  className={cn(
                    "h-8 sm:h-9 py-1.5 px-2.5 sm:px-3 gap-1.5 text-xs sm:text-sm transition-all",
                    isSelected && "ring-2 ring-primary ring-offset-1"
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", isSelected ? "text-primary-foreground" : cat.color)} />
                  <span>{cat.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Observações - Compacto */}
      <div className="space-y-2 sm:space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm sm:text-base font-medium">
            Observação <span className="text-muted-foreground font-normal">(opcional)</span>
          </Label>
          <span className="text-[10px] sm:text-xs text-muted-foreground">
            {data.notes.length}/200
          </span>
        </div>
        <Textarea
          placeholder="Ex: Tomar com água..."
          value={data.notes}
          onChange={(e) => updateData({ notes: e.target.value.slice(0, 200) })}
          rows={2}
          className="resize-none text-sm min-h-[60px]"
        />
      </div>
    </div>
  );
}