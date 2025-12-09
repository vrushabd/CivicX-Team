
const query = "Avalahalli";
// Approx coords for Avalahalli from screenshot context (Bangalore)
// Lat/Lng roughly 13.0, 77.6
const coords = {
    lat: 13.111,
    lng: 77.567 // Random point in Bangalore close to "Avalahalli" if it's the one in north Bangalore
};

async function testSearch() {
    console.log("Testing search for:", query);

    // 1. Test WITHOUT viewbox
    const url1 = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&countrycodes=in`;
    console.log("\n1. Requesting WITHOUT viewbox:", url1);
    try {
        const res1 = await fetch(url1, { headers: { "User-Agent": "CivicReportApp/1.0" } });
        const data1 = await res1.json();
        console.log("Results (No Viewbox):", data1.length);
        if (data1.length > 0) console.log("Top result:", data1[0].display_name);
    } catch (e) {
        console.error("Error 1:", e.message);
    }

    // 2. Test WITH viewbox (My implementation logic)
    const viewbox = `${coords.lng - 0.5},${coords.lat + 0.5},${coords.lng + 0.5},${coords.lat - 0.5}`;
    const url2 = `${url1}&viewbox=${viewbox}&bounded=0`;

    console.log("\n2. Requesting WITH viewbox:", url2);
    try {
        const res2 = await fetch(url2, { headers: { "User-Agent": "CivicReportApp/1.0" } });
        const data2 = await res2.json();
        console.log("Results (With Viewbox):", data2.length);
        if (data2.length > 0) console.log("Top result:", data2[0].display_name);
    } catch (e) {
        console.error("Error 2:", e.message);
    }
}

testSearch();
