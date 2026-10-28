import { BackendError, authedFetchReadOnly, getCurrentUserOptional } from "@/lib/backend";
import { HealthProfileForm } from "@/components/HealthProfileForm";
import { AddAllergyForm, AddConditionForm, AddGoalForm } from "@/components/HealthProfileExtras";
import { ProfileHero } from "@/components/ProfileHero";
import { SnapshotCard, PersonalInfoCard, PersonalizeCard } from "@/components/ProfileCards";
import { ProgressSection, type HistoryPoint } from "@/components/ProgressSection";
import { ProfileDecor } from "@/components/ProfileDecor";
import type { HealthProfileResponse, UserResponse } from "@/lib/types";
import { HealthItemsEditor } from "@/components/HealthItemsEditor";

async function loadProfile(): Promise<HealthProfileResponse | null> {
  try {
    return await authedFetchReadOnly<HealthProfileResponse>("/health-profile");
  } catch (e) {
    if (e instanceof BackendError && e.status === 404) return null;
    throw e;
  }
}

// The history endpoint is not built yet; failure shows the empty state.
async function loadHistory(): Promise<{ weight: HistoryPoint[]; bmi: HistoryPoint[] }> {
  try {
    const rows = await authedFetchReadOnly<
      { recordedAt: string; weightKg: number | null; heightCm: number | null }[]
    >("/health-profile/history");
    const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const weight: HistoryPoint[] = rows
      .filter((r) => r.weightKg !== null)
      .map((r) => ({ label: fmt(r.recordedAt), value: r.weightKg as number, date: r.recordedAt }));
    const bmi: HistoryPoint[] = rows
      .filter((r) => r.weightKg !== null && r.heightCm !== null)
      .map((r) => {
        const h = (r.heightCm as number) / 100;
        return { label: fmt(r.recordedAt), value: Number(((r.weightKg as number) / (h * h)).toFixed(1)), date: r.recordedAt };
      });
    return { weight, bmi };
  } catch {
    return { weight: [], bmi: [] };
  }
}

function calcBmi(weightKg: number | null, heightCm: number | null): number | null {
  if (!weightKg || !heightCm) return null;
  const m = heightCm / 100;
  return weightKg / (m * m);
}

const card = "rounded-2xl border border-hairline bg-card p-5";
const groupLabel = "mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-graphite-45";

export default async function ProfilePage() {
  const [profile, user, history] = await Promise.all([
    loadProfile(),
    getCurrentUserOptional<UserResponse>(),
    loadHistory(),
  ]);
  const bmi = profile ? calcBmi(profile.weightKg, profile.heightCm) : null;

  return (
    <div className="relative">
      <ProfileDecor />
      <div className="relative z-10">
        <ProfileHero profile={profile} user={user} />

      <div className="px-4 pt-6 sm:px-0">
        <div className="grid items-start gap-5 lg:grid-cols-[1.18fr_1fr]">
          {/* Left column */}
          <div className="grid min-w-0 gap-5">
            {profile ? (
              <>
                <SnapshotCard profile={profile} bmi={bmi} />
                <PersonalInfoCard profile={profile} />
                <PersonalizeCard />
              </>
            ) : (
              <p className="rounded-2xl border border-hairline bg-card p-4 text-sm text-graphite">
                No health profile yet — fill in the form to create one.
              </p>
            )}
          </div>

          {/* Right column */}
          <div className="grid min-w-0 gap-5">
            <section className={card}>
              <div className="mb-4">
                <h2 className="font-display text-[17px] font-bold text-graphite">
                  {profile ? "Profile information" : "Create your profile"}
                </h2>
                <p className="text-xs text-graphite-70">Keep your information up to date for better recommendations.</p>
              </div>
              <HealthProfileForm profile={profile} />
            </section>

            {profile && (
              <section className={card}>
                <div className="mb-4">
                  <h2 className="font-display text-[17px] font-bold text-graphite">Health information</h2>
                  <p className="text-xs text-graphite-70">Medical conditions, goals and allergies.</p>
                </div>
                  <HealthItemsEditor
                  conditions={profile.conditions}
                  goals={profile.goals}
                  allergies={profile.allergies}
                  addCondition={<AddConditionForm />}
                  addGoal={<AddGoalForm />}
                  addAllergy={<AddAllergyForm />}
                />

                <p className="mt-5 rounded-xl bg-sage-soft px-3 py-2 text-[11.5px] text-sage">
                  Your health information is used only to personalize your NutrifyAI experience.
                </p>
              </section>
            )}
          </div>
        </div>

        <ProgressSection weightHistory={history.weight} bmiHistory={history.bmi} />
      </div>
    </div>
    </div>
  );
}