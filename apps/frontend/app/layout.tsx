import type { Metadata, Viewport } from "next";
import "./globals.css";
import {Navbar} from "../components/Navbar/Navbar";
import { Roboto, Roboto_Mono } from "next/font/google";
import "../helpers/loadFontAwesomeIcons";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" prefix="og: https://ogp.me/ns#">
      <body className={`${roboto.variable} ${roboto_mono.variable}`}>
        <Navbar/>
        {children}
      </body>
    </html>
  );
}
