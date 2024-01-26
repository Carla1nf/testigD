import { PriceIcon } from "@/components/icons"
import Stat from "@/components/ux/stat"
import { dollars, ltv } from "@/lib/display"

const BorrowOfferStats = ({ principle, offer }: { principle: any; offer: any }) => {
  return (
    <div className="grid grid-cols-3 gap-8">
      <Stat value={ltv(Number(offer?.ltv))} title={"LTV"} Icon={null} />
      <Stat
        value={dollars({ value: Number(principle?.valueUsd) })}
        title={"Lending"}
        Icon={<PriceIcon className="w-6 h-6 md:w-10 md:h-10 fill-white" />}
      />
      <Stat
        value={dollars({ value: Number(offer?.totalCollateralValue) })}
        title={"Collateral"}
        Icon={<PriceIcon className="w-6 h-6 md:w-10 md:h-10 fill-white" />}
      />
    </div>
  )
}

export default BorrowOfferStats
