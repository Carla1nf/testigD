"use client"

import { TokenValue, useLoanValues } from "@/hooks/useLoanValues"
import { useOwnershipBalance } from "@/hooks/useOwnsershipBalance"
import loanStatus from "@/lib/display"
import { cn, range } from "@/lib/utils"
import { Address, useAccount } from "wagmi"
import DaysHours from "./deadline-datetime"
import TokenImage from "./token-image"

export type DashboardUserTableType = "Borrowed" | "Lent"

export function DashboardUserTable() {
  // Leys simulate getting all the data required for Borrowed and see waht comes up
  // there arre a few RPC requetss here afaik
  const { address } = useAccount()

  // This is the number of loans the user has taken (borrowed)
  const { ownershipBalance } = useOwnershipBalance(address)

  // In v1 they convert this to a range array like [0,1,2,3,4,5] for 6 items
  // they then pass this (id) to the <EachData id={a} status={type} /> component and the current ype, i.e. Borrowed or Lent

  // Next we get the token of owner by index

  const indexes = range(ownershipBalance)

  return (
    <table className="w-full flex flex-row flex-no-wrap sm:bg-[#262525] rounded-lg overflow-hidden sm:shadow-lg my-5 md:inline-table">
      <thead className="text-white" suppressHydrationWarning>
        {indexes.map((index) => {
          const responsiveClass = index === 0 ? "" : "sm:hidden"
          return (
            <tr
              className={
                (cn("flex flex-col flex-no wrap sm:table-row rounded-l-lg sm:rounded-none mb-2 sm:mb-0 text-left"),
                responsiveClass)
              }
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
          return <DashboardUserTableItem key={index} address={address as Address} index={index} status={"Borrowed"} />
        })}
      </tbody>
    </table>
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
  status: DashboardUserTableType
}) => {
  const { isSuccess, isLoading, isError, data } = useLoanValues(address, index)

  if (isError || isLoading) {
    return null
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
