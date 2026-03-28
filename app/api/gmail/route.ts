import { google } from "googleapis";
import { EmailProvider } from "../provider";
import { EmailMessage, ListEmailsResult } from "../types";

function decodeBase64Url(data: string) {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64").toString("utf-8");
}

function extractBody(payload: any): string {
  if (!payload) return "";

  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  if (payload.parts?.length) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        return decodeBase64Url(part.body.data);
      }
    }

    for (const part of payload.parts) {
      if (part.mimeType === "text/html" && part.body?.data) {
        return decodeBase64Url(part.body.data);
      }
    }

    for (const part of payload.parts) {
      const nested = extractBody(part);
      if (nested) return nested;
    }
  }

  return "";
}

function cleanText(text: string) {
  return text
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function extractEmailAddress(value: string) {
  const match = value.match(/<([^>]+)>/);
  if (match?.[1]) return match[1].trim();

  const plainEmailMatch = value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return plainEmailMatch?.[0] || "";
}

export class GmailProvider implements EmailProvider {
  constructor(private accessToken: string) {}

  async listEmails(params?: {
    pageToken?: string;
    maxResults?: number;
  }): Promise<ListEmailsResult> {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: this.accessToken,
    });

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    const list = await gmail.users.messages.list({
      userId: "me",
      labelIds: ["INBOX"],
      maxResults: params?.maxResults ?? 20,
      pageToken: params?.pageToken,
    });

    const messages = list.data.messages || [];

    const emails: EmailMessage[] = await Promise.all(
      messages.map(async (msg) => {
        const detail = await gmail.users.messages.get({
          userId: "me",
          id: msg.id!,
          format: "full",
        });

        const headers = detail.data.payload?.headers || [];

        const getHeader = (name: string) =>
          headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())
            ?.value || "";

        const rawBody = extractBody(detail.data.payload);
        const cleanBody = cleanText(rawBody);
        const from = getHeader("From");

        return {
          id: msg.id!,
          threadId: detail.data.threadId || "",
          from,
          fromEmail: extractEmailAddress(from),
          subject: getHeader("Subject"),
          date: getHeader("Date"),
          internalDate: Number(detail.data.internalDate || 0),
          snippet: (cleanBody || detail.data.snippet || "").slice(0, 300),
          body: cleanBody,
          provider: "gmail",
        };
      })
    );

    emails.sort((a, b) => (b.internalDate || 0) - (a.internalDate || 0));

    return {
      emails,
      nextPageToken: list.data.nextPageToken || null,
      totalReturned: emails.length,
    };
  }
}