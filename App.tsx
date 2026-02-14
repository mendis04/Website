import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { Navbar, Container, Card, Badge } from './components/Layout';
import { Booking, BookingStatus, StudioPackage, Teacher, Transaction, PaymentMethod, CMSConfig } from './types';
import { INITIAL_PACKAGES, INITIAL_CMS_CONFIG, STATUS_COLORS } from './constants';

const App: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [session, setSession] = useState<{role: 'teacher' | 'admin', id: string, email: string, name: string} | null>(null);
  const [cms, setCms] = useState<CMSConfig>(INITIAL_CMS_CONFIG);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [packages, setPackages] = useState<StudioPackage[]>(INITIAL_PACKAGES);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500);

    const savedTheme = localStorage.getItem('dream_theme') as 'dark' | 'light' || 'dark';
    setTheme(savedTheme);
    
    const load = (key: string, def: any, useSession: boolean = false) => {
      const val = useSession ? sessionStorage.getItem(key) : localStorage.getItem(key);
      try { return val ? JSON.parse(val) : def; } catch { return def; }
    };

    setBookings(load('dream_bookings', []));
    setPackages(load('dream_packages', INITIAL_PACKAGES));
    setCms(load('dream_cms', INITIAL_CMS_CONFIG));
    setTransactions(load('dream_transactions', []));
    
    const localSession = load('dream_session', null, false);
    const sessionOnly = load('dream_session', null, true);
    setSession(localSession || sessionOnly);

    const savedTs = load('dream_teachers', []);
    if (savedTs.length === 0) {
      const testTeacher = { id: 't-demo', name: 'Professional Teacher', email: 'teacher@dreamedu.com', password: 'teacher123', credits: 5, isApproved: true };
      setTeachers([testTeacher]);
    } else {
      setTeachers(savedTs);
    }

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('dream_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('dream_bookings', JSON.stringify(bookings));
    localStorage.setItem('dream_packages', JSON.stringify(packages));
    localStorage.setItem('dream_teachers', JSON.stringify(teachers));
    localStorage.setItem('dream_transactions', JSON.stringify(transactions));
    localStorage.setItem('dream_cms', JSON.stringify(cms));
  }, [bookings, packages, teachers, transactions, cms]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');
  
  const handleLoginSuccess = (role: 'teacher' | 'admin', id: string, email: string, name: string, remember: boolean) => {
    const sess = { role, id, email, name };
    setSession(sess);
    if (remember) {
      localStorage.setItem('dream_session', JSON.stringify(sess));
      sessionStorage.removeItem('dream_session');
    } else {
      sessionStorage.setItem('dream_session', JSON.stringify(sess));
      localStorage.removeItem('dream_session');
    }
  };

  const logout = () => { 
    setSession(null); 
    localStorage.removeItem('dream_session');
    sessionStorage.removeItem('dream_session');
    navigate('/'); 
  };

  const handleRegister = (name: string, email: string, pw: string) => {
    if (teachers.some(t => t.email === email)) return alert("Email already exists.");
    const newTeacher: Teacher = { id: `t-${Date.now()}`, name, email, password: pw, credits: 0, isApproved: false };
    setTeachers(prev => [...prev, newTeacher]);
    alert("Registration Successful. We will approve your account soon.");
  };

  const handleBooking = (date: string, hour: number, duration: number) => {
    const activeT = teachers.find(t => t.id === session?.id);
    if (!activeT || activeT.credits < duration) return alert("Not enough hours in your account.");
    
    const cost = duration === 1 ? cms.pricing.oneHour : duration === 2 ? cms.pricing.twoHours : cms.pricing.threePlusHours;
    const newBooking: Booking = { 
      id: `bk-${Date.now()}`, 
      teacherId: activeT.id, 
      teacherName: activeT.name, 
      date, 
      startTime: hour, 
      duration, 
      status: BookingStatus.PENDING, 
      createdAt: new Date().toISOString(), 
      cost 
    };

    setBookings(prev => [newBooking, ...prev]);
    setTeachers(prev => prev.map(t => t.id === activeT.id ? { ...t, credits: t.credits - duration } : t));
    
    const cleanNum = cms.contactNumber.replace(/[^0-9]/g, '');
    const msg = `*Studio Booking Request*\n\nTeacher: ${activeT.name}\nDate: ${date}\nTime: ${hour}:00\nDuration: ${duration} Hours\n\nStatus: Pending confirmation.`;
    window.open(`https://wa.me/94${cleanNum.substring(cleanNum.length - 9)}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (loading) return <CinematicLoader cms={cms} />;

  return (
    <Routes>
      <Route path="/" element={<Landing cms={cms} packages={packages} session={session} />} />
      <Route path="/auth/:mode" element={<AuthPage cms={cms} onLogin={(e, p, r) => {
          if (e === 'admin@dreamedu.com' && p === 'admin123') { 
            handleLoginSuccess('admin', 'admin', e, cms.directorName, r);
            navigate('/admin'); 
          } else {
            const t = teachers.find(t => t.email === e && t.password === p);
            if (t && t.isApproved) { 
              handleLoginSuccess('teacher', t.id, e, t.name, r);
              navigate('/teacher'); 
            } else if (t && !t.isApproved) {
              alert("Your account is pending approval.");
            } else {
              alert("Invalid login details.");
            }
          }
      }} onRegister={handleRegister} />} />
      
      <Route path="/teacher/*" element={session?.role === 'teacher' ? (
        <div className="min-h-screen bg-bg-main animate-fade-in text-slate-900 dark:text-white">
          <Navbar userType="teacher" theme={theme} onToggleTheme={toggleTheme} onLogout={logout} logo={cms.studioLogo} />
          <Container>
            <Routes>
              <Route index element={<TeacherDash teacher={teachers.find(t=>t.id===session.id)} bookings={bookings} />} />
              <Route path="booking" element={<TeacherBooking bookings={bookings} onBook={handleBooking} credits={teachers.find(t=>t.id===session.id)?.credits || 0} pricing={cms.pricing} />} />
              <Route path="packages" element={<TeacherPackages packages={packages} onBuy={(pkg, method, slip) => {
                setTransactions(prev => [{ 
                  id: `tx-${Date.now()}`, 
                  teacherId: session.id, 
                  teacherName: session.name, 
                  packageId: pkg.id, 
                  packageName: pkg.name, 
                  amount: pkg.price, 
                  date: new Date().toISOString(), 
                  method, 
                  slipImage: slip, 
                  verified: false, 
                  type: 'Package' 
                }, ...prev]);
              }} />} />
            </Routes>
          </Container>
        </div>
      ) : <Navigate to="/" />} />

      <Route path="/admin/*" element={session?.role === 'admin' ? (
        <div className="min-h-screen bg-bg-main animate-fade-in text-slate-900 dark:text-white">
          <Navbar userType="admin" theme={theme} onToggleTheme={toggleTheme} onLogout={logout} logo={cms.studioLogo} />
          <Container>
            <Routes>
              <Route index element={<AdminMain 
                bookings={bookings} 
                updateStatus={(id, s) => {
                  if (s === BookingStatus.CANCELLED) {
                    const bk = bookings.find(b => b.id === id);
                    if (bk) setTeachers(ts => ts.map(t => t.id === bk.teacherId ? {...t, credits: t.credits + bk.duration} : t));
                  }
                  setBookings(p => p.map(b => b.id === id ? {...b, status: s} : b));
                }}
                transactions={transactions} 
                verify={(tid) => {
                  setTransactions(p => p.map(tx => {
                    if (tx.id === tid && !tx.verified) {
                      const pkg = packages.find(pk => pk.id === tx.packageId);
                      if (pkg) setTeachers(ts => ts.map(t => t.id === tx.teacherId ? {...t, credits: t.credits + pkg.hours} : t));
                      return {...tx, verified: true};
                    }
                    return tx;
                  }));
                }}
                teachers={teachers}
                onApprove={id => setTeachers(p => p.map(t => t.id === id ? {...t, isApproved: true} : t))}
                cms={cms} setCms={setCms}
                onManualAdd={(id, amt, hrs) => {
                  setTeachers(p => p.map(t => t.id === id ? {...t, credits: t.credits + hrs} : t));
                  setTransactions(p => [{ id: `mtx-${Date.now()}`, teacherId: id, teacherName: teachers.find(tx=>tx.id===id)?.name || '', amount: amt, date: new Date().toISOString(), method: PaymentMethod.MANUAL, verified: true, type: 'Manual Top-up' }, ...p]);
                  alert("Credits added successfully.");
                }}
              />} />
              <Route path="editor" element={<AdminLandingEditor cms={cms} setCms={setCms} />} />
              <Route path="logistics" element={<AdminLogistics packages={packages} setPackages={setPackages} />} />
              <Route path="finances" element={<AdminFinance transactions={transactions} teachers={teachers} />} />
            </Routes>
          </Container>
        </div>
      ) : <Navigate to="/" />} />
    </Routes>
  );
};

const CinematicLoader = ({ cms }: { cms: CMSConfig }) => (
  <div className="fixed inset-0 bg-black z-[1000] flex flex-col items-center justify-center overflow-hidden">
    <div className="absolute top-1/2 left-0 w-full h-[1px] bg-emerald-500/10 blur-xl animate-drift"></div>
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full lens-flare opacity-10"></div>
    {cms.studioLogo ? (
      <img src={cms.studioLogo} className="w-24 h-24 object-contain animate-focus-pull mb-4" alt="Logo" />
    ) : (
      <h1 className="text-white font-black text-2xl md:text-5xl uppercase italic animate-focus-pull text-center tracking-[1em]">
        {cms.footerBrandName.split(' ')[0] || 'DREAM'}
      </h1>
    )}
    <div className="absolute bottom-0 left-0 h-0.5 bg-emerald-600 animate-progress"></div>
  </div>
);

const Landing = ({ cms, packages, session }: any) => (
  <div className="min-h-screen bg-bg-main relative">
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-[-10%] w-[60%] h-[60%] bg-brand/5 blur-[250px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-emerald-500/5 blur-[250px] rounded-full"></div>
    </div>

    {/* Hero Section */}
    <section className="relative min-h-screen flex items-center justify-center p-6 md:p-12 overflow-hidden z-10">
        <div className="absolute inset-0 z-0 opacity-10 dark:opacity-20">
            <img src={cms.bannerImage} className="aspect-stabilize scale-105 animate-pulse-slow" alt="Background" />
            <div className="absolute inset-0 bg-gradient-to-b from-bg-main/80 via-transparent to-bg-main"></div>
        </div>
        
        <div className="relative z-10 max-w-5xl w-full mx-auto text-center space-y-8 animate-fade-in">
            {cms.studioLogo && (
              <div className="w-20 h-20 mx-auto bg-brand rounded-2xl p-4 shadow-2xl mb-4 border border-white/20">
                <img src={cms.studioLogo} className="w-full h-full object-contain" alt="Logo" />
              </div>
            )}
            <div className="inline-flex items-center gap-2.5 px-5 py-1.5 rounded-full cinematic-glass border border-brand/20 mx-auto">
                <span className="w-1.5 h-1.5 bg-brand rounded-full animate-pulse"></span>
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] italic text-slate-800 dark:text-white/80">{cms.heroSubtitle || 'Premium Digital Studio'}</span>
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase italic tracking-tighter leading-[0.9] text-slate-900 dark:text-white">
                {cms.heroTitle.split(' ').map((word:string, i:number) => (
                    <span key={i} className={i === 1 ? 'text-brand block' : 'block'}>{word}</span>
                ))}
            </h1>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                {session ? (
                    <Link to={session.role === 'admin' ? '/admin' : '/teacher'} className="btn-touch px-10 h-12 bg-brand text-white rounded-xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg hover:bg-brand-600 transition-all">
                        Enter Dashboard
                    </Link>
                ) : (
                    <>
                        <Link to="/auth/teacher" className="btn-touch px-10 h-12 bg-brand text-white rounded-xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg hover:bg-brand-600 transition-all">Teacher Login</Link>
                        <Link to="/auth/admin" className="btn-touch px-10 h-12 cinematic-glass text-slate-800 dark:text-white rounded-xl font-black uppercase text-[10px] tracking-[0.2em] transition-all hover:bg-brand/5">Admin Hub</Link>
                    </>
                )}
            </div>
        </div>
    </section>

    {/* Section 2: Strategy */}
    <Container className="py-16 md:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
                <div className="space-y-3">
                    <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter leading-none text-slate-900 dark:text-white">Our <span className="text-brand">Strategy</span></h2>
                    <div className="h-0.5 w-16 bg-brand rounded-full"></div>
                </div>
                
                <div className="relative">
                  <div className="absolute -left-4 top-0 h-full w-0.5 bg-brand/30 rounded-full"></div>
                  <p className="text-base md:text-xl font-display font-medium italic leading-relaxed text-slate-600 dark:text-slate-300 pl-5">
                      "{cms.studioIntelligence}"
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {cms.features.map((f: string, i: number) => (
                        <div key={i} className="flex items-center gap-3 p-4 bg-white dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5 group hover:border-brand/20 transition-all">
                            <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center text-brand">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-widest italic text-slate-700 dark:text-slate-400">{f}</span>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="space-y-8 lg:pl-10">
                <div className="space-y-4">
                  <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-brand italic">Professional Space</h3>
                  <p className="text-base md:text-lg opacity-80 leading-relaxed italic text-slate-600 dark:text-slate-400 font-medium">
                      {cms.aboutText}
                  </p>
                </div>
                
                <div className="rounded-[2rem] overflow-hidden shadow-xl border border-black/5 dark:border-white/5 aspect-video group">
                  <img src={cms.strategyImage} className="aspect-stabilize group-hover:scale-105 transition-transform duration-1000" alt="Strategy" />
                </div>
            </div>
        </div>
    </Container>

    {/* Section 3: Pricing Plans */}
    <section className="py-16 md:py-32 bg-slate-50 dark:bg-white/[0.01] border-y border-black/5 dark:border-white/5">
        <Container>
            <div className="text-center mb-20 space-y-4">
                <h2 className="text-4xl md:text-7xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white">Studio Plans</h2>
                <div className="flex justify-center items-center gap-4">
                  <div className="h-px w-12 bg-brand/20"></div>
                  <p className="text-slate-400 text-[8px] uppercase font-black tracking-[0.4em] italic opacity-60">SELECT ACCESS</p>
                  <div className="h-px w-12 bg-brand/20"></div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {packages.map((pkg: any) => (
                    <div key={pkg.id} className="group relative flex flex-col bg-white dark:bg-[#111111] rounded-[2rem] shadow-sm border border-black/5 dark:border-white/5 overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
                        <div className="h-64 relative overflow-hidden bg-black/5">
                            <img src={pkg.thumbnail} className="aspect-stabilize opacity-60 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105" alt={pkg.name} />
                            <div className="absolute top-6 left-6">
                                <Badge label={pkg.badge} className="bg-brand text-white border-none py-1.5 px-5 shadow-md text-[8px] font-black" />
                            </div>
                        </div>
                        <div className="p-8 md:p-10 space-y-6 flex-1 flex flex-col justify-between">
                            <div className="space-y-5">
                                <div className="space-y-2 text-center">
                                  <h3 className="text-2xl font-black uppercase italic tracking-tight text-slate-900 dark:text-white">{pkg.name}</h3>
                                  <div className="h-0.5 w-10 bg-brand rounded-full mx-auto opacity-30"></div>
                                </div>
                                <div className="space-y-1 text-center">
                                  <p className="text-[8px] uppercase font-black text-slate-400 tracking-[0.3em] italic opacity-50">PRICE</p>
                                  <p className="text-4xl font-black text-brand italic tracking-tighter leading-none">
                                      LKR {pkg.price.toLocaleString()}
                                  </p>
                                </div>
                                <p className="opacity-70 text-[13px] italic leading-relaxed text-center text-slate-600 dark:text-slate-400 font-medium">{pkg.description}</p>
                            </div>
                            <Link to="/auth/teacher" className="btn-touch w-full py-4 h-12 bg-slate-900 dark:bg-brand text-white rounded-xl text-center font-black uppercase text-[9px] tracking-[0.2em] shadow-md hover:scale-[1.02] transition-all">Select Plan</Link>
                        </div>
                    </div>
                ))}
            </div>
        </Container>
    </section>

    <footer className="py-16 md:py-20 text-center relative z-10">
        <div className="max-w-4xl mx-auto px-6 space-y-6">
            <div className="flex justify-center items-center gap-8 opacity-10">
                <div className="h-px flex-1 bg-slate-900 dark:bg-white"></div>
                <span className="text-[8px] font-black uppercase tracking-[0.6em] italic">{cms.footerBrandName}</span>
                <div className="h-px flex-1 bg-slate-900 dark:bg-white"></div>
            </div>
            <div className="space-y-2">
                <p className="text-[8px] md:text-[9px] uppercase font-bold text-slate-400 tracking-[0.3em] italic leading-loose">
                    Director: {cms.directorName} | Contact: {cms.contactNumber}
                </p>
                <p className="text-[7px] uppercase font-bold text-slate-400 tracking-[0.1em] italic opacity-40">
                    {cms.footerTagline}
                </p>
            </div>
        </div>
    </footer>
  </div>
);

const AuthPage = ({ onLogin, onRegister, cms }: any) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [pw, setPw] = useState('');
    const [rememberMe, setRememberMe] = useState(true);

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-bg-main relative overflow-hidden">
            <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{backgroundImage: 'radial-gradient(#10B981 1px, transparent 1px)', backgroundSize: '40px 40px'}}></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand/5 blur-[120px] rounded-full"></div>

            <div className="max-w-sm w-full cinematic-glass p-8 md:p-12 rounded-[2.5rem] shadow-xl relative z-10 border border-black/5 dark:border-white/5 animate-reveal">
                <Link to="/" className="absolute top-6 left-6 p-2 text-slate-400 hover:text-brand transition-all">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </Link>

                <div className="text-center mb-10 space-y-3">
                    <div className="w-14 h-14 bg-brand rounded-2xl mx-auto flex items-center justify-center mb-5 shadow-lg overflow-hidden border border-white/10">
                        {cms.studioLogo ? (
                          <img src={cms.studioLogo} className="w-full h-full object-contain" alt="Studio Logo" />
                        ) : (
                          <span className="text-white font-black text-2xl italic">D</span>
                        )}
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter italic leading-none text-slate-900 dark:text-white">
                      {isLogin ? 'Login' : 'Register'}
                    </h2>
                    <p className="text-[8px] text-slate-400 uppercase font-black tracking-[0.3em] italic opacity-60">Teacher Access</p>
                </div>

                <form onSubmit={e => { e.preventDefault(); isLogin ? onLogin(email, pw, rememberMe) : onRegister(name, email, pw); }} className="space-y-5">
                    {!isLogin && (
                        <div className="space-y-1.5">
                            <label className="text-[7px] uppercase font-black tracking-widest text-slate-400 italic ml-3">Full Name</label>
                            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Enter Name" className="w-full bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-black/5 dark:border-white/10 outline-none font-bold focus:border-brand transition-all italic text-[11px] text-slate-900 dark:text-white" required />
                        </div>
                    )}
                    <div className="space-y-1.5">
                        <label className="text-[7px] uppercase font-black tracking-widest text-slate-400 italic ml-3">Email Address</label>
                        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Enter Email" className="w-full bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-black/5 dark:border-white/10 outline-none font-bold focus:border-brand transition-all italic text-[11px] text-slate-900 dark:text-white" required />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[7px] uppercase font-black tracking-widest text-slate-400 italic ml-3">Password</label>
                        <input type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="••••••••" className="w-full bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-black/5 dark:border-white/10 outline-none font-bold focus:border-brand transition-all italic text-[11px] text-slate-900 dark:text-white" required />
                    </div>
                    
                    {isLogin && (
                      <div className="flex items-center gap-3 ml-1 py-1">
                        <label className="relative flex items-center cursor-pointer group">
                          <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="sr-only peer" />
                          <div className="w-4 h-4 bg-slate-100 dark:bg-white/5 rounded border border-black/10 dark:border-white/10 peer-checked:bg-brand peer-checked:border-brand transition-all flex items-center justify-center">
                            <svg className={`w-2.5 h-2.5 text-white ${rememberMe ? 'opacity-100 scale-100' : 'opacity-0 scale-50'} transition-all`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path d="M5 13l4 4L19 7" /></svg>
                          </div>
                          <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest italic ml-3 group-hover:text-brand transition-colors">Remember Me</span>
                        </label>
                      </div>
                    )}

                    <button className="btn-touch w-full py-4 h-12 rounded-xl font-black tracking-[0.2em] mt-4 text-white uppercase text-[9px] bg-brand hover:bg-brand-600 shadow-lg">
                      {isLogin ? 'Login' : 'Register'}
                    </button>
                </form>

                <button onClick={()=>setIsLogin(!isLogin)} className="w-full mt-8 text-[8px] font-black uppercase text-slate-400 hover:text-brand tracking-[0.2em] transition-all italic opacity-60 flex items-center justify-center gap-2 group">
                    {isLogin ? "No account? Join" : "Already have account? Login"}
                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                </button>
            </div>
        </div>
    );
};

const TeacherDash = ({ teacher, bookings }: any) => (
    <div className="space-y-10 md:space-y-14">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
            <div>
                <h2 className="text-3xl md:text-6xl font-black uppercase italic tracking-tighter leading-none text-slate-900 dark:text-white">Dashboard</h2>
                <p className="text-slate-400 font-bold uppercase text-[8px] tracking-[0.6em] mt-3 italic">Faculty member: {teacher?.name}</p>
            </div>
            <div className="w-full lg:w-auto p-8 bg-white dark:bg-[#111111] border border-brand/20 text-center shadow-sm rounded-[2rem] min-w-[260px]">
                <p className="text-[9px] text-brand font-black uppercase mb-3 tracking-[0.3em] italic opacity-80">Remaining Hours</p>
                <p className="text-6xl md:text-7xl font-black tracking-tighter italic leading-none text-slate-900 dark:text-white">{teacher?.credits}<span className="text-xl md:text-2xl opacity-20 ml-2">H</span></p>
            </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card title="Book Session" className="flex flex-col justify-between">
                <div className="space-y-6 mb-8">
                    <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg leading-relaxed italic font-medium">
                        Reserve your studio time. 4K equipment and professional acoustics are ready for your teaching content.
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <Badge label="4K Sony Native" className="bg-brand/5 text-brand border-brand/10 py-1.5 px-3 shadow-none" />
                        <Badge label="Acoustic Proof" className="bg-brand/5 text-brand border-brand/10 py-1.5 px-3 shadow-none" />
                    </div>
                </div>
                <Link to="/teacher/booking" className="btn-touch h-12 block w-full py-4 text-center rounded-xl font-black text-[9px] uppercase tracking-[0.2em] text-white bg-brand hover:bg-brand-600 shadow-lg transition-all">
                    Schedule Slot
                </Link>
            </Card>
            <Card title="Recent Activity">
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                    {bookings.filter((b:any)=>b.teacherId === teacher.id).map((b: any) => (
                        <div key={b.id} className="p-5 bg-slate-50 dark:bg-white/[0.02] rounded-xl border border-black/5 dark:border-white/5 flex flex-col sm:flex-row justify-between items-center gap-3 hover:border-brand/20 transition-all">
                            <div className="text-center sm:text-left">
                                <p className="font-black text-lg italic leading-none mb-1 text-slate-800 dark:text-white">{b.date}</p>
                                <p className="text-[8px] text-slate-400 uppercase font-black tracking-[0.2em] italic">{b.startTime}:00 | {b.duration}H Session</p>
                            </div>
                            <Badge label={b.status} className={`${STATUS_COLORS[b.status as BookingStatus]} py-1 px-3 shadow-none text-[8px]`} />
                        </div>
                    ))}
                    {bookings.filter((b:any)=>b.teacherId === teacher.id).length === 0 && <p className="text-center py-12 text-slate-400 italic uppercase tracking-[0.4em] font-black text-[8px] opacity-20">No history found</p>}
                </div>
            </Card>
        </div>
    </div>
);

const TeacherBooking = ({ bookings, onBook, credits, pricing }: any) => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [hour, setHour] = useState(8);
    const [duration, setDuration] = useState(1);
    const hoursArr = Array.from({ length: 17 }, (_, i) => i + 8); 
    const now = new Date();
    const isToday = date === now.toISOString().split('T')[0];
    const currentHour = now.getHours();

    return (
        <div className="space-y-10 animate-reveal">
            <h2 className="text-3xl md:text-6xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white">Booking</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card title="1. Select Date & Slot" className="lg:col-span-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                        <div className="space-y-2">
                            <label className="text-[8px] font-black uppercase text-slate-400 block tracking-[0.3em] italic">Desired Date</label>
                            <input type="date" value={date} onChange={e=>setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full bg-slate-50 dark:bg-black/40 p-4 h-12 rounded-xl border border-black/5 dark:border-white/5 outline-none focus:border-brand/40 font-black transition-all italic text-[11px] text-slate-900 dark:text-white" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[8px] font-black uppercase text-slate-400 block tracking-[0.3em] italic">Lesson Length</label>
                            <select value={duration} onChange={e=>setDuration(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-black/40 p-4 h-12 rounded-xl border border-black/5 dark:border-white/5 outline-none font-black focus:border-brand/40 transition-all italic text-[11px] text-slate-900 dark:text-white">
                                <option value={1}>1 Hour Session</option>
                                <option value={2}>2 Hours Session</option>
                                <option value={3}>3 Hours Session</option>
                                <option value={4}>4 Hours Session</option>
                                <option value={5}>5 Hours Session</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                        {hoursArr.map(h => {
                            const isBooked = bookings.some((b:any) => b.date === date && b.status !== BookingStatus.CANCELLED && h >= b.startTime && h < (b.startTime + b.duration));
                            const isPast = isToday && h <= currentHour;
                            const hDisplay = h > 12 ? `${h-12} PM` : h === 12 ? '12 PM' : `${h} AM`;
                            return (
                                <button key={h} onClick={()=>setHour(h)} disabled={isBooked || isPast} className={`btn-touch h-10 rounded-lg border transition-all font-black text-[9px] italic ${isBooked ? 'opacity-10 bg-slate-200 cursor-not-allowed border-transparent' : isPast ? 'opacity-5 cursor-not-allowed border-transparent' : hour === h ? 'bg-brand border-brand text-white shadow-md' : 'bg-white dark:bg-white/5 border-black/5 dark:border-white/10 hover:border-brand/30 text-slate-600 dark:text-slate-400'}`}>{hDisplay}</button>
                            );
                        })}
                    </div>
                </Card>
                <Card title="2. Confirmation">
                    <div className="space-y-8">
                        <div className="p-6 bg-slate-50 dark:bg-black/40 rounded-2xl border border-black/5 dark:border-white/5">
                            <p className="text-[8px] uppercase font-black text-slate-400 mb-4 tracking-[0.3em] italic">Summary</p>
                            <p className="text-xl font-black italic mb-1 text-slate-900 dark:text-white">{date}</p>
                            <p className="text-xs font-bold text-brand uppercase tracking-widest italic">{hour > 12 ? hour-12 : hour}:00 {hour >= 12 ? 'PM' : 'AM'}</p>
                        </div>
                        <div className="p-8 bg-brand/5 rounded-2xl border border-brand/20 text-center">
                            <p className="text-[8px] uppercase font-black text-brand mb-3 tracking-[0.3em] italic">Duration</p>
                            <p className="text-5xl font-black italic tracking-tighter leading-none text-brand">{duration}H</p>
                        </div>
                        <button onClick={()=>onBook(date, hour, duration)} disabled={credits < duration || (isToday && hour <= currentHour)} className="btn-touch h-12 w-full text-white rounded-xl font-black uppercase text-[9px] tracking-[0.2em] bg-brand hover:bg-brand-600 shadow-lg disabled:opacity-20 transition-all">
                            Confirm Order
                        </button>
                    </div>
                </Card>
            </div>
        </div>
    );
};

const AdminLandingEditor = ({ cms, setCms }: any) => {
    const [draft, setDraft] = useState<CMSConfig>(cms);

    const updateField = (field: keyof CMSConfig, value: any) => {
        setDraft(prev => ({ ...prev, [field]: value }));
    };

    const handleFeatureChange = (index: number, value: string) => {
        const newFeatures = [...draft.features];
        newFeatures[index] = value;
        updateField('features', newFeatures);
    };

    const addFeature = () => {
        updateField('features', [...draft.features, 'New Feature']);
    };

    const removeFeature = (index: number) => {
        updateField('features', draft.features.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-12 animate-reveal">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter leading-none text-slate-900 dark:text-white">Page Editor</h2>
                <button 
                  onClick={() => { setCms(draft); alert("Landing page content updated successfully!"); }}
                  className="btn-touch px-10 h-11 bg-brand text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-brand-600"
                >
                    Sync Changes
                </button>
            </div>

            <div className="grid grid-cols-1 gap-10">
                <Card title="Logo Configuration">
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-[9px] font-black uppercase text-slate-400 block tracking-widest">Studio Logo (Image URL)</label>
                        <input value={draft.studioLogo} onChange={e => updateField('studioLogo', e.target.value)} placeholder="Provide URL for custom logo" className="w-full bg-slate-50 dark:bg-black/40 p-4 rounded-xl border border-black/5 dark:border-white/5 outline-none font-bold italic text-xs text-slate-900 dark:text-white" />
                      </div>
                      <div className="flex items-center gap-8 p-6 bg-slate-50 dark:bg-black/20 rounded-2xl border border-black/5">
                        <div className="space-y-1">
                          <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest italic">Live Preview</p>
                          <div className="w-16 h-16 bg-brand rounded-2xl flex items-center justify-center shadow-lg overflow-hidden border border-white/10">
                            {draft.studioLogo ? (
                              <img src={draft.studioLogo} className="w-full h-full object-contain" alt="Preview" />
                            ) : (
                              <span className="text-white font-black text-xl italic">D</span>
                            )}
                          </div>
                        </div>
                        <p className="text-[11px] italic text-slate-500 font-medium">This logo appears in the Header, Hero, Login Page, and Loading Screen.</p>
                      </div>
                    </div>
                </Card>

                <Card title="Hero & Brand Section">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="text-[9px] font-black uppercase text-slate-400 block tracking-widest">Main Title</label>
                            <input value={draft.heroTitle} onChange={e => updateField('heroTitle', e.target.value)} className="w-full bg-slate-50 dark:bg-black/40 p-4 rounded-xl border border-black/5 dark:border-white/5 outline-none font-bold italic text-xs text-slate-900 dark:text-white" />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[9px] font-black uppercase text-slate-400 block tracking-widest">Sub-Title Label</label>
                            <input value={draft.heroSubtitle} onChange={e => updateField('heroSubtitle', e.target.value)} placeholder="e.g. Premium Digital Studio" className="w-full bg-slate-50 dark:bg-black/40 p-4 rounded-xl border border-black/5 dark:border-white/5 outline-none font-bold italic text-xs text-slate-900 dark:text-white" />
                        </div>
                        <div className="md:col-span-2 space-y-3">
                            <label className="text-[9px] font-black uppercase text-slate-400 block tracking-widest">Background Image URL</label>
                            <input value={draft.bannerImage} onChange={e => updateField('bannerImage', e.target.value)} className="w-full bg-slate-50 dark:bg-black/40 p-4 rounded-xl border border-black/5 dark:border-white/5 outline-none text-[10px] italic text-slate-900 dark:text-white" />
                        </div>
                    </div>
                </Card>

                <Card title="Strategy Section">
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-3">
                              <label className="text-[9px] font-black uppercase text-slate-400 block tracking-widest">Strategy Quote</label>
                              <textarea value={draft.studioIntelligence} onChange={e => updateField('studioIntelligence', e.target.value)} className="w-full bg-slate-50 dark:bg-black/40 p-6 rounded-xl border border-black/5 dark:border-white/5 outline-none font-medium italic text-sm text-slate-900 dark:text-white h-32 leading-relaxed" />
                          </div>
                          <div className="space-y-3">
                              <label className="text-[9px] font-black uppercase text-slate-400 block tracking-widest">Strategy Illustration (Image URL)</label>
                              <input value={draft.strategyImage} onChange={e => updateField('strategyImage', e.target.value)} className="w-full bg-slate-50 dark:bg-black/40 p-4 rounded-xl border border-black/5 dark:border-white/5 outline-none text-[10px] italic text-slate-900 dark:text-white" />
                              <div className="mt-2 h-20 rounded-lg overflow-hidden border border-black/5 bg-slate-100 flex items-center justify-center">
                                {draft.strategyImage ? <img src={draft.strategyImage} className="w-full h-full object-cover opacity-60" alt="Preview" /> : <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Image Preview</span>}
                              </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                            <label className="text-[9px] font-black uppercase text-slate-400 block tracking-widest">Feature List</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {draft.features.map((f, i) => (
                                    <div key={i} className="flex gap-2">
                                        <input value={f} onChange={e => handleFeatureChange(i, e.target.value)} className="flex-1 bg-slate-50 dark:bg-black/40 p-3 rounded-lg border border-black/5 dark:border-white/5 outline-none text-[10px] font-bold text-slate-900 dark:text-white" />
                                        <button onClick={() => removeFeature(i)} className="w-10 h-10 bg-rose-500/10 text-rose-500 rounded-lg flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button onClick={addFeature} className="px-6 h-9 bg-brand/10 text-brand border border-brand/20 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-brand hover:text-white transition-all">Add Bullet Point</button>
                        </div>
                    </div>
                </Card>

                <Card title="Narrative & Story (About Section)">
                    <div className="space-y-3">
                        <label className="text-[9px] font-black uppercase text-slate-400 block tracking-widest">Main About Text</label>
                        <textarea value={draft.aboutText} onChange={e => updateField('aboutText', e.target.value)} className="w-full bg-slate-50 dark:bg-black/40 p-8 rounded-2xl border border-black/5 dark:border-white/5 outline-none text-slate-700 dark:text-slate-300 h-48 italic font-medium leading-relaxed shadow-inner text-sm" />
                    </div>
                </Card>

                <Card title="Footer & Contact Details">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="text-[9px] font-black uppercase text-slate-400 block tracking-widest">Footer Brand Name</label>
                            <input value={draft.footerBrandName} onChange={e => updateField('footerBrandName', e.target.value)} className="w-full bg-slate-50 dark:bg-black/40 p-4 rounded-xl border border-black/5 dark:border-white/5 outline-none font-bold italic text-xs text-slate-900 dark:text-white" />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[9px] font-black uppercase text-slate-400 block tracking-widest">Director's Name</label>
                            <input value={draft.directorName} onChange={e => updateField('directorName', e.target.value)} className="w-full bg-slate-50 dark:bg-black/40 p-4 rounded-xl border border-black/5 dark:border-white/5 outline-none font-bold italic text-xs text-slate-900 dark:text-white" />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[9px] font-black uppercase text-slate-400 block tracking-widest">Contact Number</label>
                            <input value={draft.contactNumber} onChange={e => updateField('contactNumber', e.target.value)} className="w-full bg-slate-50 dark:bg-black/40 p-4 rounded-xl border border-black/5 dark:border-white/5 outline-none font-bold italic text-xs text-slate-900 dark:text-white" />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[9px] font-black uppercase text-slate-400 block tracking-widest">Footer Tagline (With Year)</label>
                            <input value={draft.footerTagline} onChange={e => updateField('footerTagline', e.target.value)} className="w-full bg-slate-50 dark:bg-black/40 p-4 rounded-xl border border-black/5 dark:border-white/5 outline-none font-bold italic text-xs text-slate-900 dark:text-white" />
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

const AdminMain = ({ bookings, updateStatus, transactions, verify, teachers, onApprove, cms, setCms, onManualAdd }: any) => {
    const [tab, setTab] = useState<'queue' | 'users'>('queue');
    const [manual, setManual] = useState(false);
    const [selT, setSelT] = useState('');
    const [topHrs, setTopHrs] = useState(1);
    const [topAmt, setTopAmt] = useState(1000);

    return (
        <div className="space-y-10 animate-reveal">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                <div className="space-y-3">
                    <h2 className="text-3xl md:text-6xl font-black uppercase italic tracking-tighter leading-none text-slate-900 dark:text-white">Admin Hub</h2>
                    <p className="text-slate-400 font-bold uppercase text-[8px] tracking-[0.8em] italic">Director: {cms.directorName}</p>
                </div>
                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                  <Link to="/admin/editor" className="btn-touch px-8 h-10 cinematic-glass text-[8px] font-black uppercase tracking-[0.15em] italic rounded-xl border border-black/5 dark:border-white/10 hover:border-brand transition-all text-slate-800 dark:text-white flex items-center">Open Editor</Link>
                  <button onClick={()=>setManual(true)} className="btn-touch px-8 h-10 bg-brand text-white text-[8px] font-black uppercase tracking-[0.15em] italic rounded-xl shadow-lg hover:bg-brand-600 transition-all">Add Credits</button>
                </div>
            </div>
            
            <div className="flex gap-8 border-b border-black/5 dark:border-white/5 pb-3 overflow-x-auto whitespace-nowrap scrollbar-hide">
                {['queue', 'users'].map((t) => (
                    <button key={t} onClick={()=>setTab(t as any)} className={`pb-3 text-[9px] font-black uppercase tracking-[0.4em] transition-all relative italic ${tab === t ? 'text-brand' : 'text-slate-400 opacity-60'}`}>
                        {t === 'queue' ? 'Active Queue' : 'Teacher Registry'}
                        {tab === t && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand rounded-full"></div>}
                    </button>
                ))}
            </div>

            {tab === 'queue' && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <Card title="Recording Schedule">
                        <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                            {bookings.map((b: any) => (
                                <div key={b.id} className="p-6 bg-slate-50 dark:bg-white/[0.02] rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-5 border border-transparent hover:border-brand/20 transition-all">
                                    <div className="text-center sm:text-left">
                                        <p className="font-black text-xl italic tracking-tighter mb-1.5 text-slate-800 dark:text-white">{b.teacherName}</p>
                                        <p className="text-[8px] text-slate-400 uppercase font-black tracking-[0.2em] italic mb-5">{b.date} @ {b.startTime}:00 ({b.duration}H)</p>
                                        <Badge label={b.status} className={`${STATUS_COLORS[b.status as BookingStatus]} py-1 px-5 shadow-none text-[8px]`} />
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-2">
                                        {b.status === BookingStatus.PENDING && <button onClick={()=>updateStatus(b.id, BookingStatus.CONFIRMED)} className="px-5 h-9 bg-brand text-white rounded-lg text-[8px] font-black uppercase italic shadow-md active:scale-95">Verify</button>}
                                        {b.status === BookingStatus.CONFIRMED && <button onClick={()=>updateStatus(b.id, BookingStatus.PACKED)} className="px-5 h-9 bg-blue-500 text-white rounded-lg text-[8px] font-black uppercase italic shadow-md active:scale-95">Ready</button>}
                                        {b.status === BookingStatus.PACKED && <button onClick={()=>updateStatus(b.id, BookingStatus.COMPLETED)} className="px-5 h-9 bg-emerald-500 text-white rounded-lg text-[8px] font-black uppercase italic shadow-md active:scale-95">Done</button>}
                                        {(b.status !== BookingStatus.CANCELLED && b.status !== BookingStatus.COMPLETED) && (
                                            <button onClick={()=>updateStatus(b.id, BookingStatus.CANCELLED)} className="w-9 h-9 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all active:scale-95 flex items-center justify-center"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12" /></svg></button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                    <Card title="Pending Payments">
                        <div className="space-y-5 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                            {transactions.filter((t:any)=>!t.verified).map((t: any) => (
                                <div key={t.id} className="p-8 bg-slate-50 dark:bg-white/[0.02] rounded-2xl flex flex-col gap-6 shadow-sm border border-black/5 dark:border-white/5">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
                                        <div>
                                            <p className="font-black text-xl italic tracking-tighter mb-1.5 text-slate-800 dark:text-white">{t.teacherName}</p>
                                            <p className="text-[8px] uppercase text-slate-400 font-black tracking-[0.2em] italic">{t.packageName || 'Purchase Request'}</p>
                                        </div>
                                        <button onClick={()=>verify(t.id)} className="w-full sm:w-auto px-6 h-9 bg-emerald-500 text-white rounded-lg text-[8px] font-black uppercase italic shadow-md active:scale-95">Approve</button>
                                    </div>
                                    {t.slipImage ? <img src={t.slipImage} className="aspect-stabilize h-48 rounded-xl border border-black/5 shadow-md" alt="Payment" /> : <div className="p-12 bg-slate-100 dark:bg-white/5 rounded-xl text-center italic text-[8px] font-black uppercase tracking-widest opacity-20">No slip found</div>}
                                </div>
                            ))}
                            {transactions.filter((t:any)=>!t.verified).length === 0 && <p className="text-center py-20 text-slate-400 italic uppercase tracking-[0.4em] font-black text-[8px] opacity-20">All caught up</p>}
                        </div>
                    </Card>
                </div>
            )}

            {tab === 'users' && (
                <Card title="Faculty List">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {teachers.map((t: any) => (
                            <div key={t.id} className="p-6 bg-slate-50 dark:bg-white/[0.02] rounded-[1.5rem] flex flex-col justify-between hover:border-brand/20 transition-all border border-black/5 dark:border-white/5">
                                <div className="mb-8">
                                    <div className="w-12 h-12 bg-brand/10 rounded-xl flex items-center justify-center text-brand font-black text-2xl mb-6 italic shadow-inner">{t.name[0]}</div>
                                    <p className="font-black text-xl tracking-tighter italic mb-1.5 text-slate-800 dark:text-white">{t.name}</p>
                                    <p className="text-[8px] text-slate-400 uppercase font-black tracking-[0.1em] italic mb-6 opacity-60 truncate">{t.email}</p>
                                    <Badge label={`Hours: ${t.credits}H`} className="bg-brand/5 text-brand px-3 py-1 shadow-none border-brand/5" />
                                </div>
                                {!t.isApproved ? (
                                    <button onClick={()=>onApprove(t.id)} className="w-full py-4 bg-brand text-white rounded-lg text-[9px] font-black uppercase tracking-[0.1em] italic shadow-md hover:bg-brand-600 transition-all">Approve Teacher</button>
                                ) : (
                                    <div className="flex items-center gap-2.5 text-emerald-500 bg-emerald-500/5 p-4 rounded-lg italic font-black uppercase text-[8px] tracking-widest border border-emerald-500/5">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" /></svg>
                                        Active Member
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {manual && (
              <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-6 backdrop-blur-sm">
                <Card className="max-w-sm w-full !p-10 border-brand/20 rounded-[2rem] shadow-2xl relative" title="Injection Hub">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[8px] font-black uppercase text-slate-400 block text-center tracking-widest italic">Faculty Member</label>
                      <select value={selT} onChange={e=>setSelT(e.target.value)} className="w-full bg-slate-50 dark:bg-black/40 p-4 h-11 rounded-lg border border-black/5 dark:border-white/10 font-black italic shadow-inner text-slate-800 dark:text-white text-xs">
                        <option value="">Select a Teacher</option>
                        {teachers.filter(t=>t.isApproved).map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[8px] font-black uppercase text-slate-400 block text-center tracking-widest italic">Amount (LKR)</label>
                        <input type="number" value={topAmt} onChange={e=>setTopAmt(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-black/40 p-4 h-11 rounded-lg border border-black/5 dark:border-white/10 font-black italic text-center shadow-inner text-slate-800 dark:text-white text-xs" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[8px] font-black uppercase text-slate-400 block text-center tracking-widest italic">Hours</label>
                        <input type="number" value={topHrs} onChange={e=>setTopHrs(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-black/40 p-4 h-11 rounded-lg border border-black/5 dark:border-white/10 font-black italic text-center shadow-inner text-slate-800 dark:text-white text-xs" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 pt-6">
                      <button onClick={()=>{onManualAdd(selT, topAmt, topHrs); setManual(false);}} className="w-full py-4 h-11 bg-emerald-500 text-white rounded-lg font-black uppercase text-[9px] italic tracking-widest shadow-xl active:scale-95 transition-all">Apply Injection</button>
                      <button onClick={()=>setManual(false)} className="w-full py-2 text-[8px] font-black uppercase text-slate-400 tracking-[0.3em] opacity-40 hover:opacity-100 transition-all italic">Discard</button>
                    </div>
                  </div>
                </Card>
              </div>
            )}
        </div>
    );
};

const AdminLogistics = ({ packages, setPackages }: any) => {
  const [edit, setEdit] = useState<any>(null);
  return (
    <div className="space-y-12 animate-reveal">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 text-slate-900 dark:text-white">
        <h2 className="text-3xl md:text-6xl font-black uppercase italic tracking-tighter leading-none">Recording Plans</h2>
        <button onClick={()=>setEdit({id: `p-${Date.now()}`, name: '', hours: 1, price: 1000, description: '', thumbnail: 'https://picsum.photos/seed/inv/800/600', badge: '1 HOUR'})} className="btn-touch h-10 px-8 bg-brand text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg hover:bg-brand-600 transition-all">
           Add Plan
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {packages.map((pkg: any) => (
          <Card key={pkg.id} className="!p-0 overflow-hidden group rounded-[2rem] shadow-sm border border-black/5 dark:border-white/5 bg-white dark:bg-[#111111]">
            <div className="h-56 overflow-hidden relative bg-black/5">
                <img src={pkg.thumbnail} className="aspect-stabilize opacity-60 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105" alt={pkg.name} />
                <div className="absolute top-5 left-5"><Badge label={pkg.badge} className="bg-brand text-white border-none py-1.5 px-4 shadow-md text-[8px] font-black" /></div>
            </div>
            <div className="p-8 space-y-5">
              <h3 className="text-2xl font-black uppercase mb-1 italic tracking-tight text-slate-800 dark:text-white">{pkg.name}</h3>
              <p className="text-3xl font-black text-brand mb-6 italic leading-none">{pkg.hours}H Block</p>
              <div className="flex gap-3">
                <button onClick={()=>setEdit(pkg)} className="flex-1 h-9 bg-slate-50 dark:bg-white/5 rounded-lg text-[8px] font-black uppercase italic tracking-[0.1em] transition-all hover:border-brand/30 border border-transparent text-slate-600 dark:text-slate-400">Modify</button>
                <button onClick={()=>setPackages(packages.filter((p:any)=>p.id!==pkg.id))} className="w-9 h-9 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all active:scale-95 flex items-center justify-center"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      {edit && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-6 backdrop-blur-sm">
          <Card className="max-w-md w-full !p-10 border-brand/20 rounded-[2rem] shadow-2xl relative" title="Plan Setup">
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 italic ml-3">Title</label>
                <input value={edit.name} onChange={e=>setEdit({...edit, name: e.target.value})} placeholder="e.g. Bronze Plan" className="w-full bg-slate-50 dark:bg-black/40 p-4 h-11 rounded-lg border border-black/5 dark:border-white/5 outline-none font-black italic shadow-inner text-slate-800 dark:text-white text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 italic ml-3">Hours</label>
                    <input type="number" value={edit.hours} onChange={e=>setEdit({...edit, hours: Number(e.target.value)})} className="w-full bg-slate-50 dark:bg-black/40 p-4 h-11 rounded-lg border border-black/5 dark:border-white/5 font-black italic shadow-inner text-center text-slate-800 dark:text-white text-xs" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 italic ml-3">LKR</label>
                    <input type="number" value={edit.price} onChange={e=>setEdit({...edit, price: Number(e.target.value)})} className="w-full bg-slate-50 dark:bg-black/40 p-4 h-11 rounded-lg border border-black/5 dark:border-white/5 font-black italic shadow-inner text-center text-slate-800 dark:text-white text-xs" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 italic ml-3">Image URL</label>
                <input value={edit.thumbnail} onChange={e=>setEdit({...edit, thumbnail: e.target.value})} placeholder="Link" className="w-full bg-slate-50 dark:bg-black/40 p-4 h-11 rounded-lg border border-black/5 dark:border-white/5 text-[9px] italic shadow-inner text-slate-800 dark:text-white" />
              </div>
              <div className="flex flex-col gap-3 pt-6">
                <button onClick={()=>{setPackages((prev: any) => { const idx = prev.findIndex((p:any)=>p.id===edit.id); if(idx>-1){ const n=[...prev]; n[idx]=edit; return n; } return [...prev, edit]; }); setEdit(null);}} className="w-full h-11 bg-brand text-white rounded-lg font-black uppercase text-[9px] italic tracking-widest shadow-xl transition-all">Save Changes</button>
                <button onClick={()=>setEdit(null)} className="w-full py-2 text-[8px] font-black uppercase text-slate-400 tracking-[0.3em] italic opacity-40 hover:opacity-100 transition-all">Cancel</button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

const AdminFinance = ({ transactions, teachers }: any) => {
    const verified = transactions.filter((t:any)=>t.verified);
    const total = verified.reduce((acc:any, curr:any)=>acc + curr.amount, 0);

    const handleExport = () => {
      const csvRows = [
        ["Date", "Teacher", "Plan", "Yield (LKR)"],
        ...verified.map(tx => {
          return [new Date(tx.date).toLocaleDateString(), tx.teacherName, tx.packageName || tx.type, tx.amount];
        })
      ];
      const csv = csvRows.map(r => r.join(",")).join("\n");
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden', '');
      a.setAttribute('href', url);
      a.setAttribute('download', `Dream_Audit_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };

    return (
        <div className="space-y-8 animate-reveal">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-2">
                    <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white">Revenue Audit</h2>
                    <p className="text-slate-400 font-bold uppercase text-[8px] tracking-[0.5em] italic">Audit point: B.A.M. Mendis</p>
                </div>
                
                <div className="p-6 md:p-8 bg-white dark:bg-[#111111] border border-emerald-500/20 rounded-[2rem] min-w-[260px] flex items-center justify-between gap-5 shadow-sm">
                    <div>
                        <p className="text-[8px] text-emerald-500 font-black uppercase tracking-[0.2em] italic mb-1 opacity-80">Total Revenue</p>
                        <p className="text-3xl font-black italic text-emerald-600 tracking-tight">LKR {total.toLocaleString()}</p>
                    </div>
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                </div>
            </div>

            <Card className="!p-0 overflow-hidden shadow-sm rounded-[2rem] border border-black/5 dark:border-white/5" title="Transaction Log">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[8px] uppercase text-slate-500 font-black border-b border-black/5 dark:border-white/5 bg-slate-50 dark:bg-black/30 backdrop-blur-md">
                                <th className="px-8 py-4 tracking-[0.15em]">Date</th>
                                <th className="px-8 py-4 tracking-[0.15em]">Member</th>
                                <th className="px-8 py-4 tracking-[0.15em]">Plan</th>
                                <th className="px-8 py-4 tracking-[0.15em] text-right">LKR Yield</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5 dark:divide-white/5">
                            {verified.map((tx: any) => (
                                <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors group">
                                    <td className="px-8 py-4 text-[9px] font-bold text-slate-400 italic">{new Date(tx.date).toLocaleDateString()}</td>
                                    <td className="px-8 py-4 text-11px font-black text-slate-700 dark:text-slate-300 italic tracking-tight uppercase">{tx.teacherName}</td>
                                    <td className="px-8 py-4">
                                        <Badge label={tx.type} className="bg-slate-50 dark:bg-white/5 text-slate-400 border-none px-2.5 py-1 shadow-none text-[7px] lowercase tracking-widest opacity-80" />
                                    </td>
                                    <td className="px-8 py-4 text-right font-black text-[15px] italic text-brand">+{tx.amount.toLocaleString()}</td>
                                </tr>
                            ))}
                            {verified.length === 0 && (
                                <tr><td colSpan={4} className="py-20 text-center text-slate-400 italic font-black uppercase tracking-[0.4em] text-[8px] opacity-15">Zero log data</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <div className="flex justify-center md:justify-end">
                <button onClick={handleExport} className="btn-touch px-6 h-9 cinematic-glass rounded-full text-[8px] font-black uppercase tracking-[0.2em] italic flex items-center justify-center gap-3 hover:border-brand/20 shadow-sm transition-all text-slate-700 dark:text-white/80">
                    <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Download Audit Report
                </button>
            </div>
        </div>
    );
};

const TeacherPackages = ({ packages, onBuy }: any) => {
    const [sel, setSel] = useState<any>(null);
    const [mthd, setMthd] = useState<PaymentMethod>(PaymentMethod.ONLINE);
    const [slipImg, setSlipImg] = useState<string | null>(null);
    return (
        <div className="space-y-12 md:space-y-16 animate-reveal">
            <h2 className="text-3xl md:text-6xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white">Refill Hours</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {packages.map((pkg: any) => (
                    <div key={pkg.id} className="group relative flex flex-col bg-white dark:bg-[#111111] rounded-[2rem] shadow-sm border border-black/5 dark:border-white/5 overflow-hidden hover:scale-[1.02] transition-all duration-300">
                        <div className="h-56 overflow-hidden relative bg-black/5">
                            <img src={pkg.thumbnail} className="aspect-stabilize opacity-50 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105" alt={pkg.name} />
                            <div className="absolute top-5 left-5"><Badge label={pkg.badge} className="bg-brand text-white border-none py-1 px-4 shadow-md text-[8px] font-black" /></div>
                        </div>
                        <div className="p-8 space-y-6">
                            <h3 className="text-2xl font-black uppercase mb-0.5 italic tracking-tight text-slate-800 dark:text-white">{pkg.name}</h3>
                            <p className="text-4xl font-black text-brand mb-6 italic leading-none tracking-tighter">
                                LKR {pkg.price.toLocaleString()}
                            </p>
                            <button onClick={()=>setSel(pkg)} className="w-full h-11 bg-slate-900 dark:bg-brand text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] transition-all">Acquire Plan</button>
                        </div>
                    </div>
                ))}
            </div>
            {sel && (
                <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-6 backdrop-blur-sm">
                    <Card className="max-w-md w-full !p-10 border-brand/20 rounded-[2rem] shadow-2xl relative" title="Secure Refill">
                        <div className="space-y-8">
                            <div className="flex gap-3 p-2 bg-slate-100 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/10">
                                <button onClick={()=>setMthd(PaymentMethod.ONLINE)} className={`flex-1 py-3 h-10 rounded-lg font-black text-[8px] uppercase tracking-[0.1em] transition-all italic ${mthd===PaymentMethod.ONLINE ? 'bg-brand text-white shadow-md':'text-slate-500'}`}>Online Sync</button>
                                <button onClick={()=>setMthd(PaymentMethod.ONSITE)} className={`flex-1 py-3 h-10 rounded-lg font-black text-[8px] uppercase tracking-[0.1em] transition-all italic ${mthd===PaymentMethod.ONSITE ? 'bg-brand text-white shadow-md':'text-slate-500'}`}>On-Site</button>
                            </div>
                            {mthd === PaymentMethod.ONLINE ? (
                                <div className="space-y-6">
                                    <div className="p-6 bg-slate-50 dark:bg-black/40 rounded-[1.5rem] border border-brand/10 text-center relative overflow-hidden group">
                                        <p className="text-[8px] uppercase font-black text-brand mb-3 tracking-[0.2em] italic">Direct Account</p>
                                        <p className="text-xs font-bold leading-none mb-1.5 italic text-slate-700 dark:text-slate-300">B.A.M. Mendis (Commercial Bank)</p>
                                        <p className="text-xl font-black italic tracking-widest text-brand">078 639 8066</p>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[8px] font-black uppercase text-slate-400 tracking-[0.2em] italic block text-center">Attach Receipt</label>
                                        <div className="relative group overflow-hidden rounded-[1.5rem] border-2 border-dashed border-black/5 dark:border-white/10 hover:border-brand/30 transition-colors">
                                            <input type="file" onChange={e=>{const f=e.target.files?.[0]; if(f){const r=new FileReader(); r.onloadend=()=>setSlipImg(r.result as string); r.readAsDataURL(f);}}} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                            <div className="w-full py-10 flex flex-col items-center justify-center gap-3 bg-slate-50/50 dark:bg-black/20">
                                                {slipImg ? (
                                                    <div className="flex flex-col items-center gap-3 animate-fade-in">
                                                        <svg className="w-10 h-10 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" /></svg>
                                                        <span className="text-[9px] font-black text-emerald-500 uppercase italic tracking-widest">Uploaded</span>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <svg className="w-10 h-10 text-slate-300 group-hover:text-brand transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic group-hover:text-brand transition-colors">Click to Upload</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-10 cinematic-glass rounded-[1.5rem] border border-black/5 dark:border-white/10 shadow-inner text-center">
                                    <p className="text-[13px] text-slate-500 italic font-medium leading-relaxed opacity-80">
                               