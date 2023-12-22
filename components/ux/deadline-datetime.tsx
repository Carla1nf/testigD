"use client"

import { toDays, toHours } from "@/lib/display"

const DaysHours = ({ deadline }: { deadline: number }) => {
  const days = toDays(Number(deadline))
  const hours = toHours(Number(deadline))

  // if (days === 0 && hours === 0) {
  //   return (
  //       <span className="text-xs">--&nbsp;--</span>
  //   )
  // }

  return (
    <>
      {days} <span className="text-xs">DAYS</span> {hours} <span className="text-xs">HOURS </span>
    </>
  )
}

export default DaysHours
