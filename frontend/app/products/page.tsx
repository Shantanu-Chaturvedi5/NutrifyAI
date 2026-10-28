import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  Heart,
  Leaf,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { publicFetch } from "@/lib/backend";
import type { PagedResponse, ProductResponse } from "@/lib/types";

const PAGE_SIZE = 24;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}) {
  const { q, category, page } = await searchParams;
  const parsedPage = Number(page ?? 0);
  const pageNumber = Number.isInteger(parsedPage) && parsedPage >= 0 ? parsedPage : 0;

  const categories = await publicFetch<string[]>("/products/categories");
  const results = q
    ? await publicFetch<PagedResponse<ProductResponse>>(
        `/products/search?q=${encodeURIComponent(q)}&page=${pageNumber}&size=${PAGE_SIZE}`
      )
    : await publicFetch<PagedResponse<ProductResponse>>(
        `/products?${category ? `category=${encodeURIComponent(category)}&` : ""}page=${pageNumber}&size=${PAGE_SIZE}`
      );

  return (
    <div className="pb-12">
      <section className="relative isolate overflow-hidden rounded-b-[30px] bg-[linear-gradient(110deg,#202b43_0%,#302c49_55%,#49394d_100%)] px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
        <div className="pointer-events-none absolute -left-16 top-1/4 -z-10 h-64 w-64 rounded-full bg-[#386b70]/35 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-0 -z-10 h-72 w-72 rounded-full bg-[#76506b]/35 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-1/3 -z-10 h-56 w-56 rounded-full bg-[#5b6548]/25 blur-3xl" />

        <div className="grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="max-w-xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#c4e6d5]">
              <Leaf className="h-3.5 w-3.5" />
              Smart nutrition, better choices
            </div>
            <h1 className="max-w-[500px] font-display text-4xl leading-[1.02] tracking-[-0.055em] text-[#fffaf2] sm:text-5xl lg:text-[3.45rem]">
              Discover smarter food choices
            </h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-[#d0d5e2] sm:text-base">
              Find healthier alternatives, compare nutrition, and make informed decisions for a better you.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-[11px] font-medium text-[#eef0f6]">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2">
                <Leaf className="h-3.5 w-3.5 text-[#13825e]" />
                Track nutrition
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2">
                <ShieldCheck className="h-3.5 w-3.5 text-[#13825e]" />
                Make informed choices
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2">
                <Target className="h-3.5 w-3.5 text-[#13825e]" />
                Support your goals
              </span>
            </div>
          </div>

          <div className="relative lg:pr-4">
            <div className="absolute -right-6 -top-10 hidden h-36 w-36 rounded-full border border-white/70 bg-white/20 lg:block" />
            <form
              action="/products"
              className="relative flex items-center rounded-full border border-white/90 bg-white/85 p-1.5 shadow-[0_14px_36px_rgba(35,72,58,0.12)] backdrop-blur-sm"
            >
              <Search className="ml-3 h-4 w-4 shrink-0 text-[#58716b]" />
              <input
                name="q"
                defaultValue={q}
                aria-label="Search products"
                placeholder="Search products (e.g., chips, oats, milk...)"
                className="h-10 min-w-0 flex-1 border-0 bg-transparent px-3 text-xs text-[#243b35] outline-none placeholder:text-[#82938d] focus:ring-0 sm:text-sm"
              />
              <button
                type="submit"
                className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-garnet px-4 text-xs font-semibold text-white shadow-[0_6px_16px_rgba(217,31,66,0.25)] transition-colors hover:bg-garnet/90 sm:px-5 sm:text-sm"
              >
                Search
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <nav aria-label="Product categories" className="relative mt-4 flex flex-wrap gap-2">
              <Link
                href="/products"
                aria-current={!category && !q ? "page" : undefined}
                className={`rounded-full border px-3 py-1.5 text-[10px] font-medium transition-colors ${
                  !category && !q
                    ? "border-garnet bg-garnet text-white shadow-[0_5px_12px_rgba(217,31,66,0.18)]"
                    : "border-white/80 bg-white/60 text-[#36554c] hover:bg-white"
                }`}
              >
                All
              </Link>
              {categories.map((item) => (
                <Link
                  key={item}
                  href={`/products?category=${encodeURIComponent(item)}`}
                  aria-current={category === item ? "page" : undefined}
                  className={`rounded-full border px-3 py-1.5 text-[10px] font-medium transition-colors ${
                    category === item
                      ? "border-garnet bg-garnet text-white shadow-[0_5px_12px_rgba(217,31,66,0.18)]"
                      : "border-white/80 bg-white/60 text-[#36554c] hover:bg-white"
                  }`}
                >
                  {item}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_250px]">
        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-1">
            <p className="text-[11px] text-[#61756c]">
              {q ? (
                <>
                  Search results for <span className="font-semibold text-[#28463a]">&ldquo;{q}&rdquo;</span>
                  <span className="mx-2 text-[#a0aea3]">·</span>
                </>
              ) : null}
              Showing {results.content.length ? pageNumber * PAGE_SIZE + 1 : 0}–
              {pageNumber * PAGE_SIZE + results.content.length} of {results.totalElements} products
            </p>
          </div>

          {results.content.length === 0 ? (
            <div className="rounded-3xl border border-[#e5ebe3] bg-white/80 px-6 py-16 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#eaf4ed] text-[#1d7d59]">
                <Search className="h-5 w-5" />
              </div>
              <p className="mt-4 font-display text-xl text-[#1d342b]">
                {q ? `No products matched “${q}”.` : "No products in this category yet."}
              </p>
              <Link href="/products" className="mt-3 inline-block text-sm font-medium text-garnet hover:underline">
                Browse all products
              </Link>
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                {results.content.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              <div className="mt-6 flex items-center justify-center gap-2 text-xs">
                <Link
                  href={buildPageHref({ q, category, page: pageNumber - 1 })}
                  aria-disabled={pageNumber === 0}
                  className={`flex h-8 items-center justify-center rounded-lg border border-[#e4eae0] bg-white px-3 text-[#40584d] ${
                    pageNumber === 0 ? "pointer-events-none opacity-40" : "hover:bg-[#f1f6ef]"
                  }`}
                >
                  Previous
                </Link>
                <span className="rounded-lg bg-garnet px-3 py-2 font-semibold text-white">{results.page + 1}</span>
                <span className="px-1 text-[#84948a]">of {Math.max(1, results.totalPages)}</span>
                <Link
                  href={buildPageHref({ q, category, page: pageNumber + 1 })}
                  aria-disabled={results.last}
                  className={`flex h-8 items-center justify-center rounded-lg border border-[#e4eae0] bg-white px-3 text-[#40584d] ${
                    results.last ? "pointer-events-none opacity-40" : "hover:bg-[#f1f6ef]"
                  }`}
                >
                  Next
                </Link>
              </div>
            </>
          )}
        </div>

        <aside className="space-y-4">
          <div className="relative overflow-hidden rounded-[24px] border border-[#dcebe2] bg-[linear-gradient(145deg,#e6f4ed_0%,#f4f7e9_58%,#fff0e6_100%)] p-5">
            <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full border-[10px] border-white/30" />
            <div className="relative">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/75 text-[#15805c]">
                <Heart className="h-4 w-4" />
              </div>
              <h2 className="font-display text-[1.65rem] leading-tight tracking-[-0.045em] text-[#174e4a]">
                Why choose healthier options?
              </h2>
              <p className="mt-3 text-xs leading-5 text-[#526d64]">
                Small changes in your diet can support your energy, immunity, and overall well-being.
              </p>

              <div className="mt-5 space-y-4">
                <Benefit icon={Leaf} title="Better nutrition" text="Explore products and compare nutrition at a glance." />
                <Benefit icon={Target} title="Manage your goals" text="Find options that fit the goals you care about." />
                <Benefit icon={ClipboardList} title="Informed choices" text="Review product details before you decide." />
              </div>

              <Link
                href="/profile"
                className="mt-5 flex items-center justify-center gap-2 rounded-full bg-[#0d655d] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#0a554e]"
              >
                Explore your profile
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[24px] border border-[#dcebe2] bg-[linear-gradient(135deg,#e9f5ec,#f8f6ea)] p-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-[#15805c]">
              <Sparkles className="h-4 w-4" />
            </div>
            <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#618073]">
              Personalized for you
            </p>
            <h2 className="mt-1 font-display text-xl leading-tight tracking-[-0.035em] text-[#174e4a]">
              Nutrition insights
            </h2>
            <p className="mt-2 text-xs leading-5 text-[#526d64]">
              Add your health profile to get product recommendations tailored to your goals.
            </p>
            <Link href="/profile" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#0d655d] hover:underline">
              Complete your profile <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </aside>
      </section>
    </div>
  );
}

function ProductCard({ product }: { product: ProductResponse }) {
  const nutrition = product.nutrition;
  const nutritionTags = [
    nutrition?.proteinG != null ? `${nutrition.proteinG}g protein` : null,
    nutrition?.sugarG != null ? `${nutrition.sugarG}g sugar` : null,
    nutrition?.fiberG != null ? `${nutrition.fiberG}g fiber` : null,
  ].filter((tag): tag is string => tag !== null);

  return (
    <article className="group overflow-hidden rounded-[18px] border border-[#e5ebe4] bg-white/90 p-2.5 shadow-[0_8px_22px_rgba(30,54,38,0.045)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(30,54,38,0.1)]">
      <div className="relative overflow-hidden rounded-[14px] border border-[#edf1e9] bg-[radial-gradient(circle_at_50%_40%,#ffffff_0%,#f4f5e9_54%,#eaf2e9_100%)]">
        <div className="absolute left-2.5 top-2.5 z-10 rounded-full border border-white/80 bg-white/85 px-2.5 py-1 text-[9px] font-semibold text-[#3e6758] shadow-sm">
          {product.source === "USER_SCANNED" ? "Scanned" : product.category ?? "Product"}
        </div>
        <Link
          href={`/products/${product.id}`}
          aria-label={`View ${product.name}`}
          className="flex h-40 items-center justify-center p-3"
        >
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-28 w-24 rotate-[-3deg] flex-col items-center justify-center rounded-[18px] border border-white/70 bg-[linear-gradient(145deg,#d8e8c9,#f4e2ba)] px-2 text-center shadow-[0_12px_24px_rgba(48,72,44,0.12)]">
              <Leaf className="mb-2 h-5 w-5 text-[#4e8b65]" />
              <span className="line-clamp-2 text-[10px] font-semibold leading-tight text-[#385642]">
                {product.brand ?? product.name}
              </span>
            </div>
          )}
        </Link>
      </div>

      <Link href={`/products/${product.id}`} className="block px-1 pt-3">
        <h3 className="line-clamp-1 text-xs font-medium text-[#25463e]">{product.name}</h3>
        <p className="mt-1 line-clamp-1 text-[10px] text-[#75857b]">
          {product.category ?? "Uncategorized"}
          <span className="mx-1.5 text-[#c3cbc2]">·</span>
          {product.brand ?? "Unbranded"}
        </p>
        <div className="mt-2 flex items-center gap-1.5 border-t border-[#edf0e9] pt-2 text-[10px] text-[#61746a]">
          <Leaf className="h-3 w-3 text-[#32845c]" />
          <span>Nutrition details</span>
          {nutrition?.calories != null && (
            <>
              <span className="ml-auto font-data text-[9px] text-[#425a4e]">{nutrition.calories} kcal</span>
            </>
          )}
        </div>
        {nutritionTags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {nutritionTags.map((tag) => (
              <span key={tag} className="rounded-full border border-[#e7eee7] bg-[#f5f9f4] px-2 py-1 text-[9px] text-[#3d6958]">
                {tag}
              </span>
            ))}
          </div>
        )}
      </Link>
    </article>
  );
}

function Benefit({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Leaf;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/80 text-[#15805c]">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <h3 className="text-[11px] font-semibold text-[#24483e]">{title}</h3>
        <p className="mt-0.5 text-[10px] leading-4 text-[#60746a]">{text}</p>
      </div>
    </div>
  );
}

function buildPageHref({ q, category, page }: { q?: string; category?: string; page: number }) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (category) params.set("category", category);
  if (page > 0) params.set("page", String(page));
  const queryString = params.toString();
  return queryString ? `/products?${queryString}` : "/products";
}
