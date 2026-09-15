"use client";

import { useState, useCallback } from "react";
import { MessageCircle, Phone, Mail } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { logger } from "@/lib/logger";
import { getContactAttempts, recordContactAttempt, clearContactAttempts } from "@/lib/utils/contact-rate-limit";

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

const CONTACT_RATE_LIMIT_CONFIG = {
  storageKey: "sadat_contact_modal_attempts",
  maxAttempts: 5,
  lockoutMs: 60 * 60 * 1000,
};
const MAX_NAME_LENGTH = 100;
const MAX_PHONE_LENGTH = 50;
const MAX_MESSAGE_LENGTH = 1000;

export default function ContactModal({
  isOpen,
  onClose,
  propertyId,
  officeName,
  officePhone,
  officeEmail,
  dict,
}: ContactModalProps) {
  const [contactType, setContactType] = useState<"whatsapp" | "phone" | "email">("whatsapp");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ visitor_name: "", visitor_phone: "", visitor_email: "", message: "" });

  const whatsappUrl = officePhone ? `https://wa.me/${officePhone.replace(/[^0-9]/g, "")}` : null;

  const handleSelectType = useCallback((type: "whatsapp" | "phone" | "email") => {
    setContactType(type);
    setShowForm(true);
    setSuccess(false);
    setError(null);
  }, []);

  const handleSend = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId) return;

    const trimmedName = formData.visitor_name.trim();
    const trimmedMessage = formData.message.trim();
    const visitorPhone = formData.visitor_phone.trim();
    const visitorEmail = formData.visitor_email.trim();

    if (trimmedName.length < 2) {
      setError(dict.contact.nameRequired);
      return;
    }
    if (trimmedMessage.length < 2) {
      setError(dict.contact.messageRequired);
      return;
    }

    const attempts = getContactAttempts(CONTACT_RATE_LIMIT_CONFIG);
    if (attempts.count >= CONTACT_RATE_LIMIT_CONFIG.maxAttempts) {
      setError(dict.contact.error);
      return;
    }
    recordContactAttempt(CONTACT_RATE_LIMIT_CONFIG);

    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          propertyId,
          contactType,
          visitorName: trimmedName,
          visitorPhone: visitorPhone || null,
          visitorEmail: visitorEmail || null,
          message: trimmedMessage,
        }),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(typeof result?.error === "string" ? result.error : "Contact request failed");
      }

      setSuccess(true);
      setFormData({ visitor_name: "", visitor_phone: "", visitor_email: "", message: "" });
      clearContactAttempts(CONTACT_RATE_LIMIT_CONFIG);

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
      logger.error("Contact form submission failed", { error: err instanceof Error ? err.message : String(err) });
      setError(dict.contact.error);
    } finally {
      setSaving(false);
    }
  }, [propertyId, contactType, formData, whatsappUrl, officePhone, officeEmail, dict]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={dict.contact.title} size="sm">
      <div className="space-y-4">
        {!showForm ? (
          <>
            <p className="text-center text-gray-600">{dict.contact.contactWith.replace("{{name}}", officeName)}</p>
            <div className="space-y-3">
              {whatsappUrl && (
                <button onClick={() => handleSelectType("whatsapp")} className="w-full flex items-center gap-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-start">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                  <span>{dict.contact.whatsapp}</span>
                </button>
              )}
              {officePhone && (
                <button onClick={() => handleSelectType("phone")} className="w-full flex items-center gap-3 p-3 bg-navy-50 rounded-lg hover:bg-navy-100 transition-colors text-start">
                  <Phone className="w-5 h-5 text-navy-600" />
                  <span>{dict.contact.call}</span>
                </button>
              )}
              {officeEmail && (
                <button onClick={() => handleSelectType("email")} className="w-full flex items-center gap-3 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-start">
                  <Mail className="w-5 h-5 text-purple-600" />
                  <span>{dict.contact.emailSend}</span>
                </button>
              )}
            </div>
          </>
        ) : success ? (
          <div className="text-center py-6" role="status">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-green-600">✓</span>
            </div>
            <p className="text-green-600 font-medium">{dict.contact.success}</p>
            <button onClick={() => { setShowForm(false); setSuccess(false); onClose(); }} className="mt-4 text-sm text-gray-500">{dict.common.close}</button>
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {contactType === "whatsapp" ? dict.contact.whatsapp : contactType === "phone" ? dict.contact.call : dict.contact.emailSend}
              </p>
              <button type="button" onClick={() => setShowForm(false)} className="text-sm text-gray-500">{dict.common.back}</button>
            </div>
            {error && <p className="text-red-600 text-sm bg-red-50 p-2 rounded-lg" role="alert">{error}</p>}
            <Input label={dict.contact.name} name="visitor_name" value={formData.visitor_name} onChange={(e) => setFormData({ ...formData, visitor_name: e.target.value.slice(0, MAX_NAME_LENGTH) })} placeholder={dict.contact.yourName} required maxLength={MAX_NAME_LENGTH} />
            <Input label={dict.contact.phone} name="visitor_phone" type="tel" value={formData.visitor_phone} onChange={(e) => setFormData({ ...formData, visitor_phone: e.target.value.slice(0, MAX_PHONE_LENGTH) })} placeholder={dict.contact.yourPhone} maxLength={MAX_PHONE_LENGTH} />
            <Input label={dict.contact.email} name="visitor_email" type="email" value={formData.visitor_email} onChange={(e) => setFormData({ ...formData, visitor_email: e.target.value })} placeholder={dict.contact.yourEmail || "Email"} />
            <Input label={dict.contact.message} name="message" value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value.slice(0, MAX_MESSAGE_LENGTH) })} placeholder={dict.contact.yourMessage} required maxLength={MAX_MESSAGE_LENGTH} />
            <Button type="submit" className="w-full" isLoading={saving}>{dict.contact.send}</Button>
          </form>
        )}
      </div>
    </Modal>
  );
}
