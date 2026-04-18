"use client";

import * as React from "react";

import Link from "next/link";

import { toast } from "sonner";

import {
  CircleDotIcon,
  EllipsisVerticalIcon,
  LockIcon,
  MailIcon,
  MailOpenIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n, useT } from "@/components/i18n-provider";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: number;
  telegramId: string;
  sender: "user" | "admin";
  text: string;
  isRead: boolean;
  editedAt?: string | null;
  deletedAt?: string | null;
  hiddenForMe?: boolean;
  createdAt: string;
};

type SupportStatus = "none" | "pending" | "active" | "closed";

type ChatStatus = "UNREAD" | "READ" | "IN_PROGRESS" | "CLOSED";

type WsMessageCreatedEvent = {
  type: "message.created";
  message: ChatMessage;
};

const isWsMessageCreatedEvent = (
  value: unknown,
): value is WsMessageCreatedEvent => {
  if (!value || typeof value !== "object") return false;
  const v = value as { type?: unknown; message?: unknown };
  if (v.type !== "message.created") return false;
  const m = v.message;
  if (!m || typeof m !== "object") return false;

  const msg = m as {
    id?: unknown;
    telegramId?: unknown;
    text?: unknown;
    sender?: unknown;
    isRead?: unknown;
    createdAt?: unknown;
  };

  return (
    typeof msg.id === "number" &&
    typeof msg.telegramId === "string" &&
    typeof msg.text === "string" &&
    (msg.sender === "user" || msg.sender === "admin") &&
    (msg.isRead === undefined || typeof msg.isRead === "boolean") &&
    (msg.createdAt === undefined || typeof msg.createdAt === "string")
  );
};

const toBackendWsUrl = (backendUrl: string, token: string | null) => {
  try {
    if (!token || token.trim().length === 0) return null;
    const url = new URL(backendUrl);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.pathname = "/ws";
    url.search = "";
    url.hash = "";
    url.searchParams.set("token", token.trim());
    return url.toString();
  } catch {
    return null;
  }
};

export function ChatWindow({
  telegramId,
  title,
  backendUrl,
  wsToken,
  userId,
  supportStatus,
  chatStatus,
  viewUserHref,
  onMessageCreated,
  onMarkedRead,
  onSupportStatusChanged,
}: {
  telegramId: string;
  title: string;
  backendUrl: string;
  wsToken: string | null;
  userId: number | null;
  supportStatus: SupportStatus | null;
  chatStatus: ChatStatus | null;
  viewUserHref?: string | null;
  onMessageCreated?: (message: ChatMessage) => void;
  onMarkedRead?: (telegramId: string) => void;
  onSupportStatusChanged?: (telegramId: string, status: SupportStatus) => void;
}) {
  const t = useT();
  const { locale } = useI18n();

  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [hasMore, setHasMore] = React.useState(false);
  const [loadingOlder, setLoadingOlder] = React.useState(false);
  const [loadingLatest, setLoadingLatest] = React.useState(false);
  const [text, setText] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [editingMessageId, setEditingMessageId] = React.useState<number | null>(
    null,
  );
  const [savingEdit, setSavingEdit] = React.useState(false);

  const visibleMessages = React.useMemo(
    () => messages.filter((m) => !m.hiddenForMe && !m.deletedAt),
    [messages],
  );
  const lastVisibleMessageId =
    visibleMessages.length > 0
      ? visibleMessages[visibleMessages.length - 1].id
      : null;
  const lastVisibleMessageIdRef = React.useRef<number | null>(null);

  const [deleteTargetId, setDeleteTargetId] = React.useState<number | null>(
    null,
  );
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteBusy, setDeleteBusy] = React.useState<"me" | "everyone" | null>(
    null,
  );
  const [error, setError] = React.useState<string | null>(null);

  const latestFetchAbortRef = React.useRef<AbortController | null>(null);
  const isFetchingLatestRef = React.useRef(false);
  const onMarkedReadRef = React.useRef(onMarkedRead);

  React.useEffect(() => {
    onMarkedReadRef.current = onMarkedRead;
  }, [onMarkedRead]);

  const [hasNewWhileAway, setHasNewWhileAway] = React.useState(false);
  const isPrependingRef = React.useRef(false);

  const [localSupportStatus, setLocalSupportStatus] =
    React.useState<SupportStatus | null>(supportStatus);

  React.useEffect(() => {
    setLocalSupportStatus(supportStatus);
  }, [supportStatus]);

  const bottomRef = React.useRef<HTMLDivElement | null>(null);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  const scrollToBottom = React.useCallback((behavior: ScrollBehavior) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  const formatMessageTime = React.useCallback(
    (iso: string) => {
      const d = new Date(iso);
      if (!Number.isFinite(d.getTime())) return "";
      return d.toLocaleTimeString(locale, {
        hour: "2-digit",
        minute: "2-digit",
      });
    },
    [locale],
  );

  const computeIsAtBottom = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return true;
    const threshold = 160;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    return distanceFromBottom <= threshold;
  }, []);

  const mergeMessages = React.useCallback((incoming: ChatMessage[]) => {
    if (incoming.length === 0) return;

    setMessages((prev) => {
      const byId = new Map<number, ChatMessage>();
      for (const m of prev) byId.set(m.id, m);
      for (const m of incoming) byId.set(m.id, m);
      const merged = Array.from(byId.values());
      merged.sort((a, b) => a.id - b.id);
      return merged;
    });
  }, []);

  const loadLatestMessages = React.useCallback(async () => {
    if (isFetchingLatestRef.current) return;

    isFetchingLatestRef.current = true;
    setLoadingLatest(true);

    latestFetchAbortRef.current?.abort();
    const controller = new AbortController();
    latestFetchAbortRef.current = controller;
    const requestedTelegramId = telegramId;

    if (process.env.NODE_ENV !== "production") {
      console.log("[ChatWindow] fetching latest messages", {
        telegramId: requestedTelegramId,
      });
    }

    try {
      const res = await fetch(
        `/api/messages/${encodeURIComponent(requestedTelegramId)}?limit=50`,
        {
          cache: "no-store",
          signal: controller.signal,
        },
      );
      if (controller.signal.aborted) return;
      if (!res.ok) return;
      const data = (await res.json()) as {
        messages?: ChatMessage[];
        hasMore?: boolean;
      };
      if (!Array.isArray(data.messages)) return;

      const hadUnread = data.messages.some(
        (m) => m.sender === "user" && m.isRead === false,
      );

      // Backend marks messages as read AFTER returning; keep UI consistent.
      const normalized = data.messages.map((m) =>
        m.sender === "user" ? { ...m, isRead: true } : m,
      );

      setHasMore(Boolean(data.hasMore));
      mergeMessages(normalized);

      if (hadUnread) onMarkedReadRef.current?.(requestedTelegramId);
    } catch {
      // ignore polling errors
    } finally {
      if (latestFetchAbortRef.current === controller)
        latestFetchAbortRef.current = null;
      isFetchingLatestRef.current = false;
      setLoadingLatest(false);
    }
  }, [mergeMessages, telegramId]);

  React.useEffect(() => {
    latestFetchAbortRef.current?.abort();
    latestFetchAbortRef.current = null;
    isFetchingLatestRef.current = false;

    setMessages([]);
    setHasMore(false);
    setLoadingOlder(false);
    setError(null);
    setText("");
    setEditingMessageId(null);
    setSavingEdit(false);
    setDeleteTargetId(null);
    setDeleteOpen(false);
    setDeleteBusy(null);
    setHasNewWhileAway(false);
    lastVisibleMessageIdRef.current = null;
    scrollToBottom("auto");

    void loadLatestMessages();
  }, [loadLatestMessages, scrollToBottom, telegramId]);

  React.useEffect(() => {
    if (isPrependingRef.current) return;

    const lastId = lastVisibleMessageId;
    const prevLastId = lastVisibleMessageIdRef.current;
    lastVisibleMessageIdRef.current = lastId;

    if (lastId === null) return;
    if (prevLastId !== null && lastId <= prevLastId) return;

    const atBottom = computeIsAtBottom();
    if (atBottom) {
      scrollToBottom("smooth");
    } else {
      setHasNewWhileAway(true);
    }
  }, [computeIsAtBottom, lastVisibleMessageId, scrollToBottom]);

  React.useEffect(() => {
    const t = window.setInterval(() => {
      void loadLatestMessages();
    }, 3000);
    return () => window.clearInterval(t);
  }, [loadLatestMessages]);

  const loadOlderMessages = React.useCallback(async () => {
    if (loadingOlder || !hasMore) return;

    const oldestId = messages[0]?.id;
    if (!oldestId) return;

    setLoadingOlder(true);
    setError(null);

    const el = scrollRef.current;
    const prevScrollHeight = el?.scrollHeight ?? 0;
    const prevScrollTop = el?.scrollTop ?? 0;

    try {
      const res = await fetch(
        `/api/messages/${encodeURIComponent(telegramId)}?beforeId=${encodeURIComponent(
          String(oldestId),
        )}&limit=50&markRead=false`,
        {
          cache: "no-store",
        },
      );
      if (!res.ok) return;

      const data = (await res.json()) as {
        messages?: ChatMessage[];
        hasMore?: boolean;
      };

      const older = Array.isArray(data.messages) ? data.messages : [];
      setHasMore(Boolean(data.hasMore));

      if (older.length === 0) return;

      isPrependingRef.current = true;
      mergeMessages(older);

      window.requestAnimationFrame(() => {
        const el2 = scrollRef.current;
        if (!el2) {
          isPrependingRef.current = false;
          return;
        }

        const newScrollHeight = el2.scrollHeight;
        const delta = newScrollHeight - prevScrollHeight;
        el2.scrollTop = prevScrollTop + delta;
        isPrependingRef.current = false;
      });
    } catch {
      // ignore
    } finally {
      setLoadingOlder(false);
    }
  }, [hasMore, loadingOlder, mergeMessages, messages, telegramId]);

  const onScroll = React.useCallback(() => {
    const atBottom = computeIsAtBottom();
    if (atBottom) setHasNewWhileAway(false);

    const el = scrollRef.current;
    if (!el) return;
    const nearTop = el.scrollTop <= 120;
    if (nearTop) {
      void loadOlderMessages();
    }
  }, [computeIsAtBottom, loadOlderMessages]);

  React.useEffect(() => {
    const wsUrl = toBackendWsUrl(backendUrl, wsToken);
    if (!wsUrl) return;

    let closedByEffect = false;
    let retry = 0;
    let reconnectTimer: number | null = null;
    let ws: WebSocket | null = null;

    const connect = () => {
      if (closedByEffect) return;

      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        retry = 0;
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(String(event.data)) as unknown;
          if (!isWsMessageCreatedEvent(parsed)) return;

          const raw = parsed.message as Partial<ChatMessage>;
          const incoming: ChatMessage = {
            id: raw.id as number,
            telegramId: String(raw.telegramId ?? ""),
            sender: raw.sender === "admin" ? "admin" : "user",
            text: String(raw.text ?? ""),
            isRead:
              typeof raw.isRead === "boolean"
                ? raw.isRead
                : raw.sender === "admin",
            createdAt:
              typeof raw.createdAt === "string"
                ? raw.createdAt
                : new Date().toISOString(),
          };

          onMessageCreated?.(incoming);

          if (incoming.telegramId !== telegramId) return;

          const atBottomNow = computeIsAtBottom();
          if (!atBottomNow && incoming.sender === "user") {
            toast(`${title}: ${incoming.text}`, {
              duration: 4000,
            });
          }

          mergeMessages([incoming]);
        } catch {
          // ignore malformed events
        }
      };

      ws.onclose = () => {
        if (closedByEffect) return;
        const delay = Math.min(10_000, 500 * Math.pow(2, retry));
        retry += 1;
        reconnectTimer = window.setTimeout(connect, delay);
      };

      ws.onerror = () => {
        // allow onclose to trigger reconnect
      };
    };

    connect();

    return () => {
      closedByEffect = true;
      if (reconnectTimer !== null) window.clearTimeout(reconnectTimer);
      try {
        ws?.close();
      } catch {
        // ignore
      }
      ws = null;
    };
  }, [
    backendUrl,
    computeIsAtBottom,
    mergeMessages,
    onMessageCreated,
    telegramId,
    title,
    wsToken,
  ]);

  const closeChat = React.useCallback(async () => {
    if (!userId) return;
    if (localSupportStatus === "closed") return;

    setError(null);

    try {
      const res = await fetch(
        `/api/users/${encodeURIComponent(String(userId))}/support-status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ supportStatus: "closed" }),
        },
      );

      if (!res.ok) {
        setError(t("messages.closeChatFailed"));
        return;
      }

      setLocalSupportStatus("closed");
      onSupportStatusChanged?.(telegramId, "closed");
    } catch {
      setError(t("messages.networkError"));
    }
  }, [localSupportStatus, onSupportStatusChanged, t, telegramId, userId]);

  const doSend = React.useCallback(async () => {
    const message = text.trim();
    if (!message) return;

    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramId, message }),
      });

      if (!res.ok) {
        setError(t("messages.sendFailed"));
        return;
      }

      setLocalSupportStatus("active");
      onSupportStatusChanged?.(telegramId, "active");
      setText("");
      await loadLatestMessages();
      scrollToBottom("smooth");
    } catch {
      setError(t("messages.networkError"));
    } finally {
      setSending(false);
    }
  }, [
    loadLatestMessages,
    onSupportStatusChanged,
    scrollToBottom,
    t,
    telegramId,
    text,
  ]);

  const startEdit = React.useCallback((m: ChatMessage) => {
    if (m.sender !== "admin") return;
    if (m.hiddenForMe || m.deletedAt) return;
    setError(null);
    setEditingMessageId(m.id);
    setText(m.text);
    window.setTimeout(() => textareaRef.current?.focus(), 0);
  }, []);

  const cancelEdit = React.useCallback(() => {
    setEditingMessageId(null);
    setText("");
  }, []);

  const doEdit = React.useCallback(async () => {
    const nextText = text.trim();
    if (!nextText) return;
    if (editingMessageId === null) return;

    const messageId = editingMessageId;

    setSavingEdit(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/messages/message/${encodeURIComponent(String(messageId))}/edit`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: nextText }),
        },
      );

      const data = (await res.json().catch(() => null)) as unknown;
      if (!res.ok) {
        setError(t("messages.editFailed"));
        return;
      }

      const updated =
        data && typeof data === "object"
          ? (data as Record<string, unknown>).message
          : null;
      const updatedText =
        updated && typeof updated === "object"
          ? (updated as Record<string, unknown>).text
          : null;
      const editedAt =
        updated && typeof updated === "object"
          ? (updated as Record<string, unknown>).editedAt
          : null;

      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? {
                ...m,
                text: typeof updatedText === "string" ? updatedText : nextText,
                editedAt: typeof editedAt === "string" ? editedAt : m.editedAt,
              }
            : m,
        ),
      );

      setEditingMessageId(null);
      setText("");
    } catch {
      setError(t("messages.networkError"));
    } finally {
      setSavingEdit(false);
    }
  }, [editingMessageId, t, text]);

  const openDelete = React.useCallback((messageId: number) => {
    setDeleteTargetId(messageId);
    setDeleteOpen(true);
  }, []);

  const doHideForMe = React.useCallback(async () => {
    if (deleteTargetId === null) return;
    const messageId = deleteTargetId;

    setDeleteBusy("me");
    setError(null);

    try {
      const res = await fetch(
        `/api/messages/message/${encodeURIComponent(String(messageId))}/hide`,
        { method: "POST" },
      );
      if (!res.ok) {
        setError(t("messages.deleteForMeFailed"));
        return;
      }

      if (editingMessageId === messageId) {
        setEditingMessageId(null);
        setText("");
      }

      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, hiddenForMe: true } : m)),
      );

      setDeleteOpen(false);
      setDeleteTargetId(null);
    } catch {
      setError(t("messages.networkError"));
    } finally {
      setDeleteBusy(null);
    }
  }, [deleteTargetId, editingMessageId, t]);

  const doDeleteForEveryone = React.useCallback(async () => {
    if (deleteTargetId === null) return;
    const messageId = deleteTargetId;

    setDeleteBusy("everyone");
    setError(null);

    try {
      const res = await fetch(
        `/api/messages/message/${encodeURIComponent(String(messageId))}/delete`,
        { method: "POST" },
      );

      const data = (await res.json().catch(() => null)) as unknown;
      if (!res.ok) {
        setError(t("messages.deleteForEveryoneFailed"));
        return;
      }

      if (editingMessageId === messageId) {
        setEditingMessageId(null);
        setText("");
      }

      const updated =
        data && typeof data === "object"
          ? (data as Record<string, unknown>).message
          : null;
      const deletedAt =
        updated && typeof updated === "object"
          ? (updated as Record<string, unknown>).deletedAt
          : null;

      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? {
                ...m,
                deletedAt:
                  typeof deletedAt === "string"
                    ? deletedAt
                    : new Date().toISOString(),
              }
            : m,
        ),
      );

      setDeleteOpen(false);
      setDeleteTargetId(null);
    } catch {
      setError(t("messages.networkError"));
    } finally {
      setDeleteBusy(null);
    }
  }, [deleteTargetId, editingMessageId, t]);

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingMessageId !== null) {
      await doEdit();
      return;
    }

    await doSend();
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{title}</p>
        </div>

        <div className="flex items-center gap-2">
          {chatStatus ? (
            chatStatus === "IN_PROGRESS" ? (
              <Badge variant="secondary">
                <CircleDotIcon />
                <span>{t("supportStatus.active")}</span>
              </Badge>
            ) : chatStatus === "UNREAD" ? (
              <Badge
                variant="outline"
                className="px-1.5"
                title={t("messages.unread")}
              >
                <MailIcon />
                <span className="sr-only">{t("messages.unread")}</span>
              </Badge>
            ) : chatStatus === "READ" ? (
              <Badge
                variant="outline"
                className="px-1.5"
                title={t("messages.read")}
              >
                <MailOpenIcon />
                <span className="sr-only">{t("messages.read")}</span>
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="px-1.5"
                title={t("supportStatus.closed")}
              >
                <LockIcon />
                <span className="sr-only">{t("supportStatus.closed")}</span>
              </Badge>
            )
          ) : null}

          {viewUserHref ? (
            <Link
              href={viewUserHref}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              {t("messages.viewUser")}
            </Link>
          ) : null}

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void loadLatestMessages()}
            disabled={sending || loadingLatest}
          >
            {t("messages.markRead")}
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void closeChat()}
            disabled={!userId || localSupportStatus === "closed"}
          >
            {t("messages.closeChat")}
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto px-3 py-3 scrollbar-thin"
        onScroll={onScroll}
      >
        <div className="flex flex-col gap-1.5">
          {loadingOlder ? (
            <div className="py-2 text-center text-xs text-muted-foreground">
              {t("common.loading")}
            </div>
          ) : null}

          {hasMore && !loadingOlder ? (
            <div className="py-2 text-center">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void loadOlderMessages()}
              >
                {t("messages.loadOlder")}
              </Button>
            </div>
          ) : null}

          {visibleMessages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "flex",
                m.sender === "admin" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "group flex max-w-[85%] items-start gap-1",
                  m.sender === "admin" ? "flex-row-reverse" : "flex-row",
                )}
              >
                <div className="min-w-0">
                  <div
                    className={cn(
                      "min-w-16 rounded-xl border px-3 py-1.5 text-sm whitespace-pre-wrap break-words",
                      m.sender === "admin"
                        ? "bg-primary/15 text-foreground border-primary/20"
                        : "bg-muted/50",
                    )}
                  >
                    {m.text}
                  </div>

                  <div
                    className={cn(
                      "mt-0.5 flex items-center gap-2 text-[0.7rem] text-muted-foreground",
                      m.sender === "admin" ? "justify-end" : "justify-start",
                    )}
                  >
                    {m.editedAt ? <span>{t("messages.edited")}</span> : null}
                    <span>{formatMessageTime(m.createdAt)}</span>

                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="opacity-0 group-hover:opacity-100"
                          />
                        }
                      >
                        <EllipsisVerticalIcon />
                        <span className="sr-only">
                          {t("messages.messageActions")}
                        </span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align={m.sender === "admin" ? "end" : "start"}
                      >
                        {m.sender === "admin" ? (
                          <>
                            <DropdownMenuItem onClick={() => startEdit(m)}>
                              <PencilIcon />
                              {t("common.edit")}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        ) : null}
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => openDelete(m.id)}
                        >
                          <Trash2Icon />
                          {t("common.delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t p-3">
        {hasNewWhileAway ? (
          <div className="mb-2 flex justify-center">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => scrollToBottom("smooth")}
            >
              {t("messages.newMessages")}
            </Button>
          </div>
        ) : null}

        {editingMessageId !== null ? (
          <div className="mb-2 flex items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2">
            <div className="min-w-0">
              <p className="text-xs font-medium">
                {t("messages.editingMessage")}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={cancelEdit}
              disabled={savingEdit || sending}
            >
              {t("common.cancel")}
            </Button>
          </div>
        ) : null}

        <form onSubmit={onSend} className="flex items-end gap-2">
          <div className="flex flex-1 items-end rounded-lg border border-input bg-background px-2 py-1.5 focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                if (e.shiftKey) return;
                if (e.nativeEvent.isComposing) return;
                e.preventDefault();
                if (editingMessageId !== null) {
                  void doEdit();
                } else {
                  void doSend();
                }
              }}
              placeholder={t("messages.typeMessagePlaceholder")}
              disabled={sending || savingEdit}
              rows={2}
              className="max-h-32 min-h-10 w-full resize-none bg-transparent px-1 py-1 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          <Button
            type="submit"
            className="h-10"
            disabled={sending || savingEdit || text.trim().length === 0}
          >
            {editingMessageId !== null ? t("common.save") : t("messages.send")}
          </Button>
        </form>
        {error ? (
          <p className="mt-2 text-xs text-destructive">{error}</p>
        ) : null}
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("messages.deleteMessageTitle")}</DialogTitle>
            <DialogDescription>
              {t("messages.deleteMessageDescription")}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleteBusy !== null}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void doHideForMe()}
              disabled={deleteTargetId === null || deleteBusy !== null}
            >
              {t("messages.deleteForMe")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void doDeleteForEveryone()}
              disabled={deleteTargetId === null || deleteBusy !== null}
            >
              {t("messages.deleteForEveryone")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
