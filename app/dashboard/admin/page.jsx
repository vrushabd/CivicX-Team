"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { NotificationSystem } from "@/components/notifications/notification-system"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { AlertCircle, CheckCircle, Clock, MapPin, Eye, UserCheck, LogOut, BarChart3, Filter, Leaf } from "lucide-react"

export default function AdminDashboard() {
  const [userEmail, setUserEmail] = useState("")
  const [reports, setReports] = useState([])
  const [workers, setWorkers] = useState([])
  const [selectedReport, setSelectedReport] = useState(null)
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterType, setFilterType] = useState("all")
  const router = useRouter()

  useEffect(() => {
    if (typeof window == undefined) return
    const role = localStorage.getItem("userRole")
    const email = localStorage.getItem("userEmail")

    if (role !== "admin") {
      router.push("/")
      return
    }

    setUserEmail(email)

    // Load all reports
    const allReports = JSON.parse(localStorage.getItem("allReports") || "[]")
    setReports(allReports)

    // Load workers (simulate worker data)
    const workerList = JSON.parse(
      localStorage.getItem("workers") ||
      JSON.stringify([
        { id: "1", name: "John", email: "ssr@city.gov", status: "available", assignedTasks: 2 },
        { id: "2", name: "Sarah", email: "abdh@city.gov", status: "busy", assignedTasks: 5 },
        { id: "3", name: "Mike", email: "kum@city.gov", status: "available", assignedTasks: 1 },
      ]),
    )
    setWorkers(workerList)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("userRole")
    localStorage.removeItem("userEmail")
    router.push("/")
  }

  const handleApproveReport = (reportId) => {
    const updatedReports = reports.map((report) =>
      report.id === reportId ? { ...report, status: "approved" } : report,
    )
    setReports(updatedReports)
    localStorage.setItem("allReports", JSON.stringify(updatedReports))
  }

  const handleRejectReport = (reportId) => {
    const updatedReports = reports.map((report) =>
      report.id === reportId ? { ...report, status: "rejected" } : report,
    )
    setReports(updatedReports)
    localStorage.setItem("allReports", JSON.stringify(updatedReports))
  }

  const handleAssignWorker = (reportId, workerId) => {
    const worker = workers.find((w) => w.id === workerId)
    const updatedReports = reports.map((report) =>
      report.id === reportId
        ? { ...report, status: "assigned", assignedWorker: worker.name, assignedWorkerId: workerId }
        : report,
    )
    setReports(updatedReports)
    localStorage.setItem("allReports", JSON.stringify(updatedReports))

    // Update worker's task count
    const updatedWorkers = workers.map((w) => (w.id === workerId ? { ...w, assignedTasks: w.assignedTasks + 1 } : w))
    setWorkers(updatedWorkers)
    localStorage.setItem("workers", JSON.stringify(updatedWorkers))
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
      case "rejected":
        return "bg-red-500/10 text-red-600 border-red-500/20"
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
      case "assigned":
        return <UserCheck className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const filteredReports = reports.filter((report) => {
    const statusMatch = filterStatus === "all" || report.status === filterStatus
    const typeMatch = filterType === "all" || report.type === filterType
    return statusMatch && typeMatch
  })

  const stats = {
    total: reports.length,
    pending: reports.filter((r) => r.status === "pending").length,
    approved: reports.filter((r) => r.status === "approved").length,
    assigned: reports.filter((r) => r.status === "assigned").length,
    completed: reports.filter((r) => r.status === "completed").length,
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="border-b border-slate-700 bg-slate-800/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-slate-300">CivicX</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-slate-300">Municipal Services Management</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-white">
            <NotificationSystem userEmail={userEmail} userRole="admin" />
            <Button
              variant="outline"
              onClick={handleLogout}
              className="gap-2 bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="reports" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800 border-slate-700">
            <TabsTrigger
              value="reports"
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-300"
            >
              Reports Management
            </TabsTrigger>
            <TabsTrigger
              value="workers"
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-300"
            >
              Worker Management
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-300"
            >
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-400">Total</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm text-slate-400">Pending</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{stats.pending}</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-slate-400">Approved</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{stats.approved}</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-slate-400">Assigned</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{stats.assigned}</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm text-slate-400">Completed</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{stats.completed}</p>
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-400">Filters:</span>
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40 bg-slate-800 border-slate-600 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600 text-white">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40 bg-slate-800 border-slate-600 text-white">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600 text-white">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="pothole">Pothole</SelectItem>
                  <SelectItem value="garbage">Garbage</SelectItem>
                  <SelectItem value="streetlight">Street Light</SelectItem>

                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4">
              {filteredReports.map((report) => (
                <Card key={report.id} className="hover:shadow-md transition-shadow bg-slate-800 border-slate-700">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg text-white">{report.title}</CardTitle>
                        <CardDescription className="flex items-center gap-4 mt-2 text-slate-300">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {report.location}
                          </span>
                          <span className="capitalize">{report.type} Issue</span>
                          <span>by {report.userEmail}</span>
                        </CardDescription>
                      </div>
                      <Badge className={`gap-1 ${getStatusColor(report.status)}`}>
                        {getStatusIcon(report.status)}
                        {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-300 mb-4">{report.description}</p>

                    {report.aiValidation && (
                      <div className="mb-4 p-3 bg-slate-700 rounded-lg border border-slate-600">
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className={`w-2 h-2 rounded-full ${report.aiValidation.isValid ? "bg-emerald-400" : "bg-red-400"
                              }`}
                          ></div>
                          <span className="text-sm font-medium text-white">
                            AI Validation: {report.aiValidation.isValid ? "Valid" : "Invalid"} (
                            {report.aiValidation.confidence}% confidence)
                          </span>
                        </div>
                        <p className="text-sm text-slate-300">{report.aiValidation.message}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2 bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                              onClick={() => setSelectedReport(report)}
                            >
                              <Eye className="w-4 h-4" />
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl bg-slate-800 border-slate-600">
                            <DialogHeader>
                              <DialogTitle className="text-white">{selectedReport?.title}</DialogTitle>
                              <DialogDescription className="text-slate-300">
                                Report Details and Evidence
                              </DialogDescription>
                            </DialogHeader>
                            {selectedReport && (
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-medium mb-2 text-white">Description</h4>
                                  <p className="text-slate-300">{selectedReport.description}</p>
                                </div>
                                <div>
                                  <h4 className="font-medium mb-2 text-white">Location</h4>
                                  <p className="text-slate-300">{selectedReport.location}</p>
                                </div>
                                {selectedReport.image && (
                                  <div>
                                    <h4 className="font-medium mb-2 text-white">Photo Evidence</h4>
                                    <img
                                      src={selectedReport.image || "/placeholder.svg"}
                                      alt="Report evidence"
                                      className="w-full max-w-md h-64 object-cover rounded-lg border border-slate-600"
                                    />
                                  </div>
                                )}
                                <div>
                                  <h4 className="font-medium mb-2 text-white">Submitted</h4>
                                  <p className="text-slate-300">
                                    {new Date(selectedReport.createdAt).toLocaleString()} by {selectedReport.userEmail}
                                  </p>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        {report.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleApproveReport(report.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              Approve
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleRejectReport(report.id)}>
                              Reject
                            </Button>
                          </>
                        )}

                        {report.status === "approved" && (
                          <Select onValueChange={(workerId) => handleAssignWorker(report.id, workerId)}>
                            <SelectTrigger className="w-40 bg-slate-700 border-slate-600 text-white">
                              <SelectValue placeholder="Assign Worker" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-600">
                              {workers
                                .filter((w) => w.status === "available")
                                .map((worker) => (
                                  <SelectItem key={worker.id} value={worker.id}>
                                    {worker.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>

                      <div className="text-sm text-slate-400">
                        {report.assignedWorker && <span>Assigned to: {report.assignedWorker}</span>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="workers" className="space-y-6">
            <div className="grid gap-4">
              {workers.map((worker) => (
                <Card key={worker.id} className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-white">{worker.name}</CardTitle>
                        <CardDescription className="text-slate-300">{worker.email}</CardDescription>
                      </div>
                      <Badge
                        className={
                          worker.status === "available"
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/20"
                            : "bg-orange-500/20 text-orange-400 border-orange-500/20"
                        }
                      >
                        {worker.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Assigned Tasks: {worker.assignedTasks}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                      >
                        View Tasks
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Report Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Pending</span>
                      <span className="font-medium text-white">{stats.pending}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Approved</span>
                      <span className="font-medium text-white">{stats.approved}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Assigned</span>
                      <span className="font-medium text-white">{stats.assigned}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Completed</span>
                      <span className="font-medium text-white">{stats.completed}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Issue Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {["pothole", "garbage", "streetlight", "sidewalk", "other"].map((type) => {
                      const count = reports.filter((r) => r.type === type).length
                      return (
                        <div key={type} className="flex items-center justify-between">
                          <span className="capitalize text-slate-300">{type}</span>
                          <span className="font-medium text-white">{count}</span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
