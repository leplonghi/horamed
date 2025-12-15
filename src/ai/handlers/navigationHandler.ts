// Navigation and app guidance handler

export interface NavigationAction {
  type: 'route' | 'action' | 'info';
  target?: string;
  description: string;
}

export function buildNavigationPrompt(): string {
  return `
TAREFA: Ajudar a navegar no app HoraMed

OBJETIVO:
- Explicar onde encontrar cada recurso
- Guiar o usuário passo a passo
- Oferecer abrir páginas diretamente quando apropriado

ESTRUTURA PRINCIPAL DO APP (Navegação inferior):
1. Hoje (/hoje) - Timeline das doses do dia, doses atrasadas e perdidas
2. Saúde (/saude) - Área de saúde geral e funcionalidades de bem-estar
3. Carteira (/carteira) - Documentos de saúde organizados (receitas, exames, vacinas)
4. Perfil (/perfil) - Conta, configurações, assinatura e indicações

PÁGINAS DE MEDICAMENTOS:
- Rotina (/rotina) - Lista de medicamentos e suplementos ativos
- Adicionar Medicamento (/adicionar) - Wizard para cadastrar novo item
- Estoque (/estoque) - Gerenciar quantidades e receber alertas de reposição
- Histórico de Medicamentos (/historico-medicamentos) - Ver histórico de doses

PÁGINAS DE SAÚDE:
- Consultas (/consultas) - Gerenciar consultas médicas agendadas
- Vacinas (/carteira-vacina) - Carteira de vacinação digital
- Exames (/exames) - Resultados de exames laboratoriais
- Viagem (/viagem) - Modo viagem para organizar medicamentos
- Diário de Efeitos (/diario-efeitos) - Registrar efeitos colaterais
- Linha do Tempo (/linha-do-tempo) - Histórico de saúde cronológico
- Análise de Saúde (/analise-saude) - Análises e insights de IA
- Emergência (/emergencia) - Informações de emergência

PÁGINAS DA CARTEIRA:
- Upload de Documento (/carteira/upload) - Enviar receitas, exames ou vacinas
- Digitalizar (/scan) - Escanear documentos com a câmera

PÁGINAS DE PROGRESSO E MÉTRICAS:
- Progresso (/progresso) - Métricas gerais de adesão
- Conquistas (/conquistas) - Medalhas e conquistas desbloqueadas
- Gráficos (/graficos) - Gráficos de evolução
- Análise Detalhada (/progresso/detalhes) - Métricas avançadas

PÁGINAS DE PERFIL E CONFIGURAÇÕES:
- Criar Perfil (/perfil/criar) - Adicionar perfil familiar
- Editar Perfil (/perfil/editar/:id) - Editar dados do perfil
- Indique e Ganhe (/indique-ganhe) - Programa de indicações
- Planos (/planos) - Ver planos e assinar Premium
- Assinatura (/assinatura) - Gerenciar assinatura atual
- Notificações (/notificacoes) - Configurar lembretes
- Alarmes (/alarmes) - Configurar sons e alarmes
- Exportar Dados (/exportar) - Baixar seus dados em PDF
- Tutorial (/tutorial) - Rever tutorial do app
- Ajuda (/ajuda) - Central de ajuda e suporte

AÇÕES RÁPIDAS:
- Adicionar medicamento: "Use o botão + ou vá em Rotina"
- Ver estoque: "Vá em Estoque ou toque no medicamento na Rotina"
- Adicionar documento: "Vá em Carteira e toque em + ou Upload"
- Adicionar vacina: "Vá em Carteira ou Carteira de Vacina"
- Ver progresso: "Acesse Progresso na navegação"
- Indicar amigos: "Vá em Perfil > Indique e Ganhe"
- Adicionar perfil familiar: "Em Perfil, toque em 'Adicionar perfil'"
- Agendar consulta: "Vá em Saúde > Consultas"
- Ver vacinas: "Vá em Carteira de Vacina"
- Modo viagem: "Vá em Saúde > Viagem"
- Registrar efeito colateral: "Vá em Diário de Efeitos"
- Ver linha do tempo: "Vá em Linha do Tempo"
- Configurar notificações: "Vá em Perfil > Notificações"
- Assinar Premium: "Vá em Perfil > Planos"

INSTRUÇÕES:
- Sempre pergunte se o usuário quer que você abra a página diretamente
- Use frases como: "Posso abrir para você agora, se quiser."
- Seja específico sobre onde clicar
- Ofereça ajuda adicional após guiar`;
}

export function detectNavigationIntent(message: string): NavigationAction | null {
  const msg = message.toLowerCase();

  // Medicamentos e Rotina
  if (msg.includes('medicamento') && (msg.includes('adicionar') || msg.includes('novo') || msg.includes('cadastrar'))) {
    return { type: 'route', target: '/adicionar', description: 'Adicionar novo medicamento' };
  }
  if (msg.includes('rotina') || (msg.includes('meus') && msg.includes('medicamento'))) {
    return { type: 'route', target: '/rotina', description: 'Ver lista de medicamentos' };
  }
  if (msg.includes('estoque') || msg.includes('quantidade') || msg.includes('repor')) {
    return { type: 'route', target: '/estoque', description: 'Ver estoque de medicamentos' };
  }
  
  // Carteira e Documentos
  if (msg.includes('carteira') || msg.includes('documento') || msg.includes('receita')) {
    return { type: 'route', target: '/carteira', description: 'Abrir Carteira de Saúde' };
  }
  if (msg.includes('upload') || msg.includes('enviar') && (msg.includes('documento') || msg.includes('receita'))) {
    return { type: 'route', target: '/carteira/upload', description: 'Enviar documento' };
  }
  if (msg.includes('scan') || msg.includes('digitalizar') || msg.includes('escanear')) {
    return { type: 'route', target: '/scan', description: 'Digitalizar documento' };
  }
  
  // Vacinas
  if (msg.includes('vacina') || msg.includes('vacinação') || msg.includes('imunização')) {
    return { type: 'route', target: '/carteira-vacina', description: 'Abrir Carteira de Vacina' };
  }
  
  // Consultas
  if (msg.includes('consulta') || msg.includes('médico') || msg.includes('agendar')) {
    return { type: 'route', target: '/consultas', description: 'Ver consultas médicas' };
  }
  
  // Exames
  if (msg.includes('exame') || msg.includes('laboratório') || msg.includes('resultado')) {
    return { type: 'route', target: '/exames', description: 'Ver exames' };
  }
  
  // Progresso e Métricas
  if (msg.includes('progresso') || msg.includes('estatística') || msg.includes('métrica')) {
    return { type: 'route', target: '/progresso', description: 'Ver progresso e métricas' };
  }
  if (msg.includes('conquista') || msg.includes('medalha') || msg.includes('badge')) {
    return { type: 'route', target: '/conquistas', description: 'Ver conquistas' };
  }
  if (msg.includes('gráfico') || msg.includes('evolução')) {
    return { type: 'route', target: '/graficos', description: 'Ver gráficos' };
  }
  if (msg.includes('relatório') || msg.includes('análise detalhada')) {
    return { type: 'route', target: '/progresso/detalhes', description: 'Ver análise detalhada' };
  }
  
  // Saúde
  if (msg.includes('viagem') || msg.includes('viajar')) {
    return { type: 'route', target: '/viagem', description: 'Abrir modo viagem' };
  }
  if (msg.includes('efeito') && (msg.includes('colateral') || msg.includes('registrar'))) {
    return { type: 'route', target: '/diario-efeitos', description: 'Abrir diário de efeitos' };
  }
  if (msg.includes('linha do tempo') || msg.includes('timeline') || msg.includes('histórico saúde')) {
    return { type: 'route', target: '/linha-do-tempo', description: 'Ver linha do tempo' };
  }
  if (msg.includes('análise') && msg.includes('saúde')) {
    return { type: 'route', target: '/analise-saude', description: 'Ver análise de saúde' };
  }
  if (msg.includes('emergência') || msg.includes('urgência')) {
    return { type: 'route', target: '/emergencia', description: 'Abrir informações de emergência' };
  }
  
  // Perfil e Configurações
  if (msg.includes('perfil') || msg.includes('conta') || msg.includes('configuração')) {
    return { type: 'route', target: '/perfil', description: 'Abrir perfil' };
  }
  if (msg.includes('indicar') || msg.includes('indicação') || msg.includes('ganhe')) {
    return { type: 'route', target: '/indique-ganhe', description: 'Abrir Indique e Ganhe' };
  }
  if (msg.includes('plano') || msg.includes('premium') || msg.includes('assinar') || msg.includes('assinatura')) {
    return { type: 'route', target: '/planos', description: 'Ver planos' };
  }
  if (msg.includes('notificação') || msg.includes('lembrete') || msg.includes('alerta')) {
    return { type: 'route', target: '/notificacoes', description: 'Configurar notificações' };
  }
  if (msg.includes('alarme') || msg.includes('som')) {
    return { type: 'route', target: '/alarmes', description: 'Configurar alarmes' };
  }
  if (msg.includes('exportar') || msg.includes('baixar') || msg.includes('pdf')) {
    return { type: 'route', target: '/exportar', description: 'Exportar dados' };
  }
  if (msg.includes('tutorial') || msg.includes('aprender') || msg.includes('como usar')) {
    return { type: 'route', target: '/tutorial', description: 'Ver tutorial' };
  }
  if (msg.includes('ajuda') || msg.includes('suporte') || msg.includes('dúvida')) {
    return { type: 'route', target: '/ajuda', description: 'Abrir ajuda' };
  }
  if (msg.includes('criar perfil') || msg.includes('novo perfil') || msg.includes('adicionar perfil')) {
    return { type: 'route', target: '/perfil/criar', description: 'Criar novo perfil' };
  }
  
  // Hoje
  if (msg.includes('hoje') || msg.includes('doses') || msg.includes('tomar')) {
    return { type: 'route', target: '/hoje', description: 'Ver doses de hoje' };
  }

  return null;
}
