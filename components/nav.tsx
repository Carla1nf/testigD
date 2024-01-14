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
          className={`px-6 text-center text-[14.5px] h-12 items-center grid rounded-xl hover:bg-slate-400/5 text-[#B6979C] ${
            path == "/dashboard" ? "border-b-2 border-debitaPink/50 rounded-none" : ""
          }`}
          href="/dashboard"
        >
          Dashboard
        </Link>
        <Link
          className={`px-6 text-center text-[14.5px] h-12 items-center grid rounded-xl text-[#B6979C]  hover:bg-slate-400/5  ${
            path == "/lend" ||
            (path.startsWith("/lend") && !path.startsWith("/lend-offer")) ||
            path.startsWith("/borrow-offer")
              ? "border-b-2 border-debitaPink/50 rounded-none"
              : ""
          }`}
          href="/lend"
        >
          Lend
        </Link>
        <Link
          className={`px-6 text-center text-[14.5px] text-[#B6979C] h-12 items-center grid rounded-xl hover:bg-slate-400/5  ${
            path == "/borrow" ||
            (path.startsWith("/borrow") && !path.startsWith("/borrow-offer")) ||
            path.startsWith("/lend-offer")
              ? "border-b-2 border-debitaPink/50 rounded-none"
              : ""
          }`}
          href="/borrow"
        >
          Borrow
        </Link>
        <a
          className="px-6 text-center text-[14.5px] text-[#B6979C] flex items-center gap-1 "
          href="https://paintswap.finance/marketplace/fantom/collections/0xCD2A61Da5Ef804C3D55636335F9c7482282571Dc"
          target="_blank"
          rel="noreferrer nofollow"
        >
          Debt Market <ExternalLink className="w-4 h-4" />
        </a>
      </div>
      <Link
        className={`px-4 text-center text-[14.5px] text-[#B6979C] h-12 items-center grid hover:bg-slate-400/5 rounded-xl  ${
          path == "/create" ? "border-b-2 border-debitaPink/50 rounded-none" : ""
        }`}
        href="/create"
      >
        Create Offer
      </Link>
      <div className="flex flex-row justify-between items-center p-4">
        <Connect />
      </div>
    </nav>
  )
}

export default Nav
