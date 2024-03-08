"use client"
import { ExternalLink } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import Connect from "./connect"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { ShowWhenTrue } from "./ux/conditionals"

const Nav = () => {
  const path = usePathname()
  const [isMobileNavbarOpen, setIsMobileNavbarOpen] = useState(false)
  return (
    <nav className="flex items-center justify-between px-8">
      <div className=" hidden md:flex flex-row items-center p-4">
        <Link href="/" className="w-28">
          <Image src="/files/navbar/debita.svg" height={50} width={100} alt="Dēbita" />
        </Link>
        <Link
          className={`px-4 text-center text-[14.5px] h-12 items-center grid  hover:bg-slate-400/5 text-[#B6979C] ${
            path == "/dashboard" ? "border-b-2 border-debitaPink/50  rounded-t-xl" : "rounded-xl"
          }`}
          href="/dashboard"
        >
          Dashboard
        </Link>
        <Link
          className={`px-4 text-center text-[14.5px] h-12 items-center grid  text-[#B6979C]  hover:bg-slate-400/5  ${
            path == "/lend" ||
            (path.startsWith("/lend") && !path.startsWith("/lend-offer")) ||
            path.startsWith("/borrow-offer")
              ? "border-b-2 border-debitaPink/50  rounded-t-xl"
              : "rounded-xl"
          }`}
          href="/lend"
        >
          Lend
        </Link>
        <Link
          className={`px-4 text-center text-[14.5px] text-[#B6979C] h-12 items-center grid hover:bg-slate-400/5  ${
            path == "/borrow" ||
            (path.startsWith("/borrow") && !path.startsWith("/borrow-offer")) ||
            path.startsWith("/lend-offer")
              ? "border-b-2 border-debitaPink/50  rounded-t-xl"
              : "rounded-xl"
          }`}
          href="/borrow"
        >
          Borrow
        </Link>

        <Link
          className={`px-3 text-center text-[14.5px] text-[#B6979C] hidden  h-12 items-center md:grid hover:bg-slate-400/5   ${
            path == "/create" ? "border-b-2 border-debitaPink/50  rounded-t-xl" : "rounded-xl"
          }`}
          href="/create"
        >
          Create Offer
        </Link>
      </div>

      <div className="flex gap-4 flex-row justify-between items-center p-4">
        <Link
          className={`px-4 hidden md:grid  text-center text-[14.5px] text-[#B6979C] h-12 items-center  hover:bg-slate-400/5   ${
            path == "/vote" ? "border-b-2 border-debitaPink/50  rounded-t-xl" : "rounded-xl"
          }`}
          href="/vote"
        >
          veNFTs
        </Link>
        <Link
          className={`px-4 text-center hidden md:grid  text-[14.5px] text-[#B6979C] h-12 items-center  hover:bg-slate-400/5   ${
            path == "/leaderboard" ? "border-b-2 border-debitaPink/50  rounded-t-xl" : "rounded-xl"
          }`}
          href="/leaderboard"
        >
          Leaderboard
        </Link>

        <Connect />
        {/* MOBILE */}
        <div className="flex md:hidden" onClick={() => setIsMobileNavbarOpen(true)}>
          <img src="files/icon/Bar.svg" width={35} className="rounded-full cursor-pointer" />
        </div>
        <ShowWhenTrue when={isMobileNavbarOpen}>
          <div className="fixed top-0 bottom-0 left-0 right-0 bg-background  md:hidden z-20 p-8">
            <div className="flex flex-col">
              <div className="flex items-center">
                <div className="w-full ">
                  <Image src="/files/navbar/debita.svg" height={50} width={100} alt="Dēbita" />
                </div>
                <img
                  src="files/icon/Close.svg"
                  className="cursor-pointer"
                  width={15}
                  onClick={() => setIsMobileNavbarOpen(false)}
                />
              </div>
              <div className=" flex flex-col gap-5 mt-10">
                <Link
                  onClick={() => setIsMobileNavbarOpen(false)}
                  className="rounded-xl  bg-slate-500/20   px-4 text-center animate-enter-token text-[14.5px] h-12 items-center grid hover:bg-slate-400/10 font-semibold opacity-0 fill-mode-forwards delay"
                  href="/dashboard"
                >
                  Dashboard
                </Link>

                <a
                  onClick={() => setIsMobileNavbarOpen(false)}
                  className="rounded-xl  bg-slate-500/20   px-4 text-center animate-enter-token text-[14.5px] h-12 items-center grid hover:bg-slate-400/10 font-semibold opacity-0 fill-mode-forwards delay"
                  href="/lend"
                >
                  Lend
                </a>

                <Link
                  onClick={() => setIsMobileNavbarOpen(false)}
                  className="rounded-xl  bg-slate-500/20   px-4 text-center animate-enter-token text-[14.5px] h-12 items-center grid hover:bg-slate-400/10 font-semibold opacity-0 fill-mode-forwards delay"
                  href="/borrow"
                >
                  Borrow
                </Link>

                <Link
                  onClick={() => setIsMobileNavbarOpen(false)}
                  className="rounded-xl  bg-slate-500/20   px-4 text-center animate-enter-token text-[14.5px] h-12 items-center grid hover:bg-slate-400/10 font-semibold opacity-0 fill-mode-forwards delay"
                  href={"/create"}
                >
                  Create offer
                </Link>
                <Link
                  onClick={() => setIsMobileNavbarOpen(false)}
                  className="rounded-xl  bg-slate-500/20   px-4 text-center animate-enter-token text-[14.5px] h-12 items-center grid hover:bg-slate-400/10 font-semibold opacity-0 fill-mode-forwards delay"
                  href={"/leaderboard"}
                >
                  Leaderboard
                </Link>
                <Link
                  onClick={() => setIsMobileNavbarOpen(false)}
                  className="rounded-xl  bg-slate-500/20   px-4 text-center animate-enter-token text-[14.5px] h-12 items-center grid hover:bg-slate-400/10 font-semibold opacity-0 fill-mode-forwards delay-75"
                  href={"/vote"}
                >
                  Vote
                </Link>
              </div>
            </div>
          </div>
        </ShowWhenTrue>
      </div>
    </nav>
  )
}

export default Nav
