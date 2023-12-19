import BetaWarning from "@/components/beta-warning"
import Nav from "@/components/nav"
import Providers from "@/components/providers"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import "@/styles/globals.css"
import "@rainbow-me/rainbowkit/styles.css"
import type { Metadata } from "next"
import { Inter as FontSans } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"

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
      <body className={cn("bg-background font-sans antialiased overflow-x-hidden h-[calc(100dvh)]", fontSans.variable)}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <Providers>
            <>
              <BetaWarning />
              <Nav />
              <main className="flex min-h-screen flex-col py-16 px-12 grow">{children}</main>
              <footer className="p-8 text-center">&copy; 2023 Dēbita</footer>
              <Toaster />
            </>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
