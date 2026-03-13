import {
  listMessages,
  getMessage,
  listHistory,
  getUserProfile,
} from "./client";
import { parseGmailMessage } from "./parser";
import {
  getMessageByProviderId,
  saveMessage,
  getUnprocessedMessages,
  markMessageProcessed,
} from "@/db/messageIndex";
import { updateAccountSyncState, getFirstAccount } from "@/db/accounts";
import { runExtractionPipeline } from "@/detection/pipeline";
import {
  GMAIL_JOB_QUERY,
  MAX_MESSAGES_PER_SYNC,
} from "@/shared/constants";
import { logger } from "@/shared/logger";
import { hasStoredAuth } from "@/auth/tokenStore";

const SYNCING_KEY = "glanceai_syncing";

/**
 * Main sync entry point. Called by alarm handler.
 */
export async function runSync(): Promise<void> {
  // Prevent concurrent syncs
  const state = await chrome.storage.local.get(SYNCING_KEY);
  if (state[SYNCING_KEY]) {
    logger.log("Sync already in progress, skipping");
    return;
  }

  if (!(await hasStoredAuth())) {
    logger.log("No auth, skipping sync");
    return;
  }

  await chrome.storage.local.set({ [SYNCING_KEY]: true });

  try {
    await doSync();
  } catch (err) {
    logger.error("Sync error:", err);
  } finally {
    await chrome.storage.local.set({
      [SYNCING_KEY]: false,
      glanceai_last_sync_at: Date.now(),
    });
  }
}

async function doSync(): Promise<void> {
  const account = await getFirstAccount();
  if (!account) {
    logger.warn("No account found for sync");
    return;
  }

  const historyId = account.last_history_id;

  if (historyId) {
    await incrementalSync(account.account_id, historyId);
  } else {
    await bootstrapSync(account.account_id);
  }

  // Process any unprocessed messages
  await processUnprocessedMessages(account.account_id);

  // Save updated history ID
  const profile = await getUserProfile();
  await updateAccountSyncState(
    account.account_id,
    Date.now(),
    profile.historyId
  );
}

/**
 * First-run: fetch recent job-related emails.
 */
async function bootstrapSync(accountId: string): Promise<void> {
  logger.log("Starting bootstrap sync");
  let pageToken: string | undefined;
  let fetchedCount = 0;

  do {
    const response = await listMessages("me", {
      q: GMAIL_JOB_QUERY,
      maxResults: 100,
      pageToken,
    });

    const messages = response.messages ?? [];
    logger.log(`Bootstrap: fetched ${messages.length} message IDs`);

    for (const msg of messages) {
      // Check if already indexed
      const existing = await getMessageByProviderId(msg.id);
      if (existing) continue;

      // Save a placeholder to the index (will be fully fetched during processing)
      await saveMessage({
        msg_id_internal: crypto.randomUUID(),
        account_id: accountId,
        provider_message_id: msg.id,
        provider_thread_id: msg.threadId,
        rfc5322_message_id: null,
        from_domain: "",
        from_email: "",
        subject_text: "",
        received_at: 0,
        snippet: "",
        processed: false,
      });
      fetchedCount++;
    }

    pageToken = response.nextPageToken;
  } while (pageToken && fetchedCount < 500); // Cap at 500 on first run

  logger.log(`Bootstrap: indexed ${fetchedCount} new messages`);
}

/**
 * Incremental sync using Gmail history API.
 */
async function incrementalSync(
  accountId: string,
  startHistoryId: string
): Promise<void> {
  logger.log("Starting incremental sync from historyId:", startHistoryId);
  let pageToken: string | undefined;
  let newCount = 0;

  try {
    do {
      const response = await listHistory("me", {
        startHistoryId,
        historyTypes: ["messageAdded"],
        pageToken,
      });

      const records = response.history ?? [];
      for (const record of records) {
        const added = record.messagesAdded ?? [];
        for (const { message } of added) {
          const existing = await getMessageByProviderId(message.id);
          if (existing) continue;

          await saveMessage({
            msg_id_internal: crypto.randomUUID(),
            account_id: accountId,
            provider_message_id: message.id,
            provider_thread_id: message.threadId,
            rfc5322_message_id: null,
            from_domain: "",
            from_email: "",
            subject_text: "",
            received_at: 0,
            snippet: "",
            processed: false,
          });
          newCount++;
        }
      }

      pageToken = response.nextPageToken;
    } while (pageToken);

    logger.log(`Incremental sync: indexed ${newCount} new messages`);
  } catch (err) {
    // If history is too old, fall back to bootstrap
    if (err instanceof Error && err.message.includes("404")) {
      logger.warn("History expired, falling back to bootstrap sync");
      await bootstrapSync(accountId);
    } else {
      throw err;
    }
  }
}

/**
 * Fetch full content for unprocessed messages and run the extraction pipeline.
 */
async function processUnprocessedMessages(accountId: string): Promise<void> {
  const unprocessed = await getUnprocessedMessages(MAX_MESSAGES_PER_SYNC);
  logger.log(`Processing ${unprocessed.length} messages`);

  for (const msgIndex of unprocessed) {
    try {
      // Fetch full message from Gmail
      const fullMessage = await getMessage(
        msgIndex.provider_message_id,
        "me",
        "full"
      );

      // Parse the message
      const parsed = parseGmailMessage(fullMessage);

      // Update the message index with parsed data
      await saveMessage({
        ...msgIndex,
        from_domain: parsed.from_domain,
        from_email: parsed.from_email,
        subject_text: parsed.subject,
        received_at: parsed.received_at,
        snippet: parsed.snippet,
        rfc5322_message_id: parsed.message_id || null,
        processed: false, // Will be set to true by pipeline after processing
      });

      // Run extraction pipeline
      await runExtractionPipeline(
        msgIndex.msg_id_internal,
        accountId,
        parsed
      );

      // Mark as processed
      await markMessageProcessed(msgIndex.msg_id_internal);
    } catch (err) {
      logger.error(
        `Failed to process message ${msgIndex.provider_message_id}:`,
        err
      );
      // Mark as processed anyway to avoid infinite retry
      await markMessageProcessed(msgIndex.msg_id_internal);
    }
  }
}
