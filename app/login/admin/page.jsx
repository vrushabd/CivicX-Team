"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, ArrowLeft, AlertCircle, Leaf } from "lucide-react"
import { authService } from "@/lib/auth-service"

export default function AdminLogin() {
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

    if (!email.includes("@")) {
      setError("Please enter a valid email address")
      setIsLoading(false)
      return
    }

    try {
      // Try signing in with auth service
      const userCredential = await authService.signIn(email, password)
      const user = userCredential.user

      // For admin, check if user is in admin list or has admin email
      if (email.includes("admin")) {
        localStorage.setItem("userRole", "admin")
        localStorage.setItem("userEmail", user.email || email)
        localStorage.setItem("userName", user.displayName || "Admin")
        router.push("/dashboard/admin")
      } else {
        setError("This account does not have admin privileges")
      }
    } catch (err) {
      console.error("Admin login error:", err.message)

      // Demo login fallback
      if (email === "admin@civicx.com" && password === "admin123") {
        localStorage.setItem("userRole", "admin")
        localStorage.setItem("userEmail", email)
        localStorage.setItem("userName", "Demo Admin")
        router.push("/dashboard/admin")
      } else {
        setError(err.message || "Invalid credentials. Try admin@civicx.com / admin123 for demo access.")
      }
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black flex items-center justify-center p-4">
      <div className="absolute top-6 left-6 flex items-center gap-2 group cursor-pointer">
        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-300">
          <Leaf className="w-6 h-6 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">PickUpNow</span>
      </div>

      <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
        <Link href="/" className="inline-flex items-center text-slate-400 hover:text-white mb-8 transition-colors group">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>

        <Card className="bg-slate-900/40 backdrop-blur-xl border-white/10 shadow-2xl shadow-emerald-900/20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-50" />
          <CardHeader className="text-center relative z-10 pb-2">
            <div className="mx-auto w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mb-6 border border-white/5 shadow-inner">
              <Shield className="w-8 h-8 text-emerald-500" />
            </div>
            <CardTitle className="text-3xl font-bold text-white tracking-tight">Admin Login</CardTitle>
            <CardDescription className="text-slate-400 text-base">Manage civic reports and operations</CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 pt-6">
            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2 p-4 text-sm text-red-200 bg-red-900/20 border border-red-500/20 rounded-lg animate-in fade-in slide-in-from-top-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300 ml-1">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@civicx.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-950/50 border-white/10 text-white placeholder:text-slate-600 focus:border-emerald-500/50 focus:ring-emerald-500/20 h-11"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300 ml-1">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-950/50 border-white/10 text-white placeholder:text-slate-600 focus:border-emerald-500/50 focus:ring-emerald-500/20 h-11"
                  required
                />
              </div>
              <Button type="submit" className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 hover:shadow-emerald-500/20 transition-all duration-300 hover:scale-[1.02] mt-2 font-medium" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
            <div className="mt-6 p-4 bg-slate-950/30 rounded-xl border border-white/5">
              <p className="text-xs text-slate-400 text-center">
                <strong>Demo Access:</strong> <span className="text-emerald-400 select-all font-mono">admin@civicx.com</span> / <span className="text-emerald-400 select-all font-mono">admin123</span>
              </p>
            </div>
            <div className="mt-8 text-center">
              <p className="text-sm text-slate-500">
                Created by <span className="text-emerald-500 font-bold">PickUpNow</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
