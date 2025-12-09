
// Mocking the logic from lib/location-images.js to test standalone
const LOCATION_IMAGES = {
    "pune": "https://images.unsplash.com/photo-1569317002804-ab77bcf1bce4?q=80&w=2070&auto=format&fit=crop",
    "hulimavu lake": "https://adumjjzvxavxczlhomjs.supabase.co/storage/v1/object/public/images/garbageDatabase/Hulimavu%20Lake_05.jpg",
    // ... other keys ...
};

const getImageForLocation = (locationName) => {
    if (!locationName) return null;

    const lowerLoc = locationName.toLowerCase();
    const keys = Object.keys(LOCATION_IMAGES);

    console.log(`Checking location: "${locationName}"`);

    for (const key of keys) {
        if (lowerLoc.includes(key)) {
            console.log(`Matched key: "${key}"`);
            return LOCATION_IMAGES[key];
        }
    }

    return null;
};

// Test Case
const inputQuery = "Avalahalli, Bengaluru, Karnataka";
const result = getImageForLocation(inputQuery);

console.log("---------------------------------------------------");
console.log("Expected URL: https://adumjjzvxavxczlhomjs.supabase.co/storage/v1/object/public/images/garbageDatabase/WhatsApp%20Image%202025-11-04%20at%2014.06.06.jpeg");
console.log(`Actual URL:   ${result}`);

if (result === LOCATION_IMAGES["hulimavu lake"]) {
    console.log("SUCCESS: Image mapped correctly.");
} else {
    console.log("FAILURE: Image NOT mapped.");
}
