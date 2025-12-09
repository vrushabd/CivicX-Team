// Supabase service with localStorage fallback
// Firebase imports removed - now using Supabase

// Fallback service using localStorage
const LocalStorageService = {
  async createReport(reportData) {
    const reports = JSON.parse(localStorage.getItem("allReports") || "[]")
    const newReport = {
      ...reportData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    }
    reports.push(newReport)
    localStorage.setItem("allReports", JSON.stringify(reports))

    // Also save to user's personal reports
    const userReports = JSON.parse(localStorage.getItem("userReports") || "[]")
    userReports.push(newReport)
    localStorage.setItem("userReports", JSON.stringify(userReports))

    return newReport.id
  },

  async updateReport(reportId, updates) {
    try {
      const reports = JSON.parse(localStorage.getItem("allReports") || "[]")
      const updatedReports = reports.map((report) =>
        report.id === reportId ? { ...report, ...updates, updatedAt: new Date().toISOString() } : report,
      )
      localStorage.setItem("allReports", JSON.stringify(updatedReports))

      // Update user reports too
      const userReports = JSON.parse(localStorage.getItem("userReports") || "[]")
      const updatedUserReports = userReports.map((report) =>
        report.id === reportId ? { ...report, ...updates, updatedAt: new Date().toISOString() } : report,
      )
      localStorage.setItem("userReports", JSON.stringify(updatedUserReports))
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.error("localStorage quota exceeded. Please clear some data.")
        throw new Error("Storage limit reached. Please try with a smaller image or clear browser data.")
      }
      throw error
    }
  },

  async getReports(filters = {}) {
    const reports = JSON.parse(localStorage.getItem("allReports") || "[]")

    return reports
      .filter((report) => {
        if (filters.status && report.status !== filters.status) return false
        if (filters.type && report.type !== filters.type) return false
        if (filters.userEmail && report.userEmail !== filters.userEmail) return false
        if (filters.assignedWorkerId && report.assignedWorkerId !== filters.assignedWorkerId) return false
        return true
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  },

  subscribeToReports(callback, filters = {}) {
    // For localStorage, we'll simulate real-time updates with polling
    const pollInterval = setInterval(() => {
      const reports = LocalStorageService.getReports(filters)
      callback(reports)
    }, 2000)

    // Return unsubscribe function
    return () => clearInterval(pollInterval)
  },

  async uploadImage(file, path) {
    // For localStorage fallback, compress image to reduce size
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        // If video, returns data URL directly without compression
        if (file.type.startsWith('video/')) {
          resolve(e.target.result)
          return
        }

        const img = new Image()
        img.onload = () => {
          // Create canvas for compression
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')

          // Resize to max 800px width/height while maintaining aspect ratio
          let width = img.width
          let height = img.height
          const maxSize = 800

          if (width > height && width > maxSize) {
            height = (height * maxSize) / width
            width = maxSize
          } else if (height > maxSize) {
            width = (width * maxSize) / height
            height = maxSize
          }

          canvas.width = width
          canvas.height = height
          ctx.drawImage(img, 0, 0, width, height)

          // Compress to 70% quality (reduces size significantly)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7)
          resolve(compressedDataUrl)
        }
        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = e.target.result
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  },

  async createNotification(notificationData) {
    const notifications = JSON.parse(localStorage.getItem("notifications") || "[]")
    const newNotification = {
      ...notificationData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      read: false,
    }
    notifications.unshift(newNotification)
    localStorage.setItem("notifications", JSON.stringify(notifications))
    return newNotification.id
  },

  async getNotifications(userEmail) {
    const notifications = JSON.parse(localStorage.getItem("notifications") || "[]")
    return notifications
      .filter((n) => n.recipientEmail === userEmail || n.recipientRole === localStorage.getItem("userRole"))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  },

  async markNotificationAsRead(notificationId) {
    const notifications = JSON.parse(localStorage.getItem("notifications") || "[]")
    const updatedNotifications = notifications.map((n) =>
      n.id === notificationId ? { ...n, read: true, readAt: new Date().toISOString() } : n,
    )
    localStorage.setItem("notifications", JSON.stringify(updatedNotifications))
  },

  async deleteReport(reportId) {
    const reports = JSON.parse(localStorage.getItem("allReports") || "[]")
    const updatedReports = reports.filter((r) => r.id !== reportId)
    localStorage.setItem("allReports", JSON.stringify(updatedReports))

    // Also remove from user reports
    const userReports = JSON.parse(localStorage.getItem("userReports") || "[]")
    const updatedUserReports = userReports.filter((r) => r.id !== reportId)
    localStorage.setItem("userReports", JSON.stringify(updatedUserReports))
  },
}

// Firebase service (when available)
// FirebaseService removed - now using Supabase
// All database operations go through Supabase with localStorage fallback

// Export unified service that automatically chooses Supabase or localStorage
export const createReport = async (reportData) => {
  try {
    // Import Supabase Database Service
    const { SupabaseDatabaseService } = await import('./supabase-db')

    // Try Supabase first
    return await SupabaseDatabaseService.createReport(reportData)
  } catch (error) {
    console.log("Using localStorage fallback for createReport:", error.message)
    return await LocalStorageService.createReport(reportData)
  }
}

export const updateReport = async (reportId, updates) => {
  try {
    // Import Supabase Database Service
    const { SupabaseDatabaseService } = await import('./supabase-db')

    return await SupabaseDatabaseService.updateReport(reportId, updates)
  } catch (error) {
    console.log("Using localStorage fallback for updateReport:", error.message)
    return await LocalStorageService.updateReport(reportId, updates)
  }
}

export const getReports = async (filters = {}) => {
  try {
    // Import Supabase Database Service
    const { SupabaseDatabaseService } = await import('./supabase-db')

    return await SupabaseDatabaseService.getReports(filters)
  } catch (error) {
    console.log("Using localStorage fallback for getReports:", error.message)
    return await LocalStorageService.getReports(filters)
  }
}

export const subscribeToReports = async (callback, filters = {}) => {
  try {
    const { SupabaseDatabaseService } = await import('./supabase-db')
    return SupabaseDatabaseService.subscribeToReports(callback, filters)
  } catch (error) {
    console.log("Using localStorage fallback for subscribeToReports", error)
    return LocalStorageService.subscribeToReports(callback, filters)
  }
}

export const uploadImage = async (file, path, userEmail = null) => {
  try {
    // Import Supabase Storage Service
    const { SupabaseStorageService } = await import('./supabase-storage')

    // Get user email from localStorage if not provided
    const email = userEmail || (typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null)

    if (!email) {
      console.warn('No user email found for upload, using fallback')
      throw new Error('User email required for upload')
    }

    console.log(`Uploading image to Supabase for user: ${email}, path: ${path}`)

    // Upload to Supabase Storage (no timeout needed - Supabase is reliable)
    const publicUrl = await SupabaseStorageService.uploadImage(file, email, path)

    console.log('Supabase upload successful:', publicUrl)
    return publicUrl

  } catch (error) {
    console.log("Supabase upload failed, using localStorage fallback:", error.message)
    return await LocalStorageService.uploadImage(file, path)
  }
}

export const createNotification = async (notificationData) => {
  try {
    const { SupabaseDatabaseService } = await import('./supabase-db')
    return await SupabaseDatabaseService.createNotification(notificationData)
  } catch (error) {
    console.log("Using localStorage fallback for createNotification:", error.message)
    return await LocalStorageService.createNotification(notificationData)
  }
}

export const getNotifications = async (userEmail, userRole) => {
  try {
    const { SupabaseDatabaseService } = await import('./supabase-db')
    return await SupabaseDatabaseService.getNotifications(userEmail, userRole)
  } catch (error) {
    console.log("Using localStorage fallback for getNotifications:", error.message)
    return await LocalStorageService.getNotifications(userEmail)
  }
}

export const markNotificationAsRead = async (notificationId) => {
  try {
    const { SupabaseDatabaseService } = await import('./supabase-db')
    return await SupabaseDatabaseService.markNotificationAsRead(notificationId)
  } catch (error) {
    console.log("Using localStorage fallback for markNotificationAsRead:", error.message)
    return await LocalStorageService.markNotificationAsRead(notificationId)
  }
}

// Get reports for a specific user
export const getUserReports = async (userEmail) => {
  try {
    const { SupabaseDatabaseService } = await import('./supabase-db')
    return await SupabaseDatabaseService.getUserReports(userEmail)
  } catch (error) {
    console.log("Using localStorage fallback for getUserReports:", error.message)
    // Fallback to localStorage
    const allReports = JSON.parse(localStorage.getItem("userReports") || "[]")
    return allReports.filter((r) => r.userEmail === userEmail)
  }
}

export const deleteReport = async (reportId) => {
  try {
    const { SupabaseDatabaseService } = await import('./supabase-db')
    return await SupabaseDatabaseService.deleteReport(reportId)
  } catch (error) {
    console.log("Using localStorage fallback for deleteReport:", error.message)
    return await LocalStorageService.deleteReport(reportId)
  }
}

export const getLocationReferences = async () => {
  try {
    const { SupabaseDatabaseService } = await import('./supabase-db')
    return await SupabaseDatabaseService.getLocationReferences()
  } catch (error) {
    console.log("Using localStorage fallback for getLocationReferences:", error.message)
    // Fallback to static list
    const { LOCATION_IMAGES } = await import('./location-images')
    return Object.entries(LOCATION_IMAGES).map(([key, url]) => {
      const isVideo = url.toLowerCase().endsWith('.mp4');
      return {
        id: 'local-' + key,
        key: key,
        image: isVideo ? null : url,
        video: isVideo ? url : null
      }
    })
  }
}

export const addLocationReference = async (data) => {
  try {
    const { SupabaseDatabaseService } = await import('./supabase-db')
    return await SupabaseDatabaseService.addLocationReference(data)
  } catch (error) {
    console.error("Error in addLocationReference:", error)
    throw error
  }
}
