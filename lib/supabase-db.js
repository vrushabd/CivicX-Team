// Supabase Database Service for CivicX
import { supabase } from './supabase'

export const SupabaseDatabaseService = {
    /**
     * Create a new report in Supabase
     * @param {Object} reportData - Report data
     * @returns {Promise<string>} - Report ID
     */
    async createReport(reportData) {
        try {
            const { data, error } = await supabase
                .from('reports')
                .insert([{
                    title: reportData.title,
                    description: reportData.description,
                    location: reportData.location,
                    coords: reportData.coords,
                    image: reportData.image,
                    user_email: reportData.userEmail,
                    status: reportData.status || 'pending',
                    type: reportData.type || 'garbage',
                }])
                .select()
                .single()

            if (error) throw error

            if (error) throw error

            console.log('Report created in Supabase:', data.id)

            // Auto-save location reference if it's new
            // We don't await this to keep the user flow fast
            if (reportData.location && (reportData.image || reportData.video)) {
                this.addLocationReference({
                    key: reportData.location.toLowerCase().trim(),
                    imageUrl: reportData.image,
                    videoUrl: reportData.video
                }).catch(err => console.error('Background location auto-save failed:', err))
            }

            return data.id
        } catch (error) {
            console.error('Error creating report in Supabase:', error)
            throw error
        }
    },

    /**
     * Update an existing report
     * @param {string} reportId - Report ID
     * @param {Object} updates - Fields to update
     */
    async updateReport(reportId, updates) {
        try {
            // Map userEmail to user_email for database
            const dbUpdates = { ...updates }
            if (updates.userEmail) {
                dbUpdates.user_email = updates.userEmail
                delete dbUpdates.userEmail
            }
            if (updates.completedBy) {
                dbUpdates.completed_by = updates.completedBy
                delete dbUpdates.completedBy
            }
            if (updates.completedAt) {
                dbUpdates.completed_at = updates.completedAt
                delete dbUpdates.completedAt
            }
            if (updates.completionImage) {
                dbUpdates.completion_image = updates.completionImage
                delete dbUpdates.completionImage
            }
            if (updates.completionNotes) {
                dbUpdates.completion_notes = updates.completionNotes
                delete dbUpdates.completionNotes
            }

            const { error } = await supabase
                .from('reports')
                .update(dbUpdates)
                .eq('id', reportId)

            if (error) throw error

            console.log('Report updated in Supabase:', reportId)
        } catch (error) {
            console.error('Error updating report in Supabase:', error)
            throw error
        }
    },

    /**
     * Get all reports with optional filters
     * @param {Object} filters - Filter options
     * @returns {Promise<Array>} - Array of reports
     */
    async getReports(filters = {}) {
        try {
            let query = supabase
                .from('reports')
                .select('*')
                .order('created_at', { ascending: false })

            if (filters.status) {
                query = query.eq('status', filters.status)
            }
            if (filters.type) {
                query = query.eq('type', filters.type)
            }
            if (filters.userEmail) {
                query = query.eq('user_email', filters.userEmail)
            }

            const { data, error } = await query

            if (error) throw error

            // Map database fields to camelCase
            return data.map(report => ({
                id: report.id,
                title: report.title,
                description: report.description,
                location: report.location,
                coords: report.coords,
                image: report.image,
                userEmail: report.user_email,
                status: report.status,
                type: report.type,
                completionImage: report.completion_image,
                completionNotes: report.completion_notes,
                completedBy: report.completed_by,
                completedAt: report.completed_at,
                createdAt: report.created_at,
                updatedAt: report.updated_at,
            }))
        } catch (error) {
            console.error('Error getting reports from Supabase:', error)
            throw error
        }
    },

    /**
     * Get reports for a specific user
     * @param {string} userEmail - User's email
     * @returns {Promise<Array>} - Array of user's reports
     */
    async getUserReports(userEmail) {
        try {
            const { data, error } = await supabase
                .from('reports')
                .select('*')
                .eq('user_email', userEmail)
                .order('created_at', { ascending: false })

            if (error) throw error

            // Map database fields to camelCase
            return data.map(report => ({
                id: report.id,
                title: report.title,
                description: report.description,
                location: report.location,
                coords: report.coords,
                image: report.image,
                userEmail: report.user_email,
                status: report.status,
                type: report.type,
                completionImage: report.completion_image,
                completionNotes: report.completion_notes,
                completedBy: report.completed_by,
                completedAt: report.completed_at,
                createdAt: report.created_at,
                updatedAt: report.updated_at,
            }))
        } catch (error) {
            console.error('Error getting user reports from Supabase:', error)
            throw error
        }
    },

    /**
     * Create a notification
     * @param {Object} notification - Notification data
     * @returns {Promise<string>} - Notification ID
     */
    async createNotification(notification) {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .insert([{
                    type: notification.type,
                    title: notification.title,
                    message: notification.message,
                    recipient_email: notification.recipientEmail,
                    recipient_role: notification.recipientRole,
                    report_id: notification.reportId,
                }])
                .select()
                .single()

            if (error) throw error

            console.log('Notification created in Supabase:', data.id)
            return data.id
        } catch (error) {
            console.error('Error creating notification in Supabase:', error)
            throw error
        }
    },

    /**
     * Get notifications for a user
     * @param {string} userEmail - User's email
     * @param {string} userRole - User's role
     * @returns {Promise<Array>} - Array of notifications
     */
    async getNotifications(userEmail, userRole) {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .or(`recipient_email.eq.${userEmail},recipient_role.eq.${userRole}`)
                .order('created_at', { ascending: false })
                .limit(50)

            if (error) throw error

            // Map database fields to camelCase
            return data.map(notif => ({
                id: notif.id,
                type: notif.type,
                title: notif.title,
                message: notif.message,
                recipientEmail: notif.recipient_email,
                recipientRole: notif.recipient_role,
                reportId: notif.report_id,
                read: notif.read,
                readAt: notif.read_at,
                createdAt: notif.created_at,
            }))
        } catch (error) {
            console.error('Error getting notifications from Supabase:', error)
            throw error
        }
    },

    /**
     * Mark notification as read
     * @param {string} notificationId - Notification ID
     */
    async markNotificationAsRead(notificationId) {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({
                    read: true,
                    read_at: new Date().toISOString(),
                })
                .eq('id', notificationId)

            if (error) throw error

            console.log('Notification marked as read:', notificationId)
        } catch (error) {
            console.error('Error marking notification as read:', error)
            throw error
        }
    },

    /**
     * Delete a notification
     * @param {string} notificationId - Notification ID
     */
    async deleteNotification(notificationId) {
        try {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', notificationId)

            if (error) throw error

            console.log('Notification deleted from Supabase:', notificationId)
        } catch (error) {
            console.error('Error deleting notification from Supabase:', error)
            throw error
        }
    },
    /**
     * Delete a report
     * @param {string} reportId - Report ID
     */
    async deleteReport(reportId) {
        try {
            const { error } = await supabase
                .from('reports')
                .delete()
                .eq('id', reportId)

            if (error) throw error

            console.log('Report deleted from Supabase:', reportId)
        } catch (error) {
            console.error('Error deleting report from Supabase:', error)
            throw error
        }
    },

    /**
     * Get all location references
     * @returns {Promise<Array>} - Array of location references
     */
    async getLocationReferences() {
        try {
            const { data, error } = await supabase
                .from('location_references')
                .select('*')

            if (error) throw error

            return data.map(ref => ({
                id: ref.id,
                key: ref.key,
                image: ref.image_url,
                video: ref.video_url
            }))
        } catch (error) {
            console.error('Error getting location references from Supabase:', error)
            throw error
        }
    },

    /**
     * Add a new location reference
     * @param {Object} locationData - { key, imageUrl, videoUrl }
     * @returns {Promise<Object>} - Created record
     */
    async addLocationReference({ key, imageUrl, videoUrl }) {
        try {
            const { data, error } = await supabase
                .from('location_references')
                .upsert([{
                    key: key,
                    image_url: imageUrl,
                    video_url: videoUrl
                }], { onConflict: 'key' })
                .select()
                .single()

            if (error) throw error
            console.log('Location reference added:', data)
            return data
        } catch (error) {
            console.error('Error adding location reference:', error)
            throw error
        }
    },

    /**
     * Get user profile
     * @param {string} email - User email
     * @returns {Promise<Object>} - User profile
     */
    async getUserProfile(email) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .single()

            if (error) {
                // Return null if not found (it might be auto-created on trigger later)
                if (error.code === 'PGRST116') return null
                throw error
            }

            return data
        } catch (error) {
            console.error('Error getting user profile:', error)
            throw error // Propagate error
        }
    },

    /**
     * Update user profile
     * @param {string} email - User email
     * @param {Object} updates - { fullName }
     */
    async updateUserProfile(email, updates) {
        try {
            const { error } = await supabase
                .from('users')
                .update({
                    full_name: updates.fullName,
                    updated_at: new Date().toISOString()
                })
                .eq('email', email)

            if (error) throw error

            console.log('User profile updated:', email)
        } catch (error) {
            console.error('Error updating user profile:', error)
            throw error
        }
    }
}
