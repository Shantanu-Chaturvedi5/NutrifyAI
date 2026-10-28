"use client";

import { useState, useTransition, type ReactNode } from "react";
import {
  removeAllergyAction,
  removeConditionAction,
  removeGoalAction,
  renameAllergyAction,
  updateConditionAction,
  updateGoalAction,
  type ItemResult,
} from "@/lib/actions/health-items";
import type { HealthGoalResponse, MedicalConditionResponse } from "@/lib/types";

type Kind = "cond" | "goal" | "allergy";
type Active = { kind: Kind; key: string; mode: "edit" | "del" } | null;

const SEVERITIES = ["MILD", "MODERATE", "SEVERE"];
const pretty = (s: string | null) => (s ? s.charAt(0) + s.slice(1).toLowerCase() : "");

const label = "mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-graphite-45";
const field =
  "h-9 min-w-[110px] flex-1 rounded-lg border border-hairline bg-card px-2.5 text-sm text-graphite focus:border-sage focus:outline-none";
const mini = "rounded-full border border-hairline bg-card px-3 py-1 text-xs font-semibold text-graphite hover:bg-linen-deep";
const miniGo = "rounded-full bg-graphite px-3 py-1 text-xs font-semibold text-linen hover:bg-sage hover:text-white disabled:opacity-50";
const miniDanger = "rounded-full bg-garnet px-3 py-1 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50";

function PencilIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" />
    </svg>
  );
}
function BinIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
    </svg>
  );
}

export function HealthItemsEditor({
  conditions,
  goals,
  allergies,
  addCondition,
  addGoal,
  addAllergy,
}: {
  conditions: MedicalConditionResponse[];
  goals: HealthGoalResponse[];
  allergies: string[];
  addCondition: ReactNode;
  addGoal: ReactNode;
  addAllergy: ReactNode;
}) {
  const [active, setActive] = useState<Active>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const is = (kind: Kind, key: string, mode: "edit" | "del") =>
    active?.kind === kind && active.key === key && active.mode === mode;

  function open(kind: Kind, key: string, mode: "edit" | "del", initial: Record<string, string> = {}) {
    setActive({ kind, key, mode });
    setDraft(initial);
    setError(null);
  }
  function close() {
    setActive(null);
    setError(null);
  }
  function run(fn: () => Promise<ItemResult>) {
    start(async () => {
      const r = await fn();
      if (r.error) setError(r.error);
      else close();
    });
  }
  const set = (k: string, v: string) => setDraft((d) => ({ ...d, [k]: v }));

  function Confirm({ name, onYes }: { name: string; onYes: () => void }) {
    return (
      <div className="flex w-full flex-wrap items-center gap-2 text-[13px] text-graphite">
        <span>
          Remove <b>{name}</b>?
        </span>
        <button type="button" className={miniDanger} disabled={pending} onClick={onYes}>
          {pending ? "Removing…" : "Remove"}
        </button>
        <button type="button" className={mini} onClick={close}>
          Keep
        </button>
        {error && <span className="w-full text-xs text-garnet">{error}</span>}
      </div>
    );
  }

  function EditRow({ children, onSave }: { children: ReactNode; onSave: () => void }) {
    return (
      <div className="flex w-full flex-wrap items-center gap-2">
        {children}
        <button type="button" className={miniGo} disabled={pending} onClick={onSave}>
          {pending ? "Saving…" : "Save"}
        </button>
        <button type="button" className={mini} onClick={close}>
          Cancel
        </button>
        {error && <span className="w-full text-xs text-garnet">{error}</span>}
      </div>
    );
  }

  return (
    <div>
      {/* Medical conditions */}
      <div>
        <p className={label}>Medical conditions</p>
        {conditions.length === 0 ? (
          <p className="text-sm text-graphite-70">None added yet.</p>
        ) : (
          <ul className="space-y-2">
            {conditions.map((c) => (
              <li key={c.code} className="flex flex-wrap items-center gap-3 rounded-xl bg-garnet-soft px-3 py-2.5">
                {is("cond", c.code, "del") ? (
                  <Confirm name={c.name} onYes={() => run(() => removeConditionAction(c.code))} />
                ) : is("cond", c.code, "edit") ? (
                  <>
                    <span className="w-full text-sm font-semibold text-graphite">{c.name}</span>
                    <EditRow
                      onSave={() =>
                        run(() => updateConditionAction(c.code, draft.severity || null, draft.notes || null))
                      }
                    >
                      <select
                        className={field}
                        value={draft.severity ?? ""}
                        onChange={(e) => set("severity", e.target.value)}
                        aria-label="Severity"
                      >
                        <option value="">Severity</option>
                        {SEVERITIES.map((s) => (
                          <option key={s} value={s}>
                            {pretty(s)}
                          </option>
                        ))}
                      </select>
                      <input
                        className={field}
                        placeholder="Notes (optional)"
                        value={draft.notes ?? ""}
                        onChange={(e) => set("notes", e.target.value)}
                        aria-label="Notes"
                      />
                    </EditRow>
                  </>
                ) : (
                  <>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-graphite">{c.name}</p>
                      <p className="text-xs text-graphite-70">
                        {[pretty(c.severity), c.notes].filter(Boolean).join(" · ") || "Added to your health profile"}
                      </p>
                    </div>
                    <div className="flex gap-0.5 text-graphite-70">
                      <button
                        type="button"
                        aria-label={`Edit ${c.name}`}
                        className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-black/10"
                        onClick={() => open("cond", c.code, "edit", { severity: c.severity ?? "", notes: c.notes ?? "" })}
                      >
                        <PencilIcon />
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove ${c.name}`}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-garnet hover:bg-black/10"
                        onClick={() => open("cond", c.code, "del")}
                      >
                        <BinIcon />
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3">{addCondition}</div>
      </div>

      {/* Health goals */}
      <div className="mt-4 border-t border-hairline pt-4">
        <p className={label}>Health goals</p>
        {goals.length === 0 ? (
          <p className="text-sm text-graphite-70">None added yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {goals.map((g) =>
              is("goal", g.code, "del") ? (
                <div key={g.code} className="w-full rounded-xl bg-sage-soft px-3 py-2">
                  <Confirm name={g.name} onYes={() => run(() => removeGoalAction(g.code))} />
                </div>
              ) : is("goal", g.code, "edit") ? (
                <div key={g.code} className="w-full rounded-xl bg-sage-soft px-3 py-2">
                  <p className="mb-2 text-sm font-semibold text-graphite">{g.name}</p>
                  <EditRow
                    onSave={() =>
                      run(() =>
                        updateGoalAction(g.code, draft.target ? Number(draft.target) : null, draft.date || null)
                      )
                    }
                  >
                    <input
                      className={field}
                      type="number"
                      step="0.1"
                      placeholder="Target value"
                      value={draft.target ?? ""}
                      onChange={(e) => set("target", e.target.value)}
                      aria-label="Target value"
                    />
                    <input
                      className={field}
                      type="date"
                      value={draft.date ?? ""}
                      onChange={(e) => set("date", e.target.value)}
                      aria-label="Target date"
                    />
                  </EditRow>
                </div>
              ) : (
                <span
                  key={g.code}
                  className="inline-flex items-center gap-1 rounded-full bg-sage-soft py-1 pl-3 pr-1.5 text-xs font-medium text-sage"
                >
                  {g.name}
                  {g.targetValue != null && <span className="opacity-70">· {g.targetValue}</span>}
                  <button
                    type="button"
                    aria-label={`Edit ${g.name}`}
                    className="flex h-5 w-5 items-center justify-center rounded-full opacity-75 hover:bg-black/10 hover:opacity-100"
                    onClick={() =>
                      open("goal", g.code, "edit", {
                        target: g.targetValue != null ? String(g.targetValue) : "",
                        date: g.targetDate ? g.targetDate.slice(0, 10) : "",
                      })
                    }
                  >
                    <PencilIcon />
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove ${g.name}`}
                    className="flex h-5 w-5 items-center justify-center rounded-full text-sm opacity-75 hover:bg-black/10 hover:opacity-100"
                    onClick={() => open("goal", g.code, "del")}
                  >
                    ×
                  </button>
                </span>
              )
            )}
          </div>
        )}
        <div className="mt-3">{addGoal}</div>
      </div>

      {/* Allergies */}
      <div className="mt-4 border-t border-hairline pt-4">
        <p className={label}>Allergies</p>
        {allergies.length === 0 ? (
          <p className="text-sm text-graphite-70">None added yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {allergies.map((a) =>
              is("allergy", a, "del") ? (
                <div key={a} className="w-full rounded-xl bg-saffron-soft px-3 py-2">
                  <Confirm name={a} onYes={() => run(() => removeAllergyAction(a))} />
                </div>
              ) : is("allergy", a, "edit") ? (
                <div key={a} className="w-full rounded-xl bg-saffron-soft px-3 py-2">
                  <EditRow onSave={() => run(() => renameAllergyAction(a, draft.name ?? ""))}>
                    <input
                      className={field}
                      value={draft.name ?? ""}
                      onChange={(e) => set("name", e.target.value)}
                      aria-label="Allergy name"
                    />
                  </EditRow>
                </div>
              ) : (
                <span
                  key={a}
                  className="inline-flex items-center gap-1 rounded-full bg-saffron-soft py-1 pl-3 pr-1.5 text-xs font-medium text-saffron"
                >
                  {a}
                  <button
                    type="button"
                    aria-label={`Edit ${a}`}
                    className="flex h-5 w-5 items-center justify-center rounded-full opacity-75 hover:bg-black/10 hover:opacity-100"
                    onClick={() => open("allergy", a, "edit", { name: a })}
                  >
                    <PencilIcon />
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove ${a}`}
                    className="flex h-5 w-5 items-center justify-center rounded-full text-sm opacity-75 hover:bg-black/10 hover:opacity-100"
                    onClick={() => open("allergy", a, "del")}
                  >
                    ×
                  </button>
                </span>
              )
            )}
          </div>
        )}
        <div className="mt-3">{addAllergy}</div>
      </div>
    </div>
  );
}