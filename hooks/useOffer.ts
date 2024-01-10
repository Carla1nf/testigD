import createdOfferABI from "@/abis/v2/createdOffer.json"
import { MILLISECONDS_PER_MINUTE } from "@/lib/display"
import { fromDecimals } from "@/lib/erc20"
import { findInternalTokenByAddress } from "@/lib/tokens"
import { fetchTokenPrice, makeLlamaUuid } from "@/services/token-prices"
import { useQuery } from "@tanstack/react-query"
import { Address } from "viem"
import { readContract } from "wagmi/actions"
import z from "zod"
import useCurrentChain from "./useCurrentChain"

/**
 * @dev create Offer
 * @param assetAddresses [0] = Lending, [1] = Collateral
 * @param assetAmounts [0] = Lending, [1] = Collateral
 * @param isAssetNFT [0] = Lending, [1] = Collateral
 * @param _interestRate (1 ==> 0.01%, 1000 ==> 10%, 10000 ==> 100%)
 * @param nftData [0] = NFT ID, [2] Total amount of interest (If lending is NFT) ---  0 on each if not NFT
 * @param veValue value of wanted locked veNFT (for borrower or lender) (0 if not veNFT)
 * @param _paymentCount Number of payments
 * @param _timelap timelap on each payment
 * @param loanBooleans [0] = isLending (true --> msg.sender is Lender), [1] = isPerpetual
 * @param interest_address address of the erc-20 for interest payments, 0x0 if lending is not NFT
 **/

const LenderDataReceivedSchema = z.object({
  assetAddresses: z.array(z.string()),
  assetAmounts: z.array(z.bigint(), z.bigint()),
  interestRate: z.number(),
  interest_address: z.string(),
  isActive: z.boolean(),
  isAssetNFT: z.array(z.boolean(), z.boolean()),
  isLending: z.boolean(),
  isPerpetual: z.boolean(),
  nftData: z.array(z.bigint(), z.bigint()),
  paymentCount: z.number(),
  valueOfVeNFT: z.bigint(),
  _timelap: z.number(),
})

type LenderDataReceived = z.infer<typeof LenderDataReceivedSchema>

export const useOffer = (address: Address | undefined, lendOfferAddress: Address) => {
  const currentChain = useCurrentChain()
  const useOfferLenderDataQuery = useQuery({
    queryKey: ["offer-lender-data", address, lendOfferAddress],
    queryFn: async () => {
      const lenderData = (await readContract({
        address: lendOfferAddress,
        abi: createdOfferABI,
        functionName: "getOffersData",
        args: [],
      })) as LenderDataReceived

      const owner = (await readContract({
        address: lendOfferAddress,
        abi: createdOfferABI,
        functionName: "owner",
        args: [],
      })) as string

      console.log("lenderData", lenderData)

      const parsedData = LenderDataReceivedSchema.parse(lenderData)

      // We get WAY TOO MUCH DATA from this function, it will trip RPC limits at some point
      if (!parsedData.isActive) {
        return null
      }

      console.log("parsedData.assetAddresses", parsedData.assetAddresses)

      // we should process the data here, collateral tokens should be an array of grouped data, not as multiple arrays
      // lets go one step further and bring token info and pricing in as well. This will make the data much more useful
      // and simplify rendering.
      const collateralToken = findInternalTokenByAddress(currentChain.slug, parsedData.assetAddresses[1])
      const collateral = {
        address: parsedData.assetAddresses[1],
        amountRaw: parsedData.assetAmounts[1],
        token: collateralToken,
        amount: fromDecimals(parsedData.assetAmounts[1], collateralToken?.decimals ?? 18),
        price: 0,
        valueUsd: 0,
      }

      // cant use async map - hate them but need to use a for loop for that
      let totalCollateralValue = 0

      if (!parsedData.isAssetNFT[1]) {
        const _price = await fetchTokenPrice(makeLlamaUuid(currentChain.slug, collateral.address as Address))
        collateral.price = _price.price ?? 0
        collateral.valueUsd = collateral.amount * collateral.price
        totalCollateralValue += collateral.valueUsd
      }

      // lets do the same for the lender token
      const principleToken = findInternalTokenByAddress(currentChain.slug, parsedData.assetAddresses[0])
      const principle = {
        address: parsedData.assetAddresses[0] as Address,
        amountRaw: parsedData.assetAmounts[0] as bigint,
        token: principleToken,
        amount: fromDecimals(parsedData.assetAmounts[0], principleToken?.decimals ?? 18),
        price: 0,
        valueUsd: 0,
      }

      if (!parsedData.nftData[0]) {
        const price = await fetchTokenPrice(makeLlamaUuid(currentChain.slug, principle.address as Address))
        principle.price = price.price ?? 0
        principle.valueUsd = principle.amount * principle.price
      }

      const ratio = principle.valueUsd > 0 ? totalCollateralValue / principle.valueUsd : 0
      const ltv = ratio ? (1 / ratio) * 100 : 0
      const numberOfLoanDays = Number(parsedData._timelap) / 86400
      const apr = ((Number(parsedData.interestRate) / Number(numberOfLoanDays)) * 365) / 10000 // percentages are 0.134 for 13.4%
      const interestToken_NFT = findInternalTokenByAddress(currentChain.slug, parsedData.interest_address)
      const interestToken = {
        address: parsedData.interest_address,
        amountRaw: lenderData.nftData[1],
        token: interestToken_NFT,
        amount: fromDecimals(lenderData.nftData[1], interestToken_NFT?.decimals ?? 18),
        price: 0,
        valueUsd: 0,
      }

      return {
        collateral,
        principle,
        interest: Number(lenderData.interestRate) / 10000,
        ltv,
        apr,
        numberOfLoanDays,
        owner: owner,
        paymentCount: lenderData.paymentCount,
        timelap: lenderData._timelap,
        wantedCollateralAmount: lenderData.assetAmounts[1],
        totalCollateralValue,
        perpetual: lenderData.isPerpetual,
        isNFT: lenderData.isAssetNFT,
        tokenId: Number(lenderData.nftData[0]),
        interestData_NFT: interestToken,
        interestToken_NFT: interestToken_NFT,
      }
    },
    refetchInterval: MILLISECONDS_PER_MINUTE * 30,
  })

  return useOfferLenderDataQuery
}
