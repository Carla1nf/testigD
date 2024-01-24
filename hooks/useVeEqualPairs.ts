// hard coded for now
import pairs from "@/fixtures/equalizer-pairs.json"

const sortByMostVotes = (a: any, b: any) => b?.gauge?.weightPercent - a?.gauge?.weightPercent
const sortByMostFees = (a: any, b: any) => b?.gauge?.tbvUSD - a?.gauge?.tbvUSD

/**
 * total votes = pair.gauge.votes
 * total votes % = row?.gauge?.weightPercent
 * voting APR = row?.gauge.aprUsd
 * fees and bribes = pair.gauge.tbvUSD
 */

const useVeEqualPairs = () => {
  const gauges = pairs
    // we only want pairs that have gauges
    .filter((pair) => Boolean(pair.hasGauge))
    // we only want pairs that have $ fees and votes available (remove if users want to vote on pairs that give no revenue)
    .filter((pair) => Number(pair?.gauge?.tbvUSD) > 0 && Number(pair?.gauge?.weightPercent) > 0)

  gauges.sort(sortByMostFees)

  return gauges
}

export default useVeEqualPairs
