import { createClient } from "@/lib/supabase/server";

export interface Zone {
  id: string;
  name_ar: string;
  name_en: string | null;
}

export async function getZones(): Promise<Zone[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("zones")
    .select("id, name_ar, name_en")
    .order("name_ar");

  if (error) throw new Error(error.message);
  return data || [];
}

export async function getZoneById(id: string): Promise<Zone | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("zones")
    .select("id, name_ar, name_en")
    .eq("id", id)
    .maybeSingle();

  if (error) return null;
  return data;
}