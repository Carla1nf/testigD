"use client"

import TotalLiquidityLent from "@/components/total-liquidity-lent"
import { Button } from "@/components/ui/button"

// import styles from "./styles.module.css";

export default async function Home() {
  return (
    <div className="bg-gradient-radial font-sans absolute top-24 w-screen bg-[radial-gradient(50.40%_43.55%_at_50.56%_40.29%,rgba(84,64,114,0.3)_10%,rgba(33,33,33,1)_100%)] h-[100vh]">


    <div className="h-screen min-w-min">
      <div className="max-w-7xl mx-auto flex items-center mt-40">
        <div className="space-y-6">
          <div>
          <h1 className="text-5xl font-bold">Customize, Create & Sell </h1>
          <h1 className="font-extrabold text-transparent text-5xl bg-clip-text bg-gradient-to-r from-purple-400 to-pink-800">your loans</h1>
          </div>
          <p className="text-xl">P2P Oracle-less Lending Protocol</p>
          <div className="flex space-x-4">
            <Button className="bg-black/30 text-white"  variant="secondary">Borrow now</Button>
            <Button className="bg-black/30 text-white" variant="secondary">

              <span>Watch how Debita works</span>
            </Button>
          </div>
        </div>
        <div className="flex space-x-4 md:ml-40 relative">
       
          <img
          className="z-10 opacity-10"
            height="300"
            src="/files/tokens/anyUsdc.svg"
            
            width="300"
          />


         
        </div>
      </div>
    </div>
  


      <TotalLiquidityLent />
    </div>
  )
}
