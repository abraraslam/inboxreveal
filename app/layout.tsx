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
        {supportChatEnabled && isTawk && tawkPropertyId && tawkWidgetId ? (
          <Script
            id="tawk-bootstrap"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function(global){
                  global.$_Tawk_AccountKey='${tawkPropertyId}';
                  global.$_Tawk_WidgetId='${tawkWidgetId}';
                  global.$_Tawk_Unstable=false;
                  global.$_Tawk = global.$_Tawk || {};
                  (function (w){
                    function l() {
                      if (window.$_Tawk.init !== undefined) {
                        return;
                      }

                      window.$_Tawk.init = true;

                      var files = [
                        'https://embed.tawk.to/_s/v4/app/69967ba6a3b/js/twk-main.js',
                        'https://embed.tawk.to/_s/v4/app/69967ba6a3b/js/twk-vendor.js',
                        'https://embed.tawk.to/_s/v4/app/69967ba6a3b/js/twk-chunk-vendors.js',
                        'https://embed.tawk.to/_s/v4/app/69967ba6a3b/js/twk-chunk-common.js',
                        'https://embed.tawk.to/_s/v4/app/69967ba6a3b/js/twk-runtime.js',
                        'https://embed.tawk.to/_s/v4/app/69967ba6a3b/js/twk-app.js'
                      ];

                      if (typeof Promise === 'undefined') {
                        files.unshift('https://embed.tawk.to/_s/v4/app/69967ba6a3b/js/twk-promise-polyfill.js');
                      }

                      if (typeof Symbol === 'undefined' || typeof Symbol.iterator === 'undefined') {
                        files.unshift('https://embed.tawk.to/_s/v4/app/69967ba6a3b/js/twk-iterator-polyfill.js');
                      }

                      if (typeof Object.entries === 'undefined') {
                        files.unshift('https://embed.tawk.to/_s/v4/app/69967ba6a3b/js/twk-entries-polyfill.js');
                      }

                      if (!window.crypto) {
                        window.crypto = window.msCrypto;
                      }

                      if (typeof Event !== 'function') {
                        files.unshift('https://embed.tawk.to/_s/v4/app/69967ba6a3b/js/twk-event-polyfill.js');
                      }

                      if (!Object.values) {
                        files.unshift('https://embed.tawk.to/_s/v4/app/69967ba6a3b/js/twk-object-values-polyfill.js');
                      }

                      if (typeof Array.prototype.find === 'undefined') {
                        files.unshift('https://embed.tawk.to/_s/v4/app/69967ba6a3b/js/twk-arr-find-polyfill.js');
                      }

                      var s0=document.getElementsByTagName('script')[0];

                      for (var i = 0; i < files.length; i++) {
                        var s1 = document.createElement('script');
                        s1.src= files[i];
                        s1.charset='UTF-8';
                        s1.setAttribute('crossorigin','*');
                        s0.parentNode.insertBefore(s1,s0);
                      }
                    }
                    if (document.readyState === 'complete') {
                      l();
                    } else if (w.attachEvent) {
                      w.attachEvent('onload', l);
                    } else {
                      w.addEventListener('load', l, false);
                    }
                  })(window);
                })(window);
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