import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const now = new Date();
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    // Buscar vacinas com próximas doses nos próximos 30 dias
    const { data: vaccines, error: vaccinesError } = await supabaseAdmin
      .from('vaccination_records')
      .select('id, user_id, profile_id, vaccine_name, dose_description, next_dose_date')
      .not('next_dose_date', 'is', null)
      .gte('next_dose_date', now.toISOString().split('T')[0])
      .lte('next_dose_date', thirtyDaysFromNow.toISOString().split('T')[0]);

    if (vaccinesError) {
      console.error('Error fetching vaccines:', vaccinesError);
      throw vaccinesError;
    }

    console.log(`Found ${vaccines?.length || 0} vaccines with upcoming doses`);

    const notificationsToCreate = [];
    const now_timestamp = now.getTime();

    interface Caregiver {
      caregiver_user_id: string;
      email_or_phone: string;
      role: string;
    }

    for (const vaccine of vaccines || []) {
      const nextDoseDate = new Date(vaccine.next_dose_date);
      const daysUntilDose = Math.ceil((nextDoseDate.getTime() - now_timestamp) / (1000 * 60 * 60 * 24));

      // Buscar cuidadores do perfil se existir profile_id
      let caregivers: Caregiver[] = [];
      if (vaccine.profile_id) {
        const { data: profileData } = await supabaseAdmin
          .from('user_profiles')
          .select('user_id')
          .eq('id', vaccine.profile_id)
          .single();

        if (profileData) {
          const { data: caregiversData } = await supabaseAdmin
            .from('caregivers')
            .select('caregiver_user_id, email_or_phone, role')
            .eq('user_id_owner', profileData.user_id)
            .not('caregiver_user_id', 'is', null)
            .not('accepted_at', 'is', null);

          caregivers = caregiversData || [];
        }
      }

      // Criar notificações para 30, 15 e 7 dias antes
      const reminderDays = [30, 15, 7];
      
      for (const reminderDay of reminderDays) {
        if (daysUntilDose <= reminderDay && daysUntilDose > (reminderDay - 1)) {
          // Verificar se já existe notificação para este lembrete
          const { data: existingNotif } = await supabaseAdmin
            .from('notification_logs')
            .select('id')
            .eq('user_id', vaccine.user_id)
            .eq('notification_type', 'vaccine_reminder')
            .eq('metadata->>vaccine_id', vaccine.id)
            .eq('metadata->>reminder_days', reminderDay.toString())
            .single();

          if (!existingNotif) {
            let title = '';
            let body = '';
            let caregiverTitle = '';
            let caregiverBody = '';

            if (reminderDay === 30) {
              title = '📅 Lembrete: Próxima dose em 30 dias';
              body = `A próxima dose de ${vaccine.vaccine_name} está agendada para ${nextDoseDate.toLocaleDateString('pt-BR')}`;
              caregiverTitle = '📅 Lembrete: Dose do dependente em 30 dias';
              caregiverBody = `Próxima dose de ${vaccine.vaccine_name} do seu dependente está agendada para ${nextDoseDate.toLocaleDateString('pt-BR')}`;
            } else if (reminderDay === 15) {
              title = '⏰ Lembrete: Próxima dose em 15 dias';
              body = `Não esqueça: próxima dose de ${vaccine.vaccine_name} em ${nextDoseDate.toLocaleDateString('pt-BR')}`;
              caregiverTitle = '⏰ Lembrete: Dose do dependente em 15 dias';
              caregiverBody = `Não esqueça: próxima dose de ${vaccine.vaccine_name} do seu dependente em ${nextDoseDate.toLocaleDateString('pt-BR')}`;
            } else if (reminderDay === 7) {
              title = '🚨 Atenção: Próxima dose em 7 dias!';
              body = `Importante: próxima dose de ${vaccine.vaccine_name} está próxima - ${nextDoseDate.toLocaleDateString('pt-BR')}`;
              caregiverTitle = '🚨 Atenção: Dose do dependente em 7 dias!';
              caregiverBody = `Importante: próxima dose de ${vaccine.vaccine_name} do seu dependente está próxima - ${nextDoseDate.toLocaleDateString('pt-BR')}`;
            }

            // Notificação para o dono do perfil
            notificationsToCreate.push({
              user_id: vaccine.user_id,
              notification_type: 'vaccine_reminder',
              title,
              body,
              scheduled_at: now.toISOString(),
              delivery_status: 'pending',
              metadata: {
                vaccine_id: vaccine.id,
                profile_id: vaccine.profile_id,
                vaccine_name: vaccine.vaccine_name,
                next_dose_date: vaccine.next_dose_date,
                reminder_days: reminderDay,
                is_owner: true
              }
            });

            // Notificações para cuidadores
            for (const caregiver of caregivers) {
              // Verificar se já existe notificação para este cuidador
              const { data: existingCaregiverNotif } = await supabaseAdmin
                .from('notification_logs')
                .select('id')
                .eq('user_id', caregiver.caregiver_user_id)
                .eq('notification_type', 'vaccine_reminder_caregiver')
                .eq('metadata->>vaccine_id', vaccine.id)
                .eq('metadata->>reminder_days', reminderDay.toString())
                .single();

              if (!existingCaregiverNotif) {
                notificationsToCreate.push({
                  user_id: caregiver.caregiver_user_id,
                  notification_type: 'vaccine_reminder_caregiver',
                  title: caregiverTitle,
                  body: caregiverBody,
                  scheduled_at: now.toISOString(),
                  delivery_status: 'pending',
                  metadata: {
                    vaccine_id: vaccine.id,
                    profile_id: vaccine.profile_id,
                    vaccine_name: vaccine.vaccine_name,
                    next_dose_date: vaccine.next_dose_date,
                    reminder_days: reminderDay,
                    is_caregiver: true,
                    caregiver_role: caregiver.role
                  }
                });
              }
            }
          }
        }
      }
    }

    // Inserir notificações em batch
    if (notificationsToCreate.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('notification_logs')
        .insert(notificationsToCreate);

      if (insertError) {
        console.error('Error inserting notifications:', insertError);
        throw insertError;
      }

      console.log(`Created ${notificationsToCreate.length} vaccine reminder notifications`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        vaccines_checked: vaccines?.length || 0,
        notifications_created: notificationsToCreate.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in schedule-vaccine-reminders:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
