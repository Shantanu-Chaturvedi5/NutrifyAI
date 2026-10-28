"use client";

import { useActionState, useState } from "react";
import { ArrowUpFromLine, FileImage, FileText } from "lucide-react";
import { uploadReportAction, type ActionState } from "@/lib/actions/reports";

const initialState: ActionState = {};

const REPORT_TYPES = [
  ["BLOOD", "Blood test"],
  ["CBC", "CBC"],
  ["LIPID_PROFILE", "Lipid profile"],
  ["HBA1C", "HbA1c"],
  ["THYROID", "Thyroid panel"],
  ["VITAMIN", "Vitamin panel"],
  ["OTHER", "Other"],
];

export function UploadReportForm() {
  const [state, formAction, pending] = useActionState(uploadReportAction, initialState);
  const [selectedFileName, setSelectedFileName] = useState("");

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="reportType" className="mb-1.5 block text-xs font-semibold text-graphite">
          Report category
        </label>
        <select
          id="reportType" name="reportType" required defaultValue="BLOOD"
          className="w-full rounded-xl border border-hairline bg-linen/50 px-3.5 py-3 text-sm text-graphite outline-none transition focus:border-sage/60 focus:ring-4 focus:ring-sage/10"
        >
          {REPORT_TYPES.map(([code, label]) => (
            <option key={code} value={code}>{label}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="file" className="mb-1.5 block text-xs font-semibold text-graphite">
          Choose a report file
        </label>
        <label
          htmlFor="file"
          className="group flex cursor-pointer flex-col items-center rounded-2xl border border-dashed border-sage/45 bg-sage-soft/20 px-4 py-5 text-center transition hover:border-sage hover:bg-sage-soft/35 focus-within:ring-4 focus-within:ring-sage/10"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-card text-sage shadow-sm transition group-hover:-translate-y-0.5">
            <ArrowUpFromLine className="h-5 w-5" />
          </span>
          <span className="mt-3 max-w-full truncate text-xs font-semibold text-graphite">
            {selectedFileName || "Select a PDF or image"}
          </span>
          <span className="mt-1 text-[10px] text-graphite-70">
            {selectedFileName ? "Select a different file" : "PDF, JPG, JPEG, or PNG"}
          </span>
          <input
            id="file"
            name="file"
            type="file"
            required
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(event) => setSelectedFileName(event.target.files?.[0]?.name ?? "")}
            className="sr-only"
          />
        </label>
        <div className="mt-2 flex items-center justify-center gap-3 text-[10px] text-graphite-45">
          <span className="inline-flex items-center gap-1"><FileText className="h-3 w-3" /> PDF</span>
          <span className="inline-flex items-center gap-1"><FileImage className="h-3 w-3" /> JPG / PNG</span>
        </div>
      </div>

      {state.error && (
        <p className="rounded-lg border border-hairline bg-garnet-soft px-3 py-2 text-sm text-garnet">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-sage px-4 py-3 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(20,146,100,0.18)] transition hover:bg-sage/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ArrowUpFromLine className="h-4 w-4" />
        {pending ? "Uploading report…" : "Upload report"}
      </button>
    </form>
  );
}
