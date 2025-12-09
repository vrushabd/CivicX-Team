
const { getImageForLocation } = require('./lib/location-images.js');

// Mocking the data structure if needed, but we'll try to rely on the real file logic if possible.
// Since we can't easily import the real file in this quick script without module setup, 
// I'll simulate the logic to prove the concept.

const LOCATION_IMAGES_MOCK = {
    "avalahalli": "IMAGE_AVALAHALLI",
    "bms institute of technology": "IMAGE_BMSIT"
};

const getImageForLocationMock = (locationName) => {
    if (!locationName) return null;
    const lowerLoc = locationName.toLowerCase();
    const keys = Object.keys(LOCATION_IMAGES_MOCK);

    // CURRENT LOGIC: Iterates natural order (insertion order mostly)
    for (const key of keys) {
        if (lowerLoc.includes(key.toLowerCase())) {
            console.log(`Matched key: ${key}`);
            return LOCATION_IMAGES_MOCK[key];
        }
    }
    return null;
};

// Real world address likely contains both
const address = "BMS Institute of Technology and Management, Avalahalli, Yelahanka, Bengaluru, Karnataka, India";

console.log("Testing Address:", address);
const result = getImageForLocationMock(address);
console.log("Result Image:", result);

if (result === "IMAGE_AVALAHALLI") {
    console.log("ISSUE REPRODUCED: Matched Avalahalli because it appears first or is checked first.");
} else {
    console.log("Working correctly?");
}
