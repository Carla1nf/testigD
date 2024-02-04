import createdLoanABI from "@/abis/v2/createdLoan.json"
import { SpinnerIcon } from "@/components/icons"
import { ShowWhenTrue } from "@/components/ux/conditionals"
import DisplayPair from "@/components/ux/display-pair"
import { useLoanValues } from "@/hooks/useLoanValues"
import useVeEqualPairs from "@/hooks/useVeEqualPairs"
import { dollars, formatNumber, percent } from "@/lib/display"
import { LucideMinus, LucidePlus } from "lucide-react"
import { InputNumber } from "primereact/inputnumber"
import { useState } from "react"
import { Address } from "viem"
import { useConfig } from "wagmi"
import { writeContract } from "wagmi/actions"

type Vote = {
  pair: string
  gauge: string
  amount: number
}

const VeEqualVotingTable = ({ selectedIndex, address }: { selectedIndex: number | null; address?: Address }) => {
  const pairs = useVeEqualPairs()
  const [votes, setVotes] = useState<Array<Vote>>([])
  const [totalVotes, setTotalVotes] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)

  console.log(votes)
  const { isSuccess, isLoading, isError, data } = useLoanValues(address as Address, selectedIndex as number, "Borrowed")
  console.log(data, "DATA")
  const config = useConfig()

  // 10000 --> 100%
  // _voteWithVe(address[] calldata _poolVote, uint256[] calldata _weights)
  const voteWith = async () => {
    setLoading(true)
    const getPairs = (await votes.map((item) => {
      return item.pair as Address
    })) as Array<Address>
    const getWeights = (await votes.map((item) => {
      return item.amount
    })) as Array<number>
    try {
      const { request } = await config.publicClient.simulateContract({
        address: data?.loan.address as Address,
        functionName: "_voteWithVe",
        abi: createdLoanABI,
        args: [getPairs, getWeights],
        account: address,
        gas: BigInt(830000),
      })
      const result = await writeContract(request)
    } catch (e) {
      console.log(e)
      setLoading(false)
    }
    setLoading(false)
  }
  console.log(totalVotes)

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div
          className={`${
            selectedIndex == null ? "cursor-not-allowed opacity-60" : "cursor-pointer"
          } bg-debitaPink px-5 py-1 rounded text-white font-medium flex gap-2 items-center`}
          onClick={() => voteWith()}
        >
          Vote
          <ShowWhenTrue when={loading}>
            <SpinnerIcon className=" w-4 animate-spin-slow" />
          </ShowWhenTrue>
        </div>
        <div
          className={`${
            totalVotes > 10000 ? "text-red-400" : "text-gray-300"
          } text-xs md:text-sm flex h-10 gap-2 md:gap-2 items-center justify-center px-6 bg-black/20 rounded-xl`}
        >
          Voting Power Used:
          <div className={` text-base ${totalVotes > 10000 ? "text-red-400" : "text-white"} font-bold`}>
            {percent({ value: totalVotes / 10000, decimalsWhenGteOne: 0, decimalsWhenLessThanOne: 0 })} votes
          </div>
        </div>
      </div>
      <table className="  text-right  items-center rounded-xl overflow-hidden border-seperate border-spacing-y-3 table-auto w-full shadow-md  border-separate">
        <thead className="font-medium text-sm bg-black text-gray-500 rounded-full">
          <th className="text-left px-4 py-3">Pair</th>
          <th></th>
          <th>Votes</th>
          <th>Votes %</th>
          <th>Vote APR</th>
          <th>Fees & Bribes</th>
          <th className="text-center">Vote</th>
        </thead>

        <tbody className="">
          {Array.isArray(pairs)
            ? pairs.map((pair: any, index: number) => {
                console.log(pair, index)
                return (
                  <tr
                    className={`text-right items-center  ${
                      index % 2 == 1 ? "" : "bg-stone-500/5"
                    } hover:bg-slate-500/10 cursor-pointer animate-enter-token border-b border-[#383838]/50`}
                    key={pair.address}
                  >
                    <td className="px-2">
                      <DisplayPair token0={pair.token0.address} token1={pair.token1.address} size={26} />
                    </td>
                    <td className="text-left px-4 py-3">{pair.displayName}</td>
                    <td>{formatNumber({ value: pair.gauge.votes })}</td>
                    <td>{percent({ value: pair.gauge.weightPercent / 100 })}</td>
                    <td>
                      {percent({
                        value: Number(pair.gauge.aprUsd) / 100,
                        decimalsWhenGteOne: 4,
                        decimalsWhenLessThanOne: 4,
                      })}
                    </td>
                    <td>{dollars({ value: pair.gauge.tbvUSD })}</td>
                    <td className="flex flex-row gap-4 items-center justify-center py-3">
                      <InputNumber
                        suffix="%"
                        onValueChange={(event) => {
                          const newVotes = [...votes]
                          const vote = newVotes.find((v) => v.pair === pair.address)
                          if (vote) {
                            vote.amount = Number(event.target.value) * 100
                          } else {
                            newVotes.push({
                              pair: pair.address,
                              gauge: pair.gauge.address,
                              amount: Number(event.target.value) * 100,
                            })
                          }
                          const totalVotes = newVotes.reduce((acc, vote) => {
                            return acc + vote.amount
                          }, 0)
                          setVotes(newVotes)
                          setTotalVotes(totalVotes)
                        }}
                        buttonLayout="horizontal"
                        showButtons
                        min={0}
                        max={100}
                        incrementButtonIcon={<LucidePlus className="h-3 w-4 stroke-2" />}
                        decrementButtonIcon={<LucideMinus className="h-3 w-4 stroke-2" />}
                        pt={{
                          root: { className: "flex flex-row gap-2" },
                          input: {
                            root: { className: "bg-black/30 px-1 py-1.5 max-w-[100px] rounded-md text-center" },
                          },
                          decrementButton: { className: "order-first bg-black/80 px-2 py-2 rounded-md" },
                          incrementButton: { className: "order-last bg-black/80 px-2 rounded-md py-2" },
                        }}
                        minFractionDigits={0}
                      />
                    </td>
                  </tr>
                )
              })
            : null}
        </tbody>
      </table>
    </>
  )
}

export default VeEqualVotingTable
