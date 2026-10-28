import type { HealthProfileResponse, UserResponse } from "@/lib/types";

export function completenessPct(profile: HealthProfileResponse | null): number {
  if (!profile) return 0;
  const fields = [
    profile.age,
    profile.gender,
    profile.weightKg,
    profile.heightCm,
    profile.activityLevel,
    profile.dietaryPreference,
  ];
  return Math.round((fields.filter((f) => f !== null && f !== undefined).length / fields.length) * 100);
}

function initials(name: string | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function ProfileHero({
  profile,
  user,
}: {
  profile: HealthProfileResponse | null;
  user: UserResponse | null;
}) {
  const pct = completenessPct(profile);
  const r = 31;
  const c = 2 * Math.PI * r;

  return (
    <div className="relative -mx-[calc(50vw-50%)] -mt-10 w-screen overflow-hidden border-b border-hairline bg-linen-deep">
      <svg className="pointer-events-none absolute bottom-[-10px] left-0 hidden text-graphite-45 opacity-40 sm:block" width="190" height="240" viewBox="0 0 190 240" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
        <path d="M60 240C58 180 66 120 100 40" />
        <path d="M66 190c-22-6-34-22-38-44 24 2 36 16 38 44z" />
        <path d="M70 150c22-4 36-18 40-40-24 0-38 14-40 40z" />
        <path d="M76 112c-20-8-30-24-32-44 22 6 32 22 32 44z" />
        <path d="M84 80c18-6 30-20 32-40-20 2-32 16-32 40z" />
      </svg>
      <svg className="pointer-events-none absolute right-0 top-1 hidden text-graphite-45 opacity-30 lg:block" width="170" height="200" viewBox="0 0 170 200" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
        <path d="M150 0C146 60 130 120 90 190" />
        <path d="M146 40c-20 4-34 18-38 38 22-2 36-14 38-38z" />
        <path d="M138 90c20-2 32-16 34-34-20 0-32 12-34 34z" />
        <path d="M122 130c-18 2-30 14-34 32 20-2 32-12 34-32z" />
      </svg>
      

      <div className="relative mx-auto grid max-w-6xl items-center gap-6 px-4 py-8 sm:px-8 md:grid-cols-[auto_1fr_minmax(280px,400px)]">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-sage font-display text-4xl font-medium text-white shadow-lg ring-4 ring-card">
          {initials(user?.fullName)}
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sage">Personal health profile</p>
          <h1 className="mt-1 font-display text-3xl font-medium leading-tight text-graphite sm:text-4xl">
            {user?.fullName ?? "Your profile"}
          </h1>
          <p className="mt-2 max-w-[46ch] text-sm text-graphite-70">
            Your information helps Nouriq personalize your nutrition insights, reports and recommendations.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-graphite-70">
            {profile && (
              <span>
                Profile ID <span className="font-data text-graphite">{String(profile.id).padStart(4, "0")}</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sage-soft px-3 py-0.5 font-semibold text-sage">
              <span className="h-1.5 w-1.5 rounded-full bg-sage" /> Active
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-hairline bg-card px-5 py-4">
          <svg width="76" height="76" viewBox="0 0 76 76" role="img" aria-label={`${pct}% complete`}>
            <circle cx="38" cy="38" r={r} fill="none" strokeWidth="8" className="stroke-hairline" />
            <circle
              cx="38" cy="38" r={r} fill="none" strokeWidth="8" strokeLinecap="round"
              className="stroke-sage"
              strokeDasharray={c}
              strokeDashoffset={c - (pct / 100) * c}
              transform="rotate(-90 38 38)"
            />
            <text x="38" y="43" textAnchor="middle" className="fill-graphite font-data text-[15px] font-bold">{pct}%</text>
          </svg>
          <div>
            <p className="text-sm font-semibold text-graphite">Profile completeness</p>
            <p className="text-xs text-graphite-70">
              {pct === 100 ? "Great! Your profile is complete." : "Fill in the missing details below."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}