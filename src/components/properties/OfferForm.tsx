"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { getMessages } from "@/i18n/getMessages";
import { logger } from "@/lib/logger";
import { getCsrfHeaders } from "@/lib/security/csrf-client";
import type { Locale } from "@/i18n/config";

interface OfferFormProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  propertyTitle: string;
  locale: Locale;
}

export default function OfferForm({ isOpen, onClose, propertyId, propertyTitle, locale }: OfferFormProps) {
  const dict = getMessages(locale);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    amount: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!formData.name.trim()) {
      setError(dict.common.name);
      setLoading(false);
      return;
    }

    const amount = parseFloat(formData.amount);
    if (!amount || amount <= 0) {
      setError(dict.dashboard.offerAmount);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getCsrfHeaders() },
        body: JSON.stringify({
          property_id: propertyId,
          offerer_name: formData.name,
          offerer_email: formData.email || null,
          offerer_phone: formData.phone || null,
          offer_amount: amount,
          message: formData.message || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || dict.common.unexpectedError);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
    } catch (err) {
      logger.error("Failed to submit offer", { error: err instanceof Error ? err.message : String(err) });
      setError(dict.common.unexpectedError);
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: "", email: "", phone: "", amount: "", message: "" });
    setError("");
    setSuccess(false);
    onClose();
  };

  if (success) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title={dict.dashboard.offerSubmitted} size="sm">
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✓</span>
          </div>
          <p className="text-gray-600 mb-4">{dict.dashboard.offerSubmitted}</p>
          <Button onClick={handleClose}>{dict.common.close}</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={dict.dashboard.submitOffer} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-500">{propertyTitle}</p>

        <Input
          label={dict.common.name}
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
        <Input
          label={dict.common.email}
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        <Input
          label={dict.common.phone}
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
        <Input
          label={dict.dashboard.offerAmount}
          type="number"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          required
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{dict.dashboard.offerMessage}</label>
          <textarea
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-navy-500 focus:border-transparent"
            rows={3}
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600" role="alert">
            {error}
          </div>
        )}

        <div className="flex gap-3 justify-end pt-2">
          <Button type="button" variant="ghost" onClick={handleClose}>{dict.common.cancel}</Button>
          <Button type="submit" isLoading={loading}>{dict.dashboard.submitOffer}</Button>
        </div>
      </form>
    </Modal>
  );
}
