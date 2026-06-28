"use client";

import { useState } from "react";
import { MessageCircle, Phone, Mail } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

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

  const handleSelectType = (type: "whatsapp" | "phone" | "email") => {
    setContactType(type);
    setShowForm(true);
    setSuccess(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId || !officeId) return;

    setSaving(true);
    setError(null);
    const supabase = createClient();

    const insertData = {
      property_id: propertyId,
      office_id: officeId,
      contact_type: contactType,
      visitor_name: formData.visitor_name.trim() ? formData.visitor_name.trim() : null,
      visitor_phone: formData.visitor_phone.trim() ? formData.visitor_phone.trim() : null,
      visitor_email: formData.visitor_email.trim() ? formData.visitor_email.trim() : null,
      message: formData.message.trim() ? formData.message.trim() : null,
    };

    const { error: insertError } = await supabase.from("contact_requests").insert(insertData);

    if (insertError) {
      setSaving(false);
      setError(dict.contact.error);
      return;
    }

    setSaving(false);
    setSuccess(true);
    setFormData({ visitor_name: "", visitor_phone: "", visitor_email: "", message: "" });

    if (contactType === "whatsapp" && whatsappUrl) {
      window.open(whatsappUrl, "_blank");
    } else if (contactType === "phone" && officePhone) {
      window.open(`tel:${officePhone}`, "_self");
    } else if (contactType === "email" && officeEmail) {
      const subject = encodeURIComponent("Property Inquiry");
      const body = encodeURIComponent(formData.message);
      window.open(`mailto:${officeEmail}?subject=${subject}&body=${body}`, "_self");
    }
  };

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
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              <p className="text-red-600 text-sm bg-red-50 p-2 rounded-lg">{error}</p>
            )}
            <Input
              label={dict.contact.name}
              value={formData.visitor_name}
              onChange={(e) => setFormData({ ...formData, visitor_name: e.target.value })}
              placeholder={dict.contact.yourName}
            />
            <Input
              label={dict.contact.phone}
              type="tel"
              value={formData.visitor_phone}
              onChange={(e) => setFormData({ ...formData, visitor_phone: e.target.value })}
              placeholder={dict.contact.yourPhone}
            />
            <Input
              label={dict.contact.message}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder={dict.contact.yourMessage}
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
