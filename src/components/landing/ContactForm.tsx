"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";
import { isValidEmail } from "@/lib/security/sanitize";
import type { Messages } from "@/i18n/getMessages";

interface ContactFormProps {
  dict: Messages;
}

const CONTACT_RATE_LIMIT_KEY = "sadat_contact_attempts";
const MAX_CONTACT_ATTEMPTS = 3;
const CONTACT_LOCKOUT_MS = 60 * 60 * 1000; // 1 hour

// Maxlength constants for security (module-level to avoid re-creation on each render)
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 255;
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
  } catch (err) {
    logger.error("Failed to parse contact rate limit data", { error: err instanceof Error ? err.message : String(err) });
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

export default function ContactForm({ dict }: ContactFormProps) {
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSent, setContactSent] = useState(false);
  const [contactError, setContactError] = useState("");
  const [contactForm, setContactForm] = useState({ name: "", email: "", phone: "", message: "" });

  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);

  const checkRateLimit = (): boolean => {
    const { count } = getContactAttempts();
    if (count >= MAX_CONTACT_ATTEMPTS) {
      const { firstAttemptAt } = getContactAttempts();
      const timeLeft = Math.ceil((CONTACT_LOCKOUT_MS - (Date.now() - firstAttemptAt)) / 60000);
      setContactError(dict.common.rateLimitExceeded.replace("{{minutes}}", String(timeLeft)));
      setAttemptsRemaining(0);
      return false;
    }
    setAttemptsRemaining(MAX_CONTACT_ATTEMPTS - count);
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
      const supabase = createClient();
      const { data: officeData } = await supabase
        .from("offices")
        .select("id")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      const officeId = officeData?.id;
      if (!officeId) throw new Error("NO_ACTIVE_OFFICE");

      // Determine contact_type based on provided fields
      let contactType: "email" | "phone" | "whatsapp" = "email";
      if (contactForm.phone.trim()) {
        contactType = "phone";
      }

      const { error } = await supabase.from("contact_requests").insert({
        visitor_name: contactForm.name.trim(),
        visitor_email: contactForm.email.trim() ? contactForm.email.trim() : null,
        visitor_phone: contactForm.phone.trim() ? contactForm.phone.trim() : null,
        message: contactForm.message.trim(),
        contact_type: contactType,
        office_id: officeId,
      });

      if (error) throw error;

      setContactSent(true);
      setContactForm({ name: "", email: "", phone: "", message: "" });
      clearContactAttempts();
    } catch (err) {
      logger.warn("Contact form submission failed", { error: err instanceof Error ? err.message : String(err) });
      const { count, locked } = recordContactAttempt();
      if (locked) {
        setContactError(dict.common.rateLimitLockedHour);
        setAttemptsRemaining(0);
      } else {
        setContactError(dict.landing.contactForm.error);
        setAttemptsRemaining(MAX_CONTACT_ATTEMPTS - count);
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
                <Send className="w-8 h-8 text-green-600" />
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
                    <Send className="w-5 h-5" />
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
