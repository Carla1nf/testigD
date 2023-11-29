import Image from "next/image"
import Link from "next/link"
import Connect from "./connect"
import { ExternalLink } from "lucide-react"

const Nav = () => {
  return (
    <nav className="grid grid-cols-2">
      <div className="flex flex-row items-center p-4">
        <Link href="/" className="ml-8 w-36">
          <Image src="/files/navbar/debita.svg" height={50} width={90} alt="Dēbita" />
        </Link>
        <Link className="px-4 text-center text-[14.5px] text-[#B6979C]" href="/dashboard">
          Dashboard
        </Link>
        <Link className="px-4 text-center text-[14.5px] text-[#B6979C]" href="/lend">
          Lend
        </Link>
        <Link className="px-4 text-center text-[14.5px] text-[#B6979C]" href="/borrow">
          Borrow
        </Link>
        <a
          className="px-4 text-center text-[14.5px] text-[#B6979C] flex items-center gap-1"
          href="https://paintswap.finance/marketplace/fantom/collections/0xCD2A61Da5Ef804C3D55636335F9c7482282571Dc"
          target="_blank"
          rel="noreferrer nofollow"
        >
          Debt Market <ExternalLink className="w-4 h-4" />
        </a>
        <Link className="px-4 text-center text-[14.5px] text-[#B6979C]" href="/create">
          Create
        </Link>
      </div>
      <div className="flex flex-row justify-between items-center p-4">
        <Connect />
      </div>
    </nav>
  )
}

export default Nav
