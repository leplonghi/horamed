import { Badge } from "@/components/ui/badge";
import { Zap, Moon, Dumbbell, Brain, Heart, Leaf, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type SupplementCategory = 
  | 'energia' 
  | 'sono' 
  | 'performance' 
  | 'foco' 
  | 'imunidade' 
  | 'beleza' 
  | 'geral';

interface SupplementCategoryTagProps {
  category: SupplementCategory;
  size?: 'sm' | 'md';
}

const categoryConfig: Record<SupplementCategory, { 
  label: string; 
  icon: any; 
  className: string;
}> = {
  energia: {
    label: 'Energia',
    icon: Zap,
    className: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  },
  sono: {
    label: 'Sono',
    icon: Moon,
    className: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800',
  },
  performance: {
    label: 'Performance',
    icon: Dumbbell,
    className: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800',
  },
  foco: {
    label: 'Foco',
    icon: Brain,
    className: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800',
  },
  imunidade: {
    label: 'Imunidade',
    icon: Heart,
    className: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  },
  beleza: {
    label: 'Beleza',
    icon: Sparkles,
    className: 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-400 dark:border-pink-800',
  },
  geral: {
    label: 'Geral',
    icon: Leaf,
    className: 'bg-lime-100 text-lime-700 border-lime-200 dark:bg-lime-900/30 dark:text-lime-400 dark:border-lime-800',
  },
};

// Detectar categoria baseado no nome do suplemento
export function detectSupplementCategory(name: string): SupplementCategory {
  const nameLower = name.toLowerCase();
  
  // Energia
  if (nameLower.includes('cafeína') || nameLower.includes('guaraná') || nameLower.includes('b12') || 
      nameLower.includes('coq10') || nameLower.includes('ferro') || nameLower.includes('energy')) {
    return 'energia';
  }
  
  // Sono
  if (nameLower.includes('melatonina') || nameLower.includes('magnésio') || nameLower.includes('valeriana') ||
      nameLower.includes('camomila') || nameLower.includes('gaba') || nameLower.includes('sono')) {
    return 'sono';
  }
  
  // Performance
  if (nameLower.includes('creatina') || nameLower.includes('whey') || nameLower.includes('bcaa') ||
      nameLower.includes('proteína') || nameLower.includes('pré-treino') || nameLower.includes('beta-alanina')) {
    return 'performance';
  }
  
  // Foco
  if (nameLower.includes('ômega') || nameLower.includes('omega') || nameLower.includes('dha') ||
      nameLower.includes('ginkgo') || nameLower.includes('fosfatidil') || nameLower.includes('nootropic')) {
    return 'foco';
  }
  
  // Imunidade
  if (nameLower.includes('vitamina c') || nameLower.includes('zinco') || nameLower.includes('própolis') ||
      nameLower.includes('equinácea') || nameLower.includes('imun')) {
    return 'imunidade';
  }
  
  // Beleza
  if (nameLower.includes('colágeno') || nameLower.includes('biotina') || nameLower.includes('cabelo') ||
      nameLower.includes('unha') || nameLower.includes('pele') || nameLower.includes('ácido hialurônico')) {
    return 'beleza';
  }
  
  return 'geral';
}

export default function SupplementCategoryTag({ category, size = 'sm' }: SupplementCategoryTagProps) {
  const config = categoryConfig[category];
  const Icon = config.icon;
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "gap-1 font-medium border",
        config.className,
        size === 'sm' ? 'text-[10px] px-1.5 py-0' : 'text-xs px-2 py-0.5'
      )}
    >
      <Icon className={cn(size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3')} />
      {config.label}
    </Badge>
  );
}
