class HexbinLayer extends L.Layer {
    constructor(options = {}) {
        super(options);
        L.setOptions(this, options);
        // Use provided function to calculate score or fallback to calculating length
        // If a custom function is not provided, default to counting the length of data points in each bin
        this._value = this.options.calculateScore || ((d, metaData) => d.length);

        // Initialize hex layout with the given options
        this._hexLayout = d3.hexbin()
            .radius(this.options.radius)
            .x(d => d.point[0])
            .y(d => d.point[1]);
        
        this._data = [];

        // Calculate step size based on number of colors and max domain value
        const maxDomainValue = 100;
        const stepSize = maxDomainValue / (this.options.colorRange.length - 1);

        // Generate domain dynamically based on the number of colors
        const domainArray = Array.from({ length: this.options.colorRange.length }, (_, i) => 1 + i * stepSize);

        // Initialize color scale
        this._colorScale = d3.scaleLinear()
            .domain(domainArray)
            .range(this.options.colorRange)
            .clamp(true);

        // Initialize radius scale
        this._radiusScale = d3.scaleSqrt()
            .range(this.options.radiusRange)
            .clamp(true);
		this._eventCallbacks = {
			hover: [],
			click: []
		};
		// Initialize marker layer
		this._markerLayer = null;
		this._highlightHexagon = null;

		// Initialize metaData and set to empty object if not provided
		this._metaData = [];
    }
		
    

	setData(data, metaData) {
		console.log('Setting Hexbin Data');
		this._data = data;
		this._metaData = metaData;
	
		this.redraw();
	}

	
	// Function to register an event
	on(eventType, callback) {
        if (this._eventCallbacks[eventType]) {
            this._eventCallbacks[eventType].push(callback);
        }
    }

	// Function to trigger an event
    _trigger(eventType, eventData) {
        if (this._eventCallbacks[eventType]) {
            this._eventCallbacks[eventType].forEach(callback => callback(eventData));
        }
    }
  
    onAdd(map) {
        this._map = map;
        this._container = this._initContainer();
        map.on('moveend zoomend load', this.redraw, this);
        console.log('Hexbin Layer Added');
    }

    onRemove(map) {
        this._destroyContainer();
        map.off('moveend zoomend load', this.redraw, this);
        this._container = null;
        this._map = null;
        this._data = null;
    }

    addTo(map) {
		console.log('Adding Hexbin Layer to Map');
        map.addLayer(this);
		this.redraw();
        return this;
    }

    _initContainer() {
		console.log('Initializing Hexbin Container');
        const paneId = 'hexbinPane';
        this._map.createPane(paneId);

        const pane = this._map.getPane(paneId);
        
        const container = d3.select(pane).append('svg')
            .attr('class', 'leaflet-layer leaflet-zoom-hide');
        return container;
    }
  
    _destroyContainer() {
		console.log('Destroying Hexbin Container');
        if (this._container) {
            this._container.remove();
        }
    }

	// Method for highlighting clicked hexagons
    highlightClickedHexagon(bin) {
		console.log('Highlighting Clicked Hexagon');


        // Remove any previously highlighted hexagon
        if (this._highlightHexagon) {
            this._highlightHexagon.remove();
        }

        // Get the latitude and longitude of the clicked hexagon's center
        const latlngCenter = this._map.layerPointToLatLng(L.point(bin.x, bin.y));

        // Create a temporary hexagon with a black border and add it to the map
        this._highlightHexagon = L.polygon(this.calculateHexagonVertices(latlngCenter, this.options.radius), {
            color: 'black',
            fillColor: 'none',
            weight: 3
        }).addTo(this._map);

		// Rescale the hexagon when the map is zoomed
		this._map.on('zoomend', () => {
            //this._highlightHexagon.setLatLngs(this.calculateHexagonVertices(latlngCenter, this.options.radius));
			this._highlightHexagon.remove();
        });
    }
  
    // Method to calculate the vertices of a hexagon
    calculateHexagonVertices(latlng, radius) {
		console.log('Calculating Hexagon Vertices for Highlighting');
        const angles = [30, 90, 150, 210, 270, 330, 30];
        return angles.map(angle => {
            const dx = radius * Math.cos(angle * Math.PI / 180);
            const dy = radius * Math.sin(angle * Math.PI / 180);
            const point = this._map.latLngToLayerPoint(latlng).add([dx, dy]);
            return this._map.layerPointToLatLng(point);
        });
    }
			


    // Redraw function
    redraw = () => {
        console.log('Redrawing Hexbins');
        if (!this._map) return;

        const { lng, lat, radius } = this.options;
        const zoom = this._map.getZoom();
        const padding = radius * 2;



        // Generate mapped data and get bounds
        const data = this._data.map(d => {
			// Debug: Log each longitude and latitude
			//console.log('Longitude:', lng(d), 'Latitude:', lat(d));
		  
			// Ensure that lng and lat are providing numeric values
			if (isNaN(lng(d)) || isNaN(lat(d))) {
				console.error('Invalid coordinate:', d);
				return;
			}
		  
			// Project the geographic coordinates to pixel coordinates
			// and include the original data
			return {
				point: this._project([lng(d), lat(d)]),
				original: d,
			};
		}).filter(Boolean); // Remove undefined items, if any

		const metaData = this._metaData.map(m => {
			return {
				meta: m,
			};
		}) //.filter(Boolean); // Remove undefined items, if any

		//console.log('metaData:', metaData);

		// join the data and metaData arrays

		const joinedData = data.map((d, i) => {
			return {
				point: d.point,
				original: d.original,
				metaData: metaData[i].meta,
			};
		});
		
		//sort the joinedData array by score
		//joinedData.sort((a, b) => (a.original.score > b.original.score) ? -1 : 1);

		// Debug: Log the original data
		//console.log('Original Data:', this._data);

        const bounds = this._getBounds(data);

        // Update layout and container
		const { min, max } = bounds;
		const width = (max[0] - min[0]) + this.options.radius * 4;
		const height = (max[1] - min[1]) + this.options.radius * 4;

        this._hexLayout.size([width, height]);
        this._container.attr('width', width).attr('height', height)
            .style('margin-left', `${min[0] - padding}px`)
            .style('margin-top', `${min[1] - padding}px`);

        // Update SVG groups
        const join = this._container.selectAll('g.hexbin').data([zoom]);
        join.enter().append('g').attr('class', `hexbin zoom-${zoom}`);
        join.attr('transform', `translate(${-min[0] + padding}, ${-min[1] + padding})`);
        join.exit().remove();
        
        // Create or update hexagons
        this._createHexagons(join, joinedData);
		console.log('FN Redraw Complete');
    }

	// Added a default function to process metadata
	hexMarkermetadata(binMetaData) {
		function deepStringify(obj) {
			if (obj === null) {
				return 'null';
			}
			if (obj === undefined) {
				return 'undefined';
			}
			if (typeof obj === 'object') {
				return Object.entries(obj).map(([key, value]) => {
					return `${deepStringify(value)}`;
				}).join(' ');
			}
			return obj.toString();
		}
		// Invoke the deepStringify function
		return deepStringify(binMetaData);
	}

	// New method to process metadata for marker
	processMetaData(binMetaData) {
		return this.hexMarkermetadata(binMetaData);  // Calls the hexMarkermetadata method
	}
	

  
    _createHexagons = (g, data) => {
		console.log('FN Create Hexagons Entered');
        const self = this; // Store a reference to the HexbinLayer instance
        const bins = this._hexLayout(data).map(bin => {
            const totalScore = d3.sum(bin, d => d.original.score);
            const avgScore = bin.length ? totalScore / bin.length : 0;
			const meta = bin.map(d => d.metaData);
            bin.score = avgScore;
			bin.metaData = meta;
            return bin;
			
        });

		//console.log('Bins:', bins);
  
        const hexagons = g.selectAll('path.hexbin-hexagon')
            .data(bins, d => `${d.x}:${d.y}`);
  
        hexagons.transition().duration(200)
            .attr('fill', d => this._colorScale(d.score))
            .attr('stroke', 'black')
            .attr('stroke-width', '0.1');
  
        hexagons.enter().append('path')
            .attr('class', 'hexbin-hexagon')
            .attr('d', this._hexLayout.hexagon())
            .attr('transform', d => `translate(${d.x}, ${d.y})`)
            .attr('fill', d => this._colorScale(d.score))
            .attr('stroke', this.options.strokeColor)
            .attr('stroke-width', this.options.strokeWidth)
            .attr('opacity', this.options.opacity)
			//.on("mouseover", d => this._trigger('hover', d))
            //.on("mouseout", d => this.options.onMouseOut(d))
            //.on("click", d => this._trigger('click', d));
  
        hexagons.exit().remove();

		// Initialize a Leaflet LayerGroup to hold markers
		if (this._markerLayer) {
			this._markerLayer.clearLayers();
			console.log('Marker Layer Cleared');
		} else {
			this._markerLayer = L.layerGroup().addTo(this._map);
			console.log('Marker Layer Added');
		}
	
		// Loop through each bin to add a marker at its center
		bins.forEach(bin => {
				// Get the latitude and longitude of the hexagon's center
			const latlngCenter = this._map.layerPointToLatLng(L.point(bin.x, bin.y));

			// Calculate the pixel position of the hexagon's bottom point
			const bottomPointY = bin.y + this._hexLayout.radius() * Math.sqrt(3) / 2;

			// Get the latitude and longitude of the hexagon's bottom point
			const latlngBottom = this._map.layerPointToLatLng(L.point(bin.x, bottomPointY));

			// Create an invisible Leaflet marker at the bottom of the hexagon
			const marker = L.marker(latlngBottom, {
				opacity: 0 // Make the marker invisible
			});
	
			// Add a popup to the marker
			marker.bindPopup(`<strong>Average Score:</strong> ${bin.score}<br><br>${this.processMetaData(bin.metaData)}`, {
				autoPan: false
			});

			// Add an event listener for when the popup is opened
			marker.on("popupopen", function(event) {
				// Find the leaflet-popup-content within the popup and style it
				var popupContent = event.popup.getElement().querySelector('.leaflet-popup-content');
				if (popupContent) {
					popupContent.style.maxHeight = '200px';
					popupContent.style.overflowY = 'auto';
				}
			});
	
			// Add hover event
			marker.on('mouseover', () => {
				if (this.options.onHover) {
					this.options.onHover(bin);
				}
			});
	
			// Add click event
			marker.on('click', () => {
				if (this.options.onClick) {
					this.options.onClick(bin);
				}
				this.highlightClickedHexagon(bin);
			});
	
			// Add marker to the layer group
			marker.addTo(this._markerLayer);
			console.log('bind marker to layer group');
		});

    }
  
    _project(coord) {
		// Debugging line to print input coordinate
		//console.log('Input coordinate:', coord);
	
		// Debugging line to print the map object
		//console.log('Map object:', this._map);
	
		const point = this._map.latLngToLayerPoint([coord[0], coord[1]]);
	
		// Debugging line to print the output point
		//console.log('Projected point:', point);
		return [point.x, point.y];
	}
  
    _getBounds(data) {
		if (!data?.length) {
		  return { min: [0, 0], max: [0, 0] };
		}
		console.log('bounds entered');
	  
		const bounds = [[9999999, 9999999], [-999, -999]];
	  
		data.forEach(({ point: [x, y] }) => {
		  bounds[0][0] = Math.min(bounds[0][0], x);
		  bounds[0][1] = Math.min(bounds[0][1], y);
		  bounds[1][0] = Math.max(bounds[1][0], x);
		  bounds[1][1] = Math.max(bounds[1][1], y);
		});

		const result = { min: bounds[0], max: bounds[1] };

		console.log('bounds result:', result);
		
	  
		return result
	  }
	  
	  
	  getBounds() {
		const data = this._data.map(d => {
		  const lng = this.options.lng(d);
		  const lat = this.options.lat(d);
		  return { o: d, point: [lng, lat] };
		});
		const bounds = this._getBounds(data);
		return [
		  [bounds.min[0], bounds.min[1]],
		  [bounds.max[0], bounds.max[1]]
		];
	}
}

// Factory function for creating HexbinLayer
L.HexbinLayer = HexbinLayer;

L.hexbinLayer = options => new HexbinLayer(options);

























/*

var thirdPi = Math.PI / 3,
    angles = [0, thirdPi, 2 * thirdPi, 3 * thirdPi, 4 * thirdPi, 5 * thirdPi];

L.HexbinHeatmap = L.Layer.extend({
  
  options: {
    radius: 12,
    opacity: 0.5,
    colorScale: d3.scaleSequential(d3.interpolateViridis),
  },
  
  initialize: function(points, options) {
    this.points = points;
    L.setOptions(this, options);
  },

  onAdd: function(map) {
    this.map = map;

    this.svg = d3.create("svg");
    this.g = this.svg.append("g");

    this.container = L.DomUtil.create("div", "leaflet-hexbin-layer leaflet-layer");
    this.container.appendChild(this.svg.node());

    const overlayPane = this.map.getPanes().overlayPane;
    overlayPane.appendChild(this.container);

    this._update();
  },

  _hexbin: function(points, r) {
    var binsById = {};
    var bins = [];
    var dx = r * 2 * Math.sin(thirdPi);
    var dy = r * 1.5;
    
    points.forEach(function(point, i) {
      var x = point[0], y = point[1];
      
      var pj = Math.round(y / dy),
          pi = Math.round(x / dx - (pj & 1) / 2),
          id = pi + "-" + pj,
          bin = binsById[id];

      if (bin) bin.push(point);
      else {
        bin = binsById[id] = [point];
        bin.x = (pi + (pj & 1) / 2) * dx;
        bin.y = pj * dy;
        bins.push(bin);
      }
    });

    return bins;
  },

  _update: function() {
    const self = this;

    var data = this.points.map(function(point) {
      const latlng = new L.LatLng(point.lat, point.lng);
      const layerPoint = self.map.latLngToLayerPoint(latlng);
      return [layerPoint.x, layerPoint.y, point.score];
    });

    var r = this.options.radius;
    var bins = this._hexbin(data, r);
    
    const hex = this.g.selectAll(".hexagon").data(bins, d => d.x + "," + d.y);

    hex.exit().remove();

    const hexEnter = hex.enter().append("path").attr("class", "hexagon");

    hex.merge(hexEnter)
      .attr("d", "m" + angles.map(function(angle) {
        var x1 = Math.sin(angle) * r,
            y1 = -Math.cos(angle) * r;
        return [x1, y1];
      }).join("l") + "z")
      .attr("transform", d => "translate(" + d.x + "," + d.y + ")")
      .style("fill", d => this.options.colorScale(d.length))
      .style("opacity", this.options.opacity);
  },
});

L.hexbinHeatmap = function(points, options) {
  return new L.HexbinHeatmap(points, options);
};





class CustomHexbinLayer extends L.Layer {
	constructor(options = {}) {
	  super(options);
	  L.setOptions(this, options);
	  this._data = this.options.data || [];
	  this._hexLineOpacity = this.options.hexLineOpacity || 0.5;
	  this._hexFillOpacity = this.options.hexFillOpacity || 0.5;
	  this._radius = this.options.radius || 20;
	  this._colorScale = this.options.colorScale || ["#ffffff", "#ff0000"];
	  this._mouseoverFn = this.options.mouseoverFn || function() {};
	  this._clickFn = this.options.clickFn || function() {};
	}
  
	onAdd(map) {
	  this._map = map;
	  this._container = this._initContainer();
	  map.on('moveend zoomend', this.redraw, this);
	  this.redraw();
	}
  
	onRemove(map) {
	  this._destroyContainer();
	  map.off('moveend zoomend', this.redraw, this);
	}
  
	addTo(map) {
	  map.addLayer(this);
	  return this;
	}
  
	_initContainer() {
	  const paneId = 'customHexbinPane';
	  this._map.createPane(paneId);
	  const pane = this._map.getPane(paneId);
	  const container = d3.select(pane).append('svg').attr('class', 'leaflet-layer leaflet-zoom-hide');
	  return container;
	}
  
	_destroyContainer() {
	  this._container.remove();
	}
  
	_calculateHexVertices(radius, x, y) {
	  const vertices = [];
	  for (let i = 0; i < 6; i++) {
		const angle = Math.PI / 3 * i;
		const xVertex = x + radius * Math.cos(angle);
		const yVertex = y + radius * Math.sin(angle);
		vertices.push([xVertex, yVertex]);
	  }
	  return vertices;
	}
  
	_isWithinBounds(x, y, topLeft, bottomRight) {
	  return x >= topLeft.x && x <= bottomRight.x && y >= topLeft.y && y <= bottomRight.y;
	}
  
	_averageScores(scores) {
	  return scores.reduce((acc, val) => acc + val, 0) / scores.length;
	}
  
	redraw() {
	  if (!this._map) return;
  
	  const bounds = this._map.getBounds(),
		topLeft = this._map.latLngToLayerPoint(bounds.getNorthWest()),
		bottomRight = this._map.latLngToLayerPoint(bounds.getSouthEast());
  
	  const zoom = this._map.getZoom();
	  const hexRadius = this._radius * Math.pow(2, (zoom - 10));
  
	  const svg = this._container.attr('width', bottomRight.x - topLeft.x)
		.attr('height', bottomRight.y - topLeft.y)
		.style('left', topLeft.x + 'px')
		.style('top', topLeft.y + 'px');
  
	  const colorScale = d3.scaleLinear()
		.domain([1, 100])
		.range(this._colorScale);
  
	  svg.selectAll('polygon').remove();
  
	  for (let x = 0; x < bottomRight.x - topLeft.x; x += 3 * hexRadius / 2) {
		for (let y = 0; y < bottomRight.y - topLeft.y; y += Math.sqrt(3) * hexRadius) {
		  const adjustedY = y + ((x % (3 * hexRadius) === 0) ? 0 : Math.sqrt(3) * hexRadius / 2);
  
		  if (this._isWithinBounds(x, adjustedY, topLeft, bottomRight)) {
			const vertices = this._calculateHexVertices(hexRadius, x, adjustedY);
  
			const scoresInHex = this._data.filter(point => {
				
			}).map(point => point.score);
  
			const averageScore = this._averageScores(scoresInHex);
  
			const hexagon = svg.append('polygon')
			.attr('class', 'map-hexagon') // Add a class for later identification
			.attr('data-average-score', averageScore) // Store the average score for retrieval
			.attr('points', vertices.join(' '))
			.attr('stroke', 'black')
			.attr('stroke-width', 1)
			.attr('stroke-opacity', this._hexLineOpacity)
			.attr('fill', colorScale(averageScore))
			.attr('fill-opacity', this._hexFillOpacity)
			.on('mouseover', this._mouseoverFn)
			.on('click', this._clickFn);
		  }
		}
	  }
	}
  
	data(newData) {
	  this._data = newData;
	  this.redraw();
	  return this;
	}
}
  
// Factory function
L.customHexbinLayer = options => new CustomHexbinLayer(options);
*/ 
  












/*

// Define a class called HexbinLayer which extends L.Layer.
// L.Layer is likely a Leaflet layer, and this class will act as a custom layer for hexagonal binning.
class HexbinLayer extends L.Layer {
	// Constructor function takes options as an argument with a default empty object.
    // It initializes the hex layout, color scale, and radius scale.
	constructor(options = {}) { 
		// Call the constructor of the superclass L.Layer.    
	  super(options); 

	  // Set options using Leaflet's setOptions method.
	  L.setOptions(this, options);    
		

	  // Initialize hex layout, color scale and radius scale.
	  this._initHexLayout()         
		   ._initColorScale()
		   ._initRadiusScale();
  
	  this._data = [];     // Initialize an empty data array.
	}

    // Initialize the hex layout using D3's hexbin layout generator.
	_initHexLayout() {                     
	  this._hexLayout = d3.hexbin()
		.radius(this.options.radius)
		.x(d => d.point[0])
		.y(d => d.point[1]);
	  return this;
	}

	// Initialize the color scale using D3's scaleLinear.
	_initColorScale() {
		// Calculate step size based on number of colors and max domain value
	  const stepSize = 100 / (this.options.colorRange.length - 1);
	  // Generate domain dynamically based on the number of colors. Domain is an argument of the scaleLinear method.
	  const domainArray = Array.from({ length: this.options.colorRange.length }, (_, i) => 1 + i * stepSize);
		
	  // Set the color scale using D3's scaleLinear method. This allows for color to be passed through the colorRange array in the options.
	  this._colorScale = d3.scaleLinear()
		.domain(domainArray)
		.range(this.options.colorRange)
		.clamp(true);
	  return this;
	}
	
	// Initialize the radius scale using D3's scaleSqrt.
	_initRadiusScale() {
	  this._radiusScale = d3.scaleSqrt()
		.range(this.options.radiusRange)
		// clamp is a method of the scaleSqrt method which restricts the domain and range of the scale to the specified values. true means that the domain will be restricted to the range.
		.clamp(true);
	  return this;
	}
	
	// Add the hexbin layer to a map.
	onAdd(map) {
	  this._map = map;
	  // Create a custom pane for better layer control. When a map is created, a pane called hexbinPane is created which facilitates an svg element.
	  this._container = this._initContainer();
	  map.on('moveend zoomend', this.redraw, this);
	  this.redraw();
	}
	
	// Remove the hexbin layer from the map.
	onRemove(map) {
	  this._destroyContainer();
	  map.off('moveend zoomend', this.redraw, this);
	}
	
	// Shortcut to add this layer to a map.
	addTo(map) {
	  map.addLayer(this);
	  return this;
	}
	
	// Create an SVG container within a custom map pane.
	_initContainer() {
	  const paneId = 'hexbinPane';
	  this._map.createPane(paneId);
	  const pane = this._map.getPane(paneId);
	  const container = d3.select(pane).append('svg').attr('class', 'leaflet-layer leaflet-zoom-hide');
	  return container;
	}
	
	// Remove the SVG container.
	_destroyContainer() {
	  this._container.remove();
	}
	
	// Redraw the hexbins based on new or existing data.
	redraw() {
	  if (!this._map) return;
	  const data = this._data.map(d => ({
		point: this._project([this.options.lng(d), this.options.lat(d)]),
		original: d,
	  }));
	  const bounds = this._getBounds(data);
	  this._updateContainer(bounds);
	  this._createHexagons(data); // bug here
	}
  
	_updateContainer(bounds) {
	  const { min, max } = bounds;
	  const padding = this.options.radius * 2;
	  const width = (max[0] - min[0]) + padding * 2;
	  const height = (max[1] - min[1]) + padding * 2;
	  this._hexLayout.size([width, height]);
	  this._container.attr('width', width).attr('height', height)
		.style('margin-left', `${min[0] - padding}px`)
		.style('margin-top', `${min[1] - padding}px`);
	}
  
	_createHexagons(data) {
	  const bins = this._hexLayout(data);
	  const g = this._container.select('g.hexbin').data([this._map.getZoom()]);
	  const hexagons = g.selectAll('path.hexbin-hexagon').data(bins); // bug here
  
	  hexagons.enter().append('path')
		.merge(hexagons)
		.attr('d', this._hexLayout.hexagon())
		.attr('transform', d => `translate(${d.x}, ${d.y})`)
		.attr('fill', d => this._colorScale(d.length))
		.attr('stroke', 'black')
		.attr('stroke-width', '0.1');
		
	  hexagons.exit().remove();
	}
  
	// Project a coordinate on the map onto the SVG container.
	_project(coord) {
	  const point = this._map.latLngToLayerPoint([coord[1], coord[0]]);
	  return [point.x, point.y];
	}
  
	// Get the bounds of the data. this is used in the _updateContainer method.
	_getBounds(data) {
	  const bounds = d3.extent(data, d => d.point[0]).concat(d3.extent(data, d => d.point[1]));
	  return { min: [bounds[0], bounds[2]], max: [bounds[1], bounds[3]] };
	}
	

	// Update the data and trigger a redraw.
	data(newData) {
	  this._data = newData;
	  this.redraw();
	  return this;
	}
  }
  

  // Expose the HexbinLayer class and a factory function to create new instances.
  L.HexbinLayer = HexbinLayer;
  L.hexbinLayer = options => new HexbinLayer(options);
*/













































/*

class HexbinLayer extends L.Layer {
	constructor(options = {}) {
	  super(options);
	  L.setOptions(this, options);
	  this._value = this.options.value || (d => d.length); // Fallback to d => d.length if value is not provided
	  this._hexLayout = d3.hexbin()
		.radius(this.options.radius)
		.x(d => d.point[0])
		.y(d => d.point[1]);
	  this._data = [];
	  
	  // Calculate step size based on number of colors and max domain value
	  const maxDomainValue = 100;
	  const stepSize = maxDomainValue / (this.options.colorRange.length - 1);

	  // Generate domain dynamically based on the number of colors
	  const domainArray = Array.from({ length: this.options.colorRange.length }, (_, i) => 1 + i * stepSize);

	  this._colorScale = d3.scaleLinear()
	  	.domain(domainArray)  // Explicitly setting the domain to a range between [1, 100]
		.range(this.options.colorRange)
		.clamp(true);
	  this._radiusScale = d3.scaleSqrt()
		.range(this.options.radiusRange)
		.clamp(true);
	}
  
	onAdd(map) {
	  this._map = map;
	  this._container = this._initContainer();
	  map.on('moveend zoomend', this.redraw, this);
	  this.redraw();
	  console.log('Hexbin Layer Added'); 
	}
  
	onRemove(map) {
	  this._destroyContainer();
	  map.off('moveend zoomend', this.redraw, this);
	  this._container = null;
	  this._map = null;
	  this._data = null;
	}
  
	addTo(map) {
	  map.addLayer(this);
	  return this;
	}
  
	_initContainer() {
	  // Create a custom pane for better layer control
        const paneId = 'hexbinPane';
        this._map.createPane(paneId);

        const pane = this._map.getPane(paneId);

        const container = d3.select(pane).append('svg')
            .attr('class', 'leaflet-layer leaflet-zoom-hide');
        return container;
	}
  
	_destroyContainer() {
	  if (this._container) {
		this._container.remove();
	  }
	}

	// (Re)draws the hexbin group
	redraw = () => {
		console.log('Redrawing Hexbins');
		if (!this._map) return;
	
		const { lng, lat, radius } = this.options;
		const zoom = this._map.getZoom();
		const padding = radius * 2;
		
		// Generate mapped data and get bounds
		const data = this._data.map(d => ({
			point: this._project([lng(d), lat(d)]),
			original: d,
		}));
		const bounds = this._getBounds(data);
		
		// Update layout and container
		const { min, max } = bounds;
		const width = (max[0] - min[0]) + padding * 2;
		const height = (max[1] - min[1]) + padding * 2;
	
		this._hexLayout.size([width, height]);
		this._container.attr('width', width).attr('height', height)
					   .style('margin-left', `${min[0] - padding}px`)
					   .style('margin-top', `${min[1] - padding}px`);

	
		// Update SVG groups
		const join = this._container.selectAll('g.hexbin').data([zoom]);
		join.enter().append('g').attr('class', `hexbin zoom-${zoom}`);
		join.attr('transform', `translate(${-min[0] + padding}, ${-min[1] + padding})`);
		join.exit().remove();

		
		
		// Create or update hexagons
		this._createHexagons(join, data);
		}

	
		_createHexagons = (g, data) => {
			const self = this; // Store a reference to the HexbinLayer instance
			const bins = this._hexLayout(data).map(bin => {
				const totalScore = d3.sum(bin, d => d.original.score);
				const avgScore = bin.length ? totalScore / bin.length : 0;
				bin.score = avgScore;
				return bin;
			});

			const bounds = this.getBounds(); // Obtaining bounds
			const min = bounds[0];
			const max = bounds[1];
    
			// Calculate width and height based on bounds
			const width = max[0] - min[0];
			const height = max[1] - min[1];
    
			// Pre-generate hexagons within this bounding box
			

			console.log('Bins:', bins);  // Debug log to inspect bins
		
			const hexagons = g.selectAll('path.hexbin-hexagon')
      		.data(bins, d => `${d.x}:${d.y}`); 
		
			hexagons.transition().duration(200)
			.attr('fill', d => {
				console.log('Score and Color', d.score, this._colorScale(d.score));  // Debug log
				return this._colorScale(d.score);
			})
			.attr('stroke', 'black')
			.attr('stroke-width', '0.1');
		
			hexagons.enter().append('path')
			.attr('class', 'hexbin-hexagon')
			.attr('d', this._hexLayout.hexagon())
			.attr('transform', d => `translate(${d.x}, ${d.y})`)
			.attr('fill', d => this._colorScale(d.score))
			.attr('stroke', 'black')
			.attr('stroke-width', '0.1')
			.attr('opacity', this.options.opacity);
		
			hexagons.exit().remove();
			if (this._container.selectAll('path.hexbin-hexagon').on("mouseover", true)) {
				console.log('hovered')
				hexagons.on("mouseover", function (d) {
					// Call the user's mouseover function
					self.options.hexMouseOver.call(this, d);
					
					// Add or update tooltip
					let tooltip = d3.select("body").select("div.tooltip");
					if (tooltip.empty()) {
						tooltip = d3.select("body").append("div")
							.attr("class", "tooltip")
							.style("position", "absolute")
							.style("z-index", "10")
							.style("background", "#f9f9f9")
							.style("border", "1px solid #d4d4d4")
							.style("border-radius", "5px")
							.style("padding", "5px");
					}
					tooltip.text(`Average Score: ${d.score}`)
						.style("visibility", "visible");
				});
			}
			
			if (this._container.selectAll('path.hexbin-hexagon').on("mouseout", true)) {
				hexagons.on("mouseout", function (d) {
					console.log('hovered out')
					// Call the user's mouseout function
					self.options.hexMouseOut.call(this, d);
		
					// Hide tooltip
					d3.select("body").select("div.tooltip").style("visibility", "hidden");
				});
			}
			
			if (self.options.hexClick) {
				hexagons.on("click", function (d) {
					// Call the user's click function
					self.options.hexClick.call(this, d);
				});
			}
	}

	_project(coord) {
		const point = this._map.latLngToLayerPoint([coord[1], coord[0]]);
		return [point.x, point.y];
	  }
	  
	  _getBounds(data) {
		if (!data?.length) {
		  return { min: [0, 0], max: [0, 0] };
		}
	  
		const bounds = [[999, 999], [-999, -999]];
	  
		data.forEach(({ point: [x, y] }) => {
		  bounds[0][0] = Math.min(bounds[0][0], x);
		  bounds[0][1] = Math.min(bounds[0][1], y);
		  bounds[1][0] = Math.max(bounds[1][0], x);
		  bounds[1][1] = Math.max(bounds[1][1], y);
		});
	  
		return { min: bounds[0], max: bounds[1] };
	  }
	  
	  getBounds() {
		const data = this._data.map(d => {
		  const lng = this.options.lng(d);
		  const lat = this.options.lat(d);
		  return { o: d, point: [lng, lat] };
		});
		const bounds = this._getBounds(data);
		return [
		  [bounds.min[0], bounds.min[1]],
		  [bounds.max[0], bounds.max[1]]
		];
	  }
	  
	  data(newData) {
		this._data = newData || [];
		this.redraw();
		return this;
	  }
	  
	  colorScale(newScale) {
		if (newScale === undefined) {
		  return this._colorScale;
		}
		this._colorScale = newScale;
		this.redraw();
		return this;
	  }
	  
	  radiusScale(newScale) {
		if (newScale === undefined) {
		  return this._radiusScale;
		}
		this._radiusScale = newScale;
		this.redraw();
		return this;
	  }
	  
	  value(valueFn) {
		if (valueFn === undefined) {
		  return this.options.value;
		}
		this.options.value = valueFn;
		this.redraw();
		return this;
	  }
	  
	  hexClick(fn) {
		if (fn === undefined) {
		  return this.options.hexClick;
		}
		this.options.hexClick = fn;
		this._container.selectAll('path.hexbin-hexagon').on("click", fn);
		return this;
	  }
	  
	  hexMouseOver(fn) {
		if (fn === undefined) {
		  return this.options.hexMouseOver;
		}
		this.options.hexMouseOver = fn;
		this._container.selectAll('path.hexbin-hexagon').on("mouseover", fn);
		return this;
	  }
	  
	  hexMouseOut(fn) {
		if (fn === undefined) {
		  return this.options.hexMouseOut;
		}
		this.options.hexMouseOut = fn;
		this._container.selectAll('path.hexbin-hexagon').on("mouseout", fn);
		return this;
	  }
	  
	  setZIndex(zIndex) {
		if (this._container && this._container[0] && this._container[0][0] && this._container[0][0].style) {
		  this._container[0][0].style.zIndex = zIndex;
		}

}
}

L.HexbinLayer = HexbinLayer;

L.hexbinLayer = options => new HexbinLayer(options);
*/