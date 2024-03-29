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
    <div className="rounded-3xl border-4 border-white/10 bg-black/10 grid w-full h-full md:pr-6 pt-6 items-center justify-center">
      <div className="md:scale-100 md:pr-0 scale-75 pr-7">{children}</div>
    </div>
  )
}

export default ChartWrapper
