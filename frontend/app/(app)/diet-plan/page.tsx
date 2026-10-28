import { Heart, Leaf, Sparkles } from "lucide-react";
import { getActiveDietPlanAction } from "@/lib/actions/diet-plan";
import { DietPlanView } from "@/components/DietPlanView";

export default async function DietPlanPage() {
  const plan = await getActiveDietPlanAction();

  return (
    <div className="diet-plan-canvas relative isolate -my-6 w-screen overflow-hidden py-6">
      <LeafSprig className="diet-leaf-sprig--left-top" />
      <LeafSprig className="diet-leaf-sprig--right-upper diet-leaf-sprig--flipped" />
      <LeafSprig className="diet-leaf-sprig--left-middle" />
      <LeafSprig className="diet-leaf-sprig--right-middle diet-leaf-sprig--flipped" />
      <LeafSprig className="diet-leaf-sprig--left-lower" />
      <LeafSprig className="diet-leaf-sprig--right-bottom diet-leaf-sprig--flipped" />
      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
        <header className="relative grid min-h-[260px] items-center py-8 sm:min-h-[300px] sm:py-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="relative z-10 max-w-4xl px-4 sm:px-8 lg:px-10">
            <p className="w-fit rounded-full bg-sage-soft/70 px-3 py-1 font-data text-[10px] font-medium uppercase tracking-[0.16em] text-sage">
              Your nutrition, thoughtfully planned
            </p>
            <h1 className="mt-3 max-w-[720px] font-display text-4xl font-medium leading-[1.08] tracking-tight text-graphite sm:text-5xl lg:text-[3.65rem]">
              A little more <span className="italic text-sage">nourishment,</span> every day.
            </h1>
            <p className="mt-3 max-w-[560px] text-sm leading-6 text-graphite-70 sm:text-base">
              A flexible meal plan shaped around your daily nutrition targets. Find a rhythm that
              feels good, one meal at a time.
            </p>
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-xs font-medium text-graphite-70">
              <span className="inline-flex items-center gap-2"><Leaf className="h-4 w-4 text-sage" aria-hidden="true" />Balanced nutrition</span>
              <span className="inline-flex items-center gap-2"><Heart className="h-4 w-4 text-sage" aria-hidden="true" />Healthy choices</span>
              <span className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4 text-saffron" aria-hidden="true" />Better you</span>
            </div>
          </div>
        </header>
        <DietPlanView initialPlan={plan} />
      </div>
    </div>
  );
}

function LeafSprig({ className }: { className: string }) {
  return (
    <div aria-hidden="true" className={`diet-leaf-sprig ${className}`}>
      {Array.from({ length: 7 }, (_, index) => (
        <span key={index} className="diet-leaf" />
      ))}
    </div>
  );
}