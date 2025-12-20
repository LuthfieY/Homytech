"use client"

import { useState } from "react"
import { Eye, EyeOff, Home, Mail, Lock, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {}
    if (!email) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email address"
    }
    if (!password) {
      newErrors.password = "Password is required"
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    setIsLoading(true)
    try {
      const success = await login(email, password)
      if (!success) {
        alert("Login failed. Please check your credentials.")
      }
      // Jika sukses, akan redirect otomatis oleh context
    } catch {
      alert("Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#EAF0FA] via-[#F7F7F7] to-[#E8F4F8] p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#5887DA]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#6A9A6F]/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#4C7380]/5 rounded-full blur-3xl"></div>
      </div>
      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#5887DA] to-[#4C7380] rounded-2xl mb-4 shadow-lg">
            <Home className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[#404040] mb-2">Welcome Back</h1>
          <p className="text-[#6B7280]">Sign in to your Homytech account</p>
        </div>
        {/* Login Card */}
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold text-center text-[#404040]">Sign In</CardTitle>
            <CardDescription className="text-center text-[#6B7280]">
              Enter your credentials to access your smart home
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-[#404040]">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#6B7280]" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={cn(
                      "pl-10 h-12 border-2 transition-all duration-200 bg-white/50",
                      errors.email
                        ? "border-red-300 focus:border-red-500"
                        : "border-[#E2E8F0] focus:border-[#4C7380] hover:border-[#4C7380]/50",
                    )}
                  />
                </div>
                {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
              </div>
              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-[#404040]">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#6B7280]" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={cn(
                      "pl-10 pr-10 h-12 border-2 transition-all duration-200 bg-white/50",
                      errors.password
                        ? "border-red-300 focus:border-red-500"
                        : "border-[#E2E8F0] focus:border-[#4C7380] hover:border-[#4C7380]/50",
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#6B7280] hover:text-[#4C7380] transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password}</p>}
              </div>
              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-[#5887DA] to-[#4C7380] hover:from-[#4a75c4] hover:to-[#3a5a64] text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Sign In
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
