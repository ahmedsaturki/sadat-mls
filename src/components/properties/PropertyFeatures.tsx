"use client";

import type { Messages } from "@/i18n/getMessages";

interface PropertyFeaturesProps {
  dict: Messages;
  formData: {
    balcony: boolean;
    parking: boolean;
    elevator: boolean;
  };
  onChange: (field: string, value: boolean) => void;
}

export default function PropertyFeatures({
  dict,
  formData,
  onChange,
}: PropertyFeaturesProps) {
  const features = [
    { key: "balcony", label: dict.property.hasBalcony },
    { key: "parking", label: dict.property.hasParking },
    { key: "elevator", label: dict.property.hasElevator },
  ] as const;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {features.map(({ key, label }) => (
        <label
          key={key}
          className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 cursor-pointer hover:bg-gray-50 transition"
        >
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            checked={formData[key]}
            onChange={(e) => onChange(key, e.target.checked)}
          />
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </label>
      ))}
    </div>
  );
}
