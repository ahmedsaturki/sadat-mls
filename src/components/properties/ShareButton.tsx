"use client";

import { memo, useState } from "react";
import { Share2, Link as LinkIcon, MessageCircle, Check } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { logger } from "@/lib/logger";

import type { Messages } from "@/i18n/getMessages";

interface ShareButtonProps {
  title: string;
  dict?: Messages;
}

const ShareButton = memo(function ShareButton({ title, dict }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const explore = dict?.explore as Record<string, string> | undefined;

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${window.location.pathname}`
      : "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      logger.error("Failed to copy share URL to clipboard", { error: err instanceof Error ? err.message : String(err) });
      setCopied(false);
    }
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`${title}\n${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
        aria-label={explore?.share || "Share"}
      >
        <Share2 className="w-4 h-4" />
      </button>

      <Modal isOpen={open} onClose={() => setOpen(false)} title={explore?.share || "Share"}>
        <div className="space-y-3">
          <p className="text-sm text-gray-600 mb-4">{explore?.shareProperty || "Share this property"}</p>

          <button
            onClick={handleCopy}
            className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-left"
            aria-label={copied ? (explore?.copied || "Copied!") : (explore?.copyLink || "Copy link")}
          >
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              {copied ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <LinkIcon className="w-5 h-5 text-gray-600" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {copied
                  ? explore?.copied || "Copied!"
                  : explore?.copyLink || "Copy link"}
              </p>
              <p className="text-xs text-gray-500 truncate max-w-[250px]">{shareUrl}</p>
            </div>
          </button>

          <button
            onClick={handleWhatsApp}
            className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-left"
            aria-label={explore?.shareVia || "Share via WhatsApp"}
          >
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">WhatsApp</p>
              <p className="text-xs text-gray-500">{explore?.shareVia || "Share via WhatsApp"}</p>
            </div>
          </button>
        </div>
      </Modal>
    </>
  );
});

export default ShareButton;
