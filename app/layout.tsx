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
import axios from "axios"
import TermsAndConditions from "@/components/ux/terms-and-conditions"

/**
 * These are the google fonts imported in the V1 website. find out if they are still used and import as necessary
 *
 * href="https://fonts.googleapis.com/css2?family=Anton&family=DynaPuff&family=Inter:wght@300;400;600&display=swap"
 * https://fonts.googleapis.com/css2?family=Lato&family=Raleway:wght@100;300;600;800&display=swap
 *
 * from the old website, it looks like only Inter & Raleway were actually used via the "font-family" css property
 */

const fontSans = FontSans({
  subsets: ["latin-ext"],
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
              <TermsAndConditions />
              <BetaWarning />
              <Nav />
              <main className="flex min-h-screen flex-col py-16 px-12 grow h-auto">{children}</main>
              <footer className=" text-center mt-14 ">
                <div className="bg-neutral-800 md:h-96 w-screen">
                  <div className="flex flex-col py-12 px-20 gap-10">
                    <img src="files/navbar/debita.svg" width={130} />
                    <div className="flex md:flex-row flex-col w-full justify-between md:gap-0 gap-10">
                      <div className="flex flex-col text-center">
                        <div className=" font-semibold text-xl text-gray-400">Start now</div>
                        <div className="text-gray-400 font-light cursor-pointer hover:text-gray-300 hover:scale-[1.01] transition-all ">
                          Lend
                        </div>
                        <div className="text-gray-400 font-light cursor-pointer hover:text-gray-300 hover:scale-[1.01] transition-all">
                          Borrow
                        </div>
                        <div className="text-gray-400 font-light cursor-pointer hover:text-gray-300 hover:scale-[1.01] transition-all">
                          Create offer
                        </div>

                        <div className="text-gray-400 font-light cursor-pointer hover:text-gray-300 hover:scale-[1.01] transition-all">
                          Leaderboard
                        </div>
                      </div>

                      <div className="flex flex-col text-center">
                        <div className=" font-semibold text-xl text-gray-400">Information</div>
                        <div className="text-gray-400 font-light cursor-pointer hover:text-gray-300 hover:scale-[1.01] transition-all">
                          Docs
                        </div>
                        <div className="text-gray-400 font-light cursor-pointer hover:text-gray-300 hover:scale-[1.01] transition-all">
                          Contracts
                        </div>
                        <div className="text-gray-400 font-light cursor-pointer hover:text-gray-300 hover:scale-[1.01] transition-all">
                          How does Debita V2 work?
                        </div>
                        <div className="text-gray-400 font-light cursor-pointer hover:text-gray-300 hover:scale-[1.01] transition-all">
                          Points
                        </div>
                      </div>

                      <div className="flex flex-col text-center">
                        <div className=" font-semibold text-xl text-gray-400">Contact</div>
                        <div className="text-gray-400 font-light cursor-pointer hover:text-gray-300 hover:scale-[1.01] transition-all">
                          team@debita.fi
                        </div>
                        <div className="text-gray-400 font-light cursor-pointer hover:text-gray-300 hover:scale-[1.01] transition-all">
                          @DebitaFinance{" "}
                        </div>
                        <div className="text-gray-400 font-light cursor-pointer hover:text-gray-300 hover:scale-[1.01] transition-all">
                          @MoraDebita | Debita BD
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="h-24 flex items-end justify-center px-20 py-5"> &copy; 2023 Dēbita</div>
                </div>
              </footer>
              <Toaster />
            </>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
