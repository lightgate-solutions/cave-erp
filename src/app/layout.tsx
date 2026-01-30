import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import NextTopLoader from "nextjs-toploader";
import QueryProvider from "@/components/providers/query-provider";
import "./globals.css";
import { DeferredAnalytics } from "@/components/deferred-analytics";
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cave ERP",
  description: "Cave ERP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className={` antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          themes={["light", "dark", "ocean", "forest", "sunset", "system"]}
          disableTransitionOnChange
        >
          <NextTopLoader showSpinner={false} />
          <QueryProvider>
            <div>
              {children}
              <DeferredAnalytics />
            </div>
          </QueryProvider>
          <SonnerToaster
            className="toaster group"
            icons={{
              success: <CircleCheckIcon className="size-4" />,
              info: <InfoIcon className="size-4" />,
              warning: <TriangleAlertIcon className="size-4" />,
              error: <OctagonXIcon className="size-4" />,
              loading: <Loader2Icon className="size-4 animate-spin" />,
            }}
            richColors
            position="top-center"
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
