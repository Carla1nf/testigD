import { dollars } from "@/lib/display"
import { clampHigh, dynamicClampIncrement, lastNumber } from "@/lib/utils"
import { useMemo } from "react"
import { Line, LineChart, Tooltip, XAxis, YAxis } from "recharts"
import { useWindowSize } from "usehooks-ts"
import z from "zod"

// todo: What happens when there are multiple collateral tokens?
const findHighest = (lender: number[], collateral: number[]) => {
  const highest = Math.max(...lender, ...collateral)
  return highest
}

const findLowest = (lender: number[], collateral: number[]) => {
  const lowest = Math.min(...lender, ...collateral)
  return Math.floor(lowest)
}
/**
 * This function calculates the dimensions of the chart based on the window width.
 *
 * @param {number} windowWidth - The width of the window.
 * @returns {Object} An object containing the width and height of the chart.
 */
function getChartDimensions(windowWidth: number): { width: number; height: number } {
  if (windowWidth <= 720) {
    return { width: 380, height: 200 }
  }
  return { width: 580, height: 300 }
}

const LoanDataSchema = z.object({
  historicalLender: z.array(z.number()),
  historicalCollateral: z.array(z.number()),
  timestamps: z.array(z.string().regex(/^\d{2}\/\d{2}\/\d{2}$/)),
})

export type LoanData = z.infer<typeof LoanDataSchema>

/**
 * @example
 * ```ts
 * const loanData = {
 *   historicalLender: [100.2, 99.15, 100.4, 101.4, 100.3],
 *   historicalCollateral: [89.97, 109.3, 141.88, 142.44, 148.53],
 *   lastLender: 100.3,
 *   lastCollateral: 148.53,
 *   timestamps: ["22/10/23", "02/11/23", "14/11/23", "25/11/23", "07/12/23"],
 * }
 * ```
 */
const LoanChart = ({ loanData }: { loanData: LoanData }) => {
  const { width } = useWindowSize()
  const dimensions = useMemo(() => getChartDimensions(width), [width])

  if (!loanData) {
    return null
  }

  try {
    const parsed = LoanDataSchema.parse(loanData)
    const points = parsed.historicalLender.map((lender, index) => {
      return {
        name: parsed.timestamps[index],
        collateral: parsed.historicalCollateral[index],
        lending: lender,
      }
    })
    const highestValue = findHighest(parsed.historicalLender, parsed.historicalCollateral)
    const clampIncrement = dynamicClampIncrement(
      lastNumber(parsed.historicalLender),
      lastNumber(parsed.historicalCollateral)
    )

    return (
      <LineChart data={points} width={dimensions.width} height={dimensions.height}>
        <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
        <YAxis
          dataKey={`collateral`}
          domain={[0, clampHigh(highestValue, clampIncrement)]}
          tick={{ fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(tick) => (tick === 0 ? "" : tick)}
        />
        <Line strokeWidth={4} type="monotone" dataKey="collateral" stroke=" rgba(112, 91, 220, 0.7)" />
        <Line strokeWidth={4} type="monotone" dataKey="lending" stroke="rgba(215, 80, 113, 0.7)" />
        <Tooltip content={<LoanChartTooltip />} />
      </LineChart>
    )
  } catch (error) {
    console.error("Unable to render chart", error)
    return null
  }
}

const LoanChartTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div
        style={{
          background: "rgb(0,0,0,0.65)",
          padding: "10px",
          fontWeight: "800",
          width: "120px",
          borderRadius: "10px",
        }}
      >
        <p style={{ color: "#705BDC" }}>{`Collateral: ${dollars({ value: data.collateral })}`}</p>
        <p style={{ color: "#D75071" }}>{`Debt: ${dollars({
          value: data.lending == undefined ? 0 : data.lending,
        })}`}</p>
      </div>
    )
  }

  return null
}

export default LoanChart
