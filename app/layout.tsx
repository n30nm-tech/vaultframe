import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { getAuthOverview } from "@/lib/server/auth";

export const metadata: Metadata = {
  title: "VaultFrame",
  description: "Self-hosted media library for indexed video collections.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authOverview = await getAuthOverview();

  return (
    <html lang="en">
      <body>
        <AppShell authEnabled={authOverview.enabled}>{children}</AppShell>
      </body>
    </html>
  );
}
