"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NotificationSystem } from "@/components/notifications/notification-system"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { AlertCircle, CheckCircle, Clock, MapPin, Eye, LogOut, BarChart3, Filter, Leaf, Camera, Upload, Trash2, Map as MapIcon, Search, Plus } from "lucide-react"
import { uploadImage, updateReport, getReports, createNotification, deleteReport, getLocationReferences, addLocationReference } from "@/lib/data-service"
import LocationAutocomplete from "@/components/map/LocationAutocomplete"
import nextDynamic from "next/dynamic"
// import { getImageForLocation, LOCATION_IMAGES } from "@/lib/location-images" // Replaced by dynamic DB fetch

const AdminMap = nextDynamic(() => import("@/components/map/AdminMap"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-slate-800 animate-pulse rounded-lg flex items-center justify-center text-slate-500">Loading Map...</div>
})

export default function AdminDashboard() {
  const [userEmail, setUserEmail] = useState("")
  const [reports, setReports] = useState([])
  const [selectedReport, setSelectedReport] = useState(null)
  const [filterStatus, setFilterStatus] = useState("all")
  const [completionImage, setCompletionImage] = useState(null)
  const [completionImagePreview, setCompletionImagePreview] = useState(null)
  const [completionNotes, setCompletionNotes] = useState("")
  const [isSubmittingCompletion, setIsSubmittingCompletion] = useState(false)
  const [isLoadingReports, setIsLoadingReports] = useState(true)
  const [locationRefs, setLocationRefs] = useState([])

  // Add Location State
  const [isAddLocationOpen, setIsAddLocationOpen] = useState(false)
  const [newLocKey, setNewLocKey] = useState("")
  const [newLocFile, setNewLocFile] = useState(null)
  const [isUploadingLoc, setIsUploadingLoc] = useState(false)

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

    const loadLocationRefs = async () => {
      try {
        const refs = await getLocationReferences()
        setLocationRefs(refs)
      } catch (error) {
        console.error("Error loading location refs:", error)
      }
    }

    loadReports()
    loadLocationRefs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount - router dependency causes infinite re-renders

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
      let imageUrl = null
      if (completionImage) {
        imageUrl = await uploadImage(completionImage, `completion/${selectedReport.id}`)
      }

      const updates = {
        status: "resolved",
        completedBy: "Admin",
        completedAt: new Date().toISOString(),
        completionImage: imageUrl,
        completionNotes: completionNotes
      }

      await updateReport(selectedReport.id, updates)

      // Notify user
      await createNotification({
        type: "status_update",
        title: "Report Resolved",
        message: `Your report regarding "${selectedReport.title}" has been resolved.`,
        recipientEmail: selectedReport.userEmail,
        recipientRole: "user",
        reportId: selectedReport.id
      })

      // Update local state
      setReports(reports.map(r => r.id === selectedReport.id ? { ...r, ...updates } : r))
      setSelectedReport(null)

      // Reset form
      setCompletionImage(null)
      setCompletionImagePreview(null)
      setCompletionNotes("")
      alert("Report resolved successfully!")
    } catch (error) {
      console.error("Error resolving report:", error)
      alert("Failed to resolve report. Please try again.")
    } finally {
      setIsSubmittingCompletion(false)
    }
  }

  const handleLocationSubmit = async () => {
    if (!newLocKey || !newLocFile) {
      alert("Please provide both a location name and an image/video.")
      return
    }

    setIsUploadingLoc(true)
    try {
      // Upload file
      const path = `locations/${Date.now()}_${newLocFile.name}`
      const publicUrl = await uploadImage(newLocFile, path, "admin@civicx.com") // Use admin email or current user

      const isVideo = publicUrl.toLowerCase().endsWith('.mp4')

      await addLocationReference({
        key: newLocKey.toLowerCase().trim(),
        imageUrl: isVideo ? null : publicUrl,
        videoUrl: isVideo ? publicUrl : null
      })

      alert("Location added successfully!")
      setIsAddLocationOpen(false)
      setNewLocKey("")
      setNewLocFile(null)

      // Refresh list
      const refs = await getLocationReferences()
      setLocationRefs(refs)

    } catch (error) {
      console.error("Error adding location:", error)
      alert("Failed to add location. See console for details.")
    } finally {
      setIsUploadingLoc(false)
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

  const filteredReports = reports.filter((report) => {
    const statusMatch = filterStatus === "all" || report.status === filterStatus

    // Filter by map search location if active
    let locationMatch = true
    if (mapLocation && mapLocation.trim().length > 0) {
      locationMatch = report.location && report.location.toLowerCase().includes(mapLocation.toLowerCase())
    }

    return statusMatch && locationMatch
  })

  const stats = {
    total: reports.length,
    pending: reports.filter((r) => r.status === "pending").length,
    approved: reports.filter((r) => r.status === "approved").length,
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
          <TabsList className="grid w-full grid-cols-2 bg-slate-800 border-slate-700">
            <TabsTrigger
              value="reports"
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-300"
            >
              Reports Management
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-300"
            >
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm text-slate-400">Completed</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{stats.completed}</p>
                </CardContent>
              </Card>
            </div>

            {/* Map Search Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
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

                          // 1. Try to find an existing user report
                          const matchingReport = reports.find(r =>
                            (r.coords && Math.abs(r.coords.lat - lat) < 0.001 && Math.abs(r.coords.lng - lng) < 0.001) ||
                            r.location.toLowerCase().includes(location.split(',')[0].toLowerCase())
                          )

                          if (matchingReport) {
                            setSelectedMapReport(matchingReport)
                          } else {
                            // 2. If no report, check our dynamic location references
                            // Pass the FULL location string to allow partial matching against long addresses
                            console.log("Checking image for location:", location)

                            // Find best match from locationRefs
                            let bestMatch = null;
                            let maxLen = 0;
                            const normalizedSearch = location.toLowerCase();

                            locationRefs.forEach(ref => {
                              const key = ref.key.toLowerCase();
                              if (normalizedSearch.includes(key) || key.includes(normalizedSearch)) {
                                if (key.length > maxLen) {
                                  bestMatch = ref;
                                  maxLen = key.length;
                                }
                              }
                            });

                            if (bestMatch) {
                              // Create a mock report object for display
                              setSelectedMapReport({
                                id: 'mock-' + bestMatch.id,
                                title: "Historical Data / Reference",
                                location: location,
                                description: "This is a reference image/video for this location from our database.",
                                status: "reference",
                                type: "Reference",
                                userEmail: "system@civicx.com",
                                createdAt: new Date().toISOString(),
                                image: bestMatch.image,
                                video: bestMatch.video
                              })
                            } else {
                              setSelectedMapReport(null)
                            }
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

              {/* Selected Report Preview */}
              <div className="h-full overflow-y-auto">
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 space-y-4">
                  <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                      <MapIcon className="w-5 h-5 text-emerald-400" />
                      Live Incident Map
                    </h2>

                    {/* Add Location Data Button Removed as per request */}
                  </div>

                  <div className="relative z-10 w-full max-w-xl">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-20 pointer-events-none" />
                      <LocationAutocomplete
                        className="pl-10 w-full"
                        onSelect={({ location, lat, lng }) => {
                          setMapLocation(location)
                          setMapCoords({ lat, lng })

                          const matchingReport = reports.find(r =>
                            (r.coords && Math.abs(r.coords.lat - lat) < 0.001 && Math.abs(r.coords.lng - lng) < 0.001) ||
                            r.location.toLowerCase().includes(location.split(',')[0].toLowerCase())
                          )

                          if (matchingReport) {
                            setSelectedMapReport(matchingReport)
                          } else {
                            console.log("Checking image for location:", location)

                            let bestMatch = null;
                            let maxLen = 0;
                            const normalizedSearch = location.toLowerCase();

                            locationRefs.forEach(ref => {
                              const key = ref.key.toLowerCase();
                              if (normalizedSearch.includes(key) || key.includes(normalizedSearch)) {
                                if (key.length > maxLen) {
                                  bestMatch = ref;
                                  maxLen = key.length;
                                }
                              }
                            });

                            if (bestMatch) {
                              setSelectedMapReport({
                                id: 'mock-' + bestMatch.id,
                                title: "Historical Data / Reference",
                                location: location,
                                description: "This is a reference image/video for this location from our database.",
                                status: "reference",
                                type: "Reference",
                                userEmail: "system@civicx.com",
                                createdAt: new Date().toISOString(),
                                image: bestMatch.image,
                                video: bestMatch.video
                              })
                            } else {
                              setSelectedMapReport(null)
                            }
                          }
                        }}
                        placeholder="Search location to find reports..."
                        value={mapLocation}
                        onChange={(val) => setMapLocation(val)}
                      />
                    </div>
                  </div>
                </div>
                <Card className="bg-slate-800 border-slate-700 h-full flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <MapIcon className="w-5 h-5 text-emerald-400" />
                      {selectedMapReport ? "Selected Report" : "Map Details"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow overflow-y-auto">
                    {selectedMapReport ? (
                      <div className="space-y-4">
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
                            <div className="text-slate-500">No media</div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{selectedMapReport.title}</h3>
                          <div className="flex items-center gap-2 text-slate-400 text-sm mt-1">
                            <MapPin className="w-4 h-4" />
                            <span className="line-clamp-2">{selectedMapReport.location}</span>
                          </div>
                        </div>
                        <Button
                          className="w-full"
                          variant="secondary"
                          onClick={() => setSelectedReport(selectedMapReport)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Manage Report
                        </Button>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-500 p-4 text-center">
                        <Search className="w-8 h-8 opacity-20 mb-2" />
                        <p className="text-sm">Search or click a pin to view details.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
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
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
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
                    {report.description && report.description !== "No description provided" && report.description.trim() !== "" && (
                      <p className="text-slate-300 mb-4">{report.description}</p>
                    )}

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
                                    <p className="text-slate-300">
                                      {new Date(selectedReport.createdAt).toLocaleString()} by {selectedReport.userEmail}
                                    </p>
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

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteReport(report.id)}
                          className="text-slate-400 hover:text-red-400 hover:bg-red-900/20"
                          title="Delete Report"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>

                        {report.status === "approved" && (
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
                                  onClick={() => handleCompleteReport(report.id)}
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
                        {report.completedAt && <span>Completed: {new Date(report.completedAt).toLocaleString()}</span>}
                      </div>
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
                      <span className="text-slate-300">Completed</span>
                      <span className="font-medium text-white">{stats.completed}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Total Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-white">{stats.total}</div>
                  <p className="text-slate-300 mt-2">All garbage collection reports</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div >
  )
}
