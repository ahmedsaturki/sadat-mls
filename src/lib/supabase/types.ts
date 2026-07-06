import { ROLES } from "@/lib/utils/constants";

type Role = (typeof ROLES)[keyof typeof ROLES];

export interface Database {
  public: {
    Tables: {
      offices: {
        Row: {
          id: string;
          name: string;
          slug: string;
          email: string | null;
          phone: string | null;
          address: string | null;
          description: string | null;
          logo_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          description?: string | null;
          logo_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          description?: string | null;
          logo_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          office_id: string | null;
          email: string;
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          role: Role;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          office_id?: string | null;
          email: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          role?: Role;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          office_id?: string | null;
          email?: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          role?: Role;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      zones: {
        Row: {
          id: string;
          name_ar: string;
          name_en: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name_ar: string;
          name_en?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name_ar?: string;
          name_en?: string | null;
          created_at?: string;
        };
      };
      property_types: {
        Row: {
          id: string;
          name_ar: string;
          name_en: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name_ar: string;
          name_en?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name_ar?: string;
          name_en?: string | null;
          created_at?: string;
        };
      };
      properties: {
        Row: {
          id: string;
          office_id: string;
          created_by: string | null;
          title: string;
          description: string | null;
          property_type_id: string | null;
          zone_id: string | null;
          street: string | null;
          price: number;
          area: number;
          bedrooms: number;
          bathrooms: number;
          floors: number | null;
          has_balcony: boolean;
          has_parking: boolean;
          has_elevator: boolean;
          status: "available" | "reserved" | "sold" | "rented" | "pending_review";
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          office_id: string;
          created_by?: string | null;
          title: string;
          description?: string | null;
          property_type_id?: string | null;
          zone_id?: string | null;
          street?: string | null;
          price: number;
          area: number;
          bedrooms?: number;
          bathrooms?: number;
          floors?: number | null;
          has_balcony?: boolean;
          has_parking?: boolean;
          has_elevator?: boolean;
          status?: "available" | "reserved" | "sold" | "rented" | "pending_review";
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          office_id?: string;
          created_by?: string | null;
          title?: string;
          description?: string | null;
          property_type_id?: string | null;
          zone_id?: string | null;
          street?: string | null;
          price?: number;
          area?: number;
          bedrooms?: number;
          bathrooms?: number;
          floors?: number | null;
          has_balcony?: boolean;
          has_parking?: boolean;
          has_elevator?: boolean;
          status?: "available" | "reserved" | "sold" | "rented" | "pending_review";
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      property_owners: {
        Row: {
          id: string;
          property_id: string;
          office_id: string;
          owner_name: string;
          owner_phone: string;
          owner_email: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          office_id: string;
          owner_name: string;
          owner_phone: string;
          owner_email?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          office_id?: string;
          owner_name?: string;
          owner_phone?: string;
          owner_email?: string | null;
          notes?: string | null;
          created_at?: string;
        };
      };
      property_images: {
        Row: {
          id: string;
          property_id: string;
          url: string;
          file_path: string | null;
          sort_order: number;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          url: string;
          file_path?: string | null;
          sort_order?: number;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          url?: string;
          file_path?: string | null;
          sort_order?: number;
          is_primary?: boolean;
          created_at?: string;
        };
      };
      contact_requests: {
        Row: {
          id: string;
          property_id: string | null;
          office_id: string;
          contact_type: "whatsapp" | "phone" | "email";
          visitor_name: string | null;
          visitor_phone: string | null;
          visitor_email: string | null;
          message: string | null;
          status: "pending" | "read" | "resolved";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          property_id?: string | null;
          office_id: string;
          contact_type: "whatsapp" | "phone" | "email";
          visitor_name?: string | null;
          visitor_phone?: string | null;
          visitor_email?: string | null;
          message?: string | null;
          status?: "pending" | "read" | "resolved";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string | null;
          office_id?: string;
          contact_type?: "whatsapp" | "phone" | "email";
          visitor_name?: string | null;
          visitor_phone?: string | null;
          visitor_email?: string | null;
          message?: string | null;
          status?: "pending" | "read" | "resolved";
          created_at?: string;
          updated_at?: string;
        };
      };
      property_favorites: {
        Row: {
          id: string;
          user_id: string;
          property_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          property_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          property_id?: string;
          created_at?: string;
        };
      };
      activity_log: {
        Row: {
          id: string;
          user_id: string | null;
          office_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          entity_title: string | null;
          metadata: Record<string, unknown>;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          office_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          entity_title?: string | null;
          metadata?: Record<string, unknown>;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          office_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          entity_title?: string | null;
          metadata?: Record<string, unknown>;
          ip_address?: string | null;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string | null;
          office_id: string | null;
          type: string;
          title: string;
          message: string;
          entity_type: string | null;
          entity_id: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          office_id?: string | null;
          type: string;
          title: string;
          message: string;
          entity_type?: string | null;
          entity_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          office_id?: string | null;
          type?: string;
          title?: string;
          message?: string;
          entity_type?: string | null;
          entity_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
      };
    };
    Functions: {
      get_user_role: {
        Args: Record<string, never>;
        Returns: string;
      };
      get_user_office_id: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
  };
}
