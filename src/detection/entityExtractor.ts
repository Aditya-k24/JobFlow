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

// ATS/recruiting platforms that are NOT company names.
// When the sender domain matches one of these, we must extract
// the actual employer from the email body instead.
const ATS_DOMAINS = new Set([
  "greenhouse.io",
  "lever.co",
  "workday.com",
  "myworkdayjobs.com",
  "smartrecruiters.com",
  "icims.com",
  "taleo.net",
  "jobvite.com",
  "successfactors.com",
  "ashbyhq.com",
  "rippling.com",
  "breezy.hr",
  "recruitee.com",
  "bamboohr.com",
  "workable.com",
  "jazz.co",
  "pinpoint.works",
  "indeed.com",
  "linkedin.com",
  "ziprecruiter.com",
  "glassdoor.com",
  "hired.com",
  "angellist.com",
  "wellfound.com",
]);

// Ordered list of extraction strategies — returns first successful match.
const COMPANY_PATTERNS: RegExp[] = [
  // "Your application to Acme Corp" / "applied to Acme"
  /(?:your\s+)?application\s+(?:to|at|for|with)\s+([A-Z][^,\n.!?]{1,50})/i,
  // "We at Acme" / "team at Acme" / "here at Acme"
  /(?:we\s+)?(?:here\s+)?at\s+([A-Z][^,\n.!?]{1,50})(?:,|\s+we|\s+are|\s+is|\s+look)/i,
  // "join Acme Corp" / "joining Acme"
  /\bjoin(?:ing)?\s+([A-Z][^,\n.!?]{1,50})/i,
  // "position at Acme" / "role at Acme" / "job at Acme"
  /(?:position|role|opportunity|job|opening)\s+(?:at|@|with|for)\s+([A-Z][^,\n.!?]{1,50})/i,
  // "Acme is excited" / "Acme would like"
  /^([A-Z][a-zA-Z0-9\s&.',-]{1,40})\s+(?:is|would|has|team|hiring|wants)/m,
  // "interview with Acme" / "call with Acme"
  /(?:interview|call|chat|conversation)\s+with\s+([A-Z][^,\n.!?]{1,50})/i,
  // "from the Acme team" / "the Acme recruiting team"
  /(?:from\s+the\s+|the\s+)([A-Z][^,\n.!?]{1,40})\s+(?:team|recruiting|talent|hr)/i,
  // "offer from Acme"
  /offer\s+from\s+([A-Z][^,\n.!?]{1,50})/i,
];

/**
 * Extract structured entities from a parsed email message.
 */
export function extractEntities(message: ParsedMessage): ExtractedEntities {
  const entities: ExtractedEntities = {};

  // Determine if sender is an ATS (not the actual company)
  const senderDomain = normalizeDomain(message.from_email);
  const senderIsAts = isAtsDomain(senderDomain);

  // Start with domain-derived name as lowest-priority fallback
  if (!senderIsAts) {
    entities.company_raw = domainToCompanyName(senderDomain);
  }

  // Extract company name from subject + body using ordered patterns
  const searchText = `${message.subject}\n${message.body_text.slice(0, 1000)}`;
  const extracted = extractCompanyFromText(searchText);
  if (extracted) {
    entities.company_raw = extracted;
  }

  // If still no company and sender is ATS, mark as unknown for now
  // (the chain matcher will update it when better evidence arrives)
  if (!entities.company_raw && senderIsAts) {
    entities.company_raw = extractCompanyFromSubject(message.subject) ?? undefined;
  }

  // Extract role from subject line
  entities.role_raw = extractRoleFromSubject(message.subject);

  // Extract recruiter/sender name
  entities.recruiter_name = extractSenderName(message.from);

  // Extract scheduling/challenge links
  entities.links = extractLinks(message.body_text);

  // Extract deadline using chrono-node
  const { due_at, deadline_raw } = extractDeadline(message.body_text, message.received_at);
  if (due_at) {
    entities.due_at = due_at;
    entities.deadline_raw = deadline_raw;
  }

  return entities;
}

function isAtsDomain(domain: string): boolean {
  // Direct match
  if (ATS_DOMAINS.has(domain)) return true;
  // Subdomain match: e.g. "company.greenhouse.io" → still ATS
  for (const ats of ATS_DOMAINS) {
    if (domain.endsWith(`.${ats}`) || domain === ats) return true;
  }
  return false;
}

function extractCompanyFromText(text: string): string | null {
  for (const pattern of COMPANY_PATTERNS) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const candidate = match[1].trim().replace(/[.,!?]$/, "").trim();
      // Reject if it looks like a generic word or is too short/long
      if (isValidCompanyName(candidate)) {
        return candidate;
      }
    }
  }
  return null;
}

// Fallback: try to extract "Company" from subject "Re: Role at Company"
function extractCompanyFromSubject(subject: string): string | null {
  const match = subject.match(/\bat\s+([A-Z][^,\n.!?–-]{1,40})$/i);
  if (match?.[1]) {
    const candidate = match[1].trim();
    if (isValidCompanyName(candidate)) return candidate;
  }
  return null;
}

const GENERIC_WORDS = new Set([
  "the", "our", "your", "their", "this", "that", "we", "us", "you",
  "team", "company", "organization", "firm", "group", "inc", "llc",
  "a", "an", "is", "are", "was", "been", "be", "have", "has",
]);

function isValidCompanyName(name: string): boolean {
  if (name.length < 2 || name.length > 60) return false;
  const lower = name.toLowerCase().trim();
  if (GENERIC_WORDS.has(lower)) return false;
  // Must start with a letter
  if (!/^[A-Za-z]/.test(name)) return false;
  return true;
}

function extractRoleFromSubject(subject: string): string | undefined {
  const patterns = [
    // "Software Engineer - Application Received"
    /^(?:re:\s*)?(.+?)\s*[-–]\s*(?:application|position|role|opportunity)/i,
    // "Your Application: Senior Dev at Acme" → "Senior Dev"
    /your application(?:\s+for)?:\s*(.+?)(?:\s+at\s+.+)?$/i,
    // "Interview for Senior Engineer"
    /(?:interview|assessment|offer)\s+for\s+(?:the\s+)?(.+?)(?:\s+(?:at|position|role)|\s*$)/i,
    // "Senior Engineer at Acme" → "Senior Engineer"
    /^(?:re:\s*)?(.+?)\s+at\s+[A-Z]/i,
  ];

  for (const pattern of patterns) {
    const match = subject.match(pattern);
    if (match?.[1]) {
      const role = match[1].trim().replace(/^re:\s*/i, "");
      if (role.length > 2 && role.length < 80) return role;
    }
  }

  // Last resort: strip noise words and use what's left
  const cleaned = subject
    .replace(/^re:\s*/i, "")
    .replace(/\s*[-–]\s*(application|received|confirmation|update|invitation|invite).*$/i, "")
    .replace(/\s+(application|received|confirmation|update).*$/i, "")
    .trim();

  if (cleaned.length > 3 && cleaned.length < 80) return cleaned;
  return undefined;
}

function extractSenderName(from: string): string | undefined {
  const nameMatch = from.match(/^"?([^"<]+)"?\s*</);
  if (nameMatch) {
    const name = nameMatch[1].trim();
    if (
      name.length > 1 &&
      !/no.?reply|do.?not.?reply|noreply|notification|team|support|hr\b|talent|recruiting|greenhouse|lever|workday/i.test(name)
    ) {
      return name;
    }
  }
  return undefined;
}

function extractLinks(body: string): string[] {
  const urlPattern = /https?:\/\/[^\s"'<>()]+/g;
  const matches = body.match(urlPattern) ?? [];
  const interestingDomains = [
    "calendly.com", "cal.com", "zoom.us", "teams.microsoft.com",
    "meet.google.com", "hackerrank.com", "codility.com", "codesignal.com",
    "lever.co", "greenhouse.io",
  ];
  return matches
    .filter((url) => interestingDomains.some((d) => url.includes(d)))
    .slice(0, 5);
}

function extractDeadline(
  body: string,
  referenceTime: number
): { due_at?: number; deadline_raw?: string } {
  const deadlineContextPatterns = [
    /(?:complete|submit|respond|due|deadline|expires?|finish|by)\s+(?:by\s+)?(.{5,80})/i,
    /(?:you have|within)\s+(.{5,50})\s+(?:to complete|to respond|days?)/i,
  ];

  for (const pattern of deadlineContextPatterns) {
    const match = body.match(pattern);
    if (match) {
      const results = chrono.parse(match[0], new Date(referenceTime), { forwardDate: true });
      if (results.length > 0) {
        const date = results[0].date();
        if (date.getTime() > referenceTime) {
          return { due_at: date.getTime(), deadline_raw: match[0].slice(0, 100).trim() };
        }
      }
    }
  }
  return {};
}
