"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Apple,
  ArrowRight,
  Bot,
  Dumbbell,
  FileText,
  Heart,
  Leaf,
  Salad,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { createSession, sendMessageToSession } from "@/lib/actions/chat";

const suggestions = [
  {
    icon: Apple,
    prompt: "Can I eat bananas if I have diabetes?",
    color: "text-[#d84d67]",
    surface: "bg-[#ffeaeb]",
    border: "border-[#f4cbd2]",
  },
  {
    icon: FileText,
    prompt: "Help me understand a nutrition label",
    color: "text-[#367fbd]",
    surface: "bg-[#e6f3ff]",
    border: "border-[#c9e4fb]",
  },
  {
    icon: Salad,
    prompt: "Suggest a balanced breakfast",
    color: "text-[#43885e]",
    surface: "bg-[#e8f6e9]",
    border: "border-[#cce8ce]",
  },
  {
    icon: Dumbbell,
    prompt: "How can I increase my protein?",
    color: "text-[#7957c2]",
    surface: "bg-[#f0eaff]",
    border: "border-[#ded1f7]",
  },
];

export function ChatLanding() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startConversation(prompt: string) {
    setPending(true);
    setError(null);

    try {
      const session = await createSession();
      await sendMessageToSession(session.id, prompt);
      router.push(`/chat/${session.id}`);
    } catch {
      setError("We couldn't start your conversation. Please try again.");
      setPending(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const prompt = message.trim();
    if (!prompt || pending) return;
    void startConversation(prompt);
  }

  return (
    <main className="relative min-h-[calc(100vh-9rem)] overflow-hidden rounded-[28px] border border-white/70 bg-[linear-gradient(130deg,#c5d3e8_0%,#d0c5e2_48%,#e7cdc7_100%)] p-5 shadow-[0_22px_60px_rgba(70,76,126,0.16)] sm:p-7 lg:p-9">
      <div className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-[#a58cdb]/35 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-36 -left-28 h-80 w-80 rounded-full bg-[#72b8d2]/35 blur-3xl" />
      <div className="pointer-events-none absolute left-[42%] top-[28%] h-64 w-64 rounded-full bg-[#e99baa]/25 blur-3xl" />

      <section className="relative grid items-center gap-3 md:min-h-[245px] md:grid-cols-[1fr_1fr] lg:gap-6">
        <div className="relative z-10 max-w-xl py-5 sm:py-7">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#f2ccd8] bg-white/75 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c44167]">
            <Sparkles className="h-3.5 w-3.5" />
            Nutrition AI
          </span>
          <h1 className="mt-4 max-w-lg font-display text-4xl leading-[1.03] tracking-[-0.055em] text-[#233957] sm:text-5xl lg:text-[3.35rem]">
            Your Nutrition Assistant
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-6 text-[#566d88] sm:text-base sm:leading-7">
            Ask questions about nutrition, healthy eating, food choices and more. Get personalized,
            science-backed guidance — made simple.
          </p>
        </div>

        <div className="relative mx-auto flex h-[230px] w-full max-w-[490px] items-center justify-center md:h-[290px]">
          <div className="absolute left-1/2 top-1/2 h-[210px] w-[210px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,#c8b9ee_0%,#ded5f4_45%,rgba(255,255,255,0)_72%)] md:h-[275px] md:w-[275px]" />
          <div className="absolute left-1/2 top-1/2 h-[170px] w-[250px] -translate-x-1/2 -translate-y-1/2 rotate-[-12deg] rounded-[48%] border border-white/80 bg-white/25 md:h-[205px] md:w-[315px]" />

          <div className="absolute left-[8%] top-[18%] z-10 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#fae4d8] bg-white/90 text-[#e98358] shadow-[0_10px_28px_rgba(119,91,100,0.14)] md:left-[6%] md:top-[22%]">
            <Apple className="h-6 w-6" />
          </div>
          <div className="absolute right-[4%] top-[17%] z-10 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#dcecff] bg-white/90 text-[#579be0] shadow-[0_10px_28px_rgba(83,104,149,0.14)] md:right-[6%] md:top-[16%]">
            <Activity className="h-6 w-6" />
          </div>
          <div className="absolute bottom-[11%] right-[13%] z-10 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#f5dbe6] bg-white/90 text-[#ec5577] shadow-[0_10px_28px_rgba(119,91,100,0.14)] md:bottom-[11%] md:right-[11%]">
            <Heart className="h-6 w-6" />
          </div>

          <div className="relative z-10 flex h-36 w-32 flex-col items-center justify-center rounded-[34px] border border-white bg-[linear-gradient(150deg,#ffffff,#f4f1ff)] shadow-[0_22px_50px_rgba(69,70,128,0.2)] md:h-44 md:w-40">
            <div className="absolute -top-4 h-7 w-1.5 rounded-full bg-[#c3b4ef]" />
            <div className="absolute -top-6 h-3 w-3 rounded-full bg-[#9c88e2] shadow-[0_0_12px_rgba(156,136,226,0.7)]" />
            <div className="flex h-16 w-24 items-center justify-center gap-5 rounded-[23px] bg-[linear-gradient(145deg,#2c365b,#4d5680)] shadow-inner md:h-[74px] md:w-28">
              <span className="h-2.5 w-2.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.75)]" />
              <span className="h-2.5 w-2.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.75)]" />
            </div>
            <div className="mt-3 flex items-center gap-2 text-[#59a78c]">
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
            </div>
            <div className="absolute -bottom-5 flex h-11 w-16 items-center justify-center rounded-b-[24px] rounded-t-xl border border-white bg-[linear-gradient(145deg,#c9eedb,#eff9f0)] text-[#529978] shadow-md">
              <Leaf className="h-5 w-5" />
            </div>
          </div>
          <div className="absolute bottom-[1%] left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-2xl border border-white/90 bg-white/90 px-4 py-2 text-xl shadow-[0_12px_30px_rgba(119,91,100,0.15)] md:bottom-[2%]">
            🍓 🫐 🥝 🍊
          </div>
          <div className="absolute bottom-[12%] left-[6%] hidden items-center gap-2 rounded-xl border border-[#e1efe2] bg-white/95 px-3 py-2 text-[10px] font-medium text-[#4e7b62] shadow-md sm:flex md:left-[7%]">
            <Leaf className="h-4 w-4" />
            Better choices
          </div>
          <div className="absolute right-[2%] bottom-[36%] hidden items-center gap-2 rounded-xl border border-[#e8e1fb] bg-white/95 px-3 py-2 text-[10px] font-medium text-[#7764b5] shadow-md sm:flex">
            <Sparkles className="h-4 w-4" />
            Personal guidance
          </div>
        </div>
      </section>

      <form
        onSubmit={handleSubmit}
        className="relative mt-3 flex min-h-[64px] items-center gap-3 rounded-full border border-white/90 bg-white/85 p-2 shadow-[0_10px_30px_rgba(81,90,149,0.16)] backdrop-blur-xl sm:mt-1 sm:min-h-[72px] sm:p-2.5"
      >
        <div className="ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eef2fb] text-[#506d92] sm:ml-2 sm:h-11 sm:w-11">
          <Bot className="h-5 w-5" />
        </div>
        <input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          aria-label="Ask the nutrition assistant"
          placeholder="Ask about food, nutrition, or your goals..."
          disabled={pending}
          className="min-w-0 flex-1 border-0 bg-transparent px-1 text-sm text-[#263e59] outline-none placeholder:text-[#879bb1] focus:ring-0 disabled:opacity-60 sm:text-base"
        />
        <button
          type="submit"
          aria-label="Send question"
          disabled={pending || !message.trim()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#fa456d] to-[#e62b61] text-white shadow-[0_6px_16px_rgba(231,49,99,0.25)] transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-45 sm:mr-1 sm:h-12 sm:w-12"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>

      {error && (
        <p role="alert" className="relative mt-3 rounded-xl border border-[#f3cbd3] bg-[#fff3f5] px-4 py-2.5 text-sm text-[#a22a49]">
          {error}
        </p>
      )}

      <section className="relative mt-7 sm:mt-8">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="font-display text-xl font-semibold tracking-[-0.03em] text-[#233957] sm:text-2xl">
            Try asking...
          </h2>
          <Sparkles className="h-4 w-4 text-[#e7a64d]" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {suggestions.map(({ icon: Icon, prompt, color, surface, border }) => (
            <button
              key={prompt}
              type="button"
              onClick={() => void startConversation(prompt)}
              disabled={pending}
              className={`group flex min-h-[112px] items-center gap-3 rounded-2xl border ${border} bg-gradient-to-br from-white/95 to-white/75 p-4 text-left shadow-[0_8px_24px_rgba(81,90,149,0.08)] transition hover:-translate-y-0.5 hover:from-white hover:to-white/90 hover:shadow-[0_12px_30px_rgba(81,90,149,0.16)] disabled:cursor-wait disabled:opacity-60`}
            >
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${surface} ${color}`}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1 text-xs font-medium leading-5 text-[#334a66] sm:text-[13px]">
                {prompt}
              </span>
              <ArrowRight className={`h-4 w-4 shrink-0 ${color} transition-transform group-hover:translate-x-1`} />
            </button>
          ))}
        </div>
      </section>

      <div className="relative mx-auto mt-7 flex w-fit max-w-full items-center gap-2 rounded-full border border-white/80 bg-white/60 px-4 py-2 text-center text-[10px] leading-4 text-[#647e99] sm:mt-8 sm:text-[11px]">
        <ShieldCheck className="h-4 w-4 shrink-0 text-[#557da5]" />
        Our answers are educational and not a substitute for professional medical advice.
      </div>
    </main>
  );
}
