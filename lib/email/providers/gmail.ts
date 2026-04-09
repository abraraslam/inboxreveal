import { google } from "googleapis";
import {
  CreateDraftParams,
  CreateDraftResult,
  EmailAttachment,
  EmailProvider,
  SendEmailParams,
  SendEmailResult,
} from "../provider";
import { EmailMessage, ListEmailsResult } from "../types";

function decodeBase64Url(data: string) {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64").toString("utf-8");
}

function toBase64Url(str: string) {
  return Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function sanitizeHeaderValue(value: string) {
  return String(value || "")
    .replace(/\r/g, " ")
    .replace(/\n/g, " ")
    .trim();
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

  const plainEmailMatch = value.match(
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
  );
  return plainEmailMatch?.[0] || "";
}

function buildRawMessage(
  to: string,
  subject: string,
  body: string,
  cc?: string,
  attachments?: EmailAttachment[]
) {
  const safeTo = sanitizeHeaderValue(to);
  const safeSubject = sanitizeHeaderValue(subject || "No subject");
  const safeCc = cc ? sanitizeHeaderValue(cc) : null;

  if (!attachments || attachments.length === 0) {
    const lines = [
      `To: ${safeTo}`,
      ...(safeCc ? [`Cc: ${safeCc}`] : []),
      `Subject: ${safeSubject}`,
      "Content-Type: text/plain; charset=utf-8",
      "MIME-Version: 1.0",
      "",
      body,
    ];
    return toBase64Url(lines.join("\n"));
  }

  // multipart/mixed for attachments
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const parts: string[] = [];

  parts.push(
    [
      `--${boundary}`,
      "Content-Type: text/plain; charset=utf-8",
      "Content-Transfer-Encoding: 7bit",
      "",
      body,
    ].join("\n")
  );

  for (const att of attachments) {
    const safeName = sanitizeHeaderValue(att.name);
    parts.push(
      [
        `--${boundary}`,
        `Content-Type: ${att.type || "application/octet-stream"}; name="${safeName}"`,
        "Content-Transfer-Encoding: base64",
        `Content-Disposition: attachment; filename="${safeName}"`,
        "",
        att.data,
      ].join("\n")
    );
  }

  parts.push(`--${boundary}--`);

  const message = [
    `To: ${safeTo}`,
    ...(safeCc ? [`Cc: ${safeCc}`] : []),
    `Subject: ${safeSubject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    ...parts,
  ].join("\n");

  return toBase64Url(message);
}

export class GmailProvider implements EmailProvider {
  constructor(private accessToken: string) {}

  private getClient() {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: this.accessToken,
    });

    return google.gmail({ version: "v1", auth: oauth2Client });
  }

  async listEmails(params?: {
    pageToken?: string;
    maxResults?: number;
  }): Promise<ListEmailsResult> {
    const gmail = this.getClient();

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

  async createDraft(params: CreateDraftParams): Promise<CreateDraftResult> {
    const gmail = this.getClient();

    const raw = buildRawMessage(params.to, params.subject, params.body, params.cc, params.attachments);

    const draft = await gmail.users.drafts.create({
      userId: "me",
      requestBody: {
        message: {
          raw,
          ...(params.threadId ? { threadId: params.threadId } : {}),
        },
      },
    });

    return {
      success: true,
      draftId: draft.data.id || null,
      threadId: draft.data.message?.threadId || params.threadId || null,
    };
  }

  async sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
    const gmail = this.getClient();

    const raw = buildRawMessage(params.to, params.subject, params.body, params.cc, params.attachments);

    const sent = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw,
        ...(params.threadId ? { threadId: params.threadId } : {}),
      },
    });

    return {
      success: true,
      id: sent.data.id || null,
      threadId: sent.data.threadId || params.threadId || null,
    };
  }
}