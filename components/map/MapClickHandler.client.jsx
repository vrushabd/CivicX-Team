"use client";

import { useMapEvents } from "react-leaflet";

export default function MapClickHandler({ onPlaceSelected }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onPlaceSelected({
        lat,
        lng,
        place: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      });
    },
  });

  // nothing to render
  return null;
}
