import ChartWrapper from "@/components/charts/chart-wrapper"
import LoanChart from "@/components/charts/loan-chart"
import useCurrentChain from "@/hooks/useCurrentChain"
import useHistoricalTokenPrices from "@/hooks/useHistoricalTokenPrices"
import { calcCollateralsPriceHistory, calcPriceHistory } from "@/lib/chart"
import { Token } from "@/lib/tokens"
import dayjs from "dayjs"
import { Address } from "viem"

const BorrowOfferChart = ({
  principleToken,
  collateralToken,
  principleAmount,
  collateralAmount,
}: {
  principleToken?: Token
  collateralToken?: Token
  principleAmount?: number
  collateralAmount?: number
}) => {
  const currentChain = useCurrentChain()

  const principlePrices = useHistoricalTokenPrices(currentChain.slug, principleToken?.address as Address)
  const collateralPrices = useHistoricalTokenPrices(currentChain.slug, collateralToken?.address as Address)
  const timestamps = principlePrices?.map((item: any) => dayjs.unix(item.timestamp).format("DD/MM/YY")) ?? []

  const chartValues = {
    historicalLender: calcPriceHistory(principlePrices, principleAmount ?? 0),
    historicalCollateral: calcCollateralsPriceHistory(collateralPrices, collateralAmount ?? 0),
    timestamps,
  }

  return (
    <ChartWrapper>
      <LoanChart loanData={chartValues} />
    </ChartWrapper>
  )
}

export default BorrowOfferChart
