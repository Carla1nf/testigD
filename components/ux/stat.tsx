"use client"

import { ReactNode } from "react"
import { Skeleton } from "@/components/ui/skeleton"

const Stat = ({ value, title, Icon }: { value: ReactNode; title: string; Icon: ReactNode }) => {
  return (
    <div
      key={title}
      className="overflow-hidden dashboard-item-gradient p-3 rounded-lg flex flex-row gap-4 items-center"
    >
      <div className="max-w-[64px]">{Icon}</div>
      <div>
        <div className="text-xs font-bold">{title}</div>
        <div className="text-2xl font-bold text-[#A957A4]">
          {value === undefined ? <Skeleton className="h-4 h-[80px] w-[200px]" /> : value}
        </div>
      </div>
    </div>
  )
}

export default Stat
