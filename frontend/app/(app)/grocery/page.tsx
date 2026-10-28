import { getCurrentCartAction } from "@/lib/actions/grocery";
import { GroceryCartView } from "@/components/GroceryCartView";

export default async function GroceryPage() {
  const cart = await getCurrentCartAction();

  return (
    <div className="relative mx-auto -mt-6 max-w-[1200px] overflow-visible pb-16 text-graphite">
      <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 bottom-0 top-[72px] z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(190,224,202,0.42),transparent_58%),radial-gradient(ellipse_at_0%_55%,rgba(225,239,222,0.7),transparent_30%),radial-gradient(ellipse_at_100%_72%,rgba(220,235,243,0.7),transparent_32%)] dark:bg-[radial-gradient(ellipse_at_50%_0%,rgba(37,89,67,0.35),transparent_58%),radial-gradient(ellipse_at_0%_55%,rgba(31,74,55,0.3),transparent_30%),radial-gradient(ellipse_at_100%_72%,rgba(35,68,77,0.28),transparent_32%)]" />

        <svg className="absolute -left-3 top-32 h-52 w-40 text-[#79a982]/50 dark:text-[#83c69a]/35 sm:left-4 sm:h-64 sm:w-48 lg:left-[max(1.5rem,calc((100vw-1320px)/2))]" viewBox="0 0 180 250" fill="none">
          <path d="M92 235C105 180 95 125 113 35" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <path d="M105 150C55 153 38 119 48 89C81 91 105 111 105 150Z" fill="currentColor" />
          <path d="M104 116C146 107 157 76 145 48C116 57 101 81 104 116Z" fill="currentColor" />
          <path d="M111 67C80 58 76 33 91 13C115 24 122 42 111 67Z" fill="currentColor" />
        </svg>

        <svg className="absolute -right-5 top-44 h-44 w-44 text-[#dfaa60]/50 dark:text-[#e5b878]/35 sm:right-6 sm:h-56 sm:w-56 lg:right-[max(1.5rem,calc((100vw-1320px)/2))]" viewBox="0 0 200 200" fill="none">
          <circle cx="100" cy="100" r="72" fill="currentColor" />
          <circle cx="100" cy="100" r="58" stroke="#fff9e9" strokeOpacity=".8" strokeWidth="3" />
          <circle cx="100" cy="100" r="10" fill="#fff9e9" fillOpacity=".85" />
          <path d="M100 42V88M100 112v46M42 100h46M112 100h46M59 59l32 32m18 18 32 32m0-82-32 32m-18 18-32 32" stroke="#fff9e9" strokeOpacity=".8" strokeWidth="3" strokeLinecap="round" />
        </svg>

        <svg className="absolute -left-5 bottom-12 h-48 w-44 text-[#8eb4a3]/45 dark:text-[#9bd1b8]/30 sm:left-8 sm:h-60 sm:w-56 lg:left-[max(1.5rem,calc((100vw-1320px)/2))]" viewBox="0 0 200 220" fill="none">
          <path d="M100 28C145 28 176 69 162 122C151 163 123 192 100 205C77 192 49 163 38 122C24 69 55 28 100 28Z" fill="currentColor" />
          <path d="M100 38C75 72 69 118 100 193C131 118 125 72 100 38Z" fill="#f3d9a8" fillOpacity=".8" />
          <ellipse cx="100" cy="119" rx="19" ry="28" fill="#9c6945" fillOpacity=".68" />
          <path d="M100 28C92 12 99 5 113 3C115 15 111 23 100 28Z" fill="#78a871" />
        </svg>

        <svg className="absolute -right-7 bottom-20 h-52 w-48 text-[#89b47c]/45 dark:text-[#9bcf91]/30 sm:right-5 sm:h-64 sm:w-60 lg:right-[max(1.5rem,calc((100vw-1320px)/2))]" viewBox="0 0 210 230" fill="currentColor">
          <path d="M102 211c-4-43-5-88 5-136" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
          <circle cx="74" cy="62" r="34" />
          <circle cx="119" cy="51" r="37" />
          <circle cx="151" cy="81" r="31" />
          <circle cx="86" cy="105" r="36" />
          <circle cx="130" cy="111" r="34" />
          <circle cx="56" cy="92" r="27" />
        </svg>

        <div className="absolute left-[22%] top-12 h-3 w-3 rounded-full bg-[#e6bd77]/50 dark:bg-[#e6bd77]/30" />
        <div className="absolute right-[24%] top-[42%] h-2 w-2 rounded-full bg-[#8eb4a3]/55 dark:bg-[#9bd1b8]/30" />
        <div className="absolute bottom-[28%] left-[28%] h-2.5 w-2.5 rounded-full bg-[#dfaa60]/45 dark:bg-[#e5b878]/30" />
      </div>

      <div className="relative z-10 px-4 sm:px-6 lg:px-8">
        <header className="pt-2 pb-6 lg:pb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-hairline bg-card/70 px-3 py-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-sage shadow-[0_10px_20px_rgba(20,50,38,0.06)] backdrop-blur-sm">
            <span className="inline-block h-2 w-2 rounded-full bg-sage" />
            Grocery planner
          </div>
          <h1 className="font-display text-[2.8rem] leading-none tracking-[-0.07em] text-graphite sm:text-[3.2rem] lg:text-[3.8rem]">
            Your Grocery List
          </h1>
          <p className="mt-3 max-w-2xl text-base text-graphite-70 sm:text-lg">
            Keep your essentials together, link the items back to product specs, and build a smarter shopping list.
          </p>
        </header>

        <GroceryCartView initialCart={cart} />
      </div>
    </div>
  );
}
