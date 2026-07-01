"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { getMessages } from "@/i18n/getMessages";
import { useToast } from "@/components/ui/Toast";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import { usePageLocale } from "@/hooks/usePageLocale";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card, { CardTitle } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import PageHeader from "@/components/ui/PageHeader";
import { ROLES, type UserRole } from "@/lib/utils/constants";
import { SkeletonDashboard } from "@/components/ui/Skeleton";
import { User, Building2 } from "lucide-react";
import { logger } from "@/lib/logger";
import { useAuthUser } from "@/hooks/useAuthUser";

export default function SettingsPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = usePageLocale(params);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState("");
  const [officeId, setOfficeId] = useState("");
  const [logoUrls, setLogoUrls] = useState<{ preview?: string }>({});
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [profileData, setProfileData] = useState({
    full_name: "",
    email: "",
    phone: "",
  });

  const [officeData, setOfficeData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    logo_url: "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const { showToast } = useToast();
  const { supabase, user, profile } = useAuthUser();
  const userRole = (profile?.role as UserRole) || ROLES.OFFICE_AGENT;
  const dict = getMessages(locale);

  const [isDirty, setIsDirty] = useState(false);

  useUnsavedChangesWarning(isDirty && !saving, dict);

  const mountedRef = useRef(true);

  const loadProfile = useCallback(async () => {
    try {
      if (!user || !mountedRef.current) {
        setLoading(false);
        return;
      }

      setUserId(user.id);

      if (profile) {
        setProfileData({
          full_name: profile.full_name || "",
          email: profile.email || "",
          phone: profile.phone || "",
        });

        if (profile.office_id) {
          setOfficeId(profile.office_id);

          const { data: office, error: officeError } = await supabase
            .from("offices")
            .select("id, name, email, phone, address, logo_url")
            .eq("id", profile.office_id)
            .maybeSingle();

          if (officeError) {
            showToast(officeError.message, "error");
          } else if (office) {
            setOfficeData({
              name: office.name || "",
              email: office.email || "",
              phone: office.phone || "",
              address: office.address || "",
              logo_url: office.logo_url || "",
            });
            if (office.logo_url) setLogoUrls({ preview: office.logo_url });
          }
        }
      }
    } catch (err) {
      logger.error("Failed to load user profile", { error: err instanceof Error ? err.message : String(err) });
      showToast(dict.common.unexpectedError, "error");
    } finally {
      setLoading(false);
    }
  }, [supabase, showToast, dict.common.unexpectedError, user, profile]);

  useEffect(() => {
    mountedRef.current = true;
    if (user && profile) {
      loadProfile();
    }
    return () => { mountedRef.current = false; };
  }, [loadProfile, user, profile]);

  useEffect(() => {
    return () => {
      if (logoUrls.preview && logoUrls.preview.startsWith("blob:")) {
        URL.revokeObjectURL(logoUrls.preview);
      }
    };
  }, [logoUrls.preview]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from("users")
        .update({
          full_name: profileData.full_name,
          phone: profileData.phone,
        })
        .eq("id", userId);

      if (error) {
        showToast(error.message, "error");
      } else {
        setIsDirty(false);
        showToast(dict.common.save, "success");
      }
    } catch (err) {
      logger.error("Failed to save profile", { error: err instanceof Error ? err.message : String(err) });
      showToast(dict.common.unexpectedError, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOffice = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      let logoUrl = officeData.logo_url;

      if (logoFile) {
        const ext = logoFile.name.split(".").pop();
        const filePath = `office-logos/${officeId}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("office-logos")
          .upload(filePath, logoFile, { upsert: true });

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("office-logos")
            .getPublicUrl(filePath);
          logoUrl = urlData.publicUrl;
        } else {
          showToast(dict.office.logoError, "error");
          return;
        }
      }

      const { error } = await supabase
        .from("offices")
        .update({
          name: officeData.name,
          email: officeData.email,
          phone: officeData.phone,
          address: officeData.address,
          logo_url: logoUrl || null,
        })
        .eq("id", officeId);

      if (error) {
        showToast(error.message, "error");
      } else {
        setIsDirty(false);
        setOfficeData((prev) => ({ ...prev, logo_url: logoUrl }));
        showToast(dict.office.logoUploaded, "success");
      }
    } catch (err) {
      logger.error("Failed to save office settings", { error: err instanceof Error ? err.message : String(err) });
      showToast(dict.common.unexpectedError, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast(dict.contact.imageSizeError, "error");
        return;
      }
      if (!file.type.startsWith("image/")) {
        showToast(dict.contact.notImage, "error");
        return;
      }
      setLogoFile(file);
      const url = URL.createObjectURL(file);
      if (logoUrls.preview) URL.revokeObjectURL(logoUrls.preview);
      setLogoUrls({ preview: url });
      setIsDirty(true);
    }
  }, [logoUrls.preview, showToast, dict]);

  return (
    <DashboardLayout locale={locale} dict={dict} role={userRole}>
      <ErrorBoundary>
        <div className="max-w-3xl mx-auto space-y-6">
          <PageHeader title={dict.common.settings} />

          {loading ? (
            <SkeletonDashboard />
          ) : (
            <>
              {/* Profile Settings */}
              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <CardTitle>{dict.office.profileSettings}</CardTitle>
                </div>
                <form onSubmit={handleSaveProfile} className="space-y-4 mt-4">
                  <Input
                    label={dict.admin.adminName}
                    value={profileData.full_name}
                    onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                  />
                  <Input
                    label={dict.common.email}
                    type="email"
                    value={profileData.email}
                    disabled
                  />
                  <Input
                    label={dict.common.phone}
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  />
                  <div className="flex justify-end">
                    <Button type="submit" isLoading={saving}>
                      {dict.common.save}
                    </Button>
                  </div>
                </form>
              </Card>

              {/* Office Settings (only for office_admin) */}
              {(userRole === ROLES.OFFICE_ADMIN || userRole === ROLES.SUPER_ADMIN) && officeId && (
                <Card>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-green-600" />
                    </div>
                    <CardTitle>{dict.office.officeSettings}</CardTitle>
                  </div>
                  <form onSubmit={handleSaveOffice} className="space-y-4 mt-4">
                    {/* Logo Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {dict.office.logo}
                      </label>
                      <div className="flex items-center gap-4">
                        {logoUrls.preview && (
                          <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0">
                            <Image src={logoUrls.preview} alt={dict.common.officeLogo} fill className="object-cover" sizes="80px" unoptimized />
                          </div>
                        )}
                        <label className="cursor-pointer">
                          <span className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {dict.office.uploadLogo}
                          </span>
                          <input
                            ref={logoInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    <Input
                      label={dict.admin.officeName}
                      value={officeData.name}
                      onChange={(e) => setOfficeData({ ...officeData, name: e.target.value })}
                    />
                    <Input
                      label={dict.common.email}
                      type="email"
                      value={officeData.email}
                      onChange={(e) => setOfficeData({ ...officeData, email: e.target.value })}
                    />
                    <Input
                      label={dict.common.phone}
                      value={officeData.phone}
                      onChange={(e) => setOfficeData({ ...officeData, phone: e.target.value })}
                    />
                    <Input
                      label={dict.common.address}
                      value={officeData.address}
                      onChange={(e) => setOfficeData({ ...officeData, address: e.target.value })}
                    />
                    <div className="flex justify-end">
                      <Button type="submit" isLoading={saving}>
                        {dict.common.save}
                      </Button>
                    </div>
                  </form>
                </Card>
              )}
            </>
          )}
        </div>
      </ErrorBoundary>
    </DashboardLayout>
  );
}
