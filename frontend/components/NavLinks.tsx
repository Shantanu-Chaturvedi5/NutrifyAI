"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/actions/auth";
import { Menu, X } from "lucide-react";

export function NavLinks({
  links,
  userName,
}: {
  links: { href: string; label: string }[];
  userName: string | null;
}) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  function isActive(href: string) {
    return href === "/dashboard"
      ? pathname === "/dashboard" || pathname === "/"
      : pathname.startsWith(href);
  }

  return (
    <>
      <nav className="hidden items-center gap-2 text-[13.5px] lg:flex" aria-label="Main navigation">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`transition-all duration-200 ${
              isActive(link.href)
                ? "rounded-full border border-garnet/40 bg-garnet-soft px-4 py-1.5 font-medium text-garnet shadow-[0_2px_8px_rgba(28,34,28,0.06)]"
                : "px-3.5 py-1.5 text-graphite-70 hover:text-graphite"
            }`}
            aria-current={isActive(link.href) ? "page" : undefined}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="relative lg:hidden">
        <button
          type="button"
          aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isOpen}
          aria-controls="mobile-navigation"
          onClick={() => setIsOpen((open) => !open)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-hairline bg-glass-card text-graphite transition hover:bg-card"
        >
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
        {isOpen && (
          <div
            id="mobile-navigation"
            className="absolute right-0 top-full z-50 mt-3 w-72 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-glass-border bg-glass-card p-3 shadow-[0_18px_48px_rgba(28,34,28,0.16)] backdrop-blur-xl"
          >
            <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={`rounded-xl px-3.5 py-2.5 text-sm transition ${
                    isActive(link.href)
                      ? "bg-garnet-soft font-semibold text-garnet"
                      : "text-graphite-70 hover:bg-card hover:text-graphite"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-2 border-t border-hairline pt-2">
              {userName ? (
                <>
                  <p className="truncate px-3.5 py-2 text-xs font-medium text-graphite-70">{userName}</p>
                  <form action={logoutAction}>
                    <button
                      type="submit"
                      className="w-full rounded-xl px-3.5 py-2.5 text-left text-sm font-medium text-graphite-70 transition hover:bg-card hover:text-garnet"
                    >
                      Log out
                    </button>
                  </form>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="rounded-xl border border-hairline px-3 py-2.5 text-center text-sm font-medium text-graphite-70"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsOpen(false)}
                    className="rounded-xl bg-graphite px-3 py-2.5 text-center text-sm font-medium text-linen"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
