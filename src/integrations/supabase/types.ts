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
          created_at: string | null
          expires_at: string | null
          file_path: string
          id: string
          issued_at: string | null
          meta: Json | null
          mime_type: string
          notes: string | null
          ocr_text: string | null
          profile_id: string | null
          provider: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          categoria_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          file_path: string
          id?: string
          issued_at?: string | null
          meta?: Json | null
          mime_type: string
          notes?: string | null
          ocr_text?: string | null
          profile_id?: string | null
          provider?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          categoria_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          file_path?: string
          id?: string
          issued_at?: string | null
          meta?: Json | null
          mime_type?: string
          notes?: string | null
          ocr_text?: string | null
          profile_id?: string | null
          provider?: string | null
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
          profile_id: string | null
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
          profile_id?: string | null
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
          profile_id?: string | null
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
      profiles: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          created_at: string | null
          full_name: string | null
          height_cm: number | null
          id: string
          nickname: string | null
          updated_at: string | null
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string | null
          full_name?: string | null
          height_cm?: number | null
          id?: string
          nickname?: string | null
          updated_at?: string | null
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string | null
          full_name?: string | null
          height_cm?: number | null
          id?: string
          nickname?: string | null
          updated_at?: string | null
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: []
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
      stock: {
        Row: {
          id: string
          item_id: string
          projected_end_at: string | null
          unit_label: string | null
          units_left: number
          units_total: number
          updated_at: string | null
        }
        Insert: {
          id?: string
          item_id: string
          projected_end_at?: string | null
          unit_label?: string | null
          units_left?: number
          units_total?: number
          updated_at?: string | null
        }
        Update: {
          id?: string
          item_id?: string
          projected_end_at?: string | null
          unit_label?: string | null
          units_left?: number
          units_total?: number
          updated_at?: string | null
        }
        Relationships: [
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
      has_consent: {
        Args: {
          p_purpose: Database["public"]["Enums"]["consent_purpose"]
          p_user_id: string
        }
        Returns: boolean
      }
      is_on_trial: { Args: { p_user_id: string }; Returns: boolean }
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
