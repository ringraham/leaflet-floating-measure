# Leaflet Floating Measure

A highly interactive, draggable measurement and drawing control for Leaflet.js. 

Traditional Leaflet controls are rigidly pinned to the map's corners, which can cause UI stacking issues and block important map features. **Leaflet Floating Measure** solves this by providing a fully movable widget. Users can drag the tool anywhere on the screen, measure distances and areas, customize their drawings, and export the results to GeoJSON.

Originally built for [enjoythemaps.com](https://www.enjoythemaps.com).

## ✨ Key Features

* **Draggable UI:** Grab the handle and move the control anywhere on the map to prevent visual clutter.
* **Multiple Geometries:** Draw and measure Polylines, Polygons, Circles, and Ellipses.
* **Dynamic Editing:** Easily adjust shapes after drawing using interactive red drag handles; measurements update in real-time.
* **Customizable Styles:** Users can change the line color and thickness on the fly.
* **Unit Switching:** Toggle seamlessly between Imperial and Metric measurements.
* **Advanced GeoJSON Export:** Download drawn shapes directly to a local `.geojson` file.
* **Backend Export Hook:** Developers can pass an `onExport` callback to intercept the GeoJSON, perform spatial queries (e.g., PostGIS `ST_Within`), and return enriched datasets to the user.

## 📦 Installation

Include the CSS and JavaScript files in your HTML document after loading Leaflet.

```html
<!-- CSS -->
<link rel="stylesheet" href="path/to/leaflet-floating-measure.css" />

<!-- JS -->
<script src="path/to/leaflet-floating-measure.js"></script>
```

## 🚀 Basic Usage

To add the standard floating measure tool to your map, simply initialize it and add it to your Leaflet map instance:

```javascript
var map = L.map('map').setView([44.3386, -68.2733], 11);

// Initialize with default settings
var measureControl = L.control.floatingMeasure().addTo(map);
```

## ⚙️ Advanced Configuration (Options)

You can customize the control by passing an options object during initialization.

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `position` | String | `'bottomleft'` | The initial corner position of the collapsed control. |
| `activeCursor` | String | `'crosshair'` | The CSS cursor to display while drawing is active (e.g., `'url("pencil.png") 0 16, crosshair'`). |
| `onExport` | Function | `null` | A callback function to handle server-side spatial queries when the user clicks Export. |

### Example: Custom Cursor and Backend Export Hook

If you want to perform server-side spatial queries (like finding all database points within a drawn polygon) before the user downloads their file, utilize the `onExport` hook. 

Providing this hook automatically reveals an "Include spatial data?" checkbox in the UI, giving the user the choice between a simple local shape download or a complex database query.

```javascript
var measureControl = L.control.floatingMeasure({
    position: 'topright',
    activeCursor: 'crosshair',
    
    // Custom backend export handling
    onExport: async function(geojsonData) {
        try {
            // Send the drawn shapes to your backend API
            const response = await fetch('/api/export-enriched-geojson', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(geojsonData)
            });

            if (!response.ok) throw new Error("Network error");
            
            // Receive the enriched dataset (shapes + queried points)
            const enrichedData = await response.json();

            // Trigger the download in the browser
            var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(enrichedData, null, 2));
            var dlNode = document.createElement('a');
            dlNode.href = dataStr;
            dlNode.download = "measurements_and_events.geojson";
            document.body.appendChild(dlNode); 
            dlNode.click();
            dlNode.remove();

        } catch (error) {
            console.error("Export failed:", error);
            alert("Error enriching the export data.");
        }
    }
}).addTo(map);
```

## 🛠️ User Interface Guide

1. **Open the Tool:** Click the measurement icon in the map corner.
2. **Move the Tool:** Grab the double-line handle in the upper right of the panel to drag it.
3. **Draw:** Click a tool (Line, Polygon, Circle, Ellipse). Click on the map to place points. Double-click to finish lines and polygons.
4. **Settings:** Click the gear icon to change units, adjust colors, export to GeoJSON, or erase the last drawn shape.
5. **Help:** Click the question mark icon for quick on-screen instructions.
