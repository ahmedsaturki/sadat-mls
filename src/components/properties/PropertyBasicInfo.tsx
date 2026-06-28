"use client";

import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/getMessages";

interface PropertyBasicInfoProps {
  locale: Locale;
  dict: Messages;
  formData: {
    title: string;
    description: string;
    property_type_id: string;
    zone_id: string;
    street: string;
  };
  zones: { id: string; name_ar: string; name_en: string }[];
  types: { id: string; name_ar: string; name_en: string }[];
  errors: Record<string, string>;
  onChange: (field: string, value: string) => void;
  titleRef?: React.RefObject<HTMLInputElement>;
}

export default function PropertyBasicInfo({
  locale,
  dict,
  formData,
  zones,
  types,
  errors,
  onChange,
  titleRef,
}: PropertyBasicInfoProps) {
  const zoneOptions = zones.map((z) => ({
    value: z.id,
    label: locale === "ar" ? z.name_ar : z.name_en || z.name_ar,
  }));

  const typeOptions = types.map((t) => ({
    value: t.id,
    label: locale === "ar" ? t.name_ar : t.name_en || t.name_ar,
  }));

  return (
    <div className="space-y-4">
      <div>
        <Input
          ref={titleRef}
          label={dict.property.title}
          value={formData.title}
          onChange={(e) => onChange("title", e.target.value)}
        />
        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          {dict.property.description}
        </label>
        <textarea
          id="description"
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
          value={formData.description}
          onChange={(e) => onChange("description", e.target.value)}
        />
        {errors.description && (
          <p className="text-red-500 text-xs mt-1">{errors.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label={dict.property.type}
          value={formData.property_type_id}
          onChange={(e) => onChange("property_type_id", e.target.value)}
          options={[{ value: "", label: dict.office.selectType }, ...typeOptions]}
        />
        <Select
          label={dict.property.zone}
          value={formData.zone_id}
          onChange={(e) => onChange("zone_id", e.target.value)}
          options={[{ value: "", label: dict.office.selectZone }, ...zoneOptions]}
        />
      </div>

      <div>
        <Input
          label={dict.property.street}
          value={formData.street}
          onChange={(e) => onChange("street", e.target.value)}
        />
        {errors.street && <p className="text-red-500 text-xs mt-1">{errors.street}</p>}
      </div>
    </div>
  );
}
