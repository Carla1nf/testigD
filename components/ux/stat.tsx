"use client"

import { ReactNode } from "react"
import { Skeleton } from "@/components/ui/skeleton"

const Stat = ({
  value,
  title,
  titleSmall,
  Icon,
}: {
  value: ReactNode
  title: string
  titleSmall?: string
  Icon: ReactNode
}) => {
  return (
    <>
      {/* desktop - left align design */}
      <div className="overflow-hidden dashboard-item-gradient py-2 px-4 rounded-lg  flex-row justify-center items-center h-full hidden md:flex shadow-lg">
        <div className="pr-4">{Icon}</div>
        <div className="text-left grow">
          <div className="text-xs md:font-bold">{title}</div>
          <div className="text-xs md:text-xl font-medium text-[#A957A4]">
            {value === undefined ? <Skeleton className="h-[80px] w-[200px]" /> : value}
          </div>
        </div>
      </div>
      {/* mobile / tablets - centralised design */}
      <div
        key={title}
        className="overflow-hidden dashboard-item-gradient py-1 px-2 rounded-lg flex flex-row gap-2 justify-center items-center border border-white/5 h-full md:hidden"
      >
        <div className="flex justify-center items-center">{Icon}</div>
        <div className="text-left">
          {titleSmall ? (
            <>
              <div className="text-xs md:hidden font-bold">{titleSmall}</div>
              <div className="hidden md:flex text-xs md:font-bold">{title}</div>
            </>
          ) : (
            <div className="text-xs md:font-bold">{title}</div>
          )}

          <div className="text-sm md:text-2xl font-medium text-[#A957A4]">
            {value === undefined ? <Skeleton className="h-[80px] w-[200px]" /> : value}
          </div>
        </div>
      </div>
    </>
  )
}

export default Stat
