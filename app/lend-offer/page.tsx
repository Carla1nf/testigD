"use client"

import { useRouter } from "next/router"

export default function PageNotExists() {
  const router = useRouter()
  router.push("/dashboard")
}
