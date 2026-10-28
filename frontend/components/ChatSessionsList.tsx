"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock3, MessagesSquare, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { deleteSessionAction, renameSessionAction, type ChatSessionResponse } from "@/lib/actions/chat";

export function ChatSessionsList({
  initialSessions,
  activeSessionId,
}: {
  initialSessions: ChatSessionResponse[];
  activeSessionId?: number;
}) {
  const [sessions, setSessions] = useState(initialSessions);
  const [busyId, setBusyId] = useState<number | null>(null);

  async function handleRename(id: number, currentTitle: string) {
    const next = window.prompt("Rename conversation:", currentTitle);
    if (next === null) return;
    const trimmed = next.trim();
    if (!trimmed || trimmed === currentTitle) return;

    setBusyId(id);
    try {
      await renameSessionAction(id, trimmed);
      setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, title: trimmed } : s)));
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: number, title: string) {
    if (!window.confirm(`Delete "${title}"? This can't be undone.`)) return;
    setBusyId(id);
    try {
      await deleteSessionAction(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <aside className="flex max-h-[calc(100vh-7.5rem)] min-h-[320px] flex-col rounded-[26px] border border-white/75 bg-[linear-gradient(150deg,#cbd6e9_0%,#d4cbe5_58%,#e8d1ca_100%)] p-4 shadow-[0_16px_46px_rgba(74,79,126,0.15)] backdrop-blur sm:p-5">
      <div className="mb-3 flex items-center gap-3 px-1">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-[#526d99]">
          <MessagesSquare className="h-[18px] w-[18px]" />
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold tracking-[-0.025em] text-[#233957]">
            Recent conversations
          </h2>
          <p className="mt-0.5 text-[10px] text-[#778aa3]">
            {sessions.length ? `${sessions.length} saved chats` : "Your saved chats"}
          </p>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-[#d9dfef] bg-white/60 px-5 py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-[#55769c]">
            <MessagesSquare className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm font-medium text-[#324c67]">No conversations yet</p>
          <p className="mt-1 max-w-[230px] text-xs leading-5 text-[#8193a7]">
            Start a chat with the assistant and your conversations will appear here.
          </p>
        </div>
      ) : (
        <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
          {sessions.map((s) => {
            const title = s.title || "New conversation";
            const busy = busyId === s.id;
            const active = activeSessionId === s.id;
            return (
              <li
                key={s.id}
                className={`group relative flex items-center rounded-2xl border-l-[3px] transition ${
                  active
                    ? "border-[#ef4269] bg-[linear-gradient(110deg,#ffe9ed,#fff7f5)]"
                      : "border-transparent hover:bg-white/70"
                }`}
              >
                <Link
                  href={`/chat/${s.id}`}
                  aria-current={active ? "page" : undefined}
                  className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-3 pr-1"
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      active ? "bg-white text-[#e44568]" : "bg-white/80 text-[#5b7798]"
                    }`}
                  >
                    <MessagesSquare className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-medium text-[#2c4562]">
                      {title}
                    </span>
                    <time className="mt-1 flex items-center gap-1 font-data text-[9px] text-[#859ab0]">
                      <Clock3 className="h-3 w-3" />
                      {new Date(s.startedAt).toLocaleString(undefined, {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                  </span>
                </Link>
                <div className="mr-2 flex shrink-0 items-center gap-0.5 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                  <button
                    type="button"
                    onClick={() => handleRename(s.id, title)}
                    disabled={busy}
                    aria-label={`Rename ${title}`}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-[#d84365] hover:bg-white disabled:opacity-50"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(s.id, title)}
                    disabled={busy}
                    aria-label={`Delete ${title}`}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-[#d84365] hover:bg-white disabled:opacity-50"
                  >
                    {busy ? <MoreHorizontal className="h-4 w-4" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-4 flex items-center gap-2 rounded-2xl border border-white/80 bg-white/70 px-3 py-3 text-[10px] leading-4 text-[#70869d]">
        <Clock3 className="h-4 w-4 shrink-0 text-[#587da4]" />
        Your nutrition chats are saved here for easy access.
      </div>
    </aside>
  );
}