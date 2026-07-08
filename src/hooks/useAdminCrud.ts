"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { logger } from "@/lib/logger";
import { useOptimisticUpdate } from "@/hooks/useOptimisticUpdate";

interface AdminCrudItem {
  id: string;
  name_ar: string;
  name_en: string | null;
  created_at: string;
}

interface UseAdminCrudOptions {
  tableName: string;
  successMessages: {
    create: string;
    update: string;
    delete: string;
  };
  errorMessage?: string;
}

interface UseAdminCrudReturn<T extends AdminCrudItem> {
  items: T[];
  loading: boolean;
  saving: boolean;
  showModal: boolean;
  showDeleteModal: boolean;
  editId: string | null;
  deleteId: string | null;
  nameAr: string;
  nameEn: string;
  setNameAr: (v: string) => void;
  setNameEn: (v: string) => void;
  handleOpenAdd: () => void;
  handleEdit: (item: T) => void;
  handleSave: (e: React.FormEvent) => Promise<void>;
  confirmDelete: (id: string) => void;
  handleDelete: () => Promise<void>;
  setShowModal: (v: boolean) => void;
  setShowDeleteModal: (v: boolean) => void;
  loadItems: () => Promise<void>;
}

export function useAdminCrud<T extends AdminCrudItem>({
  tableName,
  successMessages,
  errorMessage,
}: UseAdminCrudOptions): UseAdminCrudReturn<T> {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const { showToast } = useToast();
  const supabase = useMemo(() => createClient(), []);
  const mountedRef = useRef(true);

  const { data: items, setData: setItems, add, update, remove, isPending } = useOptimisticUpdate<T>(
    [],
    {
      onMutate: (current, optimistic) => [...current, optimistic],
      onError: () => {
        // TODO: caller should supply a localized error message via errorMessage option
        showToast(errorMessage ?? "Error", "error");
      },
    }
  );

  const loadItems = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select("id, name_ar, name_en, created_at")
        .order("name_ar");
      if (error) {
        // TODO: caller should supply a localized error message via errorMessage option
        showToast(errorMessage ?? "Error", "error");
      } else {
        if (!mountedRef.current) return;
        setItems((data || []) as T[]);
      }
    } catch (err) {
      logger.error(`Failed to fetch ${tableName}`, {
        error: err instanceof Error ? err.message : String(err),
      });
      // TODO: caller should supply a localized error message via errorMessage option
      showToast(errorMessage ?? "Error", "error");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [supabase, showToast, tableName, errorMessage, setItems]);

  useEffect(() => {
    mountedRef.current = true;
    loadItems();
    return () => { mountedRef.current = false; };
  }, [loadItems]);

  // TODO: Zod validation messages need i18n — caller should supply localized schema or use zodI18nMap
  const nameSchema = z.object({
    nameAr: z.string().min(1, "Arabic name is required").max(200),
    nameEn: z.string().max(200).optional().or(z.literal("")),
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = nameSchema.safeParse({ nameAr, nameEn });
    if (!parsed.success) {
      // TODO: "Invalid input" should be localized — caller should supply via options or zodI18nMap
      showToast(parsed.error.flatten().fieldErrors.nameAr?.[0] ?? "Invalid input", "error");
      return;
    }

    setSaving(true);

    try {
      if (editId) {
        const optimisticItem = { id: editId, name_ar: nameAr, name_en: nameEn || null, created_at: "" } as T;
        await update(optimisticItem, async () => {
          const { error } = await supabase
            .from(tableName)
            .update({ name_ar: nameAr, name_en: nameEn || null })
            .eq("id", editId);
          if (error) throw error;
          return optimisticItem;
        });
        showToast(successMessages.update, "success");
        setShowModal(false);
        setEditId(null);
        setNameAr("");
        setNameEn("");
        loadItems();
      } else {
        const optimisticItem = { id: crypto.randomUUID(), name_ar: nameAr, name_en: nameEn || null, created_at: new Date().toISOString() } as T;
        await add(optimisticItem, async () => {
          const { data, error } = await supabase
            .from(tableName)
            .insert({ name_ar: nameAr, name_en: nameEn || null })
            .select()
            .single();
          if (error) throw error;
          return data as T;
        });
        showToast(successMessages.create, "success");
        setShowModal(false);
        setNameAr("");
        setNameEn("");
        loadItems();
      }
    } catch (err) {
      logger.error(`Failed to save ${tableName}`, {
        error: err instanceof Error ? err.message : String(err),
      });
      // TODO: caller should supply a localized error message via errorMessage option
      showToast(errorMessage ?? "Error", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: T) => {
    setEditId(item.id);
    setNameAr(item.name_ar);
    setNameEn(item.name_en || "");
    setShowModal(true);
  };

  const handleOpenAdd = () => {
    setEditId(null);
    setNameAr("");
    setNameEn("");
    setShowModal(true);
  };

  const confirmDelete = (id: string) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);

    try {
      await remove(deleteId, async () => {
        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq("id", deleteId);
        if (error) throw error;
      });
      showToast(successMessages.delete, "success");
      loadItems();
    } catch (err) {
      logger.error(`Failed to delete from ${tableName}`, {
        error: err instanceof Error ? err.message : String(err),
      });
      // TODO: caller should supply a localized error message via errorMessage option
      showToast(errorMessage ?? "Error", "error");
    } finally {
      setSaving(false);
      setShowDeleteModal(false);
      setDeleteId(null);
    }
  };

  return {
    items,
    loading,
    saving: saving || isPending,
    showModal,
    showDeleteModal,
    editId,
    deleteId,
    nameAr,
    nameEn,
    setNameAr,
    setNameEn,
    handleOpenAdd,
    handleEdit,
    handleSave,
    confirmDelete,
    handleDelete,
    setShowModal,
    setShowDeleteModal,
    loadItems,
  };
}
