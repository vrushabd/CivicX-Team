"use client"

// Custom hook for managing reports with Firebase
import { useState, useEffect } from "react"
import { createReport, updateReport, subscribeToReports, uploadImage, createNotification } from "@/lib/firebase-service"

export const useFirebaseReports = (filters = {}) => {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let unsubscribe
    const setupSubscription = async () => {
      unsubscribe = await subscribeToReports((updatedReports) => {
        setReports(updatedReports)
        setLoading(false)
      }, filters)
    }

    setupSubscription()

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [JSON.stringify(filters)])

  const submitReport = async (reportData, imageFile) => {
    try {
      setLoading(true)
      let imageUrl = null

      // Upload image if provided
      if (imageFile) {
        const imagePath = `reports/${Date.now()}_${imageFile.name}`
        imageUrl = await uploadImage(imageFile, imagePath)
      }

      // Create report
      const reportId = await createReport({
        ...reportData,
        imageUrl,
        status: "pending",
      })

      // Create notification for admin
      await createNotification({
        type: "new_report",
        title: "New Report Submitted",
        message: `A new ${reportData.type} report has been submitted: ${reportData.title}`,
        recipientRole: "admin",
        reportId,
      })

      return reportId
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const approveReport = async (reportId) => {
    try {
      await updateReport(reportId, { status: "approved" })

      // Notify user
      const report = reports.find((r) => r.id === reportId)
      if (report) {
        await createNotification({
          type: "report_approved",
          title: "Report Approved",
          message: `Your report "${report.title}" has been approved and will be assigned to a worker soon.`,
          recipientEmail: report.userEmail,
          reportId,
        })
      }
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const assignWorker = async (reportId, workerId, workerName) => {
    try {
      await updateReport(reportId, {
        status: "assigned",
        assignedWorkerId: workerId,
        assignedWorker: workerName,
        assignedAt: new Date(),
      })

      // Notify user and worker
      const report = reports.find((r) => r.id === reportId)
      if (report) {
        await createNotification({
          type: "report_assigned",
          title: "Report Assigned",
          message: `Your report "${report.title}" has been assigned to ${workerName}.`,
          recipientEmail: report.userEmail,
          reportId,
        })

        await createNotification({
          type: "task_assigned",
          title: "New Task Assigned",
          message: `You have been assigned a new task: ${report.title}`,
          recipientRole: "worker",
          recipientId: workerId,
          reportId,
        })
      }
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const completeReport = async (reportId, completionData, completionImageFile) => {
    try {
      let completionImageUrl = null

      // Upload completion image
      if (completionImageFile) {
        const imagePath = `completions/${Date.now()}_${completionImageFile.name}`
        completionImageUrl = await uploadImage(completionImageFile, imagePath)
      }

      await updateReport(reportId, {
        status: "completed",
        completedAt: new Date(),
        completionImageUrl,
        completionNotes: completionData.notes,
        completedBy: completionData.workerEmail,
      })

      // Notify user
      const report = reports.find((r) => r.id === reportId)
      if (report) {
        await createNotification({
          type: "report_completed",
          title: "Report Completed",
          message: `Your report "${report.title}" has been completed. Thank you for helping improve our community!`,
          recipientEmail: report.userEmail,
          reportId,
        })
      }
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  return {
    reports,
    loading,
    error,
    submitReport,
    approveReport,
    assignWorker,
    completeReport,
  }
}
