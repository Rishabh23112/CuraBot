import { FileText, PlayCircle, Quote, Settings, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import GlassCard from '../components/GlassCard';
import { Page, User } from '../types';

interface DashboardProps {
    user: User;
    onNavigate: (page: Page) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onNavigate }) => {
    const currentHour = new Date().getHours();
    const greeting = currentHour < 12 ? 'Good Morning' : currentHour < 18 ? 'Good Afternoon' : 'Good Evening';
    const [activeVideo, setActiveVideo] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.playbackRate = 0.8;
        }
    }, []);

    const recommendedVideos = [
        { title: "Meditation Basics", time: "5 min", image: "https://picsum.photos/id/10/400/300", videoId: "inpok4MKVLM" },
        { title: "Anxiety Relief", time: "10 min", image: "https://picsum.photos/id/15/400/300", videoId: "lFcSrYw-ARY" },
        { title: "Sleep Stories", time: "15 min", image: "https://picsum.photos/id/16/400/300", videoId: "t0kACis_dJE" },
        { title: "Focus Sounds", time: "30 min", image: "https://picsum.photos/id/19/400/300", videoId: "wp2i8s1pPSo" },
    ];

    return (
        <div className="min-h-screen pt-32 pb-12 px-6 relative overflow-hidden bg-slate-900">
            {/* Background Elements */}
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
                    {/* Same consistent serene background */}
                    <source src="https://www.pexels.com/video/a-placid-lake-under-cloudy-sky-5550288/.mp4" type="video/mp4" />
                </video>
                {/* Lighter overlay */}
                <div className="absolute inset-0 bg-slate-900/50"></div>
            </div>

            {/* Video Modal Overlay */}
            {activeVideo && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setActiveVideo(null)}>
                    <div className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setActiveVideo(null)}
                            className="absolute top-4 right-4 z-20 text-white/70 hover:text-white bg-black/50 hover:bg-black/70 rounded-full p-2 transition-all"
                        >
                            <X size={24} />
                        </button>
                        <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${activeVideo}?autoplay=1&rel=0`}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="absolute inset-0 w-full h-full"
                        ></iframe>
                    </div>
                </div>
            )}

            <div className="relative z-10 max-w-6xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 text-shadow-lg">{greeting}, {user.name}</h1>
                        <p className="text-gray-200 font-medium">Ready to take a moment for yourself today?</p>
                    </div>
                    <div className="hidden md:block">
                        <span className="text-gray-300 text-sm font-mono bg-white/10 px-3 py-1 rounded-full border border-white/10">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                    </div>
                </div>

                {/* Main Action Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Profile Section */}
                    <GlassCard className="col-span-1 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group !bg-white/5 hover:!bg-white/10">
                        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative z-10">
                            <div className="w-24 h-24 mx-auto rounded-full p-1 bg-gradient-to-tr from-cyan-400 to-purple-500 mb-4 shadow-lg shadow-purple-500/20">
                                <img
                                    src={user.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.name}`}
                                    alt="Profile"
                                    className="w-full h-full rounded-full bg-slate-800 object-cover"
                                />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-1">{user.name}</h3>
                            <p className="text-gray-300 text-sm mb-4">{user.email}</p>
                            <button
                                onClick={() => onNavigate(Page.SETTINGS)}
                                className="px-6 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white text-sm font-medium transition-all flex items-center gap-2 mx-auto shadow-sm"
                            >
                                <Settings size={16} /> Settings
                            </button>
                        </div>
                    </GlassCard>

                    {/* Daily Check-in */}
                    <GlassCard hoverEffect className="col-span-1 md:col-span-2 p-8 flex flex-col justify-center min-h-[200px] bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border-indigo-500/30 backdrop-blur-md">
                        <h2 className="text-2xl font-bold text-white mb-2">Daily Check-in</h2>
                        <p className="text-indigo-100 mb-6 max-w-md">Reflect on your day. A simple conversation can help clear your mind.</p>
                        <button
                            onClick={() => onNavigate(Page.CHAT)}
                            className="self-start px-6 py-3 bg-white text-indigo-900 rounded-xl font-bold shadow-lg hover:shadow-indigo-500/20 transition-all hover:scale-105"
                        >
                            Start Chatting
                        </button>
                    </GlassCard>

                    {/* Mood Tracker */}
                    <GlassCard hoverEffect className="p-6 flex items-center justify-between cursor-pointer group !bg-slate-800/40" >
                        <div>
                            <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">Mood Tracker</h3>
                            <p className="text-xs text-gray-300">View your trends</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white transition-all">
                            <ActivityIcon />
                        </div>
                    </GlassCard>

                    {/* Resources */}
                    <GlassCard hoverEffect className="p-6 flex items-center justify-between cursor-pointer group !bg-slate-800/40">
                        <div>
                            <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">Resources</h3>
                            <p className="text-xs text-gray-300">Articles & Guides</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-all">
                            <FileText size={20} />
                        </div>
                    </GlassCard>

                    {/* Quote / Extra */}
                    <GlassCard hoverEffect className="p-6 flex flex-col justify-center items-center text-center !bg-slate-800/40">
                        <Quote size={24} className="text-cyan-400 mb-2 opacity-70" />
                        <p className="text-gray-200 italic text-sm">"Peace comes from within. Do not seek it without."</p>
                        <p className="text-gray-400 text-xs mt-2">- Buddha</p>
                    </GlassCard>
                </div>

                {/* Quick Suggestions / Content */}
                <h3 className="text-xl font-bold text-white mt-8 text-shadow-sm">Recommended for you</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {recommendedVideos.map((item, idx) => (
                        <GlassCard
                            key={idx}
                            hoverEffect
                            className="p-0 overflow-hidden group cursor-pointer transition-all duration-300 hover:!scale-105 hover:shadow-xl hover:shadow-cyan-500/20 !bg-slate-800/60"
                        >
                            <div onClick={() => setActiveVideo(item.videoId)} className="h-full w-full">
                                <div className="h-32 w-full overflow-hidden relative">
                                    <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <PlayCircle size={32} className="text-white drop-shadow-lg" />
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h4 className="text-white font-medium">{item.title}</h4>
                                    <p className="text-xs text-gray-400 mt-1">{item.time} • Guided</p>
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            </div>
        </div>
    );
};

const ActivityIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
    </svg>
);

export default Dashboard;