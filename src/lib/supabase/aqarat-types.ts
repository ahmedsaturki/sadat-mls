import type { Database } from "@/lib/supabase/types";

export type AqaratTransactionType = Database["public"]["Enums"]["property_transaction_type"];
export type AqaratPropertyStatus = Database["public"]["Enums"]["property_status"];
export type AqaratPropertyRow = Database["public"]["Tables"]["properties"]["Row"];
export type AqaratDatabase = Database;
