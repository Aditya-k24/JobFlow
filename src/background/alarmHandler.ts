import { ALARM_NAME } from "@/shared/constants";
import { runSync } from "@/gmail/sync";
import { logger } from "@/shared/logger";

export async function onAlarm(alarm: chrome.alarms.Alarm): Promise<void> {
  if (alarm.name === ALARM_NAME) {
    logger.log("Sync alarm fired");
    await runSync();
    return;
  }

  // Handle deadline notification alarms
  if (alarm.name.startsWith("deadline_")) {
    await fireDeadlineNotification(alarm.name);
  }
}

async function fireDeadlineNotification(alarmName: string): Promise<void> {
  const notifKey = alarmName.replace(/^deadline_/, "deadline_notif_");
  const data = await chrome.storage.local.get(notifKey);
  const notifData = data[notifKey] as
    | {
        company: string;
        role: string;
        dueAt: number;
        deadlineRaw?: string;
      }
    | undefined;

  if (!notifData) return;

  const { company, role, dueAt } = notifData;
  const dueDate = new Date(dueAt);
  const timeStr = dueDate.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const notificationsEnabled = await chrome.storage.local
    .get("emailchain_notifications_enabled")
    .then((d) => d["emailchain_notifications_enabled"] !== false);

  if (!notificationsEnabled) return;

  chrome.notifications.create(`notif_${alarmName}`, {
    type: "basic",
    iconUrl: "icons/icon48.png",
    title: `Deadline: ${company}`,
    message: `${role} — Due ${timeStr}`,
    priority: 2,
  });

  // Clean up stored notification data
  await chrome.storage.local.remove(notifKey);
}
