"use client";

import { memo, useState, useEffect, useRef } from "react";
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
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }, []);

    const explore = dict?.explore as Record<string, string> | undefined;

    const shareUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}${window.location.pathname}`
        : "";

const handleWebShare = async () => {
      if (navigator.share) {
        try {
          await navigator.share({
            title: title,
            text: title,
            url: shareUrl,
          });
          return true;
        } catch (err) {
          logger.info("Web Share API cancelled or failed", { error: err instanceof Error ? err.message : String(err) });
          return false;
        }
      }
      return false;
    };

    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        logger.error("Failed to copy share URL to clipboard", { error: err instanceof Error ? err.message : String(err) });
        setCopied(false);
      }
    };

    const handleWhatsApp = () => {
      const text = encodeURIComponent(`${title}\n${shareUrl}`);
      window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
    };

    const handleShare = async () => {
      const shared = await handleWebShare();
      if (!shared) {
        // Fallback to modal if Web Share API is not available or failed
        setOpen(true);
      }
    };

    return (
      <>
        <button
          onClick={handleShare}
          className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          aria-label={explore?.share}
        >
          <Share2 className="w-4 h-4" aria-hidden="true" />
        </button>

        <Modal isOpen={open} onClose={() => setOpen(false)} title={explore?.share ?? ""}>
          <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-4">{explore?.shareProperty ?? ""}</p>

            <button
              onClick={handleCopy}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-start"
              aria-label={copied ? explore?.copied : explore?.copyLink}
            >
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                {copied ? (
                   <Check className="w-5 h-5 text-green-600" aria-hidden="true" />
                ) : (
                   <LinkIcon className="w-5 h-5 text-gray-600" aria-hidden="true" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {copied
                    ? explore?.copied ?? ""
                    : explore?.copyLink ?? ""}
                </p>
                <p className="text-xs text-gray-500 truncate max-w-[250px]">{shareUrl}</p>
              </div>
            </button>

            <button
              onClick={handleWhatsApp}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-start"
              aria-label={explore?.shareVia}
            >
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-green-600" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">WhatsApp</p>
                <p className="text-xs text-gray-500">{explore?.shareVia ?? ""}</p>
              </div>
            </button>
          </div>
        </Modal>
      </>
    );
  });

export default ShareButton;
