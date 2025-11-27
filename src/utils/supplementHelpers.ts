// Supplement usage information and timing helpers

export type SupplementTag = 
  | "Energia" 
  | "Sono" 
  | "Imunidade" 
  | "Performance" 
  | "GLP-1 Support" 
  | "Pós-bariátrico"
  | "Hidratação"
  | "Digestão";

export interface SupplementInfo {
  bestTime: string;
  rationale: string;
  tips: string[];
  tags?: SupplementTag[];
}

export function isSupplement(category?: string | null, name?: string): boolean {
  if (!category && !name) return false;
  
  const cat = category?.toLowerCase() || "";
  const itemName = name?.toLowerCase() || "";
  
  if (cat === "vitamina" || cat === "suplemento") return true;
  
  const supplementPatterns = [
    "vitamina", "creatina", "whey", "bcaa", "omega", "ômega",
    "magnésio", "ferro", "zinco", "calcio", "cálcio",
    "probiótico", "melatonina", "valeriana", "multivitamínico",
    "colágeno", "glutamina", "proteína"
  ];
  
  return supplementPatterns.some(pattern => itemName.includes(pattern));
}

export function getSupplementTags(supplementName: string): SupplementTag[] {
  const name = supplementName.toLowerCase();
  const tags: SupplementTag[] = [];
  
  if (name.includes('creatina') || name.includes('creatine') || name.includes('whey') || name.includes('bcaa')) {
    tags.push("Performance", "Energia");
  }
  if (name.includes('vitamina d') || name.includes('vitamin d') || name.includes('vitamina c') || name.includes('zinco')) {
    tags.push("Imunidade");
  }
  if (name.includes('vitamina b') || name.includes('b12') || name.includes('complexo b') || name.includes('ferro')) {
    tags.push("Energia");
  }
  if (name.includes('melatonina') || name.includes('magnésio') || name.includes('valeriana')) {
    tags.push("Sono");
  }
  if (name.includes('multivitamínico') || name.includes('pos-baria') || name.includes('pós-baria')) {
    tags.push("Pós-bariátrico");
  }
  if (name.includes('probiótico')) {
    tags.push("Digestão", "Imunidade");
  }
  
  return tags;
}

export function getSupplementUsageInfo(supplementName: string, category: string): SupplementInfo | null {
  const name = supplementName.toLowerCase();
  const tags = getSupplementTags(supplementName);
  
  // Performance supplements
  if (name.includes('creatina') || name.includes('creatine')) {
    return {
      bestTime: 'Pós-treino ou manhã',
      rationale: 'A creatina pode ser tomada a qualquer hora, mas pós-treino facilita a absorção muscular.',
      tips: ['Beba bastante água', 'Pode misturar com suco ou shake', 'Consistência é mais importante que horário'],
      tags
    };
  }
  
  if (name.includes('whey') || name.includes('proteína')) {
    return {
      bestTime: 'Pós-treino ou café da manhã',
      rationale: 'Proteína é melhor absorvida após exercício, quando os músculos precisam de recuperação.',
      tips: ['Misture bem com líquido', 'Ideal dentro de 1h após treino', 'Pode substituir uma refeição'],
      tags
    };
  }

  // Vitamins
  if (name.includes('vitamina d') || name.includes('vitamin d')) {
    return {
      bestTime: 'Pela manhã com alimento',
      rationale: 'Vitamina D é lipossolúvel e absorve melhor com gordura. Manhã evita interferir no sono.',
      tips: ['Tome com refeição que contenha gordura', 'Exposição ao sol também ajuda', 'Consistência diária é essencial'],
      tags
    };
  }

  if (name.includes('vitamina b') || name.includes('b12') || name.includes('complexo b')) {
    return {
      bestTime: 'Pela manhã',
      rationale: 'Vitaminas do complexo B aumentam energia e são melhor aproveitadas no início do dia.',
      tips: ['Tome em jejum ou com café da manhã', 'Evite à noite (pode atrapalhar o sono)', 'Melhora disposição diurna'],
      tags
    };
  }

  if (name.includes('ferro') || name.includes('sulfato ferroso')) {
    return {
      bestTime: 'Em jejum ou longe das refeições',
      rationale: 'Ferro absorve melhor sem interferência de outros alimentos, especialmente cálcio.',
      tips: ['Tome com suco de laranja (vitamina C ajuda)', 'Evite tomar com leite ou café', 'Pode causar desconforto estomacal'],
      tags
    };
  }

  if (name.includes('ômega') || name.includes('omega') || name.includes('óleo de peixe')) {
    return {
      bestTime: 'Durante refeições principais',
      rationale: 'Ômega-3 é gordura e absorve melhor quando tomado com alimentos.',
      tips: ['Tome com almoço ou jantar', 'Melhora absorção', 'Pode reduzir "gosto de peixe"'],
      tags
    };
  }

  // Sleep supplements
  if (name.includes('melatonina') || name.includes('melatonin')) {
    return {
      bestTime: '30-60 minutos antes de dormir',
      rationale: 'Melatonina regula o ciclo do sono e deve ser tomada próxima ao horário de deitar.',
      tips: ['Diminua luz do ambiente', 'Evite telas após tomar', 'Tome no mesmo horário sempre'],
      tags
    };
  }

  if (name.includes('magnésio') || name.includes('magnesium')) {
    return {
      bestTime: 'Antes de dormir',
      rationale: 'Magnésio tem efeito relaxante e ajuda na qualidade do sono.',
      tips: ['Melhora relaxamento muscular', 'Pode ajudar com câimbras', 'Tome com água'],
      tags
    };
  }

  // Generic supplement
  if (category === 'suplemento') {
    return {
      bestTime: 'Conforme orientação médica',
      rationale: 'Cada suplemento tem características específicas de absorção.',
      tips: ['Consulte bula ou profissional', 'Mantenha horário regular', 'Acompanhe os resultados'],
      tags
    };
  }

  return null;
}

// GLP-1 detection
export function isGLP1Medication(name: string, notes?: string | null): boolean {
  const text = `${name} ${notes || ""}`.toLowerCase();
  const glp1Patterns = ["ozempic", "mounjaro", "wegovy", "saxenda", "victoza", "trulicity", "semaglutida", "liraglutida", "dulaglutida", "tirzepatida"];
  return glp1Patterns.some(pattern => text.includes(pattern));
}

// Bariatric detection
export function isBariatricRelated(name: string, notes?: string | null): boolean {
  const text = `${name} ${notes || ""}`.toLowerCase();
  const bariatricPatterns = ["bariátric", "bariatric", "pós-cirúrgic", "pos-cirurgic", "cirurgia bariátrica"];
  return bariatricPatterns.some(pattern => text.includes(pattern));
}

export function getPersonalizedTips(userType?: 'glp1' | 'bariatric'): string[] {
  if (userType === 'glp1') {
    return [
      'Hidrate-se muito (mínimo 2L água/dia)',
      'Refeições menores e mais frequentes',
      'Evite alimentos gordurosos',
      'Náuseas são comuns no início'
    ];
  }

  if (userType === 'bariatric') {
    return [
      'Foco em proteína: 60-80g/dia',
      'Hidratação entre refeições (não durante)',
      '5-6 refeições pequenas por dia',
      'Evite açúcar e gorduras',
      'Suplementação é essencial'
    ];
  }

  return [];
}
