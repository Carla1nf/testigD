"use client"

import { ReactNode } from "react"
import { Skeleton } from "@/components/ui/skeleton"

const DashboardResumeItem = ({ value, title, Icon }: { value: ReactNode; title: string; Icon: ReactNode }) => {
  return (
    <div key={title} className="relative overflow-hidden flex  rounded-lg items-center gap-2">
      <div className="text-sm font-medium text-gray-400">{title}</div>
      <div className="text-base font-bold text-[#A957A4]">
        {value === undefined ? <Skeleton className="h-[80px] w-[200px]" /> : value}
      </div>
    </div>
  )
}

export default DashboardResumeItem
