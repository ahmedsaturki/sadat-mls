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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_events: {
        Row: {
          actor_id: string | null
          actor_type: string
          after_state: Json | null
          before_state: Json | null
          correlation_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          event_type: string
          id: string
          payload: Json
          reason: string | null
        }
        Insert: {
          actor_id?: string | null
          actor_type?: string
          after_state?: Json | null
          before_state?: Json | null
          correlation_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_type: string
          id?: string
          payload?: Json
          reason?: string | null
        }
        Update: {
          actor_id?: string | null
          actor_type?: string
          after_state?: Json | null
          before_state?: Json | null
          correlation_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string
          id?: string
          payload?: Json
          reason?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          confidence: number | null
          contact_type: string
          created_at: string
          id: string
          is_primary: boolean
          normalized_value: string | null
          person_id: string | null
          value: string
          verified: boolean
        }
        Insert: {
          confidence?: number | null
          contact_type: string
          created_at?: string
          id?: string
          is_primary?: boolean
          normalized_value?: string | null
          person_id?: string | null
          value: string
          verified?: boolean
        }
        Update: {
          confidence?: number | null
          contact_type?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          normalized_value?: string | null
          person_id?: string | null
          value?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "contacts_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      content_items: {
        Row: {
          ai_model: string | null
          audience: string | null
          body: string
          channel: Database["public"]["Enums"]["channel_type"]
          created_at: string
          id: string
          language: string
          prompt_version: string | null
          property_id: string | null
          quality_score: number | null
          status: Database["public"]["Enums"]["content_status"]
          title: string | null
          updated_at: string
        }
        Insert: {
          ai_model?: string | null
          audience?: string | null
          body: string
          channel: Database["public"]["Enums"]["channel_type"]
          created_at?: string
          id?: string
          language?: string
          prompt_version?: string | null
          property_id?: string | null
          quality_score?: number | null
          status?: Database["public"]["Enums"]["content_status"]
          title?: string | null
          updated_at?: string
        }
        Update: {
          ai_model?: string | null
          audience?: string | null
          body?: string
          channel?: Database["public"]["Enums"]["channel_type"]
          created_at?: string
          id?: string
          language?: string
          prompt_version?: string | null
          property_id?: string | null
          quality_score?: number | null
          status?: Database["public"]["Enums"]["content_status"]
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_items_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      content_performance: {
        Row: {
          channel: string
          content_variant_id: string
          conversions: number
          created_at: string
          id: string
          impressions: number
          last_observed_at: string
          metadata: Json
          qualified_inquiries: number
          replies: number
          updated_at: string
          views: number
        }
        Insert: {
          channel: string
          content_variant_id: string
          conversions?: number
          created_at?: string
          id?: string
          impressions?: number
          last_observed_at?: string
          metadata?: Json
          qualified_inquiries?: number
          replies?: number
          updated_at?: string
          views?: number
        }
        Update: {
          channel?: string
          content_variant_id?: string
          conversions?: number
          created_at?: string
          id?: string
          impressions?: number
          last_observed_at?: string
          metadata?: Json
          qualified_inquiries?: number
          replies?: number
          updated_at?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "content_performance_content_variant_id_fkey"
            columns: ["content_variant_id"]
            isOneToOne: false
            referencedRelation: "content_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      content_variants: {
        Row: {
          body: string
          channel: string
          content_item_id: string | null
          created_at: string
          id: string
          locale: string
          metadata: Json
          status: string
          updated_at: string
          variant_type: string
        }
        Insert: {
          body: string
          channel: string
          content_item_id?: string | null
          created_at?: string
          id?: string
          locale?: string
          metadata?: Json
          status?: string
          updated_at?: string
          variant_type?: string
        }
        Update: {
          body?: string
          channel?: string
          content_item_id?: string | null
          created_at?: string
          id?: string
          locale?: string
          metadata?: Json
          status?: string
          updated_at?: string
          variant_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_variants_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      discovery_entities: {
        Row: {
          address: string | null
          attributes: Json
          city: string | null
          confidence: number
          created_at: string
          email: string | null
          entity_type: string
          evidence_id: string | null
          external_key: string | null
          id: string
          name: string | null
          phone: string | null
          run_id: string | null
          source_url: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          attributes?: Json
          city?: string | null
          confidence?: number
          created_at?: string
          email?: string | null
          entity_type: string
          evidence_id?: string | null
          external_key?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          run_id?: string | null
          source_url?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          attributes?: Json
          city?: string | null
          confidence?: number
          created_at?: string
          email?: string | null
          entity_type?: string
          evidence_id?: string | null
          external_key?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          run_id?: string | null
          source_url?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "discovery_entities_evidence_id_fkey"
            columns: ["evidence_id"]
            isOneToOne: false
            referencedRelation: "discovery_evidence"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discovery_entities_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "discovery_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      discovery_evidence: {
        Row: {
          canonical_url: string | null
          captured_at: string
          content_hash: string | null
          created_at: string
          extraction: Json
          id: string
          raw_data: Json
          run_id: string
          source_id: string | null
          title: string | null
          url: string
        }
        Insert: {
          canonical_url?: string | null
          captured_at?: string
          content_hash?: string | null
          created_at?: string
          extraction?: Json
          id?: string
          raw_data?: Json
          run_id: string
          source_id?: string | null
          title?: string | null
          url: string
        }
        Update: {
          canonical_url?: string | null
          captured_at?: string
          content_hash?: string | null
          created_at?: string
          extraction?: Json
          id?: string
          raw_data?: Json
          run_id?: string
          source_id?: string | null
          title?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "discovery_evidence_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "discovery_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discovery_evidence_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "discovery_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      discovery_jobs: {
        Row: {
          attempts: number
          available_at: string
          created_at: string
          finished_at: string | null
          id: string
          job_type: string
          last_error: string | null
          locked_at: string | null
          locked_by: string | null
          max_attempts: number
          payload: Json
          priority: number
          result: Json
          run_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          available_at?: string
          created_at?: string
          finished_at?: string | null
          id?: string
          job_type: string
          last_error?: string | null
          locked_at?: string | null
          locked_by?: string | null
          max_attempts?: number
          payload?: Json
          priority?: number
          result?: Json
          run_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          available_at?: string
          created_at?: string
          finished_at?: string | null
          id?: string
          job_type?: string
          last_error?: string | null
          locked_at?: string | null
          locked_by?: string | null
          max_attempts?: number
          payload?: Json
          priority?: number
          result?: Json
          run_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "discovery_jobs_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "discovery_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      discovery_permission_evidence: {
        Row: {
          created_at: string
          evidence_text: string | null
          evidence_type: string
          evidence_url: string | null
          expires_at: string | null
          id: string
          notes: string | null
          owner_id: string | null
          source_id: string
          status: string
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          evidence_text?: string | null
          evidence_type: string
          evidence_url?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          owner_id?: string | null
          source_id: string
          status?: string
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          evidence_text?: string | null
          evidence_type?: string
          evidence_url?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          owner_id?: string | null
          source_id?: string
          status?: string
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discovery_permission_evidence_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "discovery_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      discovery_runs: {
        Row: {
          city: string
          country: string
          created_at: string
          error_message: string | null
          finished_at: string | null
          id: string
          query: string | null
          source_id: string | null
          started_at: string | null
          stats: Json
          status: string
          updated_at: string
        }
        Insert: {
          city?: string
          country?: string
          created_at?: string
          error_message?: string | null
          finished_at?: string | null
          id?: string
          query?: string | null
          source_id?: string | null
          started_at?: string | null
          stats?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          error_message?: string | null
          finished_at?: string | null
          id?: string
          query?: string | null
          source_id?: string | null
          started_at?: string | null
          stats?: Json
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "discovery_runs_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "discovery_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      discovery_sources: {
        Row: {
          base_url: string | null
          config: Json
          created_at: string
          enabled: boolean
          id: string
          key: string
          name: string
          policy_mode: string
          source_type: string
          updated_at: string
        }
        Insert: {
          base_url?: string | null
          config?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          key: string
          name: string
          policy_mode?: string
          source_type?: string
          updated_at?: string
        }
        Update: {
          base_url?: string | null
          config?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          key?: string
          name?: string
          policy_mode?: string
          source_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      entity_matches: {
        Row: {
          created_at: string
          id: string
          left_entity_id: string
          left_entity_type: string
          match_type: string
          reasons: Json
          right_entity_id: string
          right_entity_type: string
          score: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          left_entity_id: string
          left_entity_type: string
          match_type: string
          reasons?: Json
          right_entity_id: string
          right_entity_type: string
          score?: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          left_entity_id?: string
          left_entity_type?: string
          match_type?: string
          reasons?: Json
          right_entity_id?: string
          right_entity_type?: string
          score?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      intake_events: {
        Row: {
          channel: string
          chat_id: string | null
          created_at: string
          error_message: string | null
          external_event_id: string | null
          id: string
          parsed_payload: Json | null
          raw_text: string
          sender_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          channel: string
          chat_id?: string | null
          created_at?: string
          error_message?: string | null
          external_event_id?: string | null
          id?: string
          parsed_payload?: Json | null
          raw_text: string
          sender_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          channel?: string
          chat_id?: string | null
          created_at?: string
          error_message?: string | null
          external_event_id?: string | null
          id?: string
          parsed_payload?: Json | null
          raw_text?: string
          sender_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      interactions: {
        Row: {
          channel: string
          content_ref: string | null
          created_at: string
          direction: string
          external_event_id: string | null
          id: string
          interaction_type: string
          observed_at: string
          payload: Json
          person_id: string | null
          property_id: string | null
        }
        Insert: {
          channel: string
          content_ref?: string | null
          created_at?: string
          direction: string
          external_event_id?: string | null
          id?: string
          interaction_type: string
          observed_at?: string
          payload?: Json
          person_id?: string | null
          property_id?: string | null
        }
        Update: {
          channel?: string
          content_ref?: string | null
          created_at?: string
          direction?: string
          external_event_id?: string | null
          id?: string
          interaction_type?: string
          observed_at?: string
          payload?: Json
          person_id?: string | null
          property_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interactions_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      interests: {
        Row: {
          city: string | null
          created_at: string
          district: string | null
          evidence: Json
          id: string
          intent_score: number
          interest_type: string
          max_area_m2: number | null
          max_price: number | null
          min_area_m2: number | null
          min_price: number | null
          observed_at: string
          person_id: string
          property_type: string | null
          status: string
          updated_at: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          district?: string | null
          evidence?: Json
          id?: string
          intent_score?: number
          interest_type: string
          max_area_m2?: number | null
          max_price?: number | null
          min_area_m2?: number | null
          min_price?: number | null
          observed_at?: string
          person_id: string
          property_type?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          district?: string | null
          evidence?: Json
          id?: string
          intent_score?: number
          interest_type?: string
          max_area_m2?: number | null
          max_price?: number | null
          min_area_m2?: number | null
          min_price?: number | null
          observed_at?: string
          person_id?: string
          property_type?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interests_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          attempts: number
          available_at: string
          created_at: string
          error_message: string | null
          finished_at: string | null
          id: string
          idempotency_key: string | null
          job_type: string
          lease_expires_at: string | null
          locked_at: string | null
          locked_by: string | null
          max_attempts: number
          payload: Json
          priority: number
          result: Json
          started_at: string | null
          status: Database["public"]["Enums"]["job_status"]
          updated_at: string
        }
        Insert: {
          attempts?: number
          available_at?: string
          created_at?: string
          error_message?: string | null
          finished_at?: string | null
          id?: string
          idempotency_key?: string | null
          job_type: string
          lease_expires_at?: string | null
          locked_at?: string | null
          locked_by?: string | null
          max_attempts?: number
          payload?: Json
          priority?: number
          result?: Json
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
        }
        Update: {
          attempts?: number
          available_at?: string
          created_at?: string
          error_message?: string | null
          finished_at?: string | null
          id?: string
          idempotency_key?: string | null
          job_type?: string
          lease_expires_at?: string | null
          locked_at?: string | null
          locked_by?: string | null
          max_attempts?: number
          payload?: Json
          priority?: number
          result?: Json
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
        }
        Relationships: []
      }
      lead_signals: {
        Row: {
          created_at: string
          evidence: Json
          id: string
          lead_type: string
          observed_at: string
          person_id: string | null
          score: number
          signal_type: string
        }
        Insert: {
          created_at?: string
          evidence?: Json
          id?: string
          lead_type: string
          observed_at?: string
          person_id?: string | null
          score?: number
          signal_type: string
        }
        Update: {
          created_at?: string
          evidence?: Json
          id?: string
          lead_type?: string
          observed_at?: string
          person_id?: string | null
          score?: number
          signal_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_signals_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string
          id: string
          intent: string | null
          notes: string | null
          person_id: string | null
          property_id: string | null
          score: number | null
          source: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          intent?: string | null
          notes?: string | null
          person_id?: string | null
          property_id?: string | null
          score?: number | null
          source?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          intent?: string | null
          notes?: string | null
          person_id?: string | null
          property_id?: string | null
          score?: number | null
          source?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_experiments: {
        Row: {
          audience: string | null
          control_variant_id: string | null
          created_at: string
          funnel_stage: string | null
          hypothesis: string
          id: string
          name: string
          primary_metric: string | null
          status: string
          treatment_variant_id: string | null
          updated_at: string
        }
        Insert: {
          audience?: string | null
          control_variant_id?: string | null
          created_at?: string
          funnel_stage?: string | null
          hypothesis: string
          id?: string
          name: string
          primary_metric?: string | null
          status?: string
          treatment_variant_id?: string | null
          updated_at?: string
        }
        Update: {
          audience?: string | null
          control_variant_id?: string | null
          created_at?: string
          funnel_stage?: string | null
          hypothesis?: string
          id?: string
          name?: string
          primary_metric?: string | null
          status?: string
          treatment_variant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_experiments_control_variant_id_fkey"
            columns: ["control_variant_id"]
            isOneToOne: false
            referencedRelation: "content_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_experiments_treatment_variant_id_fkey"
            columns: ["treatment_variant_id"]
            isOneToOne: false
            referencedRelation: "content_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      people: {
        Row: {
          city: string | null
          confidence: number | null
          created_at: string
          full_name: string | null
          id: string
          notes: string | null
          organization_name: string | null
          role: Database["public"]["Enums"]["person_role"]
          updated_at: string
        }
        Insert: {
          city?: string | null
          confidence?: number | null
          created_at?: string
          full_name?: string | null
          id?: string
          notes?: string | null
          organization_name?: string | null
          role?: Database["public"]["Enums"]["person_role"]
          updated_at?: string
        }
        Update: {
          city?: string | null
          confidence?: number | null
          created_at?: string
          full_name?: string | null
          id?: string
          notes?: string | null
          organization_name?: string | null
          role?: Database["public"]["Enums"]["person_role"]
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string | null
          area_m2: number | null
          bathrooms: number | null
          bedrooms: number | null
          canonical_key: string | null
          city: string
          confidence: number | null
          created_at: string
          currency: string
          description: string | null
          district: string | null
          features: Json
          finishing: string | null
          first_seen_at: string
          floor: string | null
          id: string
          installments_clear: boolean | null
          last_seen_at: string
          latitude: number | null
          longitude: number | null
          neighborhood: string | null
          parcel_number: number | null
          price: number | null
          property_type: string | null
          status: Database["public"]["Enums"]["property_status"]
          title: string | null
          transaction_type: Database["public"]["Enums"]["property_transaction_type"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          area_m2?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          canonical_key?: string | null
          city?: string
          confidence?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          district?: string | null
          features?: Json
          finishing?: string | null
          first_seen_at?: string
          floor?: string | null
          id?: string
          installments_clear?: boolean | null
          last_seen_at?: string
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string | null
          parcel_number?: number | null
          price?: number | null
          property_type?: string | null
          status?: Database["public"]["Enums"]["property_status"]
          title?: string | null
          transaction_type?: Database["public"]["Enums"]["property_transaction_type"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          area_m2?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          canonical_key?: string | null
          city?: string
          confidence?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          district?: string | null
          features?: Json
          finishing?: string | null
          first_seen_at?: string
          floor?: string | null
          id?: string
          installments_clear?: boolean | null
          last_seen_at?: string
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string | null
          parcel_number?: number | null
          price?: number | null
          property_type?: string | null
          status?: Database["public"]["Enums"]["property_status"]
          title?: string | null
          transaction_type?: Database["public"]["Enums"]["property_transaction_type"]
          updated_at?: string
        }
        Relationships: []
      }
      property_people: {
        Row: {
          confidence: number | null
          created_at: string
          person_id: string
          property_id: string
          relationship: Database["public"]["Enums"]["person_role"]
          source_record_id: string | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          person_id: string
          property_id: string
          relationship: Database["public"]["Enums"]["person_role"]
          source_record_id?: string | null
        }
        Update: {
          confidence?: number | null
          created_at?: string
          person_id?: string
          property_id?: string
          relationship?: Database["public"]["Enums"]["person_role"]
          source_record_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_people_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_people_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_people_source_record_id_fkey"
            columns: ["source_record_id"]
            isOneToOne: false
            referencedRelation: "source_records"
            referencedColumns: ["id"]
          },
        ]
      }
      provenance: {
        Row: {
          confidence: number | null
          created_at: string
          entity_id: string
          entity_type: string
          field_name: string | null
          id: string
          observed_at: string
          observed_value: Json | null
          source_record_id: string | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          entity_id: string
          entity_type: string
          field_name?: string | null
          id?: string
          observed_at?: string
          observed_value?: Json | null
          source_record_id?: string | null
        }
        Update: {
          confidence?: number | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          field_name?: string | null
          id?: string
          observed_at?: string
          observed_value?: Json | null
          source_record_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provenance_source_record_id_fkey"
            columns: ["source_record_id"]
            isOneToOne: false
            referencedRelation: "source_records"
            referencedColumns: ["id"]
          },
        ]
      }
      publication_jobs: {
        Row: {
          attempts: number
          available_at: string
          channel: string
          content_variant_id: string | null
          created_at: string
          destination: string | null
          finished_at: string | null
          id: string
          last_error: string | null
          max_attempts: number
          payload: Json
          requires_human: boolean
          started_at: string | null
          status: string
        }
        Insert: {
          attempts?: number
          available_at?: string
          channel: string
          content_variant_id?: string | null
          created_at?: string
          destination?: string | null
          finished_at?: string | null
          id?: string
          last_error?: string | null
          max_attempts?: number
          payload?: Json
          requires_human?: boolean
          started_at?: string | null
          status?: string
        }
        Update: {
          attempts?: number
          available_at?: string
          channel?: string
          content_variant_id?: string | null
          created_at?: string
          destination?: string | null
          finished_at?: string | null
          id?: string
          last_error?: string | null
          max_attempts?: number
          payload?: Json
          requires_human?: boolean
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "publication_jobs_content_variant_id_fkey"
            columns: ["content_variant_id"]
            isOneToOne: false
            referencedRelation: "content_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      publications: {
        Row: {
          attempts: number
          channel: Database["public"]["Enums"]["channel_type"]
          content_id: string
          created_at: string
          destination: string | null
          error_message: string | null
          external_id: string | null
          id: string
          published_at: string | null
          scheduled_at: string | null
          status: Database["public"]["Enums"]["publication_status"]
          updated_at: string
        }
        Insert: {
          attempts?: number
          channel: Database["public"]["Enums"]["channel_type"]
          content_id: string
          created_at?: string
          destination?: string | null
          error_message?: string | null
          external_id?: string | null
          id?: string
          published_at?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["publication_status"]
          updated_at?: string
        }
        Update: {
          attempts?: number
          channel?: Database["public"]["Enums"]["channel_type"]
          content_id?: string
          created_at?: string
          destination?: string | null
          error_message?: string | null
          external_id?: string | null
          id?: string
          published_at?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["publication_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "publications_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_state: {
        Row: {
          action: string
          ip: unknown
          request_count: number
          updated_at: string
          window_start: string
        }
        Insert: {
          action: string
          ip: unknown
          request_count?: number
          updated_at?: string
          window_start: string
        }
        Update: {
          action?: string
          ip?: unknown
          request_count?: number
          updated_at?: string
          window_start?: string
        }
        Relationships: []
      }
      review_queue: {
        Row: {
          checks: Json
          created_at: string
          decision: string | null
          id: string
          notes: string | null
          object_id: string
          object_type: string
          priority: number
          queue_type: string
          reviewed_at: string | null
          reviewer_id: string | null
          status: string
        }
        Insert: {
          checks?: Json
          created_at?: string
          decision?: string | null
          id?: string
          notes?: string | null
          object_id: string
          object_type: string
          priority?: number
          queue_type: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string
        }
        Update: {
          checks?: Json
          created_at?: string
          decision?: string | null
          id?: string
          notes?: string | null
          object_id?: string
          object_type?: string
          priority?: number
          queue_type?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string
        }
        Relationships: []
      }
      security_rate_limits: {
        Row: {
          action: string
          ip: unknown
          request_count: number
          updated_at: string
          window_start: string
        }
        Insert: {
          action: string
          ip: unknown
          request_count?: number
          updated_at?: string
          window_start: string
        }
        Update: {
          action?: string
          ip?: unknown
          request_count?: number
          updated_at?: string
          window_start?: string
        }
        Relationships: []
      }
      source_records: {
        Row: {
          canonical_url: string | null
          confidence: number | null
          content_hash: string | null
          created_at: string
          external_id: string | null
          extracted_payload: Json
          fetched_at: string
          id: string
          raw_payload: Json
          source_id: string | null
          source_url: string
          status: Database["public"]["Enums"]["source_record_status"]
          updated_at: string
        }
        Insert: {
          canonical_url?: string | null
          confidence?: number | null
          content_hash?: string | null
          created_at?: string
          external_id?: string | null
          extracted_payload?: Json
          fetched_at?: string
          id?: string
          raw_payload?: Json
          source_id?: string | null
          source_url: string
          status?: Database["public"]["Enums"]["source_record_status"]
          updated_at?: string
        }
        Update: {
          canonical_url?: string | null
          confidence?: number | null
          content_hash?: string | null
          created_at?: string
          external_id?: string | null
          extracted_payload?: Json
          fetched_at?: string
          id?: string
          raw_payload?: Json
          source_id?: string | null
          source_url?: string
          status?: Database["public"]["Enums"]["source_record_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "source_records_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      sources: {
        Row: {
          base_url: string | null
          crawl_policy: Json
          created_at: string
          enabled: boolean
          id: string
          metadata: Json
          name: string
          source_type: Database["public"]["Enums"]["source_type"]
          updated_at: string
        }
        Insert: {
          base_url?: string | null
          crawl_policy?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          metadata?: Json
          name: string
          source_type: Database["public"]["Enums"]["source_type"]
          updated_at?: string
        }
        Update: {
          base_url?: string | null
          crawl_policy?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          metadata?: Json
          name?: string
          source_type?: Database["public"]["Enums"]["source_type"]
          updated_at?: string
        }
        Relationships: []
      }
      sync_projections: {
        Row: {
          canonical_key: string | null
          created_at: string
          entity_id: string
          entity_type: string
          external_key: string | null
          id: string
          last_error: string | null
          last_synced_at: string | null
          projection_type: string
          status: string
          updated_at: string
        }
        Insert: {
          canonical_key?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          external_key?: string | null
          id?: string
          last_error?: string | null
          last_synced_at?: string | null
          projection_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          canonical_key?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          external_key?: string | null
          id?: string
          last_error?: string | null
          last_synced_at?: string | null
          projection_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_job: {
        Args: { p_job_type: string; p_lease_seconds?: number; p_worker: string }
        Returns: {
          attempts: number
          available_at: string
          created_at: string
          error_message: string | null
          finished_at: string | null
          id: string
          idempotency_key: string | null
          job_type: string
          lease_expires_at: string | null
          locked_at: string | null
          locked_by: string | null
          max_attempts: number
          payload: Json
          priority: number
          result: Json
          started_at: string | null
          status: Database["public"]["Enums"]["job_status"]
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "jobs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      commit_intake_event: { Args: { p_event_id: string }; Returns: Json }
      compute_lead_score: {
        Args: { p_person_id: string; p_property_id: string }
        Returns: Json
      }
      dashboard_apply_action: {
        Args: {
          p_action: string
          p_actor_id?: string
          p_correlation_id?: string
          p_enabled?: boolean
          p_entity_id: string
          p_notes?: string
          p_status?: string
        }
        Returns: Json
      }
      discovery_source_permission_active: {
        Args: { p_source_id: string }
        Returns: boolean
      }
      increment_public_rate_limit: {
        Args: { p_action: string; p_client_ip: string }
        Returns: Json
      }
      increment_rate_limit: {
        Args: { p_action: string; p_ip: unknown; p_window_start: string }
        Returns: number
      }
      increment_security_rate_limit: {
        Args: { p_action: string; p_ip: unknown; p_window_start: string }
        Returns: number
      }
      materialize_discovery_entity: {
        Args: { p_entity_id: string }
        Returns: Json
      }
      materialize_property_matches: {
        Args: { p_property_id: string }
        Returns: number
      }
      requeue_expired_jobs: { Args: never; Returns: number }
      score_property_match: {
        Args: { p_left: string; p_right: string }
        Returns: Json
      }
      submit_public_contact: {
        Args: {
          p_client_ip: string
          p_contact_type: string
          p_message: string
          p_property_id: string
          p_visitor_email: string
          p_visitor_name: string
          p_visitor_phone: string
        }
        Returns: Json
      }
    }
    Enums: {
      channel_type:
        | "telegram"
        | "website"
        | "facebook"
        | "whatsapp"
        | "linkedin"
        | "classified"
        | "other"
      content_status:
        | "draft"
        | "review"
        | "approved"
        | "published"
        | "rejected"
        | "archived"
      job_status:
        | "queued"
        | "running"
        | "succeeded"
        | "failed"
        | "cancelled"
        | "needs_review"
      person_role:
        | "owner"
        | "seller"
        | "buyer"
        | "broker"
        | "agent"
        | "developer"
        | "tenant"
        | "investor"
        | "other"
        | "unknown"
      property_status:
        | "active"
        | "inactive"
        | "sold"
        | "rented"
        | "archived"
        | "unknown"
      property_transaction_type: "sale" | "rent" | "both" | "unknown"
      publication_status:
        | "queued"
        | "review"
        | "approved"
        | "publishing"
        | "published"
        | "failed"
        | "cancelled"
      source_record_status:
        | "discovered"
        | "parsed"
        | "verified"
        | "rejected"
        | "stale"
      source_type:
        | "website"
        | "social"
        | "classified"
        | "telegram"
        | "manual"
        | "import"
        | "other"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      channel_type: [
        "telegram",
        "website",
        "facebook",
        "whatsapp",
        "linkedin",
        "classified",
        "other",
      ],
      content_status: [
        "draft",
        "review",
        "approved",
        "published",
        "rejected",
        "archived",
      ],
      job_status: [
        "queued",
        "running",
        "succeeded",
        "failed",
        "cancelled",
        "needs_review",
      ],
      person_role: [
        "owner",
        "seller",
        "buyer",
        "broker",
        "agent",
        "developer",
        "tenant",
        "investor",
        "other",
        "unknown",
      ],
      property_status: [
        "active",
        "inactive",
        "sold",
        "rented",
        "archived",
        "unknown",
      ],
      property_transaction_type: ["sale", "rent", "both", "unknown"],
      publication_status: [
        "queued",
        "review",
        "approved",
        "publishing",
        "published",
        "failed",
        "cancelled",
      ],
      source_record_status: [
        "discovered",
        "parsed",
        "verified",
        "rejected",
        "stale",
      ],
      source_type: [
        "website",
        "social",
        "classified",
        "telegram",
        "manual",
        "import",
        "other",
      ],
    },
  },
} as const
