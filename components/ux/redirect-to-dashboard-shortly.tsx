"use client"

import { ReactNode, useEffect } from "react"
import { useRouter } from "next/navigation"

const RedirectToDashboardShortly = ({ title, description }: { title: string; description: ReactNode }) => {
  const router = useRouter()

  useEffect(() => {
    // Set a timeout to redirect after X seconds (milliseconds)
    const timer = setTimeout(() => {
      router.push("/dashboard")
    }, 20000)

    // Cleanup function to clear the timer if the component unmounts
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div>
      <h1 className="text-2xl mb-4 font-bold">{title}</h1>
      <p className="text-base mb-16">{description}</p>
      <p className="italic text-sm">Redirecting to the dashboard shortly...</p>
    </div>
  )
}

export default RedirectToDashboardShortly
