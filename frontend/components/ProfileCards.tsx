import type { HealthProfileResponse } from "@/lib/types";

function pretty(v: string | null | undefined): string {
  if (!v) return "—";
  const s = v.replace(/_/g, " ").toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function bmiWord(bmi: number | null): { text: string; tone: "sage" | "saffron" | "garnet" } | null {
  if (bmi === null) return null;
  if (bmi < 18.5) return { text: "Underweight", tone: "saffron" };
  if (bmi < 25) return { text: "Healthy", tone: "sage" };
  if (bmi < 30) return { text: "Overweight", tone: "saffron" };
  return { text: "High", tone: "garnet" };
}

function activityWord(a: string | null): string | null {
  if (!a) return null;
  if (a === "SEDENTARY" || a === "LIGHT") return "Low";
  if (a === "MODERATE") return "Medium";
  return "High";
}

const TONE = {
  sage: "bg-sage-soft text-sage",
  saffron: "bg-saffron-soft text-saffron",
  garnet: "bg-garnet-soft text-garnet",
  plain: "bg-hairline text-graphite-70",
} as const;

function Pill({ tone, children }: { tone: keyof typeof TONE; children: React.ReactNode }) {
  return <span className={`rounded-full px-3 py-0.5 text-[11px] font-semibold ${TONE[tone]}`}>{children}</span>;
}

function Tile({
  label, value, unit, pill, word,
}: {
  label: string; value: string; unit?: string; word?: boolean;
  pill?: { text: string; tone: keyof typeof TONE } | null;
}) {
  return (
    <div className="grid justify-items-start gap-2 rounded-2xl border border-hairline bg-linen p-3.5">
      <div className="text-xs font-semibold text-graphite-70">{label}</div>
      <div className={word ? "font-display text-2xl font-medium text-graphite" : "font-data text-2xl font-bold tracking-tight text-graphite"}>
        {value}
        {unit && <span className="ml-1 text-[13px] font-medium text-graphite-70">{unit}</span>}
      </div>
      {pill && <Pill tone={pill.tone}>{pill.text}</Pill>}
    </div>
  );
}

function CardHead({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-4">
      <h2 className="font-display text-[17px] font-bold text-graphite">{title}</h2>
      <p className="text-xs text-graphite-70">{subtitle}</p>
    </div>
  );
}

export function SnapshotCard({ profile, bmi }: { profile: HealthProfileResponse; bmi: number | null }) {
  const w = bmiWord(bmi);
  const act = activityWord(profile.activityLevel);
  return (
    <section className="rounded-2xl border border-hairline bg-card p-5">
      <CardHead title="Your health snapshot" subtitle="A quick overview of your key health metrics." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="BMI" value={bmi ? bmi.toFixed(1) : "—"} pill={w} />
        <Tile label="Weight" value={profile.weightKg ? String(profile.weightKg) : "—"} unit={profile.weightKg ? "kg" : undefined} pill={{ text: "Current", tone: "plain" }} />
        <Tile label="Height" value={profile.heightCm ? String(profile.heightCm) : "—"} unit={profile.heightCm ? "cm" : undefined} />
        <Tile label="Activity level" word value={pretty(profile.activityLevel)} pill={act ? { text: act, tone: "saffron" } : null} />
      </div>
    </section>
  );
}

export function PersonalInfoCard({ profile }: { profile: HealthProfileResponse }) {
  const rows: [string, string][] = [
    ["Age", profile.age != null ? String(profile.age) : "—"],
    ["Gender", pretty(profile.gender)],
    ["Weight", profile.weightKg ? `${profile.weightKg} kg` : "—"],
    ["Height", profile.heightCm ? `${profile.heightCm} cm` : "—"],
    ["Activity level", pretty(profile.activityLevel)],
    ["Dietary preference", pretty(profile.dietaryPreference)],
  ];
  return (
    <section className="rounded-2xl border border-hairline bg-card p-5">
      <CardHead title="Personal information" subtitle="Basic details about you." />
      <dl className="grid sm:grid-cols-2">
        {rows.map(([k, v], i) => (
          <div
            key={k}
            className={`border-b border-hairline px-1 py-3 ${i % 2 === 1 ? "sm:border-l sm:pl-5" : ""} ${i >= rows.length - 2 ? "sm:border-b-0" : ""}`}
          >
            <dt className="text-[11px] text-graphite-45">{k}</dt>
            <dd className="font-medium text-graphite">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function PersonalizeCard() {
  const items = [
    { t: "Nutrition", d: "Your dietary preference influences product and meal recommendations.", c: "bg-sage-soft text-sage" },
    { t: "Lifestyle", d: "Your activity level helps calculate calories and nutrition insights.", c: "bg-garnet-soft text-garnet" },
    { t: "Health", d: "Your health information helps contextualize reports and recommendations.", c: "bg-saffron-soft text-saffron" },
  ];
  return (
    <section className="rounded-2xl border border-hairline bg-card p-5">
      <CardHead title="How Nouriq personalizes your experience" subtitle="Your profile helps us deliver more accurate and relevant insights." />
      <div className="grid gap-3 md:grid-cols-3">
        {items.map((i) => (
          <div key={i.t} className="rounded-2xl border border-hairline bg-linen p-3.5">
            <div className="mb-2 flex items-center gap-2.5">
              <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${i.c}`}>{i.t[0]}</span>
              <b className="text-[13px] text-graphite">{i.t}</b>
            </div>
            <p className="text-xs text-graphite-70">{i.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}