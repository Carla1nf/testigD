"use client"

import { toDays, toHours } from "@/lib/display"

const DaysHours = ({ deadline }: { deadline: number }) => {
  return (
    <>
      {toDays(Number(deadline))} <span className="text-xs">DAYS</span> {toHours(Number(deadline))}{" "}
      <span className="text-xs">HOURS </span>
    </>
  )
}

export default DaysHours
