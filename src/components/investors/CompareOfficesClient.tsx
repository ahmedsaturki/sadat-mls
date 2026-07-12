"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Building2, Users, Home, Phone, FileText, DollarSign,
  BarChart3, CheckCircle, TrendingUp, Star,
} from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/getMessages";

interface OfficeStats {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  createdAt: string;
  stats: {
    properties: { total: number; available: number; sold: number; rented: number };
    agents: number;
    contacts: { total: number; pending: number };
    offers: { total: number; accepted: number; totalValue: number };
    commissions: { total: number; paid: number; saleValue: number };
    totalMarketValue: number;
    avgPrice: number;
  };
}

interface CompareOfficesClientProps {
  locale: Locale;
  dict: Messages;
}

function formatCurrency(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", { maximumFractionDigits: 0 }).format(value) + " EGP";
}

function getBestOffice(offices: OfficeStats[], key: (s: OfficeStats["stats"]) => number): string | null {
  if (offices.length === 0) return null;
  let best = offices[0];
  let bestVal = key(best.stats);
  for (const o of offices) {
    const val = key(o.stats);
    if (val > bestVal) { best = o; bestVal = val; }
  }
  return best.id;
}

export default function CompareOfficesClient({ locale, dict }: CompareOfficesClientProps) {
  const [offices, setOffices] = useState<OfficeStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/analytics/offices");
      if (res.ok) {
        const data = await res.json();
        setOffices(data.offices || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleOffice = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 4) next.add(id);
      return next;
    });
  };

  const selected = offices.filter((o) => selectedIds.has(o.id));
  const maxProps = Math.max(...selected.map((o) => o.stats.properties.total), 1);
  const maxAgents = Math.max(...selected.map((o) => o.stats.agents), 1);
  const maxValue = Math.max(...selected.map((o) => o.stats.totalMarketValue), 1);

  const bestProps = getBestOffice(selected, (s) => s.properties.total);
  const bestAgents = getBestOffice(selected, (s) => s.agents);
  const bestValue = getBestOffice(selected, (s) => s.totalMarketValue);
  const bestDeals = getBestOffice(selected, (s) => s.offers.accepted);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-navy-50 text-navy-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
          <BarChart3 className="w-4 h-4" />
          {dict.investor.compareOffices}
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{dict.investor.compareOffices}</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">{dict.investor.compareOfficesDescription}</p>
        <p className="text-sm text-gray-400 mt-2">{dict.investor.selectUpTo4}</p>
      </div>

      {/* Office Selection Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
              <div className="h-10 bg-gray-200 rounded mb-3" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {offices.map((office) => {
            const isSelected = selectedIds.has(office.id);
            return (
              <button
                key={office.id}
                onClick={() => toggleOffice(office.id)}
                className={`bg-white rounded-xl border-2 p-4 text-left transition-all ${
                  isSelected ? "border-navy-500 shadow-md ring-2 ring-navy-200" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  {office.logoUrl ? (
                    <img src={office.logoUrl} alt={office.name} className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-navy-100 flex items-center justify-center text-navy-600 font-bold text-sm">
                      {office.name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{office.name}</p>
                    <p className="text-xs text-gray-500">{office.stats.properties.total} {dict.investor.listings}</p>
                  </div>
                </div>
                    {isSelected && (
                  <div className="flex items-center gap-1 text-xs text-navy-600 mt-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    {(dict.common as Record<string, unknown>).selected as string || "✓"}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Comparison Results */}
      {selected.length >= 2 ? (
        <div className="space-y-6">
          {/* Visual Bar Charts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Properties */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Home className="w-5 h-5 text-navy-600" />
                <h3 className="font-semibold text-gray-900">{dict.investor.listings}</h3>
              </div>
              <div className="space-y-3">
                {selected.map((o) => (
                  <div key={o.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 truncate max-w-[120px]">{o.name}</span>
                      <span className={`font-medium ${o.id === bestProps ? "text-green-600" : "text-gray-900"}`}>
                        {o.stats.properties.total}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-navy-500 transition-all duration-500"
                        style={{ width: `${(o.stats.properties.total / maxProps) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Agents */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">{dict.investor.agents}</h3>
              </div>
              <div className="space-y-3">
                {selected.map((o) => (
                  <div key={o.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 truncate max-w-[120px]">{o.name}</span>
                      <span className={`font-medium ${o.id === bestAgents ? "text-green-600" : "text-gray-900"}`}>
                        {o.stats.agents}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${(o.stats.agents / maxAgents) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Market Value */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-gray-900">{dict.investor.totalMarketValue}</h3>
              </div>
              <div className="space-y-3">
                {selected.map((o) => (
                  <div key={o.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 truncate max-w-[120px]">{o.name}</span>
                      <span className={`font-medium text-xs ${o.id === bestValue ? "text-green-600" : "text-gray-900"}`}>
                        {formatCurrency(o.stats.totalMarketValue, locale)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-green-500 transition-all duration-500"
                        style={{ width: `${(o.stats.totalMarketValue / maxValue) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Detailed Comparison Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{dict.investor.detailedComparison}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-6 py-3 font-medium text-gray-600 w-48">{dict.investor.metric}</th>
                    {selected.map((o) => (
                      <th key={o.id} className="text-center px-4 py-3 font-medium text-gray-900 min-w-[140px]">{o.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: (dict.investor as Record<string, unknown>).totalListings as string || "Total Listings", render: (o: OfficeStats) => String(o.stats.properties.total), best: bestProps },
                    { label: dict.investor.available, render: (o: OfficeStats) => String(o.stats.properties.available) },
                    { label: dict.investor.sold, render: (o: OfficeStats) => String(o.stats.properties.sold) },
                    { label: dict.investor.agents, render: (o: OfficeStats) => String(o.stats.agents), best: bestAgents },
                    { label: dict.investor.contacts, render: (o: OfficeStats) => String(o.stats.contacts.total) },
                    { label: dict.investor.totalOffers, render: (o: OfficeStats) => String(o.stats.offers.total) },
                    { label: (dict.investor as Record<string, unknown>).dealsClosed as string || "Deals Closed", render: (o: OfficeStats) => String(o.stats.offers.accepted), best: bestDeals },
                    { label: dict.investor.totalMarketValue, render: (o: OfficeStats) => formatCurrency(o.stats.totalMarketValue, locale), best: bestValue },
                    { label: dict.investor.totalCommission, render: (o: OfficeStats) => formatCurrency(o.stats.commissions.total, locale) },
                    { label: dict.investor.avgPrice, render: (o: OfficeStats) => formatCurrency(o.stats.avgPrice, locale) },
                  ].map((row, idx) => (
                    <tr key={idx} className="border-t border-gray-100">
                      <td className="px-6 py-3 font-medium text-gray-600">{row.label}</td>
                      {selected.map((o) => (
                        <td key={o.id} className={`px-4 py-3 text-center ${row.best === o.id ? "font-semibold text-green-600" : "text-gray-700"}`}>
                          {row.render(o)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : selected.length === 1 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{dict.investor.selectMoreOffices}</h3>
          <p className="text-gray-500">{dict.investor.selectMoreHint}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{dict.investor.selectOfficesToCompare}</h3>
          <p className="text-gray-500">{dict.investor.selectOfficesHint}</p>
        </div>
      )}
    </div>
  );
}
