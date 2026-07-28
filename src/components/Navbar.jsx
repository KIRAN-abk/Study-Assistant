/**
 * Navbar — sticky top bar with glassmorphism aesthetic.
 */
export default function Navbar() {
  return (
    <nav
      className="sticky top-0 z-40 border-b border-white/[0.05] bg-gray-950/80 backdrop-blur-xl"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-5">
        {/* Brand */}
        <a
          href="/"
          className="flex items-center gap-3 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          aria-label="Study Assistant home"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 text-[13px] font-bold text-white shadow-lg shadow-violet-500/30">
            S
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-white">
            Study<span className="text-violet-400">Assistant</span>
          </span>
        </a>

        {/* Right-side badge */}
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-gray-600 sm:block">Powered by Gemini</span>
          <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-violet-400">
            Beta
          </span>
        </div>
      </div>
    </nav>
  );
}
