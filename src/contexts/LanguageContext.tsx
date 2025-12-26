import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PORTUGUESE_COUNTRIES, getLanguageByCountry } from '@/lib/stripeConfig';

export type Language = 'pt' | 'en';

interface CountryInfo {
  code: string;
  detected: boolean;
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string>) => string;
  country: CountryInfo;
  isPortugueseCountry: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Complete translations
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
    'common.perMonth': '/mês',
    'common.perYear': '/ano',
    
    // Today page
    'today.title': 'Hoje',
    'today.goodMorning': 'Bom dia',
    'today.goodAfternoon': 'Boa tarde',
    'today.goodEvening': 'Boa noite',
    'today.noDoses': 'Nenhuma dose programada para hoje',
    'today.allTaken': 'Tudo em dia!',
    'today.pending': 'pendentes',
    'today.taken': 'tomadas',
    'today.skipped': 'puladas',
    'today.overdue': 'Atrasadas',
    'today.markAsTaken': 'Marcar como tomado',
    'today.skip': 'Pular',
    'today.snooze': 'Adiar',
    'today.upcoming': 'Próximas',
    'today.completed': 'Completas',
    'today.daysInRow': 'dias seguidos',
    'today.ofDoses': 'de',
    'today.doses': 'doses',
    'today.addFirstMed': 'Adicione seu primeiro medicamento',
    'today.weRemindYou': 'Nós avisamos na hora certa de tomar',
    'today.dosePending': 'dose pendente',
    'today.dosesPending': 'doses pendentes',
    'today.allGood': 'Tudo certo!',
    'today.noMedsScheduled': 'Nenhum medicamento agendado para este dia.',
    'today.youTookAll': 'Você tomou todos os',
    'today.medsToday': 'medicamentos de hoje.',
    'today.iTookIt': 'Tomei',
    'today.late': 'Atrasado',
    'today.missed': 'Perdido',
    'today.medication': 'Medicamento',
    'today.appointment': 'Consulta',
    'today.exam': 'Exame',
    'today.withFood': 'Com alimento',
    
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
    'meds.manageDesc': 'Gerencie medicamentos e estoque',
    'meds.myMeds': 'Meus Remédios',
    'meds.newMed': 'Novo remédio',
    'meds.noTimes': 'Sem horários',
    'meds.confirmDelete': 'Tem certeza que deseja excluir este item?',
    'meds.deleteSuccess': 'Item excluído com sucesso',
    'meds.stockUpdated': 'Estoque atualizado!',
    'meds.critical': 'Crítico',
    'meds.low': 'Baixo',
    'meds.medium': 'Médio',
    'meds.good': 'Bom',
    
    // Medication Wizard
    'wizard.addItem': 'Adicionar Item',
    'wizard.step1': 'Identificação',
    'wizard.step2': 'Horários',
    'wizard.step3': 'Estoque',
    'wizard.medicationName': 'Nome do medicamento',
    'wizard.searchMedication': 'Buscar medicamento...',
    'wizard.typeName': 'Ou digite o nome aqui...',
    'wizard.searching': 'Buscando...',
    'wizard.typeAtLeast2': 'Digite pelo menos 2 letras',
    'wizard.notFoundInList': 'Não encontrado na lista',
    'wizard.use': 'Usar',
    'wizard.type': 'Tipo',
    'wizard.medication': 'Medicamento',
    'wizard.medicationDesc': 'Remédios prescritos ou de farmácia',
    'wizard.vitamin': 'Vitamina',
    'wizard.vitaminDesc': 'Vitaminas e minerais',
    'wizard.supplement': 'Suplemento',
    'wizard.supplementDesc': 'Suplementos alimentares',
    'wizard.other': 'Outro',
    'wizard.otherDesc': 'Outros produtos de saúde',
    'wizard.whatFor': 'Para que você usa?',
    'wizard.optional': 'opcional',
    'wizard.energy': 'Energia',
    'wizard.energyDesc': 'Pré-treino, cafeína, B12',
    'wizard.sleep': 'Sono',
    'wizard.sleepDesc': 'Melatonina, magnésio, camomila',
    'wizard.immunity': 'Imunidade',
    'wizard.immunityDesc': 'Vitamina C, D, zinco',
    'wizard.performance': 'Performance',
    'wizard.performanceDesc': 'Whey, creatina, BCAA',
    'wizard.hydration': 'Hidratação',
    'wizard.hydrationDesc': 'Eletrólitos, isotônicos',
    'wizard.notes': 'Observação',
    'wizard.notesPlaceholder': 'Ex: Tomar com água, após as refeições...',
    'wizard.continuousUse': 'Uso contínuo',
    'wizard.noEndDate': 'Sem data de término',
    'wizard.start': 'Início',
    'wizard.end': 'Término',
    'wizard.frequency': 'Frequência',
    'wizard.daily': 'Todo dia',
    'wizard.dailyDesc': 'Todos os dias da semana',
    'wizard.specificDays': 'Dias específicos',
    'wizard.specificDaysDesc': 'Escolher quais dias',
    'wizard.weekly': 'Semanal',
    'wizard.weeklyDesc': 'Uma vez por semana (ex: Ozempic)',
    'wizard.whichDays': 'Quais dias?',
    'wizard.times': 'Horários',
    'wizard.time': 'horário',
    'wizard.timesCount': 'horários',
    'wizard.morning': 'Manhã',
    'wizard.lunch': 'Almoço',
    'wizard.afternoon': 'Tarde',
    'wizard.night': 'Noite',
    'wizard.otherTime': 'Outro horário',
    'wizard.controlStock': 'Controlar estoque',
    'wizard.stockDesc': 'Receba alertas antes de acabar',
    'wizard.currentQty': 'Quantidade atual',
    'wizard.units': 'unidades',
    'wizard.unitLabel': 'Tipo de unidade',
    'wizard.pill': 'Comprimido',
    'wizard.pills': 'Comprimidos',
    'wizard.capsule': 'Cápsula',
    'wizard.capsules': 'Cápsulas',
    'wizard.drop': 'Gota',
    'wizard.drops': 'Gotas',
    'wizard.ml': 'mL',
    'wizard.dose': 'Dose',
    'wizard.doses': 'Doses',
    'wizard.projection': 'Projeção',
    'wizard.daysLeft': 'dias restantes',
    'wizard.daysSupply': 'dias de estoque',
    'wizard.scanDesc': 'Tire foto da receita ou caixa',
    'wizard.uploadImage': 'Enviar Imagem',
    'wizard.uploadDesc': 'Selecione da galeria',
    'wizard.typeManually': 'Digitar Manualmente',
    'wizard.typeManuallyDesc': 'Preencher os dados',
    'wizard.chooseMethod': 'Escolha como adicionar',
    'wizard.step': 'Passo',
    'wizard.analyzingImage': 'Analisando imagem...',
    'wizard.howMany': 'Quantos você tem?',
    'wizard.alertWhenRemaining': 'Avisar quando restar:',
    'wizard.notificationWhenReached': 'Notificação quando chegar a este número',
    'wizard.duration': 'Duração',
    'wizard.alertIn': 'Alerta em',
    'wizard.lowStock': 'Estoque baixo!',
    'wizard.gettingLow': 'Ficando baixo',
    'wizard.stockOk': 'Estoque OK',
    'wizard.tip': 'Dica',
    'wizard.keepMargin': 'Mantenha margem de segurança.',
    'wizard.appWillAlert': 'O app avisa quando estiver acabando.',
    
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
    
    // Landing page
    'landing.heroTitle': 'A tranquilidade de saber que quem você ama está cuidado',
    'landing.heroHighlight': 'quem você ama está cuidado',
    'landing.heroSubtitle': 'Lembretes de medicamentos que funcionam. Para você, seus pais, toda a família. Simples como deveria ser.',
    'landing.ctaPrimary': 'Começar Agora — É Grátis',
    'landing.noCreditCard': 'Sem cartão de crédito',
    'landing.freeTrial': '7 dias Premium grátis',
    'landing.login': 'Entrar',
    'landing.startFree': 'Começar Grátis',
    'landing.benefit1Title': 'Lembretes no Horário Certo',
    'landing.benefit1Desc': 'Notificações personalizadas para cada medicamento. Você cuida de quem ama, nós cuidamos do horário.',
    'landing.benefit2Title': 'Carteira de Saúde Digital',
    'landing.benefit2Desc': 'Receitas, exames e vacinas organizados. Tudo pronto para mostrar ao médico quando precisar.',
    'landing.benefit3Title': 'Cuidado em Família',
    'landing.benefit3Desc': 'Acompanhe a saúde dos seus pais, filhos e dependentes. Cada um com seu perfil individual.',
    'landing.benefit4Title': 'Controle de Estoque',
    'landing.benefit4Desc': 'Saiba quando comprar mais. Evite a angústia de ficar sem medicamento.',
    'landing.benefit5Title': 'Assistente Inteligente',
    'landing.benefit5Desc': 'Tire dúvidas sobre seus medicamentos de forma simples e acessível.',
    'landing.benefit6Title': 'Histórico Completo',
    'landing.benefit6Desc': 'Acompanhe sua evolução e compartilhe relatórios profissionais com seu médico.',
    'landing.emotionalQuote': 'Você sabe quantas vezes seu pai esqueceu de tomar o remédio da pressão essa semana?',
    'landing.emotionalText': 'Para quem cuida de familiares ou gerencia múltiplos medicamentos, cada dose esquecida é uma preocupação. O HoraMed existe para trazer paz de espírito a quem precisa cuidar.',
    'landing.howItWorksTitle': 'Comece em 2 minutos',
    'landing.howItWorksSubtitle': 'Sem complicação. Se você sabe usar o celular, sabe usar o HoraMed.',
    'landing.step1Title': 'Cadastre seus medicamentos',
    'landing.step1Desc': 'Digite o nome ou fotografe a receita. A gente organiza tudo.',
    'landing.step2Title': 'Receba lembretes',
    'landing.step2Desc': 'No horário exato. Push, alarme ou até WhatsApp.',
    'landing.step3Title': 'Tenha tranquilidade',
    'landing.step3Desc': 'Saiba que você ou seu familiar está cuidado.',
    'landing.worksTitle': 'Funciona de verdade. Todo dia.',
    'landing.worksSubtitle': 'Desenvolvido pensando em quem mais precisa: idosos, cuidadores e famílias.',
    'landing.testimonialsTitle': 'Histórias reais de quem cuida',
    'landing.pricingTitle': 'Comece grátis, evolua quando quiser',
    'landing.pricingSubtitle': 'Sem surpresas. Sem letras pequenas.',
    'landing.planFree': 'Gratuito',
    'landing.planFreeDesc': 'Para começar',
    'landing.planPremium': 'Premium',
    'landing.planPremiumDesc': 'Para quem cuida de verdade',
    'landing.feature1': '1 medicamento ativo',
    'landing.feature2': 'Lembretes por push',
    'landing.feature3': 'Histórico básico',
    'landing.feature4': '5 documentos na carteira',
    'landing.featurePremium1': 'Medicamentos ilimitados',
    'landing.featurePremium2': 'Perfis familiares',
    'landing.featurePremium3': 'Assistente Clara ilimitado',
    'landing.featurePremium4': 'Relatórios para o médico',
    'landing.featurePremium5': 'Cuidadores com acesso',
    'landing.mostPopular': 'Mais popular',
    'landing.tryFree': 'Testar 7 dias grátis',
    'landing.simpleTitle': 'Tão simples que até seu pai vai conseguir usar',
    'landing.simpleDesc': 'Desenvolvemos pensando em quem precisa de simplicidade. Botões grandes, textos claros, e uma única função: lembrar de tomar o remédio.',
    'landing.worksOnPhone': 'Funciona no celular que você já tem',
    'landing.dosesRemembered': 'Doses lembradas',
    'landing.familiesOrganized': 'Famílias organizadas',
    'landing.finalCtaTitle': 'Comece hoje a cuidar melhor',
    'landing.finalCtaDesc': 'Junte-se a milhares de pessoas que já confiam no HoraMed para cuidar de quem amam.',
    'landing.footerRights': 'Todos os direitos reservados.',
    'landing.footerTerms': 'Termos de Uso',
    'landing.footerPrivacy': 'Privacidade',
    'landing.footerContact': 'Contato',
    
    // Notifications
    'notifications.doseReminder': 'Hora de tomar {medication}',
    'notifications.doseReminderBody': 'Não esqueça de tomar sua dose de {medication}',
    'notifications.overdueTitle': 'Dose atrasada',
    'notifications.overdueBody': 'Você ainda não tomou {medication}. Tome assim que possível.',
    'notifications.lowStockTitle': 'Estoque baixo',
    'notifications.lowStockBody': 'Seu estoque de {medication} está acabando. Compre mais em breve.',
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
    'common.perMonth': '/month',
    'common.perYear': '/year',
    
    // Today page
    'today.title': 'Today',
    'today.goodMorning': 'Good morning',
    'today.goodAfternoon': 'Good afternoon',
    'today.goodEvening': 'Good evening',
    'today.noDoses': 'No doses scheduled for today',
    'today.allTaken': 'All done!',
    'today.pending': 'pending',
    'today.taken': 'taken',
    'today.skipped': 'skipped',
    'today.overdue': 'Overdue',
    'today.markAsTaken': 'Mark as taken',
    'today.skip': 'Skip',
    'today.snooze': 'Snooze',
    'today.upcoming': 'Upcoming',
    'today.completed': 'Completed',
    'today.daysInRow': 'days in a row',
    'today.ofDoses': 'of',
    'today.doses': 'doses',
    'today.addFirstMed': 'Add your first medication',
    'today.weRemindYou': 'We remind you at the right time',
    'today.dosePending': 'dose pending',
    'today.dosesPending': 'doses pending',
    'today.allGood': 'All good!',
    'today.noMedsScheduled': 'No medications scheduled for this day.',
    'today.youTookAll': 'You took all',
    'today.medsToday': 'medications today.',
    'today.iTookIt': 'Took it',
    'today.late': 'Late',
    'today.missed': 'Missed',
    'today.medication': 'Medication',
    'today.appointment': 'Appointment',
    'today.exam': 'Exam',
    'today.withFood': 'With food',
    
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
    'meds.manageDesc': 'Manage medications and stock',
    'meds.myMeds': 'My Medications',
    'meds.newMed': 'New medication',
    'meds.noTimes': 'No times',
    'meds.confirmDelete': 'Are you sure you want to delete this item?',
    'meds.deleteSuccess': 'Item deleted successfully',
    'meds.stockUpdated': 'Stock updated!',
    'meds.critical': 'Critical',
    'meds.low': 'Low',
    'meds.medium': 'Medium',
    'meds.good': 'Good',
    
    // Medication Wizard
    'wizard.addItem': 'Add Item',
    'wizard.step1': 'Identification',
    'wizard.step2': 'Schedule',
    'wizard.step3': 'Stock',
    'wizard.medicationName': 'Medication name',
    'wizard.searchMedication': 'Search medication...',
    'wizard.typeName': 'Or type the name here...',
    'wizard.searching': 'Searching...',
    'wizard.typeAtLeast2': 'Type at least 2 letters',
    'wizard.notFoundInList': 'Not found in list',
    'wizard.use': 'Use',
    'wizard.type': 'Type',
    'wizard.medication': 'Medication',
    'wizard.medicationDesc': 'Prescribed or pharmacy medications',
    'wizard.vitamin': 'Vitamin',
    'wizard.vitaminDesc': 'Vitamins and minerals',
    'wizard.supplement': 'Supplement',
    'wizard.supplementDesc': 'Dietary supplements',
    'wizard.other': 'Other',
    'wizard.otherDesc': 'Other health products',
    'wizard.whatFor': 'What do you use it for?',
    'wizard.optional': 'optional',
    'wizard.energy': 'Energy',
    'wizard.energyDesc': 'Pre-workout, caffeine, B12',
    'wizard.sleep': 'Sleep',
    'wizard.sleepDesc': 'Melatonin, magnesium, chamomile',
    'wizard.immunity': 'Immunity',
    'wizard.immunityDesc': 'Vitamin C, D, zinc',
    'wizard.performance': 'Performance',
    'wizard.performanceDesc': 'Whey, creatine, BCAA',
    'wizard.hydration': 'Hydration',
    'wizard.hydrationDesc': 'Electrolytes, isotonics',
    'wizard.notes': 'Notes',
    'wizard.notesPlaceholder': 'E.g.: Take with water, after meals...',
    'wizard.continuousUse': 'Continuous use',
    'wizard.noEndDate': 'No end date',
    'wizard.start': 'Start',
    'wizard.end': 'End',
    'wizard.frequency': 'Frequency',
    'wizard.daily': 'Every day',
    'wizard.dailyDesc': 'All days of the week',
    'wizard.specificDays': 'Specific days',
    'wizard.specificDaysDesc': 'Choose which days',
    'wizard.weekly': 'Weekly',
    'wizard.weeklyDesc': 'Once a week (e.g.: Ozempic)',
    'wizard.whichDays': 'Which days?',
    'wizard.times': 'Times',
    'wizard.time': 'time',
    'wizard.timesCount': 'times',
    'wizard.morning': 'Morning',
    'wizard.lunch': 'Lunch',
    'wizard.afternoon': 'Afternoon',
    'wizard.night': 'Night',
    'wizard.otherTime': 'Other time',
    'wizard.controlStock': 'Track stock',
    'wizard.stockDesc': 'Get alerts before running out',
    'wizard.currentQty': 'Current quantity',
    'wizard.units': 'units',
    'wizard.unitLabel': 'Unit type',
    'wizard.pill': 'Pill',
    'wizard.pills': 'Pills',
    'wizard.capsule': 'Capsule',
    'wizard.capsules': 'Capsules',
    'wizard.drop': 'Drop',
    'wizard.drops': 'Drops',
    'wizard.ml': 'mL',
    'wizard.dose': 'Dose',
    'wizard.doses': 'Doses',
    'wizard.projection': 'Projection',
    'wizard.daysLeft': 'days left',
    'wizard.daysSupply': 'days of supply',
    'wizard.scanDesc': 'Take a photo of prescription or box',
    'wizard.uploadImage': 'Upload Image',
    'wizard.uploadDesc': 'Select from gallery',
    'wizard.typeManually': 'Type Manually',
    'wizard.typeManuallyDesc': 'Fill in the data',
    'wizard.chooseMethod': 'Choose how to add',
    'wizard.step': 'Step',
    'wizard.analyzingImage': 'Analyzing image...',
    'wizard.howMany': 'How many do you have?',
    'wizard.alertWhenRemaining': 'Alert when remaining:',
    'wizard.notificationWhenReached': 'Notification when this number is reached',
    'wizard.duration': 'Duration',
    'wizard.alertIn': 'Alert in',
    'wizard.lowStock': 'Low stock!',
    'wizard.gettingLow': 'Getting low',
    'wizard.stockOk': 'Stock OK',
    'wizard.tip': 'Tip',
    'wizard.keepMargin': 'Keep a safety margin.',
    'wizard.appWillAlert': 'The app will alert you when running low.',
    
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
    
    // Landing page
    'landing.heroTitle': 'The peace of knowing your loved ones are taken care of',
    'landing.heroHighlight': 'your loved ones are taken care of',
    'landing.heroSubtitle': 'Medication reminders that work. For you, your parents, the whole family. Simple as it should be.',
    'landing.ctaPrimary': 'Get Started — It\'s Free',
    'landing.noCreditCard': 'No credit card required',
    'landing.freeTrial': '7 days Premium free',
    'landing.login': 'Login',
    'landing.startFree': 'Start Free',
    'landing.benefit1Title': 'Reminders at the Right Time',
    'landing.benefit1Desc': 'Personalized notifications for each medication. You care for your loved ones, we take care of the timing.',
    'landing.benefit2Title': 'Digital Health Wallet',
    'landing.benefit2Desc': 'Prescriptions, exams, and vaccines organized. Everything ready to show your doctor when needed.',
    'landing.benefit3Title': 'Family Care',
    'landing.benefit3Desc': 'Track the health of your parents, children, and dependents. Each with their own individual profile.',
    'landing.benefit4Title': 'Stock Control',
    'landing.benefit4Desc': 'Know when to buy more. Avoid the anxiety of running out of medication.',
    'landing.benefit5Title': 'Smart Assistant',
    'landing.benefit5Desc': 'Get answers about your medications in a simple and accessible way.',
    'landing.benefit6Title': 'Complete History',
    'landing.benefit6Desc': 'Track your progress and share professional reports with your doctor.',
    'landing.emotionalQuote': 'Do you know how many times your dad forgot to take his blood pressure medication this week?',
    'landing.emotionalText': 'For those who care for family members or manage multiple medications, every missed dose is a worry. HoraMed exists to bring peace of mind to those who need to care.',
    'landing.howItWorksTitle': 'Start in 2 minutes',
    'landing.howItWorksSubtitle': 'No complications. If you know how to use a phone, you know how to use HoraMed.',
    'landing.step1Title': 'Register your medications',
    'landing.step1Desc': 'Type the name or photograph the prescription. We organize everything.',
    'landing.step2Title': 'Receive reminders',
    'landing.step2Desc': 'At the exact time. Push, alarm, or even WhatsApp.',
    'landing.step3Title': 'Have peace of mind',
    'landing.step3Desc': 'Know that you or your family member is taken care of.',
    'landing.worksTitle': 'It really works. Every day.',
    'landing.worksSubtitle': 'Developed thinking about those who need it most: seniors, caregivers, and families.',
    'landing.testimonialsTitle': 'Real stories from those who care',
    'landing.pricingTitle': 'Start free, upgrade when you want',
    'landing.pricingSubtitle': 'No surprises. No fine print.',
    'landing.planFree': 'Free',
    'landing.planFreeDesc': 'To get started',
    'landing.planPremium': 'Premium',
    'landing.planPremiumDesc': 'For those who really care',
    'landing.feature1': '1 active medication',
    'landing.feature2': 'Push reminders',
    'landing.feature3': 'Basic history',
    'landing.feature4': '5 documents in wallet',
    'landing.featurePremium1': 'Unlimited medications',
    'landing.featurePremium2': 'Family profiles',
    'landing.featurePremium3': 'Unlimited Clara assistant',
    'landing.featurePremium4': 'Reports for your doctor',
    'landing.featurePremium5': 'Caregiver access',
    'landing.mostPopular': 'Most popular',
    'landing.tryFree': 'Try 7 days free',
    'landing.simpleTitle': 'So simple even your dad can use it',
    'landing.simpleDesc': 'We developed it thinking about those who need simplicity. Large buttons, clear text, and one single function: remember to take your medication.',
    'landing.worksOnPhone': 'Works on the phone you already have',
    'landing.dosesRemembered': 'Doses remembered',
    'landing.familiesOrganized': 'Families organized',
    'landing.finalCtaTitle': 'Start caring better today',
    'landing.finalCtaDesc': 'Join thousands of people who already trust HoraMed to care for their loved ones.',
    'landing.footerRights': 'All rights reserved.',
    'landing.footerTerms': 'Terms of Use',
    'landing.footerPrivacy': 'Privacy',
    'landing.footerContact': 'Contact',
    
    // Notifications
    'notifications.doseReminder': 'Time to take {medication}',
    'notifications.doseReminderBody': 'Don\'t forget to take your dose of {medication}',
    'notifications.overdueTitle': 'Overdue dose',
    'notifications.overdueBody': 'You haven\'t taken {medication} yet. Take it as soon as possible.',
    'notifications.lowStockTitle': 'Low stock',
    'notifications.lowStockBody': 'Your stock of {medication} is running low. Buy more soon.',
  }
};

// Detect country via multiple methods
async function detectCountry(): Promise<string> {
  // Check localStorage first
  const saved = localStorage.getItem('horamed_country');
  if (saved) return saved;

  try {
    // Try IP-based detection using free services
    const response = await fetch('https://ipapi.co/json/', { 
      signal: AbortSignal.timeout(3000) 
    });
    if (response.ok) {
      const data = await response.json();
      const country = data.country_code || 'US';
      localStorage.setItem('horamed_country', country);
      return country;
    }
  } catch {
    // Fallback to timezone-based detection
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (timezone.startsWith('America/Sao_Paulo') || 
          timezone.startsWith('America/Fortaleza') ||
          timezone.startsWith('America/Recife') ||
          timezone.startsWith('America/Bahia') ||
          timezone.startsWith('America/Belem') ||
          timezone.startsWith('America/Manaus') ||
          timezone.startsWith('America/Cuiaba') ||
          timezone.startsWith('America/Campo_Grande') ||
          timezone.startsWith('America/Porto_Velho') ||
          timezone.startsWith('America/Boa_Vista') ||
          timezone.startsWith('America/Rio_Branco')) {
        return 'BR';
      }
      if (timezone.startsWith('Europe/Lisbon')) return 'PT';
      if (timezone.startsWith('Africa/Luanda')) return 'AO';
      if (timezone.startsWith('Africa/Maputo')) return 'MZ';
    } catch {}
  }

  // Default to US (English, USD)
  return 'US';
}

// Detect language based on country first, then browser
function detectLanguage(countryCode: string): Language {
  const saved = localStorage.getItem('horamed_language');
  if (saved === 'pt' || saved === 'en') {
    return saved;
  }
  
  // Use country to determine language
  return getLanguageByCountry(countryCode);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [country, setCountry] = useState<CountryInfo>({ code: 'US', detected: false });
  const [language, setLanguageState] = useState<Language>('en');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    async function init() {
      const detectedCountry = await detectCountry();
      setCountry({ code: detectedCountry, detected: true });
      
      const lang = detectLanguage(detectedCountry);
      setLanguageState(lang);
      setIsInitialized(true);
    }
    init();
  }, []);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('horamed_language', language);
      document.documentElement.lang = language === 'pt' ? 'pt-BR' : 'en';
    }
  }, [language, isInitialized]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('horamed_language', lang);
  };

  const t = (key: string, params?: Record<string, string>): string => {
    let text = translations[language][key] || translations['en'][key] || key;
    
    // Replace parameters like {code} with actual values
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        text = text.replace(new RegExp(`\\{${param}\\}`, 'g'), value);
      });
    }
    
    return text;
  };

  const isPortugueseCountry = PORTUGUESE_COUNTRIES.includes(country.code);

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage, 
      t, 
      country,
      isPortugueseCountry
    }}>
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

// Alias for backward compatibility
export const useTranslation = useLanguage;
