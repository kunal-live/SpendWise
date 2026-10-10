import type { Metadata, Viewport } from "next";
import "./globals.css";
import CookieConsent from "@/components/CookieConsent";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://spendwise.kunaljha8990.workers.dev";

export const viewport: Viewport = {
  themeColor: "#faf6ee",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "SpendWise - Smart Personal Finance & Expense Tracker",
    template: "%s | SpendWise"
  },
  description: "Track daily expenses, manage EMIs, calculate 50/30/20 budgets, and achieve financial clarity with SpendWise.",
  keywords: [
    "personal finance",
    "expense tracker",
    "budgeting app",
    "EMI calculator",
    "50/30/20 rule",
    "financial freedom",
    "money management",
    "spendwise"
  ],
  authors: [{ name: "SpendWise Team" }],
  creator: "SpendWise",
  publisher: "SpendWise",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    }
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    title: "SpendWise - Smart Personal Finance & Expense Tracker",
    description: "Track daily expenses, manage EMIs, calculate 50/30/20 budgets, and achieve financial clarity with SpendWise.",
    siteName: "SpendWise",
  },
  twitter: {
    card: "summary_large_image",
    title: "SpendWise - Smart Personal Finance & Expense Tracker",
    description: "Track daily expenses, manage EMIs, calculate 50/30/20 budgets, and achieve financial clarity with SpendWise.",
    creator: "@spendwise",
  },
  icons: {
    icon: "/icon",
    apple: "/apple-icon",
  },
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="canonical" href={siteUrl} />
      </head>
      <body className="min-h-screen bg-[#faf6ee] text-[#14151a] antialiased selection:bg-[#ff6b4a]/25 selection:text-[#14151a]">
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
