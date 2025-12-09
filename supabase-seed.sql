-- Run this in the Supabase SQL Editor to seed the location data
-- This bypasses the RLS issues you faced with the script

INSERT INTO location_references (key, image_url, video_url) VALUES
('pune', 'https://images.unsplash.com/photo-1569317002804-ab77bcf1bce4?q=80&w=2070&auto=format&fit=crop', NULL),
('kothrud', 'https://images.unsplash.com/photo-1620882143048-c990dc60b439?q=80&w=2070&auto=format&fit=crop', NULL),
('viman nagar', 'https://images.unsplash.com/photo-1542318625-2e5550c6d70d?q=80&w=2102&auto=format&fit=crop', NULL),
('hinjewadi', 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?q=80&w=2070&auto=format&fit=crop', NULL),
('mumbai', 'https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?q=80&w=2130&auto=format&fit=crop', NULL),
('bandra', 'https://images.unsplash.com/photo-1596716075931-e4069811f269?q=80&w=1974&auto=format&fit=crop', NULL),
('juhu', 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?q=80&w=2070&auto=format&fit=crop', NULL),
('andheri', 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?q=80&w=2070&auto=format&fit=crop', NULL),
('delhi', 'https://images.unsplash.com/photo-1587474260584-136574528ed5?q=80&w=2070&auto=format&fit=crop', NULL),
('new delhi', 'https://images.unsplash.com/photo-1587474260584-136574528ed5?q=80&w=2070&auto=format&fit=crop', NULL),
('hulimavu lake', 'https://adumjjzvxavxczlhomjs.supabase.co/storage/v1/object/public/images/garbageDatabase/Hulimavu%20Lake_05.jpg', NULL),
('gkvk road', NULL, 'https://adumjjzvxavxczlhomjs.supabase.co/storage/v1/object/public/images/garbageDatabase/AQM4dawUSc0AnN1p5aX5Z0hWI9KLIW6MbjdAm2mIT3swAWA3fcEYZZhwznbPtIogXJLyqRsIvo-PwT6wwNqIYc_x_yAZhRz_93xvaYkhE6CAFg.mp4'),
('avalahalli', 'https://adumjjzvxavxczlhomjs.supabase.co/storage/v1/object/public/images/garbageDatabase/thumbnail.jpeg', NULL),
('bannerghatta road', 'https://adumjjzvxavxczlhomjs.supabase.co/storage/v1/object/public/images/garbageDatabase/garbage-piles-up-along-bannerghatta-road-as-bengaluru-metro-gears-up-for-trial-run.avif', NULL),
('bellahalli', 'https://adumjjzvxavxczlhomjs.supabase.co/storage/v1/object/public/images/garbageDatabase/1492289-garbadge.webp', NULL),
('bms institute of technology', 'https://adumjjzvxavxczlhomjs.supabase.co/storage/v1/object/public/images/garbageDatabase/thumbnail%20(1).jpeg', NULL)
ON CONFLICT (key) DO UPDATE SET image_url = EXCLUDED.image_url, video_url = EXCLUDED.video_url;
