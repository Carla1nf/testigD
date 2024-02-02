// hard coded for now

import { useQuery } from "@tanstack/react-query"

const sortByMostFees = (a: any, b: any) => b?.gauge?.tbvUSD - a?.gauge?.tbvUSD

const filterGauges = (pairs: any[]) => {
  const gauges = pairs
    // we only want pairs that have gauges
    .filter((pair) => Boolean(pair.hasGauge))
    // we only want pairs that have $ fees and votes available (remove if users want to vote on pairs that give no revenue)
    .filter((pair) => Number(pair?.gauge?.tbvUSD) > 0 && Number(pair?.gauge?.weightPercent) > 0)

  gauges.sort(sortByMostFees)

  return gauges
}

/**
 * total votes = pair.gauge.votes
 * total votes % = row?.gauge?.weightPercent
 * voting APR = row?.gauge.aprUsd
 * fees and bribes = pair.gauge.tbvUSD
 */

// ["https://beta.equalizer.exchange", "https://equalizer.exchange"]
async function getPools() {
  const res = await fetch("https://eqapi-beta-8868m.ondigitalocean.app/fantom/pairs", {
    headers: {
      "Content-Type": "application/json",
      Origin: "https://equalizer.exchange",
    },
  })
  if (!res.ok) {
    throw new Error("Failed to fetch data")
  }
  const json = await res.json()

  return json?.data ?? []
}

const useVeEqualPairs = () => {
  const query: any = useQuery({
    queryKey: ["ve-equal-pairs"],
    queryFn: async () => {
      try {
        const pairs = await getPools()
        return filterGauges(pairs)
      } catch (error) {
        console.log("error", error)
      }

      return []
    },
  })

  return query.data ?? []
}

export default useVeEqualPairs
