// Firebase service with localStorage fallback
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"

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
    // For localStorage fallback, convert to base64
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target.result)
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
}

// Firebase service (when available)
const FirebaseService = {
  async createReport(reportData) {
    try {
      const { db } = await import("@/lib/firebase")
      const docRef = await addDoc(collection(db, "reports"), {
        ...reportData,
        createdAt: serverTimestamp(),
      })
      return docRef.id
    } catch (error) {
      console.error("Firebase createReport error:", error)
      throw error
    }
  },

  async updateReport(reportId, updates) {
    try {
      const { db } = await import("@/lib/firebase")
      const reportRef = doc(db, "reports", reportId)
      await updateDoc(reportRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      })
    } catch (error) {
      console.error("Firebase updateReport error:", error)
      throw error
    }
  },

  async getReports(filters = {}) {
    try {
      const { db } = await import("@/lib/firebase")
      let q = query(collection(db, "reports"), orderBy("createdAt", "desc"))

      // Apply filters
      if (filters.status) {
        q = query(q, where("status", "==", filters.status))
      }
      if (filters.type) {
        q = query(q, where("type", "==", filters.type))
      }
      if (filters.userEmail) {
        q = query(q, where("userEmail", "==", filters.userEmail))
      }

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      }))
    } catch (error) {
      console.error("Firebase getReports error:", error)
      throw error
    }
  },

  async subscribeToReports(callback, filters = {}) {
    try {
      const { db } = await import("@/lib/firebase")
      let q = query(collection(db, "reports"), orderBy("createdAt", "desc"))

      // Apply filters
      if (filters.status) {
        q = query(q, where("status", "==", filters.status))
      }
      if (filters.type) {
        q = query(q, where("type", "==", filters.type))
      }
      if (filters.userEmail) {
        q = query(q, where("userEmail", "==", filters.userEmail))
      }

      return onSnapshot(q, (querySnapshot) => {
        const reports = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        }))
        callback(reports)
      })
    } catch (error) {
      console.error("Firebase subscribeToReports error:", error)
      throw error
    }
  },

  async uploadImage(file, path) {
    try {
      const { storage } = await import("@/lib/firebase")
      const imageRef = ref(storage, `images/${path}/${Date.now()}_${file.name}`)
      const snapshot = await uploadBytes(imageRef, file)
      const downloadURL = await getDownloadURL(snapshot.ref)
      return downloadURL
    } catch (error) {
      console.error("Firebase uploadImage error:", error)
      throw error
    }
  },

  async createNotification(notificationData) {
    try {
      const { db } = await import("@/lib/firebase")
      const docRef = await addDoc(collection(db, "notifications"), {
        ...notificationData,
        createdAt: serverTimestamp(),
        read: false,
      })
      return docRef.id
    } catch (error) {
      console.error("Firebase createNotification error:", error)
      throw error
    }
  },

  async getNotifications(userEmail) {
    try {
      const { db } = await import("@/lib/firebase")
      const q = query(
        collection(db, "notifications"),
        where("recipientEmail", "==", userEmail),
        orderBy("createdAt", "desc"),
      )

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      }))
    } catch (error) {
      console.error("Firebase getNotifications error:", error)
      throw error
    }
  },

  async markNotificationAsRead(notificationId) {
    try {
      const { db } = await import("@/lib/firebase")
      const notificationRef = doc(db, "notifications", notificationId)
      await updateDoc(notificationRef, {
        read: true,
        readAt: serverTimestamp(),
      })
    } catch (error) {
      console.error("Firebase markNotificationAsRead error:", error)
      throw error
    }
  },
}

// Export unified service that automatically chooses Firebase or localStorage
export const createReport = async (reportData) => {
  try {
    // Try Firebase first
    return await FirebaseService.createReport(reportData)
  } catch (error) {
    console.log("Using localStorage fallback for createReport")
    return await LocalStorageService.createReport(reportData)
  }
}

export const updateReport = async (reportId, updates) => {
  try {
    return await FirebaseService.updateReport(reportId, updates)
  } catch (error) {
    console.log("Using localStorage fallback for updateReport")
    return await LocalStorageService.updateReport(reportId, updates)
  }
}

export const getReports = async (filters = {}) => {
  try {
    return await FirebaseService.getReports(filters)
  } catch (error) {
    console.log("Using localStorage fallback for getReports")
    return await LocalStorageService.getReports(filters)
  }
}

export const subscribeToReports = async (callback, filters = {}) => {
  try {
    return await FirebaseService.subscribeToReports(callback, filters)
  } catch (error) {
    console.log("Using localStorage fallback for subscribeToReports")
    return LocalStorageService.subscribeToReports(callback, filters)
  }
}

export const uploadImage = async (file, path) => {
  try {
    return await FirebaseService.uploadImage(file, path)
  } catch (error) {
    console.log("Using localStorage fallback for uploadImage")
    return await LocalStorageService.uploadImage(file, path)
  }
}

export const createNotification = async (notificationData) => {
  try {
    return await FirebaseService.createNotification(notificationData)
  } catch (error) {
    console.log("Using localStorage fallback for createNotification")
    return await LocalStorageService.createNotification(notificationData)
  }
}

export const getNotifications = async (userEmail) => {
  try {
    return await FirebaseService.getNotifications(userEmail)
  } catch (error) {
    console.log("Using localStorage fallback for getNotifications")
    return await LocalStorageService.getNotifications(userEmail)
  }
}

export const markNotificationAsRead = async (notificationId) => {
  try {
    return await FirebaseService.markNotificationAsRead(notificationId)
  } catch (error) {
    console.log("Using localStorage fallback for markNotificationAsRead")
    return await LocalStorageService.markNotificationAsRead(notificationId)
  }
}
