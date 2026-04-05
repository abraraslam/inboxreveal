import "./globals.css";
import Providers from "./providers";
import type { Viewport } from "next";
import Script from "next/script";

const supportProvider = process.env.NEXT_PUBLIC_SUPPORT_CHAT_PROVIDER;
const tawkPropertyId = process.env.NEXT_PUBLIC_TAWK_TO_PROPERTY_ID;
const tawkWidgetId = process.env.NEXT_PUBLIC_TAWK_TO_WIDGET_ID;
const freshchatToken = process.env.NEXT_PUBLIC_FRESHCHAT_TOKEN;
const freshchatHost = process.env.NEXT_PUBLIC_FRESHCHAT_HOST;
const supportChatEnabled = process.env.NEXT_PUBLIC_ENABLE_SUPPORT_CHAT !== "false";

const resolvedSupportProvider = supportProvider || "tawk";
const resolvedTawkPropertyId = tawkPropertyId || "69d24e9d3aa0fb1c3e74ca9c";
const resolvedTawkWidgetId = tawkWidgetId || "1jleo65tm";

const isTawk = resolvedSupportProvider === "tawk";
const isFreshchat = resolvedSupportProvider === "freshchat";

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
        {supportChatEnabled && isTawk ? (
          <Script
            id="tawk-bootstrap"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.Tawk_API = window.Tawk_API || {};
                window.Tawk_LoadStart = new Date();
                (function() {
                  var s1 = document.createElement("script");
                  var s0 = document.getElementsByTagName("script")[0];
                  s1.async = true;
                  s1.src = "https://embed.tawk.to/${resolvedTawkPropertyId}/${resolvedTawkWidgetId}";
                  s1.charset = "UTF-8";
                  s1.setAttribute("crossorigin", "*");
                  if (s0 && s0.parentNode) {
                    s0.parentNode.insertBefore(s1, s0);
                  } else {
                    document.head.appendChild(s1);
                  }
                })();
              `,
            }}
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
      </body>
    </html>
  );
}