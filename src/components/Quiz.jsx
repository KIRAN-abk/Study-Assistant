import { useState, useRef, useCallback, useEffect } from "react";

// ─── Constants ───────────────────────────────────────────────────────────────

const PHASE = Object.freeze({ ANSWERING: "answering", FEEDBACK: "feedback", DONE: "done" });

// Option labels — supports up to 6 choices
const OPTION_LABELS = ["A", "B", "C", "D", "E", "F"];

// Shared kbd styling — avoids repeating the same string 4 times
const KBD_CLASS = "rounded border border-gray-700 bg-gray-800 px-1 py-0.5 font-sans text-[10px]";

// Shared button base classes for primary/ghost score-screen actions
const BTN_PRIMARY =
  "touch-target inline-flex items-center gap-2 rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/30 transition-all hover:bg-violet-500 hover:-translate-y-px active:translate-y-0 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950";

const BTN_GHOST =
  "touch-target inline-flex items-center gap-2 rounded-full border border-gray-700 bg-gray-900 px-5 py-2.5 text-sm font-semibold text-gray-400 transition-all hover:border-gray-600 hover:text-white hover:-translate-y-px active:translate-y-0 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950";

// Score messages keyed by percentage threshold — pure lookup, no function needed
const SCORE_MESSAGES = [
  [100, "🏆 Perfect score! You're a master!"],
  [80,  "🎉 Excellent work! Almost perfect!"],
  [60,  "👍 Good job! A bit more practice and you'll ace it."],
  [40,  "📚 Keep going — revisit the material and try again."],
  [0,   "💡 Don't worry — use the flashcards to reinforce the key concepts."],
];

function getScoreMessage(correct, total) {
  const pct = (correct / total) * 100;
  return SCORE_MESSAGES.find(([threshold]) => pct >= threshold)[1];
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ProgressBar({ current, total }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div
      className="mb-6 h-1 w-full overflow-hidden rounded-full bg-gray-800"
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label={`Question ${current} of ${total}`}
      aria-valuetext={`${pct}% complete`}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/**
 * OptionButton — single answer choice with idle / selected / correct / wrong states.
 * Number keys 1–4 are handled at section level in Quiz.
 */
function OptionButton({ label, text, onClick, disabled, state }) {
  const OPTION_CLASSES = {
    idle:     "border-gray-800 bg-gray-900 text-gray-300 hover:border-violet-500/40 hover:bg-violet-500/5 hover:translate-x-0.5 cursor-pointer",
    selected: "border-violet-500 bg-violet-500/10 text-violet-300",
    correct:  "border-green-500/50 bg-green-500/10 text-green-400 cursor-default",
    wrong:    "border-red-500/50 bg-red-500/10 text-red-400 cursor-default",
  };

  const MARKER_CLASSES = {
    idle:     "border-gray-700 text-gray-500",
    selected: "border-violet-500 text-violet-400",
    correct:  "border-green-500 bg-green-500/20 text-green-400",
    wrong:    "border-red-500 bg-red-500/20 text-red-400",
  };

  const icon = state === "correct" ? "✓" : state === "wrong" ? "✕" : label;
  const stateLabel =
    state === "correct" ? "Correct answer" :
    state === "wrong"   ? "Incorrect" :
    state === "selected" ? "Selected" : null;

  return (
    <button
      className={`quiz-opt flex w-full items-center gap-4 rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 touch-target ${
        OPTION_CLASSES[state] ?? OPTION_CLASSES.idle
      }`}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={state !== "idle"}
      aria-describedby={stateLabel ? `opt-state-${label}` : undefined}
    >
      <span
        className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border text-xs font-bold ${
          MARKER_CLASSES[state] ?? MARKER_CLASSES.idle
        }`}
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className="flex-1 leading-snug">{text}</span>
      {stateLabel && (
        <span id={`opt-state-${label}`} className="sr-only">{stateLabel}</span>
      )}
    </button>
  );
}

/** Feedback banner — auto-focuses so screen readers announce the result immediately. */
function Feedback({ isCorrect, correctText }) {
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);

  return (
    <div
      ref={ref}
      tabIndex={-1}
      className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 text-sm font-medium anim-scale-in focus:outline-none ${
        isCorrect
          ? "border-green-500/25 bg-green-500/10 text-green-400"
          : "border-red-500/25 bg-red-500/10 text-red-400"
      }`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="mt-0.5 flex-shrink-0 text-base">{isCorrect ? "✓" : "✕"}</span>
      <span>
        {isCorrect
          ? "Correct! Well done."
          : `Incorrect. The correct answer is: "${correctText}"`}
      </span>
    </div>
  );
}

/** Score screen — auto-focuses the first action button on mount. */
function ScoreScreen({ correct, total, wrongCount, onRetryWrong, onRestart }) {
  const pct = Math.round((correct / total) * 100);
  const primaryRef = useRef(null);

  useEffect(() => { primaryRef.current?.focus(); }, []);

  return (
    <div className="flex flex-col items-center px-6 py-12 text-center anim-fade-in">
      {/* Conic-gradient score ring */}
      <div
        className="mb-8 flex h-32 w-32 items-center justify-center rounded-full shadow-lg shadow-violet-500/20 anim-scale-in"
        style={{ background: `conic-gradient(#7c3aed ${pct}%, #1f2937 0)` }}
        aria-label={`Score: ${correct} out of ${total} — ${pct}%`}
        role="img"
      >
        <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-gray-950">
          <span className="font-['Plus_Jakarta_Sans',sans-serif] text-3xl font-extrabold text-white">
            {correct}
          </span>
          <span className="text-sm text-gray-500">/ {total}</span>
        </div>
      </div>

      <h3 className="mb-2 font-['Plus_Jakarta_Sans',sans-serif] text-2xl font-bold text-white">
        Quiz Complete!
      </h3>
      <p className="mb-8 max-w-xs text-sm leading-relaxed text-gray-500">
        {getScoreMessage(correct, total)}
      </p>

      <div className="flex flex-wrap justify-center gap-3">
        {wrongCount > 0 && (
          <button onClick={onRetryWrong} className={BTN_PRIMARY}>
            ↺ Retry Wrong Answers ({wrongCount})
          </button>
        )}
        <button ref={primaryRef} onClick={onRestart} className={BTN_GHOST}>
          ↩ Restart Quiz
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

/**
 * Quiz — step-by-step interactive quiz with keyboard shortcuts and scoring.
 *
 * Keyboard shortcuts (handled at section level):
 *  - 1–4  → select the corresponding answer option
 *  - Enter → advance after answering
 *
 * @param {{ questions: Array }} props
 */
export default function Quiz({ questions }) {
  const [activeQuestions, setActiveQuestions] = useState(questions);
  const [qIndex, setQIndex]     = useState(0);
  const [selected, setSelected] = useState(null);
  const [phase, setPhase]       = useState(PHASE.ANSWERING);
  const [wrongIndices, setWrongIndices] = useState([]);
  const [correctCount, setCorrectCount] = useState(0);

  if (!activeQuestions?.length) return null;

  const current    = activeQuestions[qIndex];
  const isLast     = qIndex === activeQuestions.length - 1;
  const isAnswered = phase === PHASE.FEEDBACK;
  const isCorrect  = selected === current.correctAnswer;
  // How many questions have been answered so far (for progress display)
  const answeredCount = qIndex + (isAnswered ? 1 : 0);

  // ── Shared state-reset helper (avoids identical code in retry & restart) ──
  const resetQuizState = useCallback(() => {
    setQIndex(0);
    setSelected(null);
    setPhase(PHASE.ANSWERING);
    setWrongIndices([]);
    setCorrectCount(0);
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSelect = useCallback(
    (optIdx) => {
      if (phase !== PHASE.ANSWERING) return;
      setSelected(optIdx);
      setPhase(PHASE.FEEDBACK);
      if (optIdx === current.correctAnswer) {
        setCorrectCount((c) => c + 1);
      } else {
        setWrongIndices((w) => [...w, qIndex]);
      }
    },
    [phase, current.correctAnswer, qIndex]
  );

  const handleNext = useCallback(() => {
    if (isLast) {
      setPhase(PHASE.DONE);
    } else {
      setQIndex((i) => i + 1);
      setSelected(null);
      setPhase(PHASE.ANSWERING);
    }
  }, [isLast]);

  const handleRetryWrong = useCallback(() => {
    setActiveQuestions(wrongIndices.map((i) => activeQuestions[i]));
    resetQuizState();
  }, [wrongIndices, activeQuestions, resetQuizState]);

  const handleRestart = useCallback(() => {
    setActiveQuestions(questions);
    resetQuizState();
  }, [questions, resetQuizState]);

  // ── Section-level keyboard shortcuts ─────────────────────────────────────

  const handleSectionKey = useCallback(
    (e) => {
      const numKey = parseInt(e.key, 10);
      if (
        phase === PHASE.ANSWERING &&
        numKey >= 1 &&
        numKey <= current.options.length
      ) {
        e.preventDefault();
        handleSelect(numKey - 1);
        return;
      }
      if (e.key === "Enter" && phase === PHASE.FEEDBACK) {
        e.preventDefault();
        handleNext();
      }
    },
    [phase, current.options.length, handleSelect, handleNext]
  );

  // ── Score screen ──────────────────────────────────────────────────────────

  if (phase === PHASE.DONE) {
    return (
      <section className="anim-fade-in" aria-label="Quiz results">
        <SectionHeader title="Quiz" icon="🧠" />
        <div className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900">
          <ScoreScreen
            correct={correctCount}
            total={activeQuestions.length}
            wrongCount={wrongIndices.length}
            onRetryWrong={handleRetryWrong}
            onRestart={handleRestart}
          />
        </div>
      </section>
    );
  }

  // ── Active question ───────────────────────────────────────────────────────

  return (
    <section className="anim-fade-in" aria-label="Quiz" onKeyDown={handleSectionKey}>
      {/* Live region — announces question number to screen readers */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {`Question ${qIndex + 1} of ${activeQuestions.length}`}
      </div>

      {/* Header with live score badge */}
      <div className="mb-6 flex items-center justify-between">
        <SectionHeader title="Quiz" icon="🧠" />
        <span
          className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-400"
          aria-live="polite"
          aria-label={`Score: ${correctCount} correct out of ${answeredCount} answered`}
        >
          Score: {correctCount}/{answeredCount}
        </span>
      </div>

      {/* Progress row */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500">
          Question {qIndex + 1} of {activeQuestions.length}
        </span>
        <span className="text-xs text-gray-600">
          {Math.round((answeredCount / activeQuestions.length) * 100)}%
        </span>
      </div>
      <ProgressBar current={answeredCount} total={activeQuestions.length} />

      {/* Question card */}
      <div className="mb-5 rounded-2xl border border-gray-800 bg-gray-900 px-5 py-5 sm:px-6">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-violet-400/70">
          Question {qIndex + 1}
        </p>
        <p className="text-base font-semibold leading-relaxed text-white sm:text-lg" id="quiz-question">
          {current.question}
        </p>
      </div>

      {/* Keyboard hint — shown only before answering, desktop only */}
      {!isAnswered && (
        <p className="mb-3 hidden text-xs text-gray-600 sm:block" aria-hidden="true">
          Press <kbd className={KBD_CLASS}>1</kbd>–
          <kbd className={KBD_CLASS}>{current.options.length}</kbd> to select
        </p>
      )}

      {/* Answer options */}
      <div className="mb-5 flex flex-col gap-2.5" role="group" aria-labelledby="quiz-question" aria-label="Answer choices">
        {current.options.map((opt, i) => {
          let state = "idle";
          if (isAnswered) {
            state = i === current.correctAnswer ? "correct" : i === selected ? "wrong" : "idle";
          } else if (i === selected) {
            state = "selected";
          }
          return (
            <OptionButton
              key={i}
              label={OPTION_LABELS[i] ?? String(i + 1)}
              text={opt}
              onClick={() => handleSelect(i)}
              disabled={isAnswered}
              state={state}
            />
          );
        })}
      </div>

      {/* Feedback + next */}
      {isAnswered && (
        <>
          <div className="mb-5">
            <Feedback isCorrect={isCorrect} correctText={current.options[current.correctAnswer]} />
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="hidden text-xs text-gray-600 sm:block" aria-hidden="true">
              Press <kbd className={KBD_CLASS}>Enter</kbd> to continue
            </p>
            <button onClick={handleNext} className={`ml-auto ${BTN_PRIMARY}`}>
              {isLast ? "See Results →" : "Next Question →"}
            </button>
          </div>
        </>
      )}
    </section>
  );
}

// ─── Shared section header ────────────────────────────────────────────────────

/** Reusable section heading used in both the active-question and score-screen views. */
function SectionHeader({ icon, title }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-lg" aria-hidden="true">
        {icon}
      </div>
      <h2 className="text-lg font-bold text-white">{title}</h2>
    </div>
  );
}
