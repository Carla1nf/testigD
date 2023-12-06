import { DEBITA_ADDRESS } from "@/lib/contracts"
import { MILLISECONDS_PER_MINUTE } from "@/lib/display"
import { ZERO_ADDRESS } from "@/services/constants"
import { useQuery } from "@tanstack/react-query"
import { Address } from "viem"
import { readContract } from "wagmi/actions"
import debitaAbi from "../abis/debita.json"
import z from "zod"

const CollateralDataReceivedSchema = z.object({
  collateralAmount: z.array(z.bigint()),
  collaterals: z.array(z.string()),
  interest: z.bigint(),
  owner: z.string(),
  paymentCount: z.bigint(),
  timelap: z.bigint(),
  wantedLenderAmount: z.bigint(),
  wantedLenderToken: z.string(),
  whitelist: z.array(z.string()),
})

export const useOfferCollateralData = (address: Address | undefined, index: number) => {
  const useOfferCollateralDataQuery = useQuery({
    queryKey: ["offer-collateral-data", address, index],
    queryFn: async () => {
      const collateralData = await readContract({
        address: DEBITA_ADDRESS,
        abi: debitaAbi,
        functionName: "getOfferCOLLATERAL_DATA",
        args: [index],
      })

      const parsedData = CollateralDataReceivedSchema.parse(collateralData)

      // We get WAY TOO MUCH DATA from this fucntion, it will trip RPC limits at some point
      // @ts-ignore
      if (parsedData.owner === ZERO_ADDRESS) {
        return null
      }

      // we should process the data here, collateral tokens should be an array of grouped data, not as multiple arrays
      console.log("parsedData", parsedData)

      return {
        ...parsedData,
        interest: Number(parsedData.interest) / 1000,
      }
    },
    refetchInterval: MILLISECONDS_PER_MINUTE * 30,
  })

  return useOfferCollateralDataQuery
}