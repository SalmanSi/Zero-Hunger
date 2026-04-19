import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    MapPin,
    Utensils,
    CheckCircle2,
    LogOut,
    PackageSearch,
    Clock,
    User as UserIcon,
    Loader2,
    Settings,
    Heart,
    Navigation,
    X,
    ExternalLink,
    Play,
    Map,
    Phone,
    MessageSquare,
    Info,
    Calendar,
    Building2
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { listings as listingsApi, auth, getCurrentUser, rides } from '../utils/api';
import SettingsPage from '../components/SettingsPage';

interface Listing {
    id: string;
    providerId: string;
    description: string;
    servings: number;
    foodType: string;
    location: string;
    lat?: number;
    lng?: number;
    pickupStart: string;
    pickupEnd: string;
    status: 'AVAILABLE' | 'CLAIMED' | 'EXPIRED' | 'COMPLETED';
    consumerId?: string;
    provider?: {
        name: string;
        address: string;
        phone?: string;
    };
}

interface Ride {
    id: string;
    listingId: string;
    status: string;
    startTime?: string;
    arrivalTime?: string;
    listing?: Listing;
}

const customIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

const ConsumerDashboard = () => {
    const navigate = useNavigate();
    const [listings, setListings] = useState<Listing[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'listings' | 'claims' | 'settings'>('listings');
    const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [activeRide, setActiveRide] = useState<Ride | null>(null);
    const [startingRide, setStartingRide] = useState(false);

    const fetchListings = useCallback(async () => {
        try {
            const data = await listingsApi.getAll('CONSUMER');
            setListings(data);
        } catch (error) {
            console.error('Failed to fetch listings:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const user = getCurrentUser();
        if (!user) {
            navigate('/login');
            return;
        }
        setCurrentUser(user);
    }, [navigate]);

    useEffect(() => {
        if (!currentUser) return;
        fetchListings();
    }, [currentUser, fetchListings]);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (activeTab === 'listings' || activeTab === 'claims') {
            interval = setInterval(fetchListings, 30000);
        }
        return () => clearInterval(interval);
    }, [activeTab, fetchListings]);

    const handleClaim = async (listingId: string) => {
        if (!currentUser) return;
        setClaiming(listingId);
        
        try {
            await listingsApi.claim(listingId);
            setListings(prev => prev.map(l => 
                l.id === listingId ? { ...l, status: 'CLAIMED', consumerId: currentUser.id } : l
            ));
            alert('Food claimed! Check "My Claims" to start your ride.');
        } catch (error: any) {
            alert(error.message || 'Failed to claim listing');
        } finally {
            setClaiming(null);
        }
    };

    const handleStartRide = async (listing: Listing) => {
        if (!currentUser) return;
        setStartingRide(true);

        try {
            const ride = await rides.start(listing.id);
            setActiveRide({
                ...ride,
                listing
            });
            alert('Ride started! Restaurant has been notified. Navigate to pickup the food.');
        } catch (error: any) {
            alert(error.message || 'Failed to start ride');
        } finally {
            setStartingRide(false);
        }
    };

    const handleLogout = () => {
        auth.logout();
        navigate('/login');
    };

    const openLocationMap = (listing: Listing) => {
        setSelectedListing(listing);
        setIsMapModalOpen(true);
    };

    const openDetailsModal = (listing: Listing) => {
        setSelectedListing(listing);
        setIsDetailsModalOpen(true);
    };

    const availableListings = listings.filter(l => l.status === 'AVAILABLE');
    const myClaims = listings.filter(l => l.consumerId === currentUser?.id);

    const LoadingSkeleton = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white p-8 rounded-[2.5rem] shadow-sm animate-pulse">
                    <div className="h-4 w-20 bg-slate-200 rounded mb-6" />
                    <div className="h-8 w-3/4 bg-slate-200 rounded mb-2" />
                    <div className="h-4 w-1/2 bg-slate-200 rounded mb-8" />
                    <div className="space-y-3">
                        <div className="h-4 bg-slate-200 rounded" />
                        <div className="h-4 bg-slate-200 rounded" />
                        <div className="h-20 bg-slate-200 rounded-2xl" />
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 font-body text-slate-800 pb-20 md:pb-0">
            {/* Map Modal */}
            {selectedListing && isMapModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsMapModalOpen(false)} />
                    <div className="relative bg-white w-full max-w-3xl rounded-[2rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">{selectedListing.description}</h3>
                                <p className="text-sm text-slate-500">{selectedListing.location}</p>
                            </div>
                            <button 
                                onClick={() => setIsMapModalOpen(false)}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="h-[350px] flex-shrink-0">
                            <MapContainer
                                center={selectedListing.lat && selectedListing.lng 
                                    ? [selectedListing.lat, selectedListing.lng] 
                                    : [33.6844, 73.0479]}
                                zoom={15}
                                style={{ height: '100%', width: '100%' }}
                            >
                                <TileLayer
                                    attribution='&copy; OpenStreetMap'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                {selectedListing.lat && selectedListing.lng && (
                                    <Marker 
                                        position={[selectedListing.lat, selectedListing.lng]} 
                                        icon={customIcon}
                                    >
                                        <Popup>
                                            <div className="text-center">
                                                <p className="font-bold">{selectedListing.description}</p>
                                                <p className="text-sm">{selectedListing.location}</p>
                                            </div>
                                        </Popup>
                                    </Marker>
                                )}
                            </MapContainer>
                        </div>
                        <div className="p-4 flex gap-3 flex-shrink-0">
                            <a 
                                href={`https://www.openstreetmap.org/?mlat=${selectedListing.lat || 33.6844}&mlon=${selectedListing.lng || 73.0479}#map=16/${selectedListing.lat || 33.6844}/${selectedListing.lng || 73.0479}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
                            >
                                <ExternalLink size={16} />
                                Open Maps
                            </a>
                            {selectedListing.provider?.phone && (
                                <a 
                                    href={`tel:${selectedListing.provider.phone}`}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors"
                                >
                                    <Phone size={16} />
                                    Call
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Details Modal */}
            {selectedListing && isDetailsModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsDetailsModalOpen(false)} />
                    <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                        <div className="p-5 border-b sticky top-0 bg-white z-10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Listing Details</h3>
                                    <p className="text-sm text-slate-500">by {selectedListing.provider?.name}</p>
                                </div>
                                <button 
                                    onClick={() => setIsDetailsModalOpen(false)}
                                    className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="bg-green-50 rounded-xl p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                                        <Utensils size={24} />
                                    </div>
                                    <div>
                                        <p className="text-base font-bold text-green-900">{selectedListing.description}</p>
                                        <span className="text-xs font-bold bg-green-200 text-green-700 px-2 py-0.5 rounded-full">{selectedListing.foodType}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-50 rounded-lg p-3">
                                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                                        <Utensils size={12} />
                                        <span className="text-xs font-bold uppercase">Quantity</span>
                                    </div>
                                    <p className="text-lg font-black">{selectedListing.servings}</p>
                                    <p className="text-xs text-slate-500">servings</p>
                                </div>
                                <div className="bg-slate-50 rounded-lg p-3">
                                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                                        <Clock size={12} />
                                        <span className="text-xs font-bold uppercase">Pickup By</span>
                                    </div>
                                    <p className="text-sm font-bold">{new Date(selectedListing.pickupEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    <p className="text-xs text-slate-500">{new Date(selectedListing.pickupEnd).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-lg p-3">
                                <div className="flex items-center gap-2 text-slate-500 mb-2">
                                    <Building2 size={12} />
                                    <span className="text-xs font-bold uppercase">Provider</span>
                                </div>
                                <p className="font-bold text-sm">{selectedListing.provider?.name}</p>
                                <p className="text-xs text-slate-500">{selectedListing.provider?.address}</p>
                                {selectedListing.provider?.phone && (
                                    <a href={`tel:${selectedListing.provider.phone}`} className="text-green-600 font-bold text-sm">{selectedListing.provider.phone}</a>
                                )}
                            </div>

                            <div className="bg-slate-50 rounded-lg p-3">
                                <div className="flex items-center gap-2 text-slate-500 mb-2">
                                    <MapPin size={12} />
                                    <span className="text-xs font-bold uppercase">Pickup Location</span>
                                </div>
                                <p className="font-bold text-sm">{selectedListing.location}</p>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button 
                                    onClick={() => { setIsDetailsModalOpen(false); setTimeout(() => openLocationMap(selectedListing), 100); }}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
                                >
                                    <Map size={16} />
                                    Map
                                </button>
                                <button 
                                    onClick={() => handleClaim(selectedListing.id)}
                                    disabled={claiming === selectedListing.id}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50"
                                >
                                    {claiming === selectedListing.id ? <Loader2 size={16} className="animate-spin" /> : 'Claim'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 py-4 flex justify-between items-center fixed top-0 left-0 right-0 z-[100]">
                <div className="flex items-center gap-2">
                    <Link to="/" className="text-xl font-black text-orange-600 font-headline tracking-tighter">ZeroHunger Sync</Link>
                    <span className="hidden md:inline-flex px-2 py-0.5 bg-orange-100 text-orange-600 text-[10px] font-bold uppercase rounded-full">NGO</span>
                </div>
                <div className="hidden md:flex items-center gap-4">
                    <button onClick={() => setActiveTab('listings')} className={`text-sm font-medium transition-all ${activeTab === 'listings' ? 'text-orange-600 font-bold border-b-2 border-orange-600' : 'text-slate-600 hover:text-orange-600'}`}>Available</button>
                    <button onClick={() => setActiveTab('claims')} className={`text-sm font-medium transition-all ${activeTab === 'claims' ? 'text-orange-600 font-bold border-b-2 border-orange-600' : 'text-slate-600 hover:text-orange-600'}`}>My Claims</button>
                    <button onClick={() => setActiveTab('settings')} className={`text-sm font-medium transition-all ${activeTab === 'settings' ? 'text-orange-600 font-bold border-b-2 border-orange-600' : 'text-slate-600 hover:text-orange-600'}`}>Settings</button>
                </div>
                <div className="flex items-center gap-6">
                    <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-xl">
                        <UserIcon size={16} className="text-orange-600" />
                        <span className="text-xs font-bold text-slate-700">{currentUser?.name}</span>
                    </div>
                    <button onClick={handleLogout} className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-orange-600">
                        <LogOut size={18} />
                    </button>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto p-8 lg:p-12 pt-24">
                {loading && (
                    <div>
                        <div className="mb-8">
                            <div className="h-10 w-64 bg-slate-200 rounded animate-pulse mb-2" />
                            <div className="h-5 w-48 bg-slate-200 rounded animate-pulse" />
                        </div>
                        <LoadingSkeleton />
                    </div>
                )}

                {activeTab === 'listings' && !loading && (
                    <div className="animate-fade-in">
                        <header className="pb-8 pt-4">
                            <h2 className="text-3xl font-headline font-black tracking-tight mb-1">Available Food Surplus</h2>
                            <p className="text-slate-600 font-medium">Real-time alerts for {currentUser?.address || 'Islamabad'}</p>
                        </header>

                        {availableListings.length === 0 ? (
                            <div className="bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-slate-200">
                                <PackageSearch size={64} className="mx-auto text-slate-300 mb-6" />
                                <h4 className="text-xl font-bold mb-2">No active listings</h4>
                                <p className="text-slate-500">New listings will appear here automatically.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {availableListings.map(listing => {
                                    const provider = listing.provider;
                                    
                                    return (
                                        <div key={listing.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-all flex flex-col">
                                            <div className="flex justify-between items-start mb-3">
                                                <span className="px-2.5 py-1 bg-green-100 text-green-700 text-[10px] font-bold uppercase rounded-full">{listing.foodType}</span>
                                            </div>

                                            <h3 className="text-lg font-bold mb-1 text-slate-800 line-clamp-2">{listing.description}</h3>
                                            <p className="text-xs font-medium text-slate-500 mb-3">
                                                by {provider?.name}
                                            </p>

                                            <div className="space-y-2 mb-4 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center">
                                                        <Utensils size={12} />
                                                    </div>
                                                    <span className="text-xs font-bold">{listing.servings} servings</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center">
                                                        <Clock size={12} />
                                                    </div>
                                                    <span className="text-xs text-slate-600">Expires {new Date(listing.pickupEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                                                    <MapPin size={12} className="text-orange-600 flex-shrink-0" />
                                                    <p className="text-xs text-slate-600 truncate">{listing.location}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex flex-col gap-2 mt-2">
                                                <button 
                                                    onClick={() => openDetailsModal(listing)}
                                                    className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold text-sm transition-all hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2"
                                                >
                                                    <Info size={14} />
                                                    View Details
                                                </button>
                                                <button 
                                                    onClick={() => openLocationMap(listing)}
                                                    className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold text-sm transition-all hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2"
                                                >
                                                    <Map size={14} />
                                                    View Map
                                                </button>
                                            </div>
                                            
                                            <button
                                                onClick={() => handleClaim(listing.id)}
                                                disabled={claiming === listing.id}
                                                className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold text-sm transition-all hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {claiming === listing.id ? (
                                                    <>
                                                        <Loader2 size={14} className="animate-spin" />
                                                        Claiming...
                                                    </>
                                                ) : (
                                                    'Claim Surplus'
                                                )}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'claims' && !loading && (
                    <div className="animate-fade-in">
                        <section className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm">
                            <h3 className="text-2xl font-black mb-8">Your Active Claims</h3>
                            
                            {myClaims.length === 0 ? (
                                <div className="bg-slate-50 p-10 rounded-2xl text-center">
                                    <PackageSearch size={48} className="mx-auto text-slate-300 mb-4" />
                                    <p className="text-slate-500">No claimed items yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {myClaims.map(claim => (
                                        <div key={claim.id} className="flex flex-col lg:flex-row gap-6 p-6 bg-slate-50 rounded-2xl">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase">
                                                        <CheckCircle2 size={12} className="inline mr-1" />
                                                        Ready for Pickup
                                                    </span>
                                                </div>
                                                <p className="text-xl font-bold mb-2">{claim.description}</p>
                                                <p className="text-sm text-slate-500 mb-4">by {claim.provider?.name}</p>
                                                
                                                <div className="flex flex-wrap gap-4">
                                                    <button 
                                                        onClick={() => openLocationMap(claim)}
                                                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-100"
                                                    >
                                                        <Map size={16} />
                                                        View Location
                                                    </button>
                                                    {claim.provider?.phone && (
                                                        <a 
                                                            href={`tel:${claim.provider.phone}`}
                                                            className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-xl text-sm font-medium hover:bg-green-100"
                                                        >
                                                            <Phone size={16} />
                                                            Contact
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="lg:w-96">
                                                {activeRide?.listing?.id === claim.id ? (
                                                    <div className="bg-green-50 p-6 rounded-2xl border border-green-200">
                                                        <div className="flex items-center gap-3 mb-4">
                                                            <Navigation size={24} className="text-green-600" />
                                                            <span className="font-bold text-green-800">Ride in Progress</span>
                                                        </div>
                                                        <div className="space-y-3">
                                                            <a 
                                                                href={`https://www.openstreetmap.org/?mlat=${claim.lat || 33.6844}&mlon=${claim.lng || 73.0479}#map=16/${claim.lat || 33.6844}/${claim.lng || 73.0479}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors"
                                                            >
                                                                <ExternalLink size={18} />
                                                                Open Navigation
                                                            </a>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button 
                                                        onClick={() => handleStartRide(claim)}
                                                        disabled={startingRide}
                                                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-bold hover:shadow-xl transition-all disabled:opacity-50"
                                                    >
                                                        {startingRide ? (
                                                            <>
                                                                <Loader2 size={20} className="animate-spin" />
                                                                Starting...
                                                            </>
                                                        ) : (
                                                            <>
                                                            <Navigation size={20} />
                                                            Start Ride & Navigate
                                                        </>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                )}

                {activeTab === 'settings' && (
                    <SettingsPage
                        user={currentUser}
                        onUpdate={(updatedUser) => setCurrentUser(updatedUser)}
                    />
                )}
            </main>

            {/* Mobile Navigation */}
            <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-end px-4 pb-6 md:hidden bg-white/90 backdrop-blur-xl border-t border-slate-100">
                <button onClick={() => setActiveTab('listings')} className={`flex flex-col items-center justify-center rounded-2xl px-5 py-2 -mt-4 ${activeTab === 'listings' ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg' : 'text-slate-400'}`}>
                    <PackageSearch size={20} />
                    <span className="text-xs font-semibold">Available</span>
                </button>
                <button onClick={() => setActiveTab('claims')} className={`flex flex-col items-center justify-center rounded-2xl px-5 py-2 ${activeTab === 'claims' ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg' : 'text-slate-400'}`}>
                    <Heart size={20} />
                    <span className="text-xs font-semibold">Claims</span>
                </button>
                <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center justify-center rounded-2xl px-5 py-2 ${activeTab === 'settings' ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg' : 'text-slate-400'}`}>
                    <Settings size={20} />
                    <span className="text-xs font-semibold">Settings</span>
                </button>
            </nav>
        </div>
    );
};

export default ConsumerDashboard;