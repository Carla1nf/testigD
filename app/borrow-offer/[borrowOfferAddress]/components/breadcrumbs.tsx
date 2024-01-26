import Breadcrumbs from "@/components/ux/breadcrumbs"
import DisplayNetwork from "@/components/ux/display-network"
import DisplayToken from "@/components/ux/display-token"
import useCurrentChain from "@/hooks/useCurrentChain"
import { Token } from "@/lib/tokens"
import Link from "next/link"

import { useMemo } from "react"

const BorrowOfferBreadcrumbs = ({ principleToken }: { principleToken?: Token }) => {
  const currentChain = useCurrentChain()
  const breadcrumbs = useMemo(() => {
    const result = [<DisplayNetwork currentChain={currentChain} size={18} key="network" />]
    if (principleToken) {
      result.push(
        <Link href={`/lend/`} className="hover:text-white/75" key="lending-market">
          Lending Market
        </Link>
      )
      result.push(
        <Link href={`/lend/${principleToken?.address}`} key="token">
          <DisplayToken
            size={18}
            token={principleToken}
            chainSlug={currentChain.slug}
            className="hover:text-white/75"
          />
        </Link>
      )
      return result
    }
    return []
  }, [currentChain, principleToken])

  return <Breadcrumbs items={breadcrumbs} />
}

export default BorrowOfferBreadcrumbs
