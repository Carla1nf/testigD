import BetaWarning from "@/components/beta-warning"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import "@/styles/globals.css"
import Providers from "@/components/providers"
import "@rainbow-me/rainbowkit/styles.css"
import type { Metadata } from "next"
import { Inter as FontSans } from "next/font/google"

/**
 * These are the google fonts imported in the V1 website. find out if they are still used and import as necessary
 *
 * href="https://fonts.googleapis.com/css2?family=Anton&family=DynaPuff&family=Inter:wght@300;400;600&display=swap"
 * https://fonts.googleapis.com/css2?family=Lato&family=Raleway:wght@100;300;600;800&display=swap
 *
 * from the old website, it looks like only Inter & Raleway were actually used via the "font-family" css property
 */

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "Dēbita",
  description: "Dēbita is a decentralized lending protocol built on Fantom.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/svg+xml" href="/files/icon/debita-icon.svg" />
      </head>
      <body className={cn("min-h-screen bg-background font-sans antialiased", fontSans.variable)}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <BetaWarning />
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
