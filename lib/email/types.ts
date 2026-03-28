export type EmailProviderName = "gmail" | "outlook";

export type EmailMessage = {
  id: string;
  threadId?: string;
  from: string;
  fromEmail?: string;
  subject: string;
  snippet: string;
  body?: string;
  date?: string;
  internalDate?: number;
  provider: EmailProviderName;
};

export type ListEmailsResult = {
  emails: EmailMessage[];
  nextPageToken?: string | null;
  totalReturned?: number;
};