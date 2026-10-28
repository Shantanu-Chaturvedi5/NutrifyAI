import Link from "next/link";
import { logoutAction } from "@/lib/actions/auth";
import { getUnreadCount } from "@/lib/actions/notifications";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Brand } from "@/components/Brand";
import type { UserResponse } from "@/lib/types";

import { NavLinks } from "@/components/NavLinks";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/profile", label: "Profile" },
  { href: "/reports", label: "Reports" },
  { href: "/products", label: "Products" },
  { href: "/chat", label: "Chat" },
];

export async function Nav({ user }: { user: UserResponse | null }) {
  const unreadCount = user ? await getUnreadCount() : 0;

  return (
    <header className="sticky top-0 z-50 border-b border-glass-border bg-[var(--nav-glass)] backdrop-blur-xl shadow-[0_8px_24px_rgba(28,34,28,0.08)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:px-6 sm:py-3.5 lg:gap-0">
        <Brand href={user ? "/dashboard" : "/"} />

        <div className="ml-auto shrink-0 lg:ml-0">
          <NavLinks links={LINKS} userName={user?.fullName ?? null} />
        </div>

        {user ? (
          <div className="flex shrink-0 items-center gap-2 text-sm sm:gap-3.5">
            <ThemeToggle />
            <Link
              href="/notifications"
              className="relative flex h-8 w-8 items-center justify-center rounded-full border border-hairline bg-saffron/25 text-saffron transition-colors hover:bg-saffron/20"
              aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
            >
              <span className="text-xs">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-garnet px-1 font-data text-[9.5px] font-bold text-white shadow-xs">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
            <span className="hidden max-w-40 truncate font-medium text-graphite lg:inline">{user.fullName}</span>
            <form action={logoutAction} className="hidden lg:block">
              <button type="submit" className="text-xs font-medium text-graphite-70 transition-colors hover:text-garnet">
                Log out
              </button>
            </form>
          </div>
        ) : (
          <div className="flex shrink-0 items-center gap-2 text-sm sm:gap-3">
            <ThemeToggle />
            <div className="hidden items-center gap-3 lg:flex">
              <Link href="/login" className="font-medium text-graphite-70 transition-colors hover:text-graphite">
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-graphite px-4 py-2 text-[13.5px] font-medium text-linen transition-colors hover:bg-garnet"
              >
                Register
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}