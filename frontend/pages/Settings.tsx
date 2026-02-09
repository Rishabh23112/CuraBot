import { ArrowLeft, Bell, LogOut, Mail, MapPin, Moon, Save, User as UserIcon } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import GlassCard from '../components/GlassCard';
import { Page, User } from '../types';

interface SettingsProps {
    user: User;
    onNavigate: (page: Page) => void;
    onLogout: () => void;
    onUpdateUser: (user: User) => void;
}

const Settings: React.FC<SettingsProps> = ({ user, onNavigate, onLogout, onUpdateUser }) => {
    const [formData, setFormData] = useState({
        name: user.name,
        email: user.email,
        address: user.address || '',
    });

    const [notifications, setNotifications] = useState(true);
    const [darkMode, setDarkMode] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.playbackRate = 0.8;
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = () => {
        onUpdateUser({ ...user, ...formData });
        alert('Profile updated successfully!');
    };

    return (
        <div className="min-h-screen pt-32 pb-12 px-6 relative bg-slate-900">
            {/* Background Video */}
            <div className="fixed inset-0 z-0">
                <video
                    ref={videoRef}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover opacity-60"
                    poster="https://images.unsplash.com/photo-1518837695005-2083093ee35b?q=80&w=2070&auto=format&fit=crop"
                >
                    <source src="https://www.pexels.com/video/a-placid-lake-under-cloudy-sky-5550288/.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-slate-900/50"></div>
            </div>

            <div className="relative z-10 max-w-3xl mx-auto">
                <button
                    onClick={() => onNavigate(Page.DASHBOARD)}
                    className="mb-6 text-gray-300 hover:text-white flex items-center gap-2 transition-colors font-medium bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full w-fit"
                >
                    <ArrowLeft size={20} /> Back to Dashboard
                </button>

                <h1 className="text-3xl font-bold text-white mb-8 text-shadow-sm">Account Settings</h1>

                <div className="space-y-6">
                    {/* Profile Section */}
                    <GlassCard className="p-8 !bg-slate-900/40 backdrop-blur-xl">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <UserIcon size={20} className="text-cyan-400" /> Profile Information
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-1 md:col-span-2 flex justify-center mb-4">
                                <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-cyan-400 to-purple-500 relative">
                                    <img
                                        src={user.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.name}`}
                                        alt="Profile"
                                        className="w-full h-full rounded-full bg-slate-800 object-cover"
                                    />
                                    <button className="absolute bottom-0 right-0 bg-white text-slate-900 rounded-full p-1.5 shadow-lg hover:bg-gray-200 transition-colors">
                                        <Save size={14} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-300 uppercase">Full Name</label>
                                <div className="relative">
                                    <UserIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-cyan-500/50 transition-colors bg-slate-800/50"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-300 uppercase">Email Address</label>
                                <div className="relative">
                                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-cyan-500/50 transition-colors bg-slate-800/50"
                                    />
                                </div>
                            </div>

                            <div className="col-span-1 md:col-span-2 space-y-2">
                                <label className="text-xs font-medium text-gray-300 uppercase">Address</label>
                                <div className="relative">
                                    <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="City, Country"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-cyan-500/50 transition-colors bg-slate-800/50"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end">
                            <button
                                onClick={handleSave}
                                className="bg-cyan-500 hover:bg-cyan-400 text-white font-bold py-2.5 px-6 rounded-lg shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2"
                            >
                                <Save size={18} /> Save Changes
                            </button>
                        </div>
                    </GlassCard>

                    {/* Preferences Section */}
                    <GlassCard className="p-8 !bg-slate-900/40 backdrop-blur-xl">
                        <h2 className="text-xl font-bold text-white mb-6">App Preferences</h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-500/20 rounded-lg text-purple-300"><Bell size={20} /></div>
                                    <div>
                                        <h4 className="text-white font-medium">Notifications</h4>
                                        <p className="text-xs text-gray-400">Receive daily reminders and updates</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={notifications} onChange={() => setNotifications(!notifications)} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-500/20 rounded-lg text-slate-300"><Moon size={20} /></div>
                                    <div>
                                        <h4 className="text-white font-medium">Dark Mode</h4>
                                        <p className="text-xs text-gray-400">Always on for CuraBot</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={darkMode} onChange={() => setDarkMode(!darkMode)} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                                </label>
                            </div>
                        </div>
                    </GlassCard>

                    <button
                        onClick={onLogout}
                        className="w-full py-4 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors font-medium flex items-center justify-center gap-2 bg-slate-900/50"
                    >
                        <LogOut size={20} /> Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;