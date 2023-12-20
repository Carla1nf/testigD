"use client"

import { useRouter } from "next/navigation"

export default function PageNotExists() {
  const router = useRouter()
  router.push("/dashboard")
}
