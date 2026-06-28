"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { logger } from "@/lib/logger";

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
}: UseAdminCrudOptions): UseAdminCrudReturn<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const { showToast } = useToast();
  const supabase = createClient();

  const loadItems = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .order("name_ar");
      if (error) {
        showToast(error.message, "error");
      } else {
        setItems((data || []) as T[]);
      }
    } catch (err) {
      logger.error(`Failed to fetch ${tableName}`, {
        error: err instanceof Error ? err.message : String(err),
      });
      showToast(`Unexpected error loading ${tableName}`, "error");
    } finally {
      setLoading(false);
    }
  }, [supabase, showToast, tableName]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editId) {
        const { error } = await supabase
          .from(tableName)
          .update({ name_ar: nameAr, name_en: nameEn || null })
          .eq("id", editId);
        if (error) {
          showToast(error.message, "error");
        } else {
          showToast(successMessages.update, "success");
          setShowModal(false);
          setEditId(null);
          setNameAr("");
          setNameEn("");
          loadItems();
        }
      } else {
        const { error } = await supabase
          .from(tableName)
          .insert({ name_ar: nameAr, name_en: nameEn || null });
        if (error) {
          showToast(error.message, "error");
        } else {
          showToast(successMessages.create, "success");
          setShowModal(false);
          setNameAr("");
          setNameEn("");
          loadItems();
        }
      }
    } catch (err) {
      logger.error(`Failed to save ${tableName}`, {
        error: err instanceof Error ? err.message : String(err),
      });
      showToast(`Unexpected error saving ${tableName}`, "error");
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
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq("id", deleteId);
      if (!error) {
        showToast(successMessages.delete, "success");
        loadItems();
      } else {
        showToast(error.message, "error");
      }
    } catch (err) {
      logger.error(`Failed to delete from ${tableName}`, {
        error: err instanceof Error ? err.message : String(err),
      });
      showToast(`Unexpected error deleting from ${tableName}`, "error");
    } finally {
      setSaving(false);
      setShowDeleteModal(false);
      setDeleteId(null);
    }
  };

  return {
    items,
    loading,
    saving,
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
