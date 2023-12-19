"use client"

import TotalLiquidityLent from "@/components/total-liquidity-lent"

// import styles from "./styles.module.css";

export default async function Home() {
  return (
    <div className="bg-gradient-radial font-sans absolute top-24 w-screen bg-[radial-gradient(50.40%_43.55%_at_50.56%_40.29%,rgba(84,64,114,0.3)_10%,rgba(33,33,33,1)_100%)] h-[100vh]">
      <TotalLiquidityLent />
    </div>
  )
}
