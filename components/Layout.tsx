import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export const Navbar: React.FC<{ 
  userType: 'teacher' | 'admin', 
  onLogout?: () => void,
  theme: 'dark' | 'light',
  onToggleTheme: () => void,
  logo?: string
}> = ({ userType, onLogout, theme, onToggleTheme, logo }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const navItems = userType === 'teacher' 
    ? [
        { label: 'My Dashboard', path: '/teacher' },
        { label: 'Book Studio', path: '/teacher/booking' },
        { label: 'Buy Hours', path: '/teacher/packages' },
      ]
    : [
        { label: 'Dashboard', path: '/admin' },
        { label: 'Page Editor', path: '/admin/editor' },
        { label: 'Plans', path: '/admin/logistics' },
        { label: 'Payments', path: '/admin/finances' },
      ];

  return (
    <>
      <nav className="sticky top-0 z-[60] w-full cinematic-glass px-6 md:px-12 py-3 md:py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Link to="/" className="w-9 h-9 bg-brand rounded-xl flex items-center justify-center shadow-md hover:scale-105 transition-transform overflow-hidden">
            {logo ? (
              <img src={logo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-black text-lg italic leading-none">D</span>
            )}
          </Link>
          <div className="hidden sm:block">
            <h1 className="text-sm font-black leading-none text-slate-900 dark:text-white italic">Dream Studio</h1>
            <p className="text-[7px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] font-bold mt-1">Premium Education Hub</p>
          </div>
        </div>
        
        <div className="hidden lg:flex items-center gap-10">
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path}
              className={`text-[9px] uppercase tracking-[0.2em] font-bold transition-all hover:text-brand ${
                location.pathname === item.path ? 'text-brand' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={onToggleTheme}
            className="btn-touch p-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-brand transition-all"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </button>
          
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden btn-touch p-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/10 text-slate-500 dark:text-slate-400"
            aria-label="Open Menu"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>

          <button 
            onClick={onLogout}
            className="btn-touch px-4 h-9 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/10 hover:bg-rose-500 hover:text-white transition-all hidden sm:flex items-center gap-2"
          >
              <span className="text-[9px] font-black uppercase tracking-[0.2em] italic">Sign Out</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg>
          </button>
        </div>
      </nav>

      <div className={`fixed inset-0 z-[100] transition-opacity duration-500 ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
        <div className={`absolute top-0 right-0 h-full w-[80%] max-w-xs bg-bg-main border-l border-black/5 dark:border-white/10 shadow-2xl p-6 flex flex-col transition-transform duration-500 transform ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex justify-between items-center mb-10">
            <span className="text-[9px] font-black uppercase tracking-[0.4em] italic text-brand">Menu</span>
            <button onClick={() => setMobileMenuOpen(false)} className="btn-touch p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white">
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {navItems.map((item) => (
              <Link 
                key={item.path} 
                to={item.path}
                className={`p-5 rounded-xl text-[10px] uppercase tracking-[0.3em] font-black transition-all ${
                  location.pathname === item.path ? 'bg-brand text-white shadow-md' : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="mt-auto pt-6 border-t border-black/5 dark:border-white/10">
            <button 
              onClick={onLogout}
              className="w-full py-5 rounded-xl bg-rose-500/10 text-rose-500 font-black uppercase text-[10px] tracking-[0.3em] flex items-center justify-center gap-3 italic"
            >
              Sign Out
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export const Container: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = "" }) => (
  <div className={`max-w-6xl mx-auto px-6 sm:px-8 md:px-10 py-10 md:py-16 ${className}`}>
    {children}
  </div>
);

export const Card: React.FC<{ children: React.ReactNode, className?: string, title?: string }> = ({ children, className = "", title }) => (
  <div className={`rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 shadow-sm border border-black/5 dark:border-white/5 bg-white dark:bg-[#111111] transition-all ${className}`}>
    {title && <h3 className="text-[9px] font-black mb-6 md:mb-10 text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] border-b border-black/5 dark:border-white/5 pb-4 italic">{title}</h3>}
    {children}
  </div>
);

export const Badge: React.FC<{ label: string, className?: string }> = ({ label, className = "" }) => (
  <span className={`px-4 py-1.5 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm inline-block italic ${className}`}>
    {label}
  </span>
);