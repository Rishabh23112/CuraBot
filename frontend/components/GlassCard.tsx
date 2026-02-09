import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', hoverEffect = false }) => {
  return (
    <div 
      className={`
        relative overflow-hidden
        backdrop-blur-xl bg-white/10 
        border border-white/20 shadow-xl rounded-2xl
        ${hoverEffect ? 'transition-all duration-300 hover:bg-white/20 hover:scale-[1.01] hover:shadow-2xl' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default GlassCard;
