const privacyPolicyUrl = process.env.NEXT_PUBLIC_PRIVACY_POLICY_URL || "/privacy-policy";
const termsOfServiceUrl = process.env.NEXT_PUBLIC_TERMS_OF_SERVICE_URL || "/terms-of-service";

export const PUBLIC_URLS = {
  privacyPolicy: privacyPolicyUrl,
  termsOfService: termsOfServiceUrl,
} as const;

export function isExternalUrl(url: string) {
  return /^https?:\/\//i.test(url);
}
