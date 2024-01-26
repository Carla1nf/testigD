import { useLoanValues } from "@/hooks/useLoanValues"
import { useVeEqualPairsFixtures } from "@/hooks/useVeEqualPairs"
import { dollars, formatNumber, percent } from "@/lib/display"
import { LucideMinus, LucidePlus } from "lucide-react"
import { InputNumber } from "primereact/inputnumber"
import { useState } from "react"
import { Address } from "viem"
import { useConfig } from "wagmi"
import createdLoanABI from "@/abis/v2/createdLoan.json"
import { writeContract } from "wagmi/actions"

type Vote = {
  pair: string
  gauge: string
  amount: number
}

const VeEqualVotingTable = ({ selectedIndex, address }: { selectedIndex: number; address?: Address }) => {
  const pairs = useVeEqualPairsFixtures()
  const [votes, setVotes] = useState<Array<Vote>>([])
  const [totalVotes, setTotalVotes] = useState<number>(0)
  console.log(votes)
  const { isSuccess, isLoading, isError, data } = useLoanValues(address as Address, selectedIndex, "Borrowed")
  console.log(data, "DATA")
  const config = useConfig()

  // 10000 --> 100%
  // _voteWithVe(address[] calldata _poolVote, uint256[] calldata _weights)
  const voteWith = async () => {
    const getGauges = (await votes.map((item) => {
      return item.gauge as Address
    })) as Array<Address>
    const getWeights = (await votes.map((item) => {
      return item.amount
    })) as Array<number>
    console.log(getGauges)
    const { request } = await config.publicClient.simulateContract({
      address: data?.loan.address as Address,
      functionName: "_voteWithVe",
      abi: createdLoanABI,
      args: [["0xC9ACB5716f1bc12444B5c9e60fE03dF943Ab8600"], ["10000"]],
      account: address,
      gas: BigInt(830000),
    })
    const result = await writeContract(request)
  }

  return (
    <>
      <div className="flex justify-between mb-8">
        <div
          className="cursor-pointer bg-debitaPink px-5 py-1 rounded text-white font-medium"
          onClick={() => voteWith()}
        >
          Vote
        </div>
        <div className="text-[#B45696]">
          You have used {percent({ value: totalVotes / 10000, decimalsWhenGteOne: 0, decimalsWhenLessThanOne: 0 })}{" "}
          votes.
        </div>
      </div>
      <table className=" w-full text-right my-4 items-center table-auto">
        <thead className="font-bold text-lg">
          <th className="text-left">Pair</th>
          <th>Votes</th>
          <th>Votes %</th>
          <th>Vote APR</th>
          <th>Fees & Bribes</th>
          <th className="text-center">Vote</th>
        </thead>

        <tbody>
          {Array.isArray(pairs)
            ? pairs.map((pair: any) => {
                return (
                  <tr className="text-right py-2 items-center" key={pair.address}>
                    <td className="text-left">{pair.name}</td>
                    <td>{formatNumber({ value: pair.gauge.votes })}</td>
                    <td>{percent({ value: pair.gauge.weightPercent / 100 })}</td>
                    <td>
                      {percent({ value: Number(pair.gauge.aprUsd), decimalsWhenGteOne: 4, decimalsWhenLessThanOne: 4 })}
                    </td>
                    <td>{dollars({ value: pair.gauge.tbvUSD })}</td>
                    <td className="flex flex-row gap-4 items-center justify-center">
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
