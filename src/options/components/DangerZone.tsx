import { useState } from "react";
import { sendMessage } from "@/shared/messages";

export function DangerZone() {
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const handleDeleteAll = async () => {
    if (confirmText !== "DELETE") return;
    setDeleting(true);
    try {
      await sendMessage({ type: "DELETE_ALL_DATA" });
      setDeleted(true);
      setConfirmText("");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-red-700">Danger Zone</h2>
        <p className="mt-1 text-sm text-gray-500">
          These actions are permanent and cannot be undone.
        </p>
      </div>

      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <h3 className="text-sm font-semibold text-red-900">Delete all data</h3>
        <p className="mt-1 text-xs text-red-700">
          This will permanently delete all tracked chains, events, and your
          account connection. Your Gmail account will be disconnected.
        </p>

        {deleted ? (
          <p className="mt-3 text-sm font-medium text-green-700">
            All data deleted successfully.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            <label
              htmlFor="confirm-delete"
              className="block text-xs text-red-700"
            >
              Type <strong>DELETE</strong> to confirm:
            </label>
            <input
              id="confirm-delete"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
            <button
              onClick={handleDeleteAll}
              disabled={confirmText !== "DELETE" || deleting}
              className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Delete all data"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
