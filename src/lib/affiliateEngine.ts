// Affiliate recommendation engine
// This is a simple implementation that returns contextual product recommendations

interface AffiliateProduct {
  name: string;
  description: string;
  url?: string;
  source?: string;
}

interface RecommendationContext {
  type: "MEDICATION_LIST" | "DETAIL_PAGE" | "EXAM_VIEW" | "AI_QUERY";
  hasSupplements?: boolean;
  tags?: string[];
  examTags?: string[];
  text?: string;
}

const SAMPLE_PRODUCTS: Record<string, AffiliateProduct[]> = {
  vitamina_d: [
    {
      name: "Vitamina D3 2000UI",
      description: "Suplemento de vitamina D3 para suporte imunológico e saúde óssea",
      url: "https://example.com/vitamina-d",
      source: "Recomendação automática"
    }
  ],
  b12: [
    {
      name: "Vitamina B12 Metilcobalamina",
      description: "B12 de alta absorção para energia e saúde cerebral",
      url: "https://example.com/b12",
      source: "Recomendação automática"
    }
  ],
  ferro: [
    {
      name: "Ferro Quelado 30mg",
      description: "Ferro de alta biodisponibilidade com baixa irritação gástrica",
      url: "https://example.com/ferro",
      source: "Recomendação automática"
    }
  ],
  omega: [
    {
      name: "Ômega 3 1000mg",
      description: "Óleo de peixe purificado para saúde cardiovascular e cerebral",
      url: "https://example.com/omega3",
      source: "Recomendação automática"
    }
  ],
  performance: [
    {
      name: "Creatina Monohidratada 300g",
      description: "Creatina pura para performance e ganho de massa muscular",
      url: "https://example.com/creatina",
      source: "Recomendação automática"
    }
  ],
  energy: [
    {
      name: "Complexo B de Alto Potência",
      description: "Vitaminas B para energia e metabolismo saudável",
      url: "https://example.com/complexo-b",
      source: "Recomendação automática"
    }
  ],
  sleep: [
    {
      name: "Magnésio Treonato 500mg",
      description: "Magnésio para relaxamento e qualidade do sono",
      url: "https://example.com/magnesio",
      source: "Recomendação automática"
    }
  ],
  bariatric: [
    {
      name: "Multivitamínico Pós-Bariátrico",
      description: "Fórmula completa de vitaminas e minerais para pós-cirurgia bariátrica",
      url: "https://example.com/multi-bariatrico",
      source: "Recomendação automática"
    }
  ],
  glp1: [
    {
      name: "Probiótico Digestivo Premium",
      description: "Suporte digestivo e hidratação para usuários de GLP-1",
      url: "https://example.com/probiotico",
      source: "Recomendação automática"
    }
  ]
};

const DISMISSAL_STORAGE_KEY = "affiliate_dismissals";
const DISMISSAL_DURATION = 48 * 60 * 60 * 1000; // 48 hours

function getDismissals(): Record<string, number> {
  try {
    const stored = localStorage.getItem(DISMISSAL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function setDismissal(context: string) {
  const dismissals = getDismissals();
  dismissals[context] = Date.now();
  localStorage.setItem(DISMISSAL_STORAGE_KEY, JSON.stringify(dismissals));
}

function isDismissed(context: string): boolean {
  const dismissals = getDismissals();
  const dismissedAt = dismissals[context];
  if (!dismissedAt) return false;
  return Date.now() - dismissedAt < DISMISSAL_DURATION;
}

export function getRecommendations(context: RecommendationContext): AffiliateProduct | null {
  // Check if dismissed
  if (isDismissed(context.type)) {
    return null;
  }

  // Match recommendations based on context
  switch (context.type) {
    case "MEDICATION_LIST":
      if (context.hasSupplements) {
        return SAMPLE_PRODUCTS.energy[0];
      }
      return null;

    case "DETAIL_PAGE":
      if (context.tags?.includes("Energia")) {
        return SAMPLE_PRODUCTS.energy[0];
      }
      if (context.tags?.includes("Sono")) {
        return SAMPLE_PRODUCTS.sleep[0];
      }
      if (context.tags?.includes("Performance")) {
        return SAMPLE_PRODUCTS.performance[0];
      }
      if (context.tags?.includes("GLP-1 Support")) {
        return SAMPLE_PRODUCTS.glp1[0];
      }
      if (context.tags?.includes("Pós-bariátrico")) {
        return SAMPLE_PRODUCTS.bariatric[0];
      }
      return null;

    case "EXAM_VIEW":
      if (context.examTags?.includes("vitamina_d_baixa")) {
        return SAMPLE_PRODUCTS.vitamina_d[0];
      }
      if (context.examTags?.includes("b12_baixa")) {
        return SAMPLE_PRODUCTS.b12[0];
      }
      if (context.examTags?.includes("ferro_baixo")) {
        return SAMPLE_PRODUCTS.ferro[0];
      }
      return null;

    case "AI_QUERY":
      const text = context.text?.toLowerCase() || "";
      if (text.includes("treino") || text.includes("performance") || text.includes("academia")) {
        return SAMPLE_PRODUCTS.performance[0];
      }
      if (text.includes("sono") || text.includes("dormir")) {
        return SAMPLE_PRODUCTS.sleep[0];
      }
      if (text.includes("energia") || text.includes("disposição")) {
        return SAMPLE_PRODUCTS.energy[0];
      }
      if (text.includes("glp-1") || text.includes("ozempic") || text.includes("mounjaro")) {
        return SAMPLE_PRODUCTS.glp1[0];
      }
      if (text.includes("bariátric")) {
        return SAMPLE_PRODUCTS.bariatric[0];
      }
      return null;

    default:
      return null;
  }
}

export function dismissRecommendation(context: string) {
  setDismissal(context);
}
