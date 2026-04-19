import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MapViewProps {
  center?: [number, number];
  zoom?: number;
  location?: {
    lat: number;
    lng: number;
    name?: string;
    address?: string;
  };
  height?: string;
  onLocationSelect?: (lat: number, lng: number) => void;
}

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

const MapView: React.FC<MapViewProps> = ({
  center = [33.6844, 73.0479],
  zoom = 13,
  location,
  height = '300px',
  onLocationSelect
}) => {
  const mapRef = useRef<L.Map>(null);
  const position: [number, number] = location 
    ? [location.lat, location.lng] 
    : center;

const IslamabadCenter: [number, number] = [33.6844, 73.0479];

  return (
    <MapContainer
      center={position}
      zoom={zoom}
      style={{ height, width: '100%', borderRadius: '1rem' }}
      ref={mapRef}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <RecenterMap center={position} />
      {location && (
        <Marker position={[location.lat, location.lng]} icon={customIcon}>
          <Popup>
            <div className="text-center">
              <p className="font-bold">{location.name}</p>
              {location.address && <p className="text-sm text-gray-600">{location.address}</p>}
            </div>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
};

export default MapView;