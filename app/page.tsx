import Nav from "@/components/nav";
import styles from "./styles.module.css";
import { getDebitaData } from "@/server/actions";

export default function Home() {
  const data = getDebitaData();
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <Nav />
      <section className={styles.dashboard}>Home</section>
    </main>
  );
}
