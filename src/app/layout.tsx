import type { Metadata } from "next";
import "./globals.css";
import { AppKitProvider } from "@/providers/AppKitProvider";
import { LanguageProvider } from "@/contexts/LanguageContext";

export const metadata: Metadata = {
  title: "OVE Swap - Token Exchange Platform",
  description: "Swap OVE tokens with other cryptocurrencies on BSC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <LanguageProvider>
          <AppKitProvider>
            {children}
          </AppKitProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
