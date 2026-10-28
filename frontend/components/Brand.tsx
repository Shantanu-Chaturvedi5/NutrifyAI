import Link from "next/link";

type BrandProps = {
  href: string;
};

export function Brand({ href }: BrandProps) {
  return (
    <Link
      href={href}
      className="inline-flex min-w-0 items-center gap-3 text-graphite"
      aria-label="Nouriq home"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sage to-emerald-800 shadow-[0_5px_14px_rgba(20,146,100,0.22)]">
        <svg viewBox="0 0 48 48" className="h-7 w-7" fill="none" aria-hidden="true">
          <path
            d="M24 35V23"
            stroke="white"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d="M24 25C16 25 12 20 13 13C20 12 25 16 24 25Z"
            fill="white"
            fillOpacity=".96"
          />
          <path
            d="M24 22C24 14 29 10 36 11C37 18 32 23 24 22Z"
            fill="#BCEBD2"
          />
          <path
            d="M10 31H18L21 26L25 36L29 29L32 31H38"
            stroke="#F5C45E"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="font-display text-xl font-semibold leading-none tracking-tight">
          Nouri<span className="text-sage">q</span>
        </span>
        <span className="mt-1 hidden font-data text-[8px] font-medium uppercase tracking-[0.16em] text-graphite-70 sm:block">
          Personal nutrition IQ
        </span>
      </span>
    </Link>
  );
}
