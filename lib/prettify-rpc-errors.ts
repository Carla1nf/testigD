/**
 * The goal of this module is to provide a way to prettify RPC errors.
 * Add them one at a time as they come up.
 */

export const prettifyRpcError = ({ error, nativeTokenSymbol }: { error: any; nativeTokenSymbol: string }) => {
  const lowerMessage = error?.message?.toLowerCase() ?? ""

  // handle not enough ETHER error
  if (lowerMessage.includes("not enough ether")) {
    return `Not enough ${nativeTokenSymbol} to perform transaction`
  }
  // use rejected the request
  if (lowerMessage.includes("user rejected the request")) {
    return "User rejected the request"
  }

  return error?.message ?? error?.toString() ?? "Unknown error"
}
