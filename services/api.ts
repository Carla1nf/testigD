import z from "zod"
import axios from "axios"

const GetDataElementSchema = z.tuple([z.number(), z.number(), z.number(), z.string(), z.string()])
const GetDataNestedArraySchema = z.array(GetDataElementSchema)
const GetDataSchema = z.tuple([GetDataNestedArraySchema, GetDataNestedArraySchema, z.number()])

export type GetData = z.infer<typeof GetDataSchema>
export type GetDataElement = z.infer<typeof GetDataElementSchema>
export type GetDataNestedArray = z.infer<typeof GetDataNestedArraySchema>
export type OfferType = "Lend" | "Borrow"

const getData = async () => {
  try {
    // todo: move URL into a config file in prep for xchain app
    const response = await axios.get("https://v4wfbcl0v9.execute-api.us-east-1.amazonaws.com/Deploy/getData")
    const parsedResponse = GetDataSchema.parse(response.data)

    // Important, once parsed we MUST only reference the parsed version (sanitized and confirmed to be correct)
    const transformedResponse = {
      lend: parsedResponse[0],
      borrow: parsedResponse[1],
      totalLiquidityLent: parsedResponse[2],
    }

    return transformedResponse
  } catch (error) {
    console.error("Api→getData", error)
  }
  return {
    lend: [],
    borrow: [],
    totalLiquidityLent: 0,
  }
}

export type ProcessGetDataNestedArrayResult = {
  tokenAddresses: string[]
  tokenEvents: GetDataNestedArray[]
  sumOfAPR: number[]
  sumOfAmounts: number[]
}

const processGetDataNestedArray = (data: GetDataNestedArray): ProcessGetDataNestedArrayResult => {
  return data.reduce(
    (
      acc: { tokenAddresses: string[]; tokenEvents: GetDataNestedArray[]; sumOfAPR: number[]; sumOfAmounts: number[] },
      event: GetDataElement,
    ) => {
      const tokenAddress = event[4]
      const index = acc.tokenAddresses.indexOf(tokenAddress)

      if (index === -1) {
        acc.tokenAddresses.push(tokenAddress)
        acc.tokenEvents.push([event])
        acc.sumOfAPR.push(event[2])
        acc.sumOfAmounts.push(event[1] * 10 ** 16)
      } else {
        acc.tokenEvents[index].push(event)
        acc.sumOfAPR[index] += event[2]
        acc.sumOfAmounts[index] += event[1] * 10 ** 16
      }

      return acc
    },
    { tokenAddresses: [], tokenEvents: [], sumOfAPR: [], sumOfAmounts: [] },
  )
}

function getUserEventOffers(eventos: GetDataNestedArray, userAddress: string) {
  return eventos ? eventos.filter((evento) => evento[3] === userAddress) : []
}

export default { getData, processGetDataNestedArray, getUserEventOffers }
