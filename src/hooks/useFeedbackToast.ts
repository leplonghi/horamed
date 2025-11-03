import { toast } from "sonner";

type FeedbackType = 
  | "dose-taken"
  | "dose-skipped"
  | "dose-snoozed"
  | "streak-achieved"
  | "medication-added"
  | "document-uploaded"
  | "reminder-set";

interface FeedbackOptions {
  medicationName?: string;
  streakDays?: number;
  customMessage?: string;
}

export const useFeedbackToast = () => {
  const showFeedback = (type: FeedbackType, options?: FeedbackOptions) => {
    const messages = {
      "dose-taken": {
        title: "✅ Boa!",
        description: options?.medicationName 
          ? `${options.medicationName} tomado com sucesso.`
          : "Dose marcada como tomada!",
      },
      "dose-skipped": {
        title: "⚠️ Dose pulada",
        description: "Retome amanhã. Sua saúde é importante!",
      },
      "dose-snoozed": {
        title: "⏰ Lembrete adiado",
        description: "Vamos te lembrar em 15 minutos.",
      },
      "streak-achieved": {
        title: `🔥 ${options?.streakDays || 7} dias seguidos!`,
        description: "Continue assim! Você está no caminho certo.",
      },
      "medication-added": {
        title: "🎉 Medicamento adicionado!",
        description: options?.medicationName
          ? `${options.medicationName} foi adicionado à sua rotina.`
          : "Novo medicamento adicionado à sua rotina.",
      },
      "document-uploaded": {
        title: "📄 Documento salvo",
        description: "Seu documento foi guardado com segurança no Cofre.",
      },
      "reminder-set": {
        title: "🔔 Lembrete configurado",
        description: "Você receberá notificações nos horários definidos.",
      },
    };

    const message = messages[type];

    if (options?.customMessage) {
      toast.success(options.customMessage);
    } else {
      toast.success(message.title, {
        description: message.description,
      });
    }
  };

  return { showFeedback };
};
