"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import {
  Info,
  Lightbulb,
  Link2,
  ChevronRight,
  ListFilter,
  Minus,
  Plus,
  ShoppingBasket,
  Trash2,
} from "lucide-react";
import {
  addRawItemAction,
  clearListAction,
  removeItemAction,
  updateQuantityAction,
  type ActionState,
  type GroceryCartResponse,
} from "@/lib/actions/grocery";

const initialState: ActionState = {};

export function GroceryCartView({ initialCart }: { initialCart: GroceryCartResponse }) {
  const [cart, setCart] = useState(initialCart);
  const [state, formAction, pending] = useActionState(addRawItemAction, initialState);
  const [busyItemId, setBusyItemId] = useState<number | null>(null);

  useEffect(() => {
    setCart(initialCart);
  }, [initialCart]);

  async function handleQuantityChange(itemId: number, delta: number) {
    const item = cart.items.find((i) => i.id === itemId);
    if (!item) return;
    const next = item.quantity + delta;
    if (next < 1) return;

    setBusyItemId(itemId);
    try {
      const updated = await updateQuantityAction(itemId, next);
      setCart(updated);
    } finally {
      setBusyItemId(null);
    }
  }

  async function handleRemove(itemId: number) {
    setBusyItemId(itemId);
    try {
      const updated = await removeItemAction(itemId);
      setCart(updated);
    } finally {
      setBusyItemId(null);
    }
  }

  async function handleClear() {
    if (!window.confirm("Clear your entire grocery list? This can't be undone.")) return;
    const updated = await clearListAction();
    setCart(updated);
  }

  return (
    <div className="space-y-6">
      <form action={formAction} className="flex flex-wrap items-center gap-3 rounded-[28px] border border-hairline bg-card/80 p-3 shadow-[0_18px_32px_rgba(28,34,28,0.06)] backdrop-blur-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#dfe9dd] text-[#1f6a5a] shadow-inner shadow-white/70">
          <ShoppingBasket className="h-5 w-5" strokeWidth={2.2} />
        </div>

        <input
          name="rawItemName"
          placeholder="Add an item, e.g. Milk"
          required
          className="h-12 min-w-[220px] flex-1 rounded-[14px] border border-hairline bg-linen/70 px-4 text-[1.02rem] text-graphite placeholder:text-graphite/45 focus:border-[#7eb7a7] focus:outline-none"
        />

        <input
          name="quantity"
          type="number"
          min={1}
          defaultValue={1}
          aria-label="Quantity"
          className="h-12 w-16 rounded-[14px] border border-hairline bg-linen/70 px-2 text-center text-[1rem] text-graphite outline-none focus:border-[#7eb7a7]"
        />

        <select
          name="unit"
          defaultValue="pack"
          aria-label="Unit"
          className="h-12 min-w-[118px] rounded-[14px] border border-hairline bg-linen/70 px-3 text-[0.98rem] text-graphite outline-none focus:border-[#7eb7a7]"
        >
          <option value="pack">pack</option>
          <option value="pcs">pcs</option>
          <option value="dozen">dozen</option>
          <option value="g">g</option>
          <option value="kg">kg</option>
          <option value="ml">ml</option>
          <option value="L">L</option>
        </select>

        <button
          type="submit"
          disabled={pending}
          className="flex h-12 items-center justify-center gap-2 rounded-[14px] bg-[#1d9b8d] px-5 text-[1rem] font-medium text-white shadow-[0_8px_18px_rgba(29,155,141,0.25)] transition hover:bg-[#188a7e] disabled:opacity-50"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          {pending ? "Adding..." : "Add item"}
        </button>
      </form>

      {state.error && (
        <p className="rounded-2xl border border-[#e08a93] bg-[#fce9ec] px-3 py-2 text-sm text-[#a13d4f]">{state.error}</p>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex items-center justify-between rounded-[24px] border border-hairline bg-[var(--grocery-card-sage)] p-4 shadow-[0_12px_22px_rgba(28,34,28,0.03)]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[var(--grocery-icon-sage-bg)] text-[var(--grocery-icon-sage)]">
              <ListFilter className="h-5 w-5" strokeWidth={2.1} />
            </div>
            <div>
              <div className="text-[1.05rem] font-medium text-graphite">{cart.items.length} item{cart.items.length === 1 ? "" : "s"}</div>
              <div className="text-sm text-graphite/70">in your grocery list</div>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-graphite/55" aria-hidden="true" />
        </div>

        <div className="flex items-center justify-between rounded-[24px] border border-hairline bg-[var(--grocery-card-mint)] p-4 shadow-[0_12px_22px_rgba(28,34,28,0.03)]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[var(--grocery-icon-sage-bg)] text-[var(--grocery-icon-sage)]">
              <Link2 className="h-5 w-5" strokeWidth={2.1} />
            </div>
            <div>
              <div className="text-[1.05rem] font-medium text-graphite">{cart.items.filter((item) => item.productId).length} linked products</div>
              <div className="text-sm text-graphite/70">connected to community data</div>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-graphite/55" aria-hidden="true" />
        </div>

        <div className="flex items-center justify-between rounded-[24px] border border-hairline bg-[var(--grocery-card-warm)] p-4 shadow-[0_12px_22px_rgba(28,34,28,0.03)]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[var(--grocery-icon-warm-bg)] text-[var(--grocery-icon-warm)]">
              <Info className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <div>
              <div className="text-[1.05rem] font-medium text-graphite">
                {cart.cartHealthScore != null ? `Cart health score: ${cart.cartHealthScore}/100` : "Not enough rated products to score yet"}
              </div>
              <div className="text-sm text-graphite/70">
                {cart.analyzedItemCount > 0
                  ? `Based on the community health rating of ${cart.analyzedItemCount} linked item${cart.analyzedItemCount === 1 ? "" : "s"}.`
                  : "Items added by name only aren't included in the score yet."}
              </div>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-graphite/55" aria-hidden="true" />
        </div>
      </div>

      {cart.items.length === 0 ? (
        <div className="rounded-[26px] border border-hairline bg-card/80 p-8 text-center text-graphite/70 shadow-[0_18px_30px_rgba(28,34,28,0.04)]">
          Your list is empty. Add items above, or use the &ldquo;Add to grocery list&rdquo; button on any product page.
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.8fr)_minmax(280px,0.82fr)]">
          <section className="rounded-[26px] border border-hairline bg-card/80 p-3 shadow-[0_18px_30px_rgba(28,34,28,0.04)] backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-hairline px-3 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#dfe9dd] text-[#1f6a5a]">
                  <ShoppingBasket className="h-5 w-5" strokeWidth={2.1} />
                </div>
                <h2 className="font-display text-[2rem] leading-none tracking-[-0.06em] text-graphite">Your Grocery List</h2>
              </div>

              <button
                type="button"
                onClick={handleClear}
                className="flex items-center gap-2 rounded-full border border-hairline bg-linen/70 px-3 py-2 text-sm text-graphite/80 transition hover:bg-linen"
              >
                <Trash2 className="h-4 w-4" strokeWidth={2.1} />
                Clear entire list
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {cart.items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-[18px] border border-hairline bg-linen/65 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    {item.productId ? (
                      <Link href={`/products/${item.productId}`} className="inline-block max-w-full truncate font-medium text-[1.06rem] text-graphite transition hover:text-garnet hover:underline">
                        {item.productName ?? item.rawItemName}
                      </Link>
                    ) : (
                      <p className="font-medium text-[1.06rem] text-graphite">{item.rawItemName}</p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                    <div className="flex items-center overflow-hidden rounded-[12px] border border-hairline bg-card/80">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(item.id, -1)}
                        disabled={busyItemId === item.id || item.quantity <= 1}
                        className="flex h-9 w-9 items-center justify-center text-xl text-graphite/75 hover:bg-linen disabled:opacity-40"
                        aria-label={`Decrease quantity of ${item.rawItemName}`}
                      >
                        <Minus className="h-4 w-4" strokeWidth={2.4} />
                      </button>
                      <span className="min-w-[3.2rem] text-center font-data text-sm text-graphite">
                        {item.quantity} {item.unit}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(item.id, 1)}
                        disabled={busyItemId === item.id}
                        className="flex h-9 w-9 items-center justify-center text-xl text-graphite/75 hover:bg-linen disabled:opacity-40"
                        aria-label={`Increase quantity of ${item.rawItemName}`}
                      >
                        <Plus className="h-4 w-4" strokeWidth={2.4} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      disabled={busyItemId === item.id}
                      className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#ebbac0] bg-[#fce9ed] text-[#be304d] hover:bg-[#f7dfe6] disabled:opacity-50"
                      aria-label={`Remove ${item.rawItemName}`}
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={2.2} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-[24px] border border-hairline bg-[var(--grocery-card-sage)] p-4 shadow-[0_12px_22px_rgba(28,34,28,0.03)]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[var(--grocery-icon-sage-bg)] text-[var(--grocery-icon-sage)]">
                  <ListFilter className="h-5 w-5" strokeWidth={2.1} />
                </div>
                <h3 className="font-display text-[1.8rem] leading-none tracking-[-0.05em] text-graphite">List overview</h3>
              </div>
              <div className="mt-4 space-y-3 text-graphite">
                <div className="text-[1.08rem] font-medium">{cart.items.length} item{cart.items.length === 1 ? "" : "s"}</div>
                <p className="text-sm leading-5 text-graphite/75">
                  Link your rated products to calculate the community health score and get personalized insights.
                </p>
              </div>
            </div>

            <div className="rounded-[24px] border border-hairline bg-[var(--grocery-card-warm)] p-4 shadow-[0_12px_22px_rgba(28,34,28,0.03)]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[var(--grocery-icon-warm-bg)] text-[var(--grocery-icon-warm)]">
                  <Lightbulb className="h-5 w-5" strokeWidth={2.1} />
                </div>
                <h3 className="font-display text-[1.8rem] leading-none tracking-[-0.05em] text-graphite">Quick tip</h3>
              </div>
              <p className="mt-4 text-[1rem] leading-6 text-graphite/80">
                Always review the ingredients list and check product ratings before buying. Choose whole foods and minimally processed options for better nutrition.
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
