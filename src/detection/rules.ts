import type { EventType } from "@/types/event";

export interface DetectionRule {
  eventType: EventType;
  weight: number; // Contribution to confidence
  subjectPatterns: RegExp[];
  bodyPatterns: RegExp[];
  fromPatterns: RegExp[];
  requiredMatches: number; // Minimum pattern hits to trigger
}

export const DETECTION_RULES: DetectionRule[] = [
  // ─── REJECTION ───────────────────────────────────────────────────────────────
  {
    eventType: "REJECTION",
    weight: 0.9,
    subjectPatterns: [
      /update.*application/i,
      /application.*update/i,
      /regarding.*application/i,
      /decision.*application/i,
    ],
    bodyPatterns: [
      /we.?re? not (moving|proceeding) forward/i,
      /not (selected|moving forward|advancing)/i,
      /we regret to inform/i,
      /thank you for your (interest|time|application).*unfortunately/i,
      /unfortunately.*not (selected|moving forward|able to)/i,
      /we (have decided|will not be|are unable to) (move forward|proceed|offer)/i,
      /decided to (pursue|move forward with) (other|another) candidate/i,
      /position has been filled/i,
      /no longer.*moving forward/i,
      /not (a|the right) fit/i,
      /will not be (inviting|moving|proceeding)/i,
    ],
    fromPatterns: [
      /no.?reply/i,
      /do.?not.?reply/i,
      /greenhouse/i,
      /lever\.co/i,
      /workday/i,
    ],
    requiredMatches: 1, // Any one body pattern is enough
  },

  // ─── APPLICATION RECEIVED ────────────────────────────────────────────────────
  {
    eventType: "APPLICATION_RECEIVED",
    weight: 0.85,
    subjectPatterns: [
      /application (received|submitted|confirmed)/i,
      /thank you for (applying|your application)/i,
      /we received your application/i,
      /application confirmation/i,
    ],
    bodyPatterns: [
      /we (have )?received your application/i,
      /thank you for (applying|your interest in)/i,
      /your application (has been|was) (received|submitted)/i,
      /successfully applied/i,
      /application is (being reviewed|under review)/i,
      /we.?ll (be in touch|review your application)/i,
    ],
    fromPatterns: [
      /greenhouse/i,
      /lever\.co/i,
      /workday/i,
      /smartrecruiters/i,
      /icims/i,
      /taleo/i,
      /jobvite/i,
      /successfactors/i,
      /myworkday/i,
    ],
    requiredMatches: 1,
  },

  // ─── INTERVIEW INVITE ────────────────────────────────────────────────────────
  {
    eventType: "INTERVIEW_INVITE",
    weight: 0.9,
    subjectPatterns: [
      /interview (invitation|invite|request|scheduled|confirmation)/i,
      /schedule.*interview/i,
      /interview.*schedule/i,
      /phone (screen|interview)/i,
      /video (call|interview)/i,
      /technical (screen|interview)/i,
    ],
    bodyPatterns: [
      /would like to (schedule|invite you to|set up) (a|an) (interview|call|chat)/i,
      /invite you (for|to) (a|an) (interview|phone screen|video call)/i,
      /schedule (a|an) (interview|call|conversation)/i,
      /(interview|call) is scheduled/i,
      /looking forward to (speaking|talking|chatting) with you/i,
      /calendly|cal\.com|calendlylink/i,
      /zoom\.us\/j\//i,
      /teams\.microsoft\.com\/l\/meetup/i,
    ],
    fromPatterns: [
      /recruit/i,
      /hr@/i,
      /talent@/i,
      /hiring@/i,
      /calendly/i,
    ],
    requiredMatches: 1,
  },

  // ─── ASSESSMENT INVITE ───────────────────────────────────────────────────────
  {
    eventType: "ASSESSMENT_INVITE",
    weight: 0.88,
    subjectPatterns: [
      /coding (challenge|assessment|test)/i,
      /take.home (assignment|project|test)/i,
      /technical (assessment|test|challenge)/i,
      /assessment invite/i,
      /hackerrank/i,
      /codility/i,
      /codesignal/i,
      /pymetrics/i,
      /vervoe/i,
    ],
    bodyPatterns: [
      /coding (challenge|assessment|test)/i,
      /take.home (assignment|project)/i,
      /technical (assessment|test|exercise)/i,
      /complete (the|this|a|an) (assessment|challenge|test)/i,
      /hackerrank\.com/i,
      /codility\.com/i,
      /codesignal\.com/i,
      /submit (your|a) (solution|code|work) by/i,
      /you have .{3,20} to complete/i,
    ],
    fromPatterns: [
      /hackerrank/i,
      /codility/i,
      /codesignal/i,
      /recruit/i,
    ],
    requiredMatches: 1,
  },

  // ─── OFFER ───────────────────────────────────────────────────────────────────
  {
    eventType: "OFFER",
    weight: 0.95,
    subjectPatterns: [
      /offer letter/i,
      /job offer/i,
      /offer of employment/i,
      /congratulations.*offer/i,
      /we.?d like to offer/i,
    ],
    bodyPatterns: [
      /pleased to (offer|extend an offer)/i,
      /offer (of employment|letter)/i,
      /we.?d like to offer you/i,
      /offer.*position.*at/i,
      /compensation package/i,
      /start date.*salary|salary.*start date/i,
      /sign.*offer (letter|by)/i,
    ],
    fromPatterns: [],
    requiredMatches: 1,
  },

  // ─── DEADLINE ────────────────────────────────────────────────────────────────
  // Note: This rule is supplementary; the entity extractor also finds deadlines.
  {
    eventType: "DEADLINE",
    weight: 0.7,
    subjectPatterns: [],
    bodyPatterns: [
      /complete (by|before|no later than)/i,
      /due (by|date|on|before)/i,
      /deadline (is|of|on)/i,
      /submit (by|before|no later than)/i,
      /respond (by|before|no later than)/i,
      /expires? (on|in|by)/i,
      /valid (for|until)/i,
    ],
    fromPatterns: [],
    requiredMatches: 1,
  },
];

export interface DetectionResult {
  eventType: EventType;
  confidence: number;
  matchedPatterns: string[];
  evidenceSnippet: string;
}
