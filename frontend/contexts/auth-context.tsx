"use client"
import React, { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"

type AuthContextType = {
  email: string | null
  name: string | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  token: string | null
  isInitialized: boolean
}

const AuthContext = createContext<AuthContextType>({
  email: null,
  name: null,
  login: async () => false,
  logout: () => {},
  token: null,
  isInitialized: false,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [email, setUser] = useState<string | null>(null)
  const [name, setName] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const t = localStorage.getItem("token")
    const u = localStorage.getItem("email")
    const n = localStorage.getItem("name")
    if (t && u) {
      setToken(t)
      setUser(u)
      setName(n)
    }
    setIsInitialized(true)
  }, [])

  const login = async (email: string, password: string) => {
    try {
      // Ganti URL berikut jika backend berjalan di port berbeda
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) return false
      const data = await res.json()
      localStorage.setItem("token", data.access_token)
      localStorage.setItem("email", email)
      localStorage.setItem("name", data.name || "")
      setToken(data.access_token)
      setUser(email)
      setName(data.name || "")
      router.push("/") // Redirect ke dashboard
      return true
    } catch (err) {
      console.error("Login error:", err)
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("email")
    localStorage.removeItem("name")
    setToken(null)
    setUser(null)
    setName(null)
    router.push("/login")
  }

  return (
    <AuthContext.Provider value={{ email, name, login, logout, token, isInitialized }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}