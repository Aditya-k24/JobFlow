# OfferBound

> **Your job search, on autopilot.**
> A Chrome extension that reads your Gmail and automatically builds a timeline of every job application — no spreadsheets, no manual logging.

<p align="center">
  <img alt="Version" src="https://img.shields.io/badge/version-0.1.0-violet?style=flat-square" />
  <img alt="Manifest" src="https://img.shields.io/badge/Manifest-v3-4f46e5?style=flat-square&logo=googlechrome&logoColor=white" />
  <img alt="License" src="https://img.shields.io/badge/license-MIT-22c55e?style=flat-square" />
  <img alt="Local-first" src="https://img.shields.io/badge/local--first-no%20server-f59e0b?style=flat-square" />
</p>

---

## What it does

OfferBound connects to your Gmail (read-only) and automatically detects job-related emails. It groups them by company, tracks where you are in the hiring process, and surfaces upcoming deadlines — all without you lifting a finger.

- Detects applications, interview invites, assessments, offers, and rejections
- Groups emails into a per-company timeline with a pipeline progress bar
- Fires a deadline reminder 24 hours before assessments or offers expire
- Runs entirely in your browser — no account, no server, no cloud

---

## Setup

### 1. Get a Google OAuth Client ID

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → create a new project
2. Enable the **Gmail API** under APIs & Services → Library
3. Configure the **OAuth consent screen** (External) and add your Google account as a test user
4. Go to **Credentials → Create OAuth Client ID**, choose **Chrome Extension**, and paste your extension ID (you'll get this in step 4)
5. Copy the generated **Client ID**

### 2. Install and build

```bash
git clone https://github.com/Aditya-k24/OfferBound.git
cd OfferBound
npm install
```

Create a `.env` file:

```
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

```bash
npm run build
```

### 3. Load in Chrome

1. Open `chrome://extensions` and enable **Developer mode**
2. Click **Load unpacked** → select the `dist/` folder
3. Copy the **Extension ID** shown on the card
4. Go back to Google Cloud Console and paste it into your OAuth client → Save
5. Click the OfferBound icon in your toolbar → Settings → **Connect Gmail**

---

## Privacy

- **Read-only** Gmail access — only job-related emails are fetched
- **No server** — all data stays in your browser's local storage
- **No tracking** — zero analytics or telemetry

---

## License

MIT
