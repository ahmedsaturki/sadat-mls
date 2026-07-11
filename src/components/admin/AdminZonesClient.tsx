"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
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
import { type Locale } from "@/i18n/config";

export default function AdminZonesClient({
  params,
}: {
  params: { locale: string };
}) {
const locale = params.locale as Locale;
   const router = useRouter();
   const { user, profile } = useAuthUser();
   const dict = getMessages(locale as Locale);

   // Call hooks before any conditional returns (React Rules of Hooks)
   const {
     items: zones,
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
     tableName: "zones",
      successMessages: {
        create: dict.admin.addZone,
        update: dict.common.save,
        delete: dict.common.delete,
      },
     errorMessage: dict.common.unexpectedError,
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
            title={dict.admin.manageZones}
            action={
              <Button onClick={handleOpenAdd}>
                {dict.admin.addZone}
              </Button>
            }
          />

          <Card padding="none">
            {loading ? (
              <SkeletonTable rows={5} />
            ) : (
              <PaginatedTable
                data={zones}
                searchKey="name_ar"
                searchPlaceholder={dict.admin.searchZones}
                emptyMessage={dict.common.noData}
                emptyIcon={<MapPin className="w-12 h-12 text-green-300" aria-hidden="true" />} 
                emptyHint={dict.admin.addZonesHint}
                columns={[
                  {
                    key: "name_ar",
                    header: dict.admin.zoneNameHeader,
                    render: (zone) => (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{zone.name_ar}</span>
                      </div>
                    ),
                  },
                  {
                    key: "name_en",
                    header: dict.admin.zoneNameEnHeader,
                    render: (zone) => zone.name_en || "-",
                  },
                  {
                    key: "actions",
                    header: dict.common.actions,
                    render: (zone) => (
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEdit(zone)} aria-label={`${dict.common.edit} ${zone.name_ar}`} className="p-2 rounded-lg hover:bg-navy-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2">
                          <span className="text-navy-500">{dict.common.edit}</span>
                        </button>
                        <button onClick={() => confirmDelete(zone.id)} aria-label={`${dict.common.delete} ${zone.name_ar}`} className="p-2 rounded-lg hover:bg-red-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2">
                          <span className="text-red-500">{dict.common.delete}</span>
                        </button>
                      </div>
                    ),
                  },
                ]}
              />
            )}
          </Card>

          <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editId ? dict.admin.editZone : dict.admin.addZone}>
            <form onSubmit={handleSave} className="space-y-4">
              <Input label={dict.admin.zoneNameAr} value={nameAr} onChange={(e) => setNameAr(e.target.value)} required />
              <Input label={dict.admin.zoneNameEn} value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
              <div className="flex gap-3 justify-end pt-4">
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>{dict.common.cancel}</Button>
                <Button type="submit" isLoading={saving}>{dict.common.save}</Button>
              </div>
            </form>
          </Modal>

          <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title={dict.common.confirm} size="sm">
            <div className="space-y-4">
              <p className="text-gray-600">{dict.admin.deleteZone}</p>
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