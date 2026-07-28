import { useState, useCallback, useRef, useEffect } from "react";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import ResultsPage from "./pages/ResultsPage";
import { generateStudyContent } from "./services/aiService";

/**
 * App — root component managing top-level routing (home ↔ results)
 * and the AI generation lifecycle.
 *
 * Accessibility additions:
 *  - Skip-to-main link (visible on keyboard focus)
 *  - Focus trap inside loading overlay
 *  - Auto-focus the error retry button when an error appears
 *  - aria-live regions on both overlay and toast
 */
export default function App() {
  const [view, setView] = useState("home");
  const [studyData, setStudyData] = useState(null);
  const [error, setError] = useState(null);
  const [notes, setNotes] = useState("");

  const abortRef = useRef(null);

  const handleGenerate = useCallback(async (inputNotes) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setNotes(inputNotes);
    setView("loading");
    setError(null);

    try {
      const data = await generateStudyContent(inputNotes, controller.signal);
      if (!controller.signal.aborted) {
        setStudyData(data);
        setView("results");
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        const message =
          err.name === "AbortError"
            ? "The request was cancelled. Please try again."
            : err.message || "An unexpected error occurred. Please try again.";
        setError(message);
        setView("error");
      }
    }
  }, []);

  const handleBack = useCallback(() => {
    abortRef.current?.abort();
    setView("home");
    setStudyData(null);
    setError(null);
  }, []);

  const handleRetry = useCallback(() => {
    if (notes) handleGenerate(notes);
  }, [notes, handleGenerate]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Skip-to-content link — only visible on :focus */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <Navbar />

      {(view === "home" || view === "loading" || view === "error") && (
        <HomeWithState
          view={view}
          error={error}
          onGenerate={handleGenerate}
          onRetry={handleRetry}
        />
      )}

      {view === "results" && studyData && (
        <ResultsPage data={studyData} onBack={handleBack} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// HomeWithState — loading overlay + error toast layered over HomePage
// ---------------------------------------------------------------------------

function LoadingOverlay() {
  // Trap focus inside the overlay while it is visible
  const overlayRef = useRef(null);

  useEffect(() => {
    const prev = document.activeElement;
    overlayRef.current?.focus();
    return () => prev?.focus();
  }, []);

  // Prevent keyboard from reaching elements beneath the overlay
  const trapKeys = (e) => {
    if (e.key === "Tab") e.preventDefault();
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-gray-950/85 backdrop-blur-sm anim-fade-in"
      role="dialog"
      aria-modal="true"
      aria-live="assertive"
      aria-label="Generating your study set, please wait"
      tabIndex={-1}
      onKeyDown={trapKeys}
    >
      {/* Dual-ring spinner */}
      <div className="relative flex h-16 w-16 items-center justify-center" aria-hidden="true">
        <div className="absolute inset-0 rounded-full border-2 border-violet-500/15" />
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-violet-500" />
        <div
          className="absolute inset-2 animate-spin rounded-full border-2 border-transparent border-b-cyan-400"
          style={{ animationDuration: "1.4s", animationDirection: "reverse" }}
        />
        <span className="text-sm text-violet-400" aria-hidden="true">✦</span>
      </div>

      <div className="text-center">
        <p className="mb-1 font-semibold text-white">Generating your study set…</p>
        {/* Animated dots give a visual heartbeat */}
        <p className="flex items-center justify-center gap-1.5 text-sm text-gray-500" aria-hidden="true">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-gray-500 dot-1" />
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-gray-500 dot-2" />
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-gray-500 dot-3" />
        </p>
        <p className="mt-2 text-xs text-gray-600">This usually takes a few seconds</p>
      </div>
    </div>
  );
}

function ErrorToast({ error, onRetry }) {
  const retryRef = useRef(null);

  // Auto-focus the Retry button so keyboard users can act immediately
  useEffect(() => {
    retryRef.current?.focus();
  }, []);

  // Dismiss on Escape
  const handleKey = (e) => {
    if (e.key === "Escape") onRetry();
  };

  return (
    <div
      className="fixed bottom-6 left-1/2 z-50 flex w-[min(92vw,480px)] -translate-x-1/2 items-start gap-3 rounded-2xl border border-red-500/20 bg-gray-900 px-5 py-4 shadow-2xl shadow-black/60 anim-fade-in"
      role="alertdialog"
      aria-live="assertive"
      aria-atomic="true"
      onKeyDown={handleKey}
    >
      <span className="mt-0.5 flex-shrink-0 text-lg text-red-400" aria-hidden="true">⚠</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-red-400">Generation failed</p>
        <p className="mt-0.5 text-xs leading-relaxed text-red-400/75">{error}</p>
      </div>
      <button
        ref={retryRef}
        onClick={onRetry}
        className="flex-shrink-0 rounded-lg border border-red-500/25 px-3 py-1.5 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 touch-target"
      >
        Retry
      </button>
    </div>
  );
}

function HomeWithState({ view, error, onGenerate, onRetry }) {
  return (
    <>
      <HomePage onSuccess={onGenerate} isLoading={view === "loading"} />
      {view === "loading" && <LoadingOverlay />}
      {view === "error" && error && <ErrorToast error={error} onRetry={onRetry} />}
    </>
  );
}
