"use client";

import { useState, useEffect, useCallback, useRef, useMemo, Suspense, lazy } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getMessages } from "@/i18n/getMessages";
import { useToast } from "@/components/ui/Toast";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import type { Locale } from "@/i18n/config";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { ArrowRight, User, Keyboard } from "lucide-react";
import { propertySchema, ownerSchema } from "@/lib/validation";
import { ROLES, PROPERTY_STATUSES, type UserRole, type PropertyStatus } from "@/lib/utils/constants";
import PropertyBasicInfo from "./PropertyBasicInfo";
const PropertyDetails = lazy(() => import("./PropertyDetails"));
import PropertyFeatures from "./PropertyFeatures";
import PropertyOwnerInfo from "./PropertyOwnerInfo";
const PropertyImageManager = lazy(() => import("./PropertyImageManager"));
import { logger } from "@/lib/logger";

interface PropertyImage {
  id: string;
  url: string;
  file_path: string;
  sort_order: number;
  is_primary: boolean;
}

interface PropertyOwner {
  id: string;
  owner_name: string;
  owner_phone: string;
  owner_email: string | null;
  notes: string | null;
}

interface PropertyFormProps {
  mode: "create" | "edit";
  locale: Locale;
  propertyId?: string;
}

export default function PropertyForm({ mode, locale, propertyId }: PropertyFormProps) {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(mode === "edit");
  const [userId, setUserId] = useState<string>("");
  const [officeId, setOfficeId] = useState<string>("");
  const [userRole, setUserRole] = useState<UserRole>(ROLES.OFFICE_AGENT);
  const [zones, setZones] = useState<{ id: string; name_ar: string; name_en: string }[]>([]);
  const [types, setTypes] = useState<{ id: string; name_ar: string; name_en: string }[]>([]);
  const [existingImages, setExistingImages] = useState<PropertyImage[]>([]);
  const [initialExistingCount, setInitialExistingCount] = useState(0);
  const [existingOwner, setExistingOwner] = useState<PropertyOwner | null>(null);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<Map<number, string>>(new Map());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();
  const dict = getMessages(locale);
  const supabase = useMemo(() => createClient(), []);
  const { showToast } = useToast();
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!initialLoading) {
      titleInputRef.current?.focus();
    }
  }, [initialLoading]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (!loading && !isSubmitting) {
          // Provide visual feedback that shortcut is working
          const submitButton = document.querySelector("button[type=\"submit\"]") as HTMLButtonElement;
          if (submitButton) {
            submitButton.classList.add("ring-2", "ring-blue-500", "ring-offset-2");
            setTimeout(() => {
              submitButton.classList.remove("ring-2", "ring-blue-500", "ring-offset-2");
            }, 200);
          }
          document.querySelector("form")?.requestSubmit();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [loading, isSubmitting]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    property_type_id: "",
    zone_id: "",
    street: "",
    price: "",
    area: "",
    bedrooms: "",
    bathrooms: "",
    floors: "",
    has_balcony: false,
    has_parking: false,
    has_elevator: false,
    status: "available",
  });

  const [validationDelay, setValidationDelay] = useState<NodeJS.Timeout | null>(null);
  const [fieldValidation, setFieldValidation] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGenerateDescription = useCallback(async (): Promise<string | null> => {
    if (!formData.title) {
      showToast(dict.office.propertyTitleMin, "error");
      return null;
    }

    try {
      const response = await fetch("/api/ai/description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          property_type: formData.property_type_id,
          zone: formData.zone_id,
          area: formData.area ? Number(formData.area) : undefined,
          bedrooms: formData.bedrooms ? Number(formData.bedrooms) : undefined,
          bathrooms: formData.bathrooms ? Number(formData.bathrooms) : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        showToast(errorData.error || dict.office.aiFailed, "error");
        return null;
      }

      const data = await response.json();
      showToast(dict.office.aiGenerated, "success");
      return data.description;
    } catch (err) {
      logger.error("AI description generation failed", { error: err instanceof Error ? err.message : "Unknown" });
      showToast(dict.office.aiFailed, "error");
      return null;
    }
  }, [formData, dict.office, showToast]);

  const [ownerData, setOwnerData] = useState({
    owner_name: "",
    owner_phone: "",
    owner_email: "",
    notes: "",
  });

  const [validationDelay, setValidationDelay] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const hasData = Boolean(formData.title || formData.description || formData.price);
    const hasNewImages = newImages.length > 0;
    const hasDeletedImages = existingImages.length !== initialExistingCount;
    setIsDirty(hasData || hasNewImages || hasDeletedImages);
  }, [formData, newImages, existingImages, initialExistingCount]);

  useUnsavedChangesWarning(isDirty && !loading && !isSubmitting, dict);

  useEffect(() => {
    return () => {
      imageUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imageUrls]);

  const createObjectUrl = useCallback((file: File): string => {
    return URL.createObjectURL(file);
  }, []);

  const loadZonesAndTypes = useCallback(async () => {
    const [zonesRes, typesRes] = await Promise.all([
      supabase.from("zones").select("id, name_ar, name_en").order("name_ar"),
      supabase.from("property_types").select("id, name_ar, name_en").order("name_ar"),
    ]);
    setZones(zonesRes.data || []);
    setTypes(typesRes.data || []);
  }, [supabase]);

  const loadProfile = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/${locale}/login`);
      return;
    }

    const { data: profile } = await supabase
      .from("users")
      .select("office_id, role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.office_id) {
      setUserId(user.id);
      setOfficeId(profile.office_id);
      setUserRole(profile.role as UserRole);
    }
  }, [supabase, locale, router]);

  const loadProperty = useCallback(async () => {
    if (!propertyId) {
      router.push(`/${locale}/dashboard/properties`);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/${locale}/login`);
      return;
    }

    const { data: profile } = await supabase
      .from("users")
      .select("office_id, role")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) {
      router.push(`/${locale}/explore`);
      return;
    }

    setUserId(user.id);
    setOfficeId(profile.office_id || "");
    setUserRole((profile.role as UserRole) || ROLES.OFFICE_AGENT);

    const [propertyResult, imagesResult, ownerResult] = await Promise.all([
      supabase
        .from("properties")
        .select("id, title, description, property_type_id, zone_id, street, price, area, bedrooms, bathrooms, floors, has_balcony, has_parking, has_elevator, status, office_id, created_by")
        .eq("id", propertyId)
        .maybeSingle(),
      supabase
        .from("property_images")
        .select("id, url, file_path, sort_order, is_primary")
        .eq("property_id", propertyId)
        .order("sort_order"),
      supabase
        .from("property_owners")
        .select("id, owner_name, owner_phone, owner_email, notes")
        .eq("property_id", propertyId)
        .maybeSingle(),
    ]);

    const { data: property } = propertyResult;

    if (!property) {
      router.push(`/${locale}/dashboard/properties`);
      return;
    }

    setFormData({
      title: property.title || "",
      description: property.description || "",
      property_type_id: property.property_type_id || "",
      zone_id: property.zone_id || "",
      street: property.street || "",
      price: property.price?.toString() || "",
      area: property.area?.toString() || "",
      bedrooms: property.bedrooms?.toString() || "",
      bathrooms: property.bathrooms?.toString() || "",
      floors: property.floors?.toString() || "",
      has_balcony: property.has_balcony || false,
      has_parking: property.has_parking || false,
      has_elevator: property.has_elevator || false,
      status: property.status || "available",
    });

    const { data: images } = imagesResult;
    setExistingImages(images || []);
    setInitialExistingCount(images?.length ?? 0);

    const { data: owner } = ownerResult;

    if (owner) {
      setExistingOwner(owner);
      setOwnerData({
        owner_name: owner.owner_name || "",
        owner_phone: owner.owner_phone || "",
        owner_email: owner.owner_email || "",
        notes: owner.notes || "",
      });
    }

    setInitialLoading(false);
  }, [supabase, locale, router, propertyId]);

  useEffect(() => {
    loadZonesAndTypes();
    loadProfile();
  }, [loadZonesAndTypes, loadProfile]);

  useEffect(() => {
    if (mode === "edit" && propertyId) {
      loadProperty();
    }
  }, [mode, propertyId, loadProperty]);

  const validateForm = (): boolean => {
    const result = propertySchema.safeParse(formData);
    const ownerResult = ownerSchema.safeParse(ownerData);
    const newErrors: Record<string, string> = {};

    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const key = issue.path.join(".");
        // Map validation errors to i18n keys
        if (issue.code === "too_small") {
          const actual = String((issue as unknown as Record<string, unknown>).input ?? "").length;
          const min = issue.minimum as number;
          if (min === 2 && actual < 2) {
            newErrors[key] = dict.office.propertyNameMin;
          } else if (min === 1 && actual < 1) {
            newErrors[key] = dict.office.propertyTitleMin;
          } else {
            newErrors[key] = issue.message;
          }
        } else if (issue.code === "too_big") {
          newErrors[key] = dict.office.propertyTitleMax;
        } else {
          newErrors[key] = issue.message;
        }
      });
    }

    if (!ownerResult.success) {
      ownerResult.error.issues.forEach((issue) => {
        const key = `owner_${issue.path.join(".")}`;
        if (issue.code === "custom") {
          if (issue.path.join(".") === "owner_phone") {
            newErrors[key] = dict.office.ownerPhoneInvalid;
          } else if (issue.path.join(".") === "owner_email") {
            newErrors[key] = dict.office.ownerEmailInvalid;
          } else {
            newErrors[key] = issue.message;
          }
        } else {
          newErrors[key] = issue.message;
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast(dict.office.formErrors, "error");
      // Focus on first error field
      const firstErrorKey = Object.keys(errors)[0];
      if (firstErrorKey) {
        const inputElement = document.querySelector(`[name="${firstErrorKey}"]`) as HTMLInputElement;
        inputElement?.focus();
      }
      return;
    }

    setIsSubmitting(true);
    setLoading(true);

    try {
      // Defensive: ensure status is a valid DB value before hitting the constraint
      if (!PROPERTY_STATUSES.includes(formData.status as PropertyStatus)) {
        showToast(dict.common.error, "error");
        setLoading(false);
        setIsSubmitting(false);
        return;
      }

      const propertyData = {
        office_id: officeId,
        created_by: userId,
        title: formData.title,
        description: formData.description,
        property_type_id: formData.property_type_id || null,
        zone_id: formData.zone_id || null,
        street: formData.street,
        price: Number(formData.price),
        area: Number(formData.area),
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
        floors: formData.floors ? Number(formData.floors) : null,
        has_balcony: formData.has_balcony,
        has_parking: formData.has_parking,
        has_elevator: formData.has_elevator,
        status: formData.status,
      };

      let resultPropertyId = propertyId;

      if (mode === "create") {
        showToast(dict.office.creatingProperty, "info");
        const { data: property, error } = await supabase
          .from("properties")
          .insert(propertyData)
          .select()
          .single();

        if (error) {
          showToast(error.message || dict.common.unexpectedError, "error");
          setLoading(false);
          setIsSubmitting(false);
          return;
        }
        resultPropertyId = property.id;
        showToast(dict.office.propertyCreated, "success");
      } else {
        showToast(dict.office.updatingProperty, "info");
        const { error } = await supabase
          .from("properties")
          .update({ ...propertyData, updated_at: new Date().toISOString() })
          .eq("id", propertyId);

        if (error) {
          showToast(error.message || dict.common.unexpectedError, "error");
          setLoading(false);
          setIsSubmitting(false);
          return;
        }
        showToast(dict.common.save, "success");
      }

      // Handle owner update
      if (ownerData.owner_name && ownerData.owner_phone) {
        if (existingOwner) {
          try {
            const { error: ownerError } = await supabase
              .from("property_owners")
              .update({
                owner_name: ownerData.owner_name,
                owner_phone: ownerData.owner_phone,
                owner_email: ownerData.owner_email || null,
                notes: ownerData.notes || null,
              })
              .eq("id", existingOwner.id);
            if (ownerError) {
              showToast(dict.office.ownerUpdateFailed, "error");
            }
          } catch {
            showToast(dict.office.ownerUpdateFailed, "error");
          }
        } else {
          try {
            const { error: ownerError } = await supabase.from("property_owners").insert({
              property_id: resultPropertyId,
              office_id: officeId,
              owner_name: ownerData.owner_name,
              owner_phone: ownerData.owner_phone,
              owner_email: ownerData.owner_email || null,
              notes: ownerData.notes || null,
            });
            if (ownerError) {
              showToast(dict.office.ownerCreateFailed, "error");
            }
          } catch {
            showToast(dict.office.ownerCreateFailed, "error");
          }
        }
      } else if (existingOwner) {
        try {
          const { error: ownerError } = await supabase.from("property_owners").delete().eq("id", existingOwner.id);
          if (ownerError) {
            showToast(dict.office.ownerDeleteFailed, "error");
          }
        } catch {
          showToast(dict.office.ownerDeleteFailed, "error");
        }
      }

      // Handle image upload with progress feedback
      if (newImages.length > 0) {
        showToast(dict.office.uploadingImages, "info");
        for (let i = 0; i < newImages.length; i++) {
          const file = newImages[i];
          const filePath = `${officeId}/${resultPropertyId}/${Date.now()}_${file.name}`;

          const { error: uploadError } = await supabase.storage
            .from("properties")
            .upload(filePath, file);

          if (!uploadError) {
            const { data: urlData } = supabase.storage.from("properties").getPublicUrl(filePath);

            await supabase.from("property_images").insert({
              property_id: resultPropertyId,
              url: urlData.publicUrl,
              file_path: filePath,
              sort_order: (existingImages.length || 0) + i,
              is_primary: existingImages.length === 0 && i === 0,
            });
          }
        }
        showToast(dict.office.imagesUploaded, "success");
      }

      setLoading(false);
      setIsSubmitting(false);
      setIsDirty(false);
      router.push(`/${locale}/dashboard/properties`);

    } catch (err) {
      logger.error("Form submission failed", { error: err instanceof Error ? err.message : "Unknown error" });
      showToast(err instanceof Error ? err.message : dict.common.unexpectedError, "error");
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const removeExistingImage = async (imageId: string, filePath: string) => {
    try {
      const { error: storageError } = await supabase.storage.from("properties").remove([filePath]);
      if (storageError) {
        logger.warn("Failed to remove image from storage", { error: storageError.message });
      }
      const { error: dbError } = await supabase.from("property_images").delete().eq("id", imageId);
      if (dbError) {
        logger.error("Failed to delete image record", { error: dbError.message });
        showToast(dict.common.unexpectedError, "error");
        return;
      }
      setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch (err) {
      logger.error("Failed to remove image", { error: err instanceof Error ? err.message : String(err) });
      showToast(dict.common.unexpectedError, "error");
    }
  };

  const removeNewImage = (index: number) => {
    const url = imageUrls.get(index);
    if (url) URL.revokeObjectURL(url);
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setImageUrls((prev) => {
      const next = new Map(prev);
      next.delete(index);
      return next;
    });
  };

  // Pre-compute preview URLs for all new images to avoid creating
  // untracked blob URLs during rendering.
  const previewUrls = useMemo(() => {
    const map = new Map<number, string>();
    newImages.forEach((file, i) => {
      const existing = imageUrls.get(i);
      if (existing) {
        map.set(i, existing);
      } else {
        map.set(i, URL.createObjectURL(file));
      }
    });
    return map;
  }, [newImages, imageUrls]);

  // Revoke any preview URLs created by the memo that aren't in the imageUrls map
  useEffect(() => {
    return () => {
      previewUrls.forEach((url, i) => {
        if (!imageUrls.has(i)) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [previewUrls, imageUrls]);

  const handleImageChange = (files: FileList) => {
    const newFiles = Array.from(files);
    const totalImages = existingImages.length + newImages.length + newFiles.length;

    if (totalImages > 10) {
      showToast(dict.office.maxImagesError, "error");
      return;
    }

    const oversized = newFiles.find((f) => f.size > 5 * 1024 * 1024);
    if (oversized) {
      showToast(dict.office.imageTooLarge, "error");
      return;
    }

    const invalidType = newFiles.find((f) => !f.type.startsWith("image/"));
    if (invalidType) {
      showToast(dict.office.notAnImage, "error");
      return;
    }

    const newUrls = new Map(imageUrls);
    newFiles.forEach((file, i) => {
      const url = createObjectUrl(file);
      newUrls.set(newImages.length + i, url);
    });
    setImageUrls(newUrls);

    setNewImages((prev) => [...prev, ...newFiles]);
  };

  const handleOwnerChange = (index: number, field: string, value: string) => {
    if (index === 0) {
      setOwnerData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleFeatureChange = (field: string, value: boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (initialLoading) {
    return (
      <DashboardLayout locale={locale} dict={dict} role={userRole}>
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  const imageProps =
    mode === "edit"
      ? {
          existingImages: existingImages.map((img) => ({
            id: img.id,
            url: img.url,
            alt_text: "",
            is_primary: img.is_primary,
          })),
          newImages: newImages.map((file, i) => ({
            file,
            preview: previewUrls.get(i) || "",
            alt_text: "",
          })),
          onUpload: handleImageChange,
          onRemoveExisting: (id: string) => {
            const img = existingImages.find((e) => e.id === id);
            if (img) removeExistingImage(img.id, img.file_path);
          },
          onRemoveNew: removeNewImage,
          onSetAltText: () => {},
          onSetPrimary: () => {},
        }
      : {
          existingImages: [],
          newImages: newImages.map((file, i) => ({
            file,
            preview: previewUrls.get(i) || "",
            alt_text: "",
          })),
          onUpload: handleImageChange,
          onRemoveExisting: () => {},
          onRemoveNew: removeNewImage,
          onSetAltText: () => {},
          onSetPrimary: () => {},
        };

  return (
    <DashboardLayout locale={locale} dict={dict} role={userRole}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} aria-label={dict.common.goBack} className="p-2 rounded-lg hover:bg-gray-100">
            <ArrowRight className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {mode === "create" ? dict.office.addProperty : dict.office.editProperty}
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="space-y-6">
<PropertyBasicInfo
               locale={locale}
               dict={dict}
               formData={formData}
               zones={zones}
               types={types}
               errors={errors}
               onChange={(field, value) => setFormData((prev) => ({ ...prev, [field]: value }))}
               titleRef={titleInputRef}
               onGenerateDescription={handleGenerateDescription}
             />

            <div className="border-t border-gray-200 pt-4">
              <Suspense fallback={<div className="space-y-4"><div className="h-8 bg-gray-100 rounded animate-pulse" /><div className="h-8 bg-gray-100 rounded animate-pulse" /></div>}>
                <PropertyDetails
                  dict={dict}
                  formData={{
                    price: formData.price,
                    area: formData.area,
                    bedrooms: formData.bedrooms,
                    bathrooms: formData.bathrooms,
                    floors: formData.floors,
                    status: formData.status as PropertyStatus,
                  }}
                  errors={errors}
                  onChange={(field, value) => setFormData((prev) => ({ ...prev, [field]: value }))}
                />
              </Suspense>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="font-medium text-gray-900 mb-3">{dict.office.features}</h3>
              <PropertyFeatures
                dict={dict}
                formData={{
                  balcony: formData.has_balcony,
                  parking: formData.has_parking,
                  elevator: formData.has_elevator,
                }}
                onChange={(field, value) =>
                  handleFeatureChange(`has_${field}`, value)
                }
              />
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                {dict.office.propertyOwner}
              </h3>
              <PropertyOwnerInfo
                dict={dict}
                locale={locale}
                owners={[ownerData]}
                onChange={handleOwnerChange}
                onAdd={() => {}}
              />
              {errors.owner_owner_name && (
                <p className="text-red-500 text-xs mt-1">{errors.owner_owner_name}</p>
              )}
              {errors.owner_owner_phone && (
                <p className="text-red-500 text-xs mt-1">{errors.owner_owner_phone}</p>
              )}
              {errors.owner_owner_email && (
                <p className="text-red-500 text-xs mt-1">{errors.owner_owner_email}</p>
              )}
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="font-medium text-gray-900 mb-3">
                {mode === "edit" ? dict.office.currentImages : dict.office.newImages}
              </h3>
              <Suspense fallback={<div className="h-40 bg-gray-100 rounded animate-pulse" />}>
                <PropertyImageManager dict={dict} {...imageProps} />
              </Suspense>
            </div>
          </Card>

          <div className="flex gap-3 justify-end mt-6">
            <span className="flex items-center gap-1 text-xs text-gray-400 mr-auto">
              <Keyboard className="w-3 h-3" />
              {dict.common.saveShortcut}
            </span>
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              {dict.common.cancel}
            </Button>
            <Button type="submit" isLoading={loading}>
              {dict.common.save}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
