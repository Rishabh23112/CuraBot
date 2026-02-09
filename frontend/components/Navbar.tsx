import React from 'react';
import { Home, LayoutDashboard, MessageCircleHeart, TrendingUp, LogOut } from 'lucide-react';
import { Page } from '../types';

interface NavbarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  isLoggedIn: boolean;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate, isLoggedIn, onLogout }) => {
  
  const navItems = [
    { page: Page.HOME, icon: Home, label: 'Home', show: true },
    { page: Page.DASHBOARD, icon: LayoutDashboard, label: 'Dashboard', show: isLoggedIn },
    { page: Page.CHAT, icon: MessageCircleHeart, label: 'Chat', show: isLoggedIn },
    { page: Page.PROGRESS, icon: TrendingUp, label: 'Progress', show: isLoggedIn },
  ];

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
      <div className="backdrop-blur-2xl bg-black/30 border border-white/10 rounded-full shadow-2xl px-6 py-3 flex justify-between items-center">
        {navItems.filter(item => item.show).map((item) => (
          <button
            key={item.label}
            onClick={() => onNavigate(item.page)}
            className={`
              flex flex-col items-center gap-1 transition-all duration-300
              ${currentPage === item.page ? 'text-cyan-400 scale-110' : 'text-gray-400 hover:text-white'}
            `}
          >
            <item.icon size={20} />
            <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
          </button>
        ))}
        
        {isLoggedIn && (
           <button
           onClick={onLogout}
           className="flex flex-col items-center gap-1 text-red-400 hover:text-red-300 transition-all duration-300"
         >
           <LogOut size={20} />
           <span className="text-[10px] font-medium tracking-wide">Logout</span>
         </button>
        )}

        {!isLoggedIn && currentPage !== Page.LOGIN && (
          <button
            onClick={() => onNavigate(Page.LOGIN)}
            className="px-4 py-1.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 text-xs font-bold hover:bg-cyan-500/40 transition-all"
          >
            Login
          </button>
        )}
      </div>
    </div>
  );
};

export default Navbar;