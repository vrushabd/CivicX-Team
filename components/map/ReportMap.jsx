"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import MapClickHandler from "./MapClickHandler.client";

const defaultCenter = { lat: 20.5937, lng: 78.9629 }; // India

// Helper: recenter map whenever coords changes
function RecenterOnCoords({ coords }) {
  const map = useMap();

  useEffect(() => {
    if (!coords) return;
    map.setView([coords.lat, coords.lng], 14);
  }, [coords, map]);

  return null;
}

const ReportMap = ({ coords, locationText, onLocationChange }) => {
  const [markerPos, setMarkerPos] = useState(coords);

  // Fix Leaflet default marker icons
  useEffect(() => {
    const iconDefault = L.Icon.Default.prototype;

    try {
      delete iconDefault._getIconUrl;
    } catch {
      // ignore
    }

    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);

  // keep marker in sync with external coords
  useEffect(() => {
    if (coords) setMarkerPos(coords);
  }, [coords]);

  const center = coords || defaultCenter;

  return (
    <div className="w-full h-64 rounded overflow-hidden shadow-sm">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={14}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* Recenter whenever coords prop changes */}
        <RecenterOnCoords coords={coords} />

        {/* Click on map to set marker & form location */}
        <MapClickHandler
          onPlaceSelected={(data) => {
            const newCoords = { lat: data.lat, lng: data.lng };
            setMarkerPos(newCoords);
            onLocationChange(data.place, newCoords);
          }}
        />

        {markerPos && (
          <Marker position={[markerPos.lat, markerPos.lng]}>
            <Popup>
              {locationText ||
                `${markerPos.lat.toFixed(6)}, ${markerPos.lng.toFixed(6)}`}
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default ReportMap;
