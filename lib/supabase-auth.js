// Supabase Authentication Service for CivicX
import { supabase } from './supabase'

export const SupabaseAuthService = {
    /**
     * Sign up a new user
     * @param {string} email - User's email
     * @param {string} password - User's password
     * @param {string} role - User role ('user' or 'admin')
     * @returns {Promise<Object>} - User object
     */
    async signUp(email, password, role = 'user') {
        try {
            // Create auth user in Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
            })

            if (authError) throw authError

            // Create user record in users table with role
            const { error: dbError } = await supabase
                .from('users')
                .insert([{
                    email,
                    role,
                }])

            if (dbError) {
                console.warn('Could not create user record:', dbError)
                // Don't fail signup if user record creation fails
            }

            console.log('User signed up successfully:', email)
            return authData.user
        } catch (error) {
            console.error('Error signing up:', error)
            throw error
        }
    },

    /**
     * Sign in an existing user
     * @param {string} email - User's email
     * @param {string} password - User's password
     * @returns {Promise<Object>} - User object with role
     */
    async signIn(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) throw error

            // Get user role from users table
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('role')
                .eq('email', email)
                .single()

            if (userError) {
                console.warn('Could not fetch user role:', userError)
            }

            console.log('User signed in successfully:', email)
            return {
                user: data.user,
                role: userData?.role || 'user',
            }
        } catch (error) {
            console.error('Error signing in:', error)
            throw error
        }
    },

    /**
     * Sign out current user
     */
    async signOut() {
        try {
            const { error } = await supabase.auth.signOut()
            if (error) throw error

            console.log('User signed out successfully')
        } catch (error) {
            console.error('Error signing out:', error)
            throw error
        }
    },

    /**
     * Get current authenticated user
     * @returns {Promise<Object>} - Current user with role
     */
    async getCurrentUser() {
        try {
            // Use getSession first as it retrieves from local storage explicitly
            // This prevents "logout" on refresh if network is slow
            const { data: { session }, error: sessionError } = await supabase.auth.getSession()

            if (sessionError) throw sessionError
            if (!session?.user) return null

            const user = session.user

            // Get user role
            const { data: userData } = await supabase
                .from('users')
                .select('role')
                .eq('email', user.email)
                .single()

            return {
                user,
                role: userData?.role || 'user',
            }
        } catch (error) {
            console.error('Error getting current user:', error)
            return null
        }
    },

    /**
     * Check if user is authenticated
     * @returns {Promise<boolean>}
     */
    async isAuthenticated() {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            return !!session
        } catch (error) {
            return false
        }
    },

    /**
     * Reset password
     * @param {string} email - User's email
     */
    async resetPassword(email) {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email)
            if (error) throw error

            console.log('Password reset email sent to:', email)
        } catch (error) {
            console.error('Error resetting password:', error)
            throw error
        }
    },
}
