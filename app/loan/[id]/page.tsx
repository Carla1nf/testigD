"use client"

import ChartWrapper from "@/components/charts/chart-wrapper"
import LoanChart from "@/components/charts/loan-chart"
import { PersonIcon, SpinnerIcon } from "@/components/icons"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import Breadcrumbs from "@/components/ux/breadcrumbs"
import { ShowWhenTrue } from "@/components/ux/conditionals"
import DaysHours from "@/components/ux/deadline-datetime"
import DisplayNetwork from "@/components/ux/display-network"
import DisplayToken from "@/components/ux/display-token"
import TokenImage from "@/components/ux/token-image"
import { useControlledAddress } from "@/hooks/useControlledAddress"
import useCurrentChain from "@/hooks/useCurrentChain"
import useHistoricalTokenPrices from "@/hooks/useHistoricalTokenPrices"
import { useLoanData } from "@/hooks/useLoanData"
import { calcCollateralsPriceHistory, calcPriceHistory } from "@/lib/chart"
import { LoanStatus, dollars, formatFullDate, loanStatus, shortAddress } from "@/lib/display"
import { cn } from "@/lib/utils"
import { useMachine } from "@xstate/react"
import dayjs from "dayjs"
import { AlertCircle, CheckCircle, XCircle } from "lucide-react"
import pluralize from "pluralize"
import { useEffect, useMemo } from "react"
import { Address, useConfig, useContractRead, useContractWrite } from "wagmi"
import { fromPromise } from "xstate"
import { machine } from "./loan-machine"
import erc20Abi from "../../../abis/erc20.json"
import debitaAbi from "../../../abis/debita.json"
import { DEBITA_ADDRESS } from "@/lib/contracts"
import { readContract, writeContract } from "wagmi/actions"
import { ZERO_ADDRESS } from "@/services/constants"
import { balanceOf } from "@/lib/erc20"

/**
 * This page shows the suer the FULL details of the loan
 *
 * Owners/Lenders can claim the debt or retrieve their collateral
 * Borrowers can repay their loan (one or more times if multiple payments are due)
 *
 */
export default function Loan({ params }: { params: { id: string } }) {
  const id = Number(params.id)
  const config = useConfig()
  const { toast } = useToast()

  const currentChain = useCurrentChain()
  const { address } = useControlledAddress()
  const { data: loan, useLoanDataQuery, refetch: refetchLoan } = useLoanData(id)

  const lending = loan?.lending
  const lendingToken = lending ? lending?.token : undefined
  const lendingPrices = useHistoricalTokenPrices(currentChain.slug, loan?.lending?.address)
  const collateral0 = loan?.collaterals[0] ?? undefined
  const collateral0Token = collateral0 ? collateral0?.token : undefined
  const collateral0Prices = useHistoricalTokenPrices(currentChain.slug, collateral0?.address)
  const collateral1 = loan?.collaterals[1] ?? undefined
  const collateral1Token = collateral1 ? collateral0?.token : undefined
  const collateral1Prices = useHistoricalTokenPrices(currentChain.slug, collateral1?.address)

  const timestamps = lendingPrices?.map((item: any) => dayjs.unix(item.timestamp).format("DD/MM/YY")) ?? []

  // we need to know (if this is the borrower) how much they have approved the lending
  const { data: lendingTokenAllowance } = useContractRead({
    address: lendingToken?.address,
    functionName: "allowance",
    abi: erc20Abi,
    args: [address, DEBITA_ADDRESS],
  }) as { data: bigint }

  const [loanState, loanSend] = useMachine(
    machine.provide({
      actors: {
        claimLentTokens: fromPromise(async () => {
          try {
            if (loan?.hasClaimedCollateral) {
              throw "Collateral already claimed"
            }

            const { request } = await config.publicClient.simulateContract({
              address: DEBITA_ADDRESS,
              functionName: "claimDebt",
              abi: debitaAbi,
              args: [id],
              account: address,
              gas: BigInt(300000),
            })

            const result = await writeContract(request)
            await refetchLoan()
            return Promise.resolve(result)
          } catch (error) {}
          return Promise.reject()
        }),
        claimCollateralAsLender: fromPromise(async () => {
          try {
            if (loan?.hasClaimedCollateral) {
              throw "Collateral already claimed"
            }

            const { request } = await config.publicClient.simulateContract({
              address: DEBITA_ADDRESS,
              functionName: "claimCollateralasLender",
              abi: debitaAbi,
              args: [id],
              account: address,
              gas: BigInt(300000),
            })

            const result = await writeContract(request)
            await refetchLoan()
            return Promise.resolve(result)
          } catch (error) {}
          return Promise.reject()
        }),
        claimCollateralAsBorrower: fromPromise(async () => {
          try {
            if (loan?.hasClaimedCollateral) {
              throw "Collateral already claimed"
            }

            const { request } = await config.publicClient.simulateContract({
              address: DEBITA_ADDRESS,
              functionName: "claimCollateralasBorrower",
              abi: debitaAbi,
              args: [id],
              account: address,
              gas: BigInt(300000),
            })

            const result = await writeContract(request)
            await refetchLoan()
            return Promise.resolve(result)
          } catch (error) {}
          return Promise.reject()
        }),
        checkBorrowerHasPaymentAllowance: fromPromise(() => {
          return BigInt(lendingTokenAllowance ?? 0) >= BigInt(loan?.paymentAmountRaw)
            ? Promise.resolve()
            : Promise.reject()
        }),
        borrowerApproveAllowance: fromPromise(async () => {
          const result = await writeContract({
            address: lendingToken?.address,
            functionName: "approve",
            abi: erc20Abi,
            args: [DEBITA_ADDRESS, loan?.paymentAmountRaw],
          })
          await refetchLoan()
          return result
        }),
        borrowerPayingDebt: fromPromise(async () => {
          try {
            // make sure they actually have the funds to pay the debt
            const lendingBalance = await balanceOf({
              address: lendingToken?.address as Address,
              account: address as Address,
            })
            if (lendingToken && lendingBalance < loan?.paymentAmountRaw) {
              throw `Insufficient ${lendingToken?.symbol} balance to pay debt`
            }

            // if this is the native token, we need to send the value with the transaction
            const value = lendingToken.address === ZERO_ADDRESS ? BigInt(loan?.paymentAmountRaw ?? 0) : BigInt(0)

            // simulate the transaction..
            const { request } = await config.publicClient.simulateContract({
              address: DEBITA_ADDRESS,
              functionName: "payDebt",
              abi: debitaAbi,
              args: [id],
              account: address,
              gas: BigInt(900000),
            })

            const result = await writeContract(request)

            // now we get the loan data again!
            await refetchLoan()

            return Promise.resolve(result)
          } catch (error) {
            console.log(error)
          }
          return Promise.reject()
        }),
      },
    })
  )

  console.log("loanState.value", loanState.value)
  console.log("loan", loan)

  const displayLoanStatus = useMemo(() => {
    return loanStatus(Number(loan?.deadlineNext))
  }, [loan?.deadlineNext])

  // BREADCRUMBS
  // CONFIG
  const breadcrumbs = useMemo(() => {
    return [<DisplayNetwork currentChain={currentChain} size={18} key="network" />]
  }, [currentChain])

  useEffect(() => {
    if (!loan) {
      return
    }

    // Users can change wallets so let's stay on top of that
    if (loan?.lender === address) {
      loanSend({ type: "is.lender" })
      // now fill in the other details

      if (loan?.hasClaimedCollateral) {
        loanSend({ type: "has.already.claimed.collateral" })
      }

      // fake unclaimed payments
      // loanSend({ type: "loan.has.tokens.to.claim" })
      // loanSend({ type: "lender.claim.lent.tokens" })

      // How do we know there is a claim available and how much?

      if (loan?.claimableDebt > 0) {
        loanSend({ type: "loan.has.tokens.to.claim" })
      }

      // Has the borrower defaulted?
      if (loan?.hasDefaulted) {
        loanSend({ type: "loan.has.defaulted" })
      }
    } else if (loan?.borrower === address) {
      loanSend({ type: "is.borrower" })
      // now fill in the other details

      // Has the borrower defaulted?
      if (loan?.hasDefaulted) {
        loanSend({ type: "loan.has.defaulted" })
      }

      // Has the borrower repaid the loan in full?
      if (loan?.hasRepaidLoan) {
        loanSend({ type: "borrower.has.repaid.in.full" })
      }
      if (loan?.paymentDue) {
        // does the borrower have a payment due?
        loanSend({ type: "loan.has.payment.due" })
      }

      loanSend({ type: "borrower.check.payment.allowance" })
      // Has the borrower approved enough tokens to repay debt?
      // lendingTokenAllowance
      //
      //
    } else {
      loanSend({ type: "is.viewer" })
    }
  }, [address, loan, displayLoanStatus, loanSend, lendingTokenAllowance])

  const displayCollateralValue = dollars({ value: loan?.totalCollateralValue })
  const displayDebtValue = dollars({ value: loan?.lending?.amount })
  const displayLtv = loan?.ltv.toFixed(2)
  const displayDeadlineValue = Number(loan?.deadline) ?? 0

  // CHARTING
  // DATA STRUCTURE
  const chartValues = {
    historicalLender: calcPriceHistory(lendingPrices, loan?.lending?.amount ?? 0),
    historicalCollateral: calcCollateralsPriceHistory(
      collateral0Prices,
      Number(collateral0?.amount ?? 0),
      collateral1Prices,
      Number(collateral1?.amount ?? 0)
    ),
    timestamps,
  }

  // RENDERING
  return (
    <>
      {/* Page header */}
      <div className="@container mb-8 space-y-4">
        <Breadcrumbs items={breadcrumbs} />
        <h1 className="text-3xl font-bold flex flex-row gap-1 items-center whitespace-nowrap">
          Debita Loan #{Number(id)}
        </h1>
      </div>

      {/* Page content */}
      <div className="flex flex-col-reverse w-full xl:flex-row gap-16">
        <div className="flex flex-col gap-8">
          {/* Display Debt/Collateral owners */}
          <div className="flex space-between gap-8">
            <div className="bg-[#21232B] border-2 border-white/10 p-4 w-full rounded-md flex gap-2 items-center justify-center ">
              Lender <PersonIcon className="w-6 h-6" />
              {shortAddress(loan?.lender)}
            </div>
            <div className="bg-[#21232B] border-2 border-white/10 p-4 w-full rounded-md flex gap-2 items-center justify-center ">
              Borrower <PersonIcon className="w-6 h-6" />
              {shortAddress(loan?.borrower)}
            </div>
          </div>

          {/* Loan Stats */}
          <div className="flex justify-between gap-8 w-full">
            <ShowWhenTrue when={loanState.matches("lender") || loanState.matches("viewer")}>
              <LtvStat title="LTV" value={displayLtv} />
              <DebtStat title="Debt" value={displayDebtValue} />
              <CollateralStat title="Collateral" value={displayCollateralValue} />
              <DeadlineStat title="Final deadline" deadline={displayDeadlineValue} loanStatus={displayLoanStatus} />
            </ShowWhenTrue>
            <ShowWhenTrue when={loanState.matches("borrower")}>
              <LtvStat title="LTV" value={displayLtv} />
              <DebtStat title="My Debt" value={displayDebtValue} />
              <CollateralStat title="Collateral" value={displayCollateralValue} />
              <DeadlineStat title="Final deadline" deadline={displayDeadlineValue} loanStatus={displayLoanStatus} />
            </ShowWhenTrue>
          </div>

          <div>
            {/* Carl - make this more like your current chart, I've just reused this for now to get some data on screen */}
            <ChartWrapper>
              <LoanChart loanData={chartValues} />
            </ChartWrapper>
          </div>

          {/* Lender unclaimed payments available */}
          <ShowWhenTrue when={loanState.matches("lender.claim.available")}>
            <div className="rounded-md border-[#58353D] border bg-[#2C2B2B] p-4 px-6 flex gap-4 justify-between items-center">
              <div>Unclaimed payments</div>
              <div className="flex gap-2 items-center">
                <div>{dollars({ value: loan?.claimableDebt })}</div>
                <TokenImage
                  symbol={loan?.lending?.token?.symbol}
                  chainSlug={currentChain?.slug}
                  width={24}
                  height={24}
                />
              </div>
              <Button
                variant="action"
                className="px-8"
                onClick={() => {
                  loanSend({ type: "lender.claim.lent.tokens" })
                }}
              >
                Claim debt
              </Button>
            </div>
          </ShowWhenTrue>

          {/* Lender claiming unclaimed payments */}
          <ShowWhenTrue when={loanState.matches("lender.claim.claimingLentTokens")}>
            <div className="rounded-md border-[#58353D] border bg-[#2C2B2B] p-4 px-6 flex gap-4 justify-between items-center">
              <div>Unclaimed payments</div>
              <div className="flex gap-2 items-center">
                <div>{dollars({ value: loan?.claimableDebt })}</div>
                <TokenImage
                  symbol={loan?.lending?.token?.symbol}
                  chainSlug={currentChain?.slug}
                  width={24}
                  height={24}
                />
              </div>
              <Button variant="action" className="px-8">
                Claiming debt
                <SpinnerIcon className="ml-2 animate-spin-slow" />
              </Button>
            </div>
          </ShowWhenTrue>

          {/* Lender error claiming unclaimed payments */}
          <ShowWhenTrue when={loanState.matches("lender.claim.errorClaimingLentTokens")}>
            <div className="rounded-md border-[#58353D] border bg-[#2C2B2B] p-4 px-6 flex gap-4 justify-between items-center">
              <div>Unclaimed payments</div>
              <div className="flex gap-2 items-center">
                <div>{dollars({ value: loan?.claimableDebt })}</div>
                <TokenImage
                  symbol={loan?.lending?.token?.symbol}
                  chainSlug={currentChain?.slug}
                  width={24}
                  height={24}
                />
              </div>
              <Button
                variant="error"
                className="px-8 gap-2"
                onClick={() => {
                  loanSend({ type: "lender.retry.lent.tokens" })
                }}
              >
                <XCircle className="h-5 w-5" /> Claim Failed - Retry?
              </Button>
            </div>
          </ShowWhenTrue>

          {/* Lender claimed unclaimed payments */}
          <ShowWhenTrue when={loanState.matches("lender.claim.completed")}>
            <div className="rounded-md border-[#58353D] border bg-[#2C2B2B] p-4 px-6 flex gap-4 justify-between items-center">
              <div>Unclaimed payments</div>
              <Button variant="success" className="px-8 gap-2">
                <CheckCircle className="w-5 h-5" />
                Claimed
              </Button>
            </div>
          </ShowWhenTrue>

          {/* Borrower Alerts */}
          <ShowWhenTrue when={loanState.matches("borrower")}>
            <ShowWhenTrue when={displayLoanStatus.state === "defaulted" && !loan?.hasLoanCompleted}>
              <Alert variant="warning" className="">
                <AlertCircle className="w-5 h-5 mr-2" />
                <AlertTitle>Please note</AlertTitle>
                <AlertDescription>
                  This loan defaulted on {loan?.deadline ? formatFullDate(Number(loan?.deadline)) : ""}. The lender will
                  claim collateral and any payments already paid. It is too late to make a payment or recover
                  collateral.
                </AlertDescription>
              </Alert>
            </ShowWhenTrue>
            <ShowWhenTrue when={displayLoanStatus.state === "live"}>
              <Alert variant="info" className="">
                <AlertCircle className="w-5 h-5 mr-2" />
                <AlertTitle>Please note</AlertTitle>
                <AlertDescription>
                  if any payment is not paid according to the agreed terms, the lender reserves the right to claim the
                  collateral provided as security for the loan.
                </AlertDescription>
              </Alert>
            </ShowWhenTrue>
          </ShowWhenTrue>

          {/* Lender Alerts */}
          <ShowWhenTrue when={loanState.matches("lender")}>
            <ShowWhenTrue when={loan?.hasLoanCompleted}>
              <Alert variant="info" className="">
                <AlertCircle className="w-5 h-5 mr-2" />
                <AlertTitle>Completed</AlertTitle>
                <AlertDescription>The loan has completed</AlertDescription>
              </Alert>
            </ShowWhenTrue>
          </ShowWhenTrue>
        </div>
        <div className="space-y-8 max-w-xl w-full">
          <ShowWhenTrue when={loanState.matches("lender")}>
            <div className="bg-[#21232B] border-2 border-white/10 p-4 w-full rounded-md flex gap-2 items-center justify-center ">
              You are the lender
              <PersonIcon className="w-6 h-6" />
            </div>
          </ShowWhenTrue>

          <ShowWhenTrue when={loanState.matches("borrower")}>
            <div className="bg-[#21232B] border-2 border-white/10 p-4 w-full rounded-md flex gap-2 items-center justify-center ">
              You are the borrower
              <PersonIcon className="w-6 h-6" />
            </div>
          </ShowWhenTrue>

          {/* Form Panel */}
          <div className="bg-[#32282D] border border-[#743A49] p-8 rounded-md">
            <div className="text-xl mb-4 font-bold">Loan</div>
            {/* Status row */}
            <div className="grid grid-cols-2 justify-between gap-8 mb-8">
              <div className="flex flex-col">
                <div className="">Status</div>
                <div className={cn(displayLoanStatus.className, "font-bold text-lg")}>
                  {displayLoanStatus.displayText}
                </div>
              </div>

              <div>
                <div>Next Payment</div>

                <ShowWhenTrue when={loanState.matches("borrower")}>
                  <ShowWhenTrue when={displayLoanStatus.state === "defaulted"}>
                    <span className="font-bold text-lg text-amber-500">Expired</span>
                  </ShowWhenTrue>
                  <ShowWhenTrue when={displayLoanStatus.state === "live"}>
                    <DaysHours
                      deadline={loan?.deadline}
                      className={cn(displayLoanStatus.className, "font-bold text-lg")}
                    />
                  </ShowWhenTrue>
                </ShowWhenTrue>

                <ShowWhenTrue when={loanState.matches("lender")}>
                  <ShowWhenTrue when={displayLoanStatus.state === "defaulted"}>
                    <span className="font-bold text-lg text-amber-500">Expired</span>
                  </ShowWhenTrue>
                  <ShowWhenTrue when={displayLoanStatus.state === "live"}>
                    <DaysHours
                      deadline={loan?.deadline}
                      className={cn(displayLoanStatus.className, "font-bold text-lg")}
                    />
                  </ShowWhenTrue>
                </ShowWhenTrue>
              </div>
            </div>
            {/* Tokens row */}
            <div className="grid grid-cols-2 justify-between gap-8">
              <div className="flex flex-col gap-3">
                <div>
                  Collateral
                  <span className="text-white/50 text-xs italic ml-2">
                    {dollars({ value: loan?.totalCollateralValue ?? 0 })}
                  </span>
                </div>
                <div className="-ml-[2px]">
                  {collateral0 && collateral0Token ? (
                    <DisplayToken size={32} token={collateral0Token} amount={collateral0.amount} className="text-xl" />
                  ) : null}
                  {collateral1 && collateral1Token ? (
                    <DisplayToken size={32} token={collateral1Token} amount={collateral1.amount} className="text-xl" />
                  ) : null}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div>
                  Debt
                  <span className="text-white/50 text-xs italic ml-2">
                    {dollars({ value: loan?.lending?.valueUsd ?? 0 })}
                  </span>
                </div>

                {lending && lendingToken ? (
                  <div className="-ml-[2px]">
                    <DisplayToken size={32} token={lendingToken} amount={lending.amount} className="text-xl" />
                  </div>
                ) : null}
              </div>
            </div>
            <hr className="h-px my-8 bg-[#4D4348] border-0" />

            {/* Payment details row */}
            <div className="grid grid-cols-3 justify-between gap-6 text-sm">
              <div className="border border-[#41353B] rounded-sm p-2">
                <div className="text-[#DCB5BC]">Payments Every</div>
                <div className="text-base">
                  {Number(loan?.numberOfLoanDays ?? 0)} {pluralize("day", Number(loan?.numberOfLoanDays ?? 0))}
                </div>
              </div>
              <div className="border border-[#41353B] rounded-sm p-2">
                <div className="text-[#DCB5BC]">Payments Paid</div>
                <div className="text-base">{Number(loan?.paymentsPaid)}</div>
              </div>
              <div className="border border-[#41353B] rounded-sm p-2 px-4">
                <div className="text-[#DCB5BC]">Total Payments</div>
                <div className="text-base">{Number(loan?.paymentCount ?? 0)}</div>
              </div>
            </div>

            {/* Loan details row */}
            <div className="mt-4 grid grid-cols-2 justify-between gap-6 text-sm">
              <div className="border border-[#41353B] rounded-sm p-2 px-4">
                <div className="text-[#DCB5BC]">Each Payment</div>
                <div className="text-base">
                  <DisplayToken
                    size={20}
                    token={lendingToken}
                    amount={loan?.eachPayment}
                    className=""
                    displayOrder="AmountNameIcon"
                  />
                </div>
              </div>
              <div className="border border-[#41353B] rounded-sm p-2">
                <div className="text-[#DCB5BC]">Debt Left</div>
                <div className="text-base">
                  <DisplayToken
                    size={20}
                    token={lendingToken}
                    amount={loan?.debtLeft}
                    className=""
                    displayOrder="AmountNameIcon"
                  />
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-8 flex justify-center">
              {/* Lender - already claimed */}
              <ShowWhenTrue when={loanState.matches("lender.claim.alreadyClaimed")}>
                <Button variant="muted" className="w-1/2" disabled>
                  Claim Collateral
                </Button>
              </ShowWhenTrue>

              {/* Lender - can claim collateral */}
              <ShowWhenTrue
                when={
                  loanState.matches("lender.defaulted.hasDefaulted") &&
                  !loanState.matches("lender.claim.alreadyClaimed")
                }
              >
                <Button
                  variant="action"
                  className="w-1/2"
                  onClick={() => {
                    loanSend({ type: "lender.claim.collateral" })
                  }}
                >
                  Claim Collateral
                </Button>
              </ShowWhenTrue>

              {/* Lender - can claim collateral */}
              <ShowWhenTrue when={loanState.matches("lender.defaulted.claimingCollateral")}>
                <Button variant="action" className="w-1/2">
                  Claiming Collateral
                  <SpinnerIcon className="ml-2 animate-spin-slow" />
                </Button>
              </ShowWhenTrue>

              {/* Lender - failed claimed collateral */}
              <ShowWhenTrue when={loanState.matches("lender.defaulted.errorClaimingCollateral")}>
                <Button
                  variant="error"
                  className="min-w-1/2"
                  onClick={() => {
                    loanSend({ type: "lender.retry.claim.collateral" })
                  }}
                >
                  <XCircle className="h-5 w-5 mr-2" /> Claim Failed - Retry?
                </Button>
              </ShowWhenTrue>

              {/* Lender - claimed collateral */}
              <ShowWhenTrue when={loanState.matches("lender.defaulted.completed")}>
                <Button variant="success" className="w-1/2">
                  <CheckCircle className="w-5 h-5 mr-2" /> Claimed Collateral
                </Button>
              </ShowWhenTrue>

              {/* borrower - repay debt - checking allowance */}
              <ShowWhenTrue when={loanState.matches("borrower.notDefaulted.checkingAllowance")}>
                <Button variant="action" className="w-1/2">
                  Checking Allowance
                  <SpinnerIcon className="ml-2 animate-spin-slow" />
                </Button>
              </ShowWhenTrue>

              {/* borrower - repay debt - checking allowance failed */}
              <ShowWhenTrue when={loanState.matches("borrower.notDefaulted.errorCheckingAllowance")}>
                <Button
                  variant="action"
                  className="min-w-1/2"
                  onClick={() => {
                    loanSend({ type: "borrower.approve.allowance" })
                  }}
                >
                  Approve Allowance
                </Button>
              </ShowWhenTrue>

              {/* borrower - repay debt - approving new allowance */}
              <ShowWhenTrue when={loanState.matches("borrower.notDefaulted.approvingAllowance")}>
                <Button
                  variant="action"
                  className="min-w-1/2"
                  onClick={() => {
                    loanSend({ type: "borrower.approve.allowance" })
                  }}
                >
                  Approving Allowance
                  <SpinnerIcon className="ml-2 animate-spin-slow" />
                </Button>
              </ShowWhenTrue>

              {/* borrower - repay debt - approving new allowance failed*/}
              <ShowWhenTrue when={loanState.matches("borrower.notDefaulted.errorApprovingAllowance")}>
                <Button
                  variant="error"
                  className="min-w-1/2"
                  onClick={() => {
                    loanSend({ type: "borrower.retry.approve.allowance" })
                  }}
                >
                  <XCircle className="h-5 w-5 mr-2" /> Approving Failed - Retry?
                </Button>
              </ShowWhenTrue>

              {/* Borrower - Ready to pay debt */}
              <ShowWhenTrue when={loanState.matches("borrower.notDefaulted.payDebt")}>
                <Button
                  variant="action"
                  className="w-1/2"
                  onClick={() => {
                    loanSend({ type: "borrower.pay.debt" })
                  }}
                >
                  Pay Debt
                </Button>
              </ShowWhenTrue>

              {/* borrower - repaying debt */}
              <ShowWhenTrue when={loanState.matches("borrower.notDefaulted.payingDebt")}>
                <Button variant="action" className="w-1/2">
                  Paying Debt
                  <SpinnerIcon className="ml-2 animate-spin-slow" />
                </Button>
              </ShowWhenTrue>

              {/* borrower - paying debt failed */}
              <ShowWhenTrue when={loanState.matches("borrower.notDefaulted.errorPayingDebt")}>
                <Button
                  variant="error"
                  className="min-w-1/2"
                  onClick={() => {
                    loanSend({ type: "borrower.retry.paying.debt" })
                  }}
                >
                  <XCircle className="h-5 w-5 mr-2" /> Paying Debt Failed - Retry?
                </Button>
              </ShowWhenTrue>

              {/* borrower - debt paid */}
              <ShowWhenTrue when={loanState.matches("borrower.notDefaulted.completed")}>
                <Button variant="success" className="w-1/2">
                  <CheckCircle className="w-5 h-5 mr-2" /> Debt Paid
                </Button>
              </ShowWhenTrue>

              {/* Borrower - can claim collateral */}
              <ShowWhenTrue when={loanState.matches("borrower.notDefaulted.canClaimCollateral")}>
                <ShowWhenTrue when={!loan?.hasClaimedCollateral}>
                  <Button
                    variant="action"
                    className="w-1/2"
                    onClick={() => {
                      loanSend({ type: "borrower.claim.collateral" })
                    }}
                  >
                    Claim Collateral
                  </Button>
                </ShowWhenTrue>
                <ShowWhenTrue when={loan?.hasClaimedCollateral}>
                  <Button variant="muted" className="w-1/2" disabled>
                    Claim Collateral
                  </Button>
                </ShowWhenTrue>
              </ShowWhenTrue>

              {/* Lender - can claim collateral */}
              <ShowWhenTrue when={loanState.matches("borrower.notDefaulted.claimingCollateral")}>
                <Button variant="action" className="w-1/2">
                  Claiming Collateral
                  <SpinnerIcon className="ml-2 animate-spin-slow" />
                </Button>
              </ShowWhenTrue>

              {/* Lender - failed claimed collateral */}
              <ShowWhenTrue when={loanState.matches("borrower.notDefaulted.errorClaimingCollateral")}>
                <Button
                  variant="error"
                  className="min-w-1/2"
                  onClick={() => {
                    loanSend({ type: "borrower.retry.claim.collateral" })
                  }}
                >
                  <XCircle className="h-5 w-5 mr-2" /> Claim Failed - Retry?
                </Button>
              </ShowWhenTrue>

              {/* Lender - claimed collateral */}
              <ShowWhenTrue when={loanState.matches("borrower.notDefaulted.completedClaimingCollateral")}>
                <Button variant="success" className="w-1/2">
                  <CheckCircle className="w-5 h-5 mr-2" /> Claimed Collateral
                </Button>
              </ShowWhenTrue>

              {/* borrower - defaulted */}
              <ShowWhenTrue when={loanState.matches("borrower.hasDefaulted")}>
                <Button variant="muted" className="w-1/2" disabled>
                  Pay Debt
                </Button>
              </ShowWhenTrue>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

const LtvStat = ({ title, value }: { title: string; value: string }) => {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-sm text-[#757575]">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  )
}

const DebtStat = ({ title, value }: { title: string; value: string }) => {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-sm text-[#757575]">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  )
}

const CollateralStat = ({ title, value }: { title: string; value: string }) => {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-sm text-[#757575]">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  )
}

const DeadlineStat = ({ title, deadline, loanStatus }: { title: string; deadline: number; loanStatus: LoanStatus }) => {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-sm text-[#757575]">{title}</div>
      <div className={cn("text-2xl font-bold")}>
        <ShowWhenTrue when={loanStatus.state === "defaulted"}>
          <span className="">Expired</span>
        </ShowWhenTrue>
        <ShowWhenTrue when={loanStatus.state === "live"}>
          <DaysHours deadline={deadline} />
        </ShowWhenTrue>
      </div>
    </div>
  )
}
