-- ============================================
-- HoraMed Row Level Security Policies
-- Generated: 2026-01-30
-- ============================================

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dose_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.local_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alarms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias_saude ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos_saude ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exames_laboratoriais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valores_exames ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultas_medicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccination_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sinais_vitais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_saude ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.side_effects_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compartilhamentos_doc ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caregiver_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caregivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_fraud_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drug_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interaction_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_extraction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extraction_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_exams ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USER PROFILES POLICIES
-- ============================================

CREATE POLICY "Users can view own profiles" ON public.user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own profiles" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profiles" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own profiles" ON public.user_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- PROFILES POLICIES
-- ============================================

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- ITEMS POLICIES
-- ============================================

CREATE POLICY "Users can view own items" ON public.items
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_profiles.id = items.profile_id 
      AND user_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own items" ON public.items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own items" ON public.items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own items" ON public.items
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- SCHEDULES POLICIES (via items)
-- ============================================

CREATE POLICY "Users can view own schedules" ON public.schedules
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.items WHERE items.id = schedules.item_id AND items.user_id = auth.uid())
  );

CREATE POLICY "Users can insert own schedules" ON public.schedules
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.items WHERE items.id = schedules.item_id AND items.user_id = auth.uid())
  );

CREATE POLICY "Users can update own schedules" ON public.schedules
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.items WHERE items.id = schedules.item_id AND items.user_id = auth.uid())
  );

CREATE POLICY "Users can delete own schedules" ON public.schedules
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.items WHERE items.id = schedules.item_id AND items.user_id = auth.uid())
  );

-- ============================================
-- DOSE INSTANCES POLICIES (via items)
-- ============================================

CREATE POLICY "Users can view own dose_instances" ON public.dose_instances
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.items WHERE items.id = dose_instances.item_id AND items.user_id = auth.uid())
  );

CREATE POLICY "Users can insert own dose_instances" ON public.dose_instances
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.items WHERE items.id = dose_instances.item_id AND items.user_id = auth.uid())
  );

CREATE POLICY "Users can update own dose_instances" ON public.dose_instances
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.items WHERE items.id = dose_instances.item_id AND items.user_id = auth.uid())
  );

CREATE POLICY "Users can delete own dose_instances" ON public.dose_instances
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.items WHERE items.id = dose_instances.item_id AND items.user_id = auth.uid())
  );

-- ============================================
-- STOCK POLICIES (via items)
-- ============================================

CREATE POLICY "Users can view own stock" ON public.stock
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.items WHERE items.id = stock.item_id AND items.user_id = auth.uid())
  );

CREATE POLICY "Users can insert own stock" ON public.stock
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.items WHERE items.id = stock.item_id AND items.user_id = auth.uid())
  );

CREATE POLICY "Users can update own stock" ON public.stock
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.items WHERE items.id = stock.item_id AND items.user_id = auth.uid())
  );

CREATE POLICY "Users can delete own stock" ON public.stock
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.items WHERE items.id = stock.item_id AND items.user_id = auth.uid())
  );

-- ============================================
-- SUBSCRIPTIONS POLICIES
-- ============================================

CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- NOTIFICATION PREFERENCES POLICIES
-- ============================================

CREATE POLICY "Users can view own notification preferences" ON public.notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences" ON public.notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences" ON public.notification_preferences
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notification preferences" ON public.notification_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- ALARMS POLICIES
-- ============================================

CREATE POLICY "Users can view their own alarms" ON public.alarms
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own alarms" ON public.alarms
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alarms" ON public.alarms
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alarms" ON public.alarms
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- LOCAL REMINDERS POLICIES
-- ============================================

CREATE POLICY "Usuários gerenciam seus lembretes locais" ON public.local_reminders
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================
-- NOTIFICATION LOGS POLICIES
-- ============================================

CREATE POLICY "Usuários veem suas notificações" ON public.notification_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Sistema atualiza notificações" ON public.notification_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Only service role can insert notifications" ON public.notification_logs
  FOR INSERT WITH CHECK (false);

-- ============================================
-- DOCUMENTS POLICIES
-- ============================================

CREATE POLICY "Usuários veem seus documentos" ON public.documentos_saude
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários criam seus documentos" ON public.documentos_saude
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários atualizam seus documentos" ON public.documentos_saude
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários deletam seus documentos" ON public.documentos_saude
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- CATEGORIAS (PUBLIC READ)
-- ============================================

CREATE POLICY "Todos podem ver categorias" ON public.categorias_saude
  FOR SELECT USING (true);

-- ============================================
-- EXAMES POLICIES
-- ============================================

CREATE POLICY "Usuários gerenciam seus exames" ON public.exames_laboratoriais
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================
-- VALORES EXAMES POLICIES (via exame)
-- ============================================

CREATE POLICY "Usuários veem valores de seus exames" ON public.valores_exames
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.exames_laboratoriais WHERE exames_laboratoriais.id = valores_exames.exame_id AND exames_laboratoriais.user_id = auth.uid())
  );

CREATE POLICY "Usuários inserem valores em seus exames" ON public.valores_exames
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.exames_laboratoriais WHERE exames_laboratoriais.id = valores_exames.exame_id AND exames_laboratoriais.user_id = auth.uid())
  );

CREATE POLICY "Usuários atualizam valores de seus exames" ON public.valores_exames
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.exames_laboratoriais WHERE exames_laboratoriais.id = valores_exames.exame_id AND exames_laboratoriais.user_id = auth.uid())
  );

CREATE POLICY "Usuários deletam valores de seus exames" ON public.valores_exames
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.exames_laboratoriais WHERE exames_laboratoriais.id = valores_exames.exame_id AND exames_laboratoriais.user_id = auth.uid())
  );

-- ============================================
-- CONSULTAS POLICIES
-- ============================================

CREATE POLICY "Usuários gerenciam suas consultas" ON public.consultas_medicas
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================
-- SINAIS VITAIS POLICIES
-- ============================================

CREATE POLICY "Usuários gerenciam seus sinais vitais" ON public.sinais_vitais
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================
-- HEALTH HISTORY POLICIES
-- ============================================

CREATE POLICY "Users can view own health history" ON public.health_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health history" ON public.health_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health history" ON public.health_history
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own health history" ON public.health_history
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- EVENTOS SAUDE POLICIES
-- ============================================

CREATE POLICY "Usuários veem seus eventos" ON public.eventos_saude
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários criam seus eventos" ON public.eventos_saude
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários atualizam seus eventos" ON public.eventos_saude
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários deletam seus eventos" ON public.eventos_saude
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- SIDE EFFECTS LOG POLICIES
-- ============================================

CREATE POLICY "Users can view their own side effects logs" ON public.side_effects_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own side effects logs" ON public.side_effects_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own side effects logs" ON public.side_effects_log
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own side effects logs" ON public.side_effects_log
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- SHARING POLICIES
-- ============================================

CREATE POLICY "Usuários gerenciam seus compartilhamentos" ON public.medical_shares
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários veem seus compartilhamentos" ON public.compartilhamentos_doc
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários criam seus compartilhamentos" ON public.compartilhamentos_doc
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários atualizam seus compartilhamentos" ON public.compartilhamentos_doc
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários deletam seus compartilhamentos" ON public.compartilhamentos_doc
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their consultation cards" ON public.consultation_cards
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Owners can manage their caregiver links" ON public.caregiver_links
  FOR ALL USING (auth.uid() = user_id_owner);

-- ============================================
-- REFERRAL POLICIES
-- ============================================

CREATE POLICY "Users can view their own referrals as referrer" ON public.referrals
  FOR SELECT USING (auth.uid() = referrer_user_id);

CREATE POLICY "Users can view referrals where they are referred" ON public.referrals
  FOR SELECT USING (auth.uid() = referred_user_id);

CREATE POLICY "Only service role can insert referrals" ON public.referrals
  FOR INSERT WITH CHECK (false);

CREATE POLICY "Only service role can update referrals" ON public.referrals
  FOR UPDATE USING (false);

CREATE POLICY "Users can view their own goals" ON public.referral_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" ON public.referral_goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own fraud logs" ON public.referral_fraud_logs
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = referrer_id);

-- ============================================
-- PUBLIC READ POLICIES (drug data)
-- ============================================

CREATE POLICY "Anyone can view drug interactions" ON public.drug_interactions
  FOR SELECT USING (true);

CREATE POLICY "Anyone can read medication interactions" ON public.medication_interactions
  FOR SELECT USING (true);

CREATE POLICY "Anyone can read feature flags" ON public.feature_flags
  FOR SELECT USING (true);

-- ============================================
-- AUDIT LOGS POLICIES
-- ============================================

CREATE POLICY "Usuários veem seus próprios logs" ON public.audit_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "No one can delete audit logs" ON public.audit_logs
  FOR DELETE USING (false);

-- ============================================
-- APP METRICS POLICIES
-- ============================================

CREATE POLICY "Users can view their own metrics" ON public.app_metrics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own metrics" ON public.app_metrics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- DOCUMENT EXTRACTION LOGS POLICIES
-- ============================================

CREATE POLICY "Usuários veem seus logs de extração" ON public.document_extraction_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Sistema insere logs de extração" ON public.document_extraction_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- AFFILIATE EVENTS POLICIES
-- ============================================

CREATE POLICY "Users can view their affiliate events" ON public.affiliate_events
  FOR SELECT USING (auth.uid() = user_id);
