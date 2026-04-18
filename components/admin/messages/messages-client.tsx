"use client";

import * as React from "react";

import { CircleDotIcon, LockIcon, MailIcon, MailOpenIcon } from "lucide-react";

import { ChatWindow } from "@/components/admin/chat-window";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: number;
  telegramId: string;
  sender: "user" | "admin";
  text: string;
  isRead: boolean;
  createdAt: string;
};

type SupportStatus = "none" | "pending" | "active" | "closed";

type ChatListItem = {
  telegramId: string;
  unreadCount: number;
  user: {
    id: number;
    telegramId: string;
    name: string;
    phone: string | null;
    telegramUsername?: string | null;
    telegramNickname?: string | null;
    isInSupport: boolean;
    supportStatus: SupportStatus;
    createdAt: string;
  } | null;
  lastMessage: {
    id: number;
    text: string;
    sender: "user" | "admin";
    isRead?: boolean;
    createdAt: string;
  } | null;
};

type InboxResponse = {
  chats: ChatListItem[];
  page: number;
  limit: number;
  hasMore: boolean;
};

type ChatStatus = "UNREAD" | "READ" | "IN_PROGRESS" | "CLOSED";

type SortOption =
  | "newest"
  | "oldest"
  | "unread_first"
  | "in_progress_first"
  | "closed_first";

type StatusFilter = "all" | "unread" | "read" | "in_progress";

const sortLabel = (v: SortOption) => {
  if (v === "newest") return "Latest activity";
  if (v === "oldest") return "Oldest";
  if (v === "unread_first") return "Unread first";
  if (v === "in_progress_first") return "In progress first";
  return "Closed";
};

const statusFilterLabel = (v: StatusFilter) => {
  if (v === "all") return "All";
  if (v === "unread") return "Unread";
  if (v === "read") return "Read";
  return "In progress";
};

const formatListTime = (iso: string | undefined) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  return d.toLocaleString([], {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const computeChatStatus = (chat: ChatListItem): ChatStatus => {
  const supportStatus = chat.user?.supportStatus ?? "none";
  if (supportStatus === "closed") return "CLOSED";
  if (supportStatus === "active") return "IN_PROGRESS";
  if ((chat.unreadCount ?? 0) > 0) return "UNREAD";
  return "READ";
};

const useDebouncedValue = <T,>(value: T, delayMs: number) => {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(t);
  }, [delayMs, value]);

  return debounced;
};

export function MessagesClient({
  backendUrl,
  wsToken,
  initialTelegramId,
}: {
  backendUrl: string;
  wsToken: string | null;
  initialTelegramId?: string | null;
}) {
  const [qInput, setQInput] = React.useState("");
  const debouncedQ = useDebouncedValue(qInput, 300);

  const [sort, setSort] = React.useState<SortOption>("newest");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
  const [page, setPage] = React.useState(1);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [chats, setChats] = React.useState<ChatListItem[]>([]);
  const [hasMore, setHasMore] = React.useState(false);
  const [limit, setLimit] = React.useState(25);

  const [selectedTelegramId, setSelectedTelegramId] = React.useState<
    string | null
  >(initialTelegramId ?? null);

  const selected =
    (selectedTelegramId
      ? chats.find((c) => c.telegramId === selectedTelegramId)
      : null) ?? null;

  const selectedTitle = selected?.user?.name ?? "Conversation";
  const selectedUserId = selected?.user?.id ?? null;
  const selectedSupportStatus = selected?.user?.supportStatus ?? null;

  const refetchInbox = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      const q = debouncedQ.trim();
      if (q.length > 0) params.set("q", q);

      // Backend supports newest/oldest; priority sorts are applied in-memory.
      params.set("sort", sort === "oldest" ? "oldest" : "newest");

      if (statusFilter !== "all") {
        params.set(
          "filter",
          statusFilter === "in_progress" ? "in_progress" : statusFilter,
        );
      } else {
        params.set("filter", "all");
      }

      params.set("page", String(page));
      params.set("limit", String(limit));

      const res = await fetch(`/api/messages/users?${params.toString()}`, {
        cache: "no-store",
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as unknown;
        const messageValue =
          data && typeof data === "object"
            ? (data as { message?: unknown }).message
            : undefined;
        throw new Error(
          typeof messageValue === "string" && messageValue.trim().length > 0
            ? messageValue
            : `Failed to load inbox (${res.status})`,
        );
      }

      const data = (await res.json()) as InboxResponse;

      let rows = Array.isArray(data.chats) ? data.chats : [];

      if (sort === "unread_first") {
        rows = [...rows].sort((a, b) => {
          const aStatus = computeChatStatus(a);
          const bStatus = computeChatStatus(b);
          const aKey = aStatus === "UNREAD" ? 0 : 1;
          const bKey = bStatus === "UNREAD" ? 0 : 1;
          if (aKey !== bKey) return aKey - bKey;
          return (
            new Date(b.lastMessage?.createdAt ?? 0).getTime() -
            new Date(a.lastMessage?.createdAt ?? 0).getTime()
          );
        });
      } else if (sort === "in_progress_first") {
        rows = [...rows].sort((a, b) => {
          const aStatus = computeChatStatus(a);
          const bStatus = computeChatStatus(b);
          const aKey = aStatus === "IN_PROGRESS" ? 0 : 1;
          const bKey = bStatus === "IN_PROGRESS" ? 0 : 1;
          if (aKey !== bKey) return aKey - bKey;
          return (
            new Date(b.lastMessage?.createdAt ?? 0).getTime() -
            new Date(a.lastMessage?.createdAt ?? 0).getTime()
          );
        });
      } else if (sort === "closed_first") {
        rows = [...rows].sort((a, b) => {
          const aKey = a.user?.supportStatus === "closed" ? 0 : 1;
          const bKey = b.user?.supportStatus === "closed" ? 0 : 1;
          if (aKey !== bKey) return aKey - bKey;
          return (
            new Date(b.lastMessage?.createdAt ?? 0).getTime() -
            new Date(a.lastMessage?.createdAt ?? 0).getTime()
          );
        });
      }

      setChats(rows);
      setHasMore(Boolean(data.hasMore));
      setLimit(typeof data.limit === "number" ? data.limit : 25);

      // Ensure selection stays valid.
      setSelectedTelegramId((prev) => {
        const next = prev ?? initialTelegramId ?? rows[0]?.telegramId ?? null;
        if (!next) return null;
        if (rows.some((c) => c.telegramId === next)) return next;
        return rows[0]?.telegramId ?? null;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load inbox");
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, initialTelegramId, limit, page, sort, statusFilter]);

  React.useEffect(() => {
    void refetchInbox();
  }, [refetchInbox]);

  React.useEffect(() => {
    const t = window.setInterval(() => {
      void refetchInbox();
    }, 3000);
    return () => window.clearInterval(t);
  }, [refetchInbox]);

  const onSelectChat = React.useCallback((telegramId: string) => {
    setSelectedTelegramId(telegramId);

    // Optimistic: opening a chat should mark all as read.
    setChats((prev) =>
      prev.map((c) =>
        c.telegramId === telegramId ? { ...c, unreadCount: 0 } : c,
      ),
    );
  }, []);

  const scheduleRefetchRef = React.useRef<number | null>(null);
  const scheduleInboxRefetch = React.useCallback(() => {
    if (scheduleRefetchRef.current !== null)
      window.clearTimeout(scheduleRefetchRef.current);
    scheduleRefetchRef.current = window.setTimeout(() => {
      scheduleRefetchRef.current = null;
      void refetchInbox();
    }, 200);
  }, [refetchInbox]);

  const onMessageCreated = React.useCallback(
    (message: ChatMessage) => {
      setChats((prev) => {
        const idx = prev.findIndex((c) => c.telegramId === message.telegramId);
        if (idx < 0) return prev;

        const current = prev[idx];
        const incomingLast = {
          id: message.id,
          text: message.text,
          sender: message.sender,
          isRead: message.isRead,
          createdAt: message.createdAt,
        };

        const shouldIncrementUnread =
          message.sender === "user" &&
          message.telegramId !== selectedTelegramId;

        const updated: ChatListItem = {
          ...current,
          lastMessage: incomingLast,
          unreadCount: shouldIncrementUnread
            ? (current.unreadCount ?? 0) + 1
            : (current.unreadCount ?? 0),
        };

        const next = [...prev];
        next[idx] = updated;

        // Keep the newest activity visible near the top.
        // Priority sorts are applied by a scheduled refetch.
        if (sort === "newest") {
          next.splice(idx, 1);
          next.unshift(updated);
        }

        return next;
      });

      scheduleInboxRefetch();
    },
    [scheduleInboxRefetch, selectedTelegramId, sort],
  );

  const onMarkedRead = React.useCallback(
    (telegramId: string) => {
      setChats((prev) =>
        prev.map((c) =>
          c.telegramId === telegramId ? { ...c, unreadCount: 0 } : c,
        ),
      );

      scheduleInboxRefetch();
    },
    [scheduleInboxRefetch],
  );

  const onSupportStatusChanged = React.useCallback(
    (telegramId: string, status: SupportStatus) => {
      setChats((prev) =>
        prev.map((c) => {
          if (c.telegramId !== telegramId) return c;
          if (!c.user) return c;
          return { ...c, user: { ...c.user, supportStatus: status } };
        }),
      );

      scheduleInboxRefetch();
    },
    [scheduleInboxRefetch],
  );

  const selectedChatStatus = selected ? computeChatStatus(selected) : null;

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden py-4 md:py-6">
      <div className="flex flex-1 min-h-0 flex-col px-4 lg:px-6">
        <div className="grid h-full flex-1 min-h-0 gap-4 md:grid-cols-[360px_1fr]">
          <Card className="h-full min-h-0 gap-0 py-0">
            <CardHeader className="border-b py-4">
              <CardTitle className="text-base">Support Inbox</CardTitle>

              <div className="mt-3 grid gap-2">
                <Input
                  value={qInput}
                  onChange={(e) => {
                    setQInput(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search name, @username, phone"
                />

                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={sort}
                    onValueChange={(v) => {
                      setSort(v as SortOption);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger
                      size="sm"
                      className="w-full"
                      aria-label="Sort"
                    >
                      <SelectValue>{sortLabel(sort)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="newest" className="rounded-lg">
                        Latest activity
                      </SelectItem>
                      <SelectItem value="oldest" className="rounded-lg">
                        Oldest
                      </SelectItem>
                      <SelectItem value="unread_first" className="rounded-lg">
                        Unread first
                      </SelectItem>
                      <SelectItem
                        value="in_progress_first"
                        className="rounded-lg"
                      >
                        In progress first
                      </SelectItem>
                      <SelectItem value="closed_first" className="rounded-lg">
                        Closed
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={statusFilter}
                    onValueChange={(v) => {
                      setStatusFilter(v as StatusFilter);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger
                      size="sm"
                      className="w-full"
                      aria-label="Status"
                    >
                      <SelectValue>
                        {statusFilterLabel(statusFilter)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="all" className="rounded-lg">
                        All
                      </SelectItem>
                      <SelectItem value="unread" className="rounded-lg">
                        Unread
                      </SelectItem>
                      <SelectItem value="read" className="rounded-lg">
                        Read
                      </SelectItem>
                      <SelectItem value="in_progress" className="rounded-lg">
                        In progress
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs text-muted-foreground">
                    Page {page}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1 || loading}
                    >
                      Prev
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={!hasMore || loading}
                    >
                      Next
                    </Button>
                  </div>
                </div>

                {error ? (
                  <p className="text-sm text-destructive">{error}</p>
                ) : null}
              </div>
            </CardHeader>

            <CardContent className="flex-1 min-h-0 overflow-y-auto p-0 scrollbar-thin">
              <div className="flex flex-col">
                {loading && chats.length === 0 ? (
                  <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                    Loading…
                  </div>
                ) : null}

                {chats.map((c) => {
                  const isActive = c.telegramId === selectedTelegramId;

                  const fullName = c.user?.name ?? "Unknown user";
                  const usernameValue = c.user?.telegramUsername
                    ? `@${String(c.user.telegramUsername).replace(/^@+/, "")}`
                    : c.telegramId;

                  const preview = c.lastMessage?.text ?? "";
                  const time = formatListTime(c.lastMessage?.createdAt);

                  const unreadCount = c.unreadCount ?? 0;
                  const isUnread = unreadCount > 0;
                  const isInProgress = c.user?.supportStatus === "active";
                  const isClosed = c.user?.supportStatus === "closed";

                  return (
                    <button
                      key={c.telegramId}
                      type="button"
                      onClick={() => onSelectChat(c.telegramId)}
                      className={cn(
                        "flex w-full flex-col gap-1 border-b px-4 py-3 text-left hover:bg-muted/50",
                        isActive && "bg-muted",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">
                            {fullName}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {usernameValue}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-2">
                            {isInProgress ? (
                              <span
                                className="inline-flex items-center"
                                title="In progress"
                              >
                                <CircleDotIcon className="size-4 text-foreground" />
                              </span>
                            ) : null}

                            {isClosed ? (
                              <span
                                className="inline-flex items-center"
                                title="Closed"
                              >
                                <LockIcon className="size-4 text-muted-foreground" />
                              </span>
                            ) : null}

                            {isUnread ? (
                              <span
                                className="inline-flex items-center gap-1"
                                title="Unread"
                              >
                                <MailIcon className="size-4 text-muted-foreground" />
                                <Badge
                                  variant="secondary"
                                  className="h-5 px-1.5 py-0 text-[0.65rem]"
                                >
                                  {unreadCount}
                                </Badge>
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center"
                                title="Read"
                              >
                                <MailOpenIcon className="size-4 text-muted-foreground" />
                              </span>
                            )}
                          </div>
                          {time ? (
                            <span className="text-[0.7rem] text-muted-foreground">
                              {time}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="truncate text-xs text-muted-foreground">
                        {preview}
                      </div>
                    </button>
                  );
                })}

                {chats.length === 0 && !loading ? (
                  <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No conversations yet.
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card className="h-full min-h-0 gap-0 overflow-hidden py-0">
            {selectedTelegramId ? (
              <ChatWindow
                telegramId={selectedTelegramId}
                title={selectedTitle}
                backendUrl={backendUrl}
                wsToken={wsToken}
                userId={selectedUserId}
                supportStatus={selectedSupportStatus}
                chatStatus={selectedChatStatus}
                viewUserHref={
                  selectedUserId ? `/admin/users/${selectedUserId}` : null
                }
                onMessageCreated={onMessageCreated}
                onMarkedRead={onMarkedRead}
                onSupportStatusChanged={onSupportStatusChanged}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Select a conversation.
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
