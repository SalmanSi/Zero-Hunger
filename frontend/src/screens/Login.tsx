import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, Loader2, Utensils, Heart, Shield } from 'lucide-react';
import { auth, getCurrentUser } from '../utils/api';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const user = getCurrentUser();
        if (user) {
            switch (user.role) {
                case 'ADMIN':
                    navigate('/admin-dashboard');
                    break;
                case 'PROVIDER':
                    navigate('/provider-dashboard');
                    break;
                case 'CONSUMER':
                    navigate('/consumer-dashboard');
                    break;
            }
        }
    }, [navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await auth.login(email, password);
            
            if (data.user.status === 'PENDING') {
                setError('Your account is pending approval. Please wait for admin verification.');
                auth.logout();
                setLoading(false);
                return;
            }

            switch (data.user.role) {
                case 'ADMIN':
                    navigate('/admin-dashboard');
                    break;
                case 'PROVIDER':
                    navigate('/provider-dashboard');
                    break;
                case 'CONSUMER':
                    navigate('/consumer-dashboard');
                    break;
                default:
                    navigate('/');
            }
        } catch (err: any) {
            setError(err.message || 'Invalid credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gradient-to-br from-slate-50 via-white to-slate-100 min-h-screen flex items-center justify-center p-6 overflow-hidden relative">
            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -left-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            <div className={`max-w-md w-full relative transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-primary transition-colors mb-10 group">
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-bold text-sm">Back to Home</span>
                </Link>
                
                <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-2xl border border-white/50">
                    {/* Logo */}
                    <div className="flex justify-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary to-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-100">
                            <Utensils size={28} className="text-white" />
                        </div>
                    </div>
                    
                    <h1 className="text-4xl font-headline font-black text-slate-900 mb-2 text-center">
                        Welcome Back
                    </h1>
                    <p className="text-slate-500 mb-10 text-center">Login to continue your rescue mission.</p>
                    
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600 px-1">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                                <input 
                                    required 
                                    type="email" 
                                    value={email} 
                                    onChange={(e) => setEmail(e.target.value)} 
                                    placeholder="name@organization.com" 
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-medium" 
                                />
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600 px-1">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                                <input 
                                    required 
                                    type="password" 
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)} 
                                    placeholder="Enter your password" 
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-medium" 
                                />
                            </div>
                        </div>
                        
                        {error && (
                            <div className="p-4 bg-red-50 text-red-600 text-sm rounded-2xl border border-red-100 flex items-center gap-2">
                                <Shield size={18} className="text-red-500" />
                                {error}
                            </div>
                        )}
                        
                        <button 
                            type="submit" 
                            disabled={loading} 
                            className="w-full py-4 bg-gradient-to-r from-primary to-green-600 text-white rounded-2xl font-bold shadow-xl shadow-green-100 hover:shadow-2xl hover:shadow-green-200 hover:-translate-y-1 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    Logging in...
                                </>
                            ) : (
                                'Login'
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-slate-100">
                        <p className="text-sm text-slate-500 text-center mb-4">Don't have an account?</p>
                        <div className="grid grid-cols-2 gap-3">
                            <Link 
                                to="/provider-registration" 
                                className="py-3 text-center border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:border-primary hover:text-primary transition-all"
                            >
                                Provider
                            </Link>
                            <Link 
                                to="/ngo-registration" 
                                className="py-3 text-center border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:border-primary hover:text-primary transition-all"
                            >
                                NGO
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Demo Credentials */}
                <div className="mt-8 p-4 bg-white/50 rounded-2xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Demo Credentials</p>
                    <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Admin:</span>
                            <span className="font-mono text-slate-700">admin@zerohunger.org / admin123</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Provider:</span>
                            <span className="font-mono text-slate-700">bistro@example.com / provider123</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">NGO:</span>
                            <span className="font-mono text-slate-700">edhi@example.com / consumer123</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
