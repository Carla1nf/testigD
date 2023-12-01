"use client"

import { LoanStatus, TokenValue, useLoanValues } from "@/hooks/useLoanValues"
import { useOwnershipBalance } from "@/hooks/useOwnsershipBalance"
import loanStatus from "@/lib/display"
import { cn, range } from "@/lib/utils"
import { useMemo, useState } from "react"
import { Address, useAccount } from "wagmi"
import { Button } from "../ui/button"
import DaysHours from "./deadline-datetime"
import TokenImage from "./token-image"

export function DashboardUserTable() {
  const [status, setStatus] = useState<LoanStatus>("Borrowed")

  // Leys simulate getting all the data required for Borrowed and see waht comes up
  // there arre a few RPC requetss here afaik
  const { address } = useAccount()

  // This is the number of loans the user has taken (borrowed)
  const { ownershipBalance } = useOwnershipBalance(address)

  // In v1 they convert this to a range array like [0,1,2,3,4,5] for 6 items
  // they then pass this (id) to the <EachData id={a} status={type} /> component and the current ype, i.e. Borrowed or Lent
  const indexes = useMemo(() => {
    return range(ownershipBalance)
  }, [ownershipBalance])

  return (
    <div className="flex flex-col w-full gap-0 my-5">
      <div className="w-full sm:bg-[#262525] border-b border-[#4A2F35] flex flex-row gap-2 ">
        <div className={cn("min-w-[120px]", status === "Borrowed" ? "table-tab-active" : undefined)}>
          <Button variant="table-tab" onClick={() => setStatus("Borrowed")}>
            Borrowed
          </Button>
        </div>
        <div className={cn("min-w-[120px]", status === "Lent" ? "table-tab-active" : undefined)}>
          <Button variant="table-tab" onClick={() => setStatus("Lent")}>
            Lent
          </Button>
        </div>
      </div>
      <div>
        <table className="w-full flex flex-row flex-no-wrap sm:bg-[#262525] rounded-lg overflow-hidden sm:shadow-lg md:inline-table">
          <thead className="text-white" suppressHydrationWarning>
            {indexes.map((index) => {
              const responsiveClass = index === 0 ? "" : "sm:hidden"
              return (
                <tr
                  className={cn(
                    "flex flex-col flex-no wrap sm:table-row rounded-l-lg sm:rounded-none mb-2 sm:mb-0 text-left",
                    responsiveClass
                  )}
                  key={index}
                  suppressHydrationWarning
                >
                  <th className="p-3 text-left">Collateral</th>
                  <th className="p-3 text-left">Borrowed</th>
                  <th className="p-3 text-left">ID</th>
                  <th className="p-3 text-left">Next Payment</th>
                  <th className="p-3 text-left">Installments</th>
                  <th className="p-3 text-left">Status</th>
                </tr>
              )
            })}
          </thead>
          <tbody className="flex-1 sm:flex-none">
            {indexes.map((index) => {
              return <DashboardUserTableItem key={index} address={address as Address} index={index} status={status} />
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const DisplayToken = ({ token }: { token: TokenValue }) => {
  return (
    <div className="flex flex-row gap-2 items-center">
      <TokenImage width={24} height={24} chainSlug="fantom" symbol={token.symbol} />
      {token.symbol}
    </div>
  )
}

const DashboardUserTableItem = ({
  address,
  index,
  status,
}: {
  address: Address
  index: number
  status: LoanStatus
}) => {
  const { isSuccess, isLoading, isError, data } = useLoanValues(address, index, status)

  if (isError || isLoading) {
    return null
  }

  if (
    data == undefined ||
    data.loan == undefined ||
    data.ownerNftTokenId === undefined ||
    data.claimableDebt === undefined
  ) {
    return null
  }

  const hasLoanCompleted = Number(data.loan.paymentsPaid) === Number(data.loan.paymentCount)
  const hasLoanExecuted = data.loan.executed

  if (hasLoanExecuted && hasLoanCompleted && Number(data.ownerNftTokenId) === Number(data.loan.collateralOwnerId)) {
    return null
  }

  if (
    hasLoanExecuted &&
    Number(data.claimableDebt) === 0 &&
    Number(data.ownerNftTokenId) === Number(data.loan.lenderOwnerId)
  ) {
    return null
  }

  const hasUserBorrowed = Number(data.ownerNftTokenId) % 2 === 0 && status === "Borrowed"
  const hasUserLent = Number(data.ownerNftTokenId) % 2 === 1 && status === "Lent"
  const shouldDisplay = hasUserBorrowed || hasUserLent

  if (!shouldDisplay) {
    return
  }

  if (isSuccess) {
    const status = loanStatus(Number(data.loan.deadlineNext))

    return (
      <tr className="flex flex-col flex-no wrap sm:table-row mb-2 sm:mb-0" key={data.loanId}>
        <td className="p-3">
          {data?.loan?.collaterals?.length === 1 ? <DisplayToken token={data?.loan?.collaterals[0]} /> : null}

          {data?.loan?.collaterals?.length === 2 ? (
            <div className="flex flex-col gap-2">
              <DisplayToken token={data.loan.collaterals[0]} />
              <DisplayToken token={data.loan.collaterals[1]} />
            </div>
          ) : null}
        </td>
        <td className="p-3">
          <DisplayToken token={data.loan.token} />
        </td>
        <td className="p-3">{Number(data.loanId)}</td>
        <td className="p-3">
          <DaysHours deadline={Number(data.loan.deadline)} />
        </td>
        <td className="p-3">
          {" "}
          {Number(data.loan.paymentsPaid)}/{Number(data.loan.paymentCount)}
        </td>
        <td className="p-3">
          {data.loan.paymentCount === data.loan.paymentsPaid || data.loan.executed ? (
            <div className="text-yellow-500">Ended</div>
          ) : (
            <div className={status.className}>{status.displayText}</div>
          )}
        </td>
      </tr>
    )
  }
}
