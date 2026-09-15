"use client";

import { useCallback, useState } from "react";

interface AdminCrudItem {
  id: string;
  name_ar: string;
  name_en: string | null;
  created_at: string;
}

interface UseAdminCrudOptions {
  tableName: string;
  successMessages: { create: string; update: string; delete: string };
  errorMessage: string;
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

export function useAdminCrud<T extends AdminCrudItem>({ tableName: _tableName, successMessages: _successMessages, errorMessage: _errorMessage }: UseAdminCrudOptions): UseAdminCrudReturn<T> {
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");

  const loadItems = useCallback(async () => {}, []);
  const handleOpenAdd = useCallback(() => {
    setEditId(null);
    setNameAr("");
    setNameEn("");
    setShowModal(true);
  }, []);
  const handleEdit = useCallback((item: T) => {
    setEditId(item.id);
    setNameAr(item.name_ar);
    setNameEn(item.name_en || "");
    setShowModal(true);
  }, []);
  const handleSave = useCallback(async (_e: React.FormEvent) => {
    setShowModal(false);
  }, []);
  const confirmDelete = useCallback((id: string) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  }, []);
  const handleDelete = useCallback(async () => {
    setShowDeleteModal(false);
    setDeleteId(null);
  }, []);

  return {
    items: [],
    loading: false,
    saving: false,
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
