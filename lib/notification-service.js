// Enhanced notification service with localStorage fallback
export const NotificationService = {
  // Create notification (localStorage fallback)
  createNotification: (notification) => {
    const notifications = JSON.parse(localStorage.getItem("notifications") || "[]")
    const newNotification = {
      id: Date.now().toString(),
      ...notification,
      createdAt: new Date().toISOString(),
      read: false,
    }
    notifications.unshift(newNotification)
    localStorage.setItem("notifications", JSON.stringify(notifications))
    return newNotification.id
  },

  // Get notifications for user
  getNotifications: (userEmail, userRole) => {
    const notifications = JSON.parse(localStorage.getItem("notifications") || "[]")
    return notifications.filter((n) => n.recipientEmail === userEmail || n.recipientRole === userRole)
  },

  // Mark notification as read
  markAsRead: (notificationId) => {
    const notifications = JSON.parse(localStorage.getItem("notifications") || "[]")
    const updatedNotifications = notifications.map((n) =>
      n.id === notificationId ? { ...n, read: true, readAt: new Date().toISOString() } : n,
    )
    localStorage.setItem("notifications", JSON.stringify(updatedNotifications))
  },

  // Send notification when report is submitted
  notifyReportSubmitted: (report) => {
    NotificationService.createNotification({
      type: "new_report",
      title: "New Report Submitted",
      message: `A new ${report.type} report has been submitted: ${report.title}`,
      recipientRole: "admin",
      reportId: report.id,
    })
  },

  // Send notification when report is approved
  notifyReportApproved: (report) => {
    NotificationService.createNotification({
      type: "report_approved",
      title: "Report Approved",
      message: `Your report "${report.title}" has been approved and will be assigned to a worker soon.`,
      recipientEmail: report.userEmail,
      reportId: report.id,
    })
  },

  // Send notification when report is assigned
  notifyReportAssigned: (report, workerName) => {
    // Notify user
    NotificationService.createNotification({
      type: "report_assigned",
      title: "Report Assigned",
      message: `Your report "${report.title}" has been assigned to ${workerName}.`,
      recipientEmail: report.userEmail,
      reportId: report.id,
    })

    // Notify worker
    NotificationService.createNotification({
      type: "task_assigned",
      title: "New Task Assigned",
      message: `You have been assigned a new task: ${report.title}`,
      recipientRole: "worker",
      reportId: report.id,
    })
  },

  // Send notification when report is completed
  notifyReportCompleted: (report) => {
    NotificationService.createNotification({
      type: "report_completed",
      title: "Report Completed",
      message: `Your report "${report.title}" has been completed. Thank you for helping improve our community!`,
      recipientEmail: report.userEmail,
      reportId: report.id,
    })
  },

  // Send notification when worker starts task
  notifyTaskStarted: (report) => {
    NotificationService.createNotification({
      type: "task_started",
      title: "Work Started",
      message: `Work has started on your report: ${report.title}`,
      recipientEmail: report.userEmail,
      reportId: report.id,
    })
  },
}
