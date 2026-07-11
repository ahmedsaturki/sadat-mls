"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { DollarSign, CheckCircle, Clock, Filter } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import PageHeader from "@/components/ui/PageHeader";
import PaginatedTable from "@/components/ui/PaginatedTable";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { getMessages } from "@/i18n/getMessages";
import { useToast } from "@/components/ui/Toast";
import { ROLES, type UserRole } from "@/lib/utils/constants";
import { useAuthUser } from "@/hooks/useAuthUser";
import { logger } from "@/lib/logger";
import { getCsrfHeaders } from "@/lib/security/csrf-client";
import { type Locale } from "@/i18n/config";
import { LuxuryLoader } from "@/components/ui/LuxuryLoader";

interface Commission {
  id: string;
  property_id: string;
  offer_id: string;
  listing_office_id: string;
  referring_office_id: string | null;
  agent_id: string | null;
  sale_amount: number;
  commission_rate: number;
  total_commission: number;
  listing_share: number;
  referring_share: number;
  status: string;
  notes: string | null;
  created_at: string;
  properties?: { title: string } | null;
  offices?: { name: string } | Record<string, { name: string }>;
}

interface CommissionSummary {
  total: number;
  pending: number;
  paid: number;
  count: number;
}

export default function CommissionsClient({ params }: { params: { locale: string } }) {
  const locale = params.locale as Locale;
  const dict = getMessages(locale);
  const { profile } = useAuthUser();
  const userRole = (profile?.role as UserRole) || ROLES.OFFICE_AGENT;
  const { showToast } = useToast();

  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [summary, setSummary] = useState<CommissionSummary>({ total: 0, pending: 0, paid: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"all" | "month" | "quarter">("all");
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const loadCommissions = useCallback(async () => {
    try {
      const res = await fetch(`/api/commissions?period=${period}`);
      if (res.ok) {
        const data = await res.json();
        if (mountedRef.current) {
          setCommissions(data.commissions || []);
          setSummary(data.summary || { total: 0, pending: 0, paid: 0, count: 0 });
        }
      }
    } catch (err) {
      logger.error("Failed to load commissions", { error: err instanceof Error ? err.message : String(err) });
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    mountedRef.current = true;
    setLoading(true);
    loadCommissions();
    return () => { mountedRef.current = false; };
  }, [loadCommissions]);

  const handleMarkPaid = async (id: string) => {
    setMarkingPaid(id);
    try {
      const res = await fetch(`/api/commissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getCsrfHeaders() },
        body: JSON.stringify({ status: "paid" }),
      });
      if (res.ok) {
        showToast(dict.dashboard.commissionPaid, "success");
        loadCommissions();
      } else {
        showToast(dict.common.unexpectedError, "error");
      }
    } catch (err) {
      logger.error("Failed to mark commission as paid", { error: err instanceof Error ? err.message : String(err) });
      showToast(dict.common.unexpectedError, "error");
    } finally {
      setMarkingPaid(null);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US").format(Math.round(price)) + " EGP";

  return (
    <DashboardLayout locale={locale} dict={dict} role={userRole}>
      <ErrorBoundary>
        <div className="space-y-6">
          <PageHeader title={dict.dashboard.commissions} />

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-navy-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-navy-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{formatPrice(summary.total)}</p>
                  <p className="text-sm text-gray-500">{dict.dashboard.totalCommissions}</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{formatPrice(summary.pending)}</p>
                  <p className="text-sm text-gray-500">{dict.dashboard.pendingCommissions}</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{formatPrice(summary.paid)}</p>
                  <p className="text-sm text-gray-500">{dict.dashboard.paidCommissions}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Period Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            {(["all", "month", "quarter"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  period === p
                    ? "bg-navy-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {p === "all" ? dict.dashboard.allTime : p === "month" ? dict.dashboard.thisMonth : dict.dashboard.last3Months}
              </button>
            ))}
          </div>

          {/* Commissions Table */}
          <Card padding="none">
            {loading ? (
              <SkeletonTable rows={5} />
            ) : (
              <PaginatedTable
                data={commissions}
                searchKey="properties"
                searchPlaceholder={dict.dashboard.searchOffices || dict.common.search}
                emptyMessage={dict.common.noData}
                emptyIcon={<DollarSign className="w-12 h-12 text-navy-300" />}
                emptyHint={dict.dashboard.noCommissionsHint}
                columns={[
                  {
                    key: "properties",
                    header: dict.common.details,
                    render: (c) => {
                      const props = c.properties as Record<string, unknown> | null;
                      return (
                        <span className="font-medium text-gray-900">
                          {props?.title || "-"}
                        </span>
                      );
                    },
                  },
                  {
                    key: "sale_amount",
                    header: dict.dashboard.saleAmount,
                    render: (c) => (
                      <span className="font-semibold text-gray-900">{formatPrice(Number(c.sale_amount))}</span>
                    ),
                  },
                  {
                    key: "total_commission",
                    header: dict.dashboard.totalCommissions,
                    render: (c) => (
                      <span className="font-semibold text-navy-600">{formatPrice(Number(c.total_commission))}</span>
                    ),
                  },
                  {
                    key: "listing_share",
                    header: dict.dashboard.listingShare,
                    render: (c) => <span className="text-sm text-gray-700">{formatPrice(Number(c.listing_share))}</span>,
                  },
                  {
                    key: "status",
                    header: dict.common.status,
                    render: (c) => (
                      <Badge variant={c.status === "paid" ? "success" : "warning"}>
                        {c.status === "paid" ? dict.dashboard.paidCommissions : dict.dashboard.pendingCommissions}
                      </Badge>
                    ),
                  },
                  {
                    key: "created_at",
                    header: dict.common.createdAt,
                    render: (c) => (
                      <span className="text-sm text-gray-500">
                        {new Date(c.created_at).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US")}
                      </span>
                    ),
                  },
                  ...(userRole === ROLES.SUPER_ADMIN
                    ? [
                        {
                          key: "actions" as const,
                          header: dict.admin.columnActions,
                          render: (c: Commission) => (
                            c.status === "pending" ? (
                              <button
                                onClick={() => handleMarkPaid(c.id)}
                                disabled={markingPaid === c.id}
                                className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                              >
                                {dict.dashboard.markAsPaid}
                              </button>
                            ) : (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            )
                          ),
                        },
                      ]
                    : []),
                ]}
              />
            )}
          </Card>
        </div>
      </ErrorBoundary>
    </DashboardLayout>
  );
}
