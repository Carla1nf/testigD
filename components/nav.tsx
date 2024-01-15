"use client"
import { ExternalLink } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import Connect from "./connect"
import { usePathname } from "next/navigation"

const Nav = () => {
  const path = usePathname()

  return (
    <nav className="flex items-center justify-between px-8">
      <div className="flex flex-row items-center p-4">
        <Link href="/" className="w-36">
          <Image src="/files/navbar/debita.svg" height={50} width={90} alt="Dēbita" />
        </Link>
        <Link
          className={`px-6 text-center text-[14.5px] h-12 items-center grid  hover:bg-slate-400/5 text-[#B6979C] ${
            path == "/dashboard" ? "border-b-2 border-debitaPink/50 rounded-none" : "rounded-xl"
          }`}
          href="/dashboard"
        >
          Dashboard
        </Link>
        <Link
          className={`px-6 text-center text-[14.5px] h-12 items-center grid  text-[#B6979C]  hover:bg-slate-400/5  ${
            path == "/lend" ||
            (path.startsWith("/lend") && !path.startsWith("/lend-offer")) ||
            path.startsWith("/borrow-offer")
              ? "border-b-2 border-debitaPink/50 rounded-none"
              : "rounded-xl"
          }`}
          href="/lend"
        >
          Lend
        </Link>
        <Link
          className={`px-6 text-center text-[14.5px] text-[#B6979C] h-12 items-center grid hover:bg-slate-400/5  ${
            path == "/borrow" ||
            (path.startsWith("/borrow") && !path.startsWith("/borrow-offer")) ||
            path.startsWith("/lend-offer")
              ? "border-b-2 border-debitaPink/50 rounded-none"
              : "rounded-xl"
          }`}
          href="/borrow"
        >
          Borrow
        </Link>
        <Link
          className={`px-4 text-center text-[14.5px] text-[#B6979C] h-12 items-center grid hover:bg-slate-400/5   ${
            path == "/leaderboard" ? "border-b-2 border-debitaPink/50 rounded-none" : "rounded-xl"
          }`}
          href="/leaderboard"
        >
          Leaderboard
        </Link>
      </div>

      <div className="flex gap-4 flex-row justify-between items-center p-4">
        <Link
          className={`px-4 text-center text-[14.5px] text-[#B6979C] h-12 items-center grid hover:bg-slate-400/5   ${
            path == "/create" ? "border-b-2 border-debitaPink/50 rounded-none" : "rounded-xl"
          }`}
          href="/create"
        >
          Create Offer
        </Link>
        <Connect />
      </div>
    </nav>
  )
}

export default Nav
