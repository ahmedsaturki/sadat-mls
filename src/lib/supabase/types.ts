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
          clicks: number
          content_item_id: string
          created_at: string
          id: string
          impressions: number
          leads: number
          likes: number
          shares: number
          updated_at: string
        }
        Insert: {
          clicks?: number
          content_item_id: string
          created_at?: string
          id?: string
          impressions?: number
          leads?: number
          likes?: number
          shares?: number
          updated_at?: string
        }
        Update: {
          clicks?: number
          content_item_id?: string
          created_at?: string
          id?: string
          impressions?: number
          leads?: number
          likes?: number
          shares?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_performance_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      content_variants: {
        Row: {
          body: string
          channel: Database["public"]["Enums"]["channel_type"]
          content_item_id: string
          created_at: string
          id: string
          language: string
          platform_metadata: Json
          title: string | null
        }
        Insert: {
          body: string
          channel: Database["public"]["Enums"]["channel_type"]
          content_item_id: string
          created_at?: string
          id?: string
          language?: string
          platform_metadata?: Json
          title?: string | null
        }
        Update: {
          body?: string
          channel?: Database["public"]["Enums"]["channel_type"]
          content_item_id?: string
          created_at?: string
          id?: string
          language?: string
          platform_metadata?: Json
          title?: string | null
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
          canonical_name: string | null
          city: string | null
          confidence: number | null
          created_at: string
          entity_type: string
          external_key: string
          id: string
          natural_key: string
          source_url: string | null
          updated_at: string
        }
        Insert: {
          canonical_name?: string | null
          city?: string | null
          confidence?: number | null
          created_at?: string
          entity_type: string
          external_key: string
          id?: string
          natural_key: string
          source_url?: string | null
          updated_at?: string
        }
        Update: {
          canonical_name?: string | null
          city?: string | null
          confidence?: number | null
          created_at?: string
          entity_type?: string
          external_key?: string
          id?: string
          natural_key?: string
          source_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      discovery_evidence: {
        Row: {
          canonical_url: string | null
          content_hash: string | null
          created_at: string
          discovery_job_id: string | null
          evidence_type: string
          extracted_at: string | null
          id: string
          payload: Json
          url: string
        }
        Insert: {
          canonical_url?: string | null
          content_hash?: string | null
          created_at?: string
          discovery_job_id?: string | null
          evidence_type: string
          extracted_at?: string | null
          id?: string
          payload?: Json
          url: string
        }
        Update: {
          canonical_url?: string | null
          content_hash?: string | null
          created_at?: string
          discovery_job_id?: string | null
          evidence_type?: string
          extracted_at?: string | null
          id?: string
          payload?: Json
          url?: string
        }
        Relationships: []
      }
      discovery_jobs: {
        Row: {
          created_at: string
          discovery_run_id: string
          error: string | null
          finished_at: string | null
          id: string
          job_key: string
          result: Json | null
          started_at: string | null
          status: Database["public"]["Enums"]["job_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          discovery_run_id: string
          error?: string | null
          finished_at?: string | null
          id?: string
          job_key: string
          result?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          discovery_run_id?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          job_key?: string
          result?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "discovery_jobs_discovery_run_id_fkey"
            columns: ["discovery_run_id"]
            isOneToOne: false
            referencedRelation: "discovery_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      discovery_permission_evidence: {
        Row: {
          created_at: string
          evidence_url: string
          id: string
          permission: string
          source_id: string | null
        }
        Insert: {
          created_at?: string
          evidence_url: string
          id?: string
          permission: string
          source_id?: string | null
        }
        Update: {
          created_at?: string
          evidence_url?: string
          id?: string
          permission?: string
          source_id?: string | null
        }
        Relationships: []
      }
      discovery_runs: {
        Row: {
          created_at: string
          finished_at: string | null
          id: string
          run_key: string
          started_at: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          finished_at?: string | null
          id?: string
          run_key: string
          started_at?: string
          status: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          finished_at?: string | null
          id?: string
          run_key?: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      discovery_sources: {
        Row: {
          base_url: string
          created_at: string
          id: string
          name: string
          source_type: Database["public"]["Enums"]["source_type"]
          updated_at: string
        }
        Insert: {
          base_url: string
          created_at?: string
          id?: string
          name: string
          source_type: Database["public"]["Enums"]["source_type"]
          updated_at?: string
        }
        Update: {
          base_url?: string
          created_at?: string
          id?: string
          name?: string
          source_type?: Database["public"]["Enums"]["source_type"]
          updated_at?: string
        }
        Relationships: []
      }
      entity_matches: {
        Row: {
          confidence: number | null
          created_at: string
          discovery_entity_id: string
          id: string
          match_type: string
          property_id: string | null
          reason: string | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          discovery_entity_id: string
          id?: string
          match_type: string
          property_id?: string | null
          reason?: string | null
        }
        Update: {
          confidence?: number | null
          created_at?: string
          discovery_entity_id?: string
          id?: string
          match_type?: string
          property_id?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entity_matches_discovery_entity_id_fkey"
            columns: ["discovery_entity_id"]
            isOneToOne: false
            referencedRelation: "discovery_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_matches_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      interactions: {
        Row: {
          channel: Database["public"]["Enums"]["channel_type"]
          content_ref: string | null
          created_at: string
          direction: string
          external_event_id: string | null
          id: string
          observed_at: string
          payload: Json
          person_id: string | null
          property_id: string | null
          interaction_type: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["channel_type"]
          content_ref?: string | null
          created_at?: string
          direction: string
          external_event_id?: string | null
          id?: string
          observed_at?: string
          payload?: Json
          person_id?: string | null
          property_id?: string | null
          interaction_type: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["channel_type"]
          content_ref?: string | null
          created_at?: string
          direction?: string
          external_event_id?: string | null
          id?: string
          observed_at?: string
          payload?: Json
          person_id?: string | null
          property_id?: string | null
          interaction_type?: string
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
      job_runs: {
        Row: {
          created_at: string
          finished_at: string | null
          id: string
          job_type: string
          payload: Json
          result: Json | null
          started_at: string | null
          status: Database["public"]["Enums"]["job_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          finished_at?: string | null
          id?: string
          job_type: string
          payload?: Json
          result?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          finished_at?: string | null
          id?: string
          job_type?: string
          payload?: Json
          result?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
        }
        Relationships: []
      }
      job_runs_attempts: {
        Row: {
          attempt: number
          created_at: string
          error: string | null
          finished_at: string | null
          id: string
          job_run_id: string
          started_at: string
          updated_at: string
        }
        Insert: {
          attempt: number
          created_at?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          job_run_id: string
          started_at?: string
          updated_at?: string
        }
        Update: {
          attempt?: number
          created_at?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          job_run_id?: string
          started_at?: string
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
          score: number | null
          signal_type: string
        }
        Insert: {
          created_at?: string
          evidence?: Json
          id?: string
          lead_type: string
          observed_at?: string
          person_id?: string | null
          score?: number | null
          signal_type: string
        }
        Update: {
          created_at?: string
          evidence?: Json
          id?: string
          lead_type?: string
          observed_at?: string
          person_id?: string | null
          score?: number | null
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
          intent: string
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
          intent: string
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
          intent?: string
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
          role: Database["public"]["Enums"]["person_role"]
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
          city: string | null
          confidence: number | null
          created_at: string
          currency: string | null
          description: string | null
          district: string | null
          features: Json | null
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
          city?: string | null
          confidence?: number | null
          created_at?: string
          currency?: string | null
          description?: string | null
          district?: string | null
          features?: Json | null
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
          city?: string | null
          confidence?: number | null
          created_at?: string
          currency?: string | null
          description?: string | null
          district?: string | null
          features?: Json | null
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
      provenance: {
        Row: {
          collected_at: string
          confidence: number | null
          created_at: string
          entity_id: string
          entity_type: string
          evidence: Json
          id: string
          source_record_id: string | null
        }
        Insert: {
          collected_at?: string
          confidence?: number | null
          created_at?: string
          entity_id: string
          entity_type: string
          evidence?: Json
          id?: string
          source_record_id?: string | null
        }
        Update: {
          collected_at?: string
          confidence?: number | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          evidence?: Json
          id?: string
          source_record_id?: string | null
        }
        Relationships: []
      }
      publication_jobs: {
        Row: {
          content_item_id: string
          created_at: string
          id: string
          scheduled_for: string | null
          status: Database["public"]["Enums"]["publication_status"]
          updated_at: string
        }
        Insert: {
          content_item_id: string
          created_at?: string
          id?: string
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["publication_status"]
          updated_at?: string
        }
        Update: {
          content_item_id?: string
          created_at?: string
          id?: string
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["publication_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "publication_jobs_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      publications: {
        Row: {
          content_variant_id: string
          created_at: string
          external_id: string | null
          id: string
          published_at: string | null
          status: Database["public"]["Enums"]["publication_status"]
          updated_at: string
        }
        Insert: {
          content_variant_id: string
          created_at?: string
          external_id?: string | null
          id?: string
          published_at?: string | null
          status?: Database["public"]["Enums"]["publication_status"]
          updated_at?: string
        }
        Update: {
          content_variant_id?: string
          created_at?: string
          external_id?: string | null
          id?: string
          published_at?: string | null
          status?: Database["public"]["Enums"]["publication_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "publications_content_variant_id_fkey"
            columns: ["content_variant_id"]
            isOneToOne: false
            referencedRelation: "content_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      review_queue: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          priority: number
          reason: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          priority?: number
          reason: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          priority?: number
          reason?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      source_records: {
        Row: {
          canonical_url: string | null
          content_hash: string | null
          created_at: string
          first_seen_at: string
          id: string
          last_seen_at: string
          metadata: Json
          parsed_payload: Json | null
          source_id: string
          source_url: string
          status: Database["public"]["Enums"]["source_record_status"]
          title: string | null
        }
        Insert: {
          canonical_url?: string | null
          content_hash?: string | null
          created_at?: string
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          metadata?: Json
          parsed_payload?: Json | null
          source_id: string
          source_url: string
          status?: Database["public"]["Enums"]["source_record_status"]
          title?: string | null
        }
        Update: {
          canonical_url?: string | null
          content_hash?: string | null
          created_at?: string
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          metadata?: Json
          parsed_payload?: Json | null
          source_id?: string
          source_url?: string
          status?: Database["public"]["Enums"]["source_record_status"]
          title?: string | null
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
          base_url: string
          created_at: string
          id: string
          name: string
          source_type: Database["public"]["Enums"]["source_type"]
          updated_at: string
        }
        Insert: {
          base_url: string
          created_at?: string
          id?: string
          name: string
          source_type: Database["public"]["Enums"]["source_type"]
          updated_at?: string
        }
        Update: {
          base_url?: string
          created_at?: string
          id?: string
          name?: string
          source_type?: Database["public"]["Enums"]["source_type"]
          updated_at?: string
        }
        Relationships: []
      }
      users_view: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          role: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      channel_type: "telegram" | "website" | "facebook" | "whatsapp" | "linkedin" | "classified" | "other"
      content_status: "draft" | "review" | "approved" | "published" | "rejected" | "archived"
      job_status: "queued" | "running" | "succeeded" | "failed" | "cancelled" | "needs_review"
      person_role: "owner" | "seller" | "buyer" | "broker" | "agent" | "developer" | "tenant" | "investor" | "other" | "unknown"
      property_status: "active" | "inactive" | "sold" | "rented" | "archived" | "unknown"
      property_transaction_type: "sale" | "rent" | "both" | "unknown"
      publication_status: "queued" | "review" | "approved" | "publishing" | "published" | "failed" | "cancelled"
      source_record_status: "discovered" | "parsed" | "verified" | "rejected" | "stale"
      source_type: "website" | "social" | "classified" | "telegram" | "manual" | "import" | "other"
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
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends infer T
    ? T extends { Row: infer R }
      ? R
      : never
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends infer T
    ? T extends { Insert: infer I }
      ? I
      : never
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
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends infer T
    ? T extends { Update: infer U }
      ? U
      : never
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
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
  PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
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
      channel_type: ["telegram", "website", "facebook", "whatsapp", "linkedin", "classified", "other"],
      content_status: ["draft", "review", "approved", "published", "rejected", "archived"],
      job_status: ["queued", "running", "succeeded", "failed", "cancelled", "needs_review"],
      person_role: ["owner", "seller", "buyer", "broker", "agent", "developer", "tenant", "investor", "other", "unknown"],
      property_status: ["active", "inactive", "sold", "rented", "archived", "unknown"],
      property_transaction_type: ["sale", "rent", "both", "unknown"],
      publication_status: ["queued", "review", "approved", "publishing", "published", "failed", "cancelled"],
      source_record_status: ["discovered", "parsed", "verified", "rejected", "stale"],
      source_type: ["website", "social", "classified", "telegram", "manual", "import", "other"],
    },
  },
} as const
