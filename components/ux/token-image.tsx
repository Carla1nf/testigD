import { useInternalToken } from "@/hooks/useInternalToken"
import Image from "next/image"

interface TokenImageProps {
  width: number | string
  height: number | string
  symbol: string
  chainSlug: string
}

const TokenImage: React.FC<TokenImageProps> = ({ width, height, symbol, chainSlug }) => {
  const token = useInternalToken(chainSlug, symbol)

  // token search still ongoing
  if (token === undefined) {
    return (
      <Image
        src={"/files/tokens/blank.svg"}
        width={parseInt(width.toString())}
        height={parseInt(height.toString())}
        alt={"Token loading"}
      />
    )
  }

  // token search failed
  if (token === false) {
    return (
      <Image
        src={"/files/tokens/unknown.svg"}
        width={parseInt(width.toString())}
        height={parseInt(height.toString())}
        alt={"token unknown"}
      />
    )
  }

  // token found
  return (
    <Image
      src={token.icon}
      width={parseInt(width.toString())}
      height={parseInt(height.toString())}
      alt={token?.name ?? "Token Image"}
    />
  )
}

export default TokenImage
