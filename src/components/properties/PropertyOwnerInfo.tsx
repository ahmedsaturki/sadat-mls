"use client";

import Button from "@/components/ui/Button";
import type { Messages } from "@/i18n/getMessages";
import type { Locale } from "@/i18n/config";

interface PropertyOwnerInfoProps {
  dict: Messages;
  locale: Locale;
  owners: {
    owner_name: string;
    owner_phone: string;
    owner_email?: string;
    notes?: string;
  }[];
  errors?: Record<string, string>;
  onChange: (
    index: number,
    field: string,
    value: string,
  ) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

export default function PropertyOwnerInfo({
  dict,
  locale,
  owners,
  errors,
  onChange,
  onAdd,
  onRemove,
}: PropertyOwnerInfoProps) {
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">
          {dict.office.propertyOwner}
        </h3>
        {onAdd && (
          <Button
            type="button"
            onClick={onAdd}
            variant="outline"
            size="sm"
            dir={dir}
          >
            + {dict.common.add}
          </Button>
        )}
      </div>

      {owners.map((owner, index) => (
        <div key={index} className="rounded-lg border border-gray-200 p-4 space-y-3 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <input
                placeholder={`${dict.office.ownerName} *`}
                aria-label={dict.office.ownerName}
                aria-invalid={!!errors?.[`owner_name_${index}`]}
                aria-describedby={errors?.[`owner_name_${index}`] ? `owner_name_${index}-error` : undefined}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={owner.owner_name}
                onChange={(e) => onChange(index, "owner_name", e.target.value)}
              />
              {errors?.[`owner_name_${index}`] && (
                <p id={`owner_name_${index}-error`} className="text-red-500 text-xs" role="alert">
                  {errors[`owner_name_${index}`]}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <input
                placeholder={`${dict.office.ownerPhone} *`}
                aria-label={dict.office.ownerPhone}
                aria-invalid={!!errors?.[`owner_phone_${index}`]}
                aria-describedby={errors?.[`owner_phone_${index}`] ? `owner_phone_${index}-error` : undefined}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={owner.owner_phone}
                onChange={(e) => onChange(index, "owner_phone", e.target.value)}
              />
              {errors?.[`owner_phone_${index}`] && (
                <p id={`owner_phone_${index}-error`} className="text-red-500 text-xs" role="alert">
                  {errors[`owner_phone_${index}`]}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <input
                placeholder={dict.office.ownerEmail}
                aria-label={dict.office.ownerEmail}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={owner.owner_email || ""}
                onChange={(e) => onChange(index, "owner_email", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <input
                placeholder={dict.office.ownerNotes}
                aria-label={dict.office.ownerNotes}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={owner.notes || ""}
                onChange={(e) => onChange(index, "notes", e.target.value)}
              />
            </div>
          </div>
          {owners.length > 1 && onRemove && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1 rounded hover:bg-red-50 transition-colors"
                aria-label={dict.common.remove}
              >
                {dict.common.remove}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
