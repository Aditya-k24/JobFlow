import * as chrono from "chrono-node";
import { normalizeDomain, domainToCompanyName } from "@/shared/utils";
import type { ParsedMessage } from "@/gmail/parser";

export interface ExtractedEntities {
  company_raw?: string;
  role_raw?: string;
  recruiter_name?: string;
  deadline_raw?: string;
  due_at?: number; // Unix ms
  links?: string[];
}

/**
 * Extract structured entities from a parsed email message.
 */
export function extractEntities(message: ParsedMessage): ExtractedEntities {
  const entities: ExtractedEntities = {};

  // Extract company from sender domain
  const domain = normalizeDomain(message.from_email);
  entities.company_raw = domainToCompanyName(domain);

  // Try to extract company from subject: "Re: [Role] at [Company]" pattern
  const atPattern = /(?:position|role|opportunity|job)\s+(?:at|@|with|for)\s+([A-Z][^,\n.!?]{2,40})/i;
  const subjectAtMatch = message.subject.match(atPattern) ?? message.body_text.slice(0, 500).match(atPattern);
  if (subjectAtMatch) {
    entities.company_raw = subjectAtMatch[1].trim();
  }

  // Try "Your application to [Company]" pattern
  const appPattern = /(?:application|applied)\s+(?:to|at|for)\s+([A-Z][^,\n.!?]{2,40})/i;
  const appMatch = message.subject.match(appPattern) ?? message.body_text.slice(0, 500).match(appPattern);
  if (appMatch) {
    entities.company_raw = appMatch[1].trim();
  }

  // Extract role from subject line
  entities.role_raw = extractRoleFromSubject(message.subject);

  // Extract recruiter/sender name from From header
  entities.recruiter_name = extractSenderName(message.from);

  // Extract links (for scheduling links, challenge links, etc.)
  entities.links = extractLinks(message.body_text);

  // Extract due date using chrono-node
  const { due_at, deadline_raw } = extractDeadline(message.body_text, message.received_at);
  if (due_at) {
    entities.due_at = due_at;
    entities.deadline_raw = deadline_raw;
  }

  return entities;
}

function extractRoleFromSubject(subject: string): string | undefined {
  // Common patterns: "Software Engineer - Application", "Your Application: Senior Dev at Acme"
  const patterns = [
    /^(?:re:\s*)?(.+?)\s*(?:application|position|role|opportunity)\s*(?:at|@|with|for|–|-)/i,
    /your application(?:\s+for)?:\s*(.+?)(?:\s+at\s+.+)?$/i,
    /^(?:re:\s*)?(.+?)\s*–\s*/i, // "Role Title – Company"
  ];

  for (const pattern of patterns) {
    const match = subject.match(pattern);
    if (match?.[1]) {
      return match[1].trim().replace(/^re:\s*/i, "");
    }
  }

  // Clean up the subject itself as a fallback
  const cleaned = subject
    .replace(/^re:\s*/i, "")
    .replace(/\s*[-–]\s*.*$/, "")
    .replace(/\s+(application|received|confirmation|update).*$/i, "")
    .trim();

  if (cleaned.length > 3 && cleaned.length < 80) {
    return cleaned;
  }

  return undefined;
}

function extractSenderName(from: string): string | undefined {
  // "John Smith <john@company.com>" → "John Smith"
  const nameMatch = from.match(/^"?([^"<]+)"?\s*</);
  if (nameMatch) {
    const name = nameMatch[1].trim();
    // Exclude generic names like "no-reply", "Greenhouse", etc.
    if (
      name.length > 1 &&
      !/no.?reply|do.?not.?reply|noreply|notification|team|support|hr\b/i.test(name)
    ) {
      return name;
    }
  }
  return undefined;
}

function extractLinks(body: string): string[] {
  const urlPattern = /https?:\/\/[^\s"'<>()]+/g;
  const matches = body.match(urlPattern) ?? [];

  // Filter to scheduling/challenge links
  const interestingDomains = [
    "calendly.com",
    "cal.com",
    "zoom.us",
    "teams.microsoft.com",
    "meet.google.com",
    "hackerrank.com",
    "codility.com",
    "codesignal.com",
    "lever.co",
    "greenhouse.io",
  ];

  return matches
    .filter((url) => interestingDomains.some((d) => url.includes(d)))
    .slice(0, 5); // Cap at 5 links
}

function extractDeadline(
  body: string,
  referenceTime: number
): { due_at?: number; deadline_raw?: string } {
  // Look for deadline context windows first
  const deadlineContextPatterns = [
    /(?:complete|submit|respond|due|deadline|expires?|finish|by)\s+(?:by\s+)?(.{5,80})/i,
    /(?:you have|within)\s+(.{5,50})\s+(?:to complete|to respond|days?)/i,
  ];

  // First try to find a date in a deadline context
  for (const pattern of deadlineContextPatterns) {
    const match = body.match(pattern);
    if (match) {
      const segment = match[0];
      const results = chrono.parse(segment, new Date(referenceTime), {
        forwardDate: true,
      });
      if (results.length > 0) {
        const parsed = results[0];
        const date = parsed.date();
        if (date.getTime() > referenceTime) {
          return {
            due_at: date.getTime(),
            deadline_raw: match[0].slice(0, 100).trim(),
          };
        }
      }
    }
  }

  // No deadline found
  return {};
}
