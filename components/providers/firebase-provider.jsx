// Firebase provider with proper error handling and fallback
"use client"

import { createContext, useContext, useEffect, useState } from "react"

const FirebaseContext = createContext({})

export function FirebaseProvider({ children }) {
  const [isFirebaseAvailable, setIsFirebaseAvailable] = useState(false)
  const [firebaseError, setFirebaseError] = useState(null)

  useEffect(() => {
    // Check if Firebase environment variables are available
    const hasFirebaseConfig =
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID

    if (!hasFirebaseConfig) {
      console.log("Firebase not configured - using localStorage fallback")
      setIsFirebaseAvailable(false)
      return
    }

    // Only initialize Firebase if config is available
    try {
      // Dynamic import to avoid errors when Firebase isn't configured
      import("@/lib/firebase")
        .then((firebase) => {
          setIsFirebaseAvailable(true)
          console.log("Firebase initialized successfully")
        })
        .catch((error) => {
          console.error("Firebase initialization failed:", error)
          setFirebaseError(error.message)
          setIsFirebaseAvailable(false)
        })
    } catch (error) {
      console.error("Firebase setup error:", error)
      setFirebaseError(error.message)
      setIsFirebaseAvailable(false)
    }
  }, [])

  const contextValue = {
    isFirebaseAvailable,
    firebaseError,
  }

  return <FirebaseContext.Provider value={contextValue}>{children}</FirebaseContext.Provider>
}

export function useFirebase() {
  const context = useContext(FirebaseContext)
  if (context === undefined) {
    throw new Error("useFirebase must be used within a FirebaseProvider")
  }
  return context
}
