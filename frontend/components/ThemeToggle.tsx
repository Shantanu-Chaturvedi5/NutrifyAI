"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  // Starts null (not yet known client-side) rather than defaulting to
  // "light", so the label doesn't flash the wrong value for a frame on
  // a dark-mode visit — ThemeFlashGuard has already set the real
  // data-theme attribute before this component even mounts, this just
  // reads it back.
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    setTheme(current === "dark" ? "dark" : "light");
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("nutrifyai-theme", next);
    setTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="flex items-center gap-2 rounded-full border border-hairline px-3.5 py-2 font-data text-[11px] tracking-wide text-graphite-70 transition-colors hover:border-graphite-45 hover:text-graphite"
    >
      <span
        className="h-[9px] w-[9px] rounded-full"
        style={{
          background: theme === "dark" ? "var(--ink)" : "var(--saffron)",
          boxShadow: `0 0 0 3px ${theme === "dark" ? "var(--hairline)" : "var(--saffron-soft)"}`,
        }}
      />
      {theme === null ? "" : theme === "dark" ? "Dark" : "Light"}
    </button>
  );
}