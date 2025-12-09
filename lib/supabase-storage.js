// Supabase Storage Service for image uploads
import { supabase, STORAGE_BUCKET } from './supabase'

export const SupabaseStorageService = {
    /**
     * Upload image to Supabase Storage organized by user email
     * @param {File} file - The image file to upload
     * @param {string} userEmail - User's email for folder organization
     * @param {string} path - Subfolder path (e.g., 'reports', 'completions')
     * @returns {Promise<string>} - Public URL of uploaded image
     */
    async uploadImage(file, userEmail, path = 'reports') {
        try {
            // Generate unique filename
            const timestamp = Date.now()
            const randomString = Math.random().toString(36).substring(7)
            const fileExt = file.name.split('.').pop()
            const filename = `${timestamp}_${randomString}.${fileExt}`

            // Create user-specific path: userEmail/path/filename
            const filePath = `${userEmail}/${path}/${filename}`

            console.log('Uploading to Supabase Storage:', filePath)

            // Upload to Supabase Storage
            const { data, error } = await supabase.storage
                .from(STORAGE_BUCKET)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false,
                    contentType: file.type
                })

            if (error) {
                console.error('Supabase upload error:', error)
                throw error
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from(STORAGE_BUCKET)
                .getPublicUrl(filePath)

            console.log('Upload successful:', publicUrl)
            return publicUrl

        } catch (error) {
            console.error('Error uploading to Supabase:', error)
            throw error
        }
    },

    /**
     * Delete image from Supabase Storage
     * @param {string} filePath - Full path to file in storage
     */
    async deleteImage(filePath) {
        try {
            const { error } = await supabase.storage
                .from(STORAGE_BUCKET)
                .remove([filePath])

            if (error) throw error
            console.log('Deleted from Supabase:', filePath)
        } catch (error) {
            console.error('Error deleting from Supabase:', error)
            throw error
        }
    },

    /**
     * List all images for a specific user
     * @param {string} userEmail - User's email
     * @param {string} path - Optional subfolder path
     */
    async listUserImages(userEmail, path = '') {
        try {
            const folderPath = path ? `${userEmail}/${path}` : userEmail

            const { data, error } = await supabase.storage
                .from(STORAGE_BUCKET)
                .list(folderPath)

            if (error) throw error
            return data
        } catch (error) {
            console.error('Error listing images:', error)
            throw error
        }
    }
}
