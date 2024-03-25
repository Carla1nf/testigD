import createdOfferABI from "@/abis/v2/createdOffer.json"
import { MILLISECONDS_PER_MINUTE } from "@/lib/display"
import { fromDecimals, toDecimals } from "@/lib/erc20"
import {
  Token,
  findInternalTokenByAddress,
  findInternalTokenBySymbol,
  getDepositedToken,
  getValuedAmountCollateral,
  getValuedAmountPrinciple,
  getValuedAsset,
  nftInfoLensType,
  nftUnderlying,
} from "@/lib/tokens"
import { fetchTokenPrice, makeLlamaUuid } from "@/services/token-prices"
import { useQuery } from "@tanstack/react-query"
import { Address, formatUnits, getAddress } from "viem"
import { readContract } from "wagmi/actions"
import z from "zod"
import useCurrentChain from "./useCurrentChain"
import useNftInfo, { VeTokenInfoIncoming } from "./useNftInfo"
import veTokenInfoLensAbi from "../abis/v2/veTokenInfoLens.json"

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

      // console.log("lenderData", lenderData)

      const owner = (await readContract({
        address: lendOfferAddress,
        abi: createdOfferABI,
        functionName: "owner",
        args: [],
      })) as string

      // console.log("lenderData", lenderData)

      const parsedData = LenderDataReceivedSchema.parse(lenderData)

      // We get WAY TOO MUCH DATA from this function, it will trip RPC limits at some point
      if (!parsedData.isActive) {
        return null
      }

      // console.log("parsedData.assetAddresses", parsedData.assetAddresses)

      // we should process the data here, collateral tokens should be an array of grouped data, not as multiple arrays
      // lets go one step further and bring token info and pricing in as well. This will make the data much more useful
      // and simplify rendering.
      console.log("ME")
      const collateralToken = findInternalTokenByAddress(currentChain.slug, parsedData.assetAddresses[1])
      const collateral = {
        address: parsedData.assetAddresses[1],
        amountRaw: parsedData.assetAmounts[1],
        token: collateralToken,
        amount: fromDecimals(parsedData.assetAmounts[1], collateralToken?.decimals ?? 18),
        price: 0,
        valueUsd: 0,
      }
      console.log("ME1")

      // cant use async map - hate them but need to use a for loop for that
      const valueAssetCollateral = getValuedAsset(collateralToken, currentChain.slug)
      console.log(valueAssetCollateral, "VALUE ASSET COLLATERAL")
      const _price = await fetchTokenPrice(makeLlamaUuid(currentChain.slug, valueAssetCollateral.address as Address))
      collateral.price = _price.price ?? 0
      console.log("ME2")

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
      const depositedToken = getDepositedToken(principleToken, collateralToken, lenderData.isLending)
      console.log("W111")

      const valueFromUnderlying = nftInfoLensType(depositedToken)
        ? ((await readContract({
            address: (depositedToken?.nft?.infoLens ?? "") as Address,
            abi: veTokenInfoLensAbi,
            functionName: "getDataFrom",
            args: [lendOfferAddress],
          })) as VeTokenInfoIncoming[])
        : null

      console.log(parsedData.assetAddresses[0], "W222")

      const valueAssetPrinciple = getValuedAsset(principleToken, currentChain.slug)
      console.log(principleToken, "PRINCIPLE")
      const price = await fetchTokenPrice(makeLlamaUuid(currentChain.slug, valueAssetPrinciple.address as Address))
      principle.price = price.price ?? 0
      console.log(principle.price, "PRICE PRINCIPLE")

      const principleAmount = getValuedAmountPrinciple(
        principleToken,
        lenderData.isLending,
        principle.amount,
        valueFromUnderlying,
        lenderData.valueOfVeNFT
      )

      const collateralAmount = getValuedAmountCollateral(
        collateralToken,
        lenderData.isLending,
        collateral.amount,
        valueFromUnderlying,
        lenderData.valueOfVeNFT
      )
      console.log("W333")

      principle.valueUsd = principleAmount * principle.price
      collateral.valueUsd = collateralAmount * collateral.price

      const ratio = principle.valueUsd > 0 ? collateral.valueUsd / principle.valueUsd : 0
      const ltv = ratio ? (1 / ratio) * 100 : 0
      const numberOfLoanDays = (Number(parsedData._timelap) * Number(parsedData.paymentCount)) / 86400
      const apr = ((Number(parsedData.interestRate) / Number(numberOfLoanDays)) * 365) / 10000 // percentages are 0.134 for 13.4%
      const foundNftInterestToken = findInternalTokenByAddress(currentChain.slug, parsedData.interest_address)
      const nftInterestToken = foundNftInterestToken
        ? {
            address: parsedData.interest_address,
            amountRaw: lenderData.nftData[1],
            token: foundNftInterestToken,
            amount: fromDecimals(lenderData.nftData[1], foundNftInterestToken?.decimals ?? 18),
            price: 0,
            valueUsd: 0,
          }
        : null

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
        totalCollateralValue: collateral.valueUsd,
        perpetual: lenderData.isPerpetual,
        tokenId: Number(lenderData.nftData[0]),
        nftInterestToken,
        principleAddressChart: valueAssetPrinciple.address,
        principleAmountChart: principleAmount,
        collateralAddressChart: valueAssetCollateral.address,
        collateralAmountChart: collateralAmount,
        wantedLockedVeNFT: fromDecimals(lenderData.valueOfVeNFT, 18),
      }
    },
    refetchInterval: MILLISECONDS_PER_MINUTE * 30,
  })

  return useOfferLenderDataQuery
}
