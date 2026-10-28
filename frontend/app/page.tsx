import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Leaf,
  ScanLine,
  Sparkles,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const highlights = [
  "Product scans, made clearer",
  "Guidance shaped around you",
  "Progress you can actually use",
];

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-linen text-graphite">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-48 -top-56 h-[36rem] w-[36rem] rounded-full bg-sage-soft blur-3xl" />
        <div className="absolute -bottom-64 -right-40 h-[42rem] w-[42rem] rounded-full bg-saffron-soft blur-3xl" />
        <div className="absolute right-[35%] top-[24%] h-64 w-64 rounded-full bg-[color:var(--water-blue)] opacity-[0.08] blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-5 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between py-5">
          <Link href="/" className="inline-flex items-center gap-3" aria-label="NutrifyAI home">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sage-soft text-sage">
              <Leaf className="h-5 w-5" strokeWidth={2} />
            </span>
            <span className="font-display text-xl font-semibold tracking-tight text-graphite">
              Nutrify<span className="italic text-garnet">AI</span>
            </span>
          </Link>
          <nav className="flex items-center gap-3 sm:gap-5" aria-label="Main navigation">
            <Link
              href="/login"
              className="rounded-full px-3 py-2 text-sm font-medium text-graphite-70 transition hover:text-graphite"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="hidden items-center gap-2 rounded-full bg-garnet px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(217,31,66,0.18)] transition hover:-translate-y-0.5 hover:brightness-95 sm:inline-flex"
            >
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
            <ThemeToggle />
          </nav>
        </header>

        <section className="grid flex-1 items-center gap-12 pb-14 pt-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-16">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-hairline bg-glass-card px-3.5 py-2 font-data text-[10px] uppercase tracking-[0.16em] text-sage shadow-sm backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              A little more in tune
            </span>
            <h1 className="mt-7 font-display text-5xl font-medium leading-[1.04] tracking-[-0.06em] text-graphite sm:text-6xl lg:text-7xl">
              Feel good about{" "}
              <span className="italic text-sage">what</span> you choose.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-graphite-70 sm:text-lg sm:leading-8">
              Make sense of what you eat with nutrition insights that fit your
              health, your habits, and your everyday life.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-garnet px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(217,31,66,0.2)] transition hover:-translate-y-0.5 hover:brightness-95"
              >
                Get started for free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-hairline bg-glass-card px-6 py-3 text-sm font-semibold text-graphite shadow-sm backdrop-blur transition hover:border-sage/40 hover:bg-card"
              >
                I already have an account <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            <ul className="mt-8 flex flex-col gap-3 text-sm text-graphite-70 sm:flex-row sm:flex-wrap sm:gap-x-6">
              {highlights.map((highlight) => (
                <li key={highlight} className="inline-flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sage-soft text-sage">
                    <Check className="h-3 w-3" strokeWidth={2.5} />
                  </span>
                  {highlight}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-[34rem] lg:ml-auto">
            <div aria-hidden="true" className="absolute -inset-5 rounded-[2.5rem] bg-sage-soft/60 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-glass-border bg-glass-card p-5 shadow-[0_28px_90px_rgba(28,34,28,0.13)] backdrop-blur-xl sm:p-7">
              <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full border border-sage/15 bg-sage-soft/20" />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="font-data text-[10px] uppercase tracking-[0.16em] text-graphite-45">
                    Your daily snapshot
                  </p>
                  <p className="mt-1 font-display text-2xl tracking-tight text-graphite">
                    A clearer picture
                  </p>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sage-soft text-sage">
                  <ScanLine className="h-5 w-5" />
                </span>
              </div>

              <div className="relative mt-6 rounded-3xl border border-hairline bg-card/80 p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-graphite">Nutrition balance</p>
                    <p className="mt-1 text-xs text-graphite-45">A simple read on your day</p>
                  </div>
                  <span className="rounded-full bg-sage-soft px-3 py-1.5 font-data text-[10px] uppercase tracking-wider text-sage">
                    Looking good
                  </span>
                </div>

                <div className="mt-6 flex items-center gap-5">
                  <div className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-[conic-gradient(var(--sage)_0deg,var(--sage)_252deg,var(--linen-deep)_252deg,var(--linen-deep)_360deg)] p-[7px]">
                    <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-card">
                      <span className="font-display text-3xl tracking-tight text-graphite">72</span>
                      <span className="font-data text-[9px] uppercase tracking-[0.14em] text-graphite-45">
                        in balance
                      </span>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 space-y-3">
                    <div>
                      <div className="mb-1.5 flex justify-between text-xs">
                        <span className="text-graphite-70">Whole foods</span>
                        <span className="font-data text-graphite">Good</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-linen-deep">
                        <div className="h-full w-[78%] rounded-full bg-sage" />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1.5 flex justify-between text-xs">
                        <span className="text-graphite-70">Added sugar</span>
                        <span className="font-data text-graphite">In range</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-linen-deep">
                        <div className="h-full w-[56%] rounded-full bg-saffron" />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1.5 flex justify-between text-xs">
                        <span className="text-graphite-70">Your goals</span>
                        <span className="font-data text-graphite">On track</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-linen-deep">
                        <div className="h-full w-[68%] rounded-full bg-garnet" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-hairline bg-glass-card-inner p-4">
                  <p className="font-data text-[9px] uppercase tracking-[0.14em] text-graphite-45">
                    Product scan
                  </p>
                  <p className="mt-2 font-display text-lg text-graphite">Know what’s inside</p>
                </div>
                <div className="rounded-2xl border border-hairline bg-glass-card-inner p-4">
                  <p className="font-data text-[9px] uppercase tracking-[0.14em] text-graphite-45">
                    Personal plan
                  </p>
                  <p className="mt-2 font-display text-lg text-graphite">Made for your goals</p>
                </div>
              </div>

              <p className="relative mt-5 text-center font-display text-lg italic text-graphite-70">
                Small steps. Better feeling.
              </p>
            </div>
          </div>
        </section>

        <footer className="border-t border-hairline py-5 text-center text-xs text-graphite-45">
          Your health, made clearer — one everyday choice at a time.
        </footer>
      </div>
    </main>
  );
}
