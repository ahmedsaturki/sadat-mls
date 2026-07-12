"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart3, Users, TrendingUp, DollarSign, Target, ArrowUpRight,
  ArrowDownRight, Building2, Phone, FileText, CheckCircle, Clock,
  Send, Inbox, Award,
} from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/getMessages";

interface AgentPerf {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  isActive: boolean;
  joinedAt: string;
  listings: { total: number; available: number; sold: number; rented: number; reserved: number };
  contacts: number;
  offers: { total: number; accepted: number };
  commission: { total: number; paid: number; pending: number };
  totalSaleValue: number;
  conversionRates: { contactToOffer: number; offerToDeal: number };
  avgDaysToSell: number;
}

interface Funnel {
  properties: number;
  contacts: number;
  offers: number;
  acceptedOffers: number;
  pendingOffers: number;
  rejectedOffers: number;
  totalCommission: number;
  paidCommission: number;
  contactToOfferRate: number;
  offerToAcceptRate: number;
  overallConversion: number;
}

interface MonthlyTrend {
  month: string;
  properties: number;
  contacts: number;
  offers: number;
  deals: number;
}

interface AnalyticsData {
  agentPerformance: AgentPerf[];
  funnel: Funnel;
  referrals: { sent: number; received: number; closed: number };
  monthlyTrends: MonthlyTrend[];
}

interface AnalyticsDashboardProps {
  locale: Locale;
  dict: Messages;
}

function formatCurrency(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", { maximumFractionDigits: 0 }).format(value) + " EGP";
}

function formatPercent(value: number): string {
  return value.toFixed(1) + "%";
}

export default function AnalyticsDashboard({ locale, dict }: AnalyticsDashboardProps) {
  const isAr = locale === "ar";
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/analytics/office");
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="h-8 bg-gray-200 rounded w-48 mb-8 animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">{dict.analytics.title}</h1>

      {/* Funnel Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <FunnelCard icon={<Building2 className="w-5 h-5" />} label={dict.analytics.totalListings} value={String(data.funnel.properties)} color="navy" />
        <FunnelCard icon={<Phone className="w-5 h-5" />} label={dict.analytics.totalContacts} value={String(data.funnel.contacts)} color="blue" />
        <FunnelCard icon={<FileText className="w-5 h-5" />} label={dict.analytics.totalOffers} value={String(data.funnel.offers)} color="purple" />
        <FunnelCard icon={<CheckCircle className="w-5 h-5" />} label={dict.analytics.dealsClosed} value={String(data.funnel.acceptedOffers)} color="green" />
      </div>

      {/* Conversion Rates */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <RateCard label={dict.analytics.contactToOfferRate} value={formatPercent(data.funnel.contactToOfferRate)} icon={<Target className="w-5 h-5" />} />
        <RateCard label={dict.analytics.offerToAcceptRate} value={formatPercent(data.funnel.offerToAcceptRate)} icon={<CheckCircle className="w-5 h-5" />} />
        <RateCard label={dict.analytics.overallConversion} value={formatPercent(data.funnel.overallConversion)} icon={<TrendingUp className="w-5 h-5" />} />
      </div>

      {/* Commission Summary */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{dict.analytics.totalCommission}</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.funnel.totalCommission, locale)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-green-600 font-medium">{formatCurrency(data.funnel.paidCommission, locale)}</span>
            <span className="text-gray-400">{dict.analytics.paid}</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{dict.analytics.referrals}</p>
              <p className="text-2xl font-bold text-gray-900">{data.referrals.sent + data.referrals.received}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-green-600 font-medium">{data.referrals.closed}</span>
            <span className="text-gray-400">{dict.analytics.closed}</span>
          </div>
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{dict.analytics.monthlyTrends}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left px-4 py-2 font-medium text-gray-600">{dict.analytics.month}</th>
                <th className="text-right px-4 py-2 font-medium text-gray-600">{dict.analytics.listings}</th>
                <th className="text-right px-4 py-2 font-medium text-gray-600">{dict.analytics.contacts}</th>
                <th className="text-right px-4 py-2 font-medium text-gray-600">{dict.analytics.offers}</th>
                <th className="text-right px-4 py-2 font-medium text-gray-600">{dict.analytics.deals}</th>
              </tr>
            </thead>
            <tbody>
              {data.monthlyTrends.map((t) => (
                <tr key={t.month} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{t.month}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{t.properties}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{t.contacts}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{t.offers}</td>
                  <td className="px-4 py-3 text-right text-green-600 font-medium">{t.deals}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Agent Performance Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-navy-600" />
            {dict.analytics.agentPerformance}
          </h2>
        </div>
        {data.agentPerformance.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">{dict.analytics.noAgents}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{dict.analytics.agent}</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">{dict.analytics.listings}</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">{dict.analytics.sold}</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">{dict.analytics.contacts}</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">{dict.analytics.offers}</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">{dict.analytics.commission}</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">{dict.analytics.avgDaysToSell}</th>
                </tr>
              </thead>
              <tbody>
                {data.agentPerformance.map((agent, idx) => (
                  <tr key={agent.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-navy-100 flex items-center justify-center text-navy-600 font-semibold text-sm">
                          {idx === 0 && <Award className="w-4 h-4 text-yellow-500" />}
                          {idx !== 0 && (agent.name.charAt(0).toUpperCase())}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{agent.name}</p>
                          <p className="text-xs text-gray-500">{agent.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">{agent.listings.total}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-green-600">
                        {agent.listings.sold}
                        {agent.listings.rented > 0 && <span className="text-blue-600">+{agent.listings.rented}</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">{agent.contacts}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-gray-700">{agent.offers.total}</span>
                      {agent.offers.accepted > 0 && (
                        <span className="text-green-600 ml-1">({agent.offers.accepted})</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-gray-900">{formatCurrency(agent.commission.total, locale)}</span>
                      {agent.commission.pending > 0 && (
                        <p className="text-xs text-yellow-600">{formatCurrency(agent.commission.pending, locale)} {dict.analytics.pending}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">
                      {agent.avgDaysToSell > 0 ? `${agent.avgDaysToSell} ${dict.analytics.days}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function FunnelCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    navy: "bg-navy-50 text-navy-600",
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    green: "bg-green-50 text-green-600",
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colors[color]}`}>{icon}</div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function RateCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  const rate = parseFloat(value);
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-3">
        <div className="text-gray-400">{icon}</div>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
      <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${rate >= 50 ? "bg-green-500" : rate >= 25 ? "bg-yellow-500" : "bg-red-500"}`}
          style={{ width: `${Math.min(rate, 100)}%` }}
        />
      </div>
    </div>
  );
}
