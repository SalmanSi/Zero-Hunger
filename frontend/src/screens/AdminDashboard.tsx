import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    ClipboardCheck,
    BarChart3,
    LogOut,
    Users,
    UserCheck,
    AlertCircle,
    Package,
    ArrowUpRight,
    TrendingUp,
    ShieldCheck,
    Building2,
    LayoutDashboard,
    Loader2
} from 'lucide-react';
import { users as usersApi, auth, getCurrentUser } from '../utils/api';
import { FeedbackBanner } from '../components/Feedback';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'PROVIDER' | 'CONSUMER' | 'ADMIN';
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    address: string;
    createdAt: string;
}

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState<User[]>([]);
    const [listingsCount, setListingsCount] = useState(0);
    const [activeTab, setActiveTab] = useState<'registrations' | 'analytics'>('registrations');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [stats, setStats] = useState<any>(null);
    const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; title: string; message?: string } | null>(null);

    useEffect(() => {
        const user = getCurrentUser();
        if (!user) {
            navigate('/login');
            return;
        }
        if (user.role !== 'ADMIN') {
            navigate('/');
            return;
        }
    }, [navigate]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [usersData, statsData] = await Promise.all([
                    usersApi.getAll(),
                    usersApi.getStats()
                ]);
                setUsers(usersData);
                setStats(statsData);
                setListingsCount(statsData.listings || 0);
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleStatusUpdate = async (userId: string, newStatus: 'APPROVED' | 'REJECTED') => {
        setActionLoading(userId);
        try {
            if (newStatus === 'APPROVED') {
                await usersApi.approve(userId);
            } else {
                await usersApi.reject(userId);
            }
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
            setFeedback({
                tone: 'success',
                title: newStatus === 'APPROVED' ? 'Application approved' : 'Application rejected',
                message: 'The registration queue has been updated.'
            });
        } catch (error: any) {
            setFeedback({ tone: 'error', title: 'Action failed', message: error.message || 'Could not update this application.' });
        } finally {
            setActionLoading(null);
        }
    };

    const handleLogout = () => {
        auth.logout();
        navigate('/login');
    };

    const pendingUsers = users.filter(u => u.status === 'PENDING');

    const distributionData = stats?.topProviders || [];
    const weeklyTotal = stats?.weeklyServings?.reduce((sum: number, day: any) => sum + day.servings, 0) || 0;
    const claimedOrCompleted = (stats?.claimedListings || 0) + (stats?.completedListings || 0);
    const completionRate = stats?.listings ? Math.round((claimedOrCompleted / stats.listings) * 100) : 0;

    const userStats = {
        providers: users.filter(u => u.role === 'PROVIDER').length,
        ngos: users.filter(u => u.role === 'CONSUMER').length
    };
    const totalNetworkUsers = Math.max(userStats.providers + userStats.ngos, 1);

    return (
        <div className="min-h-screen bg-surface flex">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-950 text-white flex flex-col p-6 fixed h-full z-40">
                <div className="mb-10 flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <ShieldCheck size={20} className="text-white" />
                    </div>
                    <div>
                        <Link to="/" className="text-lg font-black text-white font-headline leading-none block">ZH Admin</Link>
                        <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1 block">Control Center</span>
                    </div>
                </div>
                <nav className="flex-1 space-y-2">
                    <button
                        onClick={() => setActiveTab('registrations')}
                        className={`flex items-center gap-3 w-full p-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'registrations' ? 'bg-primary text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                    >
                        <UserCheck size={20} />
                        <span>Registrations</span>
                        {pendingUsers.length > 0 && (
                            <span className="ml-auto bg-white/20 px-2 py-0.5 rounded-full text-[10px]">{pendingUsers.length}</span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`flex items-center gap-3 w-full p-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'analytics' ? 'bg-primary text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                    >
                        <BarChart3 size={20} />
                        <span>Analytics</span>
                    </button>
                </nav>
                <div className="pt-6 border-t border-white/5">
                    <button onClick={handleLogout} className="flex items-center gap-3 w-full p-3 text-white/40 hover:text-white transition-all text-sm font-bold">
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            <main className="ml-64 flex-1 p-12 max-w-7xl mx-auto w-full">
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
                <header className="mb-12 flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-headline font-black mb-2 tracking-tight text-slate-900 capitalize">
                            {activeTab === 'registrations' ? 'Administrative Overview' : 'Network Analytics'}
                        </h1>
                        <p className="text-on-surface-variant font-medium">
                            {activeTab === 'registrations'
                                ? 'Manage partnerships and monitor network health.'
                                : 'Visual insights into food distribution and community impact.'}
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-white px-4 py-2 rounded-xl border border-outline-variant/10 flex items-center gap-2">
                            <TrendingUp size={16} className="text-primary" />
                            <span className="text-xs font-bold text-on-surface uppercase tracking-tight">{weeklyTotal.toLocaleString()} meals this week</span>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-outline-variant/10 relative overflow-hidden group hover:-translate-y-1 transition-all">
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
                                <Building2 size={24} />
                            </div>
                            <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-1">Total Entities</p>
                            <p className="text-4xl font-black tracking-tighter">{users.length}</p>
                        </div>
                        <Users className="absolute -right-4 -bottom-4 text-blue-50 w-32 h-32 rotate-12 group-hover:scale-110 transition-transform" strokeWidth={1} />
                    </div>
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-outline-variant/10 relative overflow-hidden group hover:-translate-y-1 transition-all">
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-primary-fixed rounded-2xl flex items-center justify-center text-primary mb-6">
                                <ShieldCheck size={24} />
                            </div>
                            <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-1">Pending Review</p>
                            <p className="text-4xl font-black tracking-tighter text-primary">{pendingUsers.length}</p>
                        </div>
                        <AlertCircle className="absolute -right-4 -bottom-4 text-green-50 w-32 h-32 -rotate-12 group-hover:scale-110 transition-transform" strokeWidth={1} />
                    </div>
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-outline-variant/10 relative overflow-hidden group hover:-translate-y-1 transition-all">
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600 mb-6">
                                <Package size={24} />
                            </div>
                            <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-1">Network Listings</p>
                            <p className="text-4xl font-black tracking-tighter text-green-600">{listingsCount}</p>
                        </div>
                        <LayoutDashboard className="absolute -right-4 -bottom-4 text-green-50 w-32 h-32 rotate-6 group-hover:scale-110 transition-transform" strokeWidth={1} />
                    </div>
                </div>

                {activeTab === 'registrations' ? (
                    <section className="bg-white rounded-[2.5rem] shadow-sm border border-outline-variant/10 overflow-hidden">
                        <div className="p-8 border-b border-outline-variant/10 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight">Pending Applications</h2>
                                <p className="text-sm text-on-surface-variant mt-1">Review applicant credibility before network access.</p>
                            </div>
                            <div className="flex gap-2">
                                <button className="p-2 hover:bg-surface-container-low rounded-lg transition-all border border-outline-variant/10">
                                    <TrendingUp size={18} className="text-on-surface-variant" />
                                </button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-surface-container-low text-on-surface-variant text-[10px] font-bold uppercase tracking-widest">
                                    <tr>
                                        <th className="px-8 py-5 text-on-surface-variant/60">Partner Name</th>
                                        <th className="px-8 py-5 text-on-surface-variant/60">Role Type</th>
                                        <th className="px-8 py-5 text-on-surface-variant/60">Primary Location</th>
                                        <th className="px-8 py-5 text-right text-on-surface-variant/60">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-outline-variant/5">
                                    {pendingUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-20 text-center">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center text-primary">
                                                        <ClipboardCheck size={32} strokeWidth={1.5} />
                                                    </div>
                                                    <div>
                                                        <p className="text-on-surface font-bold">Clear Queue</p>
                                                        <p className="text-sm text-on-surface-variant italic">All pending applications have been processed.</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        pendingUsers.map(user => (
                                            <tr key={user.id} className="hover:bg-surface-container-low/30 transition-colors group">
                                                <td className="px-8 py-6">
                                                    <div className="font-bold text-on-surface group-hover:text-primary transition-colors">{user.name}</div>
                                                    <div className="text-[10px] text-on-surface-variant font-medium">{user.email}</div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${user.role === 'PROVIDER' ? 'bg-green-50 text-green-700' : 'bg-primary-fixed text-primary'}`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-sm font-medium text-on-surface-variant italic">{user.address}</td>
                                                <td className="px-8 py-6">
                                                    <div className="flex gap-3 justify-end items-center">
                                                        <button
                                                            onClick={() => handleStatusUpdate(user.id, 'APPROVED')}
                                                            className="px-6 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-lg shadow-green-100 hover:scale-[1.05] active:scale-95 transition-all"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusUpdate(user.id, 'REJECTED')}
                                                            className="px-4 py-2 text-on-surface-variant hover:text-red-500 font-bold text-xs transition-colors"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Distribution Chart */}
                        <section className="lg:col-span-8 bg-white p-10 rounded-[2.5rem] shadow-sm border border-outline-variant/10">
                            <div className="flex justify-between items-center mb-10">
                                <div>
                                    <h3 className="text-2xl font-bold tracking-tight">Food Distribution</h3>
                                    <p className="text-sm text-on-surface-variant">Top providers by meal servings contributed.</p>
                                </div>
                                <div className="flex gap-2">
                                    <span className="text-xs font-bold bg-green-50 text-green-600 px-3 py-1 rounded-full uppercase tracking-tighter">Live Stats</span>
                                </div>
                            </div>

                            <div className="space-y-8">
                                {distributionData.map((item: any, idx: number) => (
                                    <div key={idx} className="space-y-3">
                                        <div className="flex justify-between items-end">
                                            <span className="text-sm font-bold text-on-surface">{item.name}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-black">{item.servings}</span>
                                                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Servings</span>
                                            </div>
                                        </div>
                                        <div className="h-4 bg-surface-container rounded-full overflow-hidden flex">
                                            <div
                                                className="h-full rounded-full transition-all duration-1000 ease-out"
                                                style={{
                                                    width: `${Math.max(8, (item.servings / Math.max(...distributionData.map((provider: any) => provider.servings), 1)) * 100)}%`,
                                                    backgroundColor: '#16a34a',
                                                    boxShadow: '0 0 15px #16a34a33'
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                                {distributionData.length === 0 && (
                                    <p className="text-sm text-on-surface-variant">Completed or claimed donations will appear here once providers start contributing.</p>
                                )}
                            </div>

                            <div className="mt-12 pt-8 border-t border-outline-variant/5 grid grid-cols-3 gap-8">
                                <div>
                                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Total Impact</p>
                                    <p className="text-2xl font-black">{(stats?.mealsSaved || 0).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Efficiency</p>
                                    <p className="text-2xl font-black text-primary">{completionRate}%</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Rescues Today</p>
                                    <p className="text-2xl font-black text-green-600">{stats?.rescuesToday || 0}</p>
                                </div>
                            </div>
                        </section>

                        {/* User Distribution Doughnut */}
                        <section className="lg:col-span-4 bg-white p-10 rounded-[2.5rem] shadow-sm border border-outline-variant/10 flex flex-col items-center">
                            <h3 className="text-xl font-bold tracking-tight mb-8 w-full text-left">Network Mix</h3>

                            <div className="relative w-48 h-48 mb-8">
                                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                                    {/* Doughnut implementation using stroke-dasharray */}
                                    {/* Provider segment */}
                                    <circle
                                        cx="50" cy="50" r="40"
                                        fill="transparent"
                                        stroke="#16a34a"
                                        strokeWidth="15"
                                        strokeDasharray={`${(userStats.providers / totalNetworkUsers) * 251.2} 251.2`}
                                        className="transition-all duration-1000"
                                    />
                                    {/* NGO segment */}
                                    <circle
                                        cx="50" cy="50" r="40"
                                        fill="transparent"
                                        stroke="#0f172a"
                                        strokeWidth="15"
                                        strokeDasharray={`${(userStats.ngos / totalNetworkUsers) * 251.2} 251.2`}
                                        strokeDashoffset={`-${(userStats.providers / totalNetworkUsers) * 251.2}`}
                                        className="transition-all duration-1000"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <p className="text-2xl font-black leading-none">{users.length}</p>
                                    <p className="text-[8px] font-bold uppercase text-on-surface-variant mt-1">Partners</p>
                                </div>
                            </div>

                            <div className="w-full space-y-4">
                                <div className="flex justify-between items-center p-4 bg-green-50 rounded-2xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-primary" />
                                        <span className="text-sm font-bold text-primary">Providers</span>
                                    </div>
                                    <span className="text-lg font-black">{userStats.providers}</span>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-slate-950" />
                                        <span className="text-sm font-bold text-slate-950">NGOs</span>
                                    </div>
                                    <span className="text-lg font-black">{userStats.ngos}</span>
                                </div>
                            </div>

                            <div className="mt-auto w-full pt-8">
                                <button className="w-full py-4 text-xs font-bold text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center gap-2">
                                    Download Full Report <ArrowUpRight size={14} />
                                </button>
                            </div>
                        </section>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;
