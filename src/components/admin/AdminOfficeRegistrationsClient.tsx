"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ClipboardCheck, CheckCircle, XCircle, Building2 } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import PageHeader from "@/components/ui/PageHeader";
import PaginatedTable from "@/components/ui/PaginatedTable";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { getMessages } from "@/i18n/getMessages";
import { useToast } from "@/components/ui/Toast";
import { ROLES } from "@/lib/utils/constants";
import { logger } from "@/lib/logger";
import { useAuthUser } from "@/hooks/useAuthUser";
import { type Locale } from "@/i18n/config";
import { LuxuryLoader } from "@/components/ui/LuxuryLoader";
import { getCsrfHeaders } from "@/lib/security/csrf-client";

interface PendingOffice {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: string;
  is_active: boolean;
  created_at: string;
}

export default function AdminOfficeRegistrationsClient({
  params,
}: {
  params: { locale: string };
}) {
  const locale = params.locale as Locale;
  const router = useRouter();
  const { user: authUser, profile, supabase } = useAuthUser();
  const [offices, setOffices] = useState<PendingOffice[]>([]);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedOffice, setSelectedOffice] = useState<PendingOffice | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();
  const dict = getMessages(locale as Locale);
  const mountedRef = useRef(true);

  useEffect(() => {
    if (!authUser) {
      router.push(`/${locale}/login`);
      return;
    }
    if (profile?.role !== ROLES.SUPER_ADMIN) {
      router.push(`/${locale}/dashboard`);
      return;
    }
  }, [authUser, profile, locale, router]);

  const loadOffices = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("offices")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        showToast(dict.common.unexpectedError, "error");
      } else {
        // Show all offices with their status
        setOffices(data || []);
      }
    } catch (err) {
      logger.error("Failed to fetch offices", { error: err instanceof Error ? err.message : String(err) });
      showToast(dict.common.unexpectedError, "error");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [supabase, showToast, dict.common.unexpectedError]);

  useEffect(() => {
    mountedRef.current = true;
    loadOffices();
    return () => { mountedRef.current = false; };
  }, [loadOffices]);

  if (!authUser || profile?.role !== ROLES.SUPER_ADMIN) {
    return null;
  }

  if (loading) {
    return (
      <DashboardLayout locale={locale} dict={dict} role={ROLES.SUPER_ADMIN}>
        <div className="flex items-center justify-center py-20">
          <LuxuryLoader />
        </div>
      </DashboardLayout>
    );
  }

  const handleApprove = async () => {
    if (!selectedOffice) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("offices")
        .update({ status: "active", is_active: true })
        .eq("id", selectedOffice.id);

      if (error) {
        showToast(dict.common.unexpectedError, "error");
      } else {
        showToast(dict.admin.officeApproved, "success");

        // Send approval email (fire-and-forget)
        const { officeApprovedEmail } = await import("@/lib/email/templates");
        const { sendEmail } = await import("@/lib/email/send");
        const { isEmailEnabled } = await import("@/lib/email/config");

        if (isEmailEnabled() && selectedOffice.email) {
          const { subject, html, text } = officeApprovedEmail({
            locale: "ar",
            officeName: selectedOffice.name,
            adminName: selectedOffice.name,
            approved: true,
          });
          sendEmail({ to: selectedOffice.email, subject, html, text }).catch(() => {});
        }

        loadOffices();
      }
    } catch (err) {
      logger.error("Failed to approve office", { error: err instanceof Error ? err.message : String(err) });
      showToast(dict.common.unexpectedError, "error");
    } finally {
      setSaving(false);
      setShowApproveModal(false);
      setSelectedOffice(null);
    }
  };

  const handleReject = async () => {
    if (!selectedOffice) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("offices")
        .update({ status: "rejected", is_active: false })
        .eq("id", selectedOffice.id);

      if (error) {
        showToast(dict.common.unexpectedError, "error");
      } else {
        showToast(dict.admin.officeRejected, "success");
        loadOffices();
      }
    } catch (err) {
      logger.error("Failed to reject office", { error: err instanceof Error ? err.message : String(err) });
      showToast(dict.common.unexpectedError, "error");
    } finally {
      setSaving(false);
      setShowRejectModal(false);
      setSelectedOffice(null);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { variant: "success" | "warning" | "danger" | "info"; label: string }> = {
      active: { variant: "success", label: dict.common.active },
      pending: { variant: "warning", label: dict.admin.statusUpcoming },
      rejected: { variant: "danger", label: dict.admin.officeRejected },
      suspended: { variant: "danger", label: dict.common.inactive },
    };
    const config = map[status] || { variant: "info" as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <DashboardLayout locale={locale} dict={dict} role={ROLES.SUPER_ADMIN}>
      <ErrorBoundary>
        <div className="space-y-6">
          <PageHeader title={dict.admin.pendingRegistrations} />

          <Card padding="none">
            {loading ? (
              <SkeletonTable rows={5} />
            ) : (
              <PaginatedTable
                data={offices}
                searchKey="name"
                searchPlaceholder={dict.admin.searchOffices}
                emptyMessage={dict.common.noData}
                emptyIcon={<ClipboardCheck className="w-12 h-12 text-navy-300" />}
                emptyHint={dict.admin.noPendingHint}
                columns={[
                  {
                    key: "name",
                    header: dict.admin.columnOffice,
                    render: (office) => (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-navy-100 rounded-full flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-navy-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{office.name}</p>
                          <p className="text-sm text-gray-500">{office.slug}</p>
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "email",
                    header: dict.admin.columnContact,
                    render: (office) => (
                      <>
                        <p className="text-sm text-gray-900">{office.email || "-"}</p>
                        <p className="text-sm text-gray-500">{office.phone || ""}</p>
                      </>
                    ),
                  },
                  {
                    key: "status",
                    header: dict.admin.columnStatus,
                    render: (office) => statusBadge(office.status),
                  },
                  {
                    key: "created_at",
                    header: dict.admin.registeredDate,
                    render: (office) => (
                      <span className="text-sm text-gray-500">
                        {new Date(office.created_at).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US")}
                      </span>
                    ),
                  },
                  {
                    key: "actions",
                    header: dict.admin.columnActions,
                    render: (office) => (
                      <div className="flex items-center gap-2">
                        {office.status === "pending" && (
                          <>
                            <button
                              onClick={() => { setSelectedOffice(office); setShowApproveModal(true); }}
                              className="p-2 rounded-lg hover:bg-green-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                              aria-label={dict.admin.approveOffice}
                            >
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            </button>
                            <button
                              onClick={() => { setSelectedOffice(office); setShowRejectModal(true); }}
                              className="p-2 rounded-lg hover:bg-red-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                              aria-label={dict.admin.rejectOffice}
                            >
                              <XCircle className="w-4 h-4 text-red-500" />
                            </button>
                          </>
                        )}
                      </div>
                    ),
                  },
                ]}
              />
            )}
          </Card>

          {/* Approve Modal */}
          <Modal isOpen={showApproveModal} onClose={() => setShowApproveModal(false)} title={dict.admin.confirmApprove} size="sm">
            <div className="space-y-4">
              <p className="text-gray-600">{dict.admin.confirmApprove} <strong>{selectedOffice?.name}</strong>?</p>
              <div className="flex gap-3 justify-end">
                <Button variant="ghost" onClick={() => setShowApproveModal(false)}>{dict.common.cancel}</Button>
                <Button onClick={handleApprove} isLoading={saving}>{dict.admin.approveOffice}</Button>
              </div>
            </div>
          </Modal>

          {/* Reject Modal */}
          <Modal isOpen={showRejectModal} onClose={() => setShowRejectModal(false)} title={dict.admin.confirmReject} size="sm">
            <div className="space-y-4">
              <p className="text-gray-600">{dict.admin.confirmReject} <strong>{selectedOffice?.name}</strong>?</p>
              <div className="flex gap-3 justify-end">
                <Button variant="ghost" onClick={() => setShowRejectModal(false)}>{dict.common.cancel}</Button>
                <Button variant="danger" onClick={handleReject} isLoading={saving}>{dict.admin.rejectOffice}</Button>
              </div>
            </div>
          </Modal>
        </div>
      </ErrorBoundary>
    </DashboardLayout>
  );
}
