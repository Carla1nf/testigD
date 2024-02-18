"use client"

import createdOfferABI from "@/abis/v2/createdOffer.json"
import { PersonIcon } from "@/components/icons"
import { useToast } from "@/components/ui/use-toast"
import ActionButtons from "@/components/ux/action-buttons"
import DisplayToken from "@/components/ux/display-token"
import RedirectToDashboardShortly from "@/components/ux/redirect-to-dashboard-shortly"
import { useControlledAddress } from "@/hooks/useControlledAddress"
import useCurrentChain from "@/hooks/useCurrentChain"
import { useOffer } from "@/hooks/useOffer"
import { dollars, percent, shortAddress, thresholdLow, yesNo } from "@/lib/display"
import { toDecimals } from "@/lib/erc20"
import { DISCORD_INVITE_URL, ZERO_ADDRESS } from "@/services/constants"
import { useMachine } from "@xstate/react"
import { ExternalLink } from "lucide-react"
import pluralize from "pluralize"
import { useEffect, useState } from "react"
import { Address, useConfig, useContractRead } from "wagmi"
import { writeContract } from "wagmi/actions"
import { fromPromise } from "xstate"
import erc20Abi from "../../../abis/erc20.json"
import BorrowOfferBreadcrumbs from "./components/breadcrumbs"
import BorrowOfferChart from "./components/chart"
import BorrowOfferStats from "./components/stats"
import { machine } from "./not-owner-machine"
import { cn } from "@/lib/utils"
import { findInternalTokenByAddress, isNft } from "@/lib/tokens"

export default function BorrowOfferIsNotOwner({ params }: { params: { borrowOfferAddress: Address } }) {
  const borrowOfferAddress = params.borrowOfferAddress
  const currentChain = useCurrentChain()
  const config = useConfig()
  const { toast } = useToast()
  const { address } = useControlledAddress()
  const { data: offer } = useOffer(address, borrowOfferAddress)
  const [amountToLend, setAmountToLend] = useState(0)
  const [amountCollateral, setAmountCollateral] = useState(0)

  const principle = offer?.principle
  const collateral = offer?.collateral
  const principleToken = principle ? principle?.token : undefined
  const collateralToken = collateral ? collateral?.token : undefined

  // check if we have the allowance to spend the lender token
  const { data: currentLendingTokenAllowance } = useContractRead({
    address: principle?.address as Address,
    functionName: "allowance",
    abi: erc20Abi,
    args: [address, borrowOfferAddress],
  })

  const handleWantedLend = (newValue: number) => {
    const amountCollateral = collateral && principle ? (collateral?.amount * newValue) / principle?.amount : 0
    setAmountToLend(newValue)
    setAmountCollateral(amountCollateral)
  }

  const increaseAllowance = async () => {
    try {
      const { request } = await config.publicClient.simulateContract({
        address: principle?.address as Address,
        functionName: "approve",
        abi: erc20Abi,
        args: [borrowOfferAddress, lendingAmount],
        account: address,
      })
      // console.log("increaseAllowance→request", request)

      const executed = await writeContract(request)
      console.log("increaseAllowance→executed", executed)
      const transaction = await config.publicClient.waitForTransactionReceipt(executed)
      console.log("transaction", transaction)

      toast({
        variant: "success",
        title: "Allowance Increased",
        description: "You have increased the allowance and can now accept the offer.",
        // tx: executed,
      })
      send({ type: "user.accept.offer" })
      return executed
    } catch (error) {
      console.log("increaseAllowance→error", error)
      throw error
    }
  }

  const handleWantedBorrow = (porcentage: number) => {
    const newValue = principle ? (principle.amount * porcentage) / 100 : 0
    const amountCollateral =
      collateral && principle ? (collateral?.amount * Number(newValue.toFixed(2))) / principle?.amount : 0
    setAmountToLend(Number(newValue.toFixed(2)))
    setAmountCollateral(Number(amountCollateral.toFixed(2)))
  }

  const lendingAmount = toDecimals(amountToLend, principleToken?.decimals ?? 0)

  console.log(Number(currentLendingTokenAllowance) < Number(lendingAmount))

  const userAcceptOffer = async () => {
    try {
      console.log("To borrow:", lendingAmount)
      const { request } = await config.publicClient.simulateContract({
        address: borrowOfferAddress,
        functionName: "acceptOfferAsLender",
        abi: createdOfferABI,
        args: [lendingAmount, 0],
        account: address,
        gas: BigInt(4800000),
        // chainId: currentChain?.chainId,
      })

      const executed = await writeContract(request)
      console.log("userAcceptOffer→executed", executed)
      const transaction = await config.publicClient.waitForTransactionReceipt(executed)
      console.log("transaction", transaction)
      toast({
        variant: "success",
        title: "Offer Accepted",
        description: "You have accepted the offer.",
        // tx: executed,
      })
      return executed
    } catch (error) {
      console.log("userAcceptOffer→error", error)
      throw error
    }
  }

  // STATE MACHINE
  // USER - ACCEPT OFFER
  const [state, send] = useMachine(
    machine.provide({
      actors: {
        acceptOffer: fromPromise(userAcceptOffer),
        increaseAllowance: fromPromise(increaseAllowance),
      },
    })
  )

  // STATE MACHINE CONTROL
  // Connect the machine to the current on-chain state
  useEffect(() => {
    if (currentLendingTokenAllowance === undefined) {
      return
    }
    send({ type: "user.has.allowance" })

    // do they have the required allowance to pay for the offer?
    if (Number(currentLendingTokenAllowance) >= lendingAmount) {
      send({ type: "user.has.allowance" })
    } else if (!state.matches("isNotOwner.notEnoughAllowance")) {
      send({ type: "user.not.has.allowance" })
    }
  }, [currentLendingTokenAllowance, state, send, principle?.amount])

  console.log("state", state.value)

  const totalLoan = Number(principle?.amount ?? 0)
  const totalInterestOnLoan = Number(offer?.interest ?? 0) * Number(principle?.amount ?? 0)
  const totalLoanIncludingInterest = totalLoan + totalInterestOnLoan
  const amountDuePerPayment = totalLoanIncludingInterest / Number(offer?.paymentCount ?? 1)

  if (offer === null) {
    return (
      <RedirectToDashboardShortly
        title="Borrow offer not found"
        description={
          <>
            <div className="mb-4">
              We are unable to find borrow offer {borrowOfferAddress}, it appears to have either already been accepted
              or may have never existed.
            </div>
            Please contact us in our{" "}
            <a
              href={DISCORD_INVITE_URL}
              target="_blank"
              rel="nofollow noreferrer"
              className="text-pink-500 hover:underline flex-inline items-end gap-1"
            >
              Discord <ExternalLink className="w-4 h-4 mb-[4px] inline" />
            </a>{" "}
            if you need further assistance.
          </>
        }
      />
    )
  }

  // RENDERING
  return (
    <>
      {/* Page header */}
      <div className="@container mb-8 space-y-4">
        <BorrowOfferBreadcrumbs principleToken={principleToken} />
        <h1 className="text-3xl font-bold flex flex-row gap-1 items-center whitespace-nowrap">Borrow Offer</h1>
      </div>

      {/* Page content */}
      <div className="flex flex-col-reverse w-full xl:flex-row gap-16">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col @6xl:flex-row gap-8 justify-between">
            <BorrowOfferStats principle={principle} offer={offer} />
          </div>
          <div>
            <BorrowOfferChart
              principleToken={principleToken}
              collateralToken={findInternalTokenByAddress(currentChain.slug, offer?.collateralAddressChart as string)}
              principleAmount={principle?.amount}
              collateralAmount={offer?.collateralAmountChart}
            />
          </div>
        </div>
        <div className="space-y-8 max-w-xl w-full justify-self xl:ml-14">
          <div className="flex justify-between gap-8 mt-1">
            <div className="bg-[#21232B]/40 border-2 border-white/10 p-3 w-full rounded-md flex gap-2 items-center justify-center ">
              You are lending to
              <PersonIcon className="w-6 h-6" />
              {shortAddress(offer?.owner as Address)}
            </div>
          </div>

          {/* Form Panel */}
          <div className="bg-[#32282D]/40 border border-[#743A49] p-8 rounded-md">
            {/* Tokens row */}
            <div className="grid grid-cols-2 justify-between gap-8">
              <div className="flex flex-col gap-3">
                <div>
                  Secured collateral
                  <span className="text-white/50 text-xs italic ml-2">
                    {dollars({ value: offer?.totalCollateralValue ?? 0 })}
                  </span>
                </div>
                <div className="-ml-[2px]">
                  {collateral && collateralToken ? (
                    <DisplayToken
                      size={32}
                      token={collateralToken}
                      amount={collateral.amount}
                      chainSlug={currentChain.slug}
                      className="text-xl"
                    />
                  ) : null}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <div>
                  Wanted Lending
                  <span className="text-white/50 text-xs italic ml-2">
                    {dollars({ value: Number(principle?.valueUsd ?? 0) })}
                  </span>
                </div>

                {principle && principleToken ? (
                  <div className="-ml-[2px]">
                    <DisplayToken
                      size={32}
                      token={principleToken}
                      amount={principle.amount}
                      chainSlug={currentChain.slug}
                      className="text-xl"
                    />
                  </div>
                ) : null}
              </div>
            </div>
            <hr className="h-px my-8 bg-[#4D4348] border-0" />

            {/* Payment details row */}
            <div className="grid grid-cols-3 justify-between gap-6 text-sm">
              <div className="border border-[#41353B] rounded-sm p-2 px-4">
                <div className="text-[#DCB5BC]">Payments Am.</div>
                <div className="text-base">{Number(offer?.paymentCount ?? 0)}</div>
              </div>
              <div className="border border-[#41353B] rounded-sm p-2">
                <div className="text-[#DCB5BC]">Payments Every</div>
                <div className="text-base">
                  {Number(offer?.numberOfLoanDays ?? 0)} {pluralize("day", Number(offer?.numberOfLoanDays ?? 0))}
                </div>
              </div>
              <div className="border border-[#41353B] rounded-sm p-2 flex flex-col justify-between">
                <div className="text-[#DCB5BC]">Perpetual</div>
                <div className={cn("text-base")}>{yesNo(offer?.perpetual)}</div>
              </div>
            </div>

            {/* Loan details row */}
            <div className="mt-4 grid grid-cols-2 justify-between gap-6 text-sm">
              <div className="border border-[#41353B] rounded-sm p-2 px-4">
                <div className="text-[#DCB5BC]">Total Interest</div>
                <div className="text-base">
                  {thresholdLow(totalInterestOnLoan, 0.01, "< 0.01")} {principleToken?.symbol} (
                  {percent({ value: offer?.interest ?? 0 })})
                </div>
              </div>
              <div className="border border-[#41353B] rounded-sm p-2">
                <div className="text-[#DCB5BC]">Each Payment Am.</div>
                <div className="text-base">
                  {amountDuePerPayment.toFixed(2)} {principleToken?.symbol}
                </div>
              </div>
            </div>

            <div className="mt-8">
              <>
                <ActionButtons.Group
                  when={state.matches("notEnoughAllowance")}
                  right={
                    <ActionButtons.Action
                      title="Accept Offer"
                      when={true}
                      onClick={async () => {
                        send({ type: "user.allowance.increase" })
                      }}
                    />
                  }
                />

                <ActionButtons.Group
                  when={state.matches("increaseAllowance")}
                  right={<ActionButtons.Spinner title="Increasing Allowance" when={true} />}
                />

                <ActionButtons.Group
                  when={state.matches("increaseAllowanceError")}
                  right={
                    <ActionButtons.Error
                      title="Increasing Allowance Failed - Retry?"
                      when={true}
                      onClick={async () => {
                        send({ type: "user.allowance.increase.retry" })
                      }}
                    />
                  }
                />

                <ActionButtons.Group
                  className="flex-rowc items-center"
                  when={state.matches("canAcceptOffer")}
                  left={
                    <div className="">
                      <div className="flex gap-1 items-center italic opacity-80">
                        <div className=" text-sm"> Collateral:</div>
                        {collateralToken ? (
                          <DisplayToken
                            size={20}
                            token={collateralToken}
                            amount={amountCollateral}
                            className="text-base"
                            chainSlug={currentChain.slug}
                          />
                        ) : (
                          ""
                        )}
                      </div>
                      <div>
                        <label
                          htmlFor="customRange1"
                          className="mb-2 inline-block text-neutral-700 dark:text-neutral-200"
                        ></label>
                        <input
                          type="range"
                          min={isNft(collateralToken) ? 100 : 1}
                          max={100}
                          defaultValue={isNft(collateralToken) ? 100 : 0}
                          className="transparent h-[4px] w-full cursor-pointer appearance-none border-transparent bg-neutral-200 dark:bg-neutral-600"
                          id="customRange1"
                          onChange={(e) => {
                            handleWantedBorrow(Number(e.currentTarget.value))
                          }}
                        />
                      </div>
                      <div className="flex gap-3">
                        <div>Lend amount:</div>
                        {principleToken ? (
                          <DisplayToken
                            token={principleToken}
                            amount={isNft(collateralToken) ? principle?.amount : amountToLend}
                            size={20}
                          />
                        ) : (
                          ""
                        )}
                      </div>
                    </div>
                  }
                  right={
                    <ActionButtons.Action
                      title={`Accept Offer`}
                      when={true}
                      onClick={async () => {
                        Number(currentLendingTokenAllowance) < Number(lendingAmount)
                          ? increaseAllowance()
                          : send({ type: "user.accept.offer" })
                      }}
                    />
                  }
                />
                <ActionButtons.Group
                  when={state.matches("acceptingOffer")}
                  right={<ActionButtons.Spinner title="Accepting Offer" when={true} />}
                />

                <ActionButtons.Group
                  when={state.matches("acceptingOfferError")}
                  right={
                    <ActionButtons.Error
                      title="Accept Offer Failed - Retry?"
                      when={true}
                      onClick={async () => {
                        send({ type: "user.accept.offer.retry" })
                      }}
                    />
                  }
                />

                <ActionButtons.Group
                  when={state.matches("offerAccepted")}
                  right={<ActionButtons.Success title="Offer Accepted" when={true} />}
                />
              </>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
