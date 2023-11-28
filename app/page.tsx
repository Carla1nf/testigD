"use client"

import Nav from "@/components/nav"
import TotalLiquidityLent from "@/components/total-liquidity-lent"

// import styles from "./styles.module.css";

export default async function Home() {
  return (
    <>
      <Nav />
      <main className="flex min-h-screen flex-col items-center justify-between p-8 md:p-24">
        <TotalLiquidityLent />
      </main>
    </>
  )
}
