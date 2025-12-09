"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Badge } from "@/components/ui/badge";

const defaultCenter = { lat: 20.5937, lng: 78.9629 }; // India

// Helper to recenter map when selected location changes
function RecenterOnCoords({ coords }) {
    const map = useMap();

    useEffect(() => {
        if (!coords) return;
        map.setView([coords.lat, coords.lng], 16); // Zoom in closer for specific location
    }, [coords, map]);

    return null;
}

const AdminMap = ({ reports, selectedLocationCoords, onMarkerClick }) => {
    // Fix Leaflet icons
    useEffect(() => {
        const iconDefault = L.Icon.Default.prototype;
        delete iconDefault._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
            iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
            shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });
    }, []);

    const center = selectedLocationCoords || defaultCenter;
    const zoom = selectedLocationCoords ? 16 : 5;

    return (
        <div className="w-full h-full rounded-lg overflow-hidden shadow-md">
            <MapContainer
                center={[center.lat, center.lng]}
                zoom={zoom}
                style={{ height: "100%", width: "100%" }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                <RecenterOnCoords coords={selectedLocationCoords} />

                {/* Render Marker for Searched Location if provided */}
                {selectedLocationCoords && (
                    <Marker position={[selectedLocationCoords.lat, selectedLocationCoords.lng]}>
                        <Popup>
                            <div className="p-2 space-y-2">
                                <h3 className="font-semibold text-sm">Selected Location</h3>
                                <p className="text-xs text-gray-500">Searched Address</p>
                            </div>
                        </Popup>
                    </Marker>
                )}

                {reports.map((report) => (
                    report.coords && (
                        <Marker
                            key={report.id}
                            position={[report.coords.lat, report.coords.lng]}
                            eventHandlers={{
                                click: () => onMarkerClick && onMarkerClick(report),
                            }}
                        >
                            <Popup>
                                <div className="p-2 space-y-2 min-w-[200px]">
                                    <h3 className="font-semibold text-sm">{report.title}</h3>
                                    <p className="text-xs text-gray-500 line-clamp-2">{report.location}</p>
                                    <Badge variant="outline" className="text-xs capitalize">
                                        {report.status}
                                    </Badge>
                                    {report.image && (
                                        <img
                                            src={report.image}
                                            alt="Evidence"
                                            className="w-full h-24 object-cover rounded mt-1"
                                        />
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    )
                ))}
            </MapContainer>
        </div>
    );
};

export default AdminMap;
