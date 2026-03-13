// Glance AI – Demo Seed Script
// Paste this entire script into the DevTools console of the Glance AI extension window.
// Open the window first (click the extension icon), then right-click → Inspect → Console.

(async () => {
  const DB_NAME = "glanceai";
  const DB_VERSION = 1;

  // ── helpers ──────────────────────────────────────────────────────────────────
  const uuid = () => crypto.randomUUID();
  const daysAgo  = (d) => Date.now() - d * 86_400_000;
  const daysFrom = (d) => Date.now() + d * 86_400_000;

  // ── open DB ──────────────────────────────────────────────────────────────────
  const db = await new Promise((res, rej) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onsuccess = () => res(req.result);
    req.onerror   = () => rej(req.error);
  });

  const tx = (store, mode = "readwrite") =>
    db.transaction(store, mode).objectStore(store);

  const put = (store, val) =>
    new Promise((res, rej) => {
      const r = tx(store).put(val);
      r.onsuccess = () => res();
      r.onerror   = () => rej(r.error);
    });

  // ── clear existing data ───────────────────────────────────────────────────────
  const clear = (store) =>
    new Promise((res, rej) => {
      const r = tx(store).clear();
      r.onsuccess = () => res();
      r.onerror   = () => rej(r.error);
    });

  await clear("chains");
  await clear("events");
  await clear("account_connections");
  await clear("message_index");
  console.log("🗑️  Cleared existing data.");

  // ── dummy account ─────────────────────────────────────────────────────────────
  const ACCOUNT_ID = "demo-account-001";
  await put("account_connections", {
    account_id:       ACCOUNT_ID,
    provider_type:    "gmail",
    provider_user_key:"alex.chen@gmail.com",
    email:            "alex.chen@gmail.com",
    scopes_granted:   ["https://www.googleapis.com/auth/gmail.readonly"],
    connected_at:     daysAgo(30),
    last_sync_at:     Date.now() - 60_000,
    last_history_id:  "1234567",
  });

  // ── chains + events ───────────────────────────────────────────────────────────
  const companies = [
    // ── OFFER ──────────────────────────────────────────────────────────────────
    {
      company:  "Strype",
      role:     "Senior Software Engineer",
      status:   "OFFER",
      lastDays: 1,
      events: [
        { type: "APPLICATION_RECEIVED", daysAgo: 28, evidence: "We received your application for Senior Software Engineer at Strype.", recruiter: null, deadline: null },
        { type: "ASSESSMENT_INVITE",    daysAgo: 21, evidence: "Please complete the technical assessment at HackerRank within 5 days.", recruiter: "Sarah Kim", deadline: daysFrom(-16), deadlineRaw: "within 5 days", links: ["https://hackerrank.com/test/strype-swe"] },
        { type: "INTERVIEW_INVITE",     daysAgo: 14, evidence: "We'd love to schedule a series of interviews with the Strype engineering team.", recruiter: "Sarah Kim", deadline: null },
        { type: "OFFER",                daysAgo: 1,  evidence: "We're thrilled to extend you an offer to join Strype as a Senior Software Engineer!", recruiter: "Sarah Kim", deadline: daysFrom(7), deadlineRaw: "please respond by next Friday" },
      ],
    },

    // ── INTERVIEWING ───────────────────────────────────────────────────────────
    {
      company:  "Anthropiq",
      role:     "ML Engineer, Inference",
      status:   "INTERVIEWING",
      lastDays: 3,
      events: [
        { type: "APPLICATION_RECEIVED", daysAgo: 22, evidence: "Thanks for applying to the ML Engineer, Inference role at Anthropiq.", recruiter: null },
        { type: "INTERVIEW_INVITE",     daysAgo: 3,  evidence: "I'd love to set up a chat with our hiring team. We have slots this week and next.", recruiter: "Jordan Lee", deadline: null, links: ["https://calendly.com/anthropiq-recruiting/ml-screen"] },
      ],
    },
    {
      company:  "Phigma",
      role:     "Staff Frontend Engineer",
      status:   "INTERVIEWING",
      lastDays: 5,
      events: [
        { type: "APPLICATION_RECEIVED", daysAgo: 25, evidence: "Your application to Phigma for Staff Frontend Engineer has been received.", recruiter: null },
        { type: "ASSESSMENT_INVITE",    daysAgo: 18, evidence: "Complete the take-home project and submit within 72 hours.", recruiter: "Priya Nair", deadline: daysFrom(-15), deadlineRaw: "within 72 hours" },
        { type: "INTERVIEW_INVITE",     daysAgo: 5,  evidence: "Congrats on the take-home! We'd like to move you to the virtual onsite.", recruiter: "Priya Nair", deadline: daysFrom(3), deadlineRaw: "interviews scheduled for Thursday", links: ["https://zoom.us/j/94512345678"] },
      ],
    },

    // ── ASSESSMENT ─────────────────────────────────────────────────────────────
    {
      company:  "Notyon",
      role:     "Product Engineer",
      status:   "ASSESSMENT",
      lastDays: 4,
      events: [
        { type: "APPLICATION_RECEIVED", daysAgo: 12, evidence: "We got your application for Product Engineer at Notyon!", recruiter: null },
        { type: "ASSESSMENT_INVITE",    daysAgo: 4,  evidence: "Please complete the coding challenge linked below. Deadline: 5 days from now.", recruiter: "Marcus Webb", deadline: daysFrom(1), deadlineRaw: "5 days from now", links: ["https://codesignal.com/test/notyon-pe"] },
      ],
    },
    {
      company:  "Lynear",
      role:     "Software Engineer",
      status:   "ASSESSMENT",
      lastDays: 6,
      events: [
        { type: "APPLICATION_RECEIVED", daysAgo: 15, evidence: "Application received for Software Engineer at Lynear.", recruiter: null },
        { type: "ASSESSMENT_INVITE",    daysAgo: 6,  evidence: "Here's a short take-home. We'd appreciate a response within 3 days.", recruiter: "Elena Sokolova", deadline: daysFrom(0), deadlineRaw: "within 3 days", links: ["https://lynear.io/careers/challenge"] },
      ],
    },

    // ── APPLIED ────────────────────────────────────────────────────────────────
    {
      company:  "Versel",
      role:     "Developer Advocate",
      status:   "APPLIED",
      lastDays: 8,
      events: [
        { type: "APPLICATION_RECEIVED", daysAgo: 8, evidence: "Thanks for your interest in the Developer Advocate position at Versel. We'll be in touch soon.", recruiter: null },
      ],
    },
    {
      company:  "Looom",
      role:     "Senior Backend Engineer",
      status:   "APPLIED",
      lastDays: 10,
      events: [
        { type: "APPLICATION_RECEIVED", daysAgo: 10, evidence: "Your application for Senior Backend Engineer at Looom is under review.", recruiter: null },
      ],
    },

    // ── REJECTED ───────────────────────────────────────────────────────────────
    {
      company:  "Airbnnb",
      role:     "Software Engineer II",
      status:   "REJECTED",
      lastDays: 7,
      events: [
        { type: "APPLICATION_RECEIVED", daysAgo: 20, evidence: "We received your application for Software Engineer II at Airbnnb.", recruiter: null },
        { type: "INTERVIEW_INVITE",     daysAgo: 13, evidence: "We'd like to schedule an initial screen with one of our engineers.", recruiter: "Tom Reeves" },
        { type: "REJECTION",            daysAgo: 7,  evidence: "After careful consideration, we've decided to move forward with other candidates. We appreciate your time." },
      ],
    },

    // ── INTERVIEWING (Google) ──────────────────────────────────────────────────
    {
      company:  "Gooogle",
      role:     "Software Engineer III",
      status:   "INTERVIEWING",
      lastDays: 2,
      events: [
        { type: "APPLICATION_RECEIVED", daysAgo: 30, evidence: "Thank you for applying to the Software Engineer III position at Gooogle.", recruiter: null },
        { type: "ASSESSMENT_INVITE",    daysAgo: 20, evidence: "Please complete the online coding assessment within 7 days.", recruiter: "Mia Patel", deadline: daysFrom(-13), deadlineRaw: "within 7 days", links: ["https://hackerrank.com/test/gooogle-swe3"] },
        { type: "INTERVIEW_INVITE",     daysAgo: 2,  evidence: "Congratulations! We'd like to invite you to a virtual onsite interview with our engineering team.", recruiter: "Mia Patel", deadline: daysFrom(5), deadlineRaw: "interview scheduled for next Tuesday", links: ["https://meet.google.com/abc-defg-hij"] },
      ],
    },

    // ── GHOSTED ────────────────────────────────────────────────────────────────
    {
      company:  "Koinbase",
      role:     "Blockchain Engineer",
      status:   "GHOSTED",
      lastDays: 32,
      events: [
        { type: "APPLICATION_RECEIVED", daysAgo: 32, evidence: "Your application for Blockchain Engineer at Koinbase has been received.", recruiter: null },
      ],
    },
  ];

  for (const c of companies) {
    const chainId = uuid();
    await put("chains", {
      chain_id:          chainId,
      canonical_company: c.company,
      role_title:        c.role,
      status:            c.status,
      last_event_at:     daysAgo(c.lastDays),
      confidence:        0.92,
      created_at:        daysAgo(c.events.length > 0 ? c.events[c.events.length - 1].daysAgo ?? 30 : 30),
      account_id:        ACCOUNT_ID,
    });

    for (const ev of c.events) {
      await put("events", {
        event_id:           uuid(),
        chain_id:           chainId,
        event_type:         ev.type,
        event_time:         daysAgo(ev.daysAgo ?? 0),
        due_at:             ev.deadline ?? null,
        evidence:           ev.evidence ?? "",
        extracted_entities: {
          company_raw:     c.company,
          role_raw:        c.role,
          recruiter_name:  ev.recruiter ?? undefined,
          deadline_raw:    ev.deadlineRaw ?? undefined,
          links:           ev.links ?? [],
        },
        msg_id_internal:    uuid(),
        extraction_version: 1,
      });
    }
  }

  // ── mark local storage so the app thinks it's synced ─────────────────────────
  await chrome.storage.local.set({
    glanceai_last_sync_at: Date.now() - 60_000,
    glanceai_syncing: false,
  });

  console.log("✅ Glance AI demo data seeded! Close and reopen the extension window.");
  db.close();
})();
