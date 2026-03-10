import type { GmailMessage, GmailMessagePart } from "@/types/gmail";
import { base64urlDecode } from "@/shared/utils";

export interface ParsedMessage {
  subject: string;
  from: string;
  from_email: string;
  from_domain: string;
  date: string;
  received_at: number; // Unix ms
  body_text: string;
  snippet: string;
  thread_id: string;
  message_id: string; // RFC5322 Message-ID header
}

/**
 * Parse a Gmail API message into a structured format.
 */
export function parseGmailMessage(message: GmailMessage): ParsedMessage {
  const headers = message.payload?.headers ?? [];
  const getHeader = (name: string) =>
    headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";

  const subject = getHeader("Subject") || "(no subject)";
  const from = getHeader("From");
  const dateHeader = getHeader("Date");
  const messageIdHeader = getHeader("Message-ID");

  // Parse from field: "Name <email@domain.com>" or "email@domain.com"
  const emailMatch = from.match(/<([^>]+)>/) ?? from.match(/(\S+@\S+)/);
  const from_email = emailMatch ? emailMatch[1].toLowerCase() : from.toLowerCase();
  const from_domain = from_email.includes("@")
    ? from_email.split("@")[1]
    : from_email;

  // Received timestamp from Gmail's internalDate (Unix ms as string)
  const received_at = message.internalDate
    ? parseInt(message.internalDate, 10)
    : Date.parse(dateHeader) || Date.now();

  // Extract body text
  const body_text = extractBodyText(message.payload);

  return {
    subject,
    from,
    from_email,
    from_domain,
    date: dateHeader,
    received_at,
    body_text,
    snippet: message.snippet ?? "",
    thread_id: message.threadId,
    message_id: messageIdHeader,
  };
}

/**
 * Walk the MIME tree to find plain text body.
 * Falls back to HTML (stripped of tags) if no plain text found.
 */
function extractBodyText(part: GmailMessagePart | undefined): string {
  if (!part) return "";

  // Direct text/plain part
  if (part.mimeType === "text/plain" && part.body?.data) {
    return decodeBase64urlBody(part.body.data);
  }

  // text/html fallback
  if (part.mimeType === "text/html" && part.body?.data) {
    const html = decodeBase64urlBody(part.body.data);
    return stripHtmlTags(html);
  }

  // Recurse into multipart
  if (part.parts) {
    // Prefer text/plain
    const plainPart = findPartByMimeType(part.parts, "text/plain");
    if (plainPart?.body?.data) {
      return decodeBase64urlBody(plainPart.body.data);
    }

    // Fall back to HTML
    const htmlPart = findPartByMimeType(part.parts, "text/html");
    if (htmlPart?.body?.data) {
      return stripHtmlTags(decodeBase64urlBody(htmlPart.body.data));
    }

    // Recurse further
    for (const subPart of part.parts) {
      const text = extractBodyText(subPart);
      if (text) return text;
    }
  }

  return "";
}

function findPartByMimeType(
  parts: GmailMessagePart[],
  mimeType: string
): GmailMessagePart | undefined {
  for (const part of parts) {
    if (part.mimeType === mimeType) return part;
    if (part.parts) {
      const found = findPartByMimeType(part.parts, mimeType);
      if (found) return found;
    }
  }
  return undefined;
}

function decodeBase64urlBody(data: string): string {
  try {
    const bytes = base64urlDecode(data);
    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    return "";
  }
}

function stripHtmlTags(html: string): string {
  // Remove style and script blocks first
  let text = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");

  // Replace common block elements with newlines
  text = text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(p|div|tr|li|h[1-6])[^>]*>/gi, "\n");

  // Strip remaining tags
  text = text.replace(/<[^>]+>/g, "");

  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Collapse whitespace
  return text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}
