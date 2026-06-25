// ─────────────────────────────────────────────────────────────────────────────
// LLM Provider: Gemini
// Thin wrapper around the Gemini API. All prompt engineering and result
// mapping lives in shared.ts — this file only handles the HTTP call.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  ReportParser,
  ClarificationResolver,
} from "../types.ts";

import {
  type LLMJsonCall,
  createParser,
  createClarificationResolverFromLLM,
  createSynthesizerFromLLM,
} from "./shared.ts";

// ---------------------------------------------------------------------------
// Gemini API types (minimal)
// ---------------------------------------------------------------------------

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
    finishReason: string;
  }>;
  promptFeedback?: { blockReason?: string };
}

// ---------------------------------------------------------------------------
// Core LLM call — the only Gemini-specific logic
// ---------------------------------------------------------------------------

const GEMINI_API_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models";

/**
 * Creates a Gemini-backed LLMJsonCall.
 *
 * This is the single point of contact with the Gemini API.
 * Everything else (prompts, result mapping) is handled by shared.ts.
 */
export function createGeminiLLMCall(
  apiKey: string,
  model = "gemini-3.5-flash"
): LLMJsonCall {
  const endpoint = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`;

  return async (
    systemPrompt: string,
    userText: string
  ): Promise<Record<string, unknown>> => {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: userText }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${body}`);
    }

    const data: GeminiResponse = await response.json();

    // Check for content blocking
    if (data.promptFeedback?.blockReason) {
      throw new Error(
        `Gemini blocked the prompt: ${data.promptFeedback.blockReason}`
      );
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Gemini returned empty content");

    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`Failed to parse Gemini JSON output: ${text}`);
    }
  };
}

// ---------------------------------------------------------------------------
// Public factories
// ---------------------------------------------------------------------------

/**
 * Creates a Gemini-backed ReportParser.
 *
 * @param apiKey  Gemini API key — get from https://aistudio.google.com/apikey
 * @param model   Defaults to 'gemini-3.5-flash' — fast and cost-effective
 */
export function createGeminiParser(
  apiKey: string,
  model = "gemini-3.5-flash"
): ReportParser {
  return createParser(createGeminiLLMCall(apiKey, model));
}

/**
 * Creates a Gemini-backed ClarificationResolver.
 */
export function createClarificationResolver(
  apiKey: string,
  model = "gemini-3.5-flash"
): ClarificationResolver {
  return createClarificationResolverFromLLM(createGeminiLLMCall(apiKey, model));
}

/**
 * Creates a Gemini-backed SummarySynthesizer.
 */
export function createGeminiSynthesizer(
  apiKey: string,
  model = "gemini-3.5-flash"
): import("../types.ts").SummarySynthesizer {
  return createSynthesizerFromLLM(createGeminiLLMCall(apiKey, model));
}
