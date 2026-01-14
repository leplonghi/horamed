export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      affiliate_events: {
        Row: {
          affiliate_id: string | null
          created_at: string
          event_type: string
          id: string
          medication_id: string | null
          user_id: string | null
          utm_params: Json | null
        }
        Insert: {
          affiliate_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          medication_id?: string | null
          user_id?: string | null
          utm_params?: Json | null
        }
        Update: {
          affiliate_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          medication_id?: string | null
          user_id?: string | null
          utm_params?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_events_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_events_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          base_url: string
          created_at: string
          enabled: boolean
          id: string
          metadata: Json | null
          name: string
          utm_source: string
        }
        Insert: {
          base_url: string
          created_at?: string
          enabled?: boolean
          id?: string
          metadata?: Json | null
          name: string
          utm_source: string
        }
        Update: {
          base_url?: string
          created_at?: string
          enabled?: boolean
          id?: string
          metadata?: Json | null
          name?: string
          utm_source?: string
        }
        Relationships: []
      }
      alarms: {
        Row: {
          action: string | null
          category: string | null
          created_at: string
          enabled: boolean
          id: string
          last_triggered: string | null
          message: string | null
          metadata: Json | null
          recurrence: string
          require_interaction: boolean
          scheduled_at: string
          silent: boolean
          sound: boolean
          title: string
          updated_at: string
          url: string | null
          user_id: string
          vibrate: boolean
        }
        Insert: {
          action?: string | null
          category?: string | null
          created_at?: string
          enabled?: boolean
          id?: string
          last_triggered?: string | null
          message?: string | null
          metadata?: Json | null
          recurrence?: string
          require_interaction?: boolean
          scheduled_at: string
          silent?: boolean
          sound?: boolean
          title: string
          updated_at?: string
          url?: string | null
          user_id: string
          vibrate?: boolean
        }
        Update: {
          action?: string | null
          category?: string | null
          created_at?: string
          enabled?: boolean
          id?: string
          last_triggered?: string | null
          message?: string | null
          metadata?: Json | null
          recurrence?: string
          require_interaction?: boolean
          scheduled_at?: string
          silent?: boolean
          sound?: boolean
          title?: string
          updated_at?: string
          url?: string | null
          user_id?: string
          vibrate?: boolean
        }
        Relationships: []
      }
      app_metrics: {
        Row: {
          created_at: string
          event_data: Json | null
          event_name: string
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_name: string
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_name?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown
          metadata: Json | null
          resource: string
          resource_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          resource: string
          resource_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          resource?: string
          resource_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      caregiver_links: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          metadata: Json | null
          revoked_at: string | null
          token: string
          user_id_owner: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          metadata?: Json | null
          revoked_at?: string | null
          token: string
          user_id_owner: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          metadata?: Json | null
          revoked_at?: string | null
          token?: string
          user_id_owner?: string
        }
        Relationships: []
      }
      caregivers: {
        Row: {
          accepted_at: string | null
          caregiver_user_id: string | null
          created_at: string
          email_or_phone: string
          id: string
          invited_at: string
          role: Database["public"]["Enums"]["caregiver_role"]
          user_id_owner: string
        }
        Insert: {
          accepted_at?: string | null
          caregiver_user_id?: string | null
          created_at?: string
          email_or_phone: string
          id?: string
          invited_at?: string
          role?: Database["public"]["Enums"]["caregiver_role"]
          user_id_owner: string
        }
        Update: {
          accepted_at?: string | null
          caregiver_user_id?: string | null
          created_at?: string
          email_or_phone?: string
          id?: string
          invited_at?: string
          role?: Database["public"]["Enums"]["caregiver_role"]
          user_id_owner?: string
        }
        Relationships: []
      }
      categorias_saude: {
        Row: {
          created_at: string | null
          id: string
          label: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          label: string
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: string
          label?: string
          slug?: string
        }
        Relationships: []
      }
      compartilhamentos_doc: {
        Row: {
          allow_download: boolean | null
          created_at: string | null
          document_id: string
          expires_at: string | null
          id: string
          revoked_at: string | null
          token: string
          user_id: string
        }
        Insert: {
          allow_download?: boolean | null
          created_at?: string | null
          document_id: string
          expires_at?: string | null
          id?: string
          revoked_at?: string | null
          token: string
          user_id: string
        }
        Update: {
          allow_download?: boolean | null
          created_at?: string | null
          document_id?: string
          expires_at?: string | null
          id?: string
          revoked_at?: string | null
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compartilhamentos_doc_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documentos_saude"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compartilhamentos_doc_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "medical_exams_v"
            referencedColumns: ["id"]
          },
        ]
      }
      consents: {
        Row: {
          created_at: string
          granted: boolean
          granted_at: string | null
          id: string
          ip_address: unknown
          purpose: Database["public"]["Enums"]["consent_purpose"]
          revoked_at: string | null
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          granted?: boolean
          granted_at?: string | null
          id?: string
          ip_address?: unknown
          purpose: Database["public"]["Enums"]["consent_purpose"]
          revoked_at?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          granted?: boolean
          granted_at?: string | null
          id?: string
          ip_address?: unknown
          purpose?: Database["public"]["Enums"]["consent_purpose"]
          revoked_at?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      consultas_medicas: {
        Row: {
          created_at: string
          data_consulta: string
          documento_id: string | null
          especialidade: string | null
          id: string
          local: string | null
          medico_nome: string | null
          motivo: string | null
          observacoes: string | null
          profile_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_consulta: string
          documento_id?: string | null
          especialidade?: string | null
          id?: string
          local?: string | null
          medico_nome?: string | null
          motivo?: string | null
          observacoes?: string | null
          profile_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_consulta?: string
          documento_id?: string | null
          especialidade?: string | null
          id?: string
          local?: string | null
          medico_nome?: string | null
          motivo?: string | null
          observacoes?: string | null
          profile_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultas_medicas_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos_saude"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultas_medicas_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "medical_exams_v"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultas_medicas_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      consultation_cards: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          profile_id: string | null
          revoked_at: string | null
          token: string
          user_id: string
          views_count: number
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          profile_id?: string | null
          revoked_at?: string | null
          token: string
          user_id: string
          views_count?: number
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          profile_id?: string | null
          revoked_at?: string | null
          token?: string
          user_id?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "consultation_cards_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_extraction_logs: {
        Row: {
          confidence_score: number | null
          created_at: string
          document_id: string | null
          error_message: string | null
          extracted_fields: Json | null
          extraction_type: string
          file_path: string
          id: string
          mime_type: string
          pages_count: number | null
          processing_time_ms: number | null
          status: string
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          document_id?: string | null
          error_message?: string | null
          extracted_fields?: Json | null
          extraction_type: string
          file_path: string
          id?: string
          mime_type: string
          pages_count?: number | null
          processing_time_ms?: number | null
          status: string
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          document_id?: string | null
          error_message?: string | null
          extracted_fields?: Json | null
          extraction_type?: string
          file_path?: string
          id?: string
          mime_type?: string
          pages_count?: number | null
          processing_time_ms?: number | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_extraction_logs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documentos_saude"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_extraction_logs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "medical_exams_v"
            referencedColumns: ["id"]
          },
        ]
      }
      document_shares: {
        Row: {
          allow_download: boolean
          created_at: string
          document_id: string
          expires_at: string
          id: string
          revoked_at: string | null
          token: string
          user_id: string
          views_count: number
        }
        Insert: {
          allow_download?: boolean
          created_at?: string
          document_id: string
          expires_at: string
          id?: string
          revoked_at?: string | null
          token: string
          user_id: string
          views_count?: number
        }
        Update: {
          allow_download?: boolean
          created_at?: string
          document_id?: string
          expires_at?: string
          id?: string
          revoked_at?: string | null
          token?: string
          user_id?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_shares_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documentos_saude"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_shares_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "medical_exams_v"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_saude: {
        Row: {
          categoria_id: string | null
          confidence_score: number | null
          created_at: string | null
          expires_at: string | null
          extraction_attempted_at: string | null
          extraction_error: string | null
          file_path: string
          id: string
          issued_at: string | null
          meta: Json | null
          mime_type: string
          notes: string | null
          ocr_text: string | null
          profile_id: string | null
          provider: string | null
          reviewed_at: string | null
          status_extraction: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          categoria_id?: string | null
          confidence_score?: number | null
          created_at?: string | null
          expires_at?: string | null
          extraction_attempted_at?: string | null
          extraction_error?: string | null
          file_path: string
          id?: string
          issued_at?: string | null
          meta?: Json | null
          mime_type: string
          notes?: string | null
          ocr_text?: string | null
          profile_id?: string | null
          provider?: string | null
          reviewed_at?: string | null
          status_extraction?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          categoria_id?: string | null
          confidence_score?: number | null
          created_at?: string | null
          expires_at?: string | null
          extraction_attempted_at?: string | null
          extraction_error?: string | null
          file_path?: string
          id?: string
          issued_at?: string | null
          meta?: Json | null
          mime_type?: string
          notes?: string | null
          ocr_text?: string | null
          profile_id?: string | null
          provider?: string | null
          reviewed_at?: string | null
          status_extraction?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_saude_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_saude"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_saude_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dose_instances: {
        Row: {
          actor_id: string | null
          actor_type: string | null
          created_at: string | null
          delay_minutes: number | null
          due_at: string
          id: string
          item_id: string
          schedule_id: string
          skip_reason: string | null
          status: string
          taken_at: string | null
        }
        Insert: {
          actor_id?: string | null
          actor_type?: string | null
          created_at?: string | null
          delay_minutes?: number | null
          due_at: string
          id?: string
          item_id: string
          schedule_id: string
          skip_reason?: string | null
          status?: string
          taken_at?: string | null
        }
        Update: {
          actor_id?: string | null
          actor_type?: string | null
          created_at?: string | null
          delay_minutes?: number | null
          due_at?: string
          id?: string
          item_id?: string
          schedule_id?: string
          skip_reason?: string | null
          status?: string
          taken_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dose_instances_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dose_instances_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      drug_interactions: {
        Row: {
          created_at: string | null
          description: string
          drug_a: string
          drug_b: string
          id: string
          interaction_type: string
          recommendation: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          drug_a: string
          drug_b: string
          id?: string
          interaction_type: string
          recommendation?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          drug_a?: string
          drug_b?: string
          id?: string
          interaction_type?: string
          recommendation?: string | null
        }
        Relationships: []
      }
      eventos_saude: {
        Row: {
          completed_at: string | null
          created_at: string | null
          due_date: string
          id: string
          notes: string | null
          profile_id: string | null
          related_document_id: string | null
          title: string
          type: Database["public"]["Enums"]["health_event_type"]
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          due_date: string
          id?: string
          notes?: string | null
          profile_id?: string | null
          related_document_id?: string | null
          title: string
          type: Database["public"]["Enums"]["health_event_type"]
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          due_date?: string
          id?: string
          notes?: string | null
          profile_id?: string | null
          related_document_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["health_event_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventos_saude_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_saude_related_document_id_fkey"
            columns: ["related_document_id"]
            isOneToOne: false
            referencedRelation: "documentos_saude"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_saude_related_document_id_fkey"
            columns: ["related_document_id"]
            isOneToOne: false
            referencedRelation: "medical_exams_v"
            referencedColumns: ["id"]
          },
        ]
      }
      exames_laboratoriais: {
        Row: {
          created_at: string
          data_exame: string
          documento_id: string | null
          id: string
          laboratorio: string | null
          medico_solicitante: string | null
          profile_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_exame: string
          documento_id?: string | null
          id?: string
          laboratorio?: string | null
          medico_solicitante?: string | null
          profile_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_exame?: string
          documento_id?: string | null
          id?: string
          laboratorio?: string | null
          medico_solicitante?: string | null
          profile_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exames_laboratoriais_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos_saude"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exames_laboratoriais_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "medical_exams_v"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exames_laboratoriais_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      extraction_cache: {
        Row: {
          created_at: string
          extracted_data: Json
          extraction_type: string
          id: string
          image_hash: string
          user_id: string
        }
        Insert: {
          created_at?: string
          extracted_data: Json
          extraction_type: string
          id?: string
          image_hash: string
          user_id: string
        }
        Update: {
          created_at?: string
          extracted_data?: Json
          extraction_type?: string
          id?: string
          image_hash?: string
          user_id?: string
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          config: Json | null
          created_at: string | null
          enabled: boolean
          id: string
          key: string
          updated_at: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          enabled?: boolean
          id?: string
          key: string
          updated_at?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          enabled?: boolean
          id?: string
          key?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      health_history: {
        Row: {
          created_at: string
          height_cm: number | null
          id: string
          recorded_at: string
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          created_at?: string
          height_cm?: number | null
          id?: string
          recorded_at?: string
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          created_at?: string
          height_cm?: number | null
          id?: string
          recorded_at?: string
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      health_insights: {
        Row: {
          created_at: string | null
          description: string
          id: string
          insight_type: string
          is_read: boolean | null
          metadata: Json | null
          profile_id: string | null
          severity: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          insight_type: string
          is_read?: boolean | null
          metadata?: Json | null
          profile_id?: string | null
          severity?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          insight_type?: string
          is_read?: boolean | null
          metadata?: Json | null
          profile_id?: string | null
          severity?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_insights_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          category: string | null
          created_at: string | null
          dose_text: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          notification_type: string | null
          profile_id: string | null
          total_doses: number | null
          treatment_duration_days: number | null
          treatment_end_date: string | null
          treatment_start_date: string | null
          updated_at: string | null
          user_id: string
          with_food: boolean | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          dose_text?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          notification_type?: string | null
          profile_id?: string | null
          total_doses?: number | null
          treatment_duration_days?: number | null
          treatment_end_date?: string | null
          treatment_start_date?: string | null
          updated_at?: string | null
          user_id: string
          with_food?: boolean | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          dose_text?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          notification_type?: string | null
          profile_id?: string | null
          total_doses?: number | null
          treatment_duration_days?: number | null
          treatment_end_date?: string | null
          treatment_start_date?: string | null
          updated_at?: string | null
          user_id?: string
          with_food?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "items_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      local_reminders: {
        Row: {
          created_at: string
          dose_id: string
          id: string
          last_retry_at: string | null
          notification_data: Json
          retry_count: number | null
          scheduled_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dose_id: string
          id?: string
          last_retry_at?: string | null
          notification_data: Json
          retry_count?: number | null
          scheduled_at: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dose_id?: string
          id?: string
          last_retry_at?: string | null
          notification_data?: Json
          retry_count?: number | null
          scheduled_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      medical_exams: {
        Row: {
          created_at: string | null
          exam_date: string | null
          extracted_data: Json | null
          file_name: string
          file_url: string
          id: string
          notes: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          exam_date?: string | null
          extracted_data?: Json | null
          file_name: string
          file_url: string
          id?: string
          notes?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          exam_date?: string | null
          extracted_data?: Json | null
          file_name?: string
          file_url?: string
          id?: string
          notes?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      medical_shares: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          profile_id: string | null
          revoked_at: string | null
          token: string
          user_id: string
          views_count: number
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          profile_id?: string | null
          revoked_at?: string | null
          token: string
          user_id: string
          views_count?: number
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          profile_id?: string | null
          revoked_at?: string | null
          token?: string
          user_id?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "medical_shares_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_interactions: {
        Row: {
          created_at: string | null
          description: string
          drug_a: string
          drug_b: string
          id: string
          mechanism: string | null
          recommendation: string | null
          severity: string
          source: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          drug_a: string
          drug_b: string
          id?: string
          mechanism?: string | null
          recommendation?: string | null
          severity: string
          source?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          drug_a?: string
          drug_b?: string
          id?: string
          mechanism?: string | null
          recommendation?: string | null
          severity?: string
          source?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notification_logs: {
        Row: {
          body: string
          created_at: string
          delivery_status: string
          dose_id: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          notification_type: string
          scheduled_at: string
          sent_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          delivery_status?: string
          dose_id?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          notification_type: string
          scheduled_at: string
          sent_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          delivery_status?: string
          dose_id?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          notification_type?: string
          scheduled_at?: string
          sent_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_dose_id_fkey"
            columns: ["dose_id"]
            isOneToOne: false
            referencedRelation: "dose_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_metrics: {
        Row: {
          created_at: string
          delivery_status: string
          dose_id: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          notification_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delivery_status: string
          dose_id?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          notification_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          delivery_status?: string
          dose_id?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          notification_type?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          email_enabled: boolean | null
          id: string
          push_enabled: boolean | null
          push_token: string | null
          updated_at: string | null
          user_id: string
          whatsapp_api_token: string | null
          whatsapp_enabled: boolean | null
          whatsapp_instance_id: string | null
          whatsapp_number: string | null
        }
        Insert: {
          created_at?: string | null
          email_enabled?: boolean | null
          id?: string
          push_enabled?: boolean | null
          push_token?: string | null
          updated_at?: string | null
          user_id: string
          whatsapp_api_token?: string | null
          whatsapp_enabled?: boolean | null
          whatsapp_instance_id?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          created_at?: string | null
          email_enabled?: boolean | null
          id?: string
          push_enabled?: boolean | null
          push_token?: string | null
          updated_at?: string | null
          user_id?: string
          whatsapp_api_token?: string | null
          whatsapp_enabled?: boolean | null
          whatsapp_instance_id?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      premium_emails: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          cpf: string | null
          cpf_verified: boolean | null
          created_at: string | null
          device_fingerprint: string | null
          email_verified: boolean | null
          full_name: string | null
          height_cm: number | null
          id: string
          nickname: string | null
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
          referral_code: string | null
          tutorial_flags: Json | null
          updated_at: string | null
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          cpf?: string | null
          cpf_verified?: boolean | null
          created_at?: string | null
          device_fingerprint?: string | null
          email_verified?: boolean | null
          full_name?: string | null
          height_cm?: number | null
          id?: string
          nickname?: string | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          referral_code?: string | null
          tutorial_flags?: Json | null
          updated_at?: string | null
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          cpf?: string | null
          cpf_verified?: boolean | null
          created_at?: string | null
          device_fingerprint?: string | null
          email_verified?: boolean | null
          full_name?: string | null
          height_cm?: number | null
          id?: string
          nickname?: string | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          referral_code?: string | null
          tutorial_flags?: Json | null
          updated_at?: string | null
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      referral_discounts: {
        Row: {
          created_at: string | null
          cycles_used: number | null
          discount_percent: number
          id: string
          max_cycles: number | null
          stripe_coupon_id: string | null
          updated_at: string | null
          user_id: string
          valid_until: string | null
        }
        Insert: {
          created_at?: string | null
          cycles_used?: number | null
          discount_percent?: number
          id?: string
          max_cycles?: number | null
          stripe_coupon_id?: string | null
          updated_at?: string | null
          user_id: string
          valid_until?: string | null
        }
        Update: {
          created_at?: string | null
          cycles_used?: number | null
          discount_percent?: number
          id?: string
          max_cycles?: number | null
          stripe_coupon_id?: string | null
          updated_at?: string | null
          user_id?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      referral_fraud_logs: {
        Row: {
          action_taken: string | null
          created_at: string | null
          details: Json | null
          device_fingerprint: string | null
          fraud_type: string
          id: string
          ip_address: unknown
          referral_id: string | null
          referrer_id: string | null
          user_id: string | null
        }
        Insert: {
          action_taken?: string | null
          created_at?: string | null
          details?: Json | null
          device_fingerprint?: string | null
          fraud_type: string
          id?: string
          ip_address?: unknown
          referral_id?: string | null
          referrer_id?: string | null
          user_id?: string | null
        }
        Update: {
          action_taken?: string | null
          created_at?: string | null
          details?: Json | null
          device_fingerprint?: string | null
          fraud_type?: string
          id?: string
          ip_address?: unknown
          referral_id?: string | null
          referrer_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_fraud_logs_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_goals: {
        Row: {
          completed_at: string | null
          created_at: string | null
          current_count: number | null
          goal_type: string
          id: string
          reward_granted: boolean | null
          target_count: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          current_count?: number | null
          goal_type: string
          id?: string
          reward_granted?: boolean | null
          target_count: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          current_count?: number | null
          goal_type?: string
          id?: string
          reward_granted?: boolean | null
          target_count?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      referral_rewards: {
        Row: {
          created_at: string | null
          expires_at: string | null
          granted_at: string | null
          id: string
          metadata: Json | null
          redeemed_at: string | null
          referral_id: string
          reward_type: string
          reward_value: number | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          granted_at?: string | null
          id?: string
          metadata?: Json | null
          redeemed_at?: string | null
          referral_id: string
          reward_type: string
          reward_value?: number | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          granted_at?: string | null
          id?: string
          metadata?: Json | null
          redeemed_at?: string | null
          referral_id?: string
          reward_type?: string
          reward_value?: number | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_rewards_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          activated_at: string | null
          created_at: string
          id: string
          metadata: Json | null
          plan_type: string
          referral_code_used: string
          referred_user_id: string | null
          referrer_user_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          activated_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          plan_type: string
          referral_code_used: string
          referred_user_id?: string | null
          referrer_user_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          activated_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          plan_type?: string
          referral_code_used?: string
          referred_user_id?: string | null
          referrer_user_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_referral_code"
            columns: ["referral_code_used"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["referral_code"]
          },
        ]
      }
      schedules: {
        Row: {
          created_at: string | null
          day_of_month: number | null
          days_of_week: number[] | null
          freq_type: string
          id: string
          is_active: boolean | null
          item_id: string
          times: Json
        }
        Insert: {
          created_at?: string | null
          day_of_month?: number | null
          days_of_week?: number[] | null
          freq_type: string
          id?: string
          is_active?: boolean | null
          item_id: string
          times?: Json
        }
        Update: {
          created_at?: string | null
          day_of_month?: number | null
          days_of_week?: number[] | null
          freq_type?: string
          id?: string
          is_active?: boolean | null
          item_id?: string
          times?: Json
        }
        Relationships: [
          {
            foreignKeyName: "schedules_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      side_effects_log: {
        Row: {
          created_at: string
          dose_id: string | null
          energy_level: number | null
          id: string
          item_id: string | null
          nausea_level: number | null
          notes: string | null
          overall_feeling: number | null
          pain_level: number | null
          profile_id: string | null
          recorded_at: string
          side_effect_tags: string[] | null
          sleep_quality: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dose_id?: string | null
          energy_level?: number | null
          id?: string
          item_id?: string | null
          nausea_level?: number | null
          notes?: string | null
          overall_feeling?: number | null
          pain_level?: number | null
          profile_id?: string | null
          recorded_at?: string
          side_effect_tags?: string[] | null
          sleep_quality?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dose_id?: string | null
          energy_level?: number | null
          id?: string
          item_id?: string | null
          nausea_level?: number | null
          notes?: string | null
          overall_feeling?: number | null
          pain_level?: number | null
          profile_id?: string | null
          recorded_at?: string
          side_effect_tags?: string[] | null
          sleep_quality?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "side_effects_log_dose_id_fkey"
            columns: ["dose_id"]
            isOneToOne: false
            referencedRelation: "dose_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "side_effects_log_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "side_effects_log_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sinais_vitais: {
        Row: {
          created_at: string
          data_medicao: string
          frequencia_cardiaca: number | null
          glicemia: number | null
          id: string
          observacoes: string | null
          peso_kg: number | null
          pressao_diastolica: number | null
          pressao_sistolica: number | null
          profile_id: string | null
          saturacao_oxigenio: number | null
          temperatura: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          data_medicao?: string
          frequencia_cardiaca?: number | null
          glicemia?: number | null
          id?: string
          observacoes?: string | null
          peso_kg?: number | null
          pressao_diastolica?: number | null
          pressao_sistolica?: number | null
          profile_id?: string | null
          saturacao_oxigenio?: number | null
          temperatura?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          data_medicao?: string
          frequencia_cardiaca?: number | null
          glicemia?: number | null
          id?: string
          observacoes?: string | null
          peso_kg?: number | null
          pressao_diastolica?: number | null
          pressao_sistolica?: number | null
          profile_id?: string | null
          saturacao_oxigenio?: number | null
          temperatura?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sinais_vitais_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stock: {
        Row: {
          consumption_history: Json | null
          created_from_prescription_id: string | null
          id: string
          item_id: string
          last_refill_at: string | null
          projected_end_at: string | null
          unit_label: string | null
          units_left: number
          units_total: number
          updated_at: string | null
        }
        Insert: {
          consumption_history?: Json | null
          created_from_prescription_id?: string | null
          id?: string
          item_id: string
          last_refill_at?: string | null
          projected_end_at?: string | null
          unit_label?: string | null
          units_left?: number
          units_total?: number
          updated_at?: string | null
        }
        Update: {
          consumption_history?: Json | null
          created_from_prescription_id?: string | null
          id?: string
          item_id?: string
          last_refill_at?: string | null
          projected_end_at?: string | null
          unit_label?: string | null
          units_left?: number
          units_total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_created_from_prescription_id_fkey"
            columns: ["created_from_prescription_id"]
            isOneToOne: false
            referencedRelation: "documentos_saude"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_created_from_prescription_id_fkey"
            columns: ["created_from_prescription_id"]
            isOneToOne: false
            referencedRelation: "medical_exams_v"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: true
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          canceled_at: string | null
          created_at: string
          expires_at: string | null
          id: string
          plan_type: string
          price_variant: string | null
          pricing_variant: string | null
          started_at: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_ends_at: string | null
          trial_used: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          canceled_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_type: string
          price_variant?: string | null
          pricing_variant?: string | null
          started_at?: string
          status: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          trial_used?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          canceled_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_type?: string
          price_variant?: string | null
          pricing_variant?: string | null
          started_at?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          trial_used?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_interaction_alerts: {
        Row: {
          acknowledged_at: string | null
          created_at: string | null
          dismissed_at: string | null
          id: string
          interaction_id: string | null
          item_a_id: string | null
          item_b_id: string | null
          profile_id: string | null
          severity: string
          user_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          created_at?: string | null
          dismissed_at?: string | null
          id?: string
          interaction_id?: string | null
          item_a_id?: string | null
          item_b_id?: string | null
          profile_id?: string | null
          severity: string
          user_id: string
        }
        Update: {
          acknowledged_at?: string | null
          created_at?: string | null
          dismissed_at?: string | null
          id?: string
          interaction_id?: string | null
          item_a_id?: string | null
          item_b_id?: string | null
          profile_id?: string | null
          severity?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_interaction_alerts_interaction_id_fkey"
            columns: ["interaction_id"]
            isOneToOne: false
            referencedRelation: "medication_interactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_interaction_alerts_item_a_id_fkey"
            columns: ["item_a_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_interaction_alerts_item_b_id_fkey"
            columns: ["item_b_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_interaction_alerts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          created_at: string | null
          id: string
          is_primary: boolean | null
          name: string
          relationship: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          name: string
          relationship?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          name?: string
          relationship?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      vaccination_records: {
        Row: {
          adverse_reactions: string | null
          application_date: string
          batch_number: string | null
          created_at: string | null
          disease_prevention: string | null
          document_id: string | null
          dose_description: string | null
          dose_number: number | null
          expiry_date: string | null
          id: string
          manufacturer: string | null
          next_dose_date: string | null
          notes: string | null
          official_source: string | null
          profile_id: string | null
          sus_card_number: string | null
          updated_at: string | null
          user_id: string
          vaccination_location: string | null
          vaccinator_name: string | null
          vaccinator_registration: string | null
          vaccine_name: string
          vaccine_type: string | null
        }
        Insert: {
          adverse_reactions?: string | null
          application_date: string
          batch_number?: string | null
          created_at?: string | null
          disease_prevention?: string | null
          document_id?: string | null
          dose_description?: string | null
          dose_number?: number | null
          expiry_date?: string | null
          id?: string
          manufacturer?: string | null
          next_dose_date?: string | null
          notes?: string | null
          official_source?: string | null
          profile_id?: string | null
          sus_card_number?: string | null
          updated_at?: string | null
          user_id: string
          vaccination_location?: string | null
          vaccinator_name?: string | null
          vaccinator_registration?: string | null
          vaccine_name: string
          vaccine_type?: string | null
        }
        Update: {
          adverse_reactions?: string | null
          application_date?: string
          batch_number?: string | null
          created_at?: string | null
          disease_prevention?: string | null
          document_id?: string | null
          dose_description?: string | null
          dose_number?: number | null
          expiry_date?: string | null
          id?: string
          manufacturer?: string | null
          next_dose_date?: string | null
          notes?: string | null
          official_source?: string | null
          profile_id?: string | null
          sus_card_number?: string | null
          updated_at?: string | null
          user_id?: string
          vaccination_location?: string | null
          vaccinator_name?: string | null
          vaccinator_registration?: string | null
          vaccine_name?: string
          vaccine_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vaccination_records_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documentos_saude"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccination_records_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "medical_exams_v"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccination_records_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      valores_exames: {
        Row: {
          created_at: string
          exame_id: string
          id: string
          parametro: string
          referencia_max: number | null
          referencia_min: number | null
          referencia_texto: string | null
          status: string | null
          unidade: string | null
          valor: number | null
          valor_texto: string | null
        }
        Insert: {
          created_at?: string
          exame_id: string
          id?: string
          parametro: string
          referencia_max?: number | null
          referencia_min?: number | null
          referencia_texto?: string | null
          status?: string | null
          unidade?: string | null
          valor?: number | null
          valor_texto?: string | null
        }
        Update: {
          created_at?: string
          exame_id?: string
          id?: string
          parametro?: string
          referencia_max?: number | null
          referencia_min?: number | null
          referencia_texto?: string | null
          status?: string | null
          unidade?: string | null
          valor?: number | null
          valor_texto?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "valores_exames_exame_id_fkey"
            columns: ["exame_id"]
            isOneToOne: false
            referencedRelation: "exames_laboratoriais"
            referencedColumns: ["id"]
          },
        ]
      }
      weight_logs: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          profile_id: string | null
          recorded_at: string
          user_id: string
          weight_kg: number
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          profile_id?: string | null
          recorded_at?: string
          user_id: string
          weight_kg: number
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          profile_id?: string | null
          recorded_at?: string
          user_id?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "weight_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      medical_exams_v: {
        Row: {
          created_at: string | null
          exam_date: string | null
          extracted_data: string | null
          file_name: string | null
          file_url: string | null
          id: string | null
          notes: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
      user_adherence_streaks: {
        Row: {
          current_streak: number | null
          longest_streak: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_projected_end_at: {
        Args: { p_stock_id: string }
        Returns: string
      }
      check_and_grant_referral_goals: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      check_device_duplicate: {
        Args: { p_fingerprint: string; p_user_id: string }
        Returns: boolean
      }
      complete_referral_onboarding: {
        Args: { p_user_id: string }
        Returns: Json
      }
      generate_referral_code: { Args: never; Returns: string }
      get_user_referral_discount: {
        Args: { p_user_id: string }
        Returns: number
      }
      has_consent: {
        Args: {
          p_purpose: Database["public"]["Enums"]["consent_purpose"]
          p_user_id: string
        }
        Returns: boolean
      }
      is_on_trial: { Args: { p_user_id: string }; Returns: boolean }
      process_referral_subscription: {
        Args: {
          p_plan_type: string
          p_referred_user_id: string
          p_subscription_days?: number
        }
        Returns: Json
      }
      validate_referral_signup: {
        Args: {
          p_device_fingerprint: string
          p_ip_address: unknown
          p_referral_code: string
          p_referred_user_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      caregiver_role: "viewer" | "helper"
      consent_purpose:
        | "health_data"
        | "notifications"
        | "data_sharing"
        | "marketing"
        | "analytics"
      health_event_type:
        | "checkup"
        | "reforco_vacina"
        | "renovacao_exame"
        | "consulta"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      caregiver_role: ["viewer", "helper"],
      consent_purpose: [
        "health_data",
        "notifications",
        "data_sharing",
        "marketing",
        "analytics",
      ],
      health_event_type: [
        "checkup",
        "reforco_vacina",
        "renovacao_exame",
        "consulta",
      ],
    },
  },
} as const
