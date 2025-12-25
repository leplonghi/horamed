import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'pt' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Traduções
const translations: Record<Language, Record<string, string>> = {
  pt: {
    // Navigation
    'nav.today': 'Hoje',
    'nav.routine': 'Rotina',
    'nav.progress': 'Progresso',
    'nav.wallet': 'Carteira',
    'nav.profile': 'Perfil',
    'nav.medications': 'Medicamentos',
    'nav.health': 'Saúde',
    'nav.more': 'Mais',
    
    // Common
    'common.save': 'Salvar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Excluir',
    'common.edit': 'Editar',
    'common.add': 'Adicionar',
    'common.search': 'Buscar',
    'common.loading': 'Carregando...',
    'common.error': 'Erro',
    'common.success': 'Sucesso',
    'common.confirm': 'Confirmar',
    'common.back': 'Voltar',
    'common.next': 'Próximo',
    'common.finish': 'Finalizar',
    'common.yes': 'Sim',
    'common.no': 'Não',
    'common.or': 'ou',
    'common.and': 'e',
    'common.all': 'Todos',
    'common.none': 'Nenhum',
    'common.active': 'Ativo',
    'common.inactive': 'Inativo',
    'common.premium': 'Premium',
    'common.free': 'Gratuito',
    'common.upgrade': 'Fazer Upgrade',
    'common.new': 'Novo',
    'common.view': 'Ver',
    'common.close': 'Fechar',
    'common.share': 'Compartilhar',
    'common.download': 'Baixar',
    'common.upload': 'Enviar',
    'common.refresh': 'Atualizar',
    'common.filter': 'Filtrar',
    'common.sort': 'Ordenar',
    'common.settings': 'Configurações',
    'common.help': 'Ajuda',
    'common.logout': 'Sair',
    'common.login': 'Entrar',
    'common.signup': 'Cadastrar',
    'common.copy': 'Copiar',
    'common.copied': 'Copiado!',
    
    // Today page
    'today.title': 'Hoje',
    'today.goodMorning': 'Bom dia',
    'today.goodAfternoon': 'Boa tarde',
    'today.goodEvening': 'Boa noite',
    'today.noDoses': 'Nenhuma dose programada para hoje',
    'today.allTaken': 'Todas as doses foram tomadas!',
    'today.pending': 'pendentes',
    'today.taken': 'tomadas',
    'today.skipped': 'puladas',
    'today.overdue': 'atrasadas',
    'today.markAsTaken': 'Marcar como tomado',
    'today.skip': 'Pular',
    'today.snooze': 'Adiar',
    
    // Medications
    'meds.title': 'Minha Saúde',
    'meds.routine': 'Rotina',
    'meds.stock': 'Estoque',
    'meds.history': 'Histórico',
    'meds.addMedication': 'Adicionar medicamento',
    'meds.scanPrescription': 'Escanear receita',
    'meds.noMedications': 'Nenhum medicamento cadastrado',
    'meds.activeMedications': 'medicamentos ativos',
    'meds.withFood': 'Com alimento',
    'meds.dailyDose': 'Dose diária',
    'meds.times': 'horários',
    'meds.time': 'horário',
    'meds.dose': 'Dose',
    'meds.doses': 'Doses',
    'meds.frequency': 'Frequência',
    'meds.duration': 'Duração',
    'meds.startDate': 'Data de início',
    'meds.endDate': 'Data de término',
    'meds.notes': 'Observações',
    'meds.instructions': 'Instruções',
    
    // Stock
    'stock.title': 'Estoque',
    'stock.lowStock': 'Estoque baixo',
    'stock.outOfStock': 'Sem estoque',
    'stock.refill': 'Repor',
    'stock.units': 'unidades',
    'stock.daysLeft': 'dias restantes',
    'stock.projection': 'Projeção',
    'stock.lastRefill': 'Última reposição',
    'stock.addStock': 'Adicionar estoque',
    
    // Profile
    'profile.title': 'Perfil',
    'profile.account': 'Conta',
    'profile.profiles': 'Perfis',
    'profile.subscription': 'Assinatura',
    'profile.familyProfiles': 'Perfis Familiares',
    'profile.caregivers': 'Cuidadores',
    'profile.editProfile': 'Editar perfil',
    'profile.notifications': 'Notificações',
    'profile.privacy': 'Privacidade',
    'profile.language': 'Idioma',
    'profile.theme': 'Tema',
    'profile.exportData': 'Exportar dados',
    'profile.deleteAccount': 'Excluir conta',
    'profile.daysLeft': 'dias restantes',
    
    // Wallet/Cofre
    'wallet.title': 'Carteira de Saúde',
    'wallet.documents': 'Documentos',
    'wallet.prescriptions': 'Receitas',
    'wallet.exams': 'Exames',
    'wallet.vaccines': 'Vacinas',
    'wallet.upload': 'Enviar documento',
    'wallet.scan': 'Digitalizar',
    'wallet.noDocuments': 'Nenhum documento',
    
    // Progress
    'progress.title': 'Progresso',
    'progress.adherence': 'Adesão',
    'progress.streak': 'Sequência',
    'progress.thisWeek': 'Esta semana',
    'progress.thisMonth': 'Este mês',
    'progress.achievements': 'Conquistas',
    'progress.statistics': 'Estatísticas',
    'progress.dosesTaken': 'Doses tomadas',
    'progress.days': 'dias',
    
    // Auth
    'auth.email': 'E-mail',
    'auth.password': 'Senha',
    'auth.forgotPassword': 'Esqueci minha senha',
    'auth.createAccount': 'Criar conta',
    'auth.haveAccount': 'Já tem conta?',
    'auth.noAccount': 'Não tem conta?',
    
    // Clara AI
    'clara.greeting': 'Olá! Sou a Clara, sua assistente de saúde.',
    'clara.help': 'Como posso ajudar?',
    'clara.suggestion': 'Sugestão',
    
    // Time
    'time.morning': 'Manhã',
    'time.afternoon': 'Tarde',
    'time.evening': 'Noite',
    'time.night': 'Madrugada',
    'time.today': 'Hoje',
    'time.yesterday': 'Ontem',
    'time.tomorrow': 'Amanhã',
    'time.thisWeek': 'Esta semana',
    'time.lastWeek': 'Semana passada',
    'time.thisMonth': 'Este mês',
    'time.lastMonth': 'Mês passado',
    
    // Days
    'days.sunday': 'Domingo',
    'days.monday': 'Segunda',
    'days.tuesday': 'Terça',
    'days.wednesday': 'Quarta',
    'days.thursday': 'Quinta',
    'days.friday': 'Sexta',
    'days.saturday': 'Sábado',
    
    // Settings
    'settings.language': 'Idioma',
    'settings.languageDesc': 'Escolha o idioma do aplicativo',
    'settings.portuguese': 'Português',
    'settings.english': 'English',
    'settings.notifications': 'Notificações',
    'settings.biometric': 'Autenticação biométrica',
    'settings.darkMode': 'Modo escuro',
    'settings.fitnessWidgets': 'Widgets de bem-estar',
    
    // Tooltips & hints
    'hint.stockTab': 'Aqui você controla o estoque dos seus medicamentos',
    'hint.historyTab': 'Veja seu histórico completo de doses',
    'hint.firstMed': 'Adicione seu primeiro medicamento para começar',
    
    // Onboarding
    'onboarding.welcome': 'Bem-vindo ao HoraMed',
    'onboarding.subtitle': 'Sua saúde sob controle',
    'onboarding.step1': 'Adicione seus medicamentos',
    'onboarding.step2': 'Configure os horários',
    'onboarding.step3': 'Receba lembretes',
    'onboarding.start': 'Começar',
    'onboarding.skip': 'Pular introdução',
    
    // Rewards / Referrals
    'rewards.title': 'Recompensas & Indicações',
    'rewards.headline': 'Indique. Ganhe. Pague menos no Premium.',
    'rewards.subtitle': 'Cada indicação muda seu plano.',
    'rewards.yourCode': 'Seu código de indicação',
    'rewards.copyCode': 'Copiar código',
    'rewards.generateLink': 'Gerar link',
    'rewards.codeCopied': 'Código copiado!',
    'rewards.linkCopied': 'Link copiado!',
    'rewards.share': 'Compartilhar',
    'rewards.copyFullLink': 'Copiar link completo',
    'rewards.goalsProgress': 'Progresso das Metas',
    'rewards.goal10signups': '10 cadastros = 1 mês Premium',
    'rewards.goal5monthly': '5 assinaturas mensais = 1 mês',
    'rewards.goal3annual': '3 assinaturas anuais = 1 ano',
    'rewards.completed': 'Concluída!',
    'rewards.premiumDiscount': 'Desconto Premium',
    'rewards.accumulatedDiscount': 'Desconto acumulado',
    'rewards.limitInfo': 'Limite: 90% (15% por indicação)',
    'rewards.cyclesRemaining': 'ciclos restantes este ano',
    'rewards.availableBenefits': 'Benefícios Disponíveis',
    'rewards.expires': 'Expira',
    'rewards.use': 'Usar',
    'rewards.yourReferrals': 'Suas Indicações',
    'rewards.noReferrals': 'Nenhuma indicação ainda. Compartilhe seu código!',
    'rewards.statusActive': 'Ativa',
    'rewards.statusSignup': 'Cadastrada',
    'rewards.statusPending': 'Pendente',
    'rewards.inviteNow': 'Indicar agora',
    'rewards.viewPlans': 'Ver planos',
    'rewards.shareMessage': 'Use meu código {code} no HoraMed e ganhe 7 dias Premium grátis!',
  },
  en: {
    // Navigation
    'nav.today': 'Today',
    'nav.routine': 'Routine',
    'nav.progress': 'Progress',
    'nav.wallet': 'Wallet',
    'nav.profile': 'Profile',
    'nav.medications': 'Medications',
    'nav.health': 'Health',
    'nav.more': 'More',
    
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.search': 'Search',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.confirm': 'Confirm',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.finish': 'Finish',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.or': 'or',
    'common.and': 'and',
    'common.all': 'All',
    'common.none': 'None',
    'common.active': 'Active',
    'common.inactive': 'Inactive',
    'common.premium': 'Premium',
    'common.free': 'Free',
    'common.upgrade': 'Upgrade',
    'common.new': 'New',
    'common.view': 'View',
    'common.close': 'Close',
    'common.share': 'Share',
    'common.download': 'Download',
    'common.upload': 'Upload',
    'common.refresh': 'Refresh',
    'common.filter': 'Filter',
    'common.sort': 'Sort',
    'common.settings': 'Settings',
    'common.help': 'Help',
    'common.logout': 'Logout',
    'common.login': 'Login',
    'common.signup': 'Sign up',
    'common.copy': 'Copy',
    'common.copied': 'Copied!',
    
    // Today page
    'today.title': 'Today',
    'today.goodMorning': 'Good morning',
    'today.goodAfternoon': 'Good afternoon',
    'today.goodEvening': 'Good evening',
    'today.noDoses': 'No doses scheduled for today',
    'today.allTaken': 'All doses taken!',
    'today.pending': 'pending',
    'today.taken': 'taken',
    'today.skipped': 'skipped',
    'today.overdue': 'overdue',
    'today.markAsTaken': 'Mark as taken',
    'today.skip': 'Skip',
    'today.snooze': 'Snooze',
    
    // Medications
    'meds.title': 'My Health',
    'meds.routine': 'Routine',
    'meds.stock': 'Stock',
    'meds.history': 'History',
    'meds.addMedication': 'Add medication',
    'meds.scanPrescription': 'Scan prescription',
    'meds.noMedications': 'No medications registered',
    'meds.activeMedications': 'active medications',
    'meds.withFood': 'With food',
    'meds.dailyDose': 'Daily dose',
    'meds.times': 'times',
    'meds.time': 'time',
    'meds.dose': 'Dose',
    'meds.doses': 'Doses',
    'meds.frequency': 'Frequency',
    'meds.duration': 'Duration',
    'meds.startDate': 'Start date',
    'meds.endDate': 'End date',
    'meds.notes': 'Notes',
    'meds.instructions': 'Instructions',
    
    // Stock
    'stock.title': 'Stock',
    'stock.lowStock': 'Low stock',
    'stock.outOfStock': 'Out of stock',
    'stock.refill': 'Refill',
    'stock.units': 'units',
    'stock.daysLeft': 'days left',
    'stock.projection': 'Projection',
    'stock.lastRefill': 'Last refill',
    'stock.addStock': 'Add stock',
    
    // Profile
    'profile.title': 'Profile',
    'profile.account': 'Account',
    'profile.profiles': 'Profiles',
    'profile.subscription': 'Subscription',
    'profile.familyProfiles': 'Family Profiles',
    'profile.caregivers': 'Caregivers',
    'profile.editProfile': 'Edit profile',
    'profile.notifications': 'Notifications',
    'profile.privacy': 'Privacy',
    'profile.language': 'Language',
    'profile.theme': 'Theme',
    'profile.exportData': 'Export data',
    'profile.deleteAccount': 'Delete account',
    'profile.daysLeft': 'days left',
    
    // Wallet/Cofre
    'wallet.title': 'Health Wallet',
    'wallet.documents': 'Documents',
    'wallet.prescriptions': 'Prescriptions',
    'wallet.exams': 'Exams',
    'wallet.vaccines': 'Vaccines',
    'wallet.upload': 'Upload document',
    'wallet.scan': 'Scan',
    'wallet.noDocuments': 'No documents',
    
    // Progress
    'progress.title': 'Progress',
    'progress.adherence': 'Adherence',
    'progress.streak': 'Streak',
    'progress.thisWeek': 'This week',
    'progress.thisMonth': 'This month',
    'progress.achievements': 'Achievements',
    'progress.statistics': 'Statistics',
    'progress.dosesTaken': 'Doses taken',
    'progress.days': 'days',
    
    // Auth
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.forgotPassword': 'Forgot password',
    'auth.createAccount': 'Create account',
    'auth.haveAccount': 'Already have an account?',
    'auth.noAccount': "Don't have an account?",
    
    // Clara AI
    'clara.greeting': "Hi! I'm Clara, your health assistant.",
    'clara.help': 'How can I help?',
    'clara.suggestion': 'Suggestion',
    
    // Time
    'time.morning': 'Morning',
    'time.afternoon': 'Afternoon',
    'time.evening': 'Evening',
    'time.night': 'Night',
    'time.today': 'Today',
    'time.yesterday': 'Yesterday',
    'time.tomorrow': 'Tomorrow',
    'time.thisWeek': 'This week',
    'time.lastWeek': 'Last week',
    'time.thisMonth': 'This month',
    'time.lastMonth': 'Last month',
    
    // Days
    'days.sunday': 'Sunday',
    'days.monday': 'Monday',
    'days.tuesday': 'Tuesday',
    'days.wednesday': 'Wednesday',
    'days.thursday': 'Thursday',
    'days.friday': 'Friday',
    'days.saturday': 'Saturday',
    
    // Settings
    'settings.language': 'Language',
    'settings.languageDesc': 'Choose the app language',
    'settings.portuguese': 'Português',
    'settings.english': 'English',
    'settings.notifications': 'Notifications',
    'settings.biometric': 'Biometric authentication',
    'settings.darkMode': 'Dark mode',
    'settings.fitnessWidgets': 'Wellness widgets',
    
    // Tooltips & hints
    'hint.stockTab': 'Here you control your medication stock',
    'hint.historyTab': 'View your complete dose history',
    'hint.firstMed': 'Add your first medication to get started',
    
    // Onboarding
    'onboarding.welcome': 'Welcome to HoraMed',
    'onboarding.subtitle': 'Your health under control',
    'onboarding.step1': 'Add your medications',
    'onboarding.step2': 'Set up the schedules',
    'onboarding.step3': 'Receive reminders',
    'onboarding.start': 'Get started',
    'onboarding.skip': 'Skip intro',
    
    // Rewards / Referrals
    'rewards.title': 'Rewards & Referrals',
    'rewards.headline': 'Refer. Earn. Pay less for Premium.',
    'rewards.subtitle': 'Each referral changes your plan.',
    'rewards.yourCode': 'Your referral code',
    'rewards.copyCode': 'Copy code',
    'rewards.generateLink': 'Generate link',
    'rewards.codeCopied': 'Code copied!',
    'rewards.linkCopied': 'Link copied!',
    'rewards.share': 'Share',
    'rewards.copyFullLink': 'Copy full link',
    'rewards.goalsProgress': 'Goals Progress',
    'rewards.goal10signups': '10 signups = 1 month Premium',
    'rewards.goal5monthly': '5 monthly subs = 1 month',
    'rewards.goal3annual': '3 annual subs = 1 year',
    'rewards.completed': 'Completed!',
    'rewards.premiumDiscount': 'Premium Discount',
    'rewards.accumulatedDiscount': 'Accumulated discount',
    'rewards.limitInfo': 'Limit: 90% (15% per referral)',
    'rewards.cyclesRemaining': 'cycles remaining this year',
    'rewards.availableBenefits': 'Available Benefits',
    'rewards.expires': 'Expires',
    'rewards.use': 'Use',
    'rewards.yourReferrals': 'Your Referrals',
    'rewards.noReferrals': 'No referrals yet. Share your code!',
    'rewards.statusActive': 'Active',
    'rewards.statusSignup': 'Signed up',
    'rewards.statusPending': 'Pending',
    'rewards.inviteNow': 'Invite now',
    'rewards.viewPlans': 'View plans',
    'rewards.shareMessage': 'Use my code {code} on HoraMed and get 7 days Premium free!',
  }
};

// Detecta se o idioma do navegador é português
const detectLanguage = (): Language => {
  const saved = localStorage.getItem('horamed_language');
  if (saved === 'pt' || saved === 'en') {
    return saved;
  }
  
  // Detecta idioma do navegador
  const browserLang = navigator.language || (navigator as any).userLanguage || 'en';
  const langCode = browserLang.toLowerCase().split('-')[0];
  
  // Só retorna português para língua portuguesa, todo o resto é inglês
  return langCode === 'pt' ? 'pt' : 'en';
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(detectLanguage);

  useEffect(() => {
    localStorage.setItem('horamed_language', language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export function useTranslation() {
  const { t, language } = useLanguage();
  return { t, language };
}
