"use client";

import { Search, SlidersHorizontal, X, DoorOpen, ParkingCircle, Accessibility } from "lucide-react";
import { useState, useCallback, useEffect, useRef } from "react";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";

interface SearchFiltersProps {
  dict: {
    explore: Record<string, string>;
    common: Record<string, string>;
  };
  zones: { id: string; name: string }[];
  types: { id: string; name: string }[];
  onSearch: (filters: FilterState) => void;
  locale?: string;
}

export interface FilterState {
  search: string;
  zoneId: string;
  typeId: string;
  minPrice: string;
  maxPrice: string;
  minArea: string;
  maxArea: string;
  bedrooms: string;
  bathrooms: string;
  hasBalcony: boolean;
  hasParking: boolean;
  hasElevator: boolean;
}

export const EMPTY_FILTERS = {
  search: "",
  zoneId: "",
  typeId: "",
  minPrice: "",
  maxPrice: "",
  minArea: "",
  maxArea: "",
  bedrooms: "",
  bathrooms: "",
  hasBalcony: false,
  hasParking: false,
  hasElevator: false,
} as const satisfies FilterState;

export default function SearchFilters({ dict, zones, types, onSearch, locale }: SearchFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedSearch = useCallback((newFilters: FilterState) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => onSearch(newFilters), 300);
  }, [onSearch]);

  useEffect(() => {
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, []);

  const updateFilter = (key: keyof FilterState, value: string | boolean) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    // Auto-search on text input changes (debounced)
    if (key === "search" || key === "minPrice" || key === "maxPrice" || key === "minArea" || key === "maxArea") {
      debouncedSearch(newFilters);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    onSearch(filters);
  };

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    onSearch(EMPTY_FILTERS);
  };

  const activeFilterCount = Object.entries(filters).filter(([key, v]) => {
    if (key === "search") return v !== "";
    if (typeof v === "boolean") return v;
    return v !== "";
  }).length;

  return (
    <div className="glass-luxury rounded-2xl p-5 shadow-lg shadow-navy-800/5">
      <form onSubmit={handleSubmit}>
        {/* Main Search */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gold-500 start-3" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
              placeholder={dict.explore.searchPlaceholder}
              aria-label={dict.explore.searchPlaceholder}
              className="w-full py-3 border border-gray-200 rounded-xl text-sm bg-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all duration-300 placeholder:text-gray-400 ps-10 pe-4"
            />
          </div>
          <Button type="submit" className="bg-gradient-to-r from-navy-800 to-navy-800/90 hover:from-navy-800/90 hover:to-navy-800 text-white px-6 rounded-xl shadow-md shadow-navy-800/20 hover:shadow-lg hover:shadow-navy-800/30 transition-all duration-300">
            {dict.common.search}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="relative"
            aria-label={dict.explore.advancedFilters}
            aria-expanded={showAdvanced}
            aria-controls="advanced-filters-section"
          >
            <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -end-1 w-4 h-4 bg-navy-600 text-white text-[10px] rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div
            id="advanced-filters-section"
            className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/20"
            aria-labelledby="advanced-filters-heading"
          >
            <h3 id="advanced-filters-heading" className="sr-only">
              {dict.explore.advancedFilters}
            </h3>
            <Select
              label={dict.explore.zone}
              value={filters.zoneId}
              onChange={(e) => updateFilter("zoneId", e.target.value)}
              options={zones.map((z) => ({ value: z.id, label: z.name }))}
              placeholder={dict.explore.allZones}
            />
            <Select
              label={dict.explore.type}
              value={filters.typeId}
              onChange={(e) => updateFilter("typeId", e.target.value)}
              options={types.map((t) => ({ value: t.id, label: t.name }))}
              placeholder={dict.explore.allTypes}
            />
            <Input
              label={dict.explore.minPrice}
              type="number"
              value={filters.minPrice}
              onChange={(e) => updateFilter("minPrice", e.target.value)}
              placeholder="0"
            />
            <Input
              label={dict.explore.maxPrice}
              type="number"
              value={filters.maxPrice}
              onChange={(e) => updateFilter("maxPrice", e.target.value)}
              placeholder="∞"
            />
            <Input
              label={dict.explore.minArea}
              type="number"
              value={filters.minArea}
              onChange={(e) => updateFilter("minArea", e.target.value)}
              placeholder="0"
            />
            <Input
              label={dict.explore.maxArea}
              type="number"
              value={filters.maxArea}
              onChange={(e) => updateFilter("maxArea", e.target.value)}
              placeholder="∞"
            />
            <Select
              label={dict.explore.bedrooms}
              value={filters.bedrooms}
              onChange={(e) => updateFilter("bedrooms", e.target.value)}
              options={[
                { value: "1", label: "1" },
                { value: "2", label: "2" },
                { value: "3", label: "3" },
                { value: "4", label: "4" },
                { value: "5", label: "5+" },
              ]}
              placeholder={dict.explore.any}
            />
            <Select
              label={dict.explore.bathrooms}
              value={filters.bathrooms}
              onChange={(e) => updateFilter("bathrooms", e.target.value)}
              options={[
                { value: "1", label: "1" },
                { value: "2", label: "2" },
                { value: "3", label: "3" },
                { value: "4", label: "4+" },
              ]}
              placeholder={dict.explore.any}
            />

            {/* Features */}
            <div className="col-span-2 md:col-span-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {dict.explore.features}
              </label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.hasBalcony}
                    onChange={(e) => updateFilter("hasBalcony", e.target.checked)}
                    className="w-4 h-4 text-navy-600 rounded focus:ring-navy-500"
                  />
                  <DoorOpen className="w-4 h-4 text-gray-500" aria-hidden="true" />
                  <span className="text-sm text-gray-700">{dict.explore.balcony}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.hasParking}
                    onChange={(e) => updateFilter("hasParking", e.target.checked)}
                    className="w-4 h-4 text-navy-600 rounded focus:ring-navy-500"
                  />
                  <ParkingCircle className="w-4 h-4 text-gray-500" aria-hidden="true" />
                  <span className="text-sm text-gray-700">{dict.explore.parking}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.hasElevator}
                    onChange={(e) => updateFilter("hasElevator", e.target.checked)}
                    className="w-4 h-4 text-navy-600 rounded focus:ring-navy-500"
                  />
                  <Accessibility className="w-4 h-4 text-gray-500" aria-hidden="true" />
                  <span className="text-sm text-gray-700">{dict.explore.elevator}</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Active Filters */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/20">
            <span className="text-sm text-gray-500">{dict.common.filter}:</span>
            <div className="flex flex-wrap gap-2">
              {filters.search && (
                <FilterTag
                  label={filters.search}
                  onRemove={() => updateFilter("search", "")}
                  removeLabel={dict.common.removeFilter}
                  filterLabel={dict.common?.filter ?? ""}
                />
              )}
              {filters.zoneId && (
                <FilterTag
                  label={zones.find((z) => z.id === filters.zoneId)?.name || ""}
                  onRemove={() => updateFilter("zoneId", "")}
                  removeLabel={dict.common.removeFilter}
                  filterLabel={dict.common?.filter ?? ""}
                />
              )}
              {filters.typeId && (
                <FilterTag
                  label={types.find((t) => t.id === filters.typeId)?.name || ""}
                  onRemove={() => updateFilter("typeId", "")}
                  removeLabel={dict.common.removeFilter}
                  filterLabel={dict.common?.filter ?? ""}
                />
              )}
              {filters.hasBalcony && (
                <FilterTag
                  label={dict.explore.balcony}
                  onRemove={() => updateFilter("hasBalcony", false)}
                  removeLabel={dict.common.removeFilter}
                  filterLabel={dict.common?.filter ?? ""}
                />
              )}
              {filters.hasParking && (
                <FilterTag
                  label={dict.explore.parking}
                  onRemove={() => updateFilter("hasParking", false)}
                  removeLabel={dict.common.removeFilter}
                  filterLabel={dict.common?.filter ?? ""}
                />
              )}
              {filters.hasElevator && (
                <FilterTag
                  label={dict.explore.elevator}
                  onRemove={() => updateFilter("hasElevator", false)}
                  removeLabel={dict.common.removeFilter}
                  filterLabel={dict.common?.filter ?? ""}
                />
              )}
            </div>
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm text-red-600 hover:text-red-700 me-auto"
            >
              {dict.explore.clearAll}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

function FilterTag({ label, onRemove, removeLabel, filterLabel }: { label: string; onRemove: () => void; removeLabel: string; filterLabel: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-3 py-1.5 bg-gold-500/10 text-navy-800 text-xs font-medium rounded-full border border-gold-500/20 backdrop-blur-sm hover:bg-gold-500/20 transition-colors duration-200"
      role="status"
      aria-label={`${label} ${filterLabel}`}
    >
      {label}
      <button
        onClick={onRemove}
        aria-label={`${removeLabel} ${label}`}
        className="hover:text-gold-500 transition-colors focus:outline-none focus:ring-1 focus:ring-gold-500 rounded"
        type="button"
      >
        <X className="w-3 h-3" aria-hidden="true" />
      </button>
    </span>
  );
}
