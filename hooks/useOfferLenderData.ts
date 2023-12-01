import { DEBITA_ADDRESS } from "@/lib/contracts"
import { MILLISECONDS_PER_MINUTE } from "@/lib/display"
import { ZERO_ADDRESS } from "@/services/constants"
import { useQuery } from "@tanstack/react-query"
import { Address } from "viem"
import { readContract } from "wagmi/actions"
import z from "zod"
import debitaAbi from "../abis/debita.json"

const LenderDataReceivedSchema = z.object({
  LenderAmount: z.bigint(),
  LenderToken: z.string(),
  interest: z.bigint(),
  owner: z.string(),
  paymentCount: z.bigint(),
  timelap: z.bigint(),
  wantedCollateralAmount: z.bigint(),
  wantedCollateralTokens: z.array(z.string()),
  whitelist: z.array(z.string()),
})

type LenderDataReceived = z.infer<typeof LenderDataReceivedSchema>

export const useOfferLenderData = (address: Address | undefined, id: number) => {
  const useOfferLenderDataQuery = useQuery({
    queryKey: ["offer-lender-data", address, id],
    queryFn: async () => {
      const lenderData = (await readContract({
        address: DEBITA_ADDRESS,
        abi: debitaAbi,
        functionName: "getOfferLENDER_DATA",
        args: [id],
      })) as LenderDataReceived

      // todo: parse with zod!
      // const parsedData = LenderDataReceivedSchema.parse(lenderData)

      // We get WAY TOO MUCH DATA from this function, it will trip RPC limits at some point

      if (lenderData.owner === ZERO_ADDRESS) {
        return null
      }

      return {
        lenderAmount: lenderData.LenderAmount, // notice the subtle name shift from API casing to camelCase
        lenderToken: lenderData.LenderToken, // notice the subtle name shift from API casing to camelCase
        interest: Number(lenderData.interest) / 1000,
        owner: lenderData.owner,
        paymentCount: lenderData.paymentCount,
        timelap: lenderData.timelap,
        wantedCollateralAmount: lenderData.wantedCollateralAmount,
        wantedCollateralTokens: lenderData.wantedCollateralTokens,
        whitelist: lenderData.whitelist,
      }
    },
    refetchInterval: MILLISECONDS_PER_MINUTE * 30,
  })

  return useOfferLenderDataQuery
}
