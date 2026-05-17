import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Home,
  MapPin,
  Package,
  LogOut,
  Plus,
  User as UserIcon,
  Leaf,
  MoreVertical,
  ShoppingBasket,
  Heart,
  BellRing,
  X,
  Search,
  CheckCircle2,
  Loader2,
  Settings,
  Save,
  Clock,
  Building2,
  Phone,
  Mail,
  Menu,
  ChevronLeft,
  Edit3,
  Trash2,
  Eye,
  Navigation,
  Utensils,
  Timer,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { listings as listingsApi, auth, getCurrentUser, rides } from '../utils/api';
import SettingsPage from '../components/SettingsPage';
import MapView from '../components/MapView';
import { FeedbackBanner, FeedbackModal } from '../components/Feedback';
import { reverseGeocode } from '../utils/geocode';

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
  rides?: Ride[];
}

interface Ride {
  id: string;
  listingId: string;
  consumerId: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'ARRIVED' | 'COMPLETED' | 'CANCELLED';
  startTime?: string;
  arrivalTime?: string;
  endTime?: string;
}

const ProviderDashboard = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ngos' | 'inventory' | 'settings'>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ngos, setNgos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [lastClaimedListing, setLastClaimedListing] = useState<any>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [editListing, setEditListing] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [formData, setFormData] = useState<{
    description: string;
    servings: number;
    foodType: string;
    expiryHours: number;
    location: string;
    unit: string;
    weight: string;
    packageCount: string;
    dietary: string[];
    allergies: string;
    storage: string;
    prepInstructions: string;
    lat?: number;
    lng?: number;
  }>({
    description: '',
    servings: 10,
    foodType: 'Hot Meal',
    expiryHours: 4,
    location: '',
    unit: 'servings',
    weight: '',
    packageCount: '',
    dietary: [],
    allergies: '',
    storage: 'AMBIENT',
    prepInstructions: '',
    lat: undefined,
    lng: undefined
  });
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error' | 'info'; title: string; message?: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [confirmingRideId, setConfirmingRideId] = useState<string | null>(null);
  const providerMealsSaved = listings
    .filter((listing) => listing.status === 'CLAIMED' || listing.status === 'COMPLETED')
    .reduce((sum, listing) => sum + listing.servings, 0);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'PROVIDER') {
      if (user.role === 'CONSUMER') {
        navigate('/consumer-dashboard');
      } else {
        navigate('/admin-dashboard');
      }
      return;
    }
    setCurrentUser(user);
  }, [navigate]);

  const fetchListings = async () => {
    try {
      const listingsData = await listingsApi.getAll('PROVIDER');
      setListings(listingsData);
      
      const claimedListing = listingsData.find((l: Listing) => l.status === 'CLAIMED');
      if (claimedListing && (!lastClaimedListing || lastClaimedListing.id !== claimedListing.id)) {
        setLastClaimedListing(claimedListing);
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 15000);
      }
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    const initFetch = async () => {
      try {
        const [listingsData, usersData] = await Promise.all([
          listingsApi.getAll('PROVIDER'),
          listingsApi.getAll()
        ]);
        setListings(listingsData);
        setNgos(usersData.filter((u: any) => u.role === 'CONSUMER' && u.status === 'APPROVED'));
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    initFetch();

    const pollInterval = setInterval(fetchListings, 10000);
    return () => clearInterval(pollInterval);
  }, [currentUser]);

  useEffect(() => {
    if (!isDetailsModalOpen || !selectedListing) return;
    const updatedListing = listings.find((listing) => listing.id === selectedListing.id);
    if (updatedListing && updatedListing !== selectedListing) {
      setSelectedListing(updatedListing);
    }
  }, [isDetailsModalOpen, listings, selectedListing?.id]);

  const handlePostSurplus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setPosting(true);

    try {
      const pickupEndDate = new Date(Date.now() + 3600000 * formData.expiryHours).toISOString();
      
      const newListing = await listingsApi.create({
        description: formData.description,
        servings: formData.servings,
        foodType: formData.foodType,
        location: formData.location,
        lat: formData.lat ?? currentUser.lat,
        lng: formData.lng ?? currentUser.lng,
        pickupEnd: pickupEndDate
      } as any);

      setListings([newListing, ...listings]);
      setIsModalOpen(false);
      setFeedback({ tone: 'success', title: 'Listing posted', message: 'Nearby approved NGOs can now see this pickup.' });
      setFormData({ description: '', servings: 10, foodType: 'Hot Meal', expiryHours: 4, location: '', unit: 'servings', weight: '', packageCount: '', dietary: [], allergies: '', storage: 'AMBIENT', prepInstructions: '', lat: undefined, lng: undefined });
    } catch (error: any) {
      setFeedback({ tone: 'error', title: 'Could not create listing', message: error.message || 'Failed to create listing' });
    } finally {
      setPosting(false);
    }
  };

  const handleLogout = () => {
    auth.logout();
    navigate('/login');
  };

  const handleDeleteListing = async (id: string) => {
    setDeleteTarget(id);
  };

  const confirmDeleteListing = async () => {
    if (!deleteTarget) return;
    try {
      await listingsApi.delete(deleteTarget);
      setListings(listings.filter(l => l.id !== deleteTarget));
      setFeedback({ tone: 'success', title: 'Listing removed', message: 'The surplus listing is no longer visible to NGOs.' });
    } catch (error: any) {
      setFeedback({ tone: 'error', title: 'Could not delete listing', message: error.message || 'Failed to delete listing' });
    }
    setDeleteTarget(null);
  };

  const handleViewDetails = async (listing: any) => {
    setSelectedListing(listing);
    setIsDetailsModalOpen(true);
  };

  const handleEditListing = (listing: any) => {
    setEditListing(listing);
    setFormData({
      description: listing.description,
      servings: listing.servings,
      foodType: listing.foodType,
      expiryHours: Math.max(1, Math.round((new Date(listing.pickupEnd).getTime() - Date.now()) / 3600000)),
      location: listing.location,
      unit: listing.unit || 'servings',
      weight: listing.weight || '',
      packageCount: listing.packageCount || '',
      dietary: listing.dietary || [],
      allergies: listing.allergies || '',
      storage: listing.storage || 'AMBIENT',
      prepInstructions: listing.prepInstructions || '',
      lat: listing.lat,
      lng: listing.lng
    } as any);
    setIsEditModalOpen(true);
  };

  const handleUpdateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editListing) return;
    setPosting(true);
    try {
      const pickupEndDate = new Date(Date.now() + 3600000 * formData.expiryHours).toISOString();
      const updated = await listingsApi.update(editListing.id, {
        description: formData.description,
        servings: formData.servings,
        foodType: formData.foodType,
        location: formData.location,
        lat: formData.lat,
        lng: formData.lng,
        pickupEnd: pickupEndDate
      } as any);
      setListings(listings.map((l: any) => l.id === editListing.id ? updated : l));
      setIsEditModalOpen(false);
      setEditListing(null);
      setFeedback({ tone: 'success', title: 'Listing updated', message: 'Pickup details and timing were saved.' });
    } catch (error: any) {
      setFeedback({ tone: 'error', title: 'Could not update listing', message: error.message || 'Failed to update listing' });
    } finally {
      setPosting(false);
    }
  };

  const handlePickupPinSelect = async (lat: number, lng: number) => {
    setFormData((current) => ({ ...current, lat, lng }));
    try {
      const result = await reverseGeocode(lat, lng);
      const resolvedLocation = result?.address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setFormData((current) => ({ ...current, lat, lng, location: resolvedLocation }));
    } catch {
      setFormData((current) => ({ ...current, lat, lng, location: `${lat.toFixed(5)}, ${lng.toFixed(5)}` }));
    }
  };

  const handleClaimedListingClick = async (listing: any) => {
    if (listing.status === 'CLAIMED' || listing.status === 'COMPLETED') {
      try {
        const latestListing = await listingsApi.get(listing.id);
        setSelectedListing(latestListing);
        setListings((currentListings: any[]) => currentListings.map((item: any) => item.id === latestListing.id ? latestListing : item));
      } catch {
        setSelectedListing(listing);
      }
      setIsDetailsModalOpen(true);
    }
  };

  const handleConfirmHandoff = async (rideId: string) => {
    setConfirmingRideId(rideId);
    try {
      const updatedRide = await rides.confirmHandoff(rideId);
      setListings((currentListings: any[]) => currentListings.map((listing: any) => {
        if (listing.id !== updatedRide.listingId) return listing;
        return {
          ...listing,
          status: 'COMPLETED',
          rides: (listing.rides || []).map((ride: any) => ride.id === updatedRide.id ? updatedRide : ride)
        };
      }));
      setSelectedListing((current: any) => current && current.id === updatedRide.listingId
        ? {
            ...current,
            status: 'COMPLETED',
            rides: (current.rides || []).map((ride: any) => ride.id === updatedRide.id ? updatedRide : ride)
          }
        : current
      );
      setFeedback({ tone: 'success', title: 'Handoff confirmed', message: 'The ride and claim are now marked completed.' });
    } catch (error: any) {
      setFeedback({ tone: 'error', title: 'Could not confirm handoff', message: error.message || 'Failed to complete this ride.' });
    } finally {
      setConfirmingRideId(null);
    }
  };

  const selectedRide = selectedListing?.rides?.find((ride: Ride) => ride.status === 'ARRIVED')
    || selectedListing?.rides?.find((ride: Ride) => ride.status === 'IN_PROGRESS')
    || selectedListing?.rides?.find((ride: Ride) => ride.status === 'PENDING')
    || selectedListing?.rides?.find((ride: Ride) => ride.status === 'COMPLETED')
    || selectedListing?.rides?.find((ride: Ride) => ride.status !== 'CANCELLED')
    || selectedListing?.rides?.[0];

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen flex">
      {/* Sidebar for Desktop */}
      <aside className={`hidden lg:flex flex-col fixed left-0 top-0 h-screen py-6 bg-white border-r border-outline-variant/10 z-40 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="px-6 mb-10 flex items-center justify-between">
          {sidebarOpen && (
            <>
              <Link to="/" className="text-xl font-black text-primary font-headline">ZeroHunger</Link>
              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mt-1">Provider</p>
            </>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-surface-container rounded-lg">
            {sidebarOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
          </button>
        </div>
        <nav className="flex-1 space-y-2 px-4">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-3 w-full py-3 px-4 rounded-2xl transition-all ${activeTab === 'dashboard' ? 'bg-primary-fixed text-on-primary-fixed-variant' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
          >
            <Home size={20} />
            {sidebarOpen && <span className="font-bold text-sm">Dashboard</span>}
          </button>
          <button
            onClick={() => setActiveTab('ngos')}
            className={`flex items-center gap-3 w-full py-3 px-4 rounded-2xl transition-all ${activeTab === 'ngos' ? 'bg-primary-fixed text-on-primary-fixed-variant' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
          >
            <MapPin size={20} />
            {sidebarOpen && <span className="font-bold text-sm">Nearby NGOs</span>}
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-3 w-full py-3 px-4 rounded-2xl transition-all ${activeTab === 'inventory' ? 'bg-primary-fixed text-on-primary-fixed-variant' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
          >
            <Package size={20} />
            {sidebarOpen && <span className="font-bold text-sm">Inventory</span>}
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-3 w-full py-3 px-4 rounded-2xl transition-all ${activeTab === 'settings' ? 'bg-primary-fixed text-on-primary-fixed-variant' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
          >
            <Settings size={20} />
            {sidebarOpen && <span className="font-bold text-sm">Settings</span>}
          </button>
        </nav>
        <div className="px-4 mt-auto space-y-2">
          <button onClick={handleLogout} className="flex items-center gap-3 w-full py-3 px-4 text-primary hover:bg-primary/10 rounded-2xl transition-all">
            <LogOut size={20} />
            {sidebarOpen && <span className="font-bold text-sm">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'} flex flex-col min-h-screen transition-all duration-300`}>
        <header className="fixed top-0 left-0 right-0 w-full z-[100] bg-white/80 backdrop-blur-md border-b border-outline-variant/5">
          <div className="flex justify-between items-center w-full px-8 py-4">
            <div className="flex items-center gap-4">
              <span className="text-xl font-black text-primary lg:hidden">ZH Sync</span>
              <div className="hidden md:flex gap-8 items-center">
                <button onClick={() => setActiveTab('dashboard')} className={`text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'text-primary border-b-2 border-primary pb-1' : 'text-on-surface-variant hover:text-primary medium'}`}>Home</button>
                <button onClick={() => setActiveTab('inventory')} className={`text-sm font-medium transition-all ${activeTab === 'inventory' ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}>History</button>
                <button onClick={() => setActiveTab('settings')} className={`text-sm font-medium transition-all ${activeTab === 'settings' ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}>Settings</button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsModalOpen(true)}
                className="hidden sm:flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-2xl text-sm font-bold shadow-lg shadow-green-100 active:scale-95 transition-all"
              >
                <Plus size={16} />
                Post Surplus
              </button>
              <div className="w-10 h-10 bg-surface-container-high rounded-full flex items-center justify-center text-on-surface-variant">
                <UserIcon size={20} />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 pt-24 pb-28 px-8 max-w-7xl mx-auto w-full">
          {feedback && (
            <div className="mb-6">
              <FeedbackBanner
                tone={feedback.tone}
                title={feedback.title}
                message={feedback.message}
                onDismiss={() => setFeedback(null)}
              />
            </div>
          )}
          {activeTab === 'dashboard' && (
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-8 space-y-10">
                {/* Hero Statistics */}
                <div className="bg-primary text-white rounded-[2rem] p-10 relative overflow-hidden shadow-2xl">
                  <div className="relative z-10">
                    <span className="text-xs font-bold uppercase tracking-widest text-primary-fixed mb-4 block">Active Overview</span>
                    <h2 className="text-4xl font-headline font-bold mb-2">Hello, {currentUser?.name || 'Partner'}</h2>
                    <p className="text-primary-fixed/80 max-w-sm mb-8">You have {listings.filter(l => l.status === 'AVAILABLE').length} active listings waiting to be claimed.</p>
                    <button onClick={() => setIsModalOpen(true)} className="bg-white text-primary px-8 py-3 rounded-xl font-bold text-sm shadow-sm active:scale-95 transition-all">Create New Listing</button>
                  </div>
                  <div className="absolute -right-16 -bottom-16 opacity-10 pointer-events-none rotate-12">
                    <Leaf size={300} strokeWidth={1} />
                  </div>
                </div>

                {/* Recent Listings Table */}
                <div className="bg-white rounded-[2rem] border border-outline-variant/10 shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-outline-variant/5 flex justify-between items-center">
                    <h3 className="font-headline font-bold text-xl">Recent Listings</h3>
                    <button onClick={() => setActiveTab('inventory')} className="text-primary font-bold text-sm">View Archive</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-surface-container-low text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">
                          <th className="px-8 py-5">Food Item</th>
                          <th className="px-8 py-5 text-center">Quantity</th>
                          <th className="px-8 py-5 text-center">Status</th>
                          <th className="px-8 py-5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/5">
                        {listings.slice(0, 5).map(l => (
                          <tr key={l.id} className="hover:bg-surface-container-low/20 transition-colors">
                            <td className="px-8 py-6">
                              <div className="font-bold text-on-surface">{l.description}</div>
                              <div className="text-[10px] text-on-surface-variant font-medium">{l.foodType}</div>
                            </td>
                            <td className="px-8 py-6 text-center">
                              <span className="font-bold text-sm">{l.servings} Servings</span>
                            </td>
                            <td className="px-8 py-6 text-center">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${l.status === 'AVAILABLE' ? 'bg-primary-fixed text-on-primary-fixed-variant' : l.status === 'CLAIMED' ? 'bg-primary text-white' : 'bg-primary-fixed text-on-primary-fixed-variant'
                                }`}>
                                {l.status}
                              </span>
                            </td>
                            <td className="px-8 py-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {l.status === 'AVAILABLE' && (
                                  <>
                                    <button onClick={() => handleEditListing(l)} className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Edit">
                                      <Edit3 size={16} />
                                    </button>
                                    <button onClick={() => handleDeleteListing(l.id)} className="p-2 text-on-surface-variant hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                      <Trash2 size={16} />
                                    </button>
                                  </>
                                )}
                                {(l.status === 'CLAIMED' || l.status === 'COMPLETED') && (
                                  <button onClick={() => handleClaimedListingClick(l)} className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="View Details">
                                    <Eye size={16} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {listings.length === 0 && (
                          <tr><td colSpan={4} className="px-8 py-10 text-center text-on-surface-variant italic">No items listed yet.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 space-y-10">
                {/* Analytics Card */}
                <div className="bg-white rounded-[2rem] border border-outline-variant/10 p-8 shadow-sm">
                  <h3 className="font-headline font-bold text-xl mb-8">Impact Stats</h3>
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 bg-surface-container-low p-5 rounded-2xl">
                      <div className="w-12 h-12 bg-primary-fixed rounded-xl flex items-center justify-center text-primary flex-shrink-0">
                        <ShoppingBasket size={24} />
                      </div>
                      <div>
                        <p className="text-2xl font-black leading-tight">{providerMealsSaved}</p>
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Meals Saved</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 bg-surface-container-low p-5 rounded-2xl">
                      <div className="w-12 h-12 bg-primary-fixed rounded-xl flex items-center justify-center text-primary flex-shrink-0">
                        <Heart size={24} />
                      </div>
                      <div>
                        <p className="text-2xl font-black leading-tight">{ngos.length}</p>
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">NGO Partners</p>
                      </div>
                    </div>
                  </div>
                </div>

                {lastClaimedListing && (
                  <div className="bg-primary text-white rounded-[2rem] p-8 shadow-xl shadow-green-100">
                    <div className="flex items-center gap-3 mb-4">
                      <BellRing size={20} />
                      <span className="text-xs font-bold uppercase tracking-widest">Claimed - Rider En Route</span>
                    </div>
                    <p className="font-bold text-lg mb-4">"{lastClaimedListing.description}" has been claimed.</p>
                    <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm space-y-2">
                      <p className="text-xs font-medium">• {lastClaimedListing.servings} servings • {lastClaimedListing.foodType}</p>
                      <p className="text-xs font-medium">Please have the items packed and ready for pickup.</p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {activeTab === 'ngos' && (
            <div className="space-y-8">
              <div className="max-w-xl">
                <h2 className="text-3xl font-headline font-bold mb-4">Nearby NGOs</h2>
                <p className="text-on-surface-variant">We've identified these verified rescue partners within a 5km radius of your location.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ngos.map(ngo => (
                  <div key={ngo.id} className="bg-white p-6 rounded-3xl border border-outline-variant/10 shadow-sm hover:translate-y-[-4px] transition-all">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 bg-primary-fixed rounded-2xl flex items-center justify-center text-on-primary-fixed-variant">
                        <Heart size={28} />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg leading-tight">{ngo.name}</h4>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-primary uppercase mt-1">
                          <CheckCircle2 size={10} /> Verified NGO
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-3 text-sm text-on-surface-variant">
                        <MapPin size={16} className="flex-shrink-0" />
                        <span className="truncate">{ngo.address}</span>
                      </div>
                    </div>
                    <button className="w-full py-3 bg-surface-container-high rounded-xl text-sm font-bold text-on-surface hover:bg-surface-container-highest transition-colors">
                      Collaborate
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-8">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-3xl font-headline font-bold mb-2">History & Inventory</h2>
                  <p className="text-on-surface-variant">Track all your surplus postings and donation records.</p>
                </div>
                <div className="relative">
                  <Search size={18} className="absolute left-4 top-1/2 translate-y-[-50%] text-on-surface-variant" />
                  <input type="text" placeholder="Search items..." className="bg-white border border-outline-variant/10 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-64" />
                </div>
              </div>
              <div className="bg-white rounded-[2rem] border border-outline-variant/10 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-surface-container-low text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">
                        <th className="px-8 py-5">Food Item</th>
                        <th className="px-8 py-5 text-center">Status</th>
                        <th className="px-8 py-5 text-center">Servings</th>
                        <th className="px-8 py-5 text-right">Post Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/5">
                      {listings.map(l => (
                        <tr key={l.id} className="hover:bg-surface-container-low/20 transition-colors">
                          <td className="px-8 py-6">
                            <div className="font-bold text-on-surface">{l.description}</div>
                            <div className="text-[10px] text-on-surface-variant font-medium">{l.foodType}</div>
                          </td>
                          <td className="px-8 py-6 text-center">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${l.status === 'AVAILABLE' ? 'bg-primary-fixed text-on-primary-fixed-variant' : 'bg-primary-fixed text-on-primary-fixed-variant'
                              }`}>
                              {l.status}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-center font-bold text-sm">
                            {l.servings}
                          </td>
                          <td className="px-8 py-6 text-right text-xs text-on-surface-variant">
                            {new Date(l.pickupStart).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <SettingsPage 
              user={currentUser} 
              onUpdate={(updatedUser) => setCurrentUser(updatedUser)} 
            />
          )}
        </main>
      </div>

      {/* Post Surplus Modal */}
      {(isModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto p-4 sm:p-6">
          <div className="absolute inset-0 bg-on-background/30 backdrop-blur-sm" onClick={() => { setIsModalOpen(false); setIsEditModalOpen(false); }}></div>
          <div className="relative bg-white w-full max-w-lg max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[2.5rem] shadow-ambient animate-in fade-in zoom-in duration-200">
            <div className="p-8 border-b border-outline-variant/10 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold">{isEditModalOpen ? 'Edit Listing' : 'Post Surplus Food'}</h3>
                <p className="text-on-surface-variant text-sm mt-1">{isEditModalOpen ? 'Update the listing details' : 'Fill in the details to list your items.'}</p>
              </div>
              <button
                onClick={() => { setIsModalOpen(false); setIsEditModalOpen(false); }}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={isEditModalOpen ? handleUpdateListing : handlePostSurplus} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface-variant px-1">Food Item Description</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Chicken Biryani, Pasta Alfredo"
                    className="w-full bg-surface-container-low border border-outline-variant/10 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-on-surface-variant px-1">Servings</label>
                    <input
                      required
                      type="number"
                      min="1"
                      className="w-full bg-surface-container-low border border-outline-variant/10 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      value={formData.servings}
                      onChange={(e) => setFormData({ ...formData, servings: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-on-surface-variant px-1">Food Type</label>
                    <select
                      className="w-full bg-surface-container-low border border-outline-variant/10 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      value={formData.foodType}
                      onChange={(e) => setFormData({ ...formData, foodType: e.target.value })}
                    >
                      <option>Hot Meal</option>
                      <option>Bakery Good</option>
                      <option>Produce</option>
                      <option>Dairy</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface-variant px-1">Pickup Location</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
                    <input
                      required
                      type="text"
                      placeholder="e.g. G-9 Islamabad, NUST C2"
                      className="w-full bg-surface-container-low border border-outline-variant/10 rounded-2xl p-4 pl-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-bold text-on-surface-variant px-1">Pickup Pin</label>
                  <div className="h-64 overflow-hidden rounded-2xl border border-outline-variant/10">
                    <MapView
                      center={formData.lat && formData.lng ? [formData.lat, formData.lng] : [currentUser?.lat || 33.6844, currentUser?.lng || 73.0479]}
                      zoom={14}
                      height="100%"
                      location={formData.lat && formData.lng ? { lat: formData.lat, lng: formData.lng, name: formData.description || currentUser?.name, address: formData.location } : undefined}
                      onLocationSelect={handlePickupPinSelect}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3 text-xs text-on-surface-variant">
                    <span>Click the map to place the exact collection point.</span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, lat: currentUser?.lat, lng: currentUser?.lng, location: formData.location || currentUser?.address || '' })}
                      className="font-bold text-primary hover:underline"
                    >
                      Use profile location
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface-variant px-1">Expiry (Available for next hours)</label>
                  <div className="flex gap-4">
                    {[2, 4, 8, 12, 24].map(h => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setFormData({ ...formData, expiryHours: h })}
                        className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all border ${formData.expiryHours === h ? 'bg-primary text-white border-primary' : 'bg-surface-container-low border-outline-variant/10 hover:border-primary/30'}`}
                      >
                        {h}h
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button type="submit" disabled={posting} className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-green-100 active:scale-95 transition-all disabled:opacity-50">
                  {posting ? <Loader2 size={20} className="animate-spin mx-auto" /> : (isEditModalOpen ? 'Update Listing' : 'Post Listing Now')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <FeedbackModal
        open={Boolean(deleteTarget)}
        tone="warning"
        title="Delete this listing?"
        message="NGOs will no longer be able to claim this surplus item."
        confirmLabel="Delete listing"
        cancelLabel="Keep listing"
        onConfirm={confirmDeleteListing}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Listing Details Modal (for CLAIMED/COMPLETED listings) */}
      {isDetailsModalOpen && selectedListing && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-on-background/60 backdrop-blur-sm" onClick={() => setIsDetailsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-ambient overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">Listing Details</h3>
                  <p className="text-on-surface-variant text-sm">Claimed by {selectedListing.consumer?.name || 'Unknown'}</p>
                </div>
                <button
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-surface-container-low rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white flex-shrink-0">
                    <Utensils size={24} />
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-bold">{selectedListing.description}</p>
                    <span className="text-xs font-bold bg-primary-fixed text-on-primary-fixed-variant px-2 py-0.5 rounded-full">{selectedListing.foodType}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-container-low rounded-lg p-3">
                  <div className="flex items-center gap-2 text-on-surface-variant mb-1">
                    <Utensils size={12} />
                    <span className="text-xs font-bold uppercase">Quantity</span>
                  </div>
                  <p className="text-lg font-black">{selectedListing.servings}</p>
                  <p className="text-xs text-on-surface-variant">servings</p>
                </div>
                <div className="bg-surface-container-low rounded-lg p-3">
                  <div className="flex items-center gap-2 text-on-surface-variant mb-1">
                    <Clock size={12} />
                    <span className="text-xs font-bold uppercase">Pickup By</span>
                  </div>
                  <p className="text-sm font-bold">{new Date(selectedListing.pickupEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  <p className="text-xs text-on-surface-variant">{new Date(selectedListing.pickupEnd).toLocaleDateString()}</p>
                </div>
              </div>

              {(selectedListing.status === 'CLAIMED' || selectedListing.status === 'COMPLETED') && selectedListing.consumer && (
                <div className="bg-primary/10 rounded-2xl p-6 space-y-4">
                  <h4 className="font-bold text-lg flex items-center gap-2">
                    <Building2 size={18} />
                    Claimed Organization
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <UserIcon size={16} className="text-on-surface-variant mt-0.5" />
                      <div>
                        <p className="font-bold">{selectedListing.consumer.name}</p>
                        <p className="text-sm text-on-surface-variant">{selectedListing.consumer.address}</p>
                      </div>
                    </div>
                    {selectedListing.consumer.phone && (
                      <div className="flex items-center gap-3">
                        <Phone size={16} className="text-on-surface-variant" />
                        <a href={`tel:${selectedListing.consumer.phone}`} className="text-primary font-bold">{selectedListing.consumer.phone}</a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-surface-container-low rounded-2xl p-5 space-y-4">
                {selectedRide ? (
                  <>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Pickup Ride</p>
                      <p className="font-black">
                        {selectedRide.status === 'IN_PROGRESS'
                          ? 'NGO en route'
                          : selectedRide.status === 'ARRIVED'
                            ? 'NGO arrived'
                            : selectedRide.status === 'COMPLETED'
                              ? 'Handoff completed'
                              : selectedRide.status}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase text-primary">
                      {selectedRide.status}
                    </span>
                  </div>

                  {selectedRide.startTime && (
                    <p className="text-xs text-on-surface-variant">
                      Started {new Date(selectedRide.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}

                  {selectedRide.status === 'IN_PROGRESS' && (
                    <p className="text-sm text-on-surface-variant">
                      The NGO has started pickup. Confirm handoff after they mark arrival and collect the food.
                    </p>
                  )}

                  {selectedRide.status === 'ARRIVED' && (
                    <button
                      onClick={() => handleConfirmHandoff(selectedRide.id)}
                      disabled={confirmingRideId === selectedRide.id}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      {confirmingRideId === selectedRide.id ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Confirming...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={18} />
                          Confirm Handoff
                        </>
                      )}
                    </button>
                  )}

                  {selectedRide.status === 'COMPLETED' && (
                    <div className="rounded-2xl bg-green-50 p-4 text-sm font-bold text-green-800">
                      This claim has been confirmed and completed.
                    </div>
                  )}
                  </>
                ) : (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Pickup Ride</p>
                    <p className="mt-2 text-sm text-on-surface-variant">
                      No ride has been started for this claim yet. The handoff button appears after the NGO starts the ride and marks arrival.
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-surface-container-low rounded-xl p-4">
                <div className="flex items-center gap-2 text-on-surface-variant mb-2">
                  <MapPin size={14} />
                  <span className="text-xs font-bold uppercase">Pickup Location</span>
                </div>
                <p className="font-bold">{selectedListing.location}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProviderDashboard;
