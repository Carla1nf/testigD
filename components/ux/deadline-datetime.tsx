"use client"

import { toDays, toHours } from "@/lib/display"

const DaysHours = ({ deadline, className }: { deadline: number; className?: string }) => {
  if (!deadline) return null

  const days = toDays(Number(deadline))
  const hours = toHours(Number(deadline))

  return (
    <div className={className}>
      {days} <span className="text-xs">DAYS</span> {hours} <span className="text-xs">HOURS </span>
    </div>
  )
}

export default DaysHours
