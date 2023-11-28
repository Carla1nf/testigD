import Link from "next/link"
import Image from "next/image"

const Nav = () => {
  return (
    <nav className="grid grid-cols-2">
      <div className="flex flex-row items-center p-4">
        <Link href="/" className="ml-8 w-36">
          <Image src="/files/navbar/debita.svg" height={50} width={90} alt="Dēbita" />
        </Link>
        <Link className="w-28 text-center text-[14.5px] text-[#B6979C]" href="/dashboard">
          Dashboard
        </Link>
        <Link className="w-28 text-center text-[14.5px] text-[#B6979C]" href="/lend">
          Lend
        </Link>
        <Link className="w-28 text-center text-[14.5px] text-[#B6979C]" href="/borrow">
          Borrow
        </Link>
        <Link className="w-28 text-center text-[14.5px] text-[#B6979C]" href="/create">
          Create
        </Link>
      </div>
      <div>hi</div>
    </nav>
  )
}

export default Nav
