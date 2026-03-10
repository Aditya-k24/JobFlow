import { useState } from "react";
import { AccountPanel } from "./components/AccountPanel";
import { PrivacyPanel } from "./components/PrivacyPanel";
import { DangerZone } from "./components/DangerZone";
import { SyncStats } from "./components/SyncStats";

type Tab = "account" | "privacy" | "about";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("account");

  const tabs: { id: Tab; label: string }[] = [
    { id: "account", label: "Account" },
    { id: "privacy", label: "Privacy" },
    { id: "about", label: "About" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-2xl px-6">
          <div className="flex items-center gap-3 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <svg
                className="h-4 w-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-semibold text-gray-900">
                EmailChain Settings
              </h1>
              <p className="text-xs text-gray-400">
                Job application tracker
              </p>
            </div>
          </div>

          {/* Tabs */}
          <nav className="flex gap-1" aria-label="Settings tabs" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-2xl px-6 py-6">
        {/* Stats */}
        <div className="mb-6">
          <SyncStats />
        </div>

        {/* Tab panels */}
        <div role="tabpanel">
          {activeTab === "account" && <AccountPanel />}
          {activeTab === "privacy" && (
            <div className="space-y-8">
              <PrivacyPanel />
              <DangerZone />
            </div>
          )}
          {activeTab === "about" && <AboutPanel />}
        </div>
      </div>
    </div>
  );
}

function AboutPanel() {
  const manifest = chrome.runtime.getManifest();
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-gray-900">
          About EmailChain
        </h2>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Version</span>
          <span className="font-medium text-gray-900">{manifest.version}</span>
        </div>
        <hr className="border-gray-100" />
        <div>
          <p className="text-sm text-gray-600">
            EmailChain automatically detects and organizes your job application
            emails into structured timelines. All processing happens locally on
            your device.
          </p>
        </div>
        <hr className="border-gray-100" />
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            What EmailChain reads
          </p>
          <ul className="space-y-1 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              Emails matching job-related keywords (application, interview,
              rejection, offer, assessment)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              Emails from known job platforms (Greenhouse, Lever, Workday, etc.)
            </li>
          </ul>
        </div>
        <hr className="border-gray-100" />
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            What EmailChain does NOT do
          </p>
          <ul className="space-y-1 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-0.5">✗</span>
              Send your emails or data to external servers
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-0.5">✗</span>
              Read personal, financial, or non-job-related emails
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
