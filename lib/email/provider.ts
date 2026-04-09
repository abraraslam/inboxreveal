import { ListEmailsResult } from "./types";

export type EmailAttachment = {
  name: string;
  type: string;
  data: string; // base64
};

export type CreateDraftParams = {
  to: string;
  subject: string;
  body: string;
  threadId?: string;
  cc?: string;
  attachments?: EmailAttachment[];
};

export type SendEmailParams = {
  to: string;
  subject: string;
  body: string;
  threadId?: string;
  cc?: string;
  attachments?: EmailAttachment[];
};

export type CreateDraftResult = {
  success: boolean;
  draftId?: string | null;
  threadId?: string | null;
};

export type SendEmailResult = {
  success: boolean;
  id?: string | null;
  threadId?: string | null;
};

export interface EmailProvider {
  listEmails(params?: {
    pageToken?: string;
    maxResults?: number;
  }): Promise<ListEmailsResult>;

  createDraft(params: CreateDraftParams): Promise<CreateDraftResult>;

  sendEmail(params: SendEmailParams): Promise<SendEmailResult>;
}