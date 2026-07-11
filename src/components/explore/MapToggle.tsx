"use client";

import { LayoutGrid, Map } from "lucide-react";

interface MapToggleProps {
  viewMode: "grid" | "map";
  onToggle: (mode: "grid" | "map") => void;
  dict: { explore: Record<string, string> };
}

export default function MapToggle({ viewMode, onToggle, dict }: MapToggleProps) {
  return (
    <div className="flex items-center bg-gray-100 rounded-lg p-1" role="radiogroup" aria-label="View mode">
      <button
        role="radio"
        aria-checked={viewMode === "grid"}
        onClick={() => onToggle("grid")}
        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          viewMode === "grid"
            ? "bg-white text-navy-600 shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        <LayoutGrid className="w-4 h-4" />
        <span className="hidden sm:inline">{dict.explore.gridView}</span>
      </button>
      <button
        role="radio"
        aria-checked={viewMode === "map"}
        onClick={() => onToggle("map")}
        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          viewMode === "map"
            ? "bg-white text-navy-600 shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        <Map className="w-4 h-4" />
        <span className="hidden sm:inline">{dict.explore.mapView}</span>
      </button>
    </div>
  );
}
