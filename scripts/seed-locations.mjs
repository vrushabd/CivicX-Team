import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load env vars
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const LOCATION_IMAGES = {
    // Pune areas
    "pune": "https://images.unsplash.com/photo-1569317002804-ab77bcf1bce4?q=80&w=2070&auto=format&fit=crop",
    "kothrud": "https://images.unsplash.com/photo-1620882143048-c990dc60b439?q=80&w=2070&auto=format&fit=crop",
    "viman nagar": "https://images.unsplash.com/photo-1542318625-2e5550c6d70d?q=80&w=2102&auto=format&fit=crop",
    "hinjewadi": "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?q=80&w=2070&auto=format&fit=crop",

    // Mumbai areas
    "mumbai": "https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?q=80&w=2130&auto=format&fit=crop",
    "bandra": "https://images.unsplash.com/photo-1596716075931-e4069811f269?q=80&w=1974&auto=format&fit=crop",
    "juhu": "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?q=80&w=2070&auto=format&fit=crop",
    "andheri": "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?q=80&w=2070&auto=format&fit=crop",

    // Delhi
    "delhi": "https://images.unsplash.com/photo-1587474260584-136574528ed5?q=80&w=2070&auto=format&fit=crop",
    "new delhi": "https://images.unsplash.com/photo-1587474260584-136574528ed5?q=80&w=2070&auto=format&fit=crop",

    // Bangalore
    "hulimavu lake": "https://adumjjzvxavxczlhomjs.supabase.co/storage/v1/object/public/images/garbageDatabase/Hulimavu%20Lake_05.jpg",
    "gkvk road": "https://adumjjzvxavxczlhomjs.supabase.co/storage/v1/object/public/images/garbageDatabase/AQM4dawUSc0AnN1p5aX5Z0hWI9KLIW6MbjdAm2mIT3swAWA3fcEYZZhwznbPtIogXJLyqRsIvo-PwT6wwNqIYc_x_yAZhRz_93xvaYkhE6CAFg.mp4",
    "avalahalli": "https://adumjjzvxavxczlhomjs.supabase.co/storage/v1/object/public/images/garbageDatabase/thumbnail.jpeg",
    "bannerghatta road": "https://adumjjzvxavxczlhomjs.supabase.co/storage/v1/object/public/images/garbageDatabase/garbage-piles-up-along-bannerghatta-road-as-bengaluru-metro-gears-up-for-trial-run.avif",
    "bellahalli": "https://adumjjzvxavxczlhomjs.supabase.co/storage/v1/object/public/images/garbageDatabase/1492289-garbadge.webp",
    "bms institute of technology": "https://adumjjzvxavxczlhomjs.supabase.co/storage/v1/object/public/images/garbageDatabase/thumbnail%20(1).jpeg",
};

async function seedLocations() {
    console.log('Seeding location references...')

    for (const [key, url] of Object.entries(LOCATION_IMAGES)) {
        const isVideo = url.toLowerCase().endsWith('.mp4');

        const { data, error } = await supabase
            .from('location_references')
            .upsert({
                key: key,
                image_url: isVideo ? null : url,
                video_url: isVideo ? url : null,
            }, { onConflict: 'key' })

        if (error) {
            console.error(`Error seeding ${key}:`, error.message)
        } else {
            console.log(`Seeded ${key}`)
        }
    }

    console.log('Seeding complete!')
}

seedLocations()
