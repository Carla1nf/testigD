import { DEBITA_ADDRESS } from "@/lib/contracts"
import { MILLISECONDS_PER_MINUTE } from "@/lib/display"
import { ZERO_ADDRESS } from "@/services/constants"
import { useQuery } from "@tanstack/react-query"
import { Address } from "viem"
import { readContract } from "wagmi/actions"
import z from "zod"
import debitaAbi from "../abis/debita.json"
import { findInternalTokenByAddress } from "@/lib/tokens"
import useCurrentChain from "./useCurrentChain"
import { fromDecimals } from "@/lib/erc20"
import { fetchTokenPrice, makeLlamaUuid } from "@/services/token-prices"

const LenderDataReceivedSchema = z.object({
  LenderAmount: z.bigint(),
  LenderToken: z.string(),
  interest: z.bigint(),
  owner: z.string(),
  paymentCount: z.bigint(),
  timelap: z.bigint(),
  wantedCollateralAmount: z.array(z.bigint()),
  wantedCollateralTokens: z.array(z.string()),
  whitelist: z.array(z.string()),
})

type LenderDataReceived = z.infer<typeof LenderDataReceivedSchema>

export const useOfferLenderData = (address: Address | undefined, id: number) => {
  const currentChain = useCurrentChain()
  const useOfferLenderDataQuery = useQuery({
    queryKey: ["offer-lender-data", address, id],
    queryFn: async () => {
      const lenderData = (await readContract({
        address: DEBITA_ADDRESS,
        abi: debitaAbi,
        functionName: "getOfferLENDER_DATA",
        args: [id],
      })) as LenderDataReceived

      const parsedData = LenderDataReceivedSchema.parse(lenderData)
      // console.log("parsedData", parsedData)

      // We get WAY TOO MUCH DATA from this function, it will trip RPC limits at some point

      if (parsedData.owner === ZERO_ADDRESS) {
        return null
      }

      // we should process the data here, collateral tokens should be an array of grouped data, not as multiple arrays
      // lets go one step further and bring token info and pricing in as well. This will make the data much more useful
      // and simplify rendering.
      const collaterals = parsedData.wantedCollateralTokens.map((address, index) => {
        const token = findInternalTokenByAddress(currentChain.slug, address)
        return {
          address,
          token,
          amountRaw: parsedData.wantedCollateralAmount[index],
          amount: fromDecimals(parsedData.wantedCollateralAmount[index], token?.decimals ?? 18),
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
      const lenderToken = findInternalTokenByAddress(currentChain.slug, parsedData.LenderToken)
      const borrowing = {
        address: parsedData.LenderToken,
        amountRaw: parsedData.LenderAmount,
        token: lenderToken,
        amount: fromDecimals(parsedData.LenderAmount, lenderToken?.decimals ?? 18),
        price: 0,
        valueUsd: 0,
      }

      const price = await fetchTokenPrice(makeLlamaUuid(currentChain.slug, borrowing.address as Address))
      borrowing.price = price.price ?? 0
      borrowing.valueUsd = borrowing.amount * borrowing.price

      const ratio = totalCollateralValue / borrowing.valueUsd
      const ltv = (1 / ratio) * 100
      const numberOfLoanDays = Number(parsedData.timelap) / 86400
      const apr = ((Number(parsedData.interest) / Number(numberOfLoanDays)) * 365) / 1000 // percentages are 0.134 for 13.4%

      return {
        collaterals,
        interest: Number(lenderData.interest) / 1000,
        borrowing,
        ltv,
        apr,
        numberOfLoanDays,
        owner: lenderData.owner,
        paymentCount: lenderData.paymentCount,
        timelap: lenderData.timelap,
        wantedCollateralAmount: lenderData.wantedCollateralAmount,
        totalCollateralValue,
        whitelist: lenderData.whitelist,
      }
    },
    refetchInterval: MILLISECONDS_PER_MINUTE * 30,
  })

  return useOfferLenderDataQuery
}
