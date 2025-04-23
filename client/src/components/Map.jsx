import React, { useEffect, useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  ScaleControl,
  GeoJSON,
  useMap,
} from "react-leaflet";
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "leaflet/dist/leaflet.css";
import Papa from "papaparse";
import * as turf from "@turf/turf";
import "./Map.css";

// Constants
const DEFAULT_CENTER = [25.2048, 55.2708];
const DEFAULT_ZOOM = 12;
const TYPE_COLORS = {
  Villa: "#FF3C3C",
  Apartment: "#FFBD43",
  Townhouse: "#59DE8C",
  Penthouse: "#A593E0",
  default: "#888",
};

// Custom CircleMarker component with selection styling
const CustomCircleMarker = ({ property, selectedProperty, handleMarkerClick, getRadius, getColor }) => {
  const fillColor = getColor(property.type);
  const isSelected = selectedProperty?.name === property.name;

  return (
    <CircleMarker
      center={[property.latitude, property.longitude]}
      radius={getRadius(property.price)}
      fillOpacity={0.8}
      color={isSelected ? "#000" : "#333"}
      fillColor={fillColor}
      eventHandlers={{ 
        click: (e) => handleMarkerClick(property, e),
      }}
      className={isSelected ? "selected-marker" : ""}
      pathOptions={{
        className: isSelected ? "selected-marker-path" : ""
      }}
    >
      {isSelected && (
        <Popup>
          <div>
            <h4>{property.type}</h4>
            <p>Price: AED {property.price.toLocaleString()}</p>
          </div>
        </Popup>
      )}
    </CircleMarker>
  );
};

// DubaiAreas Component
function DubaiAreas({ geoJsonData, mode, setSelectedArea, selectedArea }) {
  const map = useMap();
  const geoJsonRef = useRef();
  const layersRef = useRef({});

  // Style definitions
  const selectedStyle = {
    weight: 4,
    color: "#ff0000",
    fillColor: "#ff7800",
    fillOpacity: 0.7,
  };

  const defaultStyle = {
    fillColor: "#3388ff",
    weight: 2,
    opacity: 1,
    color: "#3388ff",
    fillOpacity: 0.2,
  };

  // Safe layer styling function
  const safeSetStyle = (layer, style) => {
    if (layer && typeof layer.setStyle === 'function') {
      layer.setStyle(style);
    }
  };

  // Handle area click
  const handleAreaClick = (e, feature) => {
    if (mode !== 'area') return;
    e.originalEvent.preventDefault();
    e.originalEvent.stopPropagation();

    const layer = e.target;
    
    // Reset all layers to default style
    Object.values(layersRef.current).forEach(l => {
      safeSetStyle(l, defaultStyle);
    });
    
    // Set selected style for clicked layer
    safeSetStyle(layer, selectedStyle);
    setSelectedArea(feature.properties);
    zoomToFeature(e);
  };

  // Zoom to feature bounds
  const zoomToFeature = (e) => {
    map.fitBounds(e.target.getBounds(), { padding: [100, 100] });
  };

  // Initialize layers and styles
  const onEachFeature = (feature, layer) => {
    // Store layer reference
    layersRef.current[feature.properties.name] = layer;
    
    // Set initial style
    safeSetStyle(layer, 
      selectedArea && feature.properties.name === selectedArea.name 
        ? selectedStyle 
        : defaultStyle
    );

    layer.on({
      click: (e) => handleAreaClick(e, feature),
    });

    if (feature.properties?.name) {
      layer.bindTooltip(feature.properties.name);
    }
  };

  // Update styles when selectedArea changes
  useEffect(() => {
    if (!geoJsonData) return;
    
    Object.entries(layersRef.current).forEach(([name, layer]) => {
      safeSetStyle(layer, 
        selectedArea && name === selectedArea.name 
          ? selectedStyle 
          : defaultStyle
      );
    });
  }, [selectedArea, geoJsonData]);

  return geoJsonData && mode === 'area' ? (
    <GeoJSON
      ref={geoJsonRef}
      data={geoJsonData}
      style={defaultStyle}
      onEachFeature={onEachFeature}
    />
  ) : null;
}

// Main Map Component
const Map = ({ csvUrl, geoJsonUrl }) => {
  const [data, setData] = useState([]);
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [selectedArea, setSelectedArea] = useState(null);
  const [panelVisible, setPanelVisible] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1 });
  const [highlightedArea, setHighlightedArea] = useState(null);
  const [mode, setMode] = useState('property'); // 'property' or 'area'
  const mapRef = useRef();
  const panelRef = useRef();

  // Handle click outside to deselect
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        // Check if click was on the map (not on a marker or area)
        const mapContainer = document.querySelector('.leaflet-container');
        if (mapContainer && mapContainer.contains(e.target)) {
          setSelectedProperty(null);
          setSelectedArea(null);
          setPanelVisible(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get properties within a specific area
  const getPropertiesInArea = (areaFeature, properties) => {
    if (!areaFeature || !properties) return [];
    
    try {
      const polygon = turf.polygon(areaFeature.geometry.coordinates);
      return properties.filter(property => {
        const point = turf.point([property.longitude, property.latitude]);
        return turf.booleanPointInPolygon(point, polygon);
      });
    } catch (error) {
      console.error("Error in spatial calculation:", error);
      return [];
    }
  };

  // Calculate area statistics
  const calculateAreaStats = (areaFeature) => {
    if (!areaFeature || !data) return null;
    
    const propertiesInArea = getPropertiesInArea(areaFeature, data);
    if (propertiesInArea.length === 0) return null;

    // Calculate average price
    const avgPrice = propertiesInArea.reduce((sum, p) => sum + p.price, 0) / propertiesInArea.length;
    
    // Calculate average price per sqft
    const avgPricePerSqft = propertiesInArea.reduce((sum, p) => sum + (p.price / p.size_sqft), 0) / propertiesInArea.length;
    
    // Calculate price growth (if historical data exists)
    const growth = propertiesInArea.reduce((sum, p) => {
      const hasHistory = p['2025'] && p['2015'];
      return sum + (hasHistory ? ((p['2025'] - p['2015']) / p['2015']) * 100 : 0);
    }, 0) / propertiesInArea.length;

    // Calculate price trend data
    const priceTrend = Array.from({ length: 12 }, (_, i) => {
      const year = (2015 + i).toString();
      const yearData = propertiesInArea.filter(p => p[year]);
      const avg = yearData.length > 0 
        ? yearData.reduce((sum, p) => sum + parseFloat(p[year]), 0) / yearData.length
        : null;
      return { year, price: avg };
    }).filter(item => item.price !== null);

    return {
      propertyCount: propertiesInArea.length,
      avgPrice,
      avgPricePerSqft,
      growth,
      priceTrend
    };
  };

  // Data fetching effects
  useEffect(() => {
    if (!csvUrl) return;

    Papa.parse(csvUrl, {
      download: true,
      header: true,
      complete: (results) => {
        const parsedData = results.data
          .filter((row) => row.latitude && row.longitude && row["2025"])
          .map((row) => ({
            ...row,
            name: row.name,
            latitude: parseFloat(row.latitude),
            longitude: parseFloat(row.longitude),
            price: parseFloat(row["2025"]),
            bedrooms: parseInt(row.no_bedrooms),
            bathrooms: parseInt(row.no_bathrooms),
            size_sqft: parseInt(row.area),
            type: row.type,
            address: row.address,
          }));

        if (parsedData.length > 0) {
          const prices = parsedData.map((d) => d.price);
          setPriceRange({
            min: Math.min(...prices),
            max: Math.max(...prices),
          });
          setData(parsedData);
        }
      },
    });
  }, [csvUrl]);

  useEffect(() => {
    if (!geoJsonUrl) return;
    fetch(geoJsonUrl)
      .then((response) => response.json())
      .then((data) => setGeoJsonData(data))
      .catch((error) => console.error("Error loading GeoJSON:", error));
  }, [geoJsonUrl]);

  // Helper functions
  const getRadius = (price) => {
    const { min, max } = priceRange;
    const logMin = Math.log(min + 1);
    const logMax = Math.log(max + 1);
    const logPrice = Math.log(price + 1);
    const normalized = (logPrice - logMin) / (logMax - logMin);
    return 2 + normalized * 20;
  };

  const getColor = (type) => {
    const normalizedType = type.toLowerCase();
    if (normalizedType.includes("villa")) return TYPE_COLORS.Villa;
    if (normalizedType.includes("apartment")) return TYPE_COLORS.Apartment;
    if (normalizedType.includes("townhouse")) return TYPE_COLORS.Townhouse;
    if (normalizedType.includes("penthouse")) return TYPE_COLORS.Penthouse;
    return TYPE_COLORS.default;
  };

  const handleMarkerClick = (property, e) => {
    if (mode !== 'property') return;
    e.originalEvent.stopPropagation();
    
    // Toggle selection if clicking the same property
    if (selectedProperty && selectedProperty.name === property.name) {
      setSelectedProperty(null);
      setPanelVisible(false);
    } else {
      setSelectedProperty(property);
      setSelectedArea(null);
      setPanelVisible(true);
    }
  };

  const handleAreaClick = (area) => {
    if (!geoJsonData) return;
    
    // Find the full area feature from geoJsonData
    const areaFeature = geoJsonData.features.find(f => f.properties.name === area.name);
    if (!areaFeature) return;
    
    // Calculate statistics
    const stats = calculateAreaStats(areaFeature);
    
    setSelectedArea({
      ...area,
      stats
    });
    setSelectedProperty(null);
    setPanelVisible(true);
  };

  const closePanel = () => {
    setSelectedProperty(null);
    setSelectedArea(null);
    setPanelVisible(false);
  };

  const prepareChartData = (property) => {
    if (!property) return [];
    const years = Array.from({ length: 12 }, (_, i) => (2015 + i).toString());
    return years
      .map((year) => ({
        year,
        price: property[year] ? parseFloat(property[year]) : null,
      }))
      .filter((item) => item.price !== null);
  };

  // Render Property Panel
  const renderPropertyPanel = () => (
    <div 
      className={`side-panel-alt ${panelVisible ? "visible" : ""}`}
      ref={panelRef}
    >
      <div className="panel-header">
        <button className="close-btn" onClick={closePanel}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {selectedProperty ? (
          <div className="property-header">
            <span
              className="property-type-badge"
              style={{ backgroundColor: getColor(selectedProperty.type) }}
            >
              {selectedProperty.type}
            </span>
            <h2>{selectedProperty.name}</h2>
            <p className="property-address">{selectedProperty.address}</p>
          </div>
        ) : selectedArea ? (
          <div className="property-header">
            <h2>{selectedArea.name}</h2>
            <p className="property-address">{highlightedArea}</p>
          </div>
        ) : null}
      </div>

      {selectedProperty ? (
        <div className="property-content">
          <div className="price-highlight">
            <div className="price-value">
              AED {selectedProperty.price.toLocaleString()}
            </div>
            <div className="price-per-sqft">
              AED {Math.round(selectedProperty.price / selectedProperty.size_sqft).toLocaleString()} per sq.ft.
            </div>
          </div>

          <div className="property-stats">
            <div className="stat-item">
              <div className="stat-value">{selectedProperty.bedrooms}</div>
              <div className="stat-label">Bedrooms</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{selectedProperty.bathrooms}</div>
              <div className="stat-label">Bathrooms</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">
                {selectedProperty.size_sqft.toLocaleString()}
              </div>
              <div className="stat-label">Sq. Ft.</div>
            </div>
          </div>

          <div className="section-divider"></div>

          <div className="chart-section">
            <h3 className="section-title">Price History</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={prepareChartData(selectedProperty)}>
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4d0085" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#4d0085" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#666" }} tickMargin={5} axisLine={false} />
                  <YAxis
                    tickFormatter={(value) => `AED ${(value / 1000000).toFixed(1)}M`}
                    tick={{ fontSize: 11, fill: "#666" }}
                    tickMargin={5}
                    axisLine={false}
                  />
                  <Tooltip
                    formatter={(value) => [`AED ${value.toLocaleString()}`, "Price"]}
                    labelFormatter={(year) => `Year: ${year}`}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                      padding: "8px 12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke="#4d0085"
                    strokeWidth={2}
                    fill="url(#colorGradient)"
                    fillOpacity={1}
                    activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
                    name="Price"
                  />
                  {selectedProperty["2026"] && (
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="#82ca9d"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Predicted 2026"
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="section-divider"></div>

          <div className="action-buttons">
            <button className="primary-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Contact Agent
            </button>
            <button className="secondary-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 8V12L15 15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Schedule Visit
            </button>
          </div>
        </div>
      ) : selectedArea ? (
        <div className="property-content">
          <div className="price-highlight">
            <div className="price-value">
              Area Statistics
            </div>
            <div className="price-per-sqft">
              {selectedArea.name}
            </div>
          </div>

          <div className="property-stats">
            <div className="stat-item">
              <div className="stat-value">{selectedArea.stats?.propertyCount || 0}</div>
              <div className="stat-label">Properties</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">
                AED {selectedArea.stats?.avgPrice ? Math.round(selectedArea.stats.avgPrice).toLocaleString() : 'N/A'}
              </div>
              <div className="stat-label">Avg. Price</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">
                {selectedArea.stats?.growth ? `${Math.round(selectedArea.stats.growth)}%` : 'N/A'}
              </div>
              <div className="stat-label">Growth</div>
            </div>
          </div>

          <div className="section-divider"></div>

          <div className="chart-section">
            <h3 className="section-title">Area Price Trend</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={selectedArea.stats?.priceTrend || []}>
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4d0085" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#4d0085" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#666" }} tickMargin={5} axisLine={false} />
                  <YAxis
                    tickFormatter={(value) => `AED ${(value / 1000000).toFixed(1)}M`}
                    tick={{ fontSize: 11, fill: "#666" }}
                    tickMargin={5}
                    axisLine={false}
                  />
                  <Tooltip
                    formatter={(value) => [`AED ${value.toLocaleString()}`, "Price"]}
                    labelFormatter={(year) => `Year: ${year}`}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                      padding: "8px 12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke="#4d0085"
                    strokeWidth={2}
                    fill="url(#colorGradient)"
                    fillOpacity={1}
                    activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
                    name="Price"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="section-divider"></div>

          <div className="action-buttons">
            <button
              className="primary-btn"
              onClick={() => setMode('property')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 12H21M3 6H21M3 18H21"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              View Properties
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );

  return (
    <div className="map-container">
      <div className="mode-toggle">
        <button
          className={`toggle-btn ${mode === 'property' ? 'active' : ''}`}
          onClick={() => setMode('property')}
        >
          Properties
        </button>
        <button
          className={`toggle-btn ${mode === 'area' ? 'active' : ''}`}
          onClick={() => setMode('area')}
        >
          Areas
        </button>
      </div>

      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        whenCreated={(map) => { mapRef.current = map; }}
        onClick={() => {
          setSelectedProperty(null);
          setSelectedArea(null);
          setPanelVisible(false);
        }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <ScaleControl position="bottomleft" />

        {mode === 'property' && data.map((property, index) => (
          <CustomCircleMarker
            key={index}
            property={property}
            selectedProperty={selectedProperty}
            handleMarkerClick={handleMarkerClick}
            getRadius={getRadius}
            getColor={getColor}
          />
        ))}

        <DubaiAreas
          geoJsonData={geoJsonData}
          setHighlightedArea={setHighlightedArea}
          mode={mode}
          setSelectedArea={handleAreaClick}
          selectedArea={selectedArea}
        />
      </MapContainer>

      {renderPropertyPanel()}
    </div>
  );
};

export default Map;