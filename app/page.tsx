"use client"

import TotalLiquidityLent from "@/components/total-liquidity-lent"
import { Button } from "@/components/ui/button"

// import styles from "./styles.module.css";

export default async function Home() {
  return (
    <div>
    <div className="bg-gradient-radial font-sans w-screen bg-[radial-gradient(50.40%_43.55%_at_50.56%_40.29%,rgba(84,64,114,0.3)_10%,rgba(33,33,33,1)_100%)] h-[70vh]">


    <div className="h-screen min-w-min animate-enter-div">
      <div className="max-w-7xl mx-auto flex items-center mt-10">
        <div className="space-y-6">
          <div>
          <h1 className="text-5xl font-bold">Customize & Create  </h1>
          <h1 className="font-extrabold text-transparent text-5xl bg-clip-text bg-gradient-to-r from-purple-400 to-pink-800">your loans</h1>
          </div>
          <p className="text-xl text-gray-400">P2P Oracle-less Lending Protocol</p>
          <div className="flex space-x-4">
            <Button className="bg-black/30 text-white"  variant="secondary">Launch app</Button>
            <Button className="bg-black/30 text-white" variant="secondary">

              <span>Watch how Debita v1.0 works</span>
            </Button>
          </div>
        </div>
        <div className="flex space-x-4 md:ml-32 relative">
       
          <img
          className="z-10 opacity-100 "
            height="580"
            src="/veNFT.png"
            
            width="580"
          />


         
        </div>
        
      </div>
         

    </div>

   </div>
  <div className=" flex justify-center gap-5   ">
  <div className=" w-[600px] bg-gradient-to-t from-background to-gray-500/10 h-96 rounded-xl" >
   <div className="p-8 font-bold text-2xl"> Time-liquidiation </div>
   <div className="p-8 text-gray-300 -mt-10">Lorem ipsum dolor sit amet consectetur adipiscing, elit dictum vulputate suscipit laoreet hendrerit, nascetur donec porttitor in montes. Lacinia lacus torquent congue faucibus scelerisque arcu, hendrerit class orci augue convallis.</div>
   </div>

   <div className=" w-[600px] bg-gradient-to-t from-background to-gray-500/10 h-96 rounded-xl" >
   <div className="p-8 font-bold text-2xl"> Time-liquidiation </div>
   <div className="p-8 text-gray-300 -mt-10">Lorem ipsum dolor sit amet consectetur adipiscing, elit dictum vulputate suscipit laoreet hendrerit, nascetur donec porttitor in montes. Lacinia lacus torquent congue faucibus scelerisque arcu, hendrerit class orci augue convallis. </div>
   </div>
  </div>


    </div>
  )
}
