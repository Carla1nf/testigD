import { DEBITA_ADDRESS } from "@/lib/contracts"
import { MILLISECONDS_PER_MINUTE } from "@/lib/display"
import { fromDecimals } from "@/lib/erc20"
import { findInternalTokenByAddress } from "@/lib/tokens"
import { ZERO_ADDRESS } from "@/services/constants"
import { fetchTokenPrice, makeLlamaUuid } from "@/services/token-prices"
import { useQuery } from "@tanstack/react-query"
import { Address } from "viem"
import { readContract } from "wagmi/actions"
import z from "zod"
import debitaAbi from "../abis/debita.json"
import useCurrentChain from "./useCurrentChain"

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
  const currentChain = useCurrentChain()
  const useOfferCollateralDataQuery: any = useQuery({
    queryKey: ["offer-collateral-data", currentChain.slug, address, index],
    queryFn: async () => {
      const collateralData = await readContract({
        address: DEBITA_ADDRESS,
        abi: debitaAbi,
        functionName: "getOfferCOLLATERAL_DATA",
        args: [index],
      })

      // console.log("RAW collateralData", collateralData)

      const parsedData = CollateralDataReceivedSchema.parse(collateralData)

      // console.log("parsedData", parsedData)

      // We get WAY TOO MUCH DATA from this function, it will trip RPC limits at some point
      // @ts-ignore
      if (parsedData.owner === ZERO_ADDRESS) {
        return null
      }

      // we should process the data here, collateral tokens should be an array of grouped data, not as multiple arrays
      // lets go one step further and bring token info and pricing in as well. This will make the data much more useful
      // and simplify rendering.
      const collaterals = parsedData.collaterals.map((address, index) => {
        const token = findInternalTokenByAddress(currentChain.slug, address)
        return {
          address,
          token,
          amountRaw: parsedData.collateralAmount[index],
          amount: fromDecimals(parsedData.collateralAmount[index], token?.decimals ?? 18),
          price: 0,
          valueUsd: 0,
        }
      })

      // cant use async map - hate them but need to use a for loop for that
      let totalCollateralValue = 0
      for (let i = 0; i < collaterals.length; i++) {
        const collateral = collaterals[i]
        const price = await fetchTokenPrice(makeLlamaUuid(currentChain.slug, collateral.address as Address))
        collateral.price = price.price ?? 0
        collateral.valueUsd = collateral.amount * collateral.price
        totalCollateralValue += collateral.valueUsd
      }

      // lets do the same for the lender token
      const lenderToken = findInternalTokenByAddress(currentChain.slug, parsedData.wantedLenderToken)
      const lending = {
        address: parsedData.wantedLenderToken,
        amountRaw: parsedData.wantedLenderAmount, // notice the subtle name shift from API casing to camelCase
        token: lenderToken,
        amount: fromDecimals(parsedData.wantedLenderAmount, lenderToken?.decimals ?? 18),
        price: 0,
        valueUsd: 0,
      }
      const price = await fetchTokenPrice(makeLlamaUuid(currentChain.slug, lending.address as Address))
      lending.price = price.price ?? 0
      lending.valueUsd = lending.amount * lending.price

      const ratio = totalCollateralValue / lending.valueUsd
      const ltv = (1 / ratio) * 100

      return {
        collaterals,
        interest: Number(parsedData.interest) / 1000,
        lending,
        ltv,
        numberOfLoanDays: Number(parsedData.timelap) / 86400,
        owner: parsedData.owner,
        paymentCount: parsedData.paymentCount,
        ratio,
        timelap: parsedData.timelap,
        totalCollateralValue,
        whitelist: parsedData.whitelist,
      }
    },
    refetchInterval: MILLISECONDS_PER_MINUTE * 30,
  })

  return useOfferCollateralDataQuery
}
