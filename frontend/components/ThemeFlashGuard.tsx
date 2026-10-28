/**
 * Sets data-theme on <html> synchronously, before first paint, from
 * localStorage (falling back to the user's OS preference). Must be a
 * plain inline script rendered via dangerouslySetInnerHTML — a normal
 * React effect would run after the first paint, causing a visible
 * flash of the wrong theme on every load for anyone using dark mode.
 */
export function ThemeFlashGuard() {
  const script = `
    (function () {
      try {
        var stored = localStorage.getItem('nutrifyai-theme');
        var theme = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', theme);
      } catch (e) {
        document.documentElement.setAttribute('data-theme', 'light');
      }
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}