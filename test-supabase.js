// Test script to verify Supabase connection
// Run this in browser console to test

async function testSupabaseConnection() {
    console.log('🔍 Testing Supabase Connection...\n')

    // 1. Check environment variables
    console.log('1️⃣ Checking Environment Variables:')
    console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('SUPABASE_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing')
    console.log('SUPABASE_BUCKET:', process.env.NEXT_PUBLIC_SUPABASE_BUCKET)

    // 2. Test Supabase client
    console.log('\n2️⃣ Testing Supabase Client:')
    try {
        const { supabase } = await import('./lib/supabase')
        console.log('✅ Supabase client created')

        // 3. Test database connection
        console.log('\n3️⃣ Testing Database Connection:')
        const { data, error } = await supabase.from('reports').select('count')

        if (error) {
            console.error('❌ Database Error:', error.message)
            if (error.message.includes('relation') || error.message.includes('does not exist')) {
                console.log('⚠️  TABLES NOT CREATED! Run the SQL schema in Supabase dashboard.')
            }
        } else {
            console.log('✅ Database connected successfully')
            console.log('Reports count:', data)
        }

        // 4. Test storage connection
        console.log('\n4️⃣ Testing Storage Connection:')
        const { data: buckets, error: storageError } = await supabase.storage.listBuckets()

        if (storageError) {
            console.error('❌ Storage Error:', storageError.message)
        } else {
            console.log('✅ Storage connected')
            console.log('Available buckets:', buckets.map(b => b.name))
        }

    } catch (err) {
        console.error('❌ Connection failed:', err)
    }
}

// Run the test
testSupabaseConnection()
