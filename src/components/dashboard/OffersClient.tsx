"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Coins, CheckCircle, XCircle, ArrowLeftRight } from "lucide-react";
import { getMessages } from "@/i18n/getMessages";
import { useToast } from "@/components/ui/Toast";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import PageHeader from "@/components/ui/PageHeader";
import PaginatedTable from "@/components/ui/PaginatedTable";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { ROLES, type UserRole } from "@/lib/utils/constants";
import { useAuthUser } from "@/hooks/useAuthUser";
import { logger } from "@/lib/logger";
import { getCsrfHeaders } from "@/lib/security/csrf-client";
import { type Locale } from "@/i18n/config";
import { LuxuryLoader } from "@/components/ui/LuxuryLoader";

interface Offer {
  id: string;
  property_id: string;
  office_id: string;
  offerer_name: string;
  offerer_email: string | null;
  offerer_phone: string | null;
  offer_amount: number;
  message: string | null;
  status: string;
  counter_amount: number | null;
  counter_message: string | null;
  agent_notes: string | null;
  created_at: string;
  properties?: { title: string } | null;
}

export default function OffersClient({ params }: { params: { locale: string } }) {
  const locale = params.locale as Locale;
  const dict = getMessages(locale);
  const { user, profile, supabase } = useAuthUser();
  const userRole = (profile?.role as UserRole) || ROLES.OFFICE_AGENT;

  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Counter modal
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [counterOffer, setCounterOffer] = useState<Offer | null>(null);
  const [counterAmount, setCounterAmount] = useState("");
  const [counterMessage, setCounterMessage] = useState("");
  const [savingCounter, setSavingCounter] = useState(false);

  const { showToast } = useToast();
  const mountedRef = useRef(true);

  const loadOffers = useCallback(async () => {
    try {
      const res = await fetch("/api/offers?limit=50");
      if (res.ok) {
        const data = await res.json();
        if (mountedRef.current) setOffers(data.offers || []);
      }
    } catch (err) {
      logger.error("Failed to load offers", { error: err instanceof Error ? err.message : String(err) });
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    loadOffers();
    return () => { mountedRef.current = false; };
  }, [loadOffers]);

  const handleStatusChange = async (offerId: string, status: "accepted" | "rejected") => {
    setActionLoading(offerId);
    try {
      const res = await fetch(`/api/offers/${offerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getCsrfHeaders() },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        showToast(status === "accepted" ? dict.dashboard.offerAccepted : dict.dashboard.offerRejected, "success");
        loadOffers();
      } else {
        showToast(dict.common.unexpectedError, "error");
      }
    } catch (err) {
      logger.error("Failed to update offer", { error: err instanceof Error ? err.message : String(err) });
      showToast(dict.common.unexpectedError, "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCounter = async () => {
    if (!counterOffer || !counterAmount) return;
    setSavingCounter(true);
    try {
      const res = await fetch(`/api/offers/${counterOffer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getCsrfHeaders() },
        body: JSON.stringify({
          status: "countered",
          counter_amount: parseFloat(counterAmount),
          counter_message: counterMessage || null,
        }),
      });

      if (res.ok) {
        showToast(dict.dashboard.counterOffer, "success");
        setShowCounterModal(false);
        setCounterOffer(null);
        setCounterAmount("");
        setCounterMessage("");
        loadOffers();
      } else {
        showToast(dict.common.unexpectedError, "error");
      }
    } catch (err) {
      logger.error("Failed to counter offer", { error: err instanceof Error ? err.message : String(err) });
      showToast(dict.common.unexpectedError, "error");
    } finally {
      setSavingCounter(false);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { variant: "warning" | "success" | "danger" | "info"; label: string }> = {
      pending: { variant: "warning", label: dict.dashboard.pending },
      accepted: { variant: "success", label: dict.dashboard.accepted },
      rejected: { variant: "danger", label: dict.dashboard.rejected },
      countered: { variant: "info", label: dict.dashboard.countered },
    };
    const config = map[status] || { variant: "info" as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US").format(price) + " EGP";

  return (
    <DashboardLayout locale={locale} dict={dict} role={userRole}>
      <ErrorBoundary>
        <div className="space-y-6">
          <PageHeader title={dict.dashboard.offers} />

          <Card padding="none">
            {loading ? (
              <SkeletonTable rows={5} />
            ) : (
              <PaginatedTable
                data={offers}
                searchKey="offerer_name"
                searchPlaceholder={dict.dashboard.offerer}
                emptyMessage={dict.common.noData}
                emptyIcon={<Coins className="w-12 h-12 text-navy-300" />}
                emptyHint={dict.dashboard.noOffersHint}
                columns={[
                  {
                    key: "properties",
                    header: dict.dashboard.property,
                    render: (offer) => (
                      <span className="font-medium text-gray-900">
                        {String((offer.properties as Record<string, unknown>)?.title || "-")}
                      </span>
                    ),
                  },
                  {
                    key: "offerer_name",
                    header: dict.dashboard.offerer,
                    render: (offer) => (
                      <div>
                        <p className="font-medium text-gray-900">{offer.offerer_name}</p>
                        {offer.offerer_phone && <p className="text-xs text-gray-500">{offer.offerer_phone}</p>}
                      </div>
                    ),
                  },
                  {
                    key: "offer_amount",
                    header: dict.dashboard.offerAmount,
                    render: (offer) => (
                      <span className="font-semibold text-navy-600">{formatPrice(Number(offer.offer_amount))}</span>
                    ),
                  },
                  {
                    key: "status",
                    header: dict.common.status,
                    render: (offer) => statusBadge(offer.status),
                  },
                  {
                    key: "created_at",
                    header: dict.common.createdAt,
                    render: (offer) => (
                      <span className="text-sm text-gray-500">
                        {new Date(offer.created_at).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US")}
                      </span>
                    ),
                  },
                  {
                    key: "actions",
                    header: dict.admin.columnActions,
                    render: (offer) => (
                      <div className="flex items-center gap-2">
                        {offer.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleStatusChange(offer.id, "accepted")}
                              disabled={actionLoading === offer.id}
                              className="p-2 rounded-lg hover:bg-green-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                              aria-label={dict.dashboard.acceptOffer}
                            >
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            </button>
                            <button
                              onClick={() => { setCounterOffer(offer); setCounterAmount(String(offer.offer_amount)); setShowCounterModal(true); }}
                              className="p-2 rounded-lg hover:bg-blue-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                              aria-label={dict.dashboard.counterOfferButton}
                            >
                              <ArrowLeftRight className="w-4 h-4 text-blue-500" />
                            </button>
                            <button
                              onClick={() => handleStatusChange(offer.id, "rejected")}
                              disabled={actionLoading === offer.id}
                              className="p-2 rounded-lg hover:bg-red-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                              aria-label={dict.dashboard.rejectOffer}
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

          {/* Counter Offer Modal */}
          <Modal isOpen={showCounterModal} onClose={() => setShowCounterModal(false)} title={dict.dashboard.counterOffer} size="lg">
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                {dict.dashboard.offerer}: {counterOffer?.offerer_name} | {dict.dashboard.offerAmount}: {counterOffer ? formatPrice(Number(counterOffer.offer_amount)) : ""}
              </p>
              <Input
                label={dict.dashboard.counterAmount}
                type="number"
                value={counterAmount}
                onChange={(e) => setCounterAmount(e.target.value)}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{dict.dashboard.counterMessage}</label>
                <textarea
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                  rows={3}
                  value={counterMessage}
                  onChange={(e) => setCounterMessage(e.target.value)}
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <Button variant="ghost" onClick={() => setShowCounterModal(false)}>{dict.common.cancel}</Button>
                <Button onClick={handleCounter} isLoading={savingCounter}>{dict.dashboard.counterOfferButton}</Button>
              </div>
            </div>
          </Modal>
        </div>
      </ErrorBoundary>
    </DashboardLayout>
  );
}
