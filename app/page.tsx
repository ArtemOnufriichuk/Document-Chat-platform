"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/lib/store"
import LoginPage from "@/components/login-page"

export default function Home() {
  const router = useRouter()
  const { currentUser } = useAppStore()

  useEffect(() => {
    if (currentUser) {
      router.push("/dashboard")
    }
  }, [currentUser, router])

  return <LoginPage />
}

