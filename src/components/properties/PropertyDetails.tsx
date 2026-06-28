"use client";

import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import type { Messages } from "@/i18n/getMessages";

interface PropertyDetailsProps {
  dict: Messages;
  formData: {
    price: string;
    area: string;
    bedrooms: string;
    bathrooms: string;
    floors: string;
    status: string;
  };
  errors: Record<string, string>;
  onChange: (field: string, value: string) => void;
}

export default function PropertyDetails({
  dict,
  formData,
  errors,
  onChange,
}: PropertyDetailsProps) {
  const statusOptions = Object.entries(dict.property.status).map(([value, label]) => ({
    value,
    label,
  }));

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div>
        <Input
          label={dict.property.price}
          type="number"
          value={formData.price}
          onChange={(e) => onChange("price", e.target.value)}
        />
        {errors.price && (
          <p className="text-red-500 text-xs mt-1">{errors.price}</p>
        )}
      </div>

      <Input
        label={dict.property.area}
        type="number"
        value={formData.area}
        onChange={(e) => onChange("area", e.target.value)}
      />

      <Input
        label={dict.property.bedrooms}
        type="number"
        value={formData.bedrooms}
        onChange={(e) => onChange("bedrooms", e.target.value)}
      />

      <Input
        label={dict.property.bathrooms}
        type="number"
        value={formData.bathrooms}
        onChange={(e) => onChange("bathrooms", e.target.value)}
      />

      <Input
        label={dict.property.floors}
        type="number"
        value={formData.floors}
        onChange={(e) => onChange("floors", e.target.value)}
      />

      <Select
        label={dict.property.statusLabel}
        value={formData.status}
        onChange={(e) => onChange("status", e.target.value)}
        options={statusOptions}
      />
    </div>
  );
}
