import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { auth } from '../utils/api';
import { FeedbackBanner, FeedbackModal } from '../components/Feedback';

const AdminRegistration = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showUnavailable, setShowUnavailable] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await auth.register({
                name,
                email,
                password,
                address: 'HQ Islamabad',
                role: 'PROVIDER'
            });
            setShowUnavailable(true);
        } catch (err: any) {
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-surface flex items-center justify-center p-6">
            <div className="max-w-lg w-full">
                <Link to="/" className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors mb-10 group">
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-bold text-sm">Back to Home</span>
                </Link>

                <div className="bg-white p-12 rounded-[2.5rem] shadow-ambient border border-outline-variant/10">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center text-white">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-headline font-bold">Admin Access</h1>
                            <p className="text-on-surface-variant text-sm">System administration portal</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">Admin Name</label>
                            <input
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="System Administrator"
                                className="w-full px-6 py-4 bg-surface-container-low rounded-2xl border border-outline-variant/10 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">Email</label>
                            <input
                                required
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@zerohunger.org"
                                className="w-full px-6 py-4 bg-surface-container-low rounded-2xl border border-outline-variant/10 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">Password</label>
                            <input
                                required
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Min 6 characters"
                                minLength={6}
                                className="w-full px-6 py-4 bg-surface-container-low rounded-2xl border border-outline-variant/10 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none font-medium"
                            />
                        </div>

                        {error && (
                            <FeedbackBanner tone="error" title="Request failed" message={error} onDismiss={() => setError('')} />
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 bg-slate-950 text-white rounded-2xl font-bold shadow-lg active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : 'Request Admin Access'}
                        </button>
                    </form>
                </div>
            </div>
            <FeedbackModal
                open={showUnavailable}
                tone="info"
                title="Admin access is restricted"
                message="Admin accounts are provisioned by the system owner. Contact the maintainer instead of registering here."
                confirmLabel="Go to login"
                onConfirm={() => navigate('/login')}
            />
        </div>
    );
};

export default AdminRegistration;
