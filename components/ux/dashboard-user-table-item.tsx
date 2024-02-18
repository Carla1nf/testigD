import { useManageNextPayment } from "@/context/next-payment-context"
import useCurrentChain from "@/hooks/useCurrentChain"
import { LoanStatus, useLoanValues } from "@/hooks/useLoanValues"
import { loanStatus } from "@/lib/display"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Address } from "viem"
import DaysHours from "./deadline-datetime"
import DisplayToken from "./display-token"
import { fromDecimals, toDecimals } from "@/lib/erc20"
import { bigint } from "zod"

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
  const router = useRouter()
  const currentChain = useCurrentChain()
  console.log(data, "LOAN")
  const hasLoanCompleted = Number(data?.loan.paymentsPaid) === Number(data?.loan.paymentCount)
  const hasLoanExecuted = data?.loan.executed
  if (data) {
    console.log(Number(data?.loan.collaterals.amount) / Number(10 ** data?.loan.collaterals.decimals))
  }

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
  }, [
    hasLoanExecuted,
    hasLoanCompleted,
    data?.ownerNftTokenId,
    data?.loan.collateralOwnerId,
    data?.loan.deadlineNext,
    updateDeadline,
  ])

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
      <tr
        className="flex flex-col flex-no wrap sm:table-row mb-2 sm:mb-0 cursor-pointer animate-enter-token hover:bg-neutral-800/60 bg-neutral-900/70 shadow"
        key={data.loanId}
        onClick={() => router.push(`/loan/${data.loan.address}`)}
      >
        <td className="p-2">
          <DisplayToken
            token={data?.loan?.collaterals}
            size={20}
            chainSlug={currentChain.slug}
            amount={Number(data?.loan.collaterals.amount) / Number(10 ** data?.loan.collaterals.decimals)}
          />
        </td>
        <td className="p-2">
          <DisplayToken
            token={data.loan.token}
            size={20}
            chainSlug={currentChain.slug}
            amount={Number(data?.loan.token.amount) / Number(10 ** data?.loan.token.decimals)}
          />
        </td>
        <td className="p-2">{`${data.loan.address.substring(0, 5)}...${data.loan.address.substring(38)}`}</td>
        <td className="p-2">
          <DaysHours deadline={Number(data.loan.deadline)} />
        </td>
        <td className="p-2">
          {" "}
          {Number(data.loan.paymentsPaid)}/{Number(data.loan.paymentCount)}
        </td>
        <td className="p-2">
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

export default DashboardUserTableItem
