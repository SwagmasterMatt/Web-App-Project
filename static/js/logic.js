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

function toggleAllCheckboxes() {
    console.log("Entered toggleAllCheckboxes"); // Debug
    if (document.getElementById("checkbox-box-shops")){
        checkbox = document.getElementById("checkbox-box-shops");
        checkboxClass = "shop-checkbox";
        dataArray = shopDataArray;
        sliderContainer = "slider-box-shops";
    } else if (document.getElementById("checkbox-box-food")){
        checkbox = document.getElementById("checkbox-box-food");
        checkboxClass = "food-checkbox";
        dataArray = foodDataArray;
        sliderContainer = "slider-box-food";
    }
    checkboxes = checkbox.querySelectorAll('input');
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
    });
    toggleSliders(checkboxClass, sliderContainer, dataArray);
    
}



// Generate Check Boxes for each Map and Dataset - Default Value is True
function populateCategories(categories, checkboxClass, checkboxContainer) {
    // Remove any existing checkboxes first
    const container = document.getElementById(checkboxContainer);
    container.innerHTML = '';

    // Create a "Select All" button for each category
    const selectAllButton = document.createElement('button');
    selectAllButton.textContent = 'Select All';
    selectAllButton.addEventListener('click', () => toggleAllCheckboxes());
    container.appendChild(selectAllButton);
 

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

        

        // Create an img element for the category image
        const img = document.createElement('img');
        img.src = `/static/ProjectImages/CleanedImages/${category}_no_bg.png`; // Assuming the category name is the image name
        img.alt = `${category} image`;
        img.width = 30;
        img.height = 30;


        
        // Create a label for the checkbox
        const label = document.createElement('label');
        //split by hyphen and capitalize each word
        label.appendChild(document.createTextNode(' ' + category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')));

        // Append checkbox and label to the container
        container.appendChild(img);
        container.appendChild(checkbox);
        container.appendChild(label);

        // Add a break line for better readability
        const br = document.createElement('br');
        container.appendChild(br);
    });
}

// Function to populate sliders
function populateSliders(categories, sliderContainer, dataArray) {
    // Fetch the container element by its ID
    const container = document.getElementById(sliderContainer);
    
    // Clear out any existing content in the container
    container.innerHTML = '';

    // Loop through each category
    categories.forEach(category => {
        // Create a sub-container for each category
        const subContainer = document.createElement('div');
        subContainer.className = 'slider-sub-container';

        // Create a new input element for the slider
        const slider = document.createElement("input");
        slider.type = "range";
        slider.min = "0";
        slider.max = "100";

        // Set the initial value of the slider based on dataArray
        let initialScore = dataArray.find(item => {
            return Object.keys(item)[0] === "places" ? 
                   item.places.cat_1 === category : 
                   item.restaurants.cat_1 === category;
        });

        // Set the initial value of the slider
        initialScore = initialScore ? initialScore.places ? initialScore.places.score : initialScore.restaurants.score : 50;
        slider.value = initialScore;
        slider.className = "slider";
        slider.dataset.category = category;

        // Create an img element to represent the category
        const img = document.createElement('img');
        img.src = `/static/ProjectImages/CleanedImages/${category}_no_bg.png`;
        img.alt = `${category} image`;
        img.width = 30;
        img.height = 30;

        // Add event listener to update dataArray and map when the slider changes
        slider.addEventListener('input', function () {
            updateDataArrayScore(category, this.value, dataArray);
            updateHexbinData(dataArray, hexLayershops);
        });

        // Append the slider and image to the sub-container
        subContainer.appendChild(img);
        subContainer.appendChild(slider);

        // Append the sub-container to the main container
        container.appendChild(subContainer);

        // Add a break line for better readability
        const br = document.createElement('br');
        container.appendChild(br);
    });

    // Resize the slider box based on the number of sliders
    //resizeSliderBox(sliderContainer);
}

// Function to resize the slider box based on number of sliders
function resizeSliderBox(sliderContainer) {
    const container = document.getElementById(sliderContainer);
    const sliders = container.querySelectorAll('.slider');
    // Set the height based on the number of sliders
    //container.style.height = `${sliders.length * 30}px`; // 22px per slider
    // adjust the width of the parent container based on the width of the sliders
    

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
                resizeSliderBox(sliderContainer);
            } else {
                slider.style.display = "none";
                // Set score to null when unchecked
                updateDataArrayScore(checkbox.dataset.category, null, dataArray);
                resizeSliderBox(sliderContainer);
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
    
    // create a function that extracts name, cat_1, cat_2, and cat_3 from the data array
    const metaData = filteredArray.map(item => {
        const keys = Object.keys(item)[0];
        let result = {};
        
        if (keys === "places" || keys === "restaurants") {
            let data = item[keys];
            
            // Bold the 'Name' and start div for indented categories
            result.name = `<strong>Name:</strong> ${data.name}<div style='margin-left: 20px;'>`;
            
            // Initialize an empty string to hold the categories
            let categories = '';
            
            // Conditionally include and bold categories if they are not null
            if (data.cat_1 !== null) {
                categories += `<strong>Category 1:</strong> ${data.cat_1} <br>`;
            }
            
            if (data.cat_2 !== null) {
                categories += `<strong>Category 2:</strong> ${data.cat_2} <br>`;
            }
            
            if (data.cat_3 !== null) {
                categories += `<strong>Category 3:</strong> ${data.cat_3}`;
            }
            
            // Add closing div for indented categories
            if (categories) {
                categories += '</div><br>';
            } else {
                // If there are no categories, close the div immediately
                result.name += '</div><br>';
            }
            
            // Combine name and categories
            result.categories = categories;
        }
        
        return result;
    });

    


    //console.log("Processed points:", points); // Debug
    hexLayer.setData(points, metaData);
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

document.addEventListener('DOMContentLoaded', () => {
    initializeMaps();
});



