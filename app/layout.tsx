import "./globals.css";
import Providers from "./providers";
import type { Viewport } from "next";
import Script from "next/script";

const supportProvider = process.env.NEXT_PUBLIC_SUPPORT_CHAT_PROVIDER;
const tawkPropertyId = process.env.NEXT_PUBLIC_TAWK_TO_PROPERTY_ID;
const tawkWidgetId = process.env.NEXT_PUBLIC_TAWK_TO_WIDGET_ID;
const freshchatToken = process.env.NEXT_PUBLIC_FRESHCHAT_TOKEN;
const freshchatHost = process.env.NEXT_PUBLIC_FRESHCHAT_HOST;
const supportChatEnabled = process.env.NEXT_PUBLIC_ENABLE_SUPPORT_CHAT === "true";

const tawkScriptSrc =
  tawkPropertyId && tawkWidgetId
    ? `https://embed.tawk.to/${tawkPropertyId}/${tawkWidgetId}`
    : null;

const isTawk = supportProvider === "tawk";
const isFreshchat = supportProvider === "freshchat";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
      {supportChatEnabled && isTawk && tawkScriptSrc ? (
        <Script
          id="tawk-to-widget"
          src={tawkScriptSrc}
          strategy="lazyOnload"
          crossOrigin="anonymous"
        />
      ) : null}
      {supportChatEnabled && isFreshchat && freshchatToken && freshchatHost ? (
        <>
          <Script
            id="freshchat-widget"
            src={`${freshchatHost.replace(/\/$/, "")}/js/widget.js`}
            strategy="lazyOnload"
            crossOrigin="anonymous"
          />
          <Script
            id="freshchat-init"
            strategy="lazyOnload"
            dangerouslySetInnerHTML={{
              __html: `window.fcWidget && window.fcWidget.init({ token: "${freshchatToken}", host: "${freshchatHost}" });`,
            }}
          />
        </>
      ) : null}
    </html>
  );
}