import type { Metadata, Viewport } from "next";
import "./globals.css";
import {Navbar} from "../components/Navbar/Navbar";

export const metadata: Metadata = {
  title: "Taxi Driver App",
  description: "Maximize your profit by getting recommended routes to quickly find passengers!",
  keywords: "taxi, passenger, routing",

  generator: "Next.js",
  referrer: 'no-referrer',

  openGraph: {
    title: "Taxi Driver App",
    type: "website",
    description: "Maximize your profit by getting recommended routes to quickly find passengers!"
  },
};

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'cyan' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" prefix="og: https://ogp.me/ns#">
      <body>
        <Navbar/>
        {children}
      </body>
    </html>
  );
}
