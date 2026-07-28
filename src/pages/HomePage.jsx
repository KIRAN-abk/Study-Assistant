import { useState, useRef, useCallback } from "react";
import EmptyState from "../components/EmptyState";

// ─── Constants ──────────────────────────────────────────────────────────────

const MAX_CHARS = 5_000;
const NEAR_LIMIT_THRESHOLD = 200;

// Hoisted — stable reference, never re-created on render
const TIPS = [
  {
    icon: "📄",
    title: "Paste your notes",
    desc: "Copy from your textbook, lecture slides, or any document.",
    animClass: "anim-tip-1",
  },
  {
    icon: "🎯",
    title: "Be specific",
    desc: "The more focused your topic, the sharper the flashcards and quiz.",
    animClass: "anim-tip-2",
  },
  {
    icon: "🔁",
    title: "Review & repeat",
    desc: "Use the retry feature to drill only the questions you got wrong.",
    animClass: "anim-tip-3",
  },
];

const KBD_CLASS =
  "rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-sans text-[10px] text-gray-500 dark:border-gray-700 dark:bg-gray-800";

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * HomePage — landing page: textarea, generate button, empty state, tips.
 *
 * @param {{ onSuccess: (notes: string) => void, isLoading?: boolean }} props
 */
export default function HomePage({ onSuccess, isLoading = false }) {
  const [notes, setNotes] = useState("");
  const textareaRef = useRef(null);

  // Derived state — avoids separate useState for each flag
  const charsLeft   = MAX_CHARS - notes.length;
  const isOverLimit = charsLeft < 0;
  const isNearLimit = charsLeft <= NEAR_LIMIT_THRESHOLD && !isOverLimit;
  const canGenerate = notes.trim().length > 0 && !isOverLimit && !isLoading;

  const handleGenerate = useCallback(() => {
    if (!canGenerate) return;
    onSuccess(notes.trim());
  }, [canGenerate, notes, onSuccess]);

  // Memoized — stable reference avoids re-subscriptions on textarea's event listener
  const handleKeyDown = useCallback(
    (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") handleGenerate();
    },
    [handleGenerate]
  );

  const handleExampleClick = useCallback((text) => {
    setNotes(text);
    textareaRef.current?.focus();
  }, []);

  return (
    <main
      className="min-h-[calc(100vh-64px)] px-4 pb-24 pt-12 sm:px-5 sm:pt-14"
      id="main-content"
    >
      <div className="mx-auto max-w-3xl">

        {/* ── Hero ─────────────────────────────────────────── */}
        <header className="mb-10 text-center anim-fade-in sm:mb-12">
          <div
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5"
            aria-hidden="true"
          >
            <span className="h-1.5 w-1.5 rounded-full orb" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-violet-400">
              AI-Powered Learning
            </span>
          </div>

          <h1 className="mb-4 font-['Plus_Jakarta_Sans',sans-serif] text-[2.1rem] font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-[3.2rem] sm:leading-[1.1]">
            Turn any topic into{" "}
            <span className="gradient-text">smart study tools</span>
          </h1>

          <p className="mx-auto max-w-md text-base leading-relaxed text-gray-500">
            Paste your notes or describe a topic. Get AI-generated flashcards
            and a quiz in seconds.
          </p>
        </header>

        {/* ── Input card ───────────────────────────────────── */}
        <div
          className="anim-fade-in-d100 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-black/5 dark:border-gray-800 dark:bg-gray-900 dark:shadow-black/50"
          role="region"
          aria-label="Study input"
        >
          {/* Card header */}
          <div className="flex items-center gap-2.5 border-b border-gray-100 px-4 py-3 dark:border-gray-800 sm:px-5 sm:py-3.5">
            <span className="text-base" aria-hidden="true">📝</span>
            <label htmlFor="study-notes" className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Your notes or topic
            </label>
            <span
              className="ml-auto hidden items-center gap-1 text-[11px] text-gray-400 dark:text-gray-600 sm:flex"
              aria-label="Keyboard shortcut: Control Enter to generate"
            >
              <kbd className={KBD_CLASS}>Ctrl</kbd>
              <span>+</span>
              <kbd className={KBD_CLASS}>Enter</kbd>
            </span>
          </div>

          {/* Textarea */}
          <textarea
            id="study-notes"
            ref={textareaRef}
            className={`min-h-[200px] w-full resize-y bg-transparent px-4 py-4 text-[15px] leading-relaxed text-gray-900 placeholder:text-gray-400 focus:outline-none disabled:opacity-40 dark:text-gray-100 dark:placeholder:text-gray-700 sm:min-h-52 sm:px-5 ${
              isOverLimit ? "text-red-500 dark:text-red-300" : ""
            }`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder={
              "Paste your study notes here, or describe a topic you want to learn about…\n\nExamples:\n• The water cycle and its stages\n• JavaScript closures and scope\n• The French Revolution"
            }
            aria-label="Study notes or topic"
            aria-describedby="char-count"
            aria-invalid={isOverLimit || undefined}
            aria-required="true"
          />

          {/* Card footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 dark:border-gray-800 sm:px-5 sm:py-3.5">
            <span
              id="char-count"
              aria-live={isNearLimit || isOverLimit ? "polite" : "off"}
              aria-atomic="true"
              className={`text-xs font-medium tabular-nums transition-colors ${
                isOverLimit ? "text-red-500 dark:text-red-400" : isNearLimit ? "text-amber-500 dark:text-amber-400" : "text-gray-400 dark:text-gray-600"
              }`}
            >
              {isOverLimit
                ? `${Math.abs(charsLeft).toLocaleString()} characters over limit`
                : `${charsLeft.toLocaleString()} remaining`}
            </span>

            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              aria-label={isLoading ? "Generating study content, please wait" : "Generate study content"}
              aria-busy={isLoading}
              className="touch-target inline-flex items-center gap-2 rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/30 transition-all duration-200 hover:bg-violet-500 hover:shadow-violet-500/40 hover:-translate-y-px active:translate-y-0 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
            >
              {isLoading ? (
                <>
                  <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-white"
                    aria-hidden="true"
                  />
                  Generating…
                </>
              ) : (
                <>✦ Generate Study Set</>
              )}
            </button>
          </div>
        </div>

        {/* ── Empty state + tips — only when idle ──────────── */}
        {!isLoading && (
          <>
            <EmptyState onExampleClick={handleExampleClick} />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Tips for better results">
              {TIPS.map(({ icon, title, desc, animClass }) => (
                <div
                  key={title}
                  className={`rounded-xl border border-gray-100 bg-white p-5 transition-colors hover:border-gray-200 dark:border-gray-800 dark:bg-gray-900/60 dark:hover:border-gray-700 ${animClass}`}
                >
                  <span className="mb-3 block text-2xl" aria-hidden="true">{icon}</span>
                  <p className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">{title}</p>
                  <p className="text-xs leading-relaxed text-gray-500">{desc}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
