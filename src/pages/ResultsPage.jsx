import { useState, useRef, useCallback, useEffect } from "react";
import Flashcards from "../components/Flashcards";
import Quiz from "../components/Quiz";

// ─── Constants ───────────────────────────────────────────────────────────────

const TABS = [
  { id: "flashcards", label: "Flashcards", icon: "🃏" },
  { id: "quiz",       label: "Quiz",       icon: "🧠" },
];

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * ResultsPage — tabbed view (Flashcards / Quiz) for generated study content.
 *
 * WAI-ARIA tab pattern:
 *  - Roving tabindex on tab buttons
 *  - ← / → / Home / End navigate between tabs
 *  - Active panel auto-focuses on tab switch
 *
 * @param {{ data: { title: string, flashcards: Array, quiz: Array }, onBack: () => void }} props
 */
export default function ResultsPage({ data, onBack }) {
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const { title, flashcards, quiz } = data;

  const tabRefs  = useRef([]);   // button elements for roving tabindex
  const panelRef = useRef(null); // active panel — receives focus on tab switch

  // Move focus into the panel when the tab changes
  useEffect(() => { panelRef.current?.focus(); }, [activeTab]);

  const handleTabKey = useCallback((e, tabIndex) => {
    const total = TABS.length;
    let next = null;

    if (e.key === "ArrowRight") next = (tabIndex + 1) % total;
    if (e.key === "ArrowLeft")  next = (tabIndex - 1 + total) % total;
    if (e.key === "Home")       next = 0;
    if (e.key === "End")        next = total - 1;

    if (next !== null) {
      e.preventDefault();
      tabRefs.current[next]?.focus();
      setActiveTab(TABS[next].id);
    }
  }, []);

  // Lookup helper — avoids inline ternary chains in JSX
  const countFor = (id) => (id === "flashcards" ? flashcards.length : quiz.length);

  return (
    <main
      className="min-h-[calc(100vh-64px)] px-4 pb-24 pt-8 sm:px-5 sm:pt-10"
      id="main-content"
    >
      <div className="mx-auto max-w-3xl anim-fade-in">

        {/* ── Study-set banner ───────────────────────────── */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-violet-600/20 via-gray-900 to-cyan-600/10 p-5 shadow-2xl shadow-black/40 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              {/* Eyebrow */}
              <div className="mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
                <span className="text-[11px] font-semibold uppercase tracking-widest text-emerald-400">
                  Study Set Ready
                </span>
              </div>

              <h1 className="mb-4 font-['Plus_Jakarta_Sans',sans-serif] text-xl font-extrabold leading-snug text-white sm:text-3xl">
                {title}
              </h1>

              {/* Content stats */}
              <div
                className="flex flex-wrap items-center gap-4 text-sm text-gray-400"
                aria-label={`${flashcards.length} flashcards, ${quiz.length} quiz questions`}
              >
                <span className="flex items-center gap-1.5">
                  <span aria-hidden="true">🃏</span>
                  <strong className="font-semibold text-white">{flashcards.length}</strong>
                  &nbsp;flashcards
                </span>
                <span className="h-3.5 w-px bg-gray-700" aria-hidden="true" />
                <span className="flex items-center gap-1.5">
                  <span aria-hidden="true">🧠</span>
                  <strong className="font-semibold text-white">{quiz.length}</strong>
                  &nbsp;quiz questions
                </span>
              </div>
            </div>

            <button
              onClick={onBack}
              className="touch-target self-start inline-flex items-center gap-2 rounded-full border border-gray-700 bg-gray-900/80 px-4 py-2 text-sm font-semibold text-gray-400 transition-all hover:border-gray-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              aria-label="Go back and start a new study set"
            >
              ← New Study Set
            </button>
          </div>
        </div>

        {/* ── Tab switcher ────────────────────────────────── */}
        <div
          className="mb-8 flex gap-1.5 overflow-x-auto rounded-xl border border-gray-800 bg-gray-900 p-1.5 w-fit max-w-full"
          role="tablist"
          aria-label="Study modes"
        >
          {TABS.map(({ id, label, icon }, i) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                ref={(el) => { tabRefs.current[i] = el; }}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${id}`}
                id={`tab-${id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveTab(id)}
                onKeyDown={(e) => handleTabKey(e, i)}
                className={`flex flex-shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                  isActive
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                <span aria-hidden="true">{icon}</span>
                {label}
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    isActive ? "bg-white/20 text-white" : "bg-gray-800 text-gray-500"
                  }`}
                  aria-label={`${countFor(id)} items`}
                >
                  {countFor(id)}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Tab panels ──────────────────────────────────── */}
        {TABS.map(({ id }) => (
          <div
            key={id}
            id={`panel-${id}`}
            role="tabpanel"
            aria-labelledby={`tab-${id}`}
            tabIndex={-1}
            ref={activeTab === id ? panelRef : null}
            className={`focus:outline-none ${activeTab === id ? "anim-fade-in" : "hidden"}`}
          >
            {id === "flashcards" && <Flashcards cards={flashcards} />}
            {id === "quiz"       && <Quiz questions={quiz} />}
          </div>
        ))}
      </div>
    </main>
  );
}
