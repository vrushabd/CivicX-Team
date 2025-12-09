// Authentication service with localStorage fallback
import { SupabaseAuthService } from "./supabase-auth"


// Simple hash function for password storage (insecure, for demo only)
const simpleHash = (str) => {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = (hash << 5) - hash + char
        hash = hash & hash
    }
    return hash.toString(36)
}

// LocalStorage Authentication Service
const LocalAuthService = {
    async signUp(email, password, displayName) {
        // Check if user already exists
        const users = JSON.parse(localStorage.getItem("users") || "[]")
        const existingUser = users.find((u) => u.email === email)

        if (existingUser) {
            throw new Error("auth/email-already-in-use: Email already in use")
        }

        // Create new user
        const newUser = {
            uid: Date.now().toString(),
            email,
            displayName: displayName || email.split("@")[0],
            passwordHash: simpleHash(password),
            createdAt: new Date().toISOString(),
        }

        users.push(newUser)
        localStorage.setItem("users", JSON.stringify(users))

        // Set current user
        const { passwordHash, ...userWithoutPassword } = newUser
        localStorage.setItem("currentUser", JSON.stringify(userWithoutPassword))

        return { user: userWithoutPassword }
    },

    async signIn(email, password) {
        const users = JSON.parse(localStorage.getItem("users") || "[]")
        const user = users.find((u) => u.email === email && u.passwordHash === simpleHash(password))

        if (!user) {
            throw new Error("auth/invalid-credential: Invalid email or password")
        }

        // Set current user
        const { passwordHash, ...userWithoutPassword } = user
        localStorage.setItem("currentUser", JSON.stringify(userWithoutPassword))

        return { user: userWithoutPassword }
    },

    async signOut() {
        localStorage.removeItem("currentUser")
    },

    getCurrentUser() {
        const userStr = localStorage.getItem("currentUser")
        return userStr ? JSON.parse(userStr) : null
    },

    onAuthStateChanged(callback) {
        // Call immediately with current user
        callback(this.getCurrentUser())

        // Set up storage event listener for changes in other tabs
        const handleStorageChange = (e) => {
            if (e.key === "currentUser") {
                callback(this.getCurrentUser())
            }
        }

        window.addEventListener("storage", handleStorageChange)

        // Return unsubscribe function
        return () => window.removeEventListener("storage", handleStorageChange)
    },
}

// Supabase Authentication Service
const FirebaseAuthService = {
    async signUp(email, password, displayName) {
        // Dynamic import to avoid circular dependencies if any
        const { SupabaseAuthService } = await import("./supabase-auth")
        return await SupabaseAuthService.signUp(email, password)
    },

    async signIn(email, password) {
        const { SupabaseAuthService } = await import("./supabase-auth")
        return await SupabaseAuthService.signIn(email, password)
    },

    async signOut() {
        const { SupabaseAuthService } = await import("./supabase-auth")
        return await SupabaseAuthService.signOut()
    },

    getCurrentUser() {
        // This is a bit tricky since Supabase auth is async for some parts
        // But we can check local storage directly for synchronous check if needed
        // For now, we'll return null and let the async check handle it
        return null
    },

    onAuthStateChanged(callback) {
        let subscription = null

        import("./supabase-auth").then(({ SupabaseAuthService }) => {
            // Initial check
            SupabaseAuthService.getCurrentUser().then(user => {
                // Only callback if we have a user (or null) - prevents indeterminate state
                callback(user ? user.user : null)
            })

            // Set up listener
            import("./supabase").then(({ supabase }) => {
                const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
                    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                        // Refresh user data with role
                        SupabaseAuthService.getCurrentUser().then(user => {
                            callback(user ? user.user : null)
                        })
                    } else if (event === 'SIGNED_OUT') {
                        callback(null)
                    } else if (!session) {
                        callback(null)
                    }
                })
                subscription = data.subscription
            })
        })

        return () => {
            if (subscription) subscription.unsubscribe()
        }
    },
}

// Unified Authentication Service
export const authService = {
    async signUp(email, password, displayName) {
        try {
            return await FirebaseAuthService.signUp(email, password, displayName)
        } catch (error) {
            // Don't fallback if it's a real auth error from Supabase
            if (error.code === 'email_address_invalid' || error.message.includes('email')) {
                throw error
            }

            console.log("Using localStorage fallback for signUp")
            return await LocalAuthService.signUp(email, password, displayName)
        }
    },

    async signIn(email, password) {
        try {
            return await FirebaseAuthService.signIn(email, password)
        } catch (error) {
            // Don't fallback if it's a real auth error from Supabase
            if (error.code === 'email_not_confirmed' || error.message.includes('confirmed') || error.code === 'invalid_grant' || error.code === 'email_address_invalid' || error.code === 'invalid_credentials') {
                throw error
            }

            console.log("Using localStorage fallback for signIn")
            return await LocalAuthService.signIn(email, password)
        }
    },

    async signOut() {
        try {
            await FirebaseAuthService.signOut()
        } catch (error) {
            console.log("Using localStorage fallback for signOut")
            await LocalAuthService.signOut()
        }
    },

    getCurrentUser() {
        try {
            const firebaseUser = FirebaseAuthService.getCurrentUser()
            if (firebaseUser) return firebaseUser
        } catch (error) {
            // Fallback to localStorage
        }
        return LocalAuthService.getCurrentUser()
    },

    onAuthStateChanged(callback) {
        try {
            return FirebaseAuthService.onAuthStateChanged(callback)
        } catch (error) {
            console.log("Using localStorage fallback for onAuthStateChanged")
            return LocalAuthService.onAuthStateChanged(callback)
        }
    },
}

export default authService
