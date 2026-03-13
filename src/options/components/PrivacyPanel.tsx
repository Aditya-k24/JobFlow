import { useState, useEffect } from "react";

interface Preferences {
  retention_days: number;
  notifications_enabled: boolean;
}

export function PrivacyPanel() {
  const [prefs, setPrefs] = useState<Preferences>({
    retention_days: 90,
    notifications_enabled: true,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    chrome.storage.local
      .get({
        glanceai_retention_days: 90,
        glanceai_notifications_enabled: true,
      })
      .then((data) => {
        setPrefs({
          retention_days: data["glanceai_retention_days"] as number,
          notifications_enabled: data["glanceai_notifications_enabled"] as boolean,
        });
      });
  }, []);

  const handleSave = async () => {
    await chrome.storage.local.set({
      glanceai_retention_days: prefs.retention_days,
      glanceai_notifications_enabled: prefs.notifications_enabled,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-gray-900">
          Privacy & Notifications
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Control how Glance AI stores and uses your data.
        </p>
      </div>

      <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
        {/* Data retention */}
        <div>
          <label
            htmlFor="retention"
            className="block text-sm font-medium text-gray-700"
          >
            Data retention
          </label>
          <p className="mb-2 text-xs text-gray-400">
            How long to keep tracked emails and events
          </p>
          <select
            id="retention"
            value={prefs.retention_days}
            onChange={(e) =>
              setPrefs((p) => ({
                ...p,
                retention_days: Number(e.target.value),
              }))
            }
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value={30}>30 days</option>
            <option value={60}>60 days</option>
            <option value={90}>90 days</option>
            <option value={180}>6 months</option>
            <option value={365}>1 year</option>
            <option value={-1}>Forever</option>
          </select>
        </div>

        <hr className="border-gray-100" />

        {/* Notifications */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">
              Deadline notifications
            </p>
            <p className="text-xs text-gray-400">
              Get reminded 24 hours before extracted deadlines
            </p>
          </div>
          <button
            role="switch"
            aria-checked={prefs.notifications_enabled}
            onClick={() =>
              setPrefs((p) => ({
                ...p,
                notifications_enabled: !p.notifications_enabled,
              }))
            }
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              prefs.notifications_enabled ? "bg-blue-600" : "bg-gray-200"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                prefs.notifications_enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={handleSave}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {saved ? "Saved!" : "Save preferences"}
        </button>
      </div>
    </div>
  );
}
