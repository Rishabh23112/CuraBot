import React, { useEffect, useRef, useState } from 'react';
import { Page } from '../types';
import GlassCard from '../components/GlassCard';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Target, Zap, Moon, Brain, Award } from 'lucide-react';

interface ProgressProps {
  onNavigate: (page: Page) => void;
}

const data = [
  { name: 'Mon', mood: 4, stress: 7 },
  { name: 'Tue', mood: 5, stress: 6 },
  { name: 'Wed', mood: 6, stress: 6 },
  { name: 'Thu', mood: 5, stress: 5 },
  { name: 'Fri', mood: 8, stress: 3 },
  { name: 'Sat', mood: 9, stress: 2 },
  { name: 'Sun', mood: 8, stress: 3 },
];

const AnimatedProgressBar = ({ 
    label, 
    value, 
    colorClass,
    icon
}: { 
    label: string; 
    value: number; 
    colorClass: string;
    icon?: React.ReactNode;
}) => {
    const [width, setWidth] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => {
            setWidth(value);
        }, 300); // Delay slightly to allow enter animation
        return () => clearTimeout(timer);
    }, [value]);

    return (
        <div className="w-full">
            <div className="flex justify-between items-end mb-2">
                <div className="flex items-center gap-2 text-gray-300">
                    {icon}
                    <span className="text-sm font-medium uppercase tracking-wider">{label}</span>
                </div>
                <span className="text-sm font-bold text-white">{width}%</span>
            </div>
            <div className="w-full h-3 bg-gray-700/40 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
                <div 
                    className={`h-full rounded-full transition-all duration-[1500ms] ease-out shadow-lg relative ${colorClass}`}
                    style={{ width: `${width}%` }}
                >
                    {/* Subtle shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                </div>
            </div>
        </div>
    );
};

const Progress: React.FC<ProgressProps> = ({ onNavigate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
        videoRef.current.playbackRate = 0.8;
    }
  }, []);

  return (
    <div className="min-h-screen pt-32 pb-12 px-6 relative bg-slate-900 overflow-hidden">
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
                <source src="https://www.pexels.com/video/a-placid-lake-under-cloudy-sky-5550288/mp4" type="video/mp4" />
             </video>
             {/* Lighter overlay for better visibility */}
             <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px]"></div>
             
             {/* Decorative Ambient Blobs */}
             <div className="absolute top-[10%] left-[20%] w-[30%] h-[30%] bg-cyan-500/20 rounded-full blur-[120px] animate-pulse mix-blend-screen pointer-events-none"></div>
             <div className="absolute bottom-[20%] right-[10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full blur-[120px] animate-pulse delay-1000 mix-blend-screen pointer-events-none"></div>
         </div>

        <div className="relative z-10 max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-8 text-shadow-sm">Your Wellness Journey</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Main Graph */}
                <GlassCard className="col-span-1 lg:col-span-2 p-8 !bg-slate-800/60 backdrop-blur-xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-white">Weekly Mood & Stress Overview</h3>
                        <div className="flex gap-4 text-xs">
                             <div className="flex items-center gap-2 text-cyan-300">
                                 <span className="w-3 h-3 rounded-full bg-cyan-400"></span> Mood
                             </div>
                             <div className="flex items-center gap-2 text-purple-300">
                                 <span className="w-3 h-3 rounded-full bg-purple-400"></span> Stress
                             </div>
                        </div>
                    </div>
                    {/* Added min-w-0 to parent div to handle CSS Grid/Flex sizing issues with Recharts */}
                    <div className="h-[300px] w-full min-w-0">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <AreaChart
                                data={data}
                                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                            >
                                <defs>
                                    <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorStress" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#c084fc" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#c084fc" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" stroke="#94a3b8" axisLine={false} tickLine={false} dy={10} />
                                <YAxis stroke="#94a3b8" axisLine={false} tickLine={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.5} />
                                <Area 
                                    type="monotone" 
                                    dataKey="mood" 
                                    stroke="#22d3ee" 
                                    fillOpacity={1} 
                                    fill="url(#colorMood)" 
                                    strokeWidth={3} 
                                    name="Mood Score"
                                    animationDuration={2000}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="stress" 
                                    stroke="#c084fc" 
                                    fillOpacity={1} 
                                    fill="url(#colorStress)" 
                                    strokeWidth={3} 
                                    name="Stress Level"
                                    animationDuration={2000}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>

                {/* Stats Cards with Animated Progress */}
                <GlassCard hoverEffect className="p-6">
                    <div className="mb-4">
                         <h4 className="text-gray-400 text-sm font-medium uppercase tracking-wider">Average Mood</h4>
                         <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-4xl font-bold text-cyan-400">7.2</span>
                            <span className="text-sm text-green-400">↑ 12% this week</span>
                         </div>
                    </div>
                    <AnimatedProgressBar 
                        label="Weekly Average" 
                        value={72} 
                        colorClass="bg-gradient-to-r from-cyan-400 to-cyan-600" 
                    />
                </GlassCard>

                <GlassCard hoverEffect className="p-6">
                     <div className="mb-4">
                        <h4 className="text-gray-400 text-sm font-medium uppercase tracking-wider">Stress Level</h4>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-4xl font-bold text-purple-400">4.5</span>
                            <span className="text-sm text-green-400">↓ 5% this week</span>
                        </div>
                    </div>
                    <AnimatedProgressBar 
                        label="Weekly Average" 
                        value={45} 
                        colorClass="bg-gradient-to-r from-purple-400 to-purple-600" 
                    />
                </GlassCard>

                {/* New Monthly Goals Section */}
                <GlassCard className="col-span-1 lg:col-span-2 p-8">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-gradient-to-tr from-emerald-400 to-cyan-500 rounded-lg text-white shadow-lg">
                            <Target size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white">Monthly Wellness Goals</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                        <AnimatedProgressBar 
                            label="Meditation Minutes" 
                            value={85} 
                            colorClass="bg-gradient-to-r from-emerald-400 to-green-500" 
                            icon={<Brain size={16} />}
                        />
                        <AnimatedProgressBar 
                            label="Sleep Quality" 
                            value={65} 
                            colorClass="bg-gradient-to-r from-blue-400 to-indigo-500"
                            icon={<Moon size={16} />}
                        />
                         <AnimatedProgressBar 
                            label="Energy Levels" 
                            value={78} 
                            colorClass="bg-gradient-to-r from-yellow-400 to-orange-500"
                            icon={<Zap size={16} />}
                        />
                        <AnimatedProgressBar 
                            label="Achievements Unlocked" 
                            value={40} 
                            colorClass="bg-gradient-to-r from-pink-400 to-rose-500"
                            icon={<Award size={16} />}
                        />
                    </div>
                </GlassCard>
            </div>
        </div>
    </div>
  );
};

export default Progress;