This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Online Support Chat (Web + Electron App)

This app includes optional support chat integration that works in both web and Electron builds.

### Option A: Tawk.to (Free)

```bash
NEXT_PUBLIC_ENABLE_SUPPORT_CHAT=true
NEXT_PUBLIC_SUPPORT_CHAT_PROVIDER=tawk
NEXT_PUBLIC_TAWK_TO_PROPERTY_ID=YOUR_PROPERTY_ID
NEXT_PUBLIC_TAWK_TO_WIDGET_ID=YOUR_WIDGET_ID
```

### Option B: Freshchat-style Widget (Like your screenshot)

```bash
NEXT_PUBLIC_ENABLE_SUPPORT_CHAT=true
NEXT_PUBLIC_SUPPORT_CHAT_PROVIDER=freshchat
NEXT_PUBLIC_FRESHCHAT_TOKEN=YOUR_FRESHCHAT_TOKEN
NEXT_PUBLIC_FRESHCHAT_HOST=https://wchat.freshchat.com
```

Then restart your app:

```bash
npm run dev
```

To disable support chat:

```bash
NEXT_PUBLIC_ENABLE_SUPPORT_CHAT=false
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Zoho Provider TODO (Master Checklist)

Use this checklist when implementing Zoho support.

### Phase 1: Auth + Provider Wiring

- [ ] Add Zoho OAuth provider in `lib/auth-options.ts`
- [ ] Add Zoho env vars in `.env.local` (client id/secret, redirect URI if needed)
- [ ] Update JWT callback to store/refresh Zoho access tokens in `lib/auth-options.ts`
- [ ] Extend `SupportedProvider` with `zoho` in `lib/email/get-provider.ts`
- [ ] Map Zoho provider names in `normalizeProvider` in `lib/email/get-provider.ts`
- [ ] Add Zoho provider switch case in `getEmailProvider` in `lib/email/get-provider.ts`

### Phase 2: Provider Implementation

- [ ] Create `lib/email/providers/zoho.ts`
- [ ] Implement `listEmails()` using Zoho mail APIs
- [ ] Implement `createDraft()` using Zoho mail APIs
- [ ] Implement `sendEmail()` using Zoho mail APIs
- [ ] Ensure output matches shared types in `lib/email/types.ts`
- [ ] Ensure implementation follows interface in `lib/email/provider.ts`

### Phase 3: UI + Sign-in Flow

- [ ] Add “Sign in with Zoho” button in landing/login UI in `app/page.tsx`
- [ ] If needed, update nav/login hints in `components/Navigation.tsx`
- [ ] Verify provider stored in session and passed into APIs (`session.provider`)

### Phase 4: API Verification (No Route Changes Expected)

These routes should work automatically once provider factory wiring is done:

- [ ] Verify inbox fetch via `app/api/emails/route.ts`
- [ ] Verify draft creation via `app/api/draft/route.ts`
- [ ] Verify send flow via `app/api/send/route.ts`

### Phase 5: Testing Checklist

- [ ] Sign in with Zoho works
- [ ] Access token exists in session
- [ ] Emails list loads (pagination if applicable)
- [ ] Draft save works
- [ ] Send email works
- [ ] Token refresh works after expiry
- [ ] Error handling for revoked token is user-friendly

### Optional Next Step After Zoho

- [ ] Add generic IMAP/SMTP connector for long-tail providers

## Outlook Provider TODO (Master Checklist)

Use this checklist when validating, reconfiguring, or re-implementing Outlook support.

### Auth + Microsoft App Setup

- [ ] Create or verify Microsoft Entra app registration
- [ ] Set redirect URI for NextAuth callback
- [ ] Configure app as multi-tenant/single-tenant as required
- [ ] Set env vars: `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_TENANT_ID`
- [ ] Verify scopes include: `Mail.Read`, `Mail.ReadWrite`, `Mail.Send`, `offline_access`

### App Wiring

- [ ] Verify Azure provider config in `lib/auth-options.ts`
- [ ] Ensure JWT callback stores access/refresh token and provider
- [ ] Ensure session callback exposes `session.accessToken` and `session.provider`
- [ ] Verify provider normalization routes Azure provider IDs to `outlook` in `lib/email/get-provider.ts`
- [ ] Verify provider factory returns Outlook implementation

### Functional Tests

- [ ] Sign in with Outlook from `app/page.tsx`
- [ ] Fetch inbox via `app/api/emails/route.ts`
- [ ] Create draft via `app/api/draft/route.ts`
- [ ] Send email via `app/api/send/route.ts`
- [ ] Confirm token refresh works after access token expiry
