import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  User,
  Store,
  Phone,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  ArrowLeft
} from 'lucide-react';
import { auth, getCurrentUser } from '../utils/api';
import MapView from '../components/MapView';
import { FeedbackBanner, FeedbackModal } from '../components/Feedback';

const ProviderRegistration = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mapLocation, setMapLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      if (user.role === 'PROVIDER') {
        navigate('/provider-dashboard');
      } else if (user.role === 'CONSUMER') {
        navigate('/consumer-dashboard');
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
        email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        password,
        address,
        phone,
        lat: mapLocation?.lat,
        lng: mapLocation?.lng,
        role: 'PROVIDER'
      });
      setShowSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen selection:bg-primary-fixed selection:text-on-primary-fixed font-body">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-outline-variant/5 flex justify-between items-center px-8 py-4">
        <div className="flex items-center gap-2">
          <Link to="/" className="text-xl font-black tracking-tight text-primary font-headline">ZeroHunger Sync</Link>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <Link className="text-on-surface-variant hover:text-primary transition-colors font-bold text-sm" to="/login">Login</Link>
          <Link className="text-on-surface-variant hover:text-primary transition-colors font-bold text-sm" to="/">Impact</Link>
        </div>
        <div className="flex items-center gap-4">
          <Bell className="text-on-surface-variant cursor-pointer" size={20} />
          <Link to="/login" className="text-on-surface-variant">
            <User size={20} />
          </Link>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-4 md:px-8 max-w-6xl mx-auto">
        {/* Header Section */}
        <header className="mb-16 text-center md:text-left">
          <p className="text-primary font-bold text-xs tracking-[0.2em] uppercase mb-4">Partner With Us</p>
          <h1 className="text-5xl md:text-6xl font-black text-on-surface tracking-tight leading-tight mb-6 font-headline">Provider Registration</h1>
          <p className="text-on-surface-variant max-w-2xl text-lg leading-relaxed font-medium">
            Synchronize surplus food distribution across Islamabad. Your registration helps us verify your establishment and connect you with local rescue agencies.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Form Section */}
          <div className="lg:col-span-7 space-y-10">
            <form className="space-y-10" onSubmit={handleSubmit}>
              {/* Basic Info Card */}
              <section className="bg-white p-10 rounded-[2.5rem] shadow-ambient border border-outline-variant/5 space-y-8">
                <div className="flex items-start md:items-center gap-4 mb-2">
                  <div className="p-3 bg-primary-fixed rounded-2xl text-primary flex-shrink-0">
                    <Store size={24} />
                  </div>
                  <h2 className="text-2xl font-bold font-headline">Establishment Details</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Establishment Name</label>
                    <input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant/10 rounded-2xl px-6 py-4 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none font-medium"
                      placeholder="e.g. The Grand Bistro"
                      type="text"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Business Type</label>
                    <div className="relative">
                      <select className="w-full bg-surface-container-low border border-outline-variant/10 rounded-2xl px-6 py-4 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none appearance-none cursor-pointer font-medium">
                        <option>Restaurant</option>
                        <option>Hotel / Catering</option>
                        <option>Grocery Store</option>
                        <option>Bakery</option>
                      </select>
                      <ChevronDown size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Full Address (Islamabad)</label>
                  <textarea
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant/10 rounded-2xl px-6 py-4 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none font-medium"
                    placeholder="Street number, Sector, Landmark..."
                    rows={3}
                  />
                </div>
              </section>

              {/* Contact Info Card */}
              <section className="bg-white p-10 rounded-[2.5rem] shadow-ambient border border-outline-variant/5 space-y-8">
                <div className="flex items-start md:items-center gap-4 mb-2">
                  <div className="p-3 bg-primary/10 rounded-2xl text-primary flex-shrink-0">
                    <Phone size={24} />
                  </div>
                  <h2 className="text-2xl font-bold font-headline">Primary Contact</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Contact Person</label>
                    <input
                      required
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant/10 rounded-2xl px-6 py-4 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none font-medium"
                      placeholder="Full Name"
                      type="text"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Phone Number</label>
                    <input
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant/10 rounded-2xl px-6 py-4 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none font-medium"
                      placeholder="+92 300 1234567"
                      type="tel"
                    />
                  </div>
                </div>
              </section>

              {/* Password Card */}
              <section className="bg-white p-10 rounded-[2.5rem] shadow-ambient border border-outline-variant/5 space-y-8">
                <div className="flex items-start md:items-center gap-4 mb-2">
                  <div className="p-3 bg-primary-fixed rounded-2xl text-primary flex-shrink-0">
                    <ShieldCheck size={24} />
                  </div>
                  <h2 className="text-2xl font-bold font-headline">Security</h2>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Password</label>
                  <input
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant/10 rounded-2xl px-6 py-4 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none font-medium"
                    placeholder="Min 6 characters"
                    type="password"
                    minLength={6}
                  />
                </div>
              </section>

              {error && (
                <FeedbackBanner tone="error" title="Registration failed" message={error} onDismiss={() => setError('')} />
              )}

              <div className="flex flex-col sm:flex-row justify-between items-center pt-6 gap-6">
                <Link to="/" className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-bold group">
                  <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                  <span>Cancel Registration</span>
                </Link>
                <div className="flex gap-4 w-full sm:w-auto">
                  <button className="flex-1 sm:flex-initial px-8 py-4 font-bold text-on-surface-variant hover:bg-surface-container-high transition-all rounded-2xl" type="button">Save Draft</button>
                  <button type="submit" className="flex-1 sm:flex-initial bg-primary text-white px-12 py-5 rounded-2xl font-bold shadow-xl shadow-green-100 active:scale-95 transition-all">
                    Register Now
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Map & Sidebar Section */}
          <div className="lg:col-span-5 space-y-10">
            {/* Map Card with Leaflet */}
            <div className="bg-white rounded-[2.5rem] shadow-ambient overflow-hidden flex flex-col border border-outline-variant/5">
              <div className="p-8 border-b border-outline-variant/5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <MapPin className="text-primary" size={24} />
                    <h3 className="font-bold text-xl font-headline">Collection Point</h3>
                  </div>
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">Live Zone</span>
                </div>
                <p className="text-sm text-on-surface-variant font-medium">Help delivery riders find your pickup point precisely.</p>
              </div>
              <div className="h-[450px]">
                <MapView 
                  center={mapLocation ? [mapLocation.lat, mapLocation.lng] : [33.6844, 73.0479]}
                  zoom={13}
                  location={mapLocation ? { ...mapLocation, name, address } : undefined}
                  height="100%"
                  onLocationSelect={(lat, lng) => setMapLocation({ lat, lng })}
                />
              </div>
              <div className="border-t border-outline-variant/5 p-5">
                <p className="text-xs font-bold text-on-surface-variant">
                  {mapLocation
                    ? `Selected pickup coordinates: ${mapLocation.lat.toFixed(5)}, ${mapLocation.lng.toFixed(5)}`
                    : 'Click the map to pin the pickup entrance for riders.'}
                </p>
              </div>
            </div>

            {/* Why Join Card */}
            <div className="bg-on-surface text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
              <ShieldCheck className="absolute -right-6 -bottom-6 text-white/5 w-64 h-64 rotate-12 group-hover:scale-110 transition-transform" />
              <h4 className="text-2xl font-bold mb-8 text-primary-fixed font-headline">Why Partner?</h4>
              <ul className="space-y-6 relative z-10">
                <li className="flex items-start gap-4">
                  <CheckCircle2 className="text-primary-fixed-variant shrink-0" size={20} />
                  <p className="text-sm font-medium leading-relaxed opacity-80">Verified status increases NGO trust and pickup priority.</p>
                </li>
                <li className="flex items-start gap-4">
                  <CheckCircle2 className="text-primary-fixed-variant shrink-0" size={20} />
                  <p className="text-sm font-medium leading-relaxed opacity-80">Automated tax-deductible receipting for all donations.</p>
                </li>
                <li className="flex items-start gap-4">
                  <CheckCircle2 className="text-primary-fixed-variant shrink-0" size={20} />
                  <p className="text-sm font-medium leading-relaxed opacity-80">Real-time impact dashboard for annual CSR reports.</p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
      <FeedbackModal
        open={showSuccess}
        tone="success"
        title="Registration submitted"
        message="Your provider application is ready for admin review. You can sign in after approval."
        confirmLabel="Go to login"
        onConfirm={() => navigate('/login')}
      />
    </div>
  );
};

export default ProviderRegistration;
