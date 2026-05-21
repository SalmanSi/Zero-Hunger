import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, ArrowLeft, ShieldCheck, MapPin } from 'lucide-react';
import { auth, getCurrentUser } from '../utils/api';
import { FeedbackBanner, FeedbackModal } from '../components/Feedback';
import MapView from '../components/MapView';
import { reverseGeocode } from '../utils/geocode';

const ConsumerRegistration = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [mapLocation, setMapLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [geocoding, setGeocoding] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleMapSelect = async (lat: number, lng: number) => {
        setMapLocation({ lat, lng });
        setGeocoding(true);
        try {
            const result = await reverseGeocode(lat, lng);
            if (result?.address) {
                setAddress(result.address);
            }
        } catch {
            // Keep the pin; the user can still type the address manually.
        } finally {
            setGeocoding(false);
        }
    };

    useEffect(() => {
        const user = getCurrentUser();
        if (user) {
            if (user.role === 'CONSUMER') {
                navigate('/consumer-dashboard');
            } else if (user.role === 'PROVIDER') {
                navigate('/provider-dashboard');
            } else if (user.role === 'ADMIN') {
                navigate('/admin-dashboard');
            }
        }
    }, [navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await auth.register({
                name,
                email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.org`,
                password,
                address,
                phone,
                lat: mapLocation?.lat,
                lng: mapLocation?.lng,
                role: 'CONSUMER'
            });
            setShowSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-surface flex items-center justify-center p-6">
            <div className="max-w-2xl w-full">
                <Link to="/" className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors mb-10 group">
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-bold text-sm">Back to Selection</span>
                </Link>

                <div className="bg-white p-12 rounded-[2.5rem] shadow-ambient border border-outline-variant/10">
                    <div className="flex items-start md:items-center gap-4 mb-10">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary flex-shrink-0">
                            <Heart size={24} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-headline font-bold">NGO Registration</h1>
                            <p className="text-on-surface-variant text-sm">Join ZeroHunger Sync to receive food alerts</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">Organization Name</label>
                            <input
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Edhi Foundation"
                                className="w-full px-6 py-4 bg-surface-container-low rounded-2xl border border-outline-variant/10 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">
                                Headquarters Address
                                {geocoding && <span className="ml-2 normal-case tracking-normal text-primary">Filling from map…</span>}
                            </label>
                            <textarea
                                required
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="Type the address, or pin it on the map below"
                                className="w-full px-6 py-4 bg-surface-container-low rounded-2xl border border-outline-variant/10 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none min-h-[120px] font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2 ml-1">
                                <MapPin size={14} className="text-primary" />
                                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Pin Your Location</label>
                            </div>
                            <div className="h-[300px] rounded-2xl overflow-hidden border border-outline-variant/10">
                                <MapView
                                    center={mapLocation ? [mapLocation.lat, mapLocation.lng] : [33.6844, 73.0479]}
                                    zoom={13}
                                    location={mapLocation ? { ...mapLocation, name, address } : undefined}
                                    height="100%"
                                    onLocationSelect={handleMapSelect}
                                />
                            </div>
                            <p className="text-xs font-medium text-on-surface-variant ml-1">
                                {mapLocation
                                    ? `Selected coordinates: ${mapLocation.lat.toFixed(5)}, ${mapLocation.lng.toFixed(5)}`
                                    : 'Click the map to pin your headquarters — the address fills in automatically.'}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">Phone Number</label>
                            <input
                                required
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+92 300 1234567"
                                className="w-full px-6 py-4 bg-surface-container-low rounded-2xl border border-outline-variant/10 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none font-medium"
                                type="tel"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">Password</label>
                            <input
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Min 6 characters"
                                className="w-full px-6 py-4 bg-surface-container-low rounded-2xl border border-outline-variant/10 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none font-medium"
                                type="password"
                                minLength={6}
                            />
                        </div>

                        {error && (
                            <FeedbackBanner tone="error" title="Registration failed" message={error} onDismiss={() => setError('')} />
                        )}

                        <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 flex gap-4">
                            <ShieldCheck className="text-primary shrink-0" size={24} />
                            <p className="text-xs text-primary font-medium leading-relaxed">
                                <strong>Safety Protocol:</strong> All NGO accounts require manual verification to ensure food safety standards are maintained during distribution.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-green-100 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {loading ? 'Submitting...' : 'Submit Application'}
                        </button>
                    </form>
                </div>
            </div>
            <FeedbackModal
                open={showSuccess}
                tone="success"
                title="Application submitted"
                message="Your NGO account is queued for admin verification. You can sign in after approval."
                confirmLabel="Go to login"
                onConfirm={() => navigate('/login')}
            />
        </div>
    );
};

export default ConsumerRegistration;
