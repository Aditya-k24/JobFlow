export interface GmailListResponse {
  messages?: Array<{ id: string; threadId: string }>;
  nextPageToken?: string;
  resultSizeEstimate?: number;
}

export interface GmailMessageHeader {
  name: string;
  value: string;
}

export interface GmailMessagePart {
  partId?: string;
  mimeType: string;
  filename?: string;
  headers?: GmailMessageHeader[];
  body?: {
    attachmentId?: string;
    size: number;
    data?: string; // base64url encoded
  };
  parts?: GmailMessagePart[];
}

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  historyId?: string;
  internalDate?: string; // Unix ms as string
  payload?: GmailMessagePart;
  sizeEstimate?: number;
}

export interface GmailHistoryMessage {
  id: string;
  threadId: string;
}

export interface GmailHistoryRecord {
  id: string;
  messages?: GmailHistoryMessage[];
  messagesAdded?: Array<{ message: GmailHistoryMessage }>;
  messagesDeleted?: Array<{ message: GmailHistoryMessage }>;
  labelsAdded?: Array<{ message: GmailHistoryMessage; labelIds: string[] }>;
  labelsRemoved?: Array<{ message: GmailHistoryMessage; labelIds: string[] }>;
}

export interface GmailHistoryResponse {
  history?: GmailHistoryRecord[];
  nextPageToken?: string;
  historyId?: string;
}

export interface GmailUserProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}
