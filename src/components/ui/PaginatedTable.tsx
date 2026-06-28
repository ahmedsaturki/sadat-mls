"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

interface Column<T> {
  key: string;
  header: string;
  className?: string;
  render?: (item: T) => ReactNode;
  searchable?: boolean;
}

interface PaginatedTableProps<T> {
  data: T[];
  columns: Column<T>[];
  pageSize?: number;
  searchPlaceholder?: string;
  searchKey?: string;
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  emptyHint?: string;
  resultsLabel?: string;
  dir?: "rtl" | "ltr";
}

export default function PaginatedTable<T extends { id?: string | number }>({
  data,
  columns,
  pageSize = 10,
  searchPlaceholder = "Search...",
  searchKey,
  emptyMessage = "No data",
  emptyIcon,
  emptyHint,
  resultsLabel = "results",
  dir = "rtl",
}: PaginatedTableProps<T>) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const filtered = searchKey
    ? data.filter((item) => {
        const val = String((item as Record<string, unknown>)[searchKey] || "").toLowerCase();
        return val.includes(search.toLowerCase());
      })
    : data;

  const totalPages = Math.ceil(filtered.length / pageSize);
  const from = (page - 1) * pageSize;
  const paged = filtered.slice(from, from + pageSize);

  return (
    <div>
      {searchKey && (
        <div className="p-3 border-b border-gray-200">
          <div className="relative max-w-xs">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="w-full pl-3 pr-9 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full" aria-label={resultsLabel}>
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase ${col.className || ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paged.map((item, i) => (
              <tr key={item.id || i} className="hover:bg-gray-50">
                {columns.map((col) => (
                  <td key={col.key} className={`px-6 py-4 ${col.className || ""}`}>
                    {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {paged.length === 0 && (
        <div className="text-center py-12">
          {emptyIcon && <div className="mb-4">{emptyIcon}</div>}
          <p className="text-gray-500 mb-1">{emptyMessage}</p>
          {emptyHint && <p className="text-sm text-gray-400">{emptyHint}</p>}
        </div>
      )}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
          <span className="text-sm text-gray-500">
            {filtered.length} {resultsLabel}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label={dir === "rtl" ? "Next" : "Previous"}
            >
              {dir === "rtl" ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  aria-label={`Page ${pageNum}`}
                  aria-current={page === pageNum ? "page" : undefined}
                  className={`w-8 h-8 rounded-lg text-sm font-medium ${
                    page === pageNum
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label={dir === "rtl" ? "Previous" : "Next"}
            >
              {dir === "rtl" ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
