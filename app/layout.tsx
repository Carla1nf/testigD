import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

/**
 * These are the google fonts imported in the V1 website. find out if they are still used and import as necessary
 *
 * href="https://fonts.googleapis.com/css2?family=Anton&family=DynaPuff&family=Inter:wght@300;400;600&display=swap"
 * https://fonts.googleapis.com/css2?family=Lato&family=Raleway:wght@100;300;600;800&display=swap
 */
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Dēbita",
  description: "Dēbita is a decentralized lending protocol built on Fantom.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
