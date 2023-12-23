import { useManageNextPayment } from "@/context/next-payment-context"
import { LoanStatus, useLoanValues } from "@/hooks/useLoanValues"
import { loanStatus } from "@/lib/display"
import { useEffect } from "react"
import { Address } from "viem"
import DaysHours from "./deadline-datetime"
import DisplayToken from "./display-token"

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
  const updateDeadline = useManageNextPayment()

  const hasLoanCompleted = Number(data?.loan.paymentsPaid) === Number(data?.loan.paymentCount)
  const hasLoanExecuted = data?.loan.executed

  // This is a weird pattern, we need to render the same number of hooks so cant exit early, but also
  // means we need to access the data before it is tested..
  // ok, now we can consider this item for next payment deadline
  useEffect(() => {
    if (
      !hasLoanExecuted &&
      !hasLoanCompleted &&
      Number(data?.ownerNftTokenId) === Number(data?.loan.collateralOwnerId)
    ) {
      if (updateDeadline) {
        updateDeadline(Number(data?.loan.deadlineNext))
      }
    }
  }, [hasLoanExecuted, hasLoanCompleted, data?.ownerNftTokenId, data?.loan.collateralOwnerId, data?.loan.deadlineNext])

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
      <tr className="flex flex-col animate-enter-token flex-no wrap sm:table-row mb-2 sm:mb-0 hover:bg-[#383838] cursor-pointer" key={data.loanId}>
        <td className="p-3">
          {data?.loan?.collaterals?.length === 1 ? <DisplayToken token={data?.loan?.collaterals[0]} size={24} /> : null}
          {data?.loan?.collaterals?.length === 2 ? (
            <div className="flex flex-col gap-2">
              <DisplayToken token={data.loan.collaterals[0]} size={24} />
              <DisplayToken token={data.loan.collaterals[1]} size={24} />
            </div>
          ) : null}
        </td>
        <td className="p-3">
          <DisplayToken token={data.loan.token} size={24} />
        </td>
        <td className="p-3">{Number(data.loanId)}</td>
        <td className="p-3">
          <DaysHours deadline={Number(data.loan.deadlineNext)} />
        </td>
        <td className="p-3">
          {" "}
          {Number(data.loan.paymentsPaid)}/{Number(data.loan.paymentCount)}
        </td>
        <td className="p-3 font-semibold">
          {data.loan.paymentCount === data.loan.paymentsPaid || data.loan.executed ? (
            <div className="text-yellow-400">Ended</div>
          ) : (
            <div className={`${status.className} ${status.displayText == 'LIVE' ? "text-green-300" : "text-red-400"}`}>{status.displayText}</div>
          )}
        </td>
      </tr>
    )
  }
}

export default DashboardUserTableItem
