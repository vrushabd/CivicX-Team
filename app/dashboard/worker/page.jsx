"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { NotificationSystem } from "@/components/notifications/notification-system"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertCircle,
  CheckCircle,
  Clock,
  MapPin,
  Eye,
  Camera,
  Upload,
  LogOut,
  PlayCircle,
  CheckCircle2,
  Leaf,
} from "lucide-react"

export default function WorkerDashboard() {
  const [userEmail, setUserEmail] = useState("")
  const [assignedTasks, setAssignedTasks] = useState([])
  const [completedTasks, setCompletedTasks] = useState([])
  const [selectedTask, setSelectedTask] = useState(null)
  const [completionImage, setCompletionImage] = useState(null)
  const [completionNotes, setCompletionNotes] = useState("")
  const [isSubmittingCompletion, setIsSubmittingCompletion] = useState(false)
  const fileInputRef = useRef(null)
  const router = useRouter()

  useEffect(() => {
    if (typeof window == undefined) return
    const role = localStorage.getItem("userRole")
    const email = localStorage.getItem("userEmail")

    if (role !== "worker") {
      router.push("/")
      return
    }

    setUserEmail(email)

    // Load assigned tasks for this worker
    const allReports = JSON.parse(localStorage.getItem("allReports") || "[]")
    const workerTasks = allReports.filter((report) => report.status === "assigned" || report.status === "in-progress")
    const completed = allReports.filter((report) => report.status === "completed")

    setAssignedTasks(workerTasks)
    setCompletedTasks(completed)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("userRole")
    localStorage.removeItem("userEmail")
    router.push("/")
  }

  const handleStartTask = (taskId) => {
    const updatedTasks = assignedTasks.map((task) =>
      task.id === taskId ? { ...task, status: "in-progress", startedAt: new Date().toISOString() } : task,
    )
    setAssignedTasks(updatedTasks)

    // Update in global storage
    const allReports = JSON.parse(localStorage.getItem("allReports") || "[]")
    const updatedReports = allReports.map((report) =>
      report.id === taskId ? { ...report, status: "in-progress", startedAt: new Date().toISOString() } : report,
    )
    localStorage.setItem("allReports", JSON.stringify(updatedReports))
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      setCompletionImage(e.target.result)
    }
    reader.readAsDataURL(file)
  }

  const handleCompleteTask = async (taskId) => {
    if (!completionImage) {
      alert("Please upload a completion photo")
      return
    }

    setIsSubmittingCompletion(true)

    // Create completion record
    const completionData = {
      completedAt: new Date().toISOString(),
      completionImage,
      completionNotes,
      workerEmail: userEmail,
    }

    // Update task status
    const updatedTasks = assignedTasks.filter((task) => task.id !== taskId)
    setAssignedTasks(updatedTasks)

    // Move to completed tasks
    const completedTask = assignedTasks.find((task) => task.id === taskId)
    if (completedTask) {
      const updatedCompletedTask = {
        ...completedTask,
        status: "completed",
        ...completionData,
      }
      setCompletedTasks((prev) => [updatedCompletedTask, ...prev])

      // Update global storage
      const allReports = JSON.parse(localStorage.getItem("allReports") || "[]")
      const updatedReports = allReports.map((report) =>
        report.id === taskId ? { ...report, status: "completed", ...completionData } : report,
      )
      localStorage.setItem("allReports", JSON.stringify(updatedReports))

      // Update user's reports if they exist
      const userReports = JSON.parse(localStorage.getItem("userReports") || "[]")
      const updatedUserReports = userReports.map((report) =>
        report.id === taskId ? { ...report, status: "completed", ...completionData } : report,
      )
      localStorage.setItem("userReports", JSON.stringify(updatedUserReports))
    }

    // Reset form
    setCompletionImage(null)
    setCompletionNotes("")
    setSelectedTask(null)
    setIsSubmittingCompletion(false)
  }

  const getStatusColor = (status) => {
    switch (status) {
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
      case "in-progress":
        return <PlayCircle className="w-4 h-4" />
      case "assigned":
        return <Clock className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
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
              <h1 className="text-xl font-bold text-white">Worker Dashboard</h1>
              <p className="text-slate-300">Welcome back, {userEmail}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-white">
            <NotificationSystem userEmail={userEmail} userRole="worker" />
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
        <Tabs defaultValue="assigned" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800 border-slate-700">
            <TabsTrigger
              value="assigned"
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-300"
            >
              Assigned Tasks ({assignedTasks.length})
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-300"
            >
              Completed Tasks ({completedTasks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assigned" className="space-y-6">
            {assignedTasks.length === 0 ? (
              <Card className="text-center py-12 bg-slate-800 border-slate-700">
                <CardContent>
                  <div className="mx-auto w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-white">No assigned tasks</h3>
                  <p className="text-slate-300">All caught up! New tasks will appear here when assigned.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {assignedTasks.map((task) => (
                  <Card key={task.id} className="hover:shadow-md transition-shadow bg-slate-800 border-slate-700">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg text-white">{task.title}</CardTitle>
                          <CardDescription className="flex items-center gap-4 mt-2 text-slate-300">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {task.location}
                            </span>
                            <span className="capitalize">{task.type} Issue</span>
                            <span>Reported by {task.userEmail}</span>
                          </CardDescription>
                        </div>
                        <Badge className={`gap-1 ${getStatusColor(task.status)}`}>
                          {getStatusIcon(task.status)}
                          {task.status === "in-progress" ? "In Progress" : "Assigned"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-300 mb-4">{task.description}</p>

                      {task.image && (
                        <div className="mb-4">
                          <h4 className="font-medium mb-2 text-white">Issue Photo</h4>
                          <img
                            src={task.image || "/placeholder.svg"}
                            alt="Issue evidence"
                            className="w-full max-w-md h-48 object-cover rounded-lg border border-slate-600"
                          />
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
                                onClick={() => setSelectedTask(task)}
                              >
                                <Eye className="w-4 h-4" />
                                View Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl bg-slate-800 border-slate-600">
                              <DialogHeader>
                                <DialogTitle className="text-white">{selectedTask?.title}</DialogTitle>
                                <DialogDescription className="text-slate-300">
                                  Task Details and Instructions
                                </DialogDescription>
                              </DialogHeader>
                              {selectedTask && (
                                <div className="space-y-4">
                                  <div>
                                    <h4 className="font-medium mb-2 text-white">Description</h4>
                                    <p className="text-slate-300">{selectedTask.description}</p>
                                  </div>
                                  <div>
                                    <h4 className="font-medium mb-2 text-white">Location</h4>
                                    <p className="text-slate-300">{selectedTask.location}</p>
                                  </div>
                                  <div>
                                    <h4 className="font-medium mb-2 text-white">Issue Type</h4>
                                    <p className="text-slate-300 capitalize">{selectedTask.type}</p>
                                  </div>
                                  {selectedTask.image && (
                                    <div>
                                      <h4 className="font-medium mb-2 text-white">Issue Photo</h4>
                                      <img
                                        src={selectedTask.image || "/placeholder.svg"}
                                        alt="Issue evidence"
                                        className="w-full max-w-md h-64 object-cover rounded-lg border border-slate-600"
                                      />
                                    </div>
                                  )}
                                  <div>
                                    <h4 className="font-medium mb-2 text-white">Reported</h4>
                                    <p className="text-slate-300">
                                      {new Date(selectedTask.createdAt).toLocaleString()} by {selectedTask.userEmail}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>

                          {task.status === "assigned" && (
                            <Button
                              size="sm"
                              onClick={() => handleStartTask(task.id)}
                              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              <PlayCircle className="w-4 h-4" />
                              Start Task
                            </Button>
                          )}

                          {task.status === "in-progress" && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                                  <CheckCircle className="w-4 h-4" />
                                  Mark Complete
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="bg-slate-800 border-slate-600">
                                <DialogHeader>
                                  <DialogTitle className="text-white">Complete Task</DialogTitle>
                                  <DialogDescription className="text-slate-300">
                                    Upload a photo showing the completed work and add any notes.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <Label className="text-white">Completion Photo *</Label>
                                    <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center bg-slate-700/50">
                                      {completionImage ? (
                                        <div className="space-y-4">
                                          <img
                                            src={completionImage || "/placeholder.svg"}
                                            alt="Completion proof"
                                            className="max-w-full h-48 object-cover rounded-lg mx-auto"
                                          />
                                          <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                                          >
                                            Change Photo
                                          </Button>
                                        </div>
                                      ) : (
                                        <div className="space-y-4">
                                          <Camera className="w-12 h-12 text-slate-400 mx-auto" />
                                          <div>
                                            <p className="text-slate-300 mb-2">
                                              Upload a photo showing the completed work
                                            </p>
                                            <Button
                                              type="button"
                                              variant="outline"
                                              onClick={() => fileInputRef.current?.click()}
                                              className="gap-2 bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                                            >
                                              <Upload className="w-4 h-4" />
                                              Choose Photo
                                            </Button>
                                          </div>
                                        </div>
                                      )}
                                      <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                      />
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor="notes" className="text-white">
                                      Completion Notes
                                    </Label>
                                    <Textarea
                                      id="notes"
                                      placeholder="Add any notes about the work completed..."
                                      value={completionNotes}
                                      onChange={(e) => setCompletionNotes(e.target.value)}
                                      rows={3}
                                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                                    />
                                  </div>

                                  <Button
                                    onClick={() => handleCompleteTask(task.id)}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                                    disabled={!completionImage || isSubmittingCompletion}
                                  >
                                    {isSubmittingCompletion ? "Submitting..." : "Submit Completion"}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>

                        <div className="text-sm text-slate-400">
                          {task.startedAt && <span>Started: {new Date(task.startedAt).toLocaleString()}</span>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-6">
            {completedTasks.length === 0 ? (
              <Card className="text-center py-12 bg-slate-800 border-slate-700">
                <CardContent>
                  <div className="mx-auto w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-white">No completed tasks yet</h3>
                  <p className="text-slate-300">Completed tasks will appear here for your records.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {completedTasks.map((task) => (
                  <Card key={task.id} className="hover:shadow-md transition-shadow bg-slate-800 border-slate-700">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg text-white">{task.title}</CardTitle>
                          <CardDescription className="flex items-center gap-4 mt-2 text-slate-300">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {task.location}
                            </span>
                            <span className="capitalize">{task.type} Issue</span>
                          </CardDescription>
                        </div>
                        <Badge className={`gap-1 ${getStatusColor(task.status)}`}>
                          {getStatusIcon(task.status)}
                          Completed
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-300 mb-4">{task.description}</p>

                      {task.completionImage && (
                        <div className="mb-4">
                          <h4 className="font-medium mb-2 text-white">Completion Photo</h4>
                          <img
                            src={task.completionImage || "/placeholder.svg"}
                            alt="Completion proof"
                            className="w-full max-w-md h-48 object-cover rounded-lg border border-slate-600"
                          />
                        </div>
                      )}

                      {task.completionNotes && (
                        <div className="mb-4">
                          <h4 className="font-medium mb-2 text-white">Completion Notes</h4>
                          <p className="text-slate-300">{task.completionNotes}</p>
                        </div>
                      )}

                      <div className="text-sm text-slate-400">
                        <span>Completed: {new Date(task.completedAt).toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
