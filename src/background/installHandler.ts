import { ALARM_NAME, SYNC_INTERVAL_MINUTES } from "@/shared/constants";
import { logger } from "@/shared/logger";

export async function onInstalled(
  details: chrome.runtime.InstalledDetails
): Promise<void> {
  if (details.reason === "install") {
    logger.log("Extension installed");

    // Create periodic sync alarm
    await chrome.alarms.create(ALARM_NAME, {
      delayInMinutes: 1, // First sync after 1 minute
      periodInMinutes: SYNC_INTERVAL_MINUTES,
    });

    // Set default preferences
    await chrome.storage.local.set({
      glanceai_onboarding: true,
      glanceai_retention_days: 90,
      glanceai_notifications_enabled: true,
    });

    // Open options page for onboarding
    chrome.runtime.openOptionsPage();
  } else if (details.reason === "update") {
    logger.log("Extension updated to", chrome.runtime.getManifest().version);

    // Ensure alarm still exists after update
    const existing = await chrome.alarms.get(ALARM_NAME);
    if (!existing) {
      await chrome.alarms.create(ALARM_NAME, {
        delayInMinutes: 1,
        periodInMinutes: SYNC_INTERVAL_MINUTES,
      });
    }
  }
}
