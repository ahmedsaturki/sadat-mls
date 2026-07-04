"use client";

import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import type { Messages } from "@/i18n/getMessages";
import { useToast } from "@/components/ui/Toast";
import { useState, useEffect, useCallback } from "react";

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
  statusOptions?: Array<{ value: string; label: string }>;
  onChange: (field: string, value: string) => void;
}

export default function PropertyDetails({
  dict,
  formData,
  errors,
  statusOptions,
  onChange,
}: PropertyDetailsProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const toast = useToast();

  // Simulate validation with loading states
  const validateField = useCallback(async (field: string) => {
    if (field === "price") {
      // Simple validation for price
      if (formData[field] && Number(formData[field]) < 0) {
        setIsGenerating(true);
        await new Promise(resolve => setTimeout(resolve, 500));
        setIsGenerating(false);
      }
    } else {
      // Small delay for other fields to simulate validation
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }, [formData]);

  // Initialize loading states for all fields
  const initializeLoadingStates = useCallback(() => {
    const newLoadingStates: Record<string, boolean> = {};
    Object.keys(formData).forEach(field => {
      newLoadingStates[field] = false;
    });
    return newLoadingStates;
  }, [formData]);

  const [loadingStates, setLoadingStates] = useState(initializeLoadingStates());

  useEffect(() => {
    const handleFieldChange = async (field: string) => {
      setLoadingStates(prev => ({ ...prev, [field]: true }));
      await validateField(field);
      setLoadingStates(prev => ({ ...prev, [field]: false }));
    };
    
    // Monitor formData changes to trigger validation
    // In real implementation, this would be triggered by actual input events
  }, [formData, loadingStates, validateField]);

  // Initialize loading states when formData changes
  useEffect(() => {
    setLoadingStates(initializeLoadingStates());
  }, [formData, initializeLoadingStates]);

  // Format number fields appropriately
  const formatNumber = (value: string, min?: number) => {
    if (!value) return "";
    const num = Number(value);
    return min !== undefined && num < min ? min.toString() : value;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 space-y-4">
      {Object.entries(formData).map(([field, value]) => {
        const fieldError = errors[field];
        const isLoading = loadingStates?.[field] || false;
        const isNumeric = ["price", "area", "bedrooms", "bathrooms", "floors"].includes(field);
        const inputType = isNumeric ? "number" : "text";
        const isNumericField = isNumeric;
        
        // Add descriptive labels for numeric fields
        let fieldLabel = dict.property?.[field] || field;
        if (field === "price") fieldLabel = dict.property.price;
        if (field === "area") fieldLabel = dict.property.area;
        if (field === "bedrooms") fieldLabel = dict.property.bedrooms;
        if (field === "bathrooms") fieldLabel = dict.property.bathrooms;
        if (field === "floors") fieldLabel = dict.property.floors;
        if (field === "status") fieldLabel = dict.property.statusLabel;
        
        // Special handling for checkbox-like fields
        const isBooleanField = field === "has_balcony" || field === "has_parking" || field === "has_elevator";
        
        // Numerical validation styling
        const inputClassNames = [
          "w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
          isLoading ? "opacity-70 cursor-wait" : "",
          fieldError ? "border-red-500" : "border-gray-300",
        ].join(" ");

        return (
          <div key={field} className="space-y-1">
            {field === "has_balcony" || field === "has_parking" || field === "has_elevator" ? (
              <>
                <Input
                  type="checkbox"
                  label={fieldLabel}
                  value={value === "true" ? "true" : "false"}
                  onChange={(e) => onChange(field, e.target.checked ? "true" : "false")}
                  className="w-4 h-4 rounded focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-sm text-gray-600">{fieldError ? ` ${fieldError}` : ''}</p>
              </>
            ) : (
              <Input
                label={fieldLabel}
                type={inputType}
                value={value}
                onChange={(e) => {
                  const newValue = isNumericField ? e.target.value : value.replace(/[^0-9]/g, '');
                  onChange(field, newValue);
                }}
                disabled={isLoading}
                className={inputClassNames}
                aria-invalid={!!fieldError}
                aria-describedby={fieldError ? `${field}-error` : undefined}
              />
            )}
            
            {fieldError && (
              <p 
                id={`${field}-error`} 
                className="text-red-500 text-xs mt-1"
                role="alert"
              >
                {fieldError}
              </p>
            )}
          </div>
        );
      })}
      
      {/* Status selection with enhanced styling */}
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
          {dict.property.statusLabel}
        </label>
        <Select
          id="status"
          label={dict.property.statusLabel}
          value={formData.status}
          onChange={(e) => onChange("status", e.target.value)}
          options={statusOptions}
          className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {errors.status && (
          <p className="text-red-500 text-xs mt-1" id={`status-error-${errors.status}`}>
            {errors.status}
          </p>
        )}
      </div>
    </div>
  );
}
