// Function to fetch data from the Flask endpoint
async function fetchData() {
    // Make a GET request to your Flask app
    const response = await fetch('http://127.0.0.1:5500/places');

    // Parse the JSON data from the response
    const shop_data = await response.json();

    // Update the DOM with the received data
    document.getElementById('data-shops').innerText = JSON.stringify(shop_data);
}

// Function to fetch data from the Flask endpoint
async function fetchData() {
    // Make a GET request to your Flask app
    const response = await fetch('http://127.0.0.1:5500/restaurants');

    // Parse the JSON data from the response
    const food_data = await response.json();

    // Update the DOM with the received data
    document.getElementById('data-food').innerText = JSON.stringify(food_data);
}

// Initialize map
const map_shops = L.map('map-shops').setView([38.19864, -85.68989], 12);  // Louisville, KY
const map_food = L.map('map-food').setView([38.19864, -85.68989], 12);  // Louisville, KY

// Add base layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map_shops);

// Add base layer for food maps
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map_food);


// Create the Hexbin Layer with some sample options
const hexLayershops = new L.HexbinLayer({
    radius: 20,
    colorRange: [
        "#ff0000",
        "#bf4000",
        "#7f8000",
        "#3fbf00",
        "#00ff00",
        "#00bf40",
        "#008080",
        "#0040bf",
        "#0000ff"
    ],
    radiusRange: [1, 10],
    opacity: 0.5,
    strokeColor: '#000',
    strokeWidth: 0.5,
    //onMouseOver: d => console.log("Mouse over", `Score: ${d.score}`),
    //onMouseOut: d => console.log("Mouse out", `Score: ${d.score}`),
    //onClick: d => console.log("Clicked", `Score: ${d.score}`),
    lng: d => d.lng,
    lat: d => d.lat
})

// Create the Hexbin Layer with some sample options
const hexLayerfood = new L.HexbinLayer({
    radius: 20,
    colorRange: [
        "#ff0000",
        "#bf4000",
        "#7f8000",
        "#3fbf00",
        "#00ff00",
        "#00bf40",
        "#008080",
        "#0040bf",
        "#0000ff"
    ],
    radiusRange: [1, 10],
    opacity: 0.5,
    strokeColor: '#000',
    strokeWidth: 0.5,
    //onMouseOver: d => console.log("Mouse over", `Score: ${d.score}`),
    //onMouseOut: d => console.log("Mouse out", `Score: ${d.score}`),
    //onClick: d => console.log("Clicked", `Score: ${d.score}`),
    lng: d => d.lng,
    lat: d => d.lat
})

// Function to generate random points with scores
function generateRandomPointsWithScores(basePoints, numPoints) {
    const generatedPoints = [];
    const latRange = [38.08, 38.32];
    const lngRange = [-85.82, -85.49];

    for (let i = 0; i < numPoints; i++) {
        const basePoint = basePoints[Math.floor(Math.random() * basePoints.length)];
        const latOffset = Math.random() * 0.1 * (Math.random() < 0.5 ? 1 : -1);
        const lngOffset = Math.random() * 0.1 * (Math.random() < 0.5 ? 1 : -1);
        const randomScore = Math.floor(Math.random() * 100) + 1;

        const newLat = basePoint[0] + latOffset;
        const newLng = basePoint[1] + lngOffset;

        if (newLat >= latRange[0] && newLat <= latRange[1] && newLng >= lngRange[0] && newLng <= lngRange[1]) {
            generatedPoints.push({lat: newLat, lng: newLng, score: randomScore});
        } else {
            i--;
        }
    }

    console.log(generatedPoints);
    return generatedPoints;
}

const basePoints = [
    [38.19845939421437, -85.53145908127011],
    [38.31549108345669, -85.5237825342442],
    [38.19798112364967, -85.68611154738217],
    [38.22324061630486, -85.82019399805515],
    [38.132588077102156, -85.81094181550179],
    [38.08832678463105, -85.66674311426304],
    [38.095486066505565, -85.49370104349225]
];

const numPointsToGenerate = 100;
const shopPoints = generateRandomPointsWithScores(basePoints, numPointsToGenerate);
const foodPoints = generateRandomPointsWithScores(basePoints, numPointsToGenerate);

// Function to generate sliders with attached pictures
function generateSliders(containerId, numSliders/*, imageUrls*/) {
    const container = document.getElementById(containerId);

    for (let i = 0; i < numSliders; i++) {
      const sliderItem = document.createElement("div");
      sliderItem.className = "slider-item";

      const slider = document.createElement("input");
      slider.type = "range";
      slider.min = "1";
      slider.max = "100";
      slider.value = "50";
      slider.className = "slider";
      slider.id = `${containerId}-slider-${i}`;

      //const image = document.createElement("img");
      //image.src = imageUrls[i % imageUrls.length]; // Use the provided image URLs, repeat if needed
      //image.alt = `Image ${i+1}`;

      //sliderItem.appendChild(image);
      sliderItem.appendChild(slider);
      container.appendChild(sliderItem);
    }
}

// Sample image URLs, replace these with your actual image URLs
const imageUrls = [
'https://example.com/image1.jpg',
'https://example.com/image2.jpg'
];

// Generate 10 sliders for each map with attached pictures
generateSliders("slider-box-shops", 10/*, imageUrls*/);
generateSliders("slider-box-food", 10/*, imageUrls*/);


hexLayershops.setData(shopPoints);
hexLayershops.addTo(map_shops);

hexLayerfood.setData(foodPoints);
hexLayerfood.addTo(map_food);


//plot the points with markers
// for (let i = 0; i < generatedPoints.length; i++) {
//      L.marker(generatedPoints[i]).addTo(map);
// }





















































/*

// Initialize map
const map = L.map('map').setView([38.19864, -85.68989], 10);  // Louisville, KY

// Add base layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Create the Hexbin Layer with some sample options
const hexLayer = new L.HexbinLayer({
    radius: 20,
    colorRange: [
        "#ff0000",
        "#bf4000",
        "#7f8000",
        "#3fbf00",
        "#00ff00",
        "#00bf40",
        "#008080",
        "#0040bf",
        "#0000ff"
    ],
    radiusRange: [1, 2],
    lat: d => d.lat,
    lng: d => d.lng
}).addTo(map);

// Function to generate random points with scores
function generateRandomPointsWithScores(basePoints, numPoints) {
    const generatedPoints = [];
    const latRange = [38.08, 38.32];
    const lngRange = [-85.82, -85.49];

    for (let i = 0; i < numPoints; i++) {
        const basePoint = basePoints[Math.floor(Math.random() * basePoints.length)];
        const latOffset = Math.random() * 0.1 * (Math.random() < 0.5 ? 1 : -1);
        const lngOffset = Math.random() * 0.1 * (Math.random() < 0.5 ? 1 : -1);
        const randomScore = Math.floor(Math.random() * 100) + 1;

        const newLat = basePoint[0] + latOffset;
        const newLng = basePoint[1] + lngOffset;

        if (newLat >= latRange[0] && newLat <= latRange[1] && newLng >= lngRange[0] && newLng <= lngRange[1]) {
            generatedPoints.push({lat: newLat, lng: newLng, score: randomScore});
        } else {
            i--;
        }
    }

    console.log(generatedPoints);
    return generatedPoints;
}

const basePoints = [
    [38.19845939421437, -85.53145908127011],
    [38.31549108345669, -85.5237825342442],
    [38.19798112364967, -85.68611154738217],
    [38.22324061630486, -85.82019399805515],
    [38.132588077102156, -85.81094181550179],
    [38.08832678463105, -85.66674311426304],
    [38.095486066505565, -85.49370104349225]
];

const numPointsToGenerate = 100;
const generatedPointsWithScores = generateRandomPointsWithScores(basePoints, numPointsToGenerate);
hexLayer.data(generatedPointsWithScores);
//plot the points with markers
// for (let i = 0; i < generatedPoints.length; i++) {
//      L.marker(generatedPoints[i]).addTo(map);
// }

*/







