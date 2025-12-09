"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { NotificationSystem } from "@/components/notifications/notification-system"
import { ComplaintModal } from "@/components/complaint-modal"
import { Plus, MapPin, Clock, CheckCircle, AlertCircle, LogOut, Leaf } from "lucide-react"
import { getUserReports } from "@/lib/data-service"

export default function UserDashboard() {
  const [userEmail, setUserEmail] = useState("")
  const [reports, setReports] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (typeof window === "undefined") return

    const role = localStorage.getItem("userRole")
    const email = localStorage.getItem("userEmail")

    console.log("User Dashboard Auth Check:", { role, email })

    if (role !== "user") {
      console.warn("Invalid role for user dashboard, redirecting:", role)
      router.push("/")
      return
    }

    setUserEmail(email)

    // Load user's reports from Firebase
    const loadUserReports = async () => {
      try {
        setIsLoading(true)
        const userReports = await getUserReports(email)
        setReports(userReports)
      } catch (error) {
        console.error("Error loading user reports:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUserReports()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount - router dependency causes infinite re-renders

  const handleLogout = () => {
    localStorage.removeItem("userRole")
    localStorage.removeItem("userEmail")
    router.push("/")
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
      case "approved":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20"
      case "assigned":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20"
      case "in-progress":
        return "bg-orange-500/10 text-orange-600 border-orange-500/20"
      case "completed":
        return "bg-green-500/10 text-green-600 border-green-500/20"
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-500/20"
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4" />
      case "pending":
        return <Clock className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 overflow-x-hidden">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-900/80 backdrop-blur-md transition-all duration-300 supports-[backdrop-filter]:bg-slate-900/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 group cursor-pointer">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-300">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">CivicX</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Citizen Dashboard</h1>
              <p className="text-slate-400 text-xs hidden md:block">Welcome back, {userEmail ? userEmail.split('@')[0] : 'User'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-white">
            <NotificationSystem userEmail={userEmail} userRole="user" />
            <ComplaintModal userEmail={userEmail} />
            <Button
              variant="outline"
              onClick={handleLogout}
              className="gap-2 bg-white/5 border-white/10 text-slate-300 hover:bg-red-500/20 hover:text-red-200 hover:border-red-500/30 transition-all duration-300 active:scale-95"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500">
        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Your Reports</h2>
            <p className="text-slate-400 mt-1">Track the status of your civic issue reports</p>
          </div>
          <Link href="/report/new">
            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 hover:shadow-emerald-500/20 transition-all duration-300 hover:scale-105 active:scale-95 h-10 px-6">
              <Plus className="w-4 h-4" />
              New Report
            </Button>
          </Link>
        </div>

        {reports.length === 0 ? (
          <Card className="text-center py-16 bg-slate-800/40 border-white/5 border-dashed">
            <CardContent>
              <div className="mx-auto w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-500">
                <MapPin className="w-10 h-10 text-slate-500/50" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">No reports yet</h3>
              <p className="text-slate-400 mb-8 max-w-sm mx-auto">Start by reporting a civic issue in your area to help improve your community.</p>
              <Link href="/report/new">
                <Button className="bg-emerald-600 hover:bg-emerald-500 text-white h-11 px-8 shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:scale-105 active:scale-95">
                  Create Your First Report
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {reports.map((report, index) => (
              <Card
                key={report.id}
                className="hover:shadow-xl transition-all duration-300 bg-slate-800/40 border-white/5 hover:border-emerald-500/30 hover:bg-slate-800/60 group animate-in fade-in slide-in-from-bottom-4 flex flex-col"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1">{report.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-2 text-slate-400 line-clamp-1">
                        <MapPin className="w-4 h-4 text-emerald-500/70 shrink-0" />
                        {report.location}
                      </CardDescription>
                    </div>
                    <Badge className={`gap-1.5 px-3 py-1 ${getStatusColor(report.status)} transition-all duration-300 group-hover:scale-105 shrink-0`}>
                      {getStatusIcon(report.status)}
                      {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  {report.description && report.description !== "No description provided" && report.description.trim() !== "" && (
                    <p className="text-slate-300 mb-6 leading-relaxed bg-slate-900/30 p-4 rounded-lg border border-white/5 line-clamp-3">{report.description}</p>
                  )}
                  {report.image && (
                    <div className="mb-6 group-hover:opacity-100 transition-opacity mt-auto">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Evidence Photo</p>
                      <div className="overflow-hidden rounded-xl border border-white/10 group-hover:border-emerald-500/20 transition-colors">
                        <img
                          src={report.image || "/placeholder.svg"}
                          alt="Report evidence"
                          className="w-full h-auto object-contain hover:scale-105 transition-transform duration-700 max-h-96"
                        />
                      </div>
                    </div>
                  )}
                  {report.video && (
                    <div className="mb-6 mt-auto">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Evidence Video</p>
                      <div className="overflow-hidden rounded-xl border border-white/10 bg-black">
                        <video
                          src={report.video}
                          controls
                          className="w-full h-auto object-contain max-h-96"
                        />
                      </div>
                    </div>
                  )}
                  {report.status === 'completed' && report.completionImage && (
                    <div className="mb-4 p-5 bg-emerald-950/20 border border-emerald-500/20 rounded-xl animate-in fade-in zoom-in duration-500 mt-auto">
                      <p className="text-sm text-emerald-400 mb-3 font-semibold flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" /> Completion Verified
                      </p>
                      <div className="overflow-hidden rounded-lg border border-emerald-500/20 mb-3">
                        <img
                          src={report.completionImage}
                          alt="Completion evidence"
                          className="w-full h-auto object-contain hover:scale-105 transition-transform duration-500 max-h-96"
                        />
                      </div>
                      {report.completionNotes && (
                        <div className="text-sm text-slate-300 mt-3 pl-3 border-l-2 border-emerald-500/30 line-clamp-2">
                          <span className="font-medium text-emerald-400/80 block mb-1">Worker Notes:</span>
                          {report.completionNotes}
                        </div>
                      )}
                      {report.completedAt && (
                        <p className="text-xs text-emerald-500/50 mt-3 text-right">
                          Completed on {new Date(report.completedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm text-slate-500 mt-auto pt-6 border-t border-white/5">
                    <span className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      Reported on {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="capitalize border-slate-700 text-slate-400">{report.type} Issue</Badge>
                      <ComplaintModal userEmail={userEmail} report={report} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
