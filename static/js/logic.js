// Variables to store fetched data
let shopDataArray = [];
let foodDataArray = [];

// Initialize map
const map_shops = L.map('map-shops').setView([38.19864, -85.68989], 12);
const map_food = L.map('map-food').setView([38.19864, -85.68989], 12);

// Add base layer to shop map
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map_shops);

// Add base layer to food map
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map_food);

// Function to fetch shop data
async function fetchShopData() {
    try {
        const response = await fetch('http://127.0.0.1:5500/places');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const shop_data = await response.json();

        shop_data.forEach(item => {
            item.places.score = 50;  // 50 is the initial value of the sliders
        });

        shopDataArray = shop_data;
        updateHexbinData(shopDataArray, hexLayershops);
    } catch (error) {
        console.error("Fetch error: ", error);
    }

    
}

// Function to fetch food data
async function fetchFoodData() {
    try {
        const response = await fetch('http://127.0.0.1:5500/restaurants');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const food_data = await response.json();

        food_data.forEach(item => {
            item.restaurants.score = 50;  // 50 is the initial value of the sliders
        });

        foodDataArray = food_data;
        updateHexbinData(foodDataArray, hexLayerfood);
    } catch (error) {
        console.error("Fetch error: ", error);
    }
}

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

function generateCategories(dataArray) {
    cat_data = [];
    dataArray.forEach(item => {
        const keys = Object.keys(item)[0]
        if (keys === "places") {
            if (!cat_data.includes(item.places.cat_1) && item.places.cat_1 !== "") {
                cat_data.push(item.places.cat_1);
                console.log("Cat_1: ", item.places.cat_1);
            }
        } else if (keys === "restaurants") { 
            if (!cat_data.includes(item.restaurants.cat_1) && item.restaurants.cat_1 !== "") {
                cat_data.push(item.restaurants.cat_1);
                console.log("Cat_1: ", item.restaurants.cat_1);
            }
        }
    });
    cat_data.sort();
    return cat_data;
}

// Function to update the score in data array based on slider changes
function updateDataArrayScore(category, newValue, dataArray) {
    dataArray.forEach(item => {
        const keys = Object.keys(item)[0];
        if ((keys === "places" && item.places.cat_1 === category) ||
            (keys === "restaurants" && item.restaurants.cat_1 === category)) {
            if (keys === "places") {
                item.places.score = newValue;
            } else {
                item.restaurants.score = newValue;
            }
        }
    });
}


// Generate Check Boxes for each Map and Dataset - Default Value is True
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
        checkbox.checked = true;
        checkbox.addEventListener('change', function () {
            if (checkboxClass.includes('shop')) {
                toggleSliders(checkboxClass, 'slider-box-shops', shopDataArray);
            } else {
                toggleSliders(checkboxClass, 'slider-box-food', foodDataArray);
            }
        });


        
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

// Function to populate sliders
function populateSliders(categories, sliderContainer, dataArray) {
    const container = document.getElementById(sliderContainer);
    container.innerHTML = '';

    categories.forEach(category => {
        const slider = document.createElement("input");
        slider.type = "range";
        slider.min = "0";
        slider.max = "100";
        // Set initial slider value based on dataArray
        let initialScore = dataArray.find(item => {
            return Object.keys(item)[0] === "places" ? 
                   item.places.cat_1 === category : 
                   item.restaurants.cat_1 === category;
        });
        
        initialScore = initialScore ? initialScore.places ? initialScore.places.score : initialScore.restaurants.score : 50;
        
        slider.value = initialScore;
        slider.className = "slider";
        slider.dataset.category = category;

        

        slider.addEventListener('input', function () {
            updateDataArrayScore(category, this.value, dataArray);
            // update the map data
            updateHexbinData(dataArray, hexLayershops);
        });

        // Append slider to the container
        container.appendChild(slider);

        // Add a break line for better readability
        const br = document.createElement('br');
        container.appendChild(br);
    });

    // Resize the slider box based on number of sliders
    resizeSliderBox(sliderContainer);
}

// Function to resize the slider box based on number of sliders
function resizeSliderBox(sliderContainer) {
    const container = document.getElementById(sliderContainer);
    const sliders = container.querySelectorAll('.slider');
    // Set the height based on the number of sliders
    container.style.height = `${sliders.length * 22}px`; // 22px per slider 
}

// Function to toggle sliders visibility and update data array
function toggleSliders(checkboxClass, sliderContainer, dataArray) {
    const checkboxes = document.querySelectorAll(`.${checkboxClass}`);
    checkboxes.forEach(checkbox => {
        const sliders = document.querySelectorAll(`input.slider[data-category='${checkbox.dataset.category}']`);
        sliders.forEach(slider => {
            if (checkbox.checked) {
                slider.style.display = "block";
                // Reset score to initial value when checked
                const initVal = 50; // Set to any initial value
                slider.value = initVal;
                updateDataArrayScore(checkbox.dataset.category, initVal, dataArray);
            } else {
                slider.style.display = "none";
                // Set score to null when unchecked
                updateDataArrayScore(checkbox.dataset.category, null, dataArray);
            }
        });
    });

    // Update map data
    if (checkboxClass.includes('shop')) {
        updateHexbinData(dataArray, hexLayershops);
    } else {
        updateHexbinData(dataArray, hexLayerfood);
    }

    // Resize the slider box based on number of visible sliders
    resizeSliderBox(sliderContainer);
}

/*
// Function to reload the map
function reloadMap(hexLayer, mapObj) {
    mapObj.removeLayer(hexLayer);
    hexLayer.addTo(mapObj);
}

// Button to reload the shop map
const reloadShopMapButton = document.getElementById("reload-shop-map");
reloadShopMapButton.addEventListener('click', () => reloadMap(hexLayershops, map_shops));

// Button to reload the food map
const reloadFoodMapButton = document.getElementById("reload-food-map");
reloadFoodMapButton.addEventListener('click', () => reloadMap(hexLayerfood, map_food));
*/



function updateHexbinData(dataArray, hexLayer) {
    //console.log("Entered updateHexbinData"); // Debug
    //console.log("Received data:", dataArray); // Debug

    // Filter out data points with score set to null
    const filteredArray = dataArray.filter(item => {
        const keys = Object.keys(item)[0];
        return keys === "places" ? item.places.score !== null : item.restaurants.score !== null;
    });

    const points = filteredArray.map(item => {
        const keys = Object.keys(item)[0];
        if (keys === "places") {
            return {
                lat: parseFloat(item.places.lat),
                lng: parseFloat(item.places.long),
                score: parseFloat(item.places.score)
            };
        } else if (keys === "restaurants") {
            return {
                lat: parseFloat(item.restaurants.lat),
                lng: parseFloat(item.restaurants.long),
                score: parseFloat(item.restaurants.score)
            };
        }
    });

    //console.log("Processed points:", points); // Debug
    hexLayer.setData(points);
    if (hexLayer === hexLayershops) {
        hexLayer.addTo(map_shops);
    } else if (hexLayer === hexLayerfood) {
        hexLayer.addTo(map_food);
    }
}

async function initializeMaps() {
    await fetchShopData();
    await fetchFoodData();

    let shopcat_data = generateCategories(shopDataArray);
    let foodcat_data = generateCategories(foodDataArray);
    
    console.log("Shop Data Categories: ", shopcat_data);
    console.log("Food Data Categories: ", foodcat_data);



    populateCategories(shopcat_data, 'shop-checkbox', 'checkbox-box-shops');
    populateCategories(foodcat_data, 'food-checkbox', 'checkbox-box-food');

    populateSliders(shopcat_data, 'slider-box-shops', shopDataArray);
    populateSliders(foodcat_data, 'slider-box-food', foodDataArray);

    hexLayerfood.addTo(map_food);
    hexLayershops.addTo(map_shops);
}

initializeMaps();



















/* Working Code
// Variables to store fetched data
let shopDataArray = [];
let foodDataArray = [];

// Initialize map
const map_shops = L.map('map-shops').setView([38.19864, -85.68989], 12);
const map_food = L.map('map-food').setView([38.19864, -85.68989], 12);

// Add base layer to shop map
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map_shops);

// Add base layer to food map
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map_food);

// Function to fetch shop data
async function fetchShopData() {
    try {
        const response = await fetch('http://127.0.0.1:5500/places');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const shop_data = await response.json();
        shopDataArray = shop_data;
        updateHexbinData(shopDataArray, hexLayershops);
    } catch (error) {
        console.error("Fetch error: ", error);
    }
}

// Function to fetch food data
async function fetchFoodData() {
    try {
        const response = await fetch('http://127.0.0.1:5500/restaurants');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const food_data = await response.json();
        foodDataArray = food_data;
        updateHexbinData(foodDataArray, hexLayerfood);
    } catch (error) {
        console.error("Fetch error: ", error);
    }
}

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

function generateCategories(dataArray) {
    cat_data = [];
    dataArray.forEach(item => {
        const keys = Object.keys(item)[0]
        if (keys === "places") {
            if (!cat_data.includes(item.places.cat_1) && item.places.cat_1 !== "") {
                cat_data.push(item.places.cat_1);
                console.log("Cat_1: ", item.places.cat_1);
            }
        } else if (keys === "restaurants") { 
            if (!cat_data.includes(item.restaurants.cat_1) && item.restaurants.cat_1 !== "") {
                cat_data.push(item.restaurants.cat_1);
                console.log("Cat_1: ", item.restaurants.cat_1);
            }
        }
    });
    cat_data.sort();
    return cat_data;
}


// Generate Check Boxes for each Map and Dataset - Default Value is True
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
        checkbox.checked = true;
        checkbox.addEventListener('change', function() {
            toggleSliders(shopDataArray, 'shop');
            toggleSliders(foodDataArray, 'food');
        });


        
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

function generateSliders(containerId, numSliders, dataArray) {
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

        const image = document.createElement("img");
        image.src = `https://picsum.photos/200?random=${slider.value}`;
        image.alt = `Image ${slider.value}`;

        sliderItem.appendChild(image);
        sliderItem.appendChild(slider);
        container.appendChild(sliderItem);
    }
}

// toggle sliders for checkbox listener
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





function updateHexbinData(dataArray, hexLayer) {
    console.log("Entered updateHexbinData"); // Debug
    console.log("Received data:", dataArray); // Debug
    const points = dataArray.map(item => {
        const keys = Object.keys(item)[0]

        //console.log("type: ", keys, "Data: ", item[keys]);
        

        // Check if the type is "place"
        if (keys === "places") {
            console.log("Places Array: True");
            
            return {
                lat: parseFloat(item.places.lat),
                lng: parseFloat(item.places.long),
                score: parseFloat(item.places.score)
            };
        }
        // Check if the type is "restaurant"
        else if (keys === "restaurants") {
            console.log("Restaurants Array: True");
            return {
                lat: parseFloat(item.restaurants.lat),
                lng: parseFloat(item.restaurants.long),
                score: parseFloat(item.restaurants.score)
            };
        }
    });




    
    console.log("Processed points:", points); // Debug
    hexLayer.setData(points);
    if (hexLayer === hexLayershops) {
        hexLayer.addTo(map_shops);
        console.log("HexLayer: ", hexLayer);
    
    } else if (hexLayer === hexLayerfood) {
        hexLayer.addTo(map_food);
        console.log("HexLayer: ", hexLayer);
    }
}

async function initializeMaps() {
    await fetchShopData();
    await fetchFoodData();

    let shopcat_data = generateCategories(shopDataArray);
    let foodcat_data = generateCategories(foodDataArray);
    
    console.log("Shop Data Categories: ", shopcat_data);
    console.log("Food Data Categories: ", foodcat_data);

    generateSliders("slider-box-shops", 10, shopDataArray);

    populateCategories(shopcat_data, 'shop-checkbox', 'checkbox-box-shops');
    populateCategories(foodcat_data, 'food-checkbox', 'checkbox-box-food');

    hexLayerfood.addTo(map_food);
    hexLayershops.addTo(map_shops);
}

initializeMaps();
*/