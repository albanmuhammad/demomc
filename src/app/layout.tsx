// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import "@/types/salesforce";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DemoApp - Salesforce Data Cloud Demo",
  description: "Demo landing page with Salesforce Data Cloud tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Loader dari Web Connector (jangan diubah ID & URL-nya) */}
        <Script
          id="c360a-loader"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !(function(e,t,n,s,a,c,i){
                e.c360a||((a=e.c360a=function(){
                  a.callMethod?a.callMethod.apply(a,arguments):a.queue.push(arguments)
                }),
                e._c360a||(e._c360a=a),(a.push=a),(a.loaded=!0),(a.version="1.0"),(a.queue=[]),
                (c=t.createElement(n)),(c.async=!0),
                (c.src="https://cdn.c360a.salesforce.com/beacon/c360a/8d18a34a-e31c-4ebb-a40a-b12d56d7e0ae/scripts/c360a.min.js"),
                (i=t.getElementsByTagName(n)[0]),i.parentNode.insertBefore(c,i))
              })(window,document,"script");
            `,
          }}
        />

        {/* Init SDK + debug + sitemap */}
        <Script
          id="c360a-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
      (function () {
        function initSalesforce() {
          try {
            if (!window.SalesforceInteractions) {
              console.warn('[SF] SalesforceInteractions still undefined in initSalesforce');
              return;
            }

            // --- INIT PERSONALIZATION MODULE ---
            if (window.SalesforceInteractions.Personalization?.Config) {
              window.SalesforceInteractions.Personalization.Config.initialize({
                // boleh kosong; nanti kalau mau bisa isi config lain
              });
              console.log('[SF] Personalization module initialized');
            } else {
              console.log('[SF] Personalization module not present in beacon');
            }

            // --- INIT MAIN INTERACTIONS SDK ---
            window.SalesforceInteractions.init({
              consents: [
                { purpose: 'Tracking',  status: 'OptIn' },
                { purpose: 'Analytics', status: 'OptIn' }
              ],
              debug: { logLevel: 4 }
            })
              .then(function () {
                console.log('✅ Salesforce Data Cloud initialized');
                // flag & event supaya React bisa tahu
                window.__sfInteractionsReady = true;
                window.dispatchEvent(new Event('sf_interactions_ready'));
              })
              .catch(function (e) {
                console.error('❌ Salesforce initialization error:', e);
              });
          } catch (e) {
            console.error('❌ Salesforce init wrapper error:', e);
          }
        }

        // kalau sudah ada SalesforceInteractions, langsung init
        if (window.SalesforceInteractions) {
          initSalesforce();
        } else {
          // kalau belum, polling sebentar sampai beacon siap
          var attempts = 0;
          var maxAttempts = 200; // ~10 detik (200 * 50ms)

          var intervalId = setInterval(function () {
            attempts++;
            if (window.SalesforceInteractions) {
              clearInterval(intervalId);
              initSalesforce();
            } else if (attempts >= maxAttempts) {
              clearInterval(intervalId);
              console.error('[SF] SalesforceInteractions never became available.');
            }
          }, 50);
        }
      })();
    `,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
