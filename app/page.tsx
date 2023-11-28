"use client";

import Nav from "@/components/nav";
import TotalLiquidityLent from "@/components/total-liquidity-lent";

import styles from "./styles.module.css";

export default async function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <Nav />
      <section className={styles.dashboard}>Home</section>

      <TotalLiquidityLent />
    </main>
  );
}
