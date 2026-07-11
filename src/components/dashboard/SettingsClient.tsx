"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { getMessages } from "@/i18n/getMessages";
import { useToast } from "@/components/ui/Toast";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card, { CardTitle } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import PageHeader from "@/components/ui/PageHeader";
import { ROLES, type UserRole } from "@/lib/utils/constants";
import { SkeletonDashboard } from "@/components/ui/Skeleton";
import { User, Building2, Camera, Lock, Bell, Smartphone } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { logger } from "@/lib/logger";
import { useAuthUser } from "@/hooks/useAuthUser";
import { type Locale } from "@/i18n/config";

export default function SettingsClient({
  params,
}: {
  params: { locale: string };
}) {
  const locale = params.locale as Locale;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState("");
  const [officeId, setOfficeId] = useState("");
  const [logoUrls, setLogoUrls] = useState<{ preview?: string }>({});
  const logoInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

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
    description: "",
    logo_url: "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Password change state
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<{ [key: string]: string }>({});

  // Notification preferences state
  const [notifPrefs, setNotifPrefs] = useState({
    contact_request: true,
    agent_joined: true,
    contact_request_email: true,
    agent_joined_email: true,
    saved_search_email: true,
    property_status_email: true,
  });
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Push notifications
  const { isSupported: pushSupported, isSubscribed: pushSubscribed, subscribe, unsubscribe } = usePushNotifications();

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
          full_name: profile.fullName || "",
          email: profile.email || "",
          phone: profile.phone || "",
        });

        // Fetch avatar_url from full profile
        const { data: fullProfile } = await supabase
          .from("users")
          .select("avatar_url")
          .eq("id", user.id)
          .maybeSingle();

        if (fullProfile?.avatar_url) {
          setAvatarUrl(fullProfile.avatar_url);
        }

        // Load notification preferences
        if (fullProfile?.notification_preferences && typeof fullProfile.notification_preferences === "object") {
          const prefs = fullProfile.notification_preferences as Record<string, boolean>;
          setNotifPrefs({
            contact_request: prefs.contact_request !== false,
            agent_joined: prefs.agent_joined !== false,
            contact_request_email: prefs.contact_request_email !== false,
            agent_joined_email: prefs.agent_joined_email !== false,
            saved_search_email: prefs.saved_search_email !== false,
            property_status_email: prefs.property_status_email !== false,
          });
        }

        if (profile.officeId) {
          setOfficeId(profile.officeId);

          const { data: office, error: officeError } = await supabase
            .from("offices")
            .select("id, name, email, phone, address, description, logo_url")
            .eq("id", profile.officeId)
            .maybeSingle();

          if (officeError) {
            showToast(dict.common.unexpectedError, "error");
          } else if (office) {
            setOfficeData({
              name: office.name || "",
              email: office.email || "",
              phone: office.phone || "",
              address: office.address || "",
              description: office.description || "",
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
      if (avatarPreview && avatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [logoUrls.preview, avatarPreview]);

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
        showToast(dict.common.unexpectedError, "error");
      } else {
        setIsDirty(false);
        showToast(dict.office.profileUpdated || dict.common.save, "success");
      }
    } catch (err) {
      logger.error("Failed to save profile", { error: err instanceof Error ? err.message : String(err) });
      showToast(dict.common.unexpectedError, "error");
    } finally {
      setSaving(false);
    }
  };

  // Avatar upload
  const handleAvatarChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast(dict.office.imageTooLarge || dict.contact.imageSizeError, "error");
      return;
    }
    if (!file.type.startsWith("image/")) {
      showToast(dict.office.notAnImage || dict.contact.notImage, "error");
      return;
    }

    setAvatarFile(file);
    const url = URL.createObjectURL(file);
    if (avatarPreview && avatarPreview.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(url);
    setIsDirty(true);
  }, [avatarPreview, showToast, dict]);

  const handleUploadAvatar = async () => {
    if (!avatarFile || !userId) return;
    setUploadingAvatar(true);

    try {
      const ext = avatarFile.name.split(".").pop();
      const filePath = `avatars/${userId}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, avatarFile, { upsert: true });

      if (uploadError) {
        showToast(dict.office.avatarError || dict.common.unexpectedError, "error");
        return;
      }

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const newAvatarUrl = urlData.publicUrl;

      const { error: updateError } = await supabase
        .from("users")
        .update({ avatar_url: newAvatarUrl })
        .eq("id", userId);

      if (updateError) {
        showToast(dict.common.unexpectedError, "error");
        return;
      }

      setAvatarUrl(newAvatarUrl);
      setAvatarFile(null);
      setAvatarPreview(null);
      setIsDirty(false);
      showToast(dict.office.avatarUploaded || dict.common.success, "success");
    } catch (err) {
      logger.error("Failed to upload avatar", { error: err instanceof Error ? err.message : String(err) });
      showToast(dict.common.unexpectedError, "error");
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangingPassword(true);
    setPasswordErrors({});

    const errors: { [key: string]: string } = {};
    if (!passwordData.current_password) {
      errors.current_password = dict.office.required || dict.common.error;
    }
    if (passwordData.new_password.length < 8) {
      errors.new_password = dict.office.passwordMinLength;
    }
    if (passwordData.new_password !== passwordData.confirm_password) {
      errors.confirm_password = dict.auth.passwordMismatch;
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      setChangingPassword(false);
      return;
    }

    try {
      // Verify current password by attempting to sign in
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: profileData.email,
        password: passwordData.current_password,
      });

      if (verifyError) {
        setPasswordErrors({ current_password: dict.office.wrongPassword || dict.common.error });
        setChangingPassword(false);
        return;
      }

      // Current password verified, now update to new password
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new_password,
      });

      if (error) {
        if (error.message.includes("password")) {
          setPasswordErrors({ new_password: error.message });
        } else {
          showToast(dict.office.passwordError || dict.common.unexpectedError, "error");
        }
        return;
      }

      setPasswordData({ current_password: "", new_password: "", confirm_password: "" });
      showToast(dict.office.passwordUpdated || dict.common.success, "success");
    } catch (err) {
      logger.error("Failed to change password", { error: err instanceof Error ? err.message : String(err) });
      showToast(dict.common.unexpectedError, "error");
    } finally {
      setChangingPassword(false);
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
          description: officeData.description || null,
          logo_url: logoUrl || null,
        })
        .eq("id", officeId);

      if (error) {
        showToast(dict.common.unexpectedError, "error");
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

  const displayAvatar = avatarPreview || avatarUrl;

  const handleNotifPrefToggle = async (key: keyof typeof notifPrefs) => {
    const newPrefs = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(newPrefs);
    setSavingPrefs(true);

    try {
      const { error } = await supabase
        .from("users")
        .update({ notification_preferences: newPrefs })
        .eq("id", userId);

      if (error) {
        showToast(dict.common.unexpectedError, "error");
        setNotifPrefs(notifPrefs); // Revert
      }
    } catch (err) {
      logger.error("Failed to save notification preferences", { error: err instanceof Error ? err.message : String(err) });
      showToast(dict.common.unexpectedError, "error");
      setNotifPrefs(notifPrefs); // Revert
    } finally {
      setSavingPrefs(false);
    }
  };

  return (
    <DashboardLayout locale={locale} dict={dict} role={userRole}>
      <ErrorBoundary>
        <div className="max-w-3xl mx-auto space-y-6">
          <PageHeader title={dict.common.settings} />

          {loading ? (
            <SkeletonDashboard />
          ) : (
            <>
              {/* Avatar & Profile Settings */}
              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 bg-navy-100 rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5 text-navy-600" />
                  </div>
                  <CardTitle>{dict.office.profileSettings}</CardTitle>
                </div>

                {/* Avatar Section */}
                <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                  <div className="relative group">
                    {displayAvatar ? (
                      <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow-sm">
                        <Image src={displayAvatar} alt={dict.office.avatar || ""} fill className="object-cover" sizes="80px" unoptimized />
                      </div>
                    ) : (
                      <div className="w-20 h-20 bg-navy-100 rounded-full flex items-center justify-center text-2xl font-bold text-navy-600">
                        {(profileData.full_name || profileData.email).charAt(0).toUpperCase()}
                      </div>
                    )}
                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera className="w-5 h-5 text-white" />
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">{dict.office.avatar || dict.office.logo}</p>
                    <p className="text-xs text-gray-500 mb-2">{dict.office.imageFormat}</p>
                    {avatarFile && (
                      <Button
                        size="sm"
                        onClick={handleUploadAvatar}
                        isLoading={uploadingAvatar}
                      >
                        {dict.office.uploadAvatar || dict.common.save}
                      </Button>
                    )}
                  </div>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4">
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

              {/* Password Change */}
              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Lock className="w-5 h-5 text-orange-600" />
                  </div>
                  <CardTitle>{dict.office.changePassword}</CardTitle>
                </div>
                <form onSubmit={handlePasswordChange} className="space-y-4 mt-4">
                  <Input
                    label={dict.office.currentPassword}
                    type="password"
                    value={passwordData.current_password}
                    onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                    error={passwordErrors.current_password}
                    autoComplete="current-password"
                  />
                  <Input
                    label={dict.office.newPassword}
                    type="password"
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                    error={passwordErrors.new_password}
                    autoComplete="new-password"
                  />
                  <Input
                    label={dict.office.confirmNewPassword}
                    type="password"
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                    error={passwordErrors.confirm_password}
                    autoComplete="new-password"
                  />
                  <div className="flex justify-end">
                    <Button type="submit" isLoading={changingPassword}>
                      {dict.office.changePassword}
                    </Button>
                  </div>
                </form>
              </Card>

              {/* Notification Preferences */}
              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Bell className="w-5 h-5 text-purple-600" />
                  </div>
                  <CardTitle>{dict.office.notificationPreferences}</CardTitle>
                </div>
                <p className="text-sm text-gray-500 mb-4">{dict.office.notificationPreferencesDesc}</p>
                <div className="space-y-4">
                  {/* Contact Request Notifications */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{dict.office.contactRequestNotifications}</p>
                      <p className="text-xs text-gray-500">{dict.office.contactRequestNotificationsDesc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleNotifPrefToggle("contact_request")}
                      disabled={savingPrefs}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2 ${
                        notifPrefs.contact_request ? "bg-navy-600" : "bg-gray-300"
                      }`}
                      role="switch"
                      aria-checked={notifPrefs.contact_request}
                      aria-label={dict.office.contactRequestNotifications}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notifPrefs.contact_request ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Agent Joined Notifications */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{dict.office.agentJoinedNotifications}</p>
                      <p className="text-xs text-gray-500">{dict.office.agentJoinedNotificationsDesc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleNotifPrefToggle("agent_joined")}
                      disabled={savingPrefs}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2 ${
                        notifPrefs.agent_joined ? "bg-navy-600" : "bg-gray-300"
                      }`}
                      role="switch"
                      aria-checked={notifPrefs.agent_joined}
                      aria-label={dict.office.agentJoinedNotifications}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notifPrefs.agent_joined ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Email Notifications Section Header */}
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-sm font-semibold text-gray-900 mb-3">{dict.office.emailNotifications}</p>
                  </div>

                  {/* Contact Request Email */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{dict.office.contactRequestEmailNotifications}</p>
                      <p className="text-xs text-gray-500">{dict.office.contactRequestEmailNotificationsDesc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleNotifPrefToggle("contact_request_email")}
                      disabled={savingPrefs}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2 ${
                        notifPrefs.contact_request_email ? "bg-navy-600" : "bg-gray-300"
                      }`}
                      role="switch"
                      aria-checked={notifPrefs.contact_request_email}
                      aria-label={dict.office.contactRequestEmailNotifications}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notifPrefs.contact_request_email ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Agent Joined Email */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{dict.office.agentJoinedEmailNotifications}</p>
                      <p className="text-xs text-gray-500">{dict.office.agentJoinedEmailNotificationsDesc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleNotifPrefToggle("agent_joined_email")}
                      disabled={savingPrefs}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2 ${
                        notifPrefs.agent_joined_email ? "bg-navy-600" : "bg-gray-300"
                      }`}
                      role="switch"
                      aria-checked={notifPrefs.agent_joined_email}
                      aria-label={dict.office.agentJoinedEmailNotifications}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notifPrefs.agent_joined_email ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Saved Search Email */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{dict.office.savedSearchEmailNotifications}</p>
                      <p className="text-xs text-gray-500">{dict.office.savedSearchEmailNotificationsDesc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleNotifPrefToggle("saved_search_email")}
                      disabled={savingPrefs}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2 ${
                        notifPrefs.saved_search_email ? "bg-navy-600" : "bg-gray-300"
                      }`}
                      role="switch"
                      aria-checked={notifPrefs.saved_search_email}
                      aria-label={dict.office.savedSearchEmailNotifications}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notifPrefs.saved_search_email ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Property Status Email */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{dict.office.propertyStatusEmailNotifications}</p>
                      <p className="text-xs text-gray-500">{dict.office.propertyStatusEmailNotificationsDesc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleNotifPrefToggle("property_status_email")}
                      disabled={savingPrefs}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2 ${
                        notifPrefs.property_status_email ? "bg-navy-600" : "bg-gray-300"
                      }`}
                      role="switch"
                      aria-checked={notifPrefs.property_status_email}
                      aria-label={dict.office.propertyStatusEmailNotifications}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notifPrefs.property_status_email ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Push Notifications */}
                  {pushSupported && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Push Notifications</p>
                        <p className="text-xs text-gray-500">Receive notifications even when the app is closed</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => pushSubscribed ? unsubscribe() : subscribe()}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2 ${
                          pushSubscribed ? "bg-navy-600" : "bg-gray-300"
                        }`}
                        role="switch"
                        aria-checked={pushSubscribed}
                        aria-label="Push Notifications"
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            pushSubscribed ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  )}
                </div>
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
                          <span className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2">
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {dict.common.description || "Description"}
                      </label>
                      <textarea
                        value={officeData.description}
                        onChange={(e) => setOfficeData({ ...officeData, description: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent resize-none"
                        placeholder={dict.common.description || "Office description"}
                      />
                    </div>
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
