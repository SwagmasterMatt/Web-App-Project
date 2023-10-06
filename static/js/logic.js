// Variables to store fetched data
let shopDataArray = [];
let foodDataArray = [];

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

// Function to fetch data from the Flask endpoint for shops
async function fetchshopData() {
    try {
        // Make a GET request to your Flask app
        const response = await fetch('http://127.0.0.1:5500/places');

        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}`);
            return;
        }

        // Parse the JSON data from the response
        const shop_data = await response.json();
        
        // Storing data into the global variable
        shopDataArray = shop_data;
        

        console.log("Server response (shops): ", shopDataArray);

        // Update the DOM with the received data
        //document.getElementById('data-shops').innerText = JSON.stringify(shopDataArray);

    } catch (error) {
        console.error("Fetch error: ", error);
    }
    
}


// Function to fetch data from the Flask endpoint for food
async function fetchfoodData() {
    try {
        // Make a GET request to your Flask app
        const response = await fetch('http://127.0.0.1:5500/restaurants');

        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}`);
            return;
        }

        // Parse the JSON data from the response
        const food_data = await response.json();

        // Storing data into the global variable
        foodDataArray = food_data;

        //console.log("Server response (food): ", foodDataArray);

        // Update the DOM with the received data
        //document.getElementById('data-food').innerText = JSON.stringify(foodDataArray);

    } catch (error) {
        console.error("Fetch error: ", error);
    }
    
}


fetchshopData();
fetchfoodData();

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
    lng: d => {
        console.log("Data object:", d); // Print entire data object
        console.log("Before:", typeof d.lng, d.lng);
        const newLng = Number(d.lng);
        console.log("After:", typeof newLng, newLng);
        return newLng;
    },
    lat: d => {
        console.log("Data object:", d); // Print entire data object
        console.log("Before:", typeof d.lat, d.lat);
        const newLat = Number(d.lat);
        console.log("After:", typeof newLat, newLat);
        return newLat;
    }
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
    lng: d => {
        console.log("Data object:", d); // Print entire data object
        console.log("Before:", typeof d.lng, d.lng);
        const newLng = Number(d.lng);
        console.log("After:", typeof newLng, newLng);
        return newLng;
    },
    lat: d => {
        console.log("Data object:", d); // Print entire data object
        console.log("Before:", typeof d.lat, d.lat);
        const newLat = Number(d.lat);
        console.log("After:", typeof newLat, newLat);
        return newLat;
    }
})


// Function to update Hexbin Layer
function updateHexbinData(dataArray, hexLayer) {
    const points = dataArray.map(item => {
        return {lat: parseFloat(item.lat), lng: parseFloat(item.long), score: item.score};
    });
    console.log("Points:", points);
    hexLayer.setData(points);
}

// Function to toggle sliders for shops
function toggleShopSliders() {
    // Toggle sliders based on shop checkboxes
    const checkboxes = document.querySelectorAll('input.shop-checkbox[type=checkbox]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            toggleSliders(shopDataArray, 'shop');
        });
    });
}

// Function to toggle sliders for food
function toggleFoodSliders() {
    // Toggle sliders based on food checkboxes
    const checkboxes = document.querySelectorAll('input.food-checkbox[type=checkbox]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            toggleSliders(foodDataArray, 'food');
        });
    });
}

// General function to toggle sliders
function toggleSliders(dataArray, type) {
    const checkboxes = document.querySelectorAll(`input.${type}-checkbox[type=checkbox]`);
    checkboxes.forEach(checkbox => {
        const category = checkbox.dataset.category;
        const isChecked = checkbox.checked;
        dataArray.forEach((item, index) => {
            const slider = document.getElementById(`${type}-slider-${index}`);
            if (item.cat_1 === category) {
                slider.style.display = isChecked ? 'block' : 'none';
            }
        });
    });
}



function populateCategories(categories, checkboxClass, checkboxContainer) {
    // Remove any existing checkboxes first
    const container = document.getElementById(checkboxContainer);
    container.innerHTML = '';
  
    // Create new checkboxes based on categories
    categories.forEach(category => {
        // Create a checkbox element
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = checkboxClass;
        checkbox.dataset.category = category;
        
        // Create a label for the checkbox
        const label = document.createElement('label');
        label.appendChild(document.createTextNode(' ' + category));
        
        // Append checkbox and label to the container
        container.appendChild(checkbox);
        container.appendChild(label);
        
        // Add a break line for better readability
        const br = document.createElement('br');
        container.appendChild(br);
    });
}

// Unique categories for shops based on the data in 'cat1'
const shopCategories = [...new Set(shopDataArray.map(data => data.cat1))];
populateCategories(shopCategories, 'shop-checkbox', 'checkbox-box-shops');

// Unique categories for food based on the data in 'cat1'
const foodCategories = [...new Set(foodDataArray.map(data => data.cat1))];
populateCategories(foodCategories, 'food-checkbox', 'checkbox-box-food');







// Call fetch functions

updateHexbinData(foodDataArray, hexLayerfood);
updateHexbinData(shopDataArray, hexLayershops);



// Add Hexbin Layers to Maps
hexLayershops.addTo(map_shops);
hexLayerfood.addTo(map_food);

// Toggle sliders
toggleShopSliders();
toggleFoodSliders();











































































/*

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
function generateSliders(containerId, numSliders/*, imageUrls) {
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
generateSliders("slider-box-shops", 10/*, imageUrls);
generateSliders("slider-box-food", 10/*, imageUrls);
*/



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







