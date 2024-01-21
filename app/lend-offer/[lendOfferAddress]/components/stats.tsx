import { PriceIcon } from "@/components/icons"
import Stat from "@/components/ux/stat"
import { dollars, ltv } from "@/lib/display"

const LendOfferStats = ({
  ltvValue,
  totalCollateralValue,
  borrowingValue,
}: {
  ltvValue: number
  totalCollateralValue: number
  borrowingValue: number
}) => {
  return (
    <div className="flex flex-col @6xl:flex-row gap-8 justify-between">
      <div className="grid grid-cols-3 gap-8">
        <Stat value={ltv(ltvValue)} title={"LTV"} Icon={null} />

        <Stat
          value={dollars({ value: totalCollateralValue })}
          title={"Collateral"}
          Icon={<PriceIcon className="w-6 h-6 md:w-10 md:h-10 fill-white" />}
        />

        <Stat
          value={dollars({ value: borrowingValue })}
          title={"Borrowing"}
          Icon={<PriceIcon className="w-6 h-6 md:w-10 md:h-10 fill-white" />}
        />
      </div>
    </div>
  )
}

export default LendOfferStats
