import z from "zod";
import axios from "axios";

const GetDataElementSchema = z.tuple([
  z.number(),
  z.number(),
  z.number(),
  z.string(),
  z.string(),
]);
const GetDataNestedArraySchema = z.array(GetDataElementSchema);
const GetDataSchema = z.tuple([
  GetDataNestedArraySchema,
  GetDataNestedArraySchema,
  z.number(),
]);

/**
 * event LenderOfferCreated(
 *   uint256 indexed id,
 *   address indexed _owner,
 *   address lendingToken,
 *   uint apr,
 *   uint lendingAmount
 * );
 */
const LenderOfferCreatedSchema = z.object({
  id: z.number(),
  owner: z.string(),
  lendingToken: z.string(),
  apr: z.number(),
  lendingAmount: z.number(),
});

/**
 * event CollateralOfferCreated(
 *   uint256 indexed id,
 *   address indexed _owner,
 *   address lendingToken,
 *   uint apr,
 *   uint lendingAmount
 * );
 */
const CollateralOfferCreatedSchema = z.object({
  id: z.number(),
  owner: z.string(),
  lendingToken: z.string(),
  apr: z.number(),
  lendingAmount: z.number(),
});

type GetData = z.infer<typeof GetDataSchema>;
type GetDataElement = z.infer<typeof GetDataElementSchema>;
type GetDataNestedArray = z.infer<typeof GetDataNestedArraySchema>;

export type OfferType = "Lend" | "Borrow";

const GetDataResponse = z.object({
  lend: z.array(LenderOfferCreatedSchema),
  borrow: z.array(CollateralOfferCreatedSchema),
  totalLiquidityLent: z.number(),
});

export type GetDataResponse = z.infer<typeof GetDataResponse>;

/**
 * Other Events:
 * ============
 * event LenderOfferDeleted(uint256 indexed id, address indexed _owner);
 * event LoanAccepted(uint256 newId, address indexed lendingToken, address[] indexed collateralTokens);
 */
export const getData = async () => {
  try {
    // todo: move URL into a config file in prep for xchain app
    const response = await axios.get(
      "https://v4wfbcl0v9.execute-api.us-east-1.amazonaws.com/Deploy/getData"
    );
    const parsedResponse = GetDataSchema.parse(response.data);

    // Important, once parsed we MUST only reference the parsed version (sanitized and confirmed to be correct)

    return transformGetDataResponse(parsedResponse);
  } catch (error) {
    console.error("Api→getData", error);
  }
  return {
    lend: [],
    borrow: [],
    totalLiquidityLent: 0,
  };
};

const transformGetDataResponse = (response: GetData): GetDataResponse => {
  return {
    lend: response[0].map((event) => {
      return LenderOfferCreatedSchema.parse({
        id: event[0],
        owner: event[3],
        lendingToken: event[4],
        apr: event[2] / 1000, // better to use 0-1 range for representing percentages, 0% = 0, 100% = 1, 1% = 0.01, 24.57% = 0.2457
        lendingAmount: event[1] / 100, // we use decimals to represent the amount, so we need to divide by 100 to get the actual amount
      });
    }),
    borrow: response[1].map((event) => {
      return CollateralOfferCreatedSchema.parse({
        id: event[0],
        owner: event[3],
        lendingToken: event[4],
        apr: event[2] / 1000, // better to use 0-1 range for representing percentages, 0% = 0, 100% = 1, 1% = 0.01, 24.57% = 0.2457
        lendingAmount: event[1] / 100, // we use decimals to represent the amount, so we need to divide by 100 to get the actual amount
      });
    }),
    totalLiquidityLent: response[2],
  };
};

export type ProcessGetDataNestedArrayResult = {
  tokenAddresses: string[];
  tokenEvents: GetDataNestedArray[];
  sumOfAPR: number[];
  sumOfAmounts: number[];
};

/**
 * @deprecated uses old format, we will update the UI to use the new object format
 * and be more expressive using filters
 */
const processGetDataNestedArray = (
  data: GetDataNestedArray
): ProcessGetDataNestedArrayResult => {
  return data.reduce(
    (
      acc: {
        tokenAddresses: string[];
        tokenEvents: GetDataNestedArray[];
        sumOfAPR: number[];
        sumOfAmounts: number[];
      },
      event: GetDataElement
    ) => {
      const tokenAddress = event[4];
      const index = acc.tokenAddresses.indexOf(tokenAddress);

      if (index === -1) {
        acc.tokenAddresses.push(tokenAddress);
        acc.tokenEvents.push([event]);
        acc.sumOfAPR.push(event[2]);
        acc.sumOfAmounts.push(event[1] * 10 ** 16);
      } else {
        acc.tokenEvents[index].push(event);
        acc.sumOfAPR[index] += event[2];
        acc.sumOfAmounts[index] += event[1] * 10 ** 16;
      }

      return acc;
    },
    { tokenAddresses: [], tokenEvents: [], sumOfAPR: [], sumOfAmounts: [] }
  );
};

/**
 * @deprecated uses old format, we will update the UI to use the new object format
 * and be more expressive using filters
 */
function getUserEventOffers(eventos: GetDataNestedArray, userAddress: string) {
  return eventos ? eventos.filter((evento) => evento[3] === userAddress) : [];
}
