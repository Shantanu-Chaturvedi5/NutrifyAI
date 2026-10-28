import Link from "next/link";
import { ArrowUpRight, Leaf, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-linen text-graphite">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-sage-soft blur-3xl" />
        <div className="absolute -bottom-48 -right-36 h-[38rem] w-[38rem] rounded-full bg-saffron-soft blur-3xl" />
        <div className="absolute left-[46%] top-[35%] h-72 w-72 rounded-full bg-[color:var(--water-blue)] opacity-[0.07] blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-5 py-5 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-3" aria-label="NutrifyAI home">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sage-soft text-sage">
              <Leaf className="h-5 w-5" strokeWidth={2} />
            </span>
            <span className="font-display text-xl font-semibold tracking-tight text-graphite">
              Nutrify<span className="italic text-garnet">AI</span>
            </span>
          </Link>
          <ThemeToggle />
        </header>

        <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(400px,0.95fr)] lg:gap-16 lg:py-14">
          <section className="relative hidden min-h-[520px] flex-col justify-between overflow-hidden rounded-[2rem] border border-glass-border bg-glass-card p-10 shadow-[0_24px_70px_rgba(28,34,28,0.08)] backdrop-blur-xl lg:flex xl:p-14">
            <div className="absolute -right-14 -top-16 h-72 w-72 rounded-full border border-sage/20 bg-sage-soft/30" />
            <div className="absolute -bottom-24 -left-20 h-80 w-80 rounded-full border border-saffron/20 bg-saffron-soft/30" />
            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full border border-hairline bg-card/70 px-3 py-1.5 font-data text-[10px] uppercase tracking-[0.18em] text-sage">
                <Sparkles className="h-3.5 w-3.5" />
                A little more in tune
              </span>
              <h1 className="mt-8 max-w-lg font-display text-5xl leading-[1.08] tracking-[-0.06em] text-graphite xl:text-6xl">
                Make room for <span className="italic text-sage">healthier</span> everyday choices.
              </h1>
              <p className="mt-5 max-w-md text-base leading-7 text-graphite-70">
                Keep your nutrition insights, product scans, and personal plans together in one thoughtful space.
              </p>
            </div>
            <div className="relative flex items-end justify-between gap-6">
              <div>
                <p className="font-display text-2xl italic tracking-tight text-graphite">Small steps. Better feeling.</p>
                <p className="mt-2 font-data text-[10px] uppercase tracking-[0.15em] text-graphite-45">Your health, made clearer</p>
              </div>
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-hairline bg-card/70 text-sage">
                <ArrowUpRight className="h-5 w-5" />
              </span>
            </div>
            <svg className="pointer-events-none absolute bottom-28 right-20 h-36 w-36 text-sage/30" viewBox="0 0 120 120" fill="none" aria-hidden="true">
              <path d="M22 104C50 84 66 57 84 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M49 78C28 79 19 65 24 51C39 52 49 62 49 78Z" fill="currentColor" />
              <path d="M64 54C82 50 89 37 84 25C71 28 64 39 64 54Z" fill="currentColor" />
              <path d="M41 88C55 84 65 88 71 98C59 106 48 101 41 88Z" fill="currentColor" />
            </svg>
          </section>

          <section className="mx-auto w-full max-w-md">
            <div className="mb-6 text-center lg:hidden">
              <p className="font-data text-[10px] uppercase tracking-[0.18em] text-sage">A little more in tune</p>
            </div>
            {children}
            <p className="mt-6 text-center text-xs text-graphite-45">
              By continuing, you’re taking a step toward understanding your health better.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
