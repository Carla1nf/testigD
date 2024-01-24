import { useVeEqualPairsFixtures } from "@/hooks/useVeEqualPairs"
import { dollars, formatNumber, percent } from "@/lib/display"
import { LucideMinus, LucidePlus } from "lucide-react"
import { InputNumber } from "primereact/inputnumber"
import { useState } from "react"

type Vote = {
  pair: string
  gauge: string
  amount: number
}

const VeEqualVotingTable = () => {
  const pairs = useVeEqualPairsFixtures()
  const [votes, setVotes] = useState<Array<Vote>>([])
  const [totalVotes, setTotalVotes] = useState<number>(0)

  return (
    <>
      <div className="flex justify-between mb-8">
        <div>VOTE BUTTON GOES HERE!</div>
        <div className="text-[#B45696]">
          You have used {percent({ value: totalVotes / 100, decimalsWhenGteOne: 0, decimalsWhenLessThanOne: 0 })} votes.
        </div>
      </div>
      <div className="grid grid-cols-[1fr_12%_12%_12%_12%_18%] w-full text-right text-lg font-bold my-4 items-center">
        <div className="text-left">Pair</div>
        <div>Votes</div>
        <div>Votes %</div>
        <div>Vote APR</div>
        <div>Fees & Bribes</div>
        <div className="text-right">Vote</div>
      </div>

      {Array.isArray(pairs)
        ? pairs.map((pair: any) => {
            return (
              <div className="grid grid-cols-[1fr_12%_12%_12%_12%_18%] text-right py-2 items-center" key={pair.address}>
                <div className="text-left">{pair.name}</div>
                <div>{formatNumber({ value: pair.gauge.votes })}</div>
                <div>{percent({ value: pair.gauge.weightPercent / 100 })}</div>
                <div>
                  {percent({ value: Number(pair.gauge.aprUsd), decimalsWhenGteOne: 4, decimalsWhenLessThanOne: 4 })}
                </div>
                <div>{dollars({ value: pair.gauge.tbvUSD })}</div>
                <div className="flex flex-row gap-4 items-center justify-end">
                  <InputNumber
                    suffix="%"
                    onValueChange={(event) => {
                      const newVotes = [...votes]
                      const vote = newVotes.find((v) => v.pair === pair.address)
                      if (vote) {
                        vote.amount = Number(event.target.value)
                      } else {
                        newVotes.push({
                          pair: pair.address,
                          gauge: pair.gauge.address,
                          amount: Number(event.target.value),
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
                      input: { root: { className: "bg-black/30 px-1 py-1.5 max-w-[100px] rounded-md text-center" } },
                      decrementButton: { className: "order-first bg-black/80 px-2 py-2 rounded-md" },
                      incrementButton: { className: "order-last bg-black/80 px-2 rounded-md py-2" },
                    }}
                    minFractionDigits={0}
                  />
                </div>
              </div>
            )
          })
        : null}
    </>
  )
}

export default VeEqualVotingTable
