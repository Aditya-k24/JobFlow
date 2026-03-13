// OfferBound Service Worker Entry Point (MV3)
// All listeners MUST be registered synchronously at the top level before any await.

import { onInstalled } from "./installHandler";
import { onAlarm } from "./alarmHandler";
import { onMessage } from "./messageHandler";

// Register all event listeners synchronously
chrome.runtime.onInstalled.addListener((details) => {
  // Kick off async handler
  onInstalled(details).catch(console.error);
});

chrome.alarms.onAlarm.addListener((alarm) => {
  onAlarm(alarm).catch(console.error);
});

chrome.runtime.onMessage.addListener(
  (message, sender, sendResponse) => {
    return onMessage(message, sender, sendResponse);
  }
);

// Extension icon click → open/focus the standalone draggable window
let windowId: number | null = null;

chrome.action.onClicked.addListener(() => {
  const windowUrl = chrome.runtime.getURL("src/window/window.html");

  if (windowId !== null) {
    // Focus existing window
    chrome.windows.update(windowId, { focused: true }, (win) => {
      if (chrome.runtime.lastError || !win) {
        windowId = null;
        openWindow(windowUrl);
      }
    });
  } else {
    openWindow(windowUrl);
  }
});

function openWindow(url: string) {
  chrome.windows.create(
    { url, type: "popup", width: 420, height: 620 },
    (win) => {
      if (win?.id) windowId = win.id;
    }
  );
}

chrome.windows.onRemoved.addListener((id) => {
  if (id === windowId) windowId = null;
});

// Handle notification clicks — open options page
chrome.notifications.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});

// Keep-alive: the SW may be terminated after ~30s of inactivity.
// Our alarm-based architecture handles this — all state is persisted to storage.
// No keep-alive hacks needed.

console.log("[OfferBound] Service worker loaded");
