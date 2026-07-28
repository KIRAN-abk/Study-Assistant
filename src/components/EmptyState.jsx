// Hoist outside component — stable across every render
const EXAMPLES = [
  "The human digestive system",
  "Basics of quantum mechanics",
  "World War II key events",
  "Machine learning fundamentals",
];

/**
 * EmptyState — idle placeholder with example-topic chips.
 *
 * @param {{ onExampleClick: (text: string) => void }} props
 */
export default function EmptyState({ onExampleClick }) {
  return (
    <div
      className="flex flex-col items-center px-6 py-16 text-center anim-fade-in"
      role="region"
      aria-label="No content generated yet"
    >
      {/* Icon tile */}
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10 text-3xl shadow-inner shadow-violet-500/5">
        🎓
      </div>

      <h2 className="mb-2 text-lg font-semibold text-white">
        Your study session starts here
      </h2>
      <p className="mb-8 max-w-xs text-sm leading-relaxed text-gray-500">
        Paste your notes or describe any topic above. The AI will generate
        interactive flashcards and a quiz to help you learn.
      </p>

      {/* Example chips */}
      <div>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-gray-600">
          Try an example
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => onExampleClick(ex)}
              className="rounded-full border border-gray-800 bg-gray-900 px-4 py-1.5 text-xs font-medium text-gray-400 transition-all duration-200 hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
