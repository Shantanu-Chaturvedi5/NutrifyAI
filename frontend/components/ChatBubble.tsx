"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import { usePathname } from "next/navigation";
import { Apple, Sparkles, X, Send } from "lucide-react";
import {
  createSession,
  sendMessageToSession,
  type ChatMessageResponse,
} from "@/lib/actions/chat";

export function ChatBubble() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (pathname === "/chat" || pathname?.startsWith("/chat/")) return null;

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || pending) return;

    setPending(true);
    setError(null);
    setInput("");

    setMessages((prev) => [
      ...prev,
      { id: Date.now(), role: "USER", content: text, createdAt: new Date().toISOString() },
    ]);

    try {
      let sid = sessionId;
      if (!sid) {
        const session = await createSession();
        sid = session.id;
        setSessionId(sid);
      }
      const updated = await sendMessageToSession(sid, text);
      setMessages(updated);
    } catch {
      setError("The assistant didn't respond — is the AI service running?");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[28rem] w-80 flex-col overflow-hidden rounded-[28px] border border-hairline bg-card text-graphite shadow-2xl shadow-garnet/25 ring-1 ring-saffron/10">
          <div className="h-1 w-full bg-gradient-to-r from-sage via-saffron to-garnet" />

          <div className="flex items-center justify-between px-4 py-3">
            <span className="font-display text-sm font-semibold uppercase tracking-tight text-graphite">
              Nutrition assistant
            </span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="rounded-full p-1 text-graphite-70 hover:bg-linen-deep hover:text-graphite"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-2">
            {messages.length === 0 && (
              <p className="text-sm text-graphite-70">Ask anything nutrition-related.</p>
            )}
            {messages.map((m) => (
              <div key={m.id} className={m.role === "USER" ? "text-right" : "text-left"}>
                <div
                  className={`inline-block max-w-[85%] px-3.5 py-2 text-sm shadow-sm ${
                    m.role === "USER"
                      ? "rounded-2xl rounded-br-sm bg-garnet text-white"
                      : "rounded-2xl rounded-bl-sm border border-hairline bg-linen-deep text-graphite"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {pending && (
              <div className="text-left">
                <div className="inline-block rounded-2xl rounded-bl-sm border border-hairline bg-linen-deep px-3.5 py-2 text-sm text-graphite-70">
                  Thinking…
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSend} className="flex gap-2 border-t border-hairline p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a nutrition question…"
              disabled={pending}
              className="flex-1 rounded-full border border-hairline bg-linen px-4 py-2 text-sm text-graphite placeholder:text-graphite-45 focus:outline-none focus:ring-2 focus:ring-garnet/40 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={pending}
              aria-label="Send message"
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-garnet text-white shadow-sm shadow-garnet/40 transition-transform hover:scale-105 hover:bg-garnet/90 disabled:opacity-50"
            >
              <Send className="h-4 w-4" strokeWidth={2} />
            </button>
          </form>

          {error && (
            <p className="border-t border-hairline bg-garnet-soft px-4 py-2 text-xs text-garnet">
              {error}
            </p>
          )}
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Chat with AI nutrition assistant"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-garnet shadow-lg shadow-garnet/40 ring-4 ring-garnet/10 transition-transform hover:scale-105 hover:shadow-xl hover:shadow-garnet/50"
      >
        {open ? (
          <X className="h-6 w-6 text-white" strokeWidth={2} />
        ) : (
          <>
            <Apple className="h-6 w-6 text-white" strokeWidth={2} />
            <Sparkles className="absolute -top-1 -right-1 h-3.5 w-3.5 text-saffron" strokeWidth={2} />
          </>
        )}
      </button>
    </>
  );
}