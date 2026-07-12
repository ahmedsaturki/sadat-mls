"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Copy, RefreshCw, Plus, Users, TrendingUp, Clock, CheckCircle,
  Send, Inbox, Filter, X, Building2, Phone, Mail, FileText, Download,
} from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/getMessages";
import { getCsrfHeaders } from "@/lib/security/csrf-client";

interface Referral {
  id: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  status: string;
  notes: string | null;
  referral_code_used: string | null;
  created_at: string;
  referring_office: { name: string; slug: string } | null;
  referred_office: { name: string; slug: string } | null;
  property: { title: string; price: number } | null;
  offer: { offer_amount: number; status: string } | null;
  commission: { total_commission: number; status: string } | null;
}

interface ReferralStats {
  total: number;
  pending: number;
  contacted: number;
  offerSubmitted: number;
  dealClosed: number;
  thisMonth: number;
}

interface Office {
  id: string;
  name: string;
}

interface ReferralsClientProps {
  locale: Locale;
  dict: Messages;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  contacted: "bg-blue-100 text-blue-800",
  offer_submitted: "bg-purple-100 text-purple-800",
  deal_closed: "bg-green-100 text-green-800",
  expired: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-800",
};

const STATUS_OPTIONS = ["pending", "contacted", "offer_submitted", "deal_closed", "expired", "cancelled"];

function formatDate(dateStr: string, locale: Locale): string {
  return new Date(dateStr).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

function formatPrice(price: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", { maximumFractionDigits: 0 }).format(price) + " EGP";
}

export default function ReferralsClient({ locale, dict }: ReferralsClientProps) {
  const isAr = locale === "ar";
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referralCode, setReferralCode] = useState<string>("");
  const [offices, setOffices] = useState<Office[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "sent" | "received">("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    referred_office_id: "",
    client_name: "",
    client_email: "",
    client_phone: "",
    notes: "",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [referralsRes, codeRes, officesRes] = await Promise.all([
        fetch(`/api/referrals?type=${filter}&limit=20`),
        fetch("/api/referrals/code"),
        fetch("/api/offices/active"),
      ]);

      if (referralsRes.ok) {
        const data = await referralsRes.json();
        setReferrals(data.referrals);
        setStats(data.stats);
      }
      if (codeRes.ok) {
        const data = await codeRes.json();
        setReferralCode(data.code);
      }
      if (officesRes.ok) {
        const data = await officesRes.json();
        setOffices(data.offices || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [referralCode]);

  const handleRegenerateCode = useCallback(async () => {
    try {
      const res = await fetch("/api/referrals/code", {
        method: "POST",
        headers: getCsrfHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setReferralCode(data.code);
      }
    } catch {
      // silent
    }
  }, []);

  const handleCreateReferral = useCallback(async () => {
    if (!form.referred_office_id || !form.client_name) return;
    setCreating(true);
    try {
      const res = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getCsrfHeaders() },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowCreateModal(false);
        setForm({ referred_office_id: "", client_name: "", client_email: "", client_phone: "", notes: "" });
        fetchData();
      }
    } catch {
      // silent
    } finally {
      setCreating(false);
    }
  }, [form, fetchData]);

  const handleStatusUpdate = useCallback(async (referralId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/referrals/${referralId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getCsrfHeaders() },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch {
      // silent
    }
  }, [fetchData]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{dict.referral.title}</h1>
          <p className="text-gray-600 mt-1">{dict.referral.description}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.open("/api/export?type=referrals", "_blank")}
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-navy-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-navy-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {dict.referral.newReferral}
          </button>
        </div>
      </div>

      {/* Referral Code Card */}
      <div className="bg-gradient-to-r from-navy-600 to-navy-700 rounded-xl p-6 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-navy-200 text-sm mb-1">{dict.referral.myCode}</p>
            <p className="text-3xl font-mono font-bold tracking-wider">{referralCode || "Loading..."}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopyCode}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Copy className="w-4 h-4" />
              {copied ? dict.referral.codeCopied : dict.referral.copyCode}
            </button>
            <button
              onClick={handleRegenerateCode}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              aria-label={dict.referral.regenerateCode}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<Users className="w-5 h-5" />} label={dict.referral.totalReferrals} value={String(stats.total)} color="navy" />
          <StatCard icon={<Clock className="w-5 h-5" />} label={dict.referral.pending} value={String(stats.pending)} color="yellow" />
          <StatCard icon={<CheckCircle className="w-5 h-5" />} label={dict.referral.dealsClosed} value={String(stats.dealClosed)} color="green" />
          <StatCard icon={<TrendingUp className="w-5 h-5" />} label={dict.referral.thisMonth} value={String(stats.thisMonth)} color="blue" />
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <Filter className="w-4 h-4 text-gray-500" />
        {(["all", "sent", "received"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f ? "bg-navy-100 text-navy-700" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {f === "all" ? dict.referral.filterAll : f === "sent" ? dict.referral.filterSent : dict.referral.filterReceived}
          </button>
        ))}
      </div>

      {/* Referrals List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : referrals.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{dict.referral.noReferrals}</h3>
          <p className="text-gray-500">{dict.referral.noReferralsHint}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {referrals.map((ref) => {
            const isSent = filter === "sent";
            const otherOffice = isSent ? ref.referred_office : ref.referring_office;
            return (
              <div key={ref.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {isSent ? <Send className="w-4 h-4 text-blue-500" /> : <Inbox className="w-4 h-4 text-green-500" />}
                      <span className="font-semibold text-gray-900">{ref.client_name}</span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {isSent ? dict.referral.referralTo : dict.referral.referredBy}: {otherOffice?.name || "—"}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[ref.status] || "bg-gray-100 text-gray-600"}`}>
                    {dict.referral[ref.status as keyof typeof dict.referral] || ref.status}
                  </span>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                  {ref.client_email && (
                    <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{ref.client_email}</span>
                  )}
                  {ref.client_phone && (
                    <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{ref.client_phone}</span>
                  )}
                  {ref.property && (
                    <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{ref.property.title}</span>
                  )}
                  {ref.offer && (
                    <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" />{formatPrice(ref.offer.offer_amount, locale)}</span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400">{formatDate(ref.created_at, locale)}</span>
                  <div className="flex gap-1">
                    {STATUS_OPTIONS.filter((s) => s !== ref.status).slice(0, 3).map((s) => (
                      <button
                        key={s}
                        onClick={() => handleStatusUpdate(ref.id, s)}
                        className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                      >
                        {dict.referral[s as keyof typeof dict.referral] || s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Referral Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">{dict.referral.newReferral}</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{(dict.referral as Record<string, unknown>).referredOffice as string || dict.referral.referralTo} *</label>
                <select
                  value={form.referred_office_id}
                  onChange={(e) => setForm((p) => ({ ...p, referred_office_id: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-navy-500"
                >
                  <option value="">{dict.referral.selectOffice}</option>
                  {offices.map((o) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{dict.referral.clientName} *</label>
                <input
                  type="text"
                  value={form.client_name}
                  onChange={(e) => setForm((p) => ({ ...p, client_name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-navy-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{dict.referral.clientEmail}</label>
                  <input
                    type="email"
                    value={form.client_email}
                    onChange={(e) => setForm((p) => ({ ...p, client_email: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-navy-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{dict.referral.clientPhone}</label>
                  <input
                    type="tel"
                    value={form.client_phone}
                    onChange={(e) => setForm((p) => ({ ...p, client_phone: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-navy-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{dict.referral.notes}</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-navy-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateReferral}
                disabled={!form.referred_office_id || !form.client_name || creating}
                className="flex-1 bg-navy-600 text-white py-2.5 rounded-lg font-medium hover:bg-navy-700 transition-colors disabled:opacity-50"
              >
                {creating ? dict.common.loading : dict.referral.createReferral}
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="bg-gray-100 text-gray-700 py-2.5 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                {dict.common.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    navy: "bg-navy-50 text-navy-600",
    yellow: "bg-yellow-50 text-yellow-600",
    green: "bg-green-50 text-green-600",
    blue: "bg-blue-50 text-blue-600",
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colors[color] || colors.navy}`}>{icon}</div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
