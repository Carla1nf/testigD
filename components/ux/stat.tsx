"use client"

import { ReactNode } from "react"
import { Skeleton } from "@/components/ui/skeleton"

const Stat = ({ value, title, Icon }: { value: ReactNode; title: string; Icon: ReactNode }) => {
  return (
    <div
      key={title}
      className="overflow-hidden dashboard-item-gradient py-3 px-8 rounded-lg flex flex-row justify-center items-center border border-white/5"
    >
      <div className="pr-4">{Icon}</div>
      <div className="text-left grow">
        <div className="text-xs font-bold">{title}</div>
        <div className="text-2xl font-medium text-[#A957A4]">
          {value === undefined ? <Skeleton className="h-4 h-[80px] w-[200px]" /> : value}
        </div>
      </div>
    </div>
  )
}

export default Stat
