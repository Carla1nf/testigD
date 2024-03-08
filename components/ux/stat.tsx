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
      <div className="overflow-hidden gap-4 bg-[#21232B]/40 border-2 border-white/10  py-2 px-3 rounded-lg  flex-row items-center  hidden md:flex shadow-lg shadow-neutral-950/30">
        <div className="text-left grow">
          <div className="text-xs font-semibold text-gray-400 ">{title}</div>
          <div className="text-xs md:text-lg font-bold text-white">
            {value === undefined ? <Skeleton className="h-[80px] w-[200px]" /> : value}
          </div>
        </div>
        <div className="h-10 w-10 rounded-lg flex items-center justify-center "></div>
      </div>
      {/* mobile / tablets - centralised design */}
      <div
        key={title}
        className="overflow-hidden gap-4 bg-[#21232B]/40 border-2 border-white/10  py-2 px-3 rounded-lg  flex-row items-center   shadow-lg shadow-neutral-950/30 md:hidden"
      >
        <div className="text-left">
          {titleSmall ? (
            <>
              <div className="text-xs md:hidden font-bold">{titleSmall}</div>
              <div className="hidden md:flex text-xs md:font-bold">{title}</div>
            </>
          ) : (
            <div className="text-xs md:font-bold text-gray-400">{title}</div>
          )}

          <div className="text-sm md:text-2xl font-medium text-white">
            {value === undefined ? <Skeleton className="h-[80px] w-[200px]" /> : value}
          </div>
        </div>
      </div>
    </>
  )
}

export default Stat
