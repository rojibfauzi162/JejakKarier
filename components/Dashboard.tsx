
import React, { useState, useEffect, useRef } from 'react';
import { AppData, SkillStatus } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface DashboardProps {
  data: AppData;
  onNavigate?: (tab: string, date?: string) => void;
  onOpenNotif?: () => void;
  onLogout?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ data, onNavigate, onOpenNotif, onLogout }) => {
  const currentAffirmation = data.affirmations[Math.floor(Math.random() * data.affirmations.length)];
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // State for UI interactions
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Logic: Smart Reminder Alert System (Hanya untuk Hari Ini)
  const getReminders = () => {
    const today = new Date().toISOString().split('T')[0];
    const nowHours = new Date().getHours();
    const nowMinutes = new Date().getMinutes();
    const currentTime = `${nowHours.toString().padStart(2,'0')}:${nowMinutes.toString().padStart(2,'0')}`;

    const alerts = [];
    
    // 1. Check Daily Work (Hanya Hari Ini)
    const hasWorkLogs = data.dailyReports.some(l => l.date === today);
    if (!hasWorkLogs && currentTime >= data.reminderConfig.dailyLogReminderTime) {
      alerts.push({ id: 'log', text: "Kamu belum mengisi Aktivitas Kerja hari ini!", target: 'daily', date: today, icon: '📝', color: 'indigo', actionLabel: 'ISI SEKARANG →' });
    }

    // 2. Check Reflection (Hanya Hari Ini)
    const hasReflection = data.dailyReflections.some(r => r.date === today);
    if (!hasReflection && currentTime >= data.reminderConfig.reflectionReminderTime) {
      alerts.push({ id: 'ref', text: "Jangan lupa isi Refleksi Kerja hari ini!", target: 'work_reflection', date: today, icon: '🧘', color: 'rose', actionLabel: 'ISI SEKARANG →' });
    }

    return alerts;
  };

  const reminders = getReminders();

  // Auto show modal if there are reminders on mount (mobile only context usually)
  useEffect(() => {
    if (reminders.length > 0) {
      setShowReminderModal(true);
    }
  }, []);

  // State untuk Widget/Pinned Menus - Default 8 menu pertama
  const [pinnedMenuIds, setPinnedMenuIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('jejakkarir_pinned_menus');
    return saved ? JSON.parse(saved) : ['daily', 'work_reflection', 'todo_list', 'mobile_stats', 'skills', 'career', 'cv_generator', 'projects'];
  });

  const skillCount = data.skills.length;
  const achievedSkills = data.skills.filter(s => s.status === SkillStatus.ACHIEVED).length;
  const progressPercent = skillCount > 0 ? Math.round((achievedSkills / skillCount) * 100) : 0;
  
  // Simple chart data from daily reports
  const chartData = data.dailyReports.slice(-7).map(report => ({
    name: report.date ? new Date(report.date).toLocaleDateString('en-US', { weekday: 'short' }) : '?',
    value: report.metricValue
  }));

  const allMenuItems = [
    { id: 'daily', label: 'Daily Work', icon: 'bi-pencil-square' },
    { id: 'work_reflection', label: 'Refleksi Kerja', icon: 'bi-chat-quote' },
    { id: 'todo_list', label: 'Langkah Pengembangan', icon: 'bi-check2-square' },
    { id: 'mobile_stats', label: 'Performa Data', icon: 'bi-bar-chart-line' },
    { id: 'skills', label: 'Skills & Learning', icon: 'bi-mortarboard' },
    { id: 'career', label: 'Career Path', icon: 'bi-rocket-takeoff' },
    { id: 'cv_generator', label: 'PDF Export', icon: 'bi-file-earmark-pdf' },
    { id: 'projects', label: 'Personal Project', icon: 'bi-tools' },
    { id: 'networking', label: 'Networking', icon: 'bi-people' },
    { id: 'ai_insights', label: 'AI Insight activity', icon: 'bi-cpu' },
    { id: 'loker', label: 'Loker Tracker', icon: 'bi-briefcase' },
    { id: 'online_cv', label: 'Digital Page', icon: 'bi-globe' },
    { id: 'reviews', label: 'Monthly Review', icon: 'bi-calendar-check' },
  ];

  const togglePin = (id: string) => {
    setPinnedMenuIds(prev => {
      let next;
      if (prev.includes(id)) {
        next = prev.filter(p => p !== id);
      } else {
        if (prev.length >= 8) {
          alert("Maksimal 8 menu utama. Unpin menu lain terlebih dahulu.");
          return prev;
        }
        next = [...prev, id];
      }
      localStorage.setItem('jejakkarir_pinned_menus', JSON.stringify(next));
      return next;
    });
  };

  const pinnedItems = allMenuItems.filter(m => pinnedMenuIds.includes(m.id));
  const otherItems = allMenuItems.filter(m => !pinnedMenuIds.includes(m.id));
  const visibleItems = isMenuExpanded ? allMenuItems : pinnedItems;

  return (
    <div className="space-y-6 lg:space-y-10 animate-in fade-in duration-700 pb-20 overflow-x-hidden">
      
      {/* MOBILE APP INTERFACE */}
      <div className="block lg:hidden space-y-6 bg-white min-h-screen">
        {/* NEW ENHANCED MOBILE HEADER */}
        <header className="px-6 pt-4 pb-2 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-[110] border-b border-slate-50">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full border-2 border-slate-100 overflow-hidden shadow-sm">
                 {data.profile.photoUrl ? <img src={data.profile.photoUrl} alt="User" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-100 flex items-center justify-center text-xl"><i className="bi bi-person"></i></div>}
              </div>
              <div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Good Morning 👋</p>
                 <h2 className="text-lg font-black text-slate-900 tracking-tight leading-none">{data.profile.name.split(' ')[0]}</h2>
              </div>
           </div>
           <div className="flex gap-3">
              {/* Notification with Badge Count */}
              <button 
                onClick={() => reminders.length > 0 ? setShowReminderModal(true) : onOpenNotif?.()} 
                className={`w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center shadow-sm relative transition-colors ${reminders.length > 0 ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}
              >
                <i className={`bi ${reminders.length > 0 ? 'bi-bell-fill' : 'bi-bell'}`}></i>
                {reminders.length > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 border-2 border-white animate-in zoom-in duration-300">
                    {reminders.length}
                  </span>
                )}
              </button>

              {/* Profile Shortcut with Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)} 
                  className={`w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center shadow-sm text-lg transition-all ${isProfileDropdownOpen ? 'bg-slate-900 text-white border-slate-900' : 'text-slate-400'}`}
                >
                  <i className="bi bi-person-circle"></i>
                </button>
                
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-48 bg-white/95 backdrop-blur-xl border border-slate-100 rounded-[1.5rem] shadow-2xl p-2 animate-in slide-in-from-top-2 duration-300 z-[120]">
                    <div className="p-3 border-b border-slate-50 mb-1">
                        <p className="text-[10px] font-black text-slate-900 leading-none truncate">{data.profile.name}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">User Account</p>
                    </div>
                    <button onClick={() => { onNavigate?.('profile'); setIsProfileDropdownOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition-all text-left">
                        <i className="bi bi-person-circle text-sm"></i>
                        <span className="text-[10px] font-black uppercase tracking-widest">Profil Saya</span>
                    </button>
                    <button onClick={() => { onNavigate?.('settings'); setIsProfileDropdownOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition-all text-left">
                        <i className="bi bi-gear-fill text-sm"></i>
                        <span className="text-[10px] font-black uppercase tracking-widest">Pengaturan</span>
                    </button>
                    <div className="h-px bg-slate-50 my-1 mx-2"></div>
                    <button onClick={() => { if(onLogout) onLogout(); setIsProfileDropdownOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-rose-50 text-rose-500 transition-all text-left">
                        <i className="bi bi-box-arrow-right text-sm"></i>
                        <span className="text-[10px] font-black uppercase tracking-widest">Logout</span>
                    </button>
                  </div>
                )}
              </div>
           </div>
        </header>

        {/* Reminder Modal Popup (Instead of Bars) */}
        {showReminderModal && reminders.length > 0 && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
             <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowReminderModal(false)}></div>
             <div className="relative bg-white w-full max-w-sm rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-500">
                <div className="p-8 bg-indigo-600 text-white text-center">
                   <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">🔔</div>
                   <h3 className="text-xl font-black uppercase tracking-tight">Jangan Terlewat!</h3>
                   <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mt-1">Selesaikan rekam jejak harian Anda</p>
                </div>
                <div className="p-6 space-y-4">
                   {reminders.map(alert => (
                     <div key={alert.id} className={`p-5 rounded-2xl border-2 bg-white border-${alert.color}-50 shadow-sm flex flex-col gap-4`}>
                        <div className="flex items-start gap-4">
                           <span className="text-2xl shrink-0">{alert.icon}</span>
                           <p className="text-xs font-black text-slate-800 leading-tight uppercase">{alert.text}</p>
                        </div>
                        <button 
                          onClick={() => { onNavigate?.(alert.target, alert.date); setShowReminderModal(false); }}
                          className={`w-full py-3 bg-${alert.color === 'rose' ? 'rose-600' : 'indigo-600'} text-white font-black rounded-xl text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all`}
                        >
                          {alert.actionLabel}
                        </button>
                     </div>
                   ))}
                   <button onClick={() => setShowReminderModal(false)} className="w-full py-3 text-slate-400 font-black uppercase text-[9px] tracking-widest">Nanti Saja</button>
                </div>
             </div>
          </div>
        )}

        <div className="px-6">
           <div className="bg-gradient-to-br from-indigo-600 to-blue-500 p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-200 text-white relative overflow-hidden group">
              <div className="relative z-10">
                 <p className="text-4xl font-black tracking-tighter mb-2">{progressPercent}% <span className="text-sm font-bold uppercase tracking-widest opacity-80 block">Skill Readiness Score</span></p>
                 <p className="text-xs font-medium opacity-90 leading-relaxed max-w-[200px]">"{currentAffirmation}"</p>
              </div>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 text-7xl opacity-20 transform rotate-12 group-hover:scale-110 transition-transform duration-700"><i className="bi bi-gem"></i></div>
           </div>
        </div>

        <div className="px-6 space-y-6 pb-6">
           <div className="flex justify-between items-center px-1">
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Main Hub</h3>
              <div className="flex gap-2">
                <button onClick={() => setIsEditMode(!isEditMode)} className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border transition-all ${isEditMode ? 'bg-indigo-600 border-indigo-600 text-white' : 'text-slate-400 border-slate-100'}`}>{isEditMode ? 'Selesai' : 'Kelola Widget'}</button>
              </div>
           </div>
           
           <div className="grid grid-cols-4 gap-y-10 gap-x-4 animate-in fade-in duration-500">
              {visibleItems.map(item => (
                <div key={item.id} className="relative group">
                  <button id={`tour-mobile-${item.id}`} onClick={() => !isEditMode && onNavigate?.(item.id)} className={`w-full flex flex-col items-center gap-3 transition-transform ${!isEditMode ? 'active:scale-90' : ''}`}>
                    <div className={`w-16 h-16 rounded-[1.75rem] flex items-center justify-center border border-indigo-500/20 bg-indigo-600/5 text-indigo-600 text-2xl transition-all shadow-sm ${isEditMode ? 'opacity-40 grayscale' : ''}`}>
                       <i className={`bi ${item.icon}`}></i>
                    </div>
                    <span className="text-[9px] font-black text-slate-800 uppercase tracking-tighter text-center leading-tight">{item.label}</span>
                  </button>
                  {isEditMode && <button onClick={() => togglePin(item.id)} className={`absolute -top-2 -right-2 w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs shadow-lg transition-all ${pinnedMenuIds.includes(item.id) ? 'bg-rose-50 border-white text-white' : 'bg-emerald-50 border-white text-white'}`}><i className={`bi ${pinnedMenuIds.includes(item.id) ? 'bi-dash-lg' : 'bi-plus-lg'}`}></i></button>}
                </div>
              ))}
              {!isMenuExpanded && !isEditMode && otherItems.length > 0 && (
                <button onClick={() => setIsMenuExpanded(true)} className="flex flex-col items-center gap-3 active:scale-90 transition-transform group">
                  <div className="w-16 h-16 rounded-[1.75rem] flex items-center justify-center border border-slate-200 bg-slate-50 text-slate-400 text-2xl"><i className="bi bi-plus-lg"></i></div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter text-center leading-tight">Menu Lainnya</span>
                </button>
              )}
           </div>
        </div>

        {/* RESTORASI: Recent Activity List di Mobile */}
        <div className="px-6 space-y-4 pb-12">
           <div className="flex justify-between items-center px-1">
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Recent Activity</h3>
              <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest" onClick={() => onNavigate?.('daily')}>View All Logs</button>
           </div>
           <div className="space-y-3">
              {data.dailyReports.slice(-3).reverse().map((log, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-[2rem] border border-slate-100 animate-in slide-in-from-right duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                   <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xl shadow-sm border border-slate-100 text-indigo-600"><i className="bi bi-file-earmark-text"></i></div>
                   <div className="flex-1 overflow-hidden">
                      <p className="text-xs font-black text-slate-900 leading-tight mb-1 truncate">{log.activity}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{log.category} • {new Date(log.date).toLocaleDateString('id-ID', {day: '2-digit', month: 'short'})}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-black text-blue-600 uppercase">{log.metricValue} {log.metricLabel}</p>
                   </div>
                </div>
              ))}
              {data.dailyReports.length === 0 && (
                <div className="py-10 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Belum ada aktivitas hari ini</p>
                </div>
              )}
           </div>
        </div>
      </div>

      {/* DESKTOP ANALYTICAL DASHBOARD */}
      <div className="hidden lg:block space-y-10 animate-in fade-in duration-700 pb-20">
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Selamat Datang, {data.profile.name}!</h2>
            <div className="flex items-center gap-4">
               <p className="text-slate-400 font-bold text-sm uppercase tracking-widest flex items-center gap-2">Target Utama: <span className="text-indigo-600 border-b-2 border-indigo-600/30">{data.profile.mainCareer}</span></p>
            </div>
          </div>
          <div className="bg-indigo-600 p-8 rounded-[2.5rem] shadow-[0_20px_40px_rgba(79,70,229,0.15)] text-white flex items-center gap-6 max-w-lg group hover:-translate-y-1 transition-all duration-500 cursor-default">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path><path d="M5 3v4"></path><path d="M19 17v4"></path><path d="M3 5h4"></path><path d="M17 19h4"></path></svg></div>
            <div><p className="text-[10px] text-white/50 uppercase font-black tracking-[0.2em] mb-1">Inspirasi Hari Ini</p><p className="text-base italic font-semibold leading-tight">"{currentAffirmation}"</p></div>
          </div>
        </header>

        {/* DASHBOARD ALERT REMINDERS BAR - Desktop Only */}
        {reminders.length > 0 && (
          <div className="px-4 lg:px-0 space-y-3">
            {reminders.map(alert => (
              <div key={alert.id} className={`flex flex-col md:flex-row items-center justify-between p-6 lg:px-10 rounded-[2.5rem] border-2 shadow-xl animate-in slide-in-from-top-4 duration-700 bg-white border-${alert.color}-100`}>
                <div className="flex items-center gap-6 text-center md:text-left mb-4 md:mb-0">
                  <span className="text-3xl lg:text-4xl">{alert.icon}</span>
                  <div>
                    <p className={`text-[10px] font-black uppercase tracking-widest text-${alert.color}-400 mb-1`}>Reminder: Selesaikan Segera</p>
                    <p className="text-sm lg:text-base font-black text-slate-800 tracking-tight">{alert.text}</p>
                  </div>
                </div>
                <button 
                  onClick={() => onNavigate?.(alert.target, alert.date)} 
                  className={`px-8 py-3 bg-${alert.color === 'rose' ? 'rose-600' : alert.color === 'emerald' ? 'emerald-600' : 'indigo-600'} text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-2xl active:scale-95 transition-all`}
                >
                  Isi Sekarang →
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          <MetricCard title="Produktivitas" value={data.dailyReports.length > 0 ? data.dailyReports[data.dailyReports.length - 1].metricValue : 0} subtitle={`${data.dailyReports.length > 0 ? data.dailyReports[data.dailyReports.length - 1].metricLabel : 'Belum ada data'}`} icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>} color="indigo" />
          <MetricCard title="Progress Skill" value={`${progressPercent}%`} subtitle={`${achievedSkills} / ${skillCount} Skill tercapai`} icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>} color="emerald" />
          <MetricCard title="Status Akun" value={data.plan} subtitle={data.expiryDate ? `Sisa ${Math.ceil((new Date(data.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24))} Hari` : 'Aktif Selamanya'} icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>} color="slate" />
          <MetricCard title="Pencapaian" value={data.achievements.length} subtitle="Milestone tervalidasi" icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"></path></svg>} color="amber" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            <div className="bg-white p-10 rounded-[3rem] shadow-[0_2px_40px_rgba(0,0,0,0.02)] border border-slate-100">
              <div className="flex items-center justify-between mb-10">
                <div><h3 className="text-2xl font-black text-slate-800 tracking-tight">Analisis Performa</h3><p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-1">7 Hari Terakhir</p></div>
                <div className="flex gap-2"><div className="w-3 h-3 rounded-full bg-indigo-500"></div><span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Poin Metrik</span></div>
              </div>
              <div className="h-80"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><defs><linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} /><YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} /><Tooltip cursor={{ stroke: '#6366f1', strokeWidth: 2 }} contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', padding: '16px', backgroundColor: '#ffffff' }} itemStyle={{ fontWeight: '900', color: '#1e293b' }} /><Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={5} fillOpacity={1} fill="url(#colorValue)" /></AreaChart></ResponsiveContainer></div>
            </div>
          </div>

          <div className="space-y-10">
            <div className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl text-white relative overflow-hidden group">
              <h3 className="text-xl font-black tracking-tight mb-10 flex items-center justify-between">Target Selanjutnya<span className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg></span></h3>
              <div className="space-y-10">
                {data.careerPaths.filter(p => p.status !== 'tercapai').length > 0 ? (
                  (() => {
                    const nextGoal = data.careerPaths.filter(p => p.status !== 'tercapai')[0];
                    return (<div className="space-y-10"><div className="space-y-2"><p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-2">Jabatan Target</p><p className="text-2xl font-black tracking-tight leading-none">{nextGoal.targetPosition}</p></div><div className="grid grid-cols-2 gap-4"><div className="bg-white/5 p-4 rounded-2xl border border-white/5"><p className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-1">Status</p><p className="text-xs font-black uppercase">{nextGoal.status}</p></div><div className="bg-white/5 p-4 rounded-2xl border border-white/10"><p className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-1">Target Tahun</p><p className="text-xs font-black uppercase">{nextGoal.targetYear}</p></div></div><div className="space-y-3"><div className="flex justify-between items-center"><p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Indeks Kesiapan</p><p className="text-xs font-black text-indigo-400">{(nextGoal.skillLevel / 5 * 100).toFixed(0)}%</p></div><div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all duration-1000" style={{ width: `${nextGoal.skillLevel / 5 * 100}%` }}></div></div></div></div>);
                  })()
                ) : (<div className="text-center py-10"><p className="text-indigo-400 font-black uppercase tracking-[0.2em]">Target Tercapai! 🚀</p><p className="text-[10px] text-white/30 mt-3 font-bold uppercase tracking-widest leading-relaxed">Waktunya menentukan langkah hebat berikutnya.</p></div>)}
              </div>
            </div>
            <div className="bg-white p-10 rounded-[3rem] shadow-[0_2px_40px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col items-center text-center group"><div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 shadow-inner text-4xl text-amber-500"><i className="bi bi-trophy"></i></div><h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-2">Total Pencapaian</h3><p className="text-4xl font-black text-slate-900 tracking-tight">{data.achievements.length}</p><p className="text-[11px] font-bold text-slate-500 mt-4 uppercase tracking-widest">Milestone Tervalidasi</p></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ title: string; value: number | string; subtitle: string; icon: React.ReactNode; color: string }> = ({ title, value, subtitle, icon, color }) => {
  const colors: Record<string, string> = { indigo: 'bg-indigo-50 text-indigo-600', emerald: 'bg-emerald-50 text-emerald-600', slate: 'bg-slate-100 text-slate-900', amber: 'bg-amber-50 text-amber-600' };
  return (
    <div className="bg-white p-10 rounded-[3rem] shadow-[0_2px_40px_rgba(0,0,0,0.02)] border border-slate-100 transition-all duration-500 hover:shadow-[0_20px_60px_rgba(0,0,0,0.05)] hover:-translate-y-2 group"><div className={`w-14 h-14 ${colors[color]} rounded-2xl flex items-center justify-center mb-8 shadow-inner group-hover:scale-110 transition-transform duration-500 text-2xl`}>{icon}</div><p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mb-2">{title}</p><h4 className="text-2xl font-black text-slate-900 tracking-tight leading-none">{value}</h4><p className="text-[10px] text-slate-500 mt-5 font-black uppercase tracking-widest opacity-60 italic">{subtitle}</p></div>
  );
};

export default Dashboard;
