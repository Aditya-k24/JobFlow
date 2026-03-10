import type { ExtensionMessage } from "@/shared/messages";
import { runSync } from "@/gmail/sync";
import { getAllChains } from "@/db/chains";
import { getEventsByChain, getUpcomingDeadlines } from "@/db/events";
import { getFirstAccount, clearAllAccounts } from "@/db/accounts";
import { clearAllChains } from "@/db/chains";
import { clearAllEvents } from "@/db/events";
import { clearAllMessages } from "@/db/messageIndex";
import { disconnectGmail } from "@/auth/oauthFlow";
import { logger } from "@/shared/logger";

type SendResponse = (response: unknown) => void;

export function onMessage(
  message: ExtensionMessage,
  _sender: chrome.runtime.MessageSender,
  sendResponse: SendResponse
): boolean {
  // Handle async responses
  handleAsync(message, sendResponse).catch((err) => {
    logger.error("Message handler error:", err);
    sendResponse({ ok: false, error: String(err) });
  });
  return true; // Keep message channel open
}

async function handleAsync(
  message: ExtensionMessage,
  sendResponse: SendResponse
): Promise<void> {
  switch (message.type) {
    case "TRIGGER_SYNC": {
      await runSync();
      sendResponse({ ok: true });
      break;
    }

    case "GET_CHAINS": {
      const chains = await getAllChains();
      sendResponse({ ok: true, data: chains });
      break;
    }

    case "GET_EVENTS": {
      const events = await getEventsByChain(message.chainId);
      sendResponse({ ok: true, data: events });
      break;
    }

    case "GET_UPCOMING_DEADLINES": {
      const deadlines = await getUpcomingDeadlines();
      sendResponse({ ok: true, data: deadlines });
      break;
    }

    case "GET_ACCOUNT": {
      const account = await getFirstAccount();
      sendResponse({ ok: true, data: account });
      break;
    }

    case "DISCONNECT_GMAIL": {
      await disconnectGmail();
      sendResponse({ ok: true });
      break;
    }

    case "DELETE_ALL_DATA": {
      await Promise.all([
        clearAllChains(),
        clearAllEvents(),
        clearAllMessages(),
        clearAllAccounts(),
        chrome.storage.local.clear(),
      ]);
      sendResponse({ ok: true });
      break;
    }

    case "GET_SYNC_STATUS": {
      const localData = await chrome.storage.local.get([
        "emailchain_last_sync_at",
        "emailchain_syncing",
      ]);
      sendResponse({
        ok: true,
        data: {
          last_sync_at: localData["emailchain_last_sync_at"] ?? null,
          syncing: localData["emailchain_syncing"] ?? false,
        },
      });
      break;
    }

    default: {
      sendResponse({ ok: false, error: "Unknown message type" });
    }
  }
}
