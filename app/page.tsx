"use client"

import TotalLiquidityLent from "@/components/total-liquidity-lent"
import { Button } from "@/components/ui/button"
import DisplayToken from "@/components/ux/display-token"
import useCurrentChain from "@/hooks/useCurrentChain"
import { useLendingMarket } from "@/hooks/useLendingMarket"
import { dollars, percent } from "@/lib/display"
import Image from "next/image"
import { useRouter } from "next/navigation"

// import styles from "./styles.module.css";

export default function Home() {
  const { offers } = useLendingMarket()
  const router = useRouter()
  const currentChain = useCurrentChain()

  return (
    <div>
      <div className="bg-gradient-radial font-sans w-screen bg-[radial-gradient(50.40%_43.55%_at_50.56%_40.29%,rgba(84,64,114,0.3)_10%,rgba(33,33,33,1)_100%)] h-[70vh]">
        <div className="h-screen min-w-min animate-enter-div">
          <div className="max-w-7xl mx-auto flex items-center mt-10">
            <div className="space-y-6">
              <div>
                <h1 className="text-5xl font-bold">Customize & Create </h1>
                <h1 className="font-extrabold text-transparent text-5xl bg-clip-text bg-gradient-to-r from-purple-400 to-pink-800">
                  your loans
                </h1>
              </div>
              <p className="text-xl text-gray-400">P2P Oracle-less Lending Protocol</p>
              <div className="flex space-x-4">
                <Button className="bg-black/30 text-white" variant="secondary">
                  Launch app
                </Button>
                <Button className="bg-black/30 text-white" variant="secondary">
                  <span>Watch how Debita v1.0 works</span>
                </Button>
              </div>
            </div>
            <div className="flex space-x-4 md:ml-32 relative">
              <Image className="z-10 opacity-100 " height={580} src="/veNFT.png" alt="veNFT" width={580} />
            </div>
          </div>
        </div>
      </div>
      <div className=" flex justify-center gap-5">
        <div className=" w-[600px] bg-gradient-to-t from-background to-gray-500/10 h-96 rounded-xl">
          <div className="p-8 font-bold text-2xl"> Time-based liquidiation </div>
          <div className="p-8 text-gray-400 -mt-10">
            Lorem ipsum dolor sit amet consectetur adipiscing, elit dictum vulputate suscipit laoreet hendrerit,
            nascetur donec porttitor in montes. Lacinia lacus torquent congue faucibus scelerisque arcu, hendrerit class
            orci augue convallis.
          </div>
          <div className="flex justify-center gap-5">
            <div className="h-56 bg-slate-300 w-40 rounded-3xl bg-gradient-to-t from-background to-debitaPink"></div>
            <div className=" h-40 bg-slate-300 w-40 rounded-3xl bg-gradient-to-t from-background to-debitaPink"></div>
            <div className=" h-28 bg-slate-300 w-40 rounded-3xl bg-gradient-to-t from-background to-debitaPink"></div>
          </div>
        </div>

        <div className=" w-[600px] bg-gradient-to-t from-background to-gray-500/10 h-96 rounded-xl">
          <div className="p-8 font-bold text-2xl"> Use any Token as Collateral </div>
          <div className="p-8 text-gray-400 -mt-10">
            Lorem ipsum dolor sit amet consectetur adipiscing, elit dictum vulputate suscipit laoreet hendrerit,
            nascetur donec porttitor in montes. Lacinia lacus torquent congue faucibus scelerisque arcu, hendrerit class
            orci augue convallis.
          </div>
          <div className="flex justify-center gap-5">
            <div className="h-56 bg-slate-300 w-40 rounded-3xl bg-gradient-to-t from-background to-debitaPink"></div>
            <div className=" h-40 bg-slate-300 w-40 rounded-3xl bg-gradient-to-t from-background to-debitaPink"></div>
            <div className=" h-28 bg-slate-300 w-40 rounded-3xl bg-gradient-to-t from-background to-debitaPink"></div>
          </div>
        </div>
      </div>

      <div className="grid grid-rows-2 ml-14 mt-28">
        <div className=" p-5 font-bold text-2xl flex items-center gap-10 ">
          <div>Most traded tokens </div>
          <div className=" bg-black/20 rounded-xl">
            {" "}
            <TotalLiquidityLent />{" "}
          </div>
        </div>
        <div className="flex flex-col">
          <div className="flex font-bold border-b-2 border-gray-400/5 -mt-5 text-gray-500 text-sm text-center">
            <div className="p-3 w-48 ">TOKEN</div>
            <div className="p-3 w-72">LIQUIDITY</div>
            <div className="p-3 w-72">OFFERS</div>
            <div className="p-3 w-72">INTEREST</div>
          </div>
          {offers?.map((offer: any, index: number) => {
            return (
              <div key={offer.tokenAddress} className="hover:bg-[#383838] rounded flex">
                <div className="p-5"> {index + 1}. </div>
                <td className="p-4 text-left px-4 items-center w-36">
                  {offer.token ? <DisplayToken size={28} token={offer.token} chainSlug={currentChain.slug} /> : null}
                </td>

                <td className="p-4 w-72 text-center font-semibold">{dollars({ value: offer.liquidityOffer })}</td>
                <td className="p-4 w-72 text-center px-4 items-center font-semibold">{offer.events.length}</td>
                <td className="p-4 w-72 text-center px-4 items-center font-semibold">
                  {percent({ value: offer.averageInterestRate, decimalsWhenGteOne: 2, decimalsWhenLessThanOne: 2 })}
                </td>

                <Button
                  onClick={() => {
                    router.push(`/borrow/${offer.token.address}`)
                  }}
                  className="bg-black/30 text-white self-center text-xs"
                  variant="secondary"
                >
                  Borrow
                </Button>
                <Button
                  onClick={() => {
                    router.push(`/lend/${offer.token.address}`)
                  }}
                  className="bg-black/30 text-white self-center ml-5 text-xs"
                  variant="secondary"
                >
                  Lend
                </Button>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-10 ml-16 mt-28">
        <div className="p-5 font-bold text-2xl">Debita Markets</div>
        <div className="flex">
          {["Fantom", "Base"].map((chain, index) => {
            return (
              <div
                key={chain}
                className={`w-[350px] relative flex flex-col ml-5 rounded-md h-80 ${
                  !index ? "hover:bg-slate-400/20" : ""
                }`}
              >
                {!index ? (
                  <div className=" w-14 text-center absolute right-10 bg-green-300/50 rounded mt-5 text-green-200">
                    Live
                  </div>
                ) : (
                  <div className=" w-14 text-center absolute right-10 bg-yellow-300/50 rounded mt-5 text-yellow-200">
                    Soon
                  </div>
                )}
                <Image
                  alt={chain}
                  height="90"
                  width="90"
                  className="p-4"
                  src={`${!index ? "/files/tokens/fantom/ftm-native.svg" : "/files/tokens/base/Base.svg"}`}
                />
                <div className="p-4 font-bold text-xl -mt-3">{chain}</div>
                <div className="p-4 font-semibold text-sm text-gray-400 -mt-3">
                  Lorem ipsum dolor sit amet consectetur adipiscing elit, consequat potenti etiam at suspendisse blandit
                  donec aptent, lectus venenatis bibendum facilisis accumsan euismod. Scelerisque penatibus potenti per
                  mauris volutpat nam nullam
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
