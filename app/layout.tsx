import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./overrides.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const metadata: Metadata = {
  title: "WorkHours",
  description: "WorkHours — pontaj lunar simplu, instalabil pe iPhone.",
  manifest: `${basePath}/manifest.webmanifest`,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "WorkHours",
  },
  icons: {
    icon: [
      { url: `${basePath}/icon-192.png`, sizes: "192x192", type: "image/png" },
      { url: `${basePath}/icon-512.png`, sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: `${basePath}/apple-touch-icon.png`, sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#111318" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const registerServiceWorker = `
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('${basePath}/sw.js', { scope: '${basePath}/' }).catch(function () {});
      });
    }
  `;

  const iPhoneTimeFieldFix = `
    .sheet .two {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
      gap: 18px !important;
    }
    .sheet .two > * {
      min-width: 0 !important;
      width: 100% !important;
    }
    .sheet .two input[type="time"] {
      display: block !important;
      width: 100% !important;
      min-width: 0 !important;
      max-width: 100% !important;
      box-sizing: border-box !important;
      -webkit-appearance: none !important;
      appearance: none !important;
    }
    .app .header .headerText strong {
      font-size: 0 !important;
    }
    .app .header .headerText strong::after {
      content: "WorkHours";
      font-size: 20px;
    }
  `;

  const enforceAppName = `
    (function () {
      var appName = 'WorkHours';
      function applyName() {
        document.title = appName;
        var label = document.querySelector('.headerText strong');
        if (label && label.textContent !== appName) label.textContent = appName;
      }
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyName);
      } else {
        applyName();
      }
      new MutationObserver(applyName).observe(document.documentElement, {
        childList: true,
        subtree: true,
        characterData: true
      });
    })();
  `;

  return (
    <html lang="ro">
      <body>
        {children}
        <style dangerouslySetInnerHTML={{ __html: iPhoneTimeFieldFix }} />
        <script dangerouslySetInnerHTML={{ __html: registerServiceWorker }} />
        <script dangerouslySetInnerHTML={{ __html: enforceAppName }} />
      </body>
    </html>
  );
}
