import {
  CreateDraftParams,
  CreateDraftResult,
  EmailProvider,
  SendEmailParams,
  SendEmailResult,
} from "../provider";
import { EmailMessage, ListEmailsResult } from "../types";

function cleanText(text: string) {
  return String(text || "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function extractEmailAddress(value: string) {
  const match = String(value || "").match(
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
  );
  return match?.[0] || "";
}

function formatFromAddress(name?: string, address?: string) {
  const safeName = String(name || "").trim();
  const safeAddress = String(address || "").trim();

  if (safeName && safeAddress) {
    return `${safeName} <${safeAddress}>`;
  }

  return safeAddress || safeName || "";
}

function buildRecipientList(to: string) {
  return to
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((email) => ({
      emailAddress: {
        address: email,
      },
    }));
}

type OutlookListResponse = {
  value?: Array<{
    id: string;
    conversationId?: string;
    subject?: string;
    bodyPreview?: string;
    body?: {
      contentType?: string;
      content?: string;
    };
    from?: {
      emailAddress?: {
        name?: string;
        address?: string;
      };
    };
    receivedDateTime?: string;
  }>;
  "@odata.nextLink"?: string;
};

export class OutlookProvider implements EmailProvider {
  constructor(private accessToken: string) {}

  private async graphRequest<T>(
    path: string,
    init?: RequestInit
  ): Promise<T> {
    const response = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Microsoft Graph error (${response.status}): ${text}`);
    }

    // Graph endpoints like /me/sendMail commonly return 202 with no body.
    if (response.status === 202 || response.status === 204 || response.status === 205) {
      return {} as T;
    }

    const text = await response.text();

    if (!text.trim()) {
      return {} as T;
    }

    return JSON.parse(text) as T;
  }

  async listEmails(params?: {
    pageToken?: string;
    maxResults?: number;
  }): Promise<ListEmailsResult> {
    const top = params?.maxResults ?? 20;

    let path = "";

    if (params?.pageToken) {
      const decoded = decodeURIComponent(params.pageToken);
      path = decoded.startsWith("https://graph.microsoft.com/v1.0")
        ? decoded.replace("https://graph.microsoft.com/v1.0", "")
        : decoded;
    } else {
      path =
        `/me/mailFolders/inbox/messages` +
        `?$top=${top}` +
        `&$orderby=receivedDateTime desc` +
        `&$select=id,conversationId,subject,bodyPreview,body,from,receivedDateTime`;
    }

    const data = await this.graphRequest<OutlookListResponse>(path);

    const emails: EmailMessage[] = (data.value || []).map((msg) => {
      const fromName = msg.from?.emailAddress?.name || "";
      const fromAddress = msg.from?.emailAddress?.address || "";
      const from = formatFromAddress(fromName, fromAddress);

      const rawBody = msg.body?.content || msg.bodyPreview || "";
      const body =
        msg.body?.contentType?.toLowerCase() === "html"
          ? cleanText(rawBody)
          : cleanText(rawBody);

      const internalDate = msg.receivedDateTime
        ? new Date(msg.receivedDateTime).getTime()
        : 0;

      return {
        id: msg.id,
        threadId: msg.conversationId || "",
        from,
        fromEmail: extractEmailAddress(fromAddress || from),
        subject: msg.subject || "",
        snippet: (body || msg.bodyPreview || "").slice(0, 300),
        body,
        date: msg.receivedDateTime || "",
        internalDate,
        provider: "outlook",
      };
    });

    return {
      emails,
      nextPageToken: data["@odata.nextLink"]
        ? encodeURIComponent(data["@odata.nextLink"])
        : null,
      totalReturned: emails.length,
    };
  }

  async createDraft(params: CreateDraftParams): Promise<CreateDraftResult> {
    const recipients = buildRecipientList(params.to);
    const ccRecipients = params.cc ? buildRecipientList(params.cc) : [];

    if (recipients.length === 0) {
      throw new Error("Recipient is required");
    }

    const draft = await this.graphRequest<{
      id?: string;
      conversationId?: string;
    }>("/me/messages", {
      method: "POST",
      body: JSON.stringify({
        subject: params.subject || "No subject",
        body: {
          contentType: "Text",
          content: params.body,
        },
        toRecipients: recipients,
        ...(ccRecipients.length > 0 ? { ccRecipients } : {}),
      }),
    });

    return {
      success: true,
      draftId: draft.id || null,
      threadId: draft.conversationId || params.threadId || null,
    };
  }

  async sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
    const recipients = buildRecipientList(params.to);
    const ccRecipients = params.cc ? buildRecipientList(params.cc) : [];

    if (recipients.length === 0) {
      throw new Error("Recipient is required");
    }

    await this.graphRequest("/me/sendMail", {
      method: "POST",
      body: JSON.stringify({
        message: {
          subject: params.subject || "No subject",
          body: {
            contentType: "Text",
            content: params.body,
          },
          toRecipients: recipients,
          ...(ccRecipients.length > 0 ? { ccRecipients } : {}),
        },
        saveToSentItems: true,
      }),
    });

    return {
      success: true,
      id: null,
      threadId: params.threadId || null,
    };
  }
}