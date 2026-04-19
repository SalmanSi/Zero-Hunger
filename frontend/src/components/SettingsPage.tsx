import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Save, 
  Loader2,
  Search,
  CheckCircle2,
  AlertCircle,
  Heart,
  Navigation,
  Locate
} from 'lucide-react';
import { auth } from '../utils/api';
import { searchLocations, isValidPakistanLocation, SearchResult } from '../utils/geocode';

const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface SettingsPageProps {
  user: {
    id: string;
    name: string;
    email: string;
    address: string;
    phone: string;
    role: string;
    status: string;
  };
  onUpdate: (user: any) => void;
}

const ISLAMABAD_CENTER: [number, number] = [33.6844, 73.0479];

function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ user, onUpdate }) => {
  const [name, setName] = useState(user?.name || '');
  const [address, setAddress] = useState(user?.address || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setAddress(user.address);
      setPhone(user.phone || '');
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
        setSearchResults([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchInput = useCallback((query: string) => {
    setSearchQuery(query);
    setSearchError('');
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }
    
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchLocations(query, 5);
        if (results.length > 0) {
          setSearchResults(results);
          setShowResults(true);
        } else {
          setSearchError('No locations found. Try a different search term.');
        }
      } catch (error) {
        setSearchError('Search temporarily unavailable. Please try again.');
      } finally {
        setIsSearching(false);
      }
    }, 500);
  }, []);

  const handleSelectLocation = (result: SearchResult) => {
    setSelectedLocation({ lat: result.lat, lng: result.lon });
    setAddress(result.address);
    setSearchQuery(result.address);
    setShowResults(false);
    setSearchResults([]);
  };

  const handleMapClick = async (lat: number, lng: number) => {
    if (!isValidPakistanLocation(lat, lng)) {
      alert('Please select a location within Pakistan.');
      return;
    }
    
    setSelectedLocation({ lat, lng });
    
    try {
      const reverseResult = await searchLocations(`${lat},${lng}`, 1);
      if (reverseResult.length > 0) {
        setAddress(reverseResult[0].address);
        setSearchQuery(reverseResult[0].address);
      } else {
        setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        setSearchQuery(`${lat.toFixed(5)}, ${lng.toFixed(5)}, Pakistan`);
      }
    } catch (error) {
      setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      setSearchQuery(`${lat.toFixed(5)}, ${lng.toFixed(5)}, Pakistan`);
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        if (!isValidPakistanLocation(latitude, longitude)) {
          alert('Please enable location access within Pakistan.');
          setLoading(false);
          return;
        }
        
        setSelectedLocation({ lat: latitude, lng: longitude });
        
        try {
          const results = await searchLocations(`${latitude},${longitude}`, 1);
          if (results.length > 0) {
            setAddress(results[0].address);
            setSearchQuery(results[0].address);
          } else {
            setAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
            setSearchQuery(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}, Pakistan`);
          }
        } catch (error) {
          setAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
          setSearchQuery(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}, Pakistan`);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        alert('Unable to detect location. Please search manually.');
        setLoading(false);
      }
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    
    try {
      const updatedUser = await auth.updateProfile({
        name,
        address,
        phone,
        lat: selectedLocation?.lat,
        lng: selectedLocation?.lng
      });
      
      onUpdate(updatedUser);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      alert(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const centerPosition: [number, number] = selectedLocation
    ? [selectedLocation.lat, selectedLocation.lng]
    : ISLAMABAD_CENTER;

  const isProvider = user?.role === 'PROVIDER';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-headline font-bold text-slate-900 mb-2">Settings</h2>
        <p className="text-slate-600">
          {isProvider ? 'Manage your restaurant profile and location' : 'Manage your organization profile and location'}
        </p>
      </div>

      {/* Profile Form */}
      <div className="bg-white rounded-[2.5rem] shadow-xl p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            isProvider 
              ? 'bg-gradient-to-br from-primary to-green-600' 
              : 'bg-gradient-to-br from-orange-500 to-red-500'
          }`}>
            {isProvider ? <Building2 size={24} className="text-white" /> : <Heart size={24} className="text-white" />}
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              {isProvider ? 'Restaurant Profile' : 'Organization Profile'}
            </h3>
            <p className="text-sm text-slate-500">Update your information</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 px-1">{isProvider ? 'Restaurant Name' : 'Organization Name'}</label>
              <div className="relative">
                {isProvider ? (
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                ) : (
                  <Heart className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                )}
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all"
                  placeholder={isProvider ? 'Your restaurant name' : 'Your organization name'}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 px-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all"
                  placeholder="+92 300 1234567"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-600 px-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full bg-slate-100 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Location Map */}
      <div className="bg-white rounded-[2.5rem] shadow-xl p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center">
            <MapPin size={24} className="text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Pickup Location</h3>
            <p className="text-sm text-slate-500">Search for your exact location</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              onFocus={() => searchQuery.length >= 3 && setShowResults(true)}
              placeholder="Search for location in Pakistan (e.g., F-7 Islamabad, Blue Area)..."
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-12 text-sm focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              {isSearching ? (
                <Loader2 size={18} className="animate-spin text-slate-400" />
              ) : showResults ? (
                <button 
                  onClick={() => { setShowResults(false); setSearchResults([]); }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              ) : null}
            </div>
          </div>
          
          {/* Search Results Dropdown */}
          {showResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">
              {searchResults.map((result, idx) => (
                <button
                  key={result.placeId}
                  onClick={() => handleSelectLocation(result)}
                  className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-start gap-3 transition-colors border-b border-slate-50 last:border-0"
                >
                  <MapPin size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{result.address}</p>
                    <p className="text-xs text-slate-500 truncate">{result.displayName}</p>
                  </div>
                </button>
              ))}
              {searchError && (
                <div className="px-4 py-3 text-center text-sm text-red-500">
                  {searchError}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Map */}
        <div className="h-[400px] rounded-2xl overflow-hidden border border-slate-200 mb-4">
          <MapContainer
            center={centerPosition}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <RecenterMap center={centerPosition} />
            <MapClickHandler onLocationSelect={handleMapClick} />
            {selectedLocation && (
              <Marker position={[selectedLocation.lat, selectedLocation.lng]} icon={customIcon}>
                <Popup>
                  <div className="text-center">
                    <p className="font-bold">{name}</p>
                    <p className="text-sm text-slate-500">{address}</p>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleDetectLocation}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Locate size={16} />
            )}
            Use Current Location
          </button>
          <span className="text-xs text-slate-500 flex items-center gap-2">
            <AlertCircle size={14} />
            Click on map or search to set location
          </span>
        </div>

        {/* Selected Location Display */}
        {selectedLocation && (
          <div className="mt-4 p-4 bg-green-50 rounded-2xl border border-green-100 flex items-center gap-3">
            <CheckCircle2 size={20} className="text-green-600" />
            <div>
              <p className="text-sm font-bold text-green-800">Location Selected</p>
              <p className="text-xs text-green-600">
                {selectedLocation.lat.toFixed(5)}, {selectedLocation.lng.toFixed(5)} • {address}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        {success && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 size={20} />
            <span className="text-sm font-bold">Profile updated!</span>
          </div>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-green-600 text-white rounded-2xl font-bold shadow-xl shadow-green-100 hover:shadow-2xl hover:shadow-green-200 hover:-translate-y-1 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save size={20} />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;