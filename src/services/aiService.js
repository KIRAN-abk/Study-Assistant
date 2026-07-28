/**
 * aiService.js
 * Groq API integration for Study Assistant.
 *
 * Reads VITE_GROQ_API_KEY from the environment (set in .env).
 * Returns validated study content matching the expected JSON schema.
 *
 * JSON schema expected:
 * {
 *   "title": string,
 *   "flashcards": [{ "question": string, "answer": string }],
 *   "quiz": [{
 *     "question": string,
 *     "options": [string, string, string, string],
 *     "correctAnswer": number   // 0-based index into options[]
 *   }]
 * }
 */

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const MODEL = "llama-3.1-8b-instant"; // Groq Llama 3.1 model
const TIMEOUT_MS = 30_000;

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

function buildPrompt(notes) {
  return `Analyse the following notes or topic and generate study material.

CRITICAL RULES — you MUST follow ALL of them:
1. Respond with ONLY a single, valid JSON object. No markdown, no code fences, no extra text before or after the JSON.
2. The JSON must conform to this exact schema:
{
  "title": "<concise title for this study set>",
  "flashcards": [
    { "question": "<question>", "answer": "<detailed answer>" }
  ],
  "quiz": [
    {
      "question": "<question>",
      "options": ["<option A>", "<option B>", "<option C>", "<option D>"],
      "correctAnswer": <0-based index of the correct option>
    }
  ]
}
3. Generate at least 5 flashcards and at least 5 quiz questions.
4. Each quiz question must have exactly 4 options.
5. correctAnswer must be a number (0, 1, 2, or 3), never a string.
6. Do NOT repeat the same question in flashcards and quiz.
7. Flashcard answers should be thorough (2–4 sentences). Quiz options should be plausible distractors.

NOTES / TOPIC:
"""
${notes}
"""

Respond with ONLY the JSON object now:`;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateResponse(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("AI response is not a valid JSON object.");
  }

  if (typeof data.title !== "string" || data.title.trim() === "") {
    throw new Error('AI response is missing a valid "title" field.');
  }

  if (!Array.isArray(data.flashcards) || data.flashcards.length === 0) {
    throw new Error('AI response must include a non-empty "flashcards" array.');
  }
  for (const [i, card] of data.flashcards.entries()) {
    if (typeof card.question !== "string" || typeof card.answer !== "string") {
      throw new Error(`Flashcard at index ${i} is missing a "question" or "answer" field.`);
    }
  }

  if (!Array.isArray(data.quiz) || data.quiz.length === 0) {
    throw new Error('AI response must include a non-empty "quiz" array.');
  }
  for (const [i, item] of data.quiz.entries()) {
    if (typeof item.question !== "string") {
      throw new Error(`Quiz item at index ${i} is missing a "question" field.`);
    }
    if (!Array.isArray(item.options) || item.options.length < 2) {
      throw new Error(`Quiz item at index ${i} must have at least 2 "options".`);
    }
    if (
      typeof item.correctAnswer !== "number" ||
      !Number.isInteger(item.correctAnswer) ||
      item.correctAnswer < 0 ||
      item.correctAnswer >= item.options.length
    ) {
      throw new Error(`Quiz item at index ${i} has an invalid "correctAnswer" index.`);
    }
  }
}

// ---------------------------------------------------------------------------
// Response parser
// ---------------------------------------------------------------------------

function parseGroqResponse(responseBody) {
  const choice = responseBody?.choices?.[0];
  if (!choice) {
    throw new Error("Groq returned no content. The request may have been blocked.");
  }

  const finishReason = choice.finish_reason;
  if (finishReason && finishReason !== "stop") {
    throw new Error(`AI stopped generating due to: ${finishReason}. Try different notes.`);
  }

  const rawText = choice.message?.content ?? "";
  if (!rawText.trim()) {
    throw new Error("Groq returned an empty response. Please try again.");
  }

  // Strip markdown code fences if the model wrapped the JSON anyway
  const cleaned = rawText
    .replace(/^\uFEFF/, "")           // strip BOM
    .replace(/^```(?:json)?\s*/i, "") // opening fence
    .replace(/\s*```$/,          "")  // closing fence
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error("AI returned a response that could not be parsed as JSON. Please try again.");
  }
}

// ---------------------------------------------------------------------------
// Error classifier
// ---------------------------------------------------------------------------

function classifyHttpError(status, body) {
  switch (status) {
    case 400:
      return "Bad request sent to AI — the prompt may be malformed.";
    case 401:
    case 403:
      return "Invalid or missing Groq API key. Check your VITE_GROQ_API_KEY in .env.";
    case 429:
      return "Groq API rate limit reached. Please wait a moment and try again.";
    case 500:
    case 503:
      return "Groq service is temporarily unavailable. Please try again shortly.";
    default:
      return `API error (HTTP ${status}). Please try again.`;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function generateStudyContent(notes, signal) {
  if (!API_KEY) {
    throw new Error("Groq API key is not configured. Add VITE_GROQ_API_KEY to your .env file.");
  }

  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), TIMEOUT_MS);
  const combinedSignal = signal
    ? AbortSignal.any([signal, timeoutController.signal])
    : timeoutController.signal;

  const requestBody = {
    model: MODEL,
    messages: [
      {
        role: "system",
        content: "You are a study assistant that ONLY outputs raw, valid JSON."
      },
      {
        role: "user",
        content: buildPrompt(notes)
      }
    ],
    response_format: { type: "json_object" },
    temperature: 0.4,
  };

  let response;
  try {
    response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify(requestBody),
      signal: combinedSignal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      if (timeoutController.signal.aborted) {
        throw new Error(`The request timed out after ${TIMEOUT_MS / 1000} seconds. Please try again.`);
      }
      throw err;
    }
    throw new Error("Network error — could not reach the Groq API. Check your internet connection.");
  }

  clearTimeout(timeoutId);

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error("Groq API Error Response:", body);
    throw new Error(classifyHttpError(response.status, body));
  }

  let jsonBody;
  try {
    jsonBody = await response.json();
  } catch {
    throw new Error("Received a malformed response from the Groq API. Please try again.");
  }

  const data = parseGroqResponse(jsonBody);
  validateResponse(data);
  return data;
}
