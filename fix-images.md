# Fix: Images Not Displaying

## The Issue
Images are uploading to Supabase Storage but not displaying (broken image icon).

## Root Cause
The "images" bucket is **not public**, so the browser can't access the image URLs.

## Solution: Make Bucket Public

### Step 1: Go to Storage
1. Open Supabase Dashboard: https://supabase.com/dashboard/project/adumjjzvxavxczlhomjs
2. Click **"Storage"** in the left sidebar

### Step 2: Find Your Bucket
You should see the **"images"** bucket in the list.

### Step 3: Make It Public
1. Click on the **"images"** bucket
2. Click the **⋮** (three dots) menu or settings icon
3. Look for **"Make public"** or **"Public bucket"** option
4. Toggle it **ON** or click "Make public"

**Alternative method**:
1. Click the bucket name
2. Look for "Configuration" or "Settings" tab
3. Find "Public bucket" toggle
4. Turn it **ON**

### Step 4: Verify
After making it public:
1. Go back to your app
2. Refresh the page
3. Images should now display! ✅

## If You Can't Find "Make Public" Option

You can also set bucket policies via SQL:

```sql
-- Make the images bucket publicly readable
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');
```

Run this in Supabase SQL Editor.

## Expected Result

**Before**: 🖼️ ❌ (broken image)  
**After**: 🖼️ ✅ (image displays)

The image URLs look like:
`https://adumjjzvxavxczlhomjs.supabase.co/storage/v1/object/public/images/user@email.com/reports/123_image.jpg`

Notice the `/public/` in the URL - this only works if the bucket is public!

## Quick Test

After making bucket public, try this in browser console:
```javascript
// Test loading an image URL from Supabase
const testUrl = 'https://adumjjzvxavxczlhomjs.supabase.co/storage/v1/object/public/images/test.jpg'
console.log('Image URL:', testUrl)
// Open in new tab
window.open(testUrl, '_blank')
```

If bucket is public, image loads (or shows 404 if doesn't exist).  
If bucket is private, you'll get access denied error.
