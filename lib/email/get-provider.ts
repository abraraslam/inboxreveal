import { EmailProvider } from "./provider";
import { GmailProvider } from "./providers/gmail";
import { OutlookProvider } from "./providers/outlook";

export type SupportedProvider = "gmail" | "outlook";

export function normalizeProvider(provider?: string): SupportedProvider {
  const value = String(provider || "").toLowerCase();

  if (value === "google" || value === "gmail") {
    return "gmail";
  }

  if (
    value === "outlook" ||
    value === "microsoft" ||
    value === "azure-ad" ||
    value === "microsoft-entra-id"
  ) {
    return "outlook";
  }

  return "gmail";
}

export function getEmailProvider({
  provider,
  accessToken,
}: {
  provider: string;
  accessToken: string;
}): EmailProvider {
  const normalizedProvider = normalizeProvider(provider);

  switch (normalizedProvider) {
    case "gmail":
      return new GmailProvider(accessToken);
    case "outlook":
      return new OutlookProvider(accessToken);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}