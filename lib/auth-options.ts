import GoogleProvider from "next-auth/providers/google";
import AzureADProvider from "next-auth/providers/azure-ad";
import type { NextAuthOptions } from "next-auth";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const azureClientId = process.env.AZURE_AD_CLIENT_ID;
const azureClientSecret = process.env.AZURE_AD_CLIENT_SECRET;
const azureTenantId = process.env.AZURE_AD_TENANT_ID;

const providers = [];

function isConfigured(value?: string) {
  const normalized = value?.trim();

  if (!normalized) return false;
  if (/^your_/i.test(normalized)) return false;
  if (/placeholder/i.test(normalized)) return false;

  return true;
}

if (isConfigured(googleClientId) && isConfigured(googleClientSecret)) {
  providers.push(
    GoogleProvider({
      clientId: googleClientId!.trim(),
      clientSecret: googleClientSecret!.trim(),
      authorization: {
        params: {
          scope: "openid email profile",
          access_type: "offline",
          prompt: "consent",
        },
      },
    })
  );
}

if (
  isConfigured(azureClientId) &&
  isConfigured(azureClientSecret) &&
  isConfigured(azureTenantId)
) {
  providers.push(
    AzureADProvider({
      clientId: azureClientId!.trim(),
      clientSecret: azureClientSecret!.trim(),
      tenantId: azureTenantId!.trim(),
      authorization: {
        params: {
          scope:
            "openid profile email offline_access User.Read Mail.Read Mail.ReadWrite Mail.Send",
        },
      },
    })
  );
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  providers,

  callbacks: {
    async jwt({ token, account, user }) {
      // Initial sign in
      if (account && user) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.provider = account.provider;
        token.expiresAt = account.expires_at
          ? account.expires_at * 1000
          : Date.now() + 3600000; // 1 hour default
      }

      // Return early if the access token has not expired yet
      if (token.expiresAt && Date.now() < (token.expiresAt as number)) {
        return token;
      }

      // If we reach here, the AT if expired, try refreshing it
      if (token.provider === "google" && token.refreshToken) {
        try {
          const response = await fetch("https://oauth2.googleapis.com/token", {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              client_id: process.env.GOOGLE_CLIENT_ID!,
              client_secret: process.env.GOOGLE_CLIENT_SECRET!,
              grant_type: "refresh_token",
              refresh_token: token.refreshToken as string,
            }),
            method: "POST",
          });

          const refreshedTokens = await response.json();

          if (!response.ok) {
            throw refreshedTokens;
          }

          return {
            ...token,
            accessToken: refreshedTokens.access_token,
            expiresAt: Date.now() + refreshedTokens.expires_in * 1000,
            refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
          };
        } catch (error) {
          console.error("Error refreshing access token", error);
          return token;
        }
      }

      return token;
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      session.refreshToken = token.refreshToken as string | undefined;
      session.provider = token.provider as string | undefined;

      return session;
    },
  },

  pages: {
    signIn: "/?login=true",
    error: "/?error=true",
  },

  logger: {
    error(code, metadata) {
      console.error("[NextAuth][error]", code, JSON.stringify(metadata));
    },
    warn(code) {
      console.warn("[NextAuth][warn]", code);
    },
  },

  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
};