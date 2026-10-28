import { listMenusAction } from "@/lib/actions/restaurant-menu";
import { RestaurantMenuView } from "@/components/RestaurantMenuView";
import { UtensilsCrossed } from "lucide-react";

export default async function RestaurantMenuPage() {
  const menus = await listMenusAction();

  return (
    <div className="relative mx-auto -mt-6 max-w-7xl overflow-visible pb-16 text-graphite">
      <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 bottom-0 top-[72px] z-0 overflow-hidden">
        <div className="menu-page-background absolute inset-0" />
        <div className="absolute left-[max(1.5rem,calc((100vw-1320px)/2))] top-32 hidden h-40 w-40 rounded-full border border-[var(--menu-art)] lg:block">
          <div className="absolute inset-3 rounded-full border border-dashed border-[var(--menu-art)]" />
          <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--menu-art)] opacity-25" />
          <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--menu-art)]" />
        </div>
        <div className="absolute right-[max(2rem,calc((100vw-1320px)/2))] top-36 hidden h-44 w-32 rotate-6 rounded-[1.25rem] border border-[var(--menu-art)] bg-[var(--menu-paper)] p-4 shadow-[0_16px_34px_rgba(70,48,30,0.08)] lg:block">
          <div className="mx-auto h-1 w-12 rounded-full bg-[var(--menu-accent)] opacity-50" />
          <div className="mt-4 text-center font-display text-sm text-[var(--menu-accent)]">today&apos;s menu</div>
          <div className="mt-3 space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--menu-art)] pb-1"><span className="h-1 w-12 rounded bg-[var(--menu-art)]" /><span className="h-1 w-5 rounded bg-[var(--menu-accent)] opacity-50" /></div>
            <div className="flex items-center justify-between border-b border-[var(--menu-art)] pb-1"><span className="h-1 w-14 rounded bg-[var(--menu-art)]" /><span className="h-1 w-4 rounded bg-[var(--menu-accent)] opacity-50" /></div>
            <div className="flex items-center justify-between border-b border-[var(--menu-art)] pb-1"><span className="h-1 w-10 rounded bg-[var(--menu-art)]" /><span className="h-1 w-5 rounded bg-[var(--menu-accent)] opacity-50" /></div>
          </div>
          <div className="mx-auto mt-5 h-8 w-8 rounded-full border border-[var(--menu-art)]" />
        </div>
        <div className="absolute bottom-28 left-[28%] h-2.5 w-2.5 rounded-full bg-[var(--menu-accent)] opacity-35" />
        <div className="absolute right-[27%] top-[45%] h-3 w-3 rounded-full bg-[var(--menu-art)]" />
      </div>

      <div className="relative z-10 px-4 sm:px-6 lg:px-8">
        <header className="pb-7 pt-2 lg:pb-9">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--menu-border)] bg-[var(--menu-soft)] px-3 py-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--menu-accent)] shadow-[0_10px_20px_rgba(110,69,34,0.07)] backdrop-blur-sm">
            <UtensilsCrossed className="h-3.5 w-3.5" />
            Dining guide
          </div>
          <h1 className="font-display text-[2.8rem] leading-none tracking-[-0.07em] text-graphite sm:text-[3.2rem] lg:text-[3.8rem]">
            Explore a menu
          </h1>
          <p className="mt-3 max-w-2xl text-base text-graphite-70 sm:text-lg">
            Upload a restaurant menu to see dish details, estimated nutrition, and personalized picks.
          </p>
        </header>

        <RestaurantMenuView initialMenus={menus.content} />
      </div>
    </div>
  );
}