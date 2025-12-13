/**
 * HoraMed — Microcopy Oficial
 * Fonte única de verdade para linguagem do app
 * Versão: 1.0
 */

export const microcopy = {
  brand: {
    tagline: "Sua rotina de saúde, sem esquecimentos.",
    toneNote:
      "Linguagem empática, profissional e calma. Nunca julgar, nunca culpar."
  },

  onboarding: {
    welcomeTitle: "Vamos começar com o básico",
    welcomeSubtitle: "Em poucos passos, sua rotina fica mais organizada.",

    usageQuestion: "Como você quer usar o HoraMed?",

    usageOptions: {
      self: {
        title: "Para mim",
        description: "Vitaminas, suplementos e rotina diária"
      },
      other: {
        title: "Para outra pessoa",
        description: "Medicamentos e acompanhamento diário"
      }
    }
  },

  profile: {
    createTitle: "Quem você quer acompanhar?",
    createHelper:
      "Você pode criar perfis para você ou para alguém que você cuida.",

    nameLabel: "Nome (como você chama no dia a dia)",
    relationshipLabel: "Relação"
  },

  item: {
    addTitle: "O que faz parte da sua rotina de saúde?",
    nameLabel: "Nome",
    nameHelper: "Use um nome fácil de reconhecer no dia a dia.",

    categoryLabel: "Tipo",
    categoryHelper:
      "Isso ajuda o app a organizar melhor sua rotina.",

    categories: {
      medication: "Medicamento",
      vitamin: "Vitamina",
      supplement: "Suplemento",
      other: "Outro"
    }
  },

  schedule: {
    title: "Quando isso costuma fazer parte do seu dia?",
    timeLabel: "Horário",
    addAnother: "Adicionar outro horário"
  },

  dose: {
    notificationSelf: "É hora da sua dose.",
    notificationOther: (name: string) =>
      `Hora do medicamento de ${name}.`,

    confirmButton: "Confirmar dose",

    registered:
      "Dose registrada. Obrigado por confirmar.",

    notRegistered:
      "Essa dose ainda não foi registrada.",

    skippedFeedback:
      "Tudo bem. O importante é manter o acompanhamento.",

    actions: {
      confirmNow: "Confirmar agora",
      markSkipped: "Marcar como pulada"
    }
  },

  plan: {
    freeLimitReached:
      "Você chegou ao limite do plano gratuito.\n\nO plano Premium permite acompanhar toda a sua rotina sem restrições.",

    premiumTitle:
      "Sua rotina de saúde merece constância.",

    premiumSubtitle:
      "Com o Premium, você acompanha tudo com mais tranquilidade.",

    ctaUpgrade: "Conhecer o Premium"
  },

  feedback: {
    genericError:
      "Algo não saiu como esperado. Tente novamente em instantes.",

    loading:
      "Carregando informações…"
  },

  notifications: {
    gentleReminder:
      "Você pode confirmar a dose agora.",

    dailySummary:
      "Acompanhamento do dia atualizado."
  },

  ai: {
    disclaimer:
      "Posso explicar de forma simples, mas isso não substitui a orientação de um profissional de saúde.",

    fallback:
      "Posso ajudar explicando melhor ou organizando sua rotina."
  }
};

export type Microcopy = typeof microcopy;
