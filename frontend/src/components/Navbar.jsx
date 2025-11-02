import React from 'react';
import { Home, CheckSquare, User } from 'lucide-react';
import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const location = useLocation();
  
  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/task", icon: CheckSquare, label: "Tasks" },
    { path: "/profile", icon: User, label: "Profile" }
  ];

  return (
    <div className='w-screen z-[1000] fixed top-0 left-0 flex items-start justify-center pt-1 px-4'>
      <div className='relative w-full max-w-[1300px]'>
        {/* Animated gradient border */}
        <div className="absolute inset-0 rounded-2xl p-[1px] overflow-hidden">
          <div 
            className="absolute inset-0 rounded-2xl opacity-40 animate-gradient-border"
            style={{
              background: 'linear-gradient(90deg, #06b6d4, #8b5cf6, #ec4899, #06b6d4)',
              backgroundSize: '300% 100%'
            }}
          />
        </div>

        {/* Main navbar content */}
        <nav className='relative bg-gradient-to-br from-zinc-800/95 to-zinc-900/95 backdrop-blur-xl rounded-2xl border border-zinc-700/50 shadow-2xl shadow-black/60'>
          <div className='flex items-center justify-around px-8 py-2'>
            {navItems.map(({ path, icon: Icon, label }) => {
              const isActive = location.pathname === path;
              return (
                <Link key={path} to={path} className='flex-1 flex justify-center'>
                  <button
                    className='group relative flex flex-col items-center gap-1.5 transition-all duration-300 cursor-pointer px-6 py-1.5'
                  >
                    {/* Icon container */}
                    <div className='relative'>
                      {/* Pulsing glow for active */}
                      {isActive && (
                        <div className="absolute inset-0 -m-3 rounded-full bg-gradient-to-r from-cyan-500/30 via-purple-500/30 to-pink-500/30 blur-lg animate-pulse-glow" />
                      )}
                      
                      <div className={`relative p-2 rounded-xl transition-all duration-300 ${
                        isActive 
                          ? 'bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-pink-500/20 shadow-lg' 
                          : 'bg-slate-800/30 group-hover:bg-slate-800/60'
                      }`}>
                        <Icon 
                          className={`w-5 h-5 transition-all duration-300 ${
                            isActive 
                              ? 'text-white scale-110 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]' 
                              : 'text-slate-400 group-hover:text-white group-hover:scale-105'
                          }`}
                          strokeWidth={isActive ? 2 : 1.5}
                        />
                      </div>
                    </div>

                    {/* Label with gradient for active */}
                    <span 
                      className={`text-xs font-semibold transition-all duration-300 whitespace-nowrap ${
                        isActive 
                          ? 'bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent opacity-100 scale-105' 
                          : 'text-slate-500 opacity-70 group-hover:opacity-100 group-hover:text-slate-300'
                      }`}
                    >
                      {label}
                    </span>

                    {/* Active indicator line */}
                    {isActive && (
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 shadow-[0_0_10px_rgba(139,92,246,0.6)] animate-pulse-slow" />
                    )}
                  </button>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Bottom accent glow */}
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-2/3 h-2 bg-gradient-to-r from-transparent via-purple-500/40 to-transparent rounded-full blur-md animate-pulse-slow" />
      </div>

      <style jsx>{`
        @keyframes gradientBorder {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes pulseSlow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        @keyframes pulseGlow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }

        .animate-gradient-border {
          animation: gradientBorder 3s ease infinite;
        }

        .animate-pulse-slow {
          animation: pulseSlow 3s ease-in-out infinite;
        }

        .animate-pulse-glow {
          animation: pulseGlow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Navbar;