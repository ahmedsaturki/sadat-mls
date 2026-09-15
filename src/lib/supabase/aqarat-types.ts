export type AqaratTransactionType = "sale" | "rent" | "both" | "unknown";
export type AqaratPropertyStatus = "active" | "inactive" | "sold" | "rented" | "archived" | "unknown";

export interface AqaratPropertyRow {
  id: string;
  property_type: string | null;
  transaction_type: AqaratTransactionType;
  status: AqaratPropertyStatus;
  title: string | null;
  description: string | null;
  city: string | null;
  district: string | null;
  neighborhood: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  area_m2: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  floor: string | null;
  finishing: string | null;
  price: number | null;
  currency: string | null;
  features: Record<string, unknown> | null;
  confidence: number | null;
  first_seen_at: string;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
  parcel_number: number | null;
  installments_clear: boolean | null;
  canonical_key: string | null;
}

export type AqaratDatabase = {
  public: {
    Tables: {
      properties: {
        Row: AqaratPropertyRow;
        Insert: Partial<AqaratPropertyRow> & Pick<AqaratPropertyRow, "id">;
        Update: Partial<AqaratPropertyRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      property_status: AqaratPropertyStatus;
      property_transaction_type: AqaratTransactionType;
    };
    CompositeTypes: Record<string, never>;
  };
};
