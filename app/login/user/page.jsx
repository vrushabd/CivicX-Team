"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Users, ArrowLeft, AlertCircle, Leaf } from "lucide-react"
import { authService } from "@/lib/auth-service"

export default function UserLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (!email || !password) {
      setError("Please enter both email and password")
      setIsLoading(false)
      return
    }

    try {
      const userCredential = await authService.signIn(email, password)
      const user = userCredential.user

      localStorage.setItem("userRole", "user")
      localStorage.setItem("userEmail", user.email || email)
      localStorage.setItem("userName", user.displayName || "User")

      router.push("/dashboard/user")
    } catch (err) {
      console.error("Login error:", err.message)

      // Demo login fallback
      if (email === "user@civicx.com" && password === "civix123") {
        localStorage.setItem("userRole", "user")
        localStorage.setItem("userEmail", email)
        localStorage.setItem("userName", "Demo User")
        router.push("/dashboard/user")
      } else {
        setError(err.message || "Invalid credentials. Try user@civicx.com / civix123 for demo access.")
      }
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="absolute top-6 left-6 flex items-center gap-2">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <Leaf className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="text-lg font-semibold text-white">PickUpNow</span>
      </div>

      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-white mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>

        <Card className="bg-[#1A2B3B] border-border/50 shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-2xl text-white">Citizen Login</CardTitle>
            <CardDescription className="text-gray-300">Sign in to report civic issues in your community</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md dark:text-red-400 dark:bg-red-950 dark:border-red-800">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
              <div className="space-y-2 text-white">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>

              {/* ✅ Sign Up link added here */}
              <p className="text-sm text-center text-white mt-3">
                Don’t have an account?{" "}
                <Link href="/register/user" className="text-primary hover:underline">
                  Sign Up
                </Link>
              </p>
            </form>

            <div className="mt-4 p-3 bg-muted rounded-md">
              <p className="text-xs text-muted-foreground text-center">
                <strong>Demo Login:</strong> user@civicx.com / civix123
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-border text-center">
              <p style={{ marginTop: "15px", color: "white", textAlign: "center" }}>
                Created by <span style={{ color: "limegreen", fontWeight: "bold" }}>PickUpNow</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
