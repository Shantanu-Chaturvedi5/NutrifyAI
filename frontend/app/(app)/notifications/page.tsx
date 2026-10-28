"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CalendarClock,
  Check,
  CheckCheck,
  FileCheck2,
  HeartPulse,
  Inbox,
  type LucideIcon,
  Sparkles,
  Wrench,
} from "lucide-react";
import {
  listNotificationsAction,
  markAllReadAction,
  markReadAction,
  type NotificationResponse,
  type NotificationType,
} from "@/lib/actions/notifications";

const TYPE_PRESENTATION: Record<
  NotificationType,
  { label: string; icon: LucideIcon; tone: string }
> = {
  REPORT_READY: {
    label: "Report ready",
    icon: FileCheck2,
    tone: "notification-tone-blue",
  },
  DEFICIENCY_ALERT: {
    label: "Health alert",
    icon: HeartPulse,
    tone: "notification-tone-rose",
  },
  NEW_RECOMMENDATION: {
    label: "New recommendation",
    icon: Sparkles,
    tone: "notification-tone-violet",
  },
  PLAN_REMINDER: {
    label: "Plan reminder",
    icon: CalendarClock,
    tone: "notification-tone-amber",
  },
  SYSTEM: {
    label: "NutrifyAI update",
    icon: Wrench,
    tone: "notification-tone-sage",
  },
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    setError(null);
    listNotificationsAction()
      .then((res) => setNotifications(res.content))
      .catch(() => setError("We couldn’t load your notifications. Please try again."));
  }, [reloadCount]);

  async function handleMarkRead(id: number) {
    const previous = notifications;
    setError(null);
    setBusyId(id);
    setNotifications((current) =>
      current?.map((notification) =>
        notification.id === id ? { ...notification, isRead: true } : notification
      ) ?? null
    );

    try {
      await markReadAction(id);
      router.refresh();
    } catch {
      setNotifications(previous);
      setError("That notification couldn’t be marked as read. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleMarkAllRead() {
    const previous = notifications;
    setError(null);
    setMarkingAll(true);
    setNotifications((current) =>
      current?.map((notification) => ({ ...notification, isRead: true })) ?? null
    );

    try {
      await markAllReadAction();
      router.refresh();
    } catch {
      setNotifications(previous);
      setError("We couldn’t mark all notifications as read. Please try again.");
    } finally {
      setMarkingAll(false);
    }
  }

  const unreadCount = notifications?.filter((notification) => !notification.isRead).length ?? 0;
  const hasUnread = unreadCount > 0;

  return (
    <div className="relative mx-auto -mt-6 max-w-6xl overflow-visible pb-16 text-graphite">
      <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 bottom-0 top-[72px] z-0 overflow-hidden">
        <div className="notification-page-background absolute inset-0" />
        <div className="absolute left-[max(1.5rem,calc((100vw-1200px)/2))] top-32 hidden h-40 w-40 rounded-full border border-[var(--notification-art)] lg:block">
          <div className="absolute inset-3 rounded-full border border-dashed border-[var(--notification-art)]" />
          <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-[1.4rem] border border-[var(--notification-art)]" />
          <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--notification-accent)] opacity-60" />
        </div>
        <div className="absolute right-[max(2rem,calc((100vw-1200px)/2))] top-40 hidden h-32 w-40 rotate-3 rounded-2xl border border-[var(--notification-art)] bg-[var(--notification-paper)] p-4 lg:block">
          <div className="flex items-center gap-2">
            <span className="h-7 w-7 rounded-full bg-[var(--notification-soft)]" />
            <span className="h-1.5 w-16 rounded-full bg-[var(--notification-accent)] opacity-35" />
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-1 w-full rounded-full bg-[var(--notification-art)]" />
            <div className="h-1 w-4/5 rounded-full bg-[var(--notification-art)]" />
            <div className="h-1 w-3/5 rounded-full bg-[var(--notification-art)]" />
          </div>
        </div>
        <div className="absolute bottom-28 left-[27%] h-2.5 w-2.5 rounded-full bg-[var(--notification-accent)] opacity-35" />
        <div className="absolute right-[28%] top-[42%] h-3 w-3 rounded-full bg-[var(--notification-art)]" />
      </div>

      <div className="relative z-10 px-4 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-5 pb-7 pt-2 sm:flex-row sm:items-end sm:justify-between lg:pb-9">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--notification-border)] bg-[var(--notification-soft)] px-3 py-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--notification-accent)] shadow-[0_10px_20px_rgba(80,74,114,0.07)] backdrop-blur-sm">
              <Bell className="h-3.5 w-3.5" />
              Your inbox
            </div>
            <h1 className="font-display text-[2.8rem] leading-none tracking-[-0.07em] text-graphite sm:text-[3.2rem] lg:text-[3.8rem]">
              Notifications
            </h1>
            <p className="mt-3 max-w-2xl text-base text-graphite-70 sm:text-lg">
              Updates about your reports, health insights, and plans—all in one place.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-full border border-hairline bg-card/80 px-3 py-2 font-data text-xs text-graphite-70">
              {notifications === null ? "…" : `${unreadCount} unread`}
            </span>
            {hasUnread && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={markingAll}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--notification-border)] bg-card/85 px-4 py-2.5 text-sm font-semibold text-[var(--notification-accent)] shadow-sm transition hover:bg-[var(--notification-soft)] disabled:cursor-wait disabled:opacity-60"
              >
                <CheckCheck className="h-4 w-4" />
                {markingAll ? "Updating…" : "Mark all as read"}
              </button>
            )}
          </div>
        </header>

        {error && (
          <div role="alert" className="mb-5 rounded-2xl border border-critical/40 bg-critical-soft px-4 py-3 text-sm text-critical">
            {error}
          </div>
        )}

        {notifications === null && error ? (
          <section className="rounded-[26px] border border-critical/30 bg-card/90 px-6 py-10 text-center shadow-[0_18px_32px_rgba(50,45,75,0.06)]">
            <p className="text-sm text-graphite-70">Your inbox isn’t available right now.</p>
            <button
              type="button"
              onClick={() => setReloadCount((count) => count + 1)}
              className="mt-4 rounded-xl bg-[var(--notification-accent)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Try again
            </button>
          </section>
        ) : notifications === null ? (
          <section aria-label="Loading notifications" className="space-y-3 rounded-[26px] border border-hairline bg-card/85 p-5 shadow-[0_18px_32px_rgba(50,45,75,0.06)]">
            <div className="h-16 animate-pulse rounded-2xl bg-linen-deep/70" />
            <div className="h-16 animate-pulse rounded-2xl bg-linen-deep/70" />
            <div className="h-16 animate-pulse rounded-2xl bg-linen-deep/70" />
          </section>
        ) : notifications.length === 0 ? (
          <section className="flex min-h-72 flex-col items-center justify-center rounded-[26px] border border-[var(--notification-border)] bg-[var(--notification-paper)]/95 px-6 py-12 text-center shadow-[0_18px_32px_rgba(50,45,75,0.06)]">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--notification-soft)] text-[var(--notification-accent)]">
              <Inbox className="h-8 w-8" strokeWidth={1.6} />
            </div>
            <h2 className="font-display text-2xl text-graphite">You’re all caught up</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-graphite-70">
              When a report is ready, a scan finishes, or your plan has an update, you’ll find it here.
            </p>
          </section>
        ) : (
          <section className="overflow-hidden rounded-[26px] border border-[var(--notification-border)] bg-[var(--notification-paper)]/95 shadow-[0_18px_32px_rgba(50,45,75,0.07)] backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
              <div>
                <h2 className="font-display text-xl tracking-tight text-graphite">Recent updates</h2>
                <p className="mt-1 text-sm text-graphite-70">Newest notifications appear first.</p>
              </div>
              <span className="font-data text-xs text-graphite-70">{notifications.length} total</span>
            </div>

            <ul className="divide-y divide-hairline">
              {notifications.map((notification) => {
                const presentation = TYPE_PRESENTATION[notification.type] ?? TYPE_PRESENTATION.SYSTEM;
                const Icon = presentation.icon;

                return (
                  <li
                    key={notification.id}
                    className={`flex items-start gap-4 px-4 py-5 transition-colors sm:px-5 ${
                      notification.isRead ? "bg-transparent" : "bg-[var(--notification-unread)]"
                    }`}
                  >
                    <span className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${presentation.tone}`}>
                      <Icon className="h-5 w-5" strokeWidth={1.9} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--notification-accent)]">
                          {presentation.label}
                        </p>
                        {!notification.isRead && (
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--notification-accent)]" aria-label="Unread" />
                        )}
                      </div>
                      <p className="mt-1.5 text-sm leading-6 text-graphite">{notification.message}</p>
                      <p className="mt-2 font-data text-[11px] text-graphite-70" suppressHydrationWarning>
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <button
                        type="button"
                        onClick={() => handleMarkRead(notification.id)}
                        disabled={busyId === notification.id || markingAll}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[var(--notification-accent)] transition hover:bg-[var(--notification-soft)] disabled:cursor-wait disabled:opacity-60"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{busyId === notification.id ? "Updating…" : "Mark read"}</span>
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
