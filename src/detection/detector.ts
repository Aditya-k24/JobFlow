import {
  DETECTION_RULES,
  type DetectionResult,
} from "./rules";
import type { ParsedMessage } from "@/gmail/parser";
import { truncate } from "@/shared/utils";

/**
 * Run all detection rules against a parsed message.
 * Returns the best-scoring result, or null if nothing matches.
 */
export function detectEvent(
  message: Pick<ParsedMessage, "subject" | "body_text" | "from_email" | "snippet">
): DetectionResult | null {
  const results: DetectionResult[] = [];

  for (const rule of DETECTION_RULES) {
    const matchedPatterns: string[] = [];
    let hits = 0;

    // Check subject patterns
    for (const pattern of rule.subjectPatterns) {
      if (pattern.test(message.subject)) {
        hits++;
        const match = message.subject.match(pattern);
        if (match) matchedPatterns.push(`subject: "${match[0]}"`);
      }
    }

    // Check body patterns
    for (const pattern of rule.bodyPatterns) {
      const match = message.body_text.match(pattern);
      if (match) {
        hits++;
        // Extract a short snippet around the match
        const idx = message.body_text.indexOf(match[0]);
        const start = Math.max(0, idx - 30);
        const end = Math.min(message.body_text.length, idx + match[0].length + 60);
        matchedPatterns.push(
          `body: "…${message.body_text.slice(start, end).trim()}…"`
        );
      }
    }

    // Check from patterns (lower weight)
    for (const pattern of rule.fromPatterns) {
      if (pattern.test(message.from_email)) {
        // From matches add half a hit
        hits += 0.5;
        matchedPatterns.push(`from: "${message.from_email}"`);
      }
    }

    if (hits >= rule.requiredMatches) {
      // Confidence: scaled by how many patterns matched vs. available
      const totalPatterns =
        rule.subjectPatterns.length +
        rule.bodyPatterns.length +
        rule.fromPatterns.length;
      const rawConfidence =
        totalPatterns > 0 ? Math.min(1, hits / Math.max(1, totalPatterns * 0.3)) : 0.5;
      const confidence = rawConfidence * rule.weight;

      // Find a good evidence snippet
      const evidenceSnippet = extractEvidenceSnippet(message, rule.bodyPatterns);

      results.push({
        eventType: rule.eventType,
        confidence,
        matchedPatterns,
        evidenceSnippet,
      });
    }
  }

  if (results.length === 0) return null;

  // Return the result with highest confidence
  results.sort((a, b) => b.confidence - a.confidence);

  // Reject DEADLINE if another event type also matched with higher confidence
  // (avoid false positives from date mentions in interview invites)
  if (results.length > 1 && results[0].eventType !== "DEADLINE") {
    return results[0];
  }

  return results[0];
}

function extractEvidenceSnippet(
  message: Pick<ParsedMessage, "body_text" | "snippet">,
  patterns: RegExp[]
): string {
  for (const pattern of patterns) {
    const match = message.body_text.match(pattern);
    if (match && match.index !== undefined) {
      const start = Math.max(0, match.index - 20);
      const end = Math.min(
        message.body_text.length,
        match.index + match[0].length + 100
      );
      return truncate(message.body_text.slice(start, end).trim(), 200);
    }
  }
  // Fall back to snippet
  return truncate(message.snippet, 200);
}
