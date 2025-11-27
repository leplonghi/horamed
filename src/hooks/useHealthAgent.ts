import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Intent types
type Intent = 
  | 'MEDICATION_INTENT'
  | 'STOCK_INTENT'
  | 'DOCUMENT_INTENT'
  | 'GLP1_INTENT'
  | 'BARIATRIC_INTENT'
  | 'NAVIGATION_INTENT'
  | 'INSIGHT_INTENT'
  | 'GENERIC_INTENT';

type PersonaType = 'elderly' | 'young' | 'bariatric' | 'athlete' | 'default';

interface UserContext {
  age?: number;
  personaType: PersonaType;
  activeMedications: any[];
  stockData: any[];
  documents: any[];
  planType: 'free' | 'premium';
  aiUsageToday: number;
}

export function useHealthAgent() {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  // Classify message intent
  const classifyIntent = (message: string): Intent => {
    const msg = message.toLowerCase();

    // GLP-1 keywords
    if (msg.includes('ozempic') || msg.includes('mounjaro') || msg.includes('semaglutida') || 
        msg.includes('glp-1') || msg.includes('glp1') || msg.includes('tireoide') ||
        msg.includes('aplicação') || msg.includes('caneta')) {
      return 'GLP1_INTENT';
    }

    // Bariatric keywords
    if (msg.includes('bariátrica') || msg.includes('bariatrica') || msg.includes('cirurgia') ||
        msg.includes('proteína') || msg.includes('proteina') || msg.includes('náusea') ||
        msg.includes('bypass') || msg.includes('gastrectomia')) {
      return 'BARIATRIC_INTENT';
    }

    // Stock keywords
    if (msg.includes('estoque') || msg.includes('acabar') || msg.includes('comprar') ||
        msg.includes('farmácia') || msg.includes('farmacia') || msg.includes('falta') ||
        msg.includes('quanto tempo') || msg.includes('dias restantes')) {
      return 'STOCK_INTENT';
    }

    // Document keywords
    if (msg.includes('receita') || msg.includes('exame') || msg.includes('carteira') ||
        msg.includes('documento') || msg.includes('pdf') || msg.includes('validade') ||
        msg.includes('resultado')) {
      return 'DOCUMENT_INTENT';
    }

    // Medication keywords
    if (msg.includes('medicamento') || msg.includes('remédio') || msg.includes('remedio') ||
        msg.includes('dose') || msg.includes('horário') || msg.includes('horario') ||
        msg.includes('tomar') || msg.includes('suplemento') || msg.includes('vitamina')) {
      return 'MEDICATION_INTENT';
    }

    // Navigation keywords
    if (msg.includes('como faço') || msg.includes('onde') || msg.includes('encontrar') ||
        msg.includes('adicionar') || msg.includes('ver') || msg.includes('página') ||
        msg.includes('pagina') || msg.includes('menu')) {
      return 'NAVIGATION_INTENT';
    }

    // Insight keywords
    if (msg.includes('insight') || msg.includes('análise') || msg.includes('analise') ||
        msg.includes('progresso') || msg.includes('relatório') || msg.includes('relatorio') ||
        msg.includes('estatística') || msg.includes('estatistica')) {
      return 'INSIGHT_INTENT';
    }

    return 'GENERIC_INTENT';
  };

  // Build system prompt based on intent and persona
  const buildSystemPrompt = (intent: Intent, persona: PersonaType, context: UserContext): string => {
    const basePrompt = `Você é o HoraMed Health Agent, um assistente de saúde especializado em organização de rotinas, medicamentos, suplementos e documentos de saúde.

REGRAS GLOBAIS:
- Sempre responda em português brasileiro natural e humano
- Nunca prescreva medicamentos
- Seja acolhedor, empático e simples
- Foque em organização, educação e segurança
- Use frases curtas e diretas

PERSONA DO USUÁRIO: ${persona}`;

    let personaGuidance = '';
    switch (persona) {
      case 'elderly':
        personaGuidance = '\n- Use frases MUITO curtas\n- Passos simples\n- Ritmo calmo\n- Evite termos técnicos\n- Seja extremamente paciente';
        break;
      case 'young':
        personaGuidance = '\n- Resposta rápida e direta\n- Poucas frases\n- Motivacional\n- Emoji ocasional';
        break;
      case 'bariatric':
        personaGuidance = '\n- Foco em rotina + hidratação + proteínas\n- Cuidado com GLP-1\n- Zero julgamento\n- Reforçar refeições pequenas';
        break;
      case 'athlete':
        personaGuidance = '\n- Foco em performance + segurança\n- Horários otimizados\n- Interações medicamentosas';
        break;
      default:
        personaGuidance = '\n- Tom neutro e acolhedor\n- Direto ao ponto';
    }

    let intentGuidance = '';
    switch (intent) {
      case 'MEDICATION_INTENT':
        intentGuidance = `\n\nTAREFA: Organizar medicamentos e horários
- Organize doses por horário
- Sugira rotina mais simples
- Explique como tomar ("com comida", "em jejum")
- Identifique possíveis conflitos
- Ajude a reorganizar quando solicitado

MEDICAMENTOS ATIVOS: ${context.activeMedications.length > 0 ? context.activeMedications.map(m => m.name).join(', ') : 'Nenhum ainda'}`;
        break;

      case 'STOCK_INTENT':
        intentGuidance = `\n\nTAREFA: Prever estoque e sugerir compra
- Calcule dias restantes com base no estoque
- Sugira melhor dia para comprar
- Frases modelo: "Seu estoque dura cerca de X dias" / "O ideal é comprar até [dia] para evitar falhas"

ESTOQUE ATUAL: ${context.stockData.length > 0 ? context.stockData.map(s => `${s.item_name}: ${s.units_left} unidades`).join(', ') : 'Sem dados de estoque'}`;
        break;

      case 'DOCUMENT_INTENT':
        intentGuidance = `\n\nTAREFA: Interpretar documentos da Carteira de Saúde
- Extrair validade, tipo, conteúdo
- Sugerir ações ("quer gerar um lembrete?")
- Ajudar a organizar documentos

DOCUMENTOS: ${context.documents.length} documentos na Carteira de Saúde`;
        break;

      case 'GLP1_INTENT':
        intentGuidance = `\n\nTAREFA: Orientar sobre GLP-1 (Ozempic/Mounjaro)
- Cuidados com aplicação semanal
- Hidratação e náuseas
- Hábitos compatíveis
- Tom orientativo, NUNCA prescritivo
- Lembrar: "Sempre siga orientação do seu médico"`;
        break;

      case 'BARIATRIC_INTENT':
        intentGuidance = `\n\nTAREFA: Apoiar rotina pós-bariátrica
- Reforçar proteína, hidratação
- Lembretes de refeições pequenas
- Organizar rotina pós-op levemente
- Tom de apoio, zero julgamento`;
        break;

      case 'NAVIGATION_INTENT':
        intentGuidance = `\n\nTAREFA: Ajudar a navegar no app
- Explicar onde encontrar cada recurso
- Guiar passo a passo
- Oferecer abrir a página diretamente quando apropriado
- Páginas principais:
  • Hoje (/hoje) - doses do dia e timeline
  • Rotina (/rotina) - medicamentos e suplementos
  • Progresso (/progresso) - métricas e relatórios
  • Carteira de Saúde (/carteira-saude) - documentos organizados
  • Perfil (/perfil) - conta e configurações
- Para ações específicas:
  • Ver estoque: "Vá em Rotina e toque no medicamento"
  • Adicionar medicamento: "Use o botão + na aba Rotina"
  • Ver documentos: "Abra a aba Carteira de Saúde"
  • Indicar amigos: "Vá em Perfil > Indique e Ganhe"
- Sempre ofereça ajuda adicional após guiar`;
        break;

      case 'INSIGHT_INTENT':
        intentGuidance = `\n\nTAREFA: Trazer insights de saúde
- Analisar padrões de adesão
- Identificar horários com mais atrasos
- Celebrar conquistas
- Sugerir melhorias
- Exemplo: "Você tomou 86% das doses este mês" / "Identifiquei atrasos após o almoço"`;
        break;

      case 'GENERIC_INTENT':
        intentGuidance = `\n\nTAREFA: Acolhimento e ajuda geral
- Seja amigável e acolhedor
- Pergunte como pode ajudar
- Direcione para recursos do app
- Ofereça exemplos do que pode fazer`;
        break;
    }

    return basePrompt + personaGuidance + intentGuidance;
  };

  // Check AI usage limit
  const checkUsageLimit = async (): Promise<{ allowed: boolean; usageCount: number }> => {
    if (!user) return { allowed: false, usageCount: 0 };

    // Get subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan_type, status')
      .eq('user_id', user.id)
      .single();

    // Premium has unlimited usage
    if (subscription?.plan_type === 'premium' && subscription?.status === 'active') {
      return { allowed: true, usageCount: 0 };
    }

    // Free users: check daily limit (2/day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from('app_metrics')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('event_name', 'ai_agent_query')
      .gte('created_at', today.toISOString());

    const usageCount = count || 0;

    if (usageCount >= 2) {
      return { allowed: false, usageCount };
    }

    return { allowed: true, usageCount };
  };

  // Log AI usage
  const logUsage = async () => {
    if (!user) return;

    await supabase
      .from('app_metrics')
      .insert({
        user_id: user.id,
        event_name: 'ai_agent_query',
        event_data: { timestamp: new Date().toISOString() }
      });
  };

  // Get user context
  const getUserContext = async (): Promise<UserContext> => {
    if (!user) {
      return {
        personaType: 'default',
        activeMedications: [],
        stockData: [],
        documents: [],
        planType: 'free',
        aiUsageToday: 0
      };
    }

    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('birth_date')
      .eq('user_id', user.id)
      .single();

    const age = profile?.birth_date 
      ? new Date().getFullYear() - new Date(profile.birth_date).getFullYear()
      : undefined;

    // Determine persona
    let personaType: PersonaType = 'default';
    if (age && age >= 65) personaType = 'elderly';
    else if (age && age >= 18 && age < 35) personaType = 'young';

    // Get active medications
    const { data: medications } = await supabase
      .from('items')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    // Get stock data
    const { data: stock } = await supabase
      .from('stock')
      .select(`
        *,
        items:item_id (
          name
        )
      `)
      .not('item_id', 'is', null);

    const stockData = stock?.map(s => ({
      ...s,
      item_name: (s.items as any)?.name || 'Desconhecido'
    })) || [];

    // Get documents count
    const { count: docCount } = await supabase
      .from('documentos_saude')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Get subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan_type, status')
      .eq('user_id', user.id)
      .single();

    const planType = subscription?.plan_type === 'premium' && subscription?.status === 'active'
      ? 'premium'
      : 'free';

    // Get today's usage
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count: usageCount } = await supabase
      .from('app_metrics')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('event_name', 'ai_agent_query')
      .gte('created_at', today.toISOString());

    return {
      age,
      personaType,
      activeMedications: medications || [],
      stockData,
      documents: Array(docCount || 0).fill(null),
      planType,
      aiUsageToday: usageCount || 0
    };
  };

  // Process query
  const processQuery = async (message: string): Promise<string | { limitReached: true }> => {
    if (!user) {
      return 'Por favor, faça login para usar o assistente.';
    }

    setIsProcessing(true);

    try {
      // Check usage limit
      const { allowed, usageCount } = await checkUsageLimit();
      if (!allowed) {
        setIsProcessing(false);
        return { limitReached: true };
      }

      // Get context
      const context = await getUserContext();

      // Classify intent
      const intent = classifyIntent(message);

      // Build system prompt
      const systemPrompt = buildSystemPrompt(intent, context.personaType, context);

      // Call AI via edge function
      const { data, error } = await supabase.functions.invoke('health-assistant', {
        body: {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ]
        }
      });

      if (error) throw error;

      // Log usage
      await logUsage();

      setIsProcessing(false);
      
      // Check for navigation commands in response
      const response = data?.response || 'Desculpe, não consegui processar sua solicitação.';
      
      return response;

    } catch (error) {
      console.error('Health agent error:', error);
      setIsProcessing(false);
      toast.error('Erro ao processar solicitação');
      return 'Desculpe, ocorreu um erro. Tente novamente.';
    }
  };

  return {
    processQuery,
    isProcessing
  };
}
