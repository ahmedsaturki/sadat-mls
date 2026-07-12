"use client";

import { useState, useMemo, useCallback } from "react";
import { Calculator, RotateCcw, TrendingUp, Home, DollarSign, BarChart3, AlertCircle } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/getMessages";

interface PropertyOption {
  id: string;
  title: string;
  price: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  zoneName?: string;
  typeName?: string;
}

interface ROICalculatorProps {
  locale: Locale;
  dict: Messages;
  properties: PropertyOption[];
}

interface InputValues {
  purchasePrice: string;
  monthlyRent: string;
  downPayment: string;
  mortgageRate: string;
  mortgageTerm: string;
  appreciationRate: string;
  maintenanceCost: string;
  vacancyRate: string;
  propertyTax: string;
}

interface YearProjection {
  year: number;
  propertyValue: number;
  equity: number;
  annualIncome: number;
  annualExpenses: number;
  netReturn: number;
  cumulativeROI: number;
}

const DEFAULT_VALUES: InputValues = {
  purchasePrice: "",
  monthlyRent: "",
  downPayment: "20",
  mortgageRate: "12",
  mortgageTerm: "20",
  appreciationRate: "5",
  maintenanceCost: "1",
  vacancyRate: "5",
  propertyTax: "0",
};

function formatCurrency(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number): string {
  return value.toFixed(1) + "%";
}

export default function ROICalculator({ locale, dict, properties }: ROICalculatorProps) {
  const isAr = locale === "ar";
  const [values, setValues] = useState<InputValues>(DEFAULT_VALUES);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [showResults, setShowResults] = useState(false);

  const handlePropertySelect = useCallback((propertyId: string) => {
    setSelectedPropertyId(propertyId);
    if (propertyId) {
      const property = properties.find((p) => p.id === propertyId);
      if (property) {
        setValues((prev) => ({
          ...prev,
          purchasePrice: String(property.price),
          monthlyRent: String(Math.round(property.price * 0.005)),
        }));
      }
    }
  }, [properties]);

  const handleChange = useCallback((field: keyof InputValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setShowResults(false);
  }, []);

  const handleReset = useCallback(() => {
    setValues(DEFAULT_VALUES);
    setSelectedPropertyId("");
    setShowResults(false);
  }, []);

  const results = useMemo(() => {
    const price = Number(values.purchasePrice) || 0;
    const rent = Number(values.monthlyRent) || 0;
    const downPct = Number(values.downPayment) || 20;
    const rate = Number(values.mortgageRate) || 12;
    const term = Number(values.mortgageTerm) || 20;
    const appreciation = Number(values.appreciationRate) || 5;
    const maintenance = Number(values.maintenanceCost) || 1;
    const vacancy = Number(values.vacancyRate) || 5;
    const tax = Number(values.propertyTax) || 0;

    if (price <= 0) return null;

    const downPayment = price * (downPct / 100);
    const loanAmount = price - downPayment;
    const monthlyRate = rate / 100 / 12;
    const totalMonths = term * 12;

    // Monthly mortgage payment (amortization formula)
    let monthlyMortgage = 0;
    if (loanAmount > 0 && monthlyRate > 0) {
      monthlyMortgage = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
    }

    const annualRent = rent * 12 * (1 - vacancy / 100);
    const annualMortgage = monthlyMortgage * 12;
    const annualMaintenance = price * (maintenance / 100);
    const annualExpenses = annualMortgage + annualMaintenance + tax;
    const annualCashFlow = annualRent - annualExpenses;
    const monthlyCashFlow = annualCashFlow / 12;

    const totalInvestment = downPayment + annualMaintenance * 0; // Just down payment for cash-on-cash
    const capRate = ((annualRent - annualMaintenance - tax) / price) * 100;
    const cashOnCash = totalInvestment > 0 ? (annualCashFlow / downPayment) * 100 : 0;
    const grossYield = (annualRent / price) * 100;
    const netYield = ((annualRent - annualMaintenance - tax) / price) * 100;

    // Break-even: years to recover down payment from positive cash flow
    let breakEvenYears = 0;
    if (annualCashFlow > 0) {
      breakEvenYears = downPayment / annualCashFlow;
    }

    // Year-by-year projection
    const projections: YearProjection[] = [];
    let currentValue = price;
    let remainingLoan = loanAmount;
    let cumulativeReturn = 0;

    for (let year = 1; year <= 20; year++) {
      currentValue *= 1 + appreciation / 100;

      // Calculate remaining loan balance for this year
      let balance = remainingLoan;
      for (let m = 0; m < 12; m++) {
        if (balance > 0) {
          const interest = balance * monthlyRate;
          const principal = monthlyMortgage - interest;
          balance = Math.max(0, balance - principal);
        }
      }
      remainingLoan = balance;

      const equity = currentValue - remainingLoan;
      const yearIncome = rent * 12 * (1 - vacancy / 100);
      const yearMaintenance = currentValue * (maintenance / 100);
      const yearExpenses = annualMortgage + yearMaintenance + tax;
      const yearNet = yearIncome - yearExpenses;
      cumulativeReturn += yearNet;

      projections.push({
        year,
        propertyValue: Math.round(currentValue),
        equity: Math.round(equity),
        annualIncome: Math.round(yearIncome),
        annualExpenses: Math.round(yearExpenses),
        netReturn: Math.round(yearNet),
        cumulativeROI: downPayment > 0 ? (cumulativeReturn / downPayment) * 100 : 0,
      });
    }

    const fiveYearROI = projections[4]?.cumulativeROI || 0;
    const tenYearROI = projections[9]?.cumulativeROI || 0;
    const twentyYearROI = projections[19]?.cumulativeROI || 0;

    return {
      monthlyMortgage: Math.round(monthlyMortgage),
      monthlyCashFlow: Math.round(monthlyCashFlow),
      capRate,
      cashOnCash,
      totalInvestment: Math.round(downPayment),
      grossYield,
      netYield,
      breakEvenYears,
      fiveYearROI,
      tenYearROI,
      twentyYearROI,
      projections,
    };
  }, [values]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-navy-50 text-navy-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
          <Calculator className="w-4 h-4" />
          {dict.investor.roiCalculator}
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{dict.investor.roiCalculator}</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">{dict.investor.roiCalculatorDescription}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Home className="w-5 h-5 text-navy-600" />
              {dict.investor.propertySelection}
            </h2>

            {/* Property Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {dict.investor.propertySelection}
              </label>
              <select
                value={selectedPropertyId}
                onChange={(e) => handlePropertySelect(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-navy-500 focus:border-navy-500"
              >
                <option value="">{dict.investor.selectPropertyPlaceholder}</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} — {formatCurrency(p.price, locale)} EGP ({p.area}m²)
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">{dict.investor.orEnterManually}</p>
            </div>

            {/* Input Fields */}
            <div className="space-y-4">
              <InputField
                label={dict.investor.purchasePrice}
                value={values.purchasePrice}
                onChange={(v) => handleChange("purchasePrice", v)}
                suffix="EGP"
              />
              <InputField
                label={dict.investor.monthlyRent}
                value={values.monthlyRent}
                onChange={(v) => handleChange("monthlyRent", v)}
                suffix="EGP"
              />
              <InputField
                label={dict.investor.downPayment}
                value={values.downPayment}
                onChange={(v) => handleChange("downPayment", v)}
                suffix="%"
              />
              <InputField
                label={dict.investor.mortgageRate}
                value={values.mortgageRate}
                onChange={(v) => handleChange("mortgageRate", v)}
                suffix="%"
              />
              <InputField
                label={dict.investor.mortgageTerm}
                value={values.mortgageTerm}
                onChange={(v) => handleChange("mortgageTerm", v)}
                suffix={isAr ? "سنوات" : "years"}
              />
              <InputField
                label={dict.investor.appreciationRate}
                value={values.appreciationRate}
                onChange={(v) => handleChange("appreciationRate", v)}
                suffix="%"
              />
              <InputField
                label={dict.investor.maintenanceCost}
                value={values.maintenanceCost}
                onChange={(v) => handleChange("maintenanceCost", v)}
                suffix="%"
              />
              <InputField
                label={dict.investor.vacancyRate}
                value={values.vacancyRate}
                onChange={(v) => handleChange("vacancyRate", v)}
                suffix="%"
              />
              <InputField
                label={dict.investor.propertyTax}
                value={values.propertyTax}
                onChange={(v) => handleChange("propertyTax", v)}
                suffix="EGP"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowResults(true)}
                className="flex-1 bg-navy-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-navy-700 transition-colors flex items-center justify-center gap-2"
              >
                <Calculator className="w-4 h-4" />
                {dict.investor.calculate}
              </button>
              <button
                onClick={handleReset}
                className="bg-gray-100 text-gray-700 py-2.5 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                aria-label={dict.investor.reset}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2">
          {!showResults || !results ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{dict.investor.results}</h3>
              <p className="text-gray-500">{dict.investor.roiCalculatorDescription}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <ResultCard
                  icon={<DollarSign className="w-5 h-5" />}
                  label={dict.investor.monthlyMortgage}
                  value={formatCurrency(results.monthlyMortgage, locale) + " EGP"}
                  color="blue"
                />
                <ResultCard
                  icon={<TrendingUp className="w-5 h-5" />}
                  label={dict.investor.monthlyCashFlow}
                  value={formatCurrency(results.monthlyCashFlow, locale) + " EGP"}
                  color={results.monthlyCashFlow >= 0 ? "green" : "red"}
                />
                <ResultCard
                  icon={<BarChart3 className="w-5 h-5" />}
                  label={dict.investor.capRate}
                  value={formatPercent(results.capRate)}
                  color={results.capRate >= 0 ? "green" : "red"}
                />
                <ResultCard
                  icon={<Calculator className="w-5 h-5" />}
                  label={dict.investor.cashOnCash}
                  value={formatPercent(results.cashOnCash)}
                  color={results.cashOnCash >= 0 ? "green" : "red"}
                />
              </div>

              {/* Secondary Metrics */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{dict.investor.results}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <MetricRow label={dict.investor.totalInvestment} value={formatCurrency(results.totalInvestment, locale) + " EGP"} />
                  <MetricRow label={dict.investor.grossRentalYield} value={formatPercent(results.grossYield)} />
                  <MetricRow label={dict.investor.netRentalYield} value={formatPercent(results.netYield)} />
                  <MetricRow
                    label={dict.investor.breakEvenYears}
                    value={results.breakEvenYears > 0 ? results.breakEvenYears.toFixed(1) + (isAr ? " سنة" : " yrs") : "—"}
                  />
                  <MetricRow label={dict.investor.fiveYearROI} value={formatPercent(results.fiveYearROI)} highlight />
                  <MetricRow label={dict.investor.tenYearROI} value={formatPercent(results.tenYearROI)} highlight />
                </div>
              </div>

              {/* Year-by-Year Projection Table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">{dict.investor.projection}</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left px-4 py-3 font-medium text-gray-600">{dict.investor.year}</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-600">{dict.investor.propertyValue}</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-600">{dict.investor.equity}</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-600">{dict.investor.annualIncome}</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-600">{dict.investor.netReturn}</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-600">{dict.investor.cumulativeROI}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.projections.filter((_, i) => [0, 4, 9, 14, 19].includes(i)).map((p) => (
                        <tr key={p.year} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{p.year}</td>
                          <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(p.propertyValue, locale)}</td>
                          <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(p.equity, locale)}</td>
                          <td className="px-4 py-3 text-right text-green-600">{formatCurrency(p.annualIncome, locale)}</td>
                          <td className={`px-4 py-3 text-right font-medium ${p.netReturn >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {formatCurrency(p.netReturn, locale)}
                          </td>
                          <td className={`px-4 py-3 text-right font-medium ${p.cumulativeROI >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {formatPercent(p.cumulativeROI)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-800">{dict.investor.disclaimer}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  suffix: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-16 text-sm focus:ring-2 focus:ring-navy-500 focus:border-navy-500"
          min="0"
          step="any"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">{suffix}</span>
      </div>
    </div>
  );
}

function ResultCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "blue" | "green" | "red";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colors[color]}`}>
        {icon}
      </div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-lg font-bold text-gray-900">{value}</p>
    </div>
  );
}

function MetricRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={`p-3 rounded-lg ${highlight ? "bg-navy-50" : "bg-gray-50"}`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-base font-semibold ${highlight ? "text-navy-700" : "text-gray-900"}`}>{value}</p>
    </div>
  );
}
