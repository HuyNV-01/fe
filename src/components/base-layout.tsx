import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import type { ReactNode } from "react";
import { Quicksand } from "next/font/google";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { Toaster } from "./ui/sonner";
import { ThemeProvider } from "./theme/theme-provider";
import { NavHeader } from "./navigation/nav-header";
import { cn } from "@/lib/utils";

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

type Props = {
  children: ReactNode;
  locale: string;
};

export default async function BaseLayout({ children, locale }: Props) {
  const messages = await getMessages();

  return (
    <html className="h-screen" lang={locale} suppressHydrationWarning>
      <body
        className={cn(
          `${quicksand.className} antialiased flex h-full flex-col`,
          "flex items-center justify-center relative overflow-hidden",
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider messages={messages}>
            <TooltipProvider>
              <div className="absolute top-0 inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-300 dark:bg-blue-900/50 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute top-1/3 -right-32 w-96 h-96 bg-pink-300 dark:bg-pink-900/50 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-blue-200 dark:bg-blue-900/30 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-blob animation-delay-4000"></div>
              </div>
              <div className="w-full h-full flex flex-col flex-1">
                <div className="flex-none">
                  <NavHeader />
                </div>
                <div className="w-full h-full min-h-0 flex-1 overflow-scroll">
                  {children}
                </div>
              </div>
              <Toaster closeButton />
            </TooltipProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
