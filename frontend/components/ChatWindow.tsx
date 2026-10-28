"use client";

import { useActionState, useRef, useEffect } from "react";
import { Bot, Send, ShieldCheck, Sparkles } from "lucide-react";
import { sendMessageAction, type ActionState, type ChatMessageResponse } from "@/lib/actions/chat";

const initialState: ActionState = {};

export function ChatWindow({
  sessionId,
  messages,
}: {
  sessionId: number;
  messages: ChatMessageResponse[];
}) {
  const action = sendMessageAction.bind(null, sessionId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    if (!pending) formRef.current?.reset();
  }, [pending]);

  return (
    <main className="relative flex min-h-[calc(100vh-7.5rem)] flex-col overflow-hidden rounded-[28px] border border-white/75 bg-[linear-gradient(135deg,#c5d3e8_0%,#d0c5e2_56%,#e7cdc7_100%)] shadow-[0_22px_60px_rgba(70,76,126,0.16)]">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#a58cdb]/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-[#72b8d2]/25 blur-3xl" />
      <header className="relative flex items-center gap-3 border-b border-white/70 px-5 py-4 sm:px-7">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-[#526b9a]">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-lg font-semibold text-[#233957]">Your Nutrition Assistant</h1>
          <p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-[#8295a9]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#50b58b]" />
            Personalized nutrition guidance
          </p>
        </div>
        <Sparkles className="ml-auto h-4 w-4 text-[#d9a455]" />
      </header>

      <div className="relative flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-7 sm:py-7">
        {messages.length === 0 && (
          <div className="mx-auto mt-8 max-w-md rounded-3xl border border-white/80 bg-white/70 px-6 py-8 text-center shadow-sm backdrop-blur">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f1f3ff] text-[#6372aa]">
              <Bot className="h-6 w-6" />
            </div>
            <p className="mt-4 font-display text-xl font-semibold text-[#233957]">What can I help you with?</p>
            <p className="mt-2 text-sm leading-6 text-[#71869c]">
              Ask about food, nutrition, healthy eating, or your personal goals.
            </p>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={m.role === "USER" ? "text-right" : "text-left"}>
            <div
              className={`inline-block max-w-[85%] rounded-2xl px-4 py-3 text-left text-sm leading-6 shadow-sm ${
                m.role === "USER"
                  ? "rounded-br-sm bg-gradient-to-br from-[#ef416a] to-[#df315f] text-white"
                  : "rounded-bl-sm border border-white/80 bg-white/90 text-[#334a66] backdrop-blur"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {pending && (
          <div className="text-left">
            <div className="inline-block rounded-2xl rounded-bl-sm border border-white/80 bg-white/90 px-4 py-3 text-sm text-[#71869c]">
              Thinking…
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <form ref={formRef} action={formAction} className="relative m-4 flex items-center gap-2 rounded-full border border-white/90 bg-white/85 p-2 shadow-[0_8px_24px_rgba(81,90,149,0.12)] backdrop-blur-xl sm:m-6">
        <div className="ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eef2fb] text-[#506d92]">
          <Bot className="h-4 w-4" />
        </div>
        <input
          name="message"
          required
          placeholder="Ask about food, nutrition, or your goals..."
          disabled={pending}
          className="min-w-0 flex-1 border-0 bg-transparent px-2 py-2 text-sm text-[#263e59] outline-none placeholder:text-[#879bb1] focus:ring-0 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={pending}
          aria-label="Send message"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#fa456d] to-[#e62b61] text-white shadow-sm disabled:opacity-50"
        >
          {pending ? <span className="text-xs">…</span> : <Send className="h-4 w-4" />}
        </button>
      </form>

      {state.error && (
        <p role="alert" className="relative mx-4 mb-4 rounded-xl border border-[#f3cbd3] bg-[#fff3f5] px-4 py-2.5 text-sm text-[#a22a49] sm:mx-6">
          {state.error}
        </p>
      )}
      <div className="relative mb-5 flex items-center justify-center gap-2 px-4 text-center text-[10px] leading-4 text-[#8295a9]">
        <ShieldCheck className="h-4 w-4 shrink-0 text-[#557da5]" />
        Educational guidance only — not a substitute for professional medical advice.
      </div>
    </main>
  );
}