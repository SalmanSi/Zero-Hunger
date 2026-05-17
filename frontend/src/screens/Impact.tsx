import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Utensils, 
  Heart, 
  Package, 
  Clock, 
  TrendingUp, 
  MapPin, 
  Calendar,
  Users,
  Star,
  ArrowRight
} from 'lucide-react';
import { publicStats } from '../utils/api';

interface Listing {
  id: string;
  description: string;
  servings: number;
  location: string;
  foodType: string;
  status: string;
  provider?: { name: string };
  pickupStart: string;
}

const CountUp: React.FC<{ end: number; suffix?: string; prefix?: string }> = ({ end, suffix = '', prefix = '' }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 2000;
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

const ImpactPage = () => {
  const [stats, setStats] = useState({
    totalMeals: 0,
    activeProviders: 0,
    activeNGOs: 0,
    totalRescues: 0,
    thisWeek: 0,
    co2Saved: 0,
    weeklyServings: [] as { date: string; servings: number }[],
    topLocations: [] as { location: string; servings: number; listings: number }[]
  });
  const [recentActivity, setRecentActivity] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await publicStats.get();
        setRecentActivity(data.recentListings || []);
        setStats({
          totalMeals: data.mealsSaved || 0,
          activeProviders: data.activeProviders || 0,
          activeNGOs: data.activeNGOs || 0,
          totalRescues: data.activeRescues || 0,
          thisWeek: data.rescuesToday || 0,
          co2Saved: Math.round((data.mealsSaved || 0) * 0.45),
          weeklyServings: data.weeklyServings || [],
          topLocations: data.topLocations || []
        });
      } catch (e) {
        console.error('Failed to fetch impact data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="bg-gradient-to-br from-slate-50 via-white to-slate-100 min-h-screen">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="text-xl font-black bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent">
            ZeroHunger Sync
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login" className="px-5 py-2 bg-primary text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all">
              Login
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
            <Star size={12} className="fill-green-600" />
            Our Impact
          </span>
          <h1 className="text-5xl font-headline font-black text-slate-900 mb-4">
            Making a Difference
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            ZeroHunger Sync is bridging the gap between surplus and scarcity, one meal at a time.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {[
            { icon: Utensils, label: 'Meals Saved', value: stats.totalMeals, color: 'from-primary to-green-600' },
            { icon: Heart, label: 'NGO Partners', value: stats.activeNGOs, color: 'from-primary to-green-600' },
            { icon: Package, label: 'Active Providers', value: stats.activeProviders, color: 'from-primary to-green-600' },
            { icon: Clock, label: 'Rescues Today', value: stats.thisWeek, color: 'from-primary to-green-600' }
          ].map((stat, idx) => (
            <div key={idx} className="bg-white rounded-[2rem] p-6 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all">
              <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
                <stat.icon size={24} className="text-white" />
              </div>
              <p className="text-3xl font-black text-slate-900 mb-1">
                <CountUp end={stat.value} />
              </p>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* Weekly Trend */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Weekly Progress</h3>
                <p className="text-sm text-slate-500">Meals rescued this week</p>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <TrendingUp size={20} />
                <span className="font-bold">{stats.weeklyServings.reduce((sum, day) => sum + day.servings, 0).toLocaleString()}</span>
              </div>
            </div>
            <div className="flex items-end gap-3 h-40">
              {(stats.weeklyServings.length ? stats.weeklyServings : Array.from({ length: 7 }, (_, index) => ({ date: String(index), servings: 0 }))).map((day, idx, days) => {
                const maxServings = Math.max(...days.map((item) => item.servings), 1);
                const height = Math.max(8, (day.servings / maxServings) * 100);
                return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <div 
                    className="w-full bg-gradient-to-t from-primary to-green-500 rounded-t-lg transition-all hover:opacity-80"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-xs text-slate-400">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][idx]}</span>
                </div>
              )})}
            </div>
          </div>

          {/* Sector Distribution */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl">
            <h3 className="text-xl font-bold text-slate-900 mb-8">Top Sectors</h3>
            <div className="space-y-4">
              {stats.topLocations.slice(0, 4).map((item, idx, locations) => {
                const maxServings = Math.max(...locations.map((location) => location.servings), 1);
                return (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-700">{item.location}</span>
                    <span className="text-sm text-slate-500">{item.servings.toLocaleString()} servings</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-green-500 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.max(12, (item.servings / maxServings) * 100)}%` }}
                    />
                  </div>
                </div>
              )})}
              {stats.topLocations.length === 0 && <p className="text-sm text-slate-500">No completed pickup location data yet.</p>}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl mb-16">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-slate-900">Recent Activity</h3>
            <Link to="/login" className="text-primary font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all">
              View All <ArrowRight size={16} />
            </Link>
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity, idx) => (
              <div key={activity.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Utensils size={20} className="text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800">{activity.description}</p>
                  <p className="text-sm text-slate-500 flex items-center gap-2">
                    <MapPin size={14} /> {activity.location} • {activity.servings} servings
                  </p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                  AVAILABLE
                </span>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                No recent activity yet.
              </div>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-primary to-green-600 rounded-[2.5rem] p-12 text-center text-white">
          <h3 className="text-3xl font-black mb-4">Join the Movement</h3>
          <p className="text-white/80 max-w-xl mx-auto mb-8">
            Start saving food and helping those in need. Join as a provider or NGO today.
          </p>
          <div className="flex justify-center gap-4">
            <Link 
              to="/provider-registration" 
              className="px-8 py-4 bg-white text-primary rounded-2xl font-bold hover:shadow-xl transition-all"
            >
              Register as Provider
            </Link>
            <Link 
              to="/ngo-registration" 
              className="px-8 py-4 bg-white/20 text-white rounded-2xl font-bold hover:bg-white/30 transition-all"
            >
              Register as NGO
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ImpactPage;
