import { useState, useCallback, useRef, useEffect } from "react";

// ─── Constants ───────────────────────────────────────────────────────────────

const KBD_CLASS = "rounded border border-gray-700 bg-gray-800 px-1 py-0.5 font-sans text-[10px]";

const NAV_BTN_CLASS =
  "touch-target flex h-11 w-11 items-center justify-center rounded-full border border-gray-800 bg-gray-900 text-gray-400 text-xl transition-all hover:border-gray-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500";

// ─── FlipCard ────────────────────────────────────────────────────────────────

/**
 * Single 3-D flip card.
 *
 * Keyboard:
 *  - Space / Enter → flip
 *  - ← / → → navigate cards (delegates to parent via onPrev / onNext)
 */
function FlipCard({ question, answer, onPrev, onNext, hasPrev, hasNext }) {
  const [flipped, setFlipped] = useState(false);
  const sceneRef = useRef(null);

  // Auto-focus so keyboard users can interact immediately after navigation
  useEffect(() => { sceneRef.current?.focus(); }, []);

  const toggle = useCallback(() => setFlipped((f) => !f), []);

  const handleKey = useCallback(
    (e) => {
      switch (e.key) {
        case "Enter":
        case " ":
          e.preventDefault();
          toggle();
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (hasPrev) { setFlipped(false); onPrev?.(); }
          break;
        case "ArrowRight":
          e.preventDefault();
          if (hasNext) { setFlipped(false); onNext?.(); }
          break;
        default:
          break;
      }
    },
    [toggle, hasPrev, hasNext, onPrev, onNext]
  );

  return (
    <div
      ref={sceneRef}
      className="fc-scene w-full cursor-pointer"
      style={{ height: 300 }}
      onClick={toggle}
      onKeyDown={handleKey}
      tabIndex={0}
      role="button"
      aria-pressed={flipped}
      aria-label={
        flipped
          ? `Answer: ${answer}. Press Space or Enter to flip back.`
          : `Question: ${question}. Press Space or Enter to reveal answer.`
      }
    >
      <div className={`fc-card relative h-full w-full rounded-2xl ${flipped ? "is-flipped" : ""}`}>
        {/* Front */}
        <div className="fc-face flex flex-col items-center justify-center rounded-2xl border border-gray-800 bg-gray-900 px-6 py-10 text-center sm:px-8">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-gray-600">Question</p>
          <p className="text-base font-semibold leading-relaxed text-white sm:text-xl">{question}</p>
          <p className="mt-6 text-xs text-gray-600" aria-hidden="true">↩ Space / Enter to flip</p>
        </div>

        {/* Back */}
        <div className="fc-face fc-face--back flex flex-col items-center justify-center rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-500/10 to-cyan-500/5 px-6 py-10 text-center sm:px-8">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-violet-400/60">Answer</p>
          <p className="text-base font-medium leading-relaxed text-gray-200 sm:text-lg">{answer}</p>
          <p className="mt-6 text-xs text-gray-600" aria-hidden="true">↩ Space / Enter to flip back</p>
        </div>
      </div>
    </div>
  );
}

// ─── DotTablist ───────────────────────────────────────────────────────────────

/**
 * WAI-ARIA tablist with roving tabindex.
 * Arrow keys move focus and selection; Home / End jump to ends.
 */
function DotTablist({ count, currentIndex, onSelect }) {
  const listRef = useRef(null);

  // Focus a dot by index after state has updated
  const focusDot = useCallback((i) => {
    setTimeout(() => listRef.current?.children[i]?.focus(), 0);
  }, []);

  const handleKey = useCallback(
    (e) => {
      let next = null;
      if (e.key === "ArrowRight" || e.key === "ArrowDown")  next = (currentIndex + 1) % count;
      if (e.key === "ArrowLeft"  || e.key === "ArrowUp")    next = (currentIndex - 1 + count) % count;
      if (e.key === "Home")                                  next = 0;
      if (e.key === "End")                                   next = count - 1;

      if (next !== null) {
        e.preventDefault();
        onSelect(next);
        focusDot(next);
      }
    },
    [currentIndex, count, onSelect, focusDot]
  );

  return (
    <div
      ref={listRef}
      className="mt-5 flex flex-wrap justify-center gap-2"
      role="tablist"
      aria-label="Jump to card"
      onKeyDown={handleKey}
    >
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          tabIndex={i === currentIndex ? 0 : -1}
          className={`h-2.5 w-2.5 rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1 focus-visible:ring-offset-gray-950 ${
            i === currentIndex ? "scale-125 bg-violet-500" : "bg-gray-700 hover:bg-gray-500"
          }`}
          onClick={() => onSelect(i)}
          role="tab"
          aria-selected={i === currentIndex}
          aria-label={`Card ${i + 1}${i === currentIndex ? " (current)" : ""}`}
        />
      ))}
    </div>
  );
}

// ─── Flashcards ───────────────────────────────────────────────────────────────

/**
 * Flashcards — paginated deck with 3-D flip, dot nav, prev/next, restart.
 *
 * Section-level keyboard:
 *  - ← / → → previous / next card
 *  - Home / End → first / last card
 *
 * @param {{ cards: Array<{ question: string, answer: string }> }} props
 */
export default function Flashcards({ cards }) {
  const [index, setIndex] = useState(0);

  const prev    = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const next    = useCallback(() => setIndex((i) => Math.min(cards.length - 1, i + 1)), [cards.length]);
  const restart = useCallback(() => setIndex(0), []);

  const handleSectionKey = useCallback(
    (e) => {
      switch (e.key) {
        case "ArrowLeft":  e.preventDefault(); prev(); break;
        case "ArrowRight": e.preventDefault(); next(); break;
        case "Home":       e.preventDefault(); setIndex(0); break;
        case "End":        e.preventDefault(); setIndex(cards.length - 1); break;
        default: break;
      }
    },
    [prev, next, cards.length]
  );

  if (!cards?.length) return null;

  const hasPrev = index > 0;
  const hasNext = index < cards.length - 1;

  return (
    <section className="anim-fade-in" aria-label="Flashcards" onKeyDown={handleSectionKey}>
      {/* SR-only live region — announces position on navigation */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {`Card ${index + 1} of ${cards.length}`}
      </div>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-lg" aria-hidden="true">
            🃏
          </div>
          <h2 className="text-lg font-bold text-white">Flashcards</h2>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500" aria-hidden="true">
            {index + 1} / {cards.length}
          </span>
          <span className="hidden items-center gap-1 text-xs text-gray-600 sm:flex" aria-hidden="true">
            <kbd className={KBD_CLASS}>←</kbd>
            <kbd className={KBD_CLASS}>→</kbd>
            navigate
          </span>
          <button
            className="touch-target inline-flex items-center gap-1.5 rounded-full border border-gray-800 bg-gray-900 px-3.5 py-1.5 text-xs font-semibold text-gray-400 transition-all hover:border-gray-700 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            onClick={restart}
            aria-label="Restart flashcards from the beginning"
          >
            ↺ Restart
          </button>
        </div>
      </div>

      {/* Card — key prop resets flip state on navigation */}
      <FlipCard
        key={index}
        question={cards[index].question}
        answer={cards[index].answer}
        onPrev={prev}
        onNext={next}
        hasPrev={hasPrev}
        hasNext={hasNext}
      />

      {/* Dot tablist — receives count, not the full cards array */}
      <DotTablist count={cards.length} currentIndex={index} onSelect={setIndex} />

      {/* Prev / Next buttons */}
      <div className="mt-5 flex items-center justify-center gap-4">
        <button className={NAV_BTN_CLASS} onClick={prev} disabled={!hasPrev} aria-label="Previous card">
          ‹
        </button>
        <span className="min-w-[64px] text-center text-sm font-medium text-gray-500" aria-hidden="true">
          {index + 1} / {cards.length}
        </span>
        <button className={NAV_BTN_CLASS} onClick={next} disabled={!hasNext} aria-label="Next card">
          ›
        </button>
      </div>
    </section>
  );
}
