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
		joinedData.sort((a, b) => (a.original.score > b.original.score) ? -1 : 1);

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
