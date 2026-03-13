import { useState, useEffect } from "react";
import type { AccountConnection } from "@/types/account";
import { connectGmail } from "@/auth/oauthFlow";
import { sendMessage } from "@/shared/messages";
import { formatRelativeTime } from "@/shared/utils";
import { GMAIL_SCOPES } from "@/shared/constants";

export function AccountPanel() {
  const [account, setAccount] = useState<AccountConnection | null | undefined>(
    undefined
  );
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAccount = async () => {
    const r = await sendMessage<AccountConnection | null>({ type: "GET_ACCOUNT" });
    setAccount(r.ok ? (r.data ?? null) : null);
  };

  useEffect(() => {
    loadAccount();
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);
    try {
      await connectGmail();
      await loadAccount();
      // Trigger initial sync
      await sendMessage({ type: "TRIGGER_SYNC" });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Disconnect your Gmail account? Your tracked data will be preserved.")) return;
    setDisconnecting(true);
    try {
      await sendMessage({ type: "DISCONNECT_GMAIL" });
      setAccount(null);
    } finally {
      setDisconnecting(false);
    }
  };

  if (account === undefined) {
    return <div className="py-4 text-sm text-gray-400">Loading…</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Gmail Account</h2>
        <p className="mt-1 text-sm text-gray-500">
          Connect your Gmail to start tracking job application emails.
        </p>
      </div>

      {account ? (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-5 w-5 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {account.email}
                </p>
                <p className="text-xs text-gray-400">
                  Connected {formatRelativeTime(account.connected_at)}
                  {account.last_sync_at &&
                    ` · Synced ${formatRelativeTime(account.last_sync_at)}`}
                </p>
              </div>
            </div>
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="rounded-md px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
            >
              {disconnecting ? "Disconnecting…" : "Disconnect"}
            </button>
          </div>

          <div className="mt-3 rounded bg-gray-50 p-2.5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Permissions granted
            </p>
            <ul className="mt-1 space-y-1">
              {GMAIL_SCOPES.map((scope) => (
                <li key={scope} className="flex items-center gap-1.5 text-xs text-gray-600">
                  <span className="text-green-500">✓</span>
                  {scope.split("/").pop()}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center">
          <div className="mb-3 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
              <svg
                className="h-6 w-6 text-blue-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
          <p className="mb-1 text-sm font-medium text-gray-900">
            No account connected
          </p>
          <p className="mb-4 text-xs text-gray-500">
            Glance AI only reads emails matching job-related subjects and
            senders. Your emails never leave your device.
          </p>
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {connecting ? "Connecting…" : "Connect Gmail"}
          </button>
          {error && (
            <p className="mt-2 text-xs text-red-600">{error}</p>
          )}
        </div>
      )}

      {/* Privacy notice */}
      <div className="rounded-lg bg-blue-50 p-3">
        <p className="text-xs text-blue-700">
          <strong>Privacy:</strong> Glance AI uses read-only Gmail access and
          processes emails locally on your device. No email content is sent to
          external servers.
        </p>
      </div>
    </div>
  );
}
