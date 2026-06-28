"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Tags } from "lucide-react";
import { getMessages } from "@/i18n/getMessages";
import { usePageLocale } from "@/hooks/usePageLocale";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import PageHeader from "@/components/ui/PageHeader";
import PaginatedTable from "@/components/ui/PaginatedTable";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { ROLES } from "@/lib/utils/constants";
import { useAdminCrud } from "@/hooks/useAdminCrud";
import { useAuthUser } from "@/hooks/useAuthUser";

export default function PropertyTypesPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = usePageLocale(params);
  const router = useRouter();
  const { user, profile } = useAuthUser();
  const dict = getMessages(locale);

  // Call hooks before any conditional returns (React Rules of Hooks)
  const {
    items: types,
    loading,
    saving,
    showModal,
    showDeleteModal,
    editId,
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
  } = useAdminCrud({
    tableName: "property_types",
    successMessages: {
      create: dict.admin.addPropertyType + " ✓",
      update: dict.common.save + " ✓",
      delete: dict.common.delete + " ✓",
    },
  });

  // Auth guard - protect admin route (runs after hooks, safe for redirects)
  useEffect(() => {
    if (!user) {
      router.push(`/${locale}/login`);
      return;
    }
    if (profile?.role !== ROLES.SUPER_ADMIN) {
      router.push(`/${locale}/dashboard`);
      return;
    }
  }, [user, profile, locale, router]);

  // Don't render content if not authorized
  if (!user || profile?.role !== ROLES.SUPER_ADMIN) {
    return null;
  }

  return (
    <DashboardLayout locale={locale} dict={dict} role={ROLES.SUPER_ADMIN}>
      <ErrorBoundary>
        <div className="space-y-6">
          <PageHeader
            title={dict.admin.managePropertyTypes}
            action={
              <Button onClick={handleOpenAdd}>
                {dict.admin.addPropertyType}
              </Button>
            }
          />

          <Card padding="none">
            {loading ? (
              <SkeletonTable rows={5} />
            ) : (
              <PaginatedTable
                data={types}
                searchKey="name_ar"
                searchPlaceholder={dict.admin.searchPropertyTypes || "Search property types..."}
                emptyMessage={dict.common.noData}
                emptyIcon={<Tags className="w-12 h-12 text-orange-300" />}
                emptyHint={dict.admin.addPropertyTypesHint}
columns={[
                   {
                     key: "name_ar",
                     header: dict.admin.propertyTypeNameHeader,
                     render: (type) => (
                       <div className="flex items-center gap-2">
                         <Tags className="w-4 h-4 text-gray-400" />
                         <span className="font-medium text-gray-900">{type.name_ar}</span>
                       </div>
                     ),
                   },
                   {
                     key: "name_en",
                     header: dict.admin.propertyTypeNameEnHeader,
                     render: (type) => type.name_en || "-",
                   },
                  {
                    key: "actions",
                    header: dict.common.actions,
                    render: (type) => (
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEdit(type)} aria-label={`${dict.common.edit} ${type.name_ar}`} className="p-2 rounded-lg hover:bg-blue-50">
                          <span className="text-blue-500">{dict.common.edit}</span>
                        </button>
                        <button onClick={() => confirmDelete(type.id)} aria-label={`${dict.common.delete} ${type.name_ar}`} className="p-2 rounded-lg hover:bg-red-50">
                          <span className="text-red-500">{dict.common.delete}</span>
                        </button>
                      </div>
                    ),
                  },
                ]}
              />
            )}
          </Card>

          <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editId ? dict.admin.editPropertyType : dict.admin.addPropertyType}>
            <form onSubmit={handleSave} className="space-y-4">
              <Input label={dict.admin.propertyTypeNameAr} value={nameAr} onChange={(e) => setNameAr(e.target.value)} required />
              <Input label={dict.admin.propertyTypeNameEn} value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
              <div className="flex gap-3 justify-end pt-4">
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>{dict.common.cancel}</Button>
                <Button type="submit" isLoading={saving}>{dict.common.save}</Button>
              </div>
            </form>
          </Modal>

          <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title={dict.common.confirm} size="sm">
            <div className="space-y-4">
              <p className="text-gray-600">{dict.admin.deletePropertyType}</p>
              <div className="flex gap-3 justify-end">
                <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>{dict.common.cancel}</Button>
                <Button variant="danger" onClick={handleDelete} isLoading={saving}>{dict.common.delete}</Button>
              </div>
            </div>
          </Modal>
        </div>
      </ErrorBoundary>
    </DashboardLayout>
  );
}