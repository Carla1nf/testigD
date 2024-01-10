"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function PageNotExists() {
  const router = useRouter()
  useEffect(() => {
    router.push("/dashboard")
  }, [router])
}
