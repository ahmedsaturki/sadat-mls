"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Mail, Send, Inbox, MessageSquare, Search } from "lucide-react";
import { getMessages } from "@/i18n/getMessages";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuthUser } from "@/hooks/useAuthUser";
import { ROLES, type UserRole } from "@/lib/utils/constants";
import { logger } from "@/lib/logger";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { type Locale } from "@/i18n/config";

interface Message {
  id: string;
  contact_request_id: string | null;
  sender_id: string | null;
  sender_type: "visitor" | "agent";
  visitor_name: string | null;
  visitor_email: string | null;
  visitor_phone: string | null;
  property_id: string | null;
  subject: string | null;
  body: string;
  is_read: boolean;
  created_at: string;
}

export default function MessagesClient({
  params,
}: {
  params: { locale: string; userId: string };
}) {
  const typedLocale = params.locale as Locale;
  const dict = getMessages(typedLocale);
  const { profile } = useAuthUser();
  const userRole = (profile?.role as UserRole) || ROLES.OFFICE_AGENT;

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCompose, setShowCompose] = useState(false);
  const [composeData, setComposeData] = useState({ subject: "", body: "", visitorName: "", visitorEmail: "", visitorPhone: "" });
  const [sending, setSending] = useState(false);
  const mountedRef = useRef(true);

  const loadMessages = useCallback(async () => {
    try {
      const res = await fetch("/api/messages");
      if (res.ok) {
        const data = await res.json();
        if (mountedRef.current) setMessages(data.messages || []);
      }
    } catch (err) {
      logger.error("Failed to load messages", { error: err instanceof Error ? err.message : String(err) });
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    loadMessages();
    return () => { mountedRef.current = false; };
  }, [loadMessages]);

  const markAsRead = async (id: string) => {
    try {
      await fetch("/api/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, is_read: true } : m)));
    } catch {
      // Silent
    }
  };

  const handleSelectMessage = (msg: Message) => {
    setSelectedMessage(msg);
    if (!msg.is_read) markAsRead(msg.id);
  };

  const handleSendReply = async () => {
    if (!composeData.body.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: composeData.subject || selectedMessage?.subject || "Re",
          body: composeData.body,
          visitor_name: composeData.visitorName || selectedMessage?.visitor_name,
          visitor_email: composeData.visitorEmail || selectedMessage?.visitor_email,
          visitor_phone: composeData.visitorPhone || selectedMessage?.visitor_phone,
          property_id: selectedMessage?.property_id,
          contact_request_id: selectedMessage?.contact_request_id,
        }),
      });
      if (res.ok) {
        setShowCompose(false);
        setComposeData({ subject: "", body: "", visitorName: "", visitorEmail: "", visitorPhone: "" });
        setSelectedMessage(null);
        loadMessages();
      }
    } catch (err) {
      logger.error("Failed to send message", { error: err instanceof Error ? err.message : String(err) });
    } finally {
      setSending(false);
    }
  };

  const unreadCount = messages.filter((m) => !m.is_read).length;

  const filteredMessages = messages.filter((m) => {
    if (filter === "unread" && m.is_read) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        m.subject?.toLowerCase().includes(q) ||
        m.body.toLowerCase().includes(q) ||
        m.visitor_name?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffHr / 24);
    if (diffHr < 1) return typedLocale === "ar" ? "الآن" : "Just now";
    if (diffHr < 24) return `${diffHr}${typedLocale === "ar" ? "س" : "h"}`;
    if (diffDay < 7) return `${diffDay}${typedLocale === "ar" ? "ي" : "d"}`;
    return date.toLocaleDateString(typedLocale === "ar" ? "ar-EG" : "en-US");
  };

  return (
    <DashboardLayout locale={typedLocale} dict={dict} role={userRole}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-navy-600" />
              {dict.nav.messages}
            </h1>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-500 mt-1">{unreadCount} {typedLocale === "ar" ? "غير مقروء" : "unread"}</p>
            )}
          </div>
          <Button onClick={() => setShowCompose(true)}>
            <Send className="w-4 h-4 ms-2" />
            {typedLocale === "ar" ? "رسالة جديدة" : "New Message"}
          </Button>
        </div>

        {/* Filters + Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "all" ? "bg-navy-100 text-navy-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {dict.common.all} ({messages.length})
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "unread" ? "bg-navy-100 text-navy-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {typedLocale === "ar" ? "غير مقروء" : "Unread"} ({unreadCount})
            </button>
          </div>
          <div className="flex-1 relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={typedLocale === "ar" ? "بحث في الرسائل..." : "Search messages..."}
              className="w-full ps-10 pe-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-500 focus:border-navy-500"
              aria-label={typedLocale === "ar" ? "بحث في الرسائل" : "Search messages"}
            />
          </div>
        </div>

        {/* Message List */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : filteredMessages.length > 0 ? (
          <div className="space-y-2">
            {filteredMessages.map((msg) => (
              <button
                key={msg.id}
                onClick={() => handleSelectMessage(msg)}
                className={`w-full text-start p-4 rounded-xl transition-colors ${
                  msg.is_read ? "bg-white hover:bg-gray-50" : "bg-navy-50 hover:bg-navy-100 border border-navy-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.sender_type === "agent" ? "bg-navy-100" : "bg-green-100"
                  }`}>
                    <Mail className={`w-5 h-5 ${msg.sender_type === "agent" ? "text-navy-600" : "text-green-600"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-medium truncate ${msg.is_read ? "text-gray-700" : "text-gray-900"}`}>
                        {msg.visitor_name || msg.subject || (typedLocale === "ar" ? "رسالة" : "Message")}
                      </p>
                      {!msg.is_read && <span className="w-2 h-2 bg-navy-600 rounded-full flex-shrink-0" />}
                      <span className="text-xs text-gray-500 ms-auto flex-shrink-0">{formatDate(msg.created_at)}</span>
                    </div>
                    {msg.subject && (
                      <p className="text-sm font-medium text-gray-600 truncate">{msg.subject}</p>
                    )}
                    <p className="text-sm text-gray-500 truncate">{msg.body}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Inbox className="w-8 h-8 text-gray-500" />
            </div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              {typedLocale === "ar" ? "لا توجد رسائل" : "No messages"}
            </h2>
            <p className="text-sm text-gray-500">
              {typedLocale === "ar" ? "ستظهر الرسائل الجديدة هنا" : "New messages will appear here"}
            </p>
          </div>
        )}
      </div>

      {/* Message Detail Modal */}
      <Modal
        isOpen={!!selectedMessage}
        onClose={() => setSelectedMessage(null)}
        title={selectedMessage?.subject || (typedLocale === "ar" ? "الرسالة" : "Message")}
        size="lg"
      >
        {selectedMessage && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span>{selectedMessage.visitor_name}</span>
              {selectedMessage.visitor_email && <span>· {selectedMessage.visitor_email}</span>}
              {selectedMessage.visitor_phone && <span>· {selectedMessage.visitor_phone}</span>}
              <span className="ms-auto">{formatDate(selectedMessage.created_at)}</span>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-900 whitespace-pre-line">{selectedMessage.body}</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedMessage(null)}>
                {dict.common.cancel}
              </Button>
              <Button onClick={() => { setShowCompose(true); setComposeData({ ...composeData, subject: `Re: ${selectedMessage.subject || ""}`, visitorName: selectedMessage.visitor_name || "", visitorEmail: selectedMessage.visitor_email || "", visitorPhone: selectedMessage.visitor_phone || "" }); }}>
                <Send className="w-4 h-4 ms-2" />
                {typedLocale === "ar" ? "رد" : "Reply"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Compose Modal */}
      <Modal isOpen={showCompose} onClose={() => setShowCompose(false)} title={typedLocale === "ar" ? "رسالة جديدة" : "New Message"} size="lg">
        <div className="space-y-4">
          <Input
            label={typedLocale === "ar" ? "الاسم" : "Name"}
            value={composeData.visitorName}
            onChange={(e) => setComposeData({ ...composeData, visitorName: e.target.value })}
            placeholder={typedLocale === "ar" ? "اسم المستلم" : "Recipient name"}
          />
          <Input
            label={typedLocale === "ar" ? "البريد الإلكتروني" : "Email"}
            type="email"
            value={composeData.visitorEmail}
            onChange={(e) => setComposeData({ ...composeData, visitorEmail: e.target.value })}
            placeholder="email@example.com"
          />
          <Input
            label={typedLocale === "ar" ? "الموضوع" : "Subject"}
            value={composeData.subject}
            onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
            placeholder={typedLocale === "ar" ? "موضوع الرسالة" : "Message subject"}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{typedLocale === "ar" ? "الرسالة" : "Message"}</label>
            <textarea
              value={composeData.body}
              onChange={(e) => setComposeData({ ...composeData, body: e.target.value })}
              rows={5}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-navy-500 focus:border-navy-500"
              placeholder={typedLocale === "ar" ? "اكتب رسالتك هنا..." : "Write your message here..."}
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowCompose(false)}>{dict.common.cancel}</Button>
            <Button onClick={handleSendReply} isLoading={sending} disabled={!composeData.body.trim()}>
              <Send className="w-4 h-4 ms-2" />
              {typedLocale === "ar" ? "إرسال" : "Send"}
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
