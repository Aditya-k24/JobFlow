export const ALARM_NAME = "emailchain-sync";
export const DB_NAME = "emailchain";
export const DB_VERSION = 1;
export const EXTRACTION_VERSION = 1;

export const GMAIL_BASE_URL = "https://gmail.googleapis.com/gmail/v1";
export const OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
export const OAUTH_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
export const OAUTH_REVOKE_URL = "https://oauth2.googleapis.com/revoke";

export const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
];

// Set via .env: VITE_GOOGLE_CLIENT_ID
// Get this from Google Cloud Console → OAuth 2.0 Client (Chrome Extension type)
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;

// Gmail search query to narrow to job-related emails
export const GMAIL_JOB_QUERY =
  "newer_than:6m (subject:(application OR interview OR rejection OR offer OR assessment OR position OR role OR opportunity OR hiring) OR from:(greenhouse.io OR lever.co OR workday.com OR smartrecruiters.com OR jobs-noreply.linkedin.com OR indeed.com OR icims.com OR taleo.net OR jobvite.com OR myworkdayjobs.com OR successfactors.com))";

// Max messages to fetch per sync run (to stay within SW time limits)
export const MAX_MESSAGES_PER_SYNC = 50;

export const SYNC_INTERVAL_MINUTES = 30;
