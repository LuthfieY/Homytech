"use client"
import Dashboard from "@/components/dashboard"
import { useAuth } from "@/contexts/auth-context"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function Home() {
  const { email, isInitialized } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isInitialized && !email) {
      router.replace("/login")
    }
  }, [isInitialized, email, router])

  if (!isInitialized)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )

  if (!email) return null
  return <Dashboard />
}
