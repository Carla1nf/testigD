import { createContext, useContext, useState } from "react"

const NextPaymentContext = createContext<null | number>(null)
const ManagePaymentContext = createContext<null | ((nextDeadline: number) => void)>(null)

export function useNextPayment() {
  return useContext(NextPaymentContext)
}

export function useManageNextPayment() {
  return useContext(ManagePaymentContext)
}

export function DeadlineNext({ children }: { children: React.ReactNode }) {
  const [next, setAvailable] = useState<number>(0)
  // time now
  const now = new Date().getTime()
  const manageNext = (nextDeadline: number) => {
    const stillActive = nextDeadline > now / 1000
    if (next === 0 && stillActive) {
      setAvailable(nextDeadline)
    }

    if (nextDeadline < next && stillActive) {
      setAvailable(nextDeadline)
    }
  }

  return (
    <>
      <NextPaymentContext.Provider value={next}>
        <ManagePaymentContext.Provider value={manageNext}>{children}</ManagePaymentContext.Provider>
      </NextPaymentContext.Provider>
    </>
  )
}
