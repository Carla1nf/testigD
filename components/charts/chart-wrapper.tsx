"use client"

import { ReactElement } from "react"
const ChartWrapper = ({ children }: { children: ReactElement }) => {
  /**
    {
      display: grid;
      width: 100%;
      margin-top: 15px;
      -webkit-box-align: center;
      align-items: center;
      height: 335px;
      border-radius: 20px;
      background: rgba(0, 0, 0, 0.18);
      border: 3px solid rgba(215, 80, 113, 0.2);
    }
   */

  return (
    <div className="rounded-2xl border border-[#743A49]/75 bg-black/20 grid w-full h-full pr-6 pt-6 items-center justify-center ">
      {children}
    </div>
  )
}

export default ChartWrapper
