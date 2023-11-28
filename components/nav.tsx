import Link from "next/link";

const Nav = () => {
  return (
    <nav>
      <ul className="flex flex-row gap-4">
        <li>
          <Link href="/">Debita</Link>
        </li>
        <li>
          <Link href="/dashboard">Dashboard</Link>
        </li>
        <li>
          <Link href="/lend">Lend</Link>
        </li>
        <li>
          <Link href="/borrow">Borrow</Link>
        </li>
        <li>
          <Link href="/create">Create</Link>
        </li>
      </ul>
    </nav>
  );
};

export default Nav;
