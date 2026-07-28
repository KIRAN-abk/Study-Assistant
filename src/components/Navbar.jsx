/**
 * Navbar — sticky top bar with glassmorphism aesthetic.
 */
export default function Navbar({ theme, onToggleTheme }) {
  return (
    <nav
      className="sticky top-0 z-40 border-b border-gray-200/50 bg-white/80 backdrop-blur-xl transition-colors duration-200 dark:border-white/[0.05] dark:bg-gray-950/80"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-5">
        {/* Brand */}
        <a
          href="/"
          className="flex items-center gap-3 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          aria-label="Study Assistant home"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 text-[13px] font-bold text-white shadow-lg shadow-violet-500/30 dark:from-violet-500 dark:to-cyan-400">
            S
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-gray-900 dark:text-white">
            Study<span className="text-violet-600 dark:text-violet-400">Assistant</span>
          </span>
        </a>

        {/* Right-side items */}
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-gray-500 dark:text-gray-600 sm:block">Powered by Groq</span>
          
          <button
            onClick={onToggleTheme}
            className="touch-target flex items-center justify-center rounded-full bg-gray-100 p-2 text-gray-600 transition-colors hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>

          <span className="rounded-full border border-violet-500/20 bg-violet-50/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-violet-700 dark:bg-violet-500/10 dark:text-violet-400">
            Beta
          </span>
        </div>
      </div>
    </nav>
  );
}
