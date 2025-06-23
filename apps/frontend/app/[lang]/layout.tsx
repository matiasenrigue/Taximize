import type { Metadata, Viewport } from "next";
import "./globals.css";
import styles from "./layout.module.css";
import {Header} from "../../components/Header/Header";
import { Roboto, Roboto_Mono } from "next/font/google";
import {hasLocale, NextIntlClientProvider} from "next-intl";
import {routing} from "../../i18n/routing";
import {notFound} from "next/navigation";
import { ThemeProvider } from "../../components/ThemeProvider/ThemeProvider";

const roboto = Roboto({
  subsets: ["latin"],
  variable: "--font-roboto"
});

const roboto_mono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
  fallback: ["roboto"]
});

export const metadata: Metadata = {
  title: "Taxi Driver App",
  description: "Maximize your profit by getting recommended routes to quickly find passengers!",
  keywords: "taxi, passenger, routing",

  generator: "Next.js",
  referrer: "no-referrer",

  openGraph: {
    title: "Taxi Driver App",
    type: "website",
    description: "Maximize your profit by getting recommended routes to quickly find passengers!"
  },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "cyan" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
}

export default async function RootLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{lang: string}>;
}>) {
  const {lang} = await params;
  if (!hasLocale(routing.locales, lang))
    notFound();

  return (
    <html lang={lang} prefix="og: https://ogp.me/ns#">
      <body className={`${roboto.variable} ${roboto_mono.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <NextIntlClientProvider>
            <div className={styles.container}>
              <Header/>
              <main className={styles.main}>
                {children}
              </main>
            </div>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
