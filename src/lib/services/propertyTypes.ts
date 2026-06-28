import { createClient } from "@/lib/supabase/server";

export interface PropertyType {
  id: string;
  name_ar: string;
  name_en: string | null;
}

export async function getPropertyTypes(): Promise<PropertyType[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("property_types")
    .select("id, name_ar, name_en")
    .order("name_ar");

  if (error) throw new Error(error.message);
  return data || [];
}

export async function getPropertyTypeById(id: string): Promise<PropertyType | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("property_types")
    .select("id, name_ar, name_en")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}