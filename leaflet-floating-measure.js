/* leaflet-floating-measure.js */
(function (factory, window) {
    // Universal Module Definition (UMD) wrapper
    if (typeof define === 'function' && define.amd) {
        define(['leaflet'], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory(require('leaflet'));
    } else if (typeof window !== 'undefined' && window.L) {
        window.L.Control.FloatingMeasure = factory(L);
        window.L.control.floatingMeasure = function(options) {
            return new window.L.Control.FloatingMeasure(options);
        };
    }
}(function (L) {
    
    // Your exact plugin logic goes here
    var FloatingMeasure = L.Control.extend({
        options: {
            position: 'bottomleft',
            activeCursor: 'crosshair',
            onExport: null
        },

        onAdd: function(map) {
            this._map = map;
            this._drawnLayers = L.featureGroup().addTo(map);
            this._measureLabels = L.layerGroup().addTo(map);
            this._editHandles = L.layerGroup().addTo(map);
            this._history = []; 
            this._currentUnit = 'imperial';

            var container = L.DomUtil.create('div', 'leaflet-bar interactive-measure-ctrl collapsed');
            container.innerHTML = `
                <!-- COLLAPSED STATE -->
                <div id="measure-toggle" title="Open Measure Tool">
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21 21H3V3l18 18z"></path><path d="M7 17v-2m4 2v-2m4 2v-2"></path></svg>
                </div>

                <!-- EXPANDED STATE -->
                <div id="measure-panel">
                    <div class="ctrl-drag-handle" title="Drag to move">
                        <svg id="btn-collapse" style="cursor: pointer;" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"><path d="M6 9h12M6 15h12"/></svg>
                    </div>
                    
                    <div class="ctrl-body" id="main-tools">
                        <div class="tool-grid">
                            <button class="tool-btn" id="btn-draw-line" title="Draw Polyline">
                                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><polyline points="4 17 10 11 14 15 20 6"></polyline></svg>
                            </button>
                            <button class="tool-btn" id="btn-draw-poly" title="Draw Polygon">
                                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><path d="M12 2l8.5 6-3.26 10H6.76L3.5 8 12 2z"></path></svg>
                            </button>
                            <button class="tool-btn" id="btn-draw-circle" title="Draw Circle">
                                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle></svg>
                            </button>
                            <button class="tool-btn" id="btn-draw-ellipse" title="Draw Ellipse">
                                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><ellipse cx="12" cy="12" rx="10" ry="6"></ellipse></svg>
                            </button>
                        </div>
                        
                        <div class="tool-separator"></div>
                        
                        <!-- Side-by-side Settings and Help Buttons -->
                        <div style="display: flex; gap: 8px; width: 100%;">
                            <button class="tool-btn" id="btn-settings" title="Settings" style="width: 100%;">
                                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                            </button>
                            <button class="tool-btn" id="btn-help" title="Help" style="width: 100%;">
                                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                            </button>
                        </div>
                    </div>

                    <!-- SETTINGS PANEL -->
                    <div id="settings-tools" style="display: none; flex-direction: column; border-top: 1px solid rgba(255, 255, 255, 0.15); padding: 10px; font-size: 12px; background: transparent;">
                        <div class="settings-row">
                            <label>Units:</label>
                            <select id="shape-unit">
                                <option value="imperial" selected>Imperial</option>
                                <option value="metric">Metric</option>
                            </select>
                        </div>
                        <div class="settings-row">
                            <label>Color:</label>
                            <input type="color" id="shape-color" value="#3388ff" style="width: 40px; height: 20px; padding:0; border:none;">
                        </div>
                        <div class="settings-row">
                            <label>Thickness:</label>
                            <input type="number" id="shape-weight" value="3" min="1" max="10" style="width: 40px;">
                        </div>

                        <div id="export-options-row" style="display: none; justify-content: space-between; align-items: center; margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(255, 255, 255, 0.15);">
                            <label for="chk-include-data" style="cursor: pointer;">Include spatial data?</label>
                            <input type="checkbox" id="chk-include-data" checked style="cursor: pointer;">
                        </div>

                        <button id="btn-export" style="display:flex; align-items:center; justify-content:center; gap:6px;">
                            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                            Export GeoJSON
                        </button>
                        
                        <button id="btn-erase" style="display:flex; align-items:center; justify-content:center; gap:6px;">
                            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"></path><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"></path></svg>
                            Erase Last
                        </button>
                    </div>

                    <!-- HELP PANEL -->
                    <div id="help-tools" style="display: none; flex-direction: column; border-top: 1px solid rgba(255, 255, 255, 0.15); padding: 10px; font-size: 11px; color: #e0e0e0; background: transparent;">
                        <p style="margin: 0 0 6px 0; line-height: 1.4;"><strong>How to Use:</strong></p>
                        <ul style="margin: 0; padding-left: 16px; line-height: 1.4;">
                            <li>Select a tool above.</li>
                            <li>Click the map to place points.</li>
                            <li>Double-click to finish measuring trails or boundaries.</li>
                            <li>Drag red handles to adjust.</li>
                            <li>Use <strong>Erase Last</strong> in the settings panel to remove your most recent shape.</li>
                            <li>Grab the drag handle in the upper right to move this widget around the map.</li>
                        </ul>
                    </div>
                </div>
            `;

            L.DomEvent.disableClickPropagation(container);
            L.DomEvent.disableScrollPropagation(container);

            setTimeout(() => {
                var dragHandle = container.querySelector('.ctrl-drag-handle');
                var draggable = new L.Draggable(container, dragHandle);
                draggable.enable();

                // Unhide the checkbox if an onExport function is configured
                if (typeof this.options.onExport === 'function') {
                    document.getElementById('export-options-row').style.display = 'flex';
                }

                document.getElementById('measure-toggle').addEventListener('click', () => {
                    container.classList.remove('collapsed');
                    container.classList.add('expanded');
                });

                document.getElementById('btn-collapse').addEventListener('click', () => {
                    container.classList.add('collapsed');
                    container.classList.remove('expanded');
                    document.getElementById('settings-tools').style.display = 'none';
                    container.classList.remove('settings-open');
                });

                document.getElementById('btn-settings').addEventListener('click', () => {
                    var settingsPanel = document.getElementById('settings-tools');
                    var helpPanel = document.getElementById('help-tools');
                    var isClosed = settingsPanel.style.display === 'none' || settingsPanel.style.display === '';
                    
                    helpPanel.style.display = 'none'; // Ensure Help is closed
                    settingsPanel.style.display = isClosed ? 'flex' : 'none';
                    
                    if (isClosed) {
                        container.classList.add('settings-open');
                    } else {
                        container.classList.remove('settings-open');
                    }
                });

                // New Help Toggle
                document.getElementById('btn-help').addEventListener('click', () => {
                    var settingsPanel = document.getElementById('settings-tools');
                    var helpPanel = document.getElementById('help-tools');
                    var isClosed = helpPanel.style.display === 'none' || helpPanel.style.display === '';
                    
                    settingsPanel.style.display = 'none'; // Ensure Settings is closed
                    helpPanel.style.display = isClosed ? 'flex' : 'none';
                    
                    if (isClosed) {
                        container.classList.add('settings-open'); // Reusing this class to expand the panel width
                    } else {
                        container.classList.remove('settings-open');
                    }
                });

                document.getElementById('shape-unit').addEventListener('change', (e) => {
                    this._currentUnit = e.target.value;
                    this.recalculateAll(); 
                });
                
                document.getElementById('btn-erase').addEventListener('click', () => this.undoLast());
                document.getElementById('btn-draw-line').addEventListener('click', () => this.startDrawing('polyline'));
                document.getElementById('btn-draw-poly').addEventListener('click', () => this.startDrawing('polygon'));
                document.getElementById('btn-draw-circle').addEventListener('click', () => this.startDrawing('circle'));
                document.getElementById('btn-draw-ellipse').addEventListener('click', () => this.startDrawing('ellipse'));
                // Bind the new Export button
                document.getElementById('btn-export').addEventListener('click', () => this.exportGeoJSON());
            }, 0);

            return container;
        },

        undoLast: function() {
            var last = this._history.pop();
            if (last) {
                this._drawnLayers.removeLayer(last.layer);
                last.labels.clearLayers();
                last.handles.forEach(h => this._editHandles.removeLayer(h));
            }
        },

        recalculateAll: function() {
            this._history.forEach(item => {
                this.updateMeasurements(item.layer, item.type);
            });
            if (this._currentLayer && this._drawType) {
                this.updateMeasurements(this._currentLayer, this._drawType);
            }
        },

        exportGeoJSON: function() {
            if (this._history.length === 0) {
                alert("No measurements to export!");
                return;
            }

            var featureCollection = {
                type: "FeatureCollection",
                features: []
            };

            this._history.forEach(item => {
                var feature = null;
                if (item.type === 'circle') {
                    var latlng = item.layer.getLatLng();
                    feature = {
                        type: "Feature",
                        properties: { shapeType: "circle", radius_meters: item.layer.getRadius() },
                        geometry: { type: "Point", coordinates: [latlng.lng, latlng.lat] }
                    };
                } else {
                    feature = item.layer.toGeoJSON();
                    feature.properties = feature.properties || {};
                    feature.properties.shapeType = item.type;
                }
                if (feature) featureCollection.features.push(feature);
            });

            // Read the checkbox state
            var includeData = document.getElementById('chk-include-data').checked;

            // Check if a custom export handler was provided
            if (typeof this.options.onExport === 'function' && includeData) {
                // Hand the data off to the page's specific logic
                this.options.onExport(featureCollection);
            } else {
                // Fallback to the standard local download
                var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(featureCollection, null, 2));
                var downloadAnchorNode = document.createElement('a');
                downloadAnchorNode.setAttribute("href", dataStr);
                downloadAnchorNode.setAttribute("download", "measurements.geojson");
                document.body.appendChild(downloadAnchorNode); 
                downloadAnchorNode.click();
                downloadAnchorNode.remove();
            }
        },

        getStyle: function() {
            return {
                color: document.getElementById('shape-color').value,
                weight: parseInt(document.getElementById('shape-weight').value, 10)
            };
        },

        startDrawing: function(type) {
            var mapContainer = this._map.getContainer();
            
            // Set the CSS variable based on the options (with a fallback just in case)
            var cursorShape = this.options.activeCursor ? this.options.activeCursor : 'crosshair';
            mapContainer.style.setProperty('--measure-cursor', cursorShape);
            
            // Add the active measuring class to the map container
            L.DomUtil.addClass(mapContainer, 'measuring-active');

            // 1. Remove active class from all buttons
            var allBtns = document.querySelectorAll('.tool-btn');
            allBtns.forEach(btn => btn.classList.remove('active'));

            // 2. Map the shape type to the button ID and add the active class
            var btnId = 'btn-draw-' + (type === 'polyline' ? 'line' : type === 'polygon' ? 'poly' : type);
            var activeBtn = document.getElementById(btnId);
            if (activeBtn) {
                activeBtn.classList.add('active');
            }

            // 1. Clean up any existing listeners and unfinished shapes
            this._map.off('click', this.addVertex, this);
            this._map.off('mousemove', this.updateShape, this);
            if (this._currentLayer && !this._currentLayer._finished) {
                this._drawnLayers.removeLayer(this._currentLayer);
                if (this._currentLayer._labelGroup) this._currentLayer._labelGroup.clearLayers();
            }

            // 2. Initialize the new shape's state
            this._drawType = type;
            this._currentPoints = [];
            var style = this.getStyle();

            // 3. Handle specific shape drawing logic
            if (type === 'polyline' || type === 'polygon') {
                this._currentLayer = (type === 'polygon') ? L.polygon([], style) : L.polyline([], style);
                this._currentLayer._labelGroup = L.layerGroup().addTo(this._measureLabels);
                this._drawnLayers.addLayer(this._currentLayer);
                
                this._map.on('click', this.addVertex, this);
                this._map.once('dblclick', this.finishDrawing, this);
            } else if (type === 'circle' || type === 'ellipse') {
                this._map.once('click', (e) => {
                    this._currentCenter = e.latlng;
                    
                    if (type === 'circle') {
                        this._currentLayer = L.circle(e.latlng, Object.assign({radius: 0}, style));
                    } else {
                        this._currentLayer = L.polygon([], style);
                    }
                    
                    this._currentLayer._labelGroup = L.layerGroup().addTo(this._measureLabels);
                    this._drawnLayers.addLayer(this._currentLayer);

                    this.updateShape = (moveEvent) => {
                        if (type === 'circle') {
                            var r = this._currentCenter.distanceTo(moveEvent.latlng);
                            this._currentLayer.setRadius(r);
                            this._currentLayer._edgeLatLng = moveEvent.latlng;
                        } else {
                            // Calculate Ellipse points
                            var rx = Math.abs(moveEvent.latlng.lng - this._currentCenter.lng);
                            var ry = Math.abs(moveEvent.latlng.lat - this._currentCenter.lat);
                            var pts = [];
                            for (var i = 0; i < 24; i++) {
                                var theta = (i / 24) * 2 * Math.PI;
                                pts.push(L.latLng(
                                    this._currentCenter.lat + ry * Math.sin(theta),
                                    this._currentCenter.lng + rx * Math.cos(theta)
                                ));
                            }
                            this._currentLayer.setLatLngs(pts);
                        }
                        this.updateMeasurements(this._currentLayer, type);
                    };

                    this._map.on('mousemove', this.updateShape);
                    
                    // Add a slight delay before listening for the finishing click
                    setTimeout(() => {
                        this._map.once('click', (clickEvent) => {
                            this._map.off('mousemove', this.updateShape);
                            this.finishDrawing(clickEvent);
                        });
                    }, 100); 
                });
            }
            
            // Disable double click zoom while drawing
            this._map.doubleClickZoom.disable(); 
        },

        addVertex: function(e) {
            if (this._currentPoints.length > 0) {
                var lastPt = this._currentPoints[this._currentPoints.length - 1];
                if (lastPt.lat === e.latlng.lat && lastPt.lng === e.latlng.lng) {
                    return; 
                }
            }
            this._currentPoints.push(e.latlng);
            this._currentLayer.setLatLngs(this._currentPoints);
            this.updateMeasurements(this._currentLayer, this._drawType);
        },

        finishDrawing: function(e) {
            if(e) L.DomEvent.stop(e); 
            
            // Remove the active measuring class from the map container
            L.DomUtil.removeClass(this._map.getContainer(), 'measuring-active');

            //Clear Active State from All Buttons
            var allBtns = document.querySelectorAll('.tool-btn');
            allBtns.forEach(btn => btn.classList.remove('active'));

            // Clean up drawing listeners
            this._map.off('click', this.addVertex, this);
            this._map.doubleClickZoom.enable();
            
            // Make the finished shape editable and push to history
            if (this._currentLayer) {
                this._currentLayer._finished = true;
                this.makeLayerEditable(this._currentLayer, this._drawType);
                this._currentLayer = null;
            }
        },

        makeLayerEditable: function(layer, type) {
            var handles = [];
            var handleIcon = L.divIcon({
                className: 'measure-vertex-handle',
                html: '', 
                iconSize: [6, 6], 
                iconAnchor: [3, 3] 
            });

            if (type === 'circle') {
                var centerMarker = L.marker(layer.getLatLng(), { draggable: true, icon: handleIcon }).addTo(this._editHandles);
                var edgeMarker = L.marker(layer._edgeLatLng || layer.getLatLng(), { draggable: true, icon: handleIcon }).addTo(this._editHandles);
                handles.push(centerMarker, edgeMarker);

                centerMarker.on('drag', (e) => {
                    layer.setLatLng(e.target.getLatLng());
                    this.updateMeasurements(layer, type);
                });
                edgeMarker.on('drag', (e) => {
                    layer.setRadius(layer.getLatLng().distanceTo(e.target.getLatLng()));
                    this.updateMeasurements(layer, type);
                });
            } else {
                var latlngs = layer.getLatLngs();
                var pts = (latlngs[0] instanceof Array) ? latlngs[0] : latlngs;

                pts.forEach((latlng, index) => {
                    var marker = L.marker(latlng, { draggable: true, icon: handleIcon }).addTo(this._editHandles);
                    handles.push(marker);

                    marker.on('drag', (e) => {
                        pts[index] = e.target.getLatLng();
                        layer.setLatLngs(latlngs);
                        this.updateMeasurements(layer, type);
                    });
                });
            }
            this._history.push({ layer: layer, labels: layer._labelGroup, handles: handles, type: type });
        },

        updateMeasurements: function(layer, type) {
            var labels = layer._labelGroup;
            labels.clearLayers();

            if (type === 'circle') {
                var r = layer.getRadius();
                if (r > 0) {
                    var area = Math.PI * r * r;
                    this.createLabel(layer.getLatLng(), `Area: ${this.formatArea(area)}<br>Radius: ${this.formatDistance(r)}`, labels);
                }
                return;
            }

            var latlngs = layer.getLatLngs();
            var pts = (latlngs[0] instanceof Array) ? latlngs[0] : latlngs;
            if (pts.length < 2) return;

            var totalDistance = 0;

            if (type === 'polyline' || type === 'polygon') {
                for (var i = 0; i < pts.length - 1; i++) {
                    var p1 = pts[i];
                    var p2 = pts[i + 1];
                    var dist = p1.distanceTo(p2);
                    totalDistance += dist;
                    var midPoint = L.latLng((p1.lat + p2.lat) / 2, (p1.lng + p2.lng) / 2);
                    this.createLabel(midPoint, this.formatDistance(dist), labels);
                }
            }

            if (type === 'polygon' || type === 'ellipse') {
                var area = this.ringArea(pts);
                var center = layer.getBounds().getCenter();
                
                if (type === 'polygon') {
                    var closingDist = pts[pts.length - 1].distanceTo(pts[0]);
                    totalDistance += closingDist;
                    var midPointClose = L.latLng((pts[pts.length - 1].lat + pts[0].lat) / 2, (pts[pts.length - 1].lng + pts[0].lng) / 2);
                    this.createLabel(midPointClose, this.formatDistance(closingDist), labels);
                }
                this.createLabel(center, "Area: " + this.formatArea(area), labels);
            } else if (type === 'polyline' && pts.length > 1) {
                var offsetStyle = 'transform: translate(10px, -50%);'; 
                this.createLabel(pts[pts.length - 1], "Total: " + this.formatDistance(totalDistance), labels, offsetStyle);
            }
        },

        createLabel: function(latlng, text, group, customStyle) {
            var styleStr = customStyle ? ' style="' + customStyle + '"' : '';
            L.marker(latlng, {
                interactive: false,
                icon: L.divIcon({
                    className: 'measure-label',
                    html: '<div class="measure-label-text"' + styleStr + '>' + text + '</div>',
                    iconSize: [0, 0]
                })
            }).addTo(group);
        },

        formatDistance: function(d) {
            if (this._currentUnit === 'imperial') {
                var feet = d * 3.28084;
                if (feet > 5280) return (feet / 5280).toFixed(2) + ' mi';
                return feet.toFixed(1) + ' ft';
            } else {
                if (d > 1000) return (d / 1000).toFixed(2) + ' km';
                return d.toFixed(1) + ' m';
            }
        },

        formatArea: function(a) {
            if (this._currentUnit === 'imperial') {
                var sqft = a * 10.7639;
                if (sqft > 27878400) return (sqft / 27878400).toFixed(2) + ' mi&sup2;';
                if (sqft > 43560) return (sqft / 43560).toFixed(2) + ' ac';
                return sqft.toFixed(1) + ' ft&sup2;';
            } else {
                if (a > 1000000) return (a / 1000000).toFixed(2) + ' km&sup2;';
                if (a > 10000) return (a / 10000).toFixed(2) + ' ha';
                return a.toFixed(1) + ' m&sup2;';
            }
        },

        ringArea: function(coords) {
            var rad = function(_) { return _ * Math.PI / 180; };
            var area = 0, RADIUS = 6378137;
            if (coords.length > 2) {
                for (var i = 0; i < coords.length; i++) {
                    var p1 = coords[(i === 0) ? coords.length - 1 : i - 1];
                    var p2 = coords[i];
                    var p3 = coords[(i === coords.length - 1) ? 0 : i + 1];
                    area += (rad(p3.lng) - rad(p1.lng)) * Math.sin(rad(p2.lat));
                }
                area = area * RADIUS * RADIUS / 2;
            }
            return Math.abs(area);
        }
    });

    return FloatingMeasure;
}, window));