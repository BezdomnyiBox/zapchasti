import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function DashboardPicker() {
  const orders = [
    { id: 1, lat: 55.751244, lng: 37.618423 },
    { id: 2, lat: 55.761244, lng: 37.628423 },
  ];

  return (
    <MapContainer center={[55.751244, 37.618423]} zoom={12} style={{ height: "80vh" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {orders.map((o) => (
        <Marker key={o.id} position={[o.lat, o.lng]} />
      ))}
    </MapContainer>
  );
}