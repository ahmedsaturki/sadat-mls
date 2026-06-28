"use client";

import { Search, SlidersHorizontal, X, Fence, ParkingCircle, Accessibility } from "lucide-react";
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

export const EMPTY_FILTERS: FilterState = {
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
};

export default function SearchFilters({ dict, zones, types, onSearch }: SearchFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

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
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <form onSubmit={handleSubmit}>
        {/* Main Search */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
              placeholder={dict.explore.searchPlaceholder}
              aria-label={dict.explore.searchPlaceholder}
              className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <Button type="submit">
            {dict.common.search}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="relative"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-[10px] rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
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
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <Fence className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{dict.explore.balcony}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.hasParking}
                    onChange={(e) => updateFilter("hasParking", e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <ParkingCircle className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{dict.explore.parking}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.hasElevator}
                    onChange={(e) => updateFilter("hasElevator", e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <Accessibility className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{dict.explore.elevator}</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Active Filters */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
            <span className="text-sm text-gray-500">{dict.common.filter}:</span>
            <div className="flex flex-wrap gap-2">
              {filters.search && (
                <FilterTag
                  label={filters.search}
                  onRemove={() => updateFilter("search", "")}
                />
              )}
              {filters.zoneId && (
                <FilterTag
                  label={zones.find((z) => z.id === filters.zoneId)?.name || ""}
                  onRemove={() => updateFilter("zoneId", "")}
                />
              )}
              {filters.typeId && (
                <FilterTag
                  label={types.find((t) => t.id === filters.typeId)?.name || ""}
                  onRemove={() => updateFilter("typeId", "")}
                />
              )}
              {filters.hasBalcony && (
                <FilterTag
                  label={dict.explore.balcony}
                  onRemove={() => updateFilter("hasBalcony", false)}
                />
              )}
              {filters.hasParking && (
                <FilterTag
                  label={dict.explore.parking}
                  onRemove={() => updateFilter("hasParking", false)}
                />
              )}
              {filters.hasElevator && (
                <FilterTag
                  label={dict.explore.elevator}
                  onRemove={() => updateFilter("hasElevator", false)}
                />
              )}
            </div>
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm text-red-600 hover:text-red-700 mr-auto"
            >
              {dict.explore.clearAll}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
      {label}
      <button onClick={onRemove} aria-label={`Remove ${label}`} className="hover:text-blue-900">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}
