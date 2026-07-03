"use client";

import { useState, useCallback } from "react";
import { MessageCircle, Phone, Mail } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId?: string;
  officeId?: string;
  officeName: string;
  officePhone?: string;
  officeEmail?: string;
  dict: {
    contact: Record<string, string>;
    common: Record<string, string>;
  };
}

const CONTACT_RATE_LIMIT_KEY = "sadat_contact_modal_attempts";
const MAX_CONTACT_ATTEMPTS = 5;
const CONTACT_LOCKOUT_MS = 60 * 60 * 1000;
const MAX_NAME_LENGTH = 100;
const MAX_PHONE_LENGTH = 50;
const MAX_MESSAGE_LENGTH = 1000;

function getContactAttempts(): { count: number; firstAttemptAt: number } {
  if (typeof window === "undefined") return { count: 0, firstAttemptAt: 0 };
  try {
    const data = localStorage.getItem(CONTACT_RATE_LIMIT_KEY);
    if (!data) return { count: 0, firstAttemptAt: 0 };
    const parsed = JSON.parse(data);
    if (Date.now() - parsed.firstAttemptAt > CONTACT_LOCKOUT_MS) {
      localStorage.removeItem(CONTACT_RATE_LIMIT_KEY);
      return { count: 0, firstAttemptAt: 0 };
    }
    return parsed;
  } catch {
    return { count: 0, firstAttemptAt: 0 };
  }
}

function recordContactAttempt(): { count: number; locked: boolean } {
  const current = getContactAttempts();
  const newCount = current.count + 1;
  const firstAttemptAt = current.count === 0 ? Date.now() : current.firstAttemptAt;
  localStorage.setItem(CONTACT_RATE_LIMIT_KEY, JSON.stringify({ count: newCount, firstAttemptAt }));
  return { count: newCount, locked: newCount >= MAX_CONTACT_ATTEMPTS };
}

function clearContactAttempts() {
  localStorage.removeItem(CONTACT_RATE_LIMIT_KEY);
}

export default function ContactModal({
  isOpen,
  onClose,
  propertyId,
  officeId,
  officeName,
  officePhone,
  officeEmail,
  dict,
}: ContactModalProps) {
  const [contactType, setContactType] = useState<"whatsapp" | "phone" | "email">("whatsapp");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    visitor_name: "",
    visitor_phone: "",
    visitor_email: "",
    message: "",
  });

  const [error, setError] = useState<string | null>(null);

  const whatsappUrl = officePhone
    ? `https://wa.me/${officePhone.replace(/[^0-9]/g, "")}`
    : null;

  const handleSelectType = useCallback((type: "whatsapp" | "phone" | "email") => {
    setContactType(type);
    setShowForm(true);
    setSuccess(false);
    setError(null);
  }, []);

  const handleSend = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId || !officeId) return;

    const trimmedName = formData.visitor_name.trim();
    const trimmedMessage = formData.message.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setError(dict.contact.nameRequired);
      return;
    }

    if (!trimmedMessage || trimmedMessage.length < 2) {
      setError(dict.contact.messageRequired);
      return;
    }

    const { locked } = recordContactAttempt();
    if (locked) {
      setError(dict.contact.error);
      return;
    }

    setSaving(true);
    setError(null);
    const supabase = createClient();

    const insertData = {
      property_id: propertyId,
      office_id: officeId,
      contact_type: contactType,
      visitor_name: trimmedName,
      visitor_phone: formData.visitor_phone.trim() || null,
      visitor_email: formData.visitor_email.trim() || null,
      message: trimmedMessage,
    };

    try {
      const { error: insertError } = await supabase.from("contact_requests").insert(insertData);

      if (insertError) {
        logger.error("Contact form submission failed", { error: insertError.message });
        setSaving(false);
        setError(dict.contact.error);
        return;
      }

      setSaving(false);
      setSuccess(true);
      setFormData({ visitor_name: "", visitor_phone: "", visitor_email: "", message: "" });
      clearContactAttempts();

      // Create notification for office members (fire-and-forget)
      if (officeId) {
        fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            office_id: officeId,
            type: "contact_request",
            title: `New inquiry from ${trimmedName}`,
            message: trimmedMessage.substring(0, 200),
            entity_type: "contact_request",
          }),
        }).catch(() => {});
      }

      if (contactType === "whatsapp" && whatsappUrl) {
        window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      } else if (contactType === "phone" && officePhone) {
        window.open(`tel:${officePhone}`, "_self");
      } else if (contactType === "email" && officeEmail) {
        const subject = encodeURIComponent(dict.contact.propertyInquiry);
        const body = encodeURIComponent(trimmedMessage);
        window.open(`mailto:${officeEmail}?subject=${subject}&body=${body}`, "_self");
      }
    } catch (err) {
      logger.error("Contact form error", { error: err instanceof Error ? err.message : String(err) });
      setSaving(false);
      setError(dict.contact.error);
    }
  }, [propertyId, officeId, contactType, formData, whatsappUrl, officePhone, officeEmail, dict]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={dict.contact.title} size="sm">
      <div className="space-y-4">
        {!showForm ? (
          <>
            <p className="text-center text-gray-600">
              {dict.contact.contactWith.replace("{{name}}", officeName)}
            </p>

            <div className="space-y-3">
              {whatsappUrl && (
                <button
                  onClick={() => handleSelectType("whatsapp")}
                  className="w-full flex items-center gap-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left"
                  aria-label={dict.contact.whatsapp}
                >
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{dict.contact.whatsapp}</p>
                    <p className="text-sm text-gray-500">{officePhone}</p>
                  </div>
                </button>
              )}

              {officePhone && (
                <button
                  onClick={() => handleSelectType("phone")}
                  className="w-full flex items-center gap-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left"
                  aria-label={dict.contact.call}
                >
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <Phone className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{dict.contact.call}</p>
                    <p className="text-sm text-gray-500">{officePhone}</p>
                  </div>
                </button>
              )}

              {officeEmail && (
                <button
                  onClick={() => handleSelectType("email")}
                  className="w-full flex items-center gap-3 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-left"
                  aria-label={dict.contact.emailSend}
                >
                  <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{dict.contact.emailSend}</p>
                    <p className="text-sm text-gray-500">{officeEmail}</p>
                  </div>
                </button>
              )}
            </div>

            {!officePhone && !officeEmail && (
              <p className="text-center text-gray-500 py-4">
                {dict.contact.noContactInfo}
              </p>
            )}
          </>
        ) : success ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-green-600 font-medium">{dict.contact.success}</p>
            <button
              onClick={() => { setShowForm(false); setSuccess(false); onClose(); }}
              className="mt-4 text-sm text-gray-500 hover:text-gray-700"
              aria-label={dict.common.close}
            >
              {dict.common.close}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {contactType === "whatsapp" ? dict.contact.whatsapp :
                 contactType === "phone" ? dict.contact.call : dict.contact.emailSend}
              </p>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
                aria-label={dict.common.back}
              >
                {dict.common.back}
              </button>
            </div>
            {error && (
              <p className="text-red-600 text-sm bg-red-50 p-2 rounded-lg" role="alert">{error}</p>
            )}
            <Input
              label={dict.contact.name}
              value={formData.visitor_name}
              onChange={(e) => setFormData({ ...formData, visitor_name: e.target.value.slice(0, MAX_NAME_LENGTH) })}
              placeholder={dict.contact.yourName}
              required
              maxLength={MAX_NAME_LENGTH}
            />
            <Input
              label={dict.contact.phone}
              type="tel"
              value={formData.visitor_phone}
              onChange={(e) => setFormData({ ...formData, visitor_phone: e.target.value.slice(0, MAX_PHONE_LENGTH) })}
              placeholder={dict.contact.yourPhone}
              maxLength={MAX_PHONE_LENGTH}
            />
            <Input
              label={dict.contact.message}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value.slice(0, MAX_MESSAGE_LENGTH) })}
              placeholder={dict.contact.yourMessage}
              required
              maxLength={MAX_MESSAGE_LENGTH}
            />
            <Button type="submit" className="w-full" isLoading={saving}>
              {dict.contact.send}
            </Button>
          </form>
        )}
      </div>
    </Modal>
  );
}
