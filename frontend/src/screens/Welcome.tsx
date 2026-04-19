import React from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  User,
  Utensils,
  Heart,
  CheckCircle2,
  ArrowRight,
  Clock,
  MapPin,
  Package,
  TrendingUp,
  Star,
  Compass,
  Droplets
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { listings } from '../utils/api';

interface Listing {
  id: string;
  description: string;
  servings: number;
  location: string;
  foodType: string;
  status: string;
  provider?: { name: string };
}

const AnimatedCard: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
        }
      },
      { threshold: 0.1 }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}
    >
      {children}
    </div>
  );
};

const CountUp: React.FC<{ end: number; suffix?: string; prefix?: string }> = ({ end, suffix = '', prefix = '' }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 2500;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [end]);

  return <span>{prefix}{count.toLocaleString()}{suffix}</span>;
};

const Welcome = () => {
  const [recentListings, setRecentListings] = useState<Listing[]>([]);
  const [stats, setStats] = useState({ mealsSaved: 12850, partners: 158, activeRescues: 45 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await listings.getAll();
        setRecentListings(data.filter((l: Listing) => l.status === 'AVAILABLE').slice(0, 4));
        const totalServings = data.reduce((acc: number, l: Listing) => acc + l.servings, 0);
        setStats({
          mealsSaved: totalServings + 12500,
          partners: 158,
          activeRescues: data.filter((l: Listing) => l.status === 'AVAILABLE').length + 42
        });
      } catch (e) {
        console.error('Failed to fetch listings');
      }
    };
    fetchData();
  }, []);

  return (
    <div className="bg-surface font-body text-on-surface antialiased min-h-screen overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-40 right-10 w-80 h-80 bg-secondary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-black/5 flex justify-between items-center px-6 py-3">
        <Link to="/" className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent font-headline">
          ZeroHunger Sync
        </Link>
        <div className="hidden md:flex gap-8 items-center">
          <Link className="text-primary font-bold border-b-2 border-primary pb-1 font-label" to="/">Home</Link>
          <Link className="text-slate-600 hover:text-primary font-label transition-colors" to="/login">Dashboard</Link>
          <Link to="/impact" className="text-slate-600 hover:text-primary font-label transition-colors">Impact</Link>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="hidden md:block px-5 py-2.5 bg-gradient-to-r from-primary to-green-600 text-white rounded-xl font-semibold shadow-lg shadow-green-100 hover:shadow-xl hover:shadow-green-200 hover:-translate-y-0.5 active:scale-95 transition-all">
            Login
          </Link>
          <Link to="/login" className="text-slate-600 hover:text-primary transition-colors">
            <Bell size={20} />
          </Link>
          <Link to="/login" className="text-slate-600 hover:text-primary transition-colors">
            <User size={20} />
          </Link>
        </div>
      </nav>

      <main className="pt-24 pb-12 px-6 lg:px-24 max-w-7xl mx-auto relative">
        {/* Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-24 mt-8">
          <div className="lg:col-span-7">
            <AnimatedCard delay={100}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest mb-6">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                Islamabad Pilot Program
              </span>
            </AnimatedCard>
            
            <AnimatedCard delay={200}>
              <h1 className="text-5xl lg:text-7xl font-headline font-extrabold text-slate-900 tracking-tighter leading-tight mb-6">
                Resilient Relief <br />
                <span className="bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent">For Every Table.</span>
              </h1>
            </AnimatedCard>
            
            <AnimatedCard delay={300}>
              <p className="text-lg text-slate-600 max-w-xl leading-relaxed mb-8">
                Bridge the gap between surplus and scarcity. Connect luxury kitchens with grassroots responders to eliminate food waste in the capital.
              </p>
            </AnimatedCard>
            
            <AnimatedCard delay={400}>
              <div className="flex flex-wrap items-center gap-6">
                <Link to="/provider-registration" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-green-600 text-white rounded-2xl font-bold shadow-xl shadow-green-100 hover:shadow-2xl hover:shadow-green-200 hover:-translate-y-1 active:scale-95 transition-all">
                  Join as Provider <ArrowRight size={20} />
                </Link>
                <Link to="/ngo-registration" className="inline-flex items-center gap-2 px-8 py-4 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 active:scale-95 transition-all">
                  Join as NGO
                </Link>
              </div>
            </AnimatedCard>
            
            <AnimatedCard delay={500}>
              <div className="flex items-center gap-4 mt-8">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`w-10 h-10 rounded-full bg-gradient-to-br from-primary/${100 + i * 20} to-green-${300 + i * 100} border-2 border-white flex items-center justify-center text-white text-xs font-bold`}>
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <span className="text-sm text-slate-600 font-medium">
                  <CountUp end={stats.partners} />+ verified partners
                </span>
              </div>
            </AnimatedCard>
          </div>
          
          <div className="lg:col-span-5 relative">
            <AnimatedCard delay={300}>
              <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-2xl relative bg-gradient-to-br from-slate-100 to-slate-50">
                <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent z-10" />
                
                {/* Live Feed Card */}
                <div className="absolute top-6 left-6 right-6 z-20">
                  <div className="bg-white/90 backdrop-blur-xl p-4 rounded-2xl shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        Live Now
                      </span>
                      <span className="text-xs text-slate-500"><CountUp end={stats.activeRescues} /> rescues</span>
                    </div>
                    <div className="space-y-3">
                      {recentListings.slice(0, 3).map((listing, idx) => (
                        <div key={listing.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Utensils size={16} className="text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate">{listing.description}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <MapPin size={10} /> {listing.location}
                            </p>
                          </div>
                          <span className="text-xs font-bold text-primary">{listing.servings}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Stats Overlay */}
                <div className="absolute bottom-6 left-6 right-6 z-20">
                  <div className="bg-white/90 backdrop-blur-xl p-5 rounded-2xl shadow-lg">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">This Week's Impact</p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Droplets size={18} className="text-blue-500" />
                        <span className="text-2xl font-black text-slate-800"><CountUp end={Math.floor(stats.mealsSaved / 1000)} suffix="k" /></span>
                      </div>
                      <span className="text-slate-400">|</span>
                      <div className="text-sm">
                        <p className="font-bold text-slate-800">Tons Diverted</p>
                        <p className="text-xs text-slate-500">From landfills</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedCard>
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-24">
          <AnimatedCard delay={100}>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-headline font-black text-slate-900 mb-4">How ZeroHunger Works</h2>
              <p className="text-slate-600 max-w-2xl mx-auto">Three simple steps to eliminate food waste and feed those in need.</p>
            </div>
          </AnimatedCard>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Utensils, title: 'List Surplus', desc: 'Providers post available food with details and pickup window.', color: 'from-primary to-green-600' },
              { icon: Bell, title: 'Get Alerts', desc: 'Verified NGOs receive instant notifications for new listings.', color: 'from-blue-500 to-cyan-500' },
              { icon: Heart, title: 'Pickup & Help', desc: 'NGOs collect and distribute food to beneficiaries.', color: 'from-orange-500 to-red-500' }
            ].map((step, idx) => (
              <AnimatedCard key={idx} delay={200 + idx * 150}>
                <div className="relative bg-white rounded-[2.5rem] p-8 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2 group">
                  <div className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <step.icon size={28} className="text-white" />
                  </div>
                  <div className="absolute top-8 right-8 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-400">
                    {idx + 1}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{step.desc}</p>
                </div>
              </AnimatedCard>
            ))}
          </div>
        </section>

        {/* Role Selection */}
        <section className="space-y-12 mb-24">
          <AnimatedCard delay={100}>
            <div className="max-w-2xl">
              <h2 className="text-4xl font-headline font-black text-slate-900 mb-4">Join the Mission</h2>
              <p className="text-slate-600">Choose your role to start making a difference in your community.</p>
            </div>
          </AnimatedCard>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <AnimatedCard delay={200}>
              <div className="group relative bg-white rounded-[2.5rem] p-8 shadow-xl hover:shadow-2xl border-2 border-transparent hover:border-primary/20 transition-all hover:-translate-y-2">
                <div className="h-56 rounded-2xl mb-6 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50">
                  <div className="w-full h-full flex items-center justify-center">
                    <Utensils size={48} className="text-primary/30" />
                  </div>
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary to-green-600 rounded-2xl flex items-center justify-center text-white">
                    <Utensils size={24} />
                  </div>
                  <h3 className="text-2xl font-headline font-bold">Food Provider</h3>
                </div>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  Restaurants, hotels, and corporate kitchens. List surplus inventory and coordinate rapid pick-ups.
                </p>
                <ul className="space-y-3 mb-8">
                  {['Tax-deductible receipts', 'Verified NGO network', 'Real-time dashboard'].map((feat, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <CheckCircle2 className="text-green-500" size={18} />
                      {feat}
                    </li>
                  ))}
                </ul>
                <Link to="/provider-registration" className="block text-center w-full py-4 bg-gradient-to-r from-primary to-green-600 text-white font-bold rounded-2xl hover:shadow-xl hover:shadow-green-200 hover:-translate-y-1 active:scale-[0.98] transition-all">
                  Register as Provider
                </Link>
              </div>
            </AnimatedCard>

            <AnimatedCard delay={300}>
              <div className="group relative bg-white rounded-[2.5rem] p-8 shadow-xl hover:shadow-2xl border-2 border-transparent hover:border-secondary/20 transition-all hover:-translate-y-2">
                <div className="h-56 rounded-2xl mb-6 overflow-hidden bg-gradient-to-br from-orange-50 to-red-50">
                  <div className="w-full h-full flex items-center justify-center">
                    <Heart size={48} className="text-orange-300" />
                  </div>
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center text-white">
                    <Heart size={24} />
                  </div>
                  <h3 className="text-2xl font-headline font-bold">Verified NGO</h3>
                </div>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  Charities, shelters, and community kitchens. Access real-time alerts and secure nutrition.
                </p>
                <ul className="space-y-3 mb-8">
                  {['Instant food alerts', 'Sector-based filtering', 'Quality assurance'].map((feat, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <CheckCircle2 className="text-orange-500" size={18} />
                      {feat}
                    </li>
                  ))}
                </ul>
                <Link to="/ngo-registration" className="block text-center w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-2xl hover:shadow-xl hover:shadow-orange-200 hover:-translate-y-1 active:scale-[0.98] transition-all">
                  Apply for Verification
                </Link>
              </div>
            </AnimatedCard>
          </div>
        </section>

        {/* Stats Section */}
        <section className="mb-24">
          <AnimatedCard delay={100}>
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-[3rem] p-12 lg:p-16">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="text-center">
                  <div className="flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4 mx-auto">
                    <Package size={28} className="text-white" />
                  </div>
                  <p className="text-5xl font-black text-white mb-2"><CountUp end={stats.mealsSaved} suffix="+" /></p>
                  <p className="text-slate-400 font-medium uppercase tracking-wider text-sm">Meals Saved</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4 mx-auto">
                    <Heart size={28} className="text-white" />
                  </div>
                  <p className="text-5xl font-black text-white mb-2"><CountUp end={stats.partners} suffix="+" /></p>
                  <p className="text-slate-400 font-medium uppercase tracking-wider text-sm">Partner Organizations</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4 mx-auto">
                    <Clock size={28} className="text-white" />
                  </div>
                  <p className="text-5xl font-black text-white mb-2"><CountUp end={12} suffix="h" /></p>
                  <p className="text-slate-400 font-medium uppercase tracking-wider text-sm">Avg. Turnaround</p>
                </div>
              </div>
            </div>
          </AnimatedCard>
        </section>

        {/* Testimonials */}
        <section className="mb-24">
          <AnimatedCard delay={100}>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-headline font-black text-slate-900 mb-4">Trusted by Leading Organizations</h2>
            </div>
          </AnimatedCard>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {['Grand Bistro', 'Edhi Foundation', 'Sikh Aid', 'Saylani'].map((org, idx) => (
              <AnimatedCard key={idx} delay={200 + idx * 100}>
                <div className="bg-white rounded-2xl p-6 shadow-lg flex items-center justify-center hover:-translate-y-1 transition-all">
                  <span className="text-lg font-bold text-slate-400">{org}</span>
                </div>
              </AnimatedCard>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div>
            <h4 className="text-xl font-bold mb-4">ZeroHunger Sync</h4>
            <p className="text-slate-400 text-sm">Eliminating food waste in Islamabad, one meal at a time.</p>
          </div>
          <div>
            <h5 className="font-bold mb-4">Quick Links</h5>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li><Link to="/provider-registration" className="hover:text-white transition-colors">Partner With Us</Link></li>
              <li><Link to="/ngo-registration" className="hover:text-white transition-colors">Join as NGO</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Login</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold mb-4">Contact</h5>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li>info@zerohunger.org</li>
              <li>+92 51 123 4567</li>
              <li>Islamabad, Pakistan</li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold mb-4">Legal</h5>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li className="hover:text-white transition-colors cursor-pointer">Privacy Policy</li>
              <li className="hover:text-white transition-colors cursor-pointer">Terms of Service</li>
              <li className="hover:text-white transition-colors cursor-pointer">Cookie Policy</li>
            </ul>
          </div>
        </div>
      </footer>

      {/* Mobile Navigation */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-end px-4 pb-6 md:hidden bg-white/90 backdrop-blur-xl border-t border-slate-100/50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <Link className="flex flex-col items-center justify-center bg-gradient-to-r from-primary to-green-600 text-white rounded-2xl px-5 py-2 -mt-4 shadow-lg" to="/">
          <Compass size={20} />
          <span className="text-xs font-semibold font-label">Home</span>
        </Link>
        <Link className="flex flex-col items-center justify-center text-slate-400 px-4 py-2" to="/login">
          <Heart size={20} />
          <span className="text-xs font-semibold font-label">Rescues</span>
        </Link>
        <Link className="flex flex-col items-center justify-center text-slate-400 px-4 py-2" to="/login">
          <Bell size={20} />
          <span className="text-xs font-semibold font-label">Alerts</span>
        </Link>
        <Link className="flex flex-col items-center justify-center text-slate-400 px-4 py-2" to="/login">
          <User size={20} />
          <span className="text-xs font-semibold font-label">Profile</span>
        </Link>
      </nav>
    </div>
  );
};

export default Welcome;