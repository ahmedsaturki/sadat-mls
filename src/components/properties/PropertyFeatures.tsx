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
  // Add descriptive tooltips for features using dict
  const featureDescriptions: Record<keyof typeof formData, string> = {
    balcony: dict.propertyFeatures?.balconyDescription ?? "Private balcony or terrace",
    parking: dict.propertyFeatures?.parkingDescription ?? "Covered or open parking space",
    elevator: dict.propertyFeatures?.elevatorDescription ?? "Passenger elevator in building",
  };

  // Feature label mapping
  const featureLabels: Record<keyof typeof formData, string> = {
    balcony: dict.property.hasBalcony,
    parking: dict.property.hasParking,
    elevator: dict.property.hasElevator,
  };

  // Feature aria-labels
  const featureAriaLabels: Record<keyof typeof formData, string> = {
    balcony: dict.propertyFeatures?.feature?.balcony ?? dict.property.hasBalcony,
    parking: dict.propertyFeatures?.feature?.parking ?? dict.property.hasParking,
    elevator: dict.propertyFeatures?.feature?.elevator ?? dict.property.hasElevator,
  };

  return (
    <div className="space-y-4">
      {Object.entries(formData).map(([key, value]) => {
        const feature = key as keyof typeof formData;
        const isChecked = value;
        
        // Get tooltip for accessibility
        const description = featureDescriptions[feature] ?? "";
        const describedBy = description ? `${feature}-description` : undefined;
        
        return (
          <div
            key={feature}
            className="rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition"
          >
            <label
              className="flex items-center gap-3 cursor-pointer"
              aria-describedby={describedBy}
            >
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 shadow-sm"
                checked={isChecked}
                onChange={(e) => onChange(feature, e.target.checked)}
                aria-label={featureAriaLabels[feature]}
              />
              <span className="text-sm font-medium text-gray-700">
                {featureLabels[feature]}
                
                {description && (
                  <span className="ms-2 text-xs text-gray-500" 
                        id={`${feature}-description`}>
                    {description}
                  </span>
                )}
              </span>
              
              {/* Visual indicator for selected state */}
              <span className="ms-2 px-2 py-1 rounded-full text-xs font-medium">
                {isChecked ? (dict.propertyFeatures?.featureEnabled ?? "Enabled") : (dict.propertyFeatures?.featureDisabled ?? "Disabled")}
              </span>
            </label>
          </div>
        );
      })}
    </div>
  );
}
