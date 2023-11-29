"use client"

import { ReactNode } from "react"
import { Skeleton } from "@/components/ui/skeleton"

const DashboardItem = ({ value, title, Icon }: { value: ReactNode; title: string; Icon: ReactNode }) => {
  return (
    <div key={title} className="relative overflow-hidden dashboard-item-gradient p-3 rounded-lg">
      <div className="text-sm font-bold mb-1">{title}</div>
      <div className="text-2xl font-bold text-[#A957A4]">
        {value === undefined ? <Skeleton className="h-4 h-[80px] w-[200px]" /> : value}
        <div style={{ position: "absolute", color: "white", right: "10px", top: "5px", opacity: "1" }}>{Icon}</div>
      </div>
    </div>
  )
}

export default DashboardItem
