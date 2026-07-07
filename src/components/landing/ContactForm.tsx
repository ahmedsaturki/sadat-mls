"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { logger } from "@/lib/logger";
import { isValidEmail } from "@/lib/security/sanitize";
import {
  getContactAttempts,
  recordContactAttempt,
  clearContactAttempts,
} from "@/lib/utils/contact-rate-limit";
import type { Messages } from "@/i18n/getMessages";

interface ContactFormProps {
  dict: Messages;
}

const CONTACT_RATE_LIMIT_CONFIG = {
  storageKey: "sadat_contact_attempts",
  maxAttempts: 3,
  lockoutMs: 60 * 60 * 1000, // 1 hour
};

// Maxlength constants for security (module-level to avoid re-creation on each render)
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 255;
const MAX_PHONE_LENGTH = 50;
const MAX_MESSAGE_LENGTH = 1000;

export default function ContactForm({ dict }: ContactFormProps) {
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSent, setContactSent] = useState(false);
  const [contactError, setContactError] = useState("");
  const [contactForm, setContactForm] = useState({ name: "", email: "", phone: "", message: "" });

  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);

  const checkRateLimit = (): boolean => {
    const { count } = getContactAttempts(CONTACT_RATE_LIMIT_CONFIG);
    if (count >= CONTACT_RATE_LIMIT_CONFIG.maxAttempts) {
      const { firstAttemptAt } = getContactAttempts(CONTACT_RATE_LIMIT_CONFIG);
      const timeLeft = Math.ceil(
        (CONTACT_RATE_LIMIT_CONFIG.lockoutMs - (Date.now() - firstAttemptAt)) / 60000
      );
      setContactError(dict.common.rateLimitExceeded.replace("{{minutes}}", String(timeLeft)));
      setAttemptsRemaining(0);
      return false;
    }
    setAttemptsRemaining(CONTACT_RATE_LIMIT_CONFIG.maxAttempts - count);
    return true;
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactLoading(true);
    setContactError("");

    const validateEmail = isValidEmail(contactForm.email.trim());
    if (contactForm.email && !validateEmail) {
      setContactError(dict.landing.contactForm.emailInvalid);
      setContactLoading(false);
      return;
    }

    if (!checkRateLimit()) {
      setContactLoading(false);
      return;
    }

    try {
      // Validate trimmed values
      const trimmedName = contactForm.name.trim();
      const trimmedMessage = contactForm.message.trim();
      if (trimmedName.length === 0) {
        setContactError(dict.landing.contactForm.nameRequired);
        setContactLoading(false);
        return;
      }
      if (trimmedMessage.length === 0) {
        setContactError(dict.landing.contactForm.messageRequired);
        setContactLoading(false);
        return;
      }
      // Determine contact_type based on provided fields
      let contactType: "email" | "phone" | "whatsapp" = "email";
      if (contactForm.phone.trim()) {
        contactType = "phone";
      }

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitorName: trimmedName,
          visitorEmail: contactForm.email.trim() || null,
          visitorPhone: contactForm.phone.trim() || null,
          message: trimmedMessage,
          contactType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `CONTACT_REQUEST_FAILED_${response.status}`);
      }

      setContactSent(true);
      setContactForm({ name: "", email: "", phone: "", message: "" });
      clearContactAttempts(CONTACT_RATE_LIMIT_CONFIG);

    } catch (err) {
      logger.warn("Contact form submission failed", { error: err instanceof Error ? err.message : String(err) });
      const isServerError = err instanceof Error && (
        err.message === "No active office available" || err.message.includes("500") || err.message.includes("server")
      );
      if (!isServerError) {
        const { count, locked } = recordContactAttempt(CONTACT_RATE_LIMIT_CONFIG);
        if (locked) {
          setContactError(dict.common.rateLimitLockedHour);
          setAttemptsRemaining(0);
        } else {
          setContactError(dict.landing.contactForm.error);
          setAttemptsRemaining(CONTACT_RATE_LIMIT_CONFIG.maxAttempts - count);
        }
      } else {
        setContactError(dict.landing.contactForm.error);
      }
    } finally {
      setContactLoading(false);
    }
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-2">
            {dict.landing.contactForm.title}
          </h2>
          <p className="text-center text-gray-600 mb-10">
            {dict.landing.contactForm.subtitle}
          </p>

          {contactSent ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-green-600" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{dict.landing.contactForm.success}</h3>
              <button
                onClick={() => setContactSent(false)}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                {dict.common.close}
              </button>
            </div>
          ) : (
<form onSubmit={handleContactSubmit} className="bg-white rounded-2xl shadow-sm p-8 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700 mb-1.5">{dict.landing.contactForm.name}</label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    maxLength={MAX_NAME_LENGTH}
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value.slice(0, MAX_NAME_LENGTH) })}
                    placeholder={dict.landing.contactForm.namePlaceholder}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 mb-1.5">{dict.landing.contactForm.email}</label>
                  <input
                    id="contact-email"
                    type="email"
                    maxLength={MAX_EMAIL_LENGTH}
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value.slice(0, MAX_EMAIL_LENGTH) })}
                    placeholder={dict.landing.contactForm.emailPlaceholder}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="contact-phone" className="block text-sm font-medium text-gray-700 mb-1.5">{dict.landing.contactForm.phone}</label>
                <input
                  id="contact-phone"
                  type="tel"
                  maxLength={MAX_PHONE_LENGTH}
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value.slice(0, MAX_PHONE_LENGTH) })}
                  placeholder={dict.landing.contactForm.phonePlaceholder}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700 mb-1.5">{dict.landing.contactForm.message}</label>
                <textarea
                  id="contact-message"
                  required
                  maxLength={MAX_MESSAGE_LENGTH}
                  rows={4}
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value.slice(0, MAX_MESSAGE_LENGTH) })}
                  placeholder={dict.landing.contactForm.messagePlaceholder}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
              {contactError && (
                <p className="text-red-600 text-sm" role="alert">{contactError}</p>
              )}
              {attemptsRemaining !== null && attemptsRemaining > 0 && attemptsRemaining <= 2 && (
                <p className="text-yellow-600 text-sm bg-yellow-50 p-2 rounded-lg">
                  {dict.common.attemptsRemaining.replace("{{count}}", String(attemptsRemaining))}
                </p>
              )}
              <button
                type="submit"
                disabled={contactLoading}
                aria-busy={contactLoading}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {contactLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {dict.landing.contactForm.sending}
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" aria-hidden="true" />
                    {dict.landing.contactForm.send}
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
