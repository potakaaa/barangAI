// ─────────────────────────────────────────────────────────────────────────────
// LLM Provider: OpenAI
// Thin wrapper around the OpenAI Chat Completions API. All prompt engineering
// and result mapping lives in shared.ts — this file only handles the HTTP call.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  ReportParser,
  ClarificationResolver,
} from "../types.ts";

import {
  type LLMJsonCall,
  createParser,
  createClarificationResolverFromLLM,
} from "./shared.ts";

// ---------------------------------------------------------------------------
// Core LLM call — the only OpenAI-specific logic
// ---------------------------------------------------------------------------

/**
 * Creates an OpenAI-backed LLMJsonCall.
 *
 * This is the single point of contact with the OpenAI API.
 * Everything else (prompts, result mapping) is handled by shared.ts.
 */
function createOpenAILLMCall(
  apiKey: string,
  model = "gpt-4o-mini"
): LLMJsonCall {
  return async (
    systemPrompt: string,
    userText: string
  ): Promise<Record<string, unknown>> => {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        response_format: { type: "json_object" },
        temperature: 0.1,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userText },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OpenAI API error ${response.status}: ${body}`);
    }

    const data = await response.json();
    const content: string = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("OpenAI returned empty content");

    try {
      return JSON.parse(content);
    } catch {
      throw new Error(`Failed to parse OpenAI JSON output: ${content}`);
    }
  };
}

// ---------------------------------------------------------------------------
// Public factories
// ---------------------------------------------------------------------------

/**
 * Creates an OpenAI-backed ReportParser.
 *
 * @param apiKey  OpenAI API key (from Deno.env)
 * @param model   Defaults to 'gpt-4o-mini' — cheap, fast, sufficient for extraction
 */
export function createOpenAIParser(
  apiKey: string,
  model = "gpt-4o-mini"
): ReportParser {
  return createParser(createOpenAILLMCall(apiKey, model));
}

/**
 * Creates an OpenAI-backed ClarificationResolver.
 */
export function createOpenAIClarificationResolver(
  apiKey: string,
  model = "gpt-4o-mini"
): ClarificationResolver {
  return createClarificationResolverFromLLM(createOpenAILLMCall(apiKey, model));
}
