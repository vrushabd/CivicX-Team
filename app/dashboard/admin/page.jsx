"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { AlertCircle, CheckCircle, Clock, MapPin, Eye, LogOut, Leaf, Camera, Upload, Trash2, Map as MapIcon, Search } from "lucide-react"
import { uploadImage, updateReport, getReports, createNotification, deleteReport } from "@/lib/data-service"
import LocationAutocomplete from "@/components/map/LocationAutocomplete"
import nextDynamic from "next/dynamic"

const AdminMap = nextDynamic(() => import("@/components/map/AdminMap"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-slate-800 animate-pulse rounded-lg flex items-center justify-center text-slate-500">Loading Map...</div>
})

export default function AdminDashboard() {
  const [userEmail, setUserEmail] = useState("")
  const [reports, setReports] = useState([])
  const [selectedReport, setSelectedReport] = useState(null)

  // Completion state
  const [completionImage, setCompletionImage] = useState(null)
  const [completionImagePreview, setCompletionImagePreview] = useState(null)
  const [completionNotes, setCompletionNotes] = useState("")
  const [isSubmittingCompletion, setIsSubmittingCompletion] = useState(false)

  const [isLoadingReports, setIsLoadingReports] = useState(true)

  // Map state
  const [mapLocation, setMapLocation] = useState("")
  const [mapCoords, setMapCoords] = useState(null)
  const [selectedMapReport, setSelectedMapReport] = useState(null)

  const fileInputRef = useRef(null)
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

    // Load all reports from Firebase
    const loadReports = async () => {
      try {
        setIsLoadingReports(true)
        const allReports = await getReports()
        setReports(allReports)
      } catch (error) {
        console.error("Error loading reports:", error)
      } finally {
        setIsLoadingReports(false)
      }
    }

    loadReports()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("userRole")
    localStorage.removeItem("userEmail")
    router.push("/")
  }

  const handleApproveReport = async (reportId) => {
    try {
      await updateReport(reportId, { status: "approved" })
      const updatedReports = reports.map((report) =>
        report.id === reportId ? { ...report, status: "approved" } : report,
      )
      setReports(updatedReports)

      // Notify the user
      const report = reports.find((r) => r.id === reportId)
      if (report) {
        await createNotification({
          recipientEmail: report.userEmail,
          title: "Report Approved",
          message: `Your report "${report.title}" has been approved and is now in progress.`,
          type: "success",
        })
      }
    } catch (error) {
      console.error("Error approving report:", error)
      alert("Failed to approve report. Please try again.")
    }
  }

  const handleRejectReport = async (reportId) => {
    try {
      await updateReport(reportId, { status: "rejected" })
      const updatedReports = reports.map((report) =>
        report.id === reportId ? { ...report, status: "rejected" } : report,
      )
      setReports(updatedReports)

      // Notify the user
      const report = reports.find((r) => r.id === reportId)
      if (report) {
        await createNotification({
          recipientEmail: report.userEmail,
          title: "Report Rejected",
          message: `Your report "${report.title}" has been rejected.`,
          type: "error",
        })
      }
    } catch (error) {
      console.error("Error rejecting report:", error)
      alert("Failed to reject report. Please try again.")
    }
  }

  const handleDeleteReport = async (reportId) => {
    if (!confirm("Are you sure you want to delete this report? This action cannot be undone.")) return

    try {
      await deleteReport(reportId)
      const updatedReports = reports.filter((report) => report.id !== reportId)
      setReports(updatedReports)
      setSelectedReport(null) // Close dialog if open

      // Also clear map selection if simplified
      if (selectedMapReport && selectedMapReport.id === reportId) {
        setSelectedMapReport(null)
      }

      alert("Report deleted successfully")
    } catch (error) {
      console.error("Error deleting report:", error)
      alert("Failed to delete report. Please try again.")
    }
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Store the actual file for upload
    setCompletionImage(file)

    // Create preview URL for display
    const previewUrl = URL.createObjectURL(file)
    setCompletionImagePreview(previewUrl)
  }

  const handleCompleteReport = async (reportId) => {
    if (!completionImage) {
      alert("Please upload a completion photo")
      return
    }

    setIsSubmittingCompletion(true)

    try {
      // Upload image to Firebase Storage
      const imageUrl = await uploadImage(completionImage, "completions")

      // Create completion data
      const completionData = {
        status: "completed",
        completedAt: new Date().toISOString(),
        completionImage: imageUrl,
        completionNotes,
        completedBy: userEmail,
      }

      // Update report in Firestore
      await updateReport(reportId, completionData)

      // Update local state
      const updatedReports = reports.map((report) =>
        report.id === reportId ? { ...report, ...completionData } : report,
      )
      setReports(updatedReports)

      // Notify the user
      const report = reports.find((r) => r.id === reportId)
      if (report) {
        await createNotification({
          recipientEmail: report.userEmail,
          title: "Report Completed",
          message: `Your report "${report.title}" has been completed! Check the completion photo and notes.`,
          type: "success",
        })
      }

      // Reset form and clean up preview URL
      if (completionImagePreview) {
        URL.revokeObjectURL(completionImagePreview)
      }
      setCompletionImage(null)
      setCompletionImagePreview(null)
      setCompletionNotes("")
      setSelectedReport(null)

      alert("Report marked as completed successfully!")
    } catch (error) {
      console.error("Error completing report:", error)
      alert("Failed to complete report. Please try again.")
    } finally {
      setIsSubmittingCompletion(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
      case "approved":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20"
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

      <main className="container mx-auto px-4 py-8 h-[calc(100vh-100px)]">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          {/* Left Side: Map and Search */}
          <div className="lg:col-span-2 flex flex-col gap-4 h-full">
            <Card className="bg-slate-800 border-slate-700 flex-shrink-0">
              <CardContent className="p-4 flex gap-4 items-center">
                <div className="flex-1">
                  <LocationAutocomplete
                    value={mapLocation}
                    onChange={(val) => setMapLocation(val)}
                    onSelect={({ location, lat, lng }) => {
                      setMapLocation(location)
                      setMapCoords({ lat, lng })

                      // Auto-select logic: Find a report close to this location or matching the name
                      const matchingReport = reports.find(r =>
                        (r.coords && Math.abs(r.coords.lat - lat) < 0.001 && Math.abs(r.coords.lng - lng) < 0.001) ||
                        r.location.toLowerCase().includes(location.split(',')[0].toLowerCase())
                      )

                      if (matchingReport) {
                        setSelectedMapReport(matchingReport)
                      } else {
                        setSelectedMapReport(null)
                      }
                    }}
                    placeholder="Search location to find reports..."
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setMapLocation("")
                    setMapCoords(null)
                    setSelectedMapReport(null)
                  }}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Clear
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700 flex-grow overflow-hidden">
              <CardContent className="p-0 h-full">
                <AdminMap
                  reports={reports}
                  selectedLocationCoords={mapCoords}
                  onMarkerClick={(report) => {
                    setSelectedMapReport(report)
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Side: Report Details / Gallery for Selected Location */}
          <div className="h-full overflow-y-auto">
            <Card className="bg-slate-800 border-slate-700 h-full flex flex-col">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <MapIcon className="w-5 h-5 text-emerald-400" />
                  {selectedMapReport ? "Selected Report" : "Location Data"}
                </CardTitle>
                <CardDescription className="text-slate-400">
                  {selectedMapReport
                    ? "Details from the selected map pin"
                    : "Select a pin or search a location to see details"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow overflow-y-auto">
                {selectedMapReport ? (
                  <div className="space-y-6">
                    <div className="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
                      {selectedMapReport.video ? (
                        <video
                          src={selectedMapReport.video}
                          controls
                          className="w-full h-full object-contain"
                        />
                      ) : selectedMapReport.image ? (
                        <img
                          src={selectedMapReport.image}
                          alt="Report"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-slate-500">No media available</div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{selectedMapReport.title}</h3>
                        <div className="flex items-center gap-2 text-slate-400 text-sm mt-1">
                          <MapPin className="w-4 h-4" />
                          <span className="line-clamp-2">{selectedMapReport.location}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Badge className={getStatusColor(selectedMapReport.status)}>
                          {selectedMapReport.status}
                        </Badge>
                        <Badge variant="outline" className="text-slate-300 border-slate-600">
                          {selectedMapReport.type}
                        </Badge>
                      </div>

                      {selectedMapReport.description && selectedMapReport.description.trim() !== "No description provided" && (
                        <div className="bg-slate-700/50 p-3 rounded-lg border border-slate-700">
                          <p className="text-slate-300 text-sm">{selectedMapReport.description}</p>
                        </div>
                      )}

                      <div className="text-xs text-slate-500 pt-4 border-t border-slate-700">
                        Reported by {selectedMapReport.userEmail} <br />
                        on {new Date(selectedMapReport.createdAt).toLocaleDateString()}
                      </div>

                      <Button
                        className="w-full"
                        variant="secondary"
                        onClick={() => setSelectedReport(selectedMapReport)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Full Details / Manage
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8 text-center space-y-4">
                    <Search className="w-12 h-12 opacity-20" />
                    <p>Search for a location or click a marker on the map to view user-submitted data.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Hidden Dialog for Full Details handling (reused from original logic) */}
      <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
        <DialogContent className="max-w-2xl bg-slate-800 border-slate-600">
          <DialogHeader>
            <DialogTitle className="text-white">{selectedReport?.title}</DialogTitle>
            <DialogDescription className="text-slate-300">
              Report Details and Evidence
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
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
                {selectedReport.video && (
                  <div>
                    <h4 className="font-medium mb-2 text-white">Video Evidence</h4>
                    <video
                      src={selectedReport.video}
                      controls
                      className="w-full max-w-md h-64 object-contain rounded-lg border border-slate-600 bg-black"
                    />
                  </div>
                )}
                {selectedReport.completionImage && (
                  <div>
                    <h4 className="font-medium mb-2 text-white">Completion Photo</h4>
                    <img
                      src={selectedReport.completionImage || "/placeholder.svg"}
                      alt="Completion proof"
                      className="w-full max-w-md h-64 object-cover rounded-lg border border-slate-600"
                    />
                  </div>
                )}
                {selectedReport.completionNotes && (
                  <div>
                    <h4 className="font-medium mb-2 text-white">Completion Notes</h4>
                    <p className="text-slate-300">{selectedReport.completionNotes}</p>
                  </div>
                )}
                <div>
                  <h4 className="font-medium mb-2 text-white">Submitted</h4>
                  <p className="text-slate-300">{new Date(selectedReport.createdAt).toLocaleString()} by {selectedReport.userEmail}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-700">
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteReport(selectedReport.id)}
                  className="w-full gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Report
                </Button>
              </div>

              <div className="flex gap-2 pt-2">
                {selectedReport.status === "pending" && (
                  <>
                    <Button
                      onClick={() => handleApproveReport(selectedReport.id)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleRejectReport(selectedReport.id)}
                      className="flex-1"
                    >
                      Reject
                    </Button>
                  </>
                )}
                {selectedReport.status === "approved" && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
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
                            {completionImagePreview ? (
                              <div className="space-y-4">
                                <img
                                  src={completionImagePreview}
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
                          onClick={() => handleCompleteReport(selectedReport.id)}
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
