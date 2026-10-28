import { Nav } from "@/components/Nav";
import { authedFetchReadOnly } from "@/lib/backend";
import type { UserResponse } from "@/lib/types";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await authedFetchReadOnly<UserResponse>("/auth/me");

  return (
    // bg-linen text-graphite here (not just on individual migrated
    // pages) is what makes the background span the full page evenly
    // instead of showing as a boxed-in island of new color sitting on
    // the old background. Known trade-off: any page not yet migrated
    // to the new tokens still uses the old, non-theme-reactive
    // --color-ink for its text — in dark mode specifically, that text
    // stays a fixed dark charcoal against this now-dark background,
    // so it reads poorly until that page is migrated too. Safe in
    // light mode regardless (old dark text still reads fine on the
    // new pale background) — this only bites if a real user actually
    // switches to dark mode before every page is migrated.
    <div className="min-h-screen overflow-x-clip bg-linen text-graphite">
      <Nav user={user} />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">{children}</main>
    </div>
  );
}