import React from 'react';
import { ArrowRight, Activity, ShieldCheck, Heart, MessageCircleHeart, Instagram, Twitter, Linkedin, Globe } from 'lucide-react';
import { Page } from '../types';
import GlassCard from '../components/GlassCard';

interface HomeProps {
  onNavigate: (page: Page) => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const scrollToFeatures = () => {
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-between overflow-hidden">
      {/* Background Video */}
      <div className="absolute inset-0 z-0">
        <video 
            autoPlay 
            loop 
            muted 
            className="w-full h-full object-cover opacity-60 scale-105"
            poster="https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?q=80&w=2070&auto=format&fit=crop"
        >
            <source src="https://www.pexels.com/video/a-placid-lake-under-cloudy-sky-5550288/.mp4" type="video/mp4" />
             Your browser does not support the video tag.
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent"></div>
      </div>

      {/* Decorative Collage Blobs */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-purple-500/30 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-cyan-500/20 rounded-full blur-[100px] animate-pulse delay-700"></div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-6 text-center text-white flex-1 flex flex-col justify-center pt-32">
        <GlassCard className="inline-block px-4 py-1.5 mb-6 rounded-full !bg-white/5 !border-white/10 mx-auto">
            <span className="text-sm font-medium tracking-wider uppercase text-cyan-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                24/7 AI Companion
            </span>
        </GlassCard>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-tight">
          Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-300">Inner Peace</span>
          <br /> With CuraBot.
        </h1>
        
        <p className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto mb-10 font-light leading-relaxed">
          A safe space powered by advanced AI to help you navigate life's challenges. 
          Track your mood, chat securely, and visualize your mental growth.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button 
            onClick={() => onNavigate(Page.LOGIN)}
            className="group relative px-8 py-4 bg-cyan-500 text-white rounded-full font-bold shadow-lg shadow-cyan-500/30 overflow-hidden transition-all hover:scale-105 hover:shadow-cyan-500/50"
          >
            <span className="relative z-10 flex items-center gap-2">
              Get Started <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>
          
          <button 
             onClick={scrollToFeatures}
             className="px-8 py-4 backdrop-blur-md bg-white/10 border border-white/20 text-white rounded-full font-bold hover:bg-white/20 transition-all"
          >
            How it Works
          </button>
        </div>

        {/* Features Grid */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 text-left pb-20">
            <GlassCard hoverEffect className="p-6">
                <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4 text-purple-300">
                    <MessageCircleHeart size={24} />
                </div>
                <h3 className="text-xl font-bold mb-2">Empathetic AI Chat</h3>
                <p className="text-gray-300 text-sm">Talk to a compassionate AI assistant trained to listen and provide coping strategies 24/7.</p>
            </GlassCard>

            <GlassCard hoverEffect className="p-6">
                <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center mb-4 text-cyan-300">
                    <Activity size={24} />
                </div>
                <h3 className="text-xl font-bold mb-2">Mood Tracking</h3>
                <p className="text-gray-300 text-sm">Log your daily emotions and visualize trends over time to understand your mental wellbeing.</p>
            </GlassCard>

            <GlassCard hoverEffect className="p-6">
                <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center mb-4 text-emerald-300">
                    <ShieldCheck size={24} />
                </div>
                <h3 className="text-xl font-bold mb-2">Private & Secure</h3>
                <p className="text-gray-300 text-sm">Your conversations are private. We prioritize your data security and anonymity above all.</p>
            </GlassCard>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-white/10 bg-black/40 backdrop-blur-md mt-auto">
          <div className="container mx-auto px-6 py-8">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="text-center md:text-left">
                      <h4 className="text-white font-bold text-lg mb-1">CuraBot</h4>
                      <p className="text-gray-400 text-sm">Empowering mental wellness through AI.</p>
                  </div>

                  <div className="flex gap-6 text-sm text-gray-400">
                      <a href="#" className="hover:text-cyan-400 transition-colors">Privacy Policy</a>
                      <a href="#" className="hover:text-cyan-400 transition-colors">Terms of Service</a>
                      <a href="#" className="hover:text-cyan-400 transition-colors">Crisis Resources</a>
                  </div>

                  <div className="flex gap-4">
                      <a href="#" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-cyan-500 hover:text-white transition-all">
                          <Twitter size={16} />
                      </a>
                      <a href="#" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-cyan-500 hover:text-white transition-all">
                          <Instagram size={16} />
                      </a>
                      <a href="#" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-cyan-500 hover:text-white transition-all">
                          <Linkedin size={16} />
                      </a>
                  </div>
              </div>
              <div className="text-center text-gray-600 text-xs mt-8">
                  © {new Date().getFullYear()} CuraBot AI. All rights reserved. Not a replacement for professional medical advice.
              </div>
          </div>
      </footer>
    </div>
  );
};

export default Home;