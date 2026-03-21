import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AppData, SkillStatus, SubscriptionPlan } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend } from 'recharts';

interface DashboardProps {
  data: AppData;
  onNavigate?: (tab: string, date?: string) => void;
  onOpenOnboarding?: () => void;
  onOpenNotif?: () => void;
  onLogout?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ data, onNavigate, onOpenOnboarding, onOpenNotif, onLogout }) => {
  const currentAffirmation = data.affirmations[Math.floor(Math.random() * data.affirmations.length)];
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // FILTER STATE
  const [dashboardFilter, setDashboardFilter] = useState<'all' | 'today' | '7days' | '1month' | '3months' | '6months' | '1year' | 'range'>('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Trial Journey Logic
  const daysSinceJoined = useMemo(() => {
    const joined = new Date(data.joinedAt);
    const now = new Date();
    return Math.floor((now.getTime() - joined.getTime()) / (1000 * 3600 * 24));
  }, [data.joinedAt]);

  const activeDurationDays = daysSinceJoined + 1; // Masa aktif akun (hari ke-X)

  const isTrialUser = data.plan === SubscriptionPlan.FREE;
  const logCount = data.dailyReports.length;

  // Scenario Message Engine
  const trialMessage = useMemo(() => {
    if (!isTrialUser) return null;

    if (daysSinceJoined >= 7) return {
      title: "Masa Trial Berakhir",
      desc: "Data Anda sudah mulai membentuk pola perkembangan yang kuat. Lanjutkan analisis mendalam dengan Paket Pro?",
      cta: "Buka Analisis Pro →",
      type: "urgent"
    };

    if (daysSinceJoined === 1 && logCount === 0) return {
      title: "Selamat Datang!",
      desc: "Trial Premium 7 Hari Anda sudah aktif. Mulai hari Anda dengan mencatat 1 aktivitas kerja pertama.",
      cta: "Isi Aktivitas Pertama →",
      type: "guide",
      target: "daily"
    };

    if (daysSinceJoined <= 3 && logCount >= 3) return {
      title: "Pola Karir Terdeteksi",
      desc: "Kami mulai melihat pola aktivitas Anda. Lihat rangkuman awal di tab Insight.",
      cta: "Lihat Insight Awal →",
      type: "insight",
      target: "ai_insights"
    };

    if (daysSinceJoined <= 5 && logCount >= 5) return {
      title: "Analisis Siap",
      desc: "Data Anda sudah cukup untuk analisis awal kualifikasi. AI Strategist sudah bisa digunakan.",
      cta: "Jalankan AI Strategist →",
      type: "insight",
      target: "skills"
    };

    if (daysSinceJoined === 6) return {
      title: "Akses Terakhir",
      desc: "Akses insight lanjutan akan terkunci besok. Amankan rekam jejak Anda sekarang.",
      cta: "Amankan Akses Pro →",
      type: "warning",
      target: "billing"
    };

    return null;
  }, [daysSinceJoined, logCount, isTrialUser]);

  // Expiry & Renewal Logic
  const expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;
  const daysRemaining = expiryDate ? Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : Infinity;
  const isExpiringSoon = daysRemaining <= 7 && daysRemaining >= 0;
  const [isRenewalBannerOpen, setIsRenewalBannerOpen] = useState(true);

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
    return saved ? JSON.parse(saved) : ['daily', 'work_reflection', 'reports', 'mobile_stats', 'todo_list', 'skills', 'career', 'cv_generator'];
  });

  const skillCount = data.skills.length;
  const achievedSkills = data.skills.filter(s => s.status === SkillStatus.ACHIEVED).length;
  const progressPercent = skillCount > 0 ? Math.round((achievedSkills / skillCount) * 100) : 0;
  
  // Logic: Account Readiness Score (Kesiapan Profil)
  const calculateAccountReadiness = () => {
    const profileFields = [
      data.profile.name,
      data.profile.phone,
      data.profile.domicile,
      data.profile.mainCareer,
      data.profile.currentPosition,
      data.profile.description,
      data.profile.photoUrl
    ];
    const filledFields = profileFields.filter(f => f && f.length > 0).length;
    const hasWork = data.workExperiences.length > 0 ? 1 : 0;
    const hasEdu = data.educations.length > 0 ? 1 : 0;
    // Total 9 poin (7 field profil + work exp + education)
    return Math.round(((filledFields + hasWork + hasEdu) / 9) * 100);
  };
  const accountReadiness = calculateAccountReadiness();

  // Simple chart data from daily reports
  const chartData = data.dailyReports.slice(-7).map(report => ({
    name: report.date ? new Date(report.date).toLocaleDateString('en-US', { weekday: 'short' }) : '?',
    value: report.metricValue
  }));

  const allMenuItems = [
    { id: 'daily', label: 'Daily Work', icon: 'bi-pencil-square' },
    { id: 'work_reflection', label: 'Refleksi Kerja', icon: 'bi-chat-quote' },
    { id: 'reports', label: 'Laporan pekerjaan', icon: 'bi-graph-up' },
    { id: 'mobile_stats', label: 'Data Statistik', icon: 'bi-bar-chart-line' },
    { id: 'todo_list', label: 'Langkah Pengembangan', icon: 'bi-check2-square' },
    { id: 'skills', label: 'Skills & Learning', icon: 'bi-mortarboard' },
    { id: 'career', label: 'Career Path', icon: 'bi-rocket-takeoff' },
    { id: 'achievements', label: 'Achievements', icon: 'bi-trophy' },
    { id: 'cv_generator', label: 'PDF Export', icon: 'bi-file-earmark-pdf' },
    { id: 'projects', label: 'Personal Project', icon: 'bi-tools' },
    { id: 'networking', label: 'Networking', icon: 'bi-people' },
    { id: 'ai_insights', label: 'AI Insight activity', icon: 'bi-cpu' },
    { id: 'loker', label: 'Loker Tracker', icon: 'bi-briefcase' },
    { id: 'online_cv', label: 'Digital Page', icon: 'bi-globe' },
    { id: 'reviews', label: 'Monthly Review', icon: 'bi-calendar-check' },
    { id: 'billing', label: 'Billing & Plan', icon: 'bi-credit-card' },
    { id: 'settings', label: 'Pengaturan', icon: 'bi-gear' },
    { id: 'calendar', label: 'Career Calendar', icon: 'bi-calendar3' },
  ];

  // --- DESKTOP DASHBOARD LOGIC ---
  
  // Helper: Filter Date
  const isDateInFilter = (dateStr: string) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    if (dashboardFilter === 'all') return true;
    if (dashboardFilter === 'today') {
        return date >= todayStart && date <= now;
    }
    if (dashboardFilter === 'range') {
        if (!filterStartDate || !filterEndDate) return true;
        const start = new Date(filterStartDate);
        const end = new Date(filterEndDate);
        end.setHours(23, 59, 59, 999);
        return date >= start && date <= end;
    }

    let daysToSubtract = 0;
    if (dashboardFilter === '7days') daysToSubtract = 7;
    if (dashboardFilter === '1month') daysToSubtract = 30;
    if (dashboardFilter === '3months') daysToSubtract = 90;
    if (dashboardFilter === '6months') daysToSubtract = 180;
    if (dashboardFilter === '1year') daysToSubtract = 365;

    const pastDate = new Date(now);
    pastDate.setDate(pastDate.getDate() - daysToSubtract);
    return date >= pastDate;
  };

  // Filtered Data
  const filteredReports = useMemo(() => data.dailyReports.filter(r => isDateInFilter(r.date)), [data.dailyReports, dashboardFilter, filterStartDate, filterEndDate]);
  const filteredReflections = useMemo(() => data.dailyReflections.filter(r => isDateInFilter(r.date)), [data.dailyReflections, dashboardFilter, filterStartDate, filterEndDate]);
  const filteredAchievements = useMemo(() => data.achievements.filter(a => isDateInFilter(a.date)), [data.achievements, dashboardFilter, filterStartDate, filterEndDate]);

  // 1. Top Skill Logic (Filtered)
  const topSkill = useMemo(() => {
    const skillCounts: Record<string, number> = {};
    filteredReflections.forEach(r => {
      r.skillsUsed.forEach(s => {
        skillCounts[s] = (skillCounts[s] || 0) + 1;
      });
    });
    const sorted = Object.entries(skillCounts).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? { name: sorted[0][0], count: sorted[0][1] } : null;
  }, [filteredReflections]);

  // 4. Summary Logic (Filtered)
  const summaryStats = useMemo(() => {
    return { logs: filteredReports.length, reflections: filteredReflections.length };
  }, [filteredReports, filteredReflections]);

  // 5. Skill Gap Radar Data (Current Only + Percentage)
  const radarData = useMemo(() => {
    return data.skills.slice(0, 5).map(s => ({
      subject: s.name,
      A: s.currentLevel,
      fullMark: 5,
      percentage: Math.round((s.currentLevel / 5) * 100) // Assuming max level is 5
    }));
  }, [data.skills]);

  // 7. Nearest Event (Unfiltered - always show upcoming)
  const nearestEvent = useMemo(() => {
    const upcoming = (data.careerEvents || []).filter(e => {
        const eDate = new Date(e.date);
        const today = new Date();
        today.setHours(0,0,0,0);
        return eDate >= today;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return upcoming.length > 0 ? upcoming[0] : null;
  }, [data.careerEvents]);

  // 9. Pending Todos (Unfiltered - always show pending)
  const pendingTodos = useMemo(() => {
    return data.todoList.filter(t => t.status === 'Pending').slice(0, 3);
  }, [data.todoList]);

  // 8. Recent Activities (Filtered)
  const recentActivities = useMemo(() => {
    return filteredReports.slice(-3).reverse();
  }, [filteredReports]);

  // Chart Data (Filtered)
  const filteredChartData = useMemo(() => {
      // If filtered reports are empty or few, maybe show empty state or just the points
      // Group by date to ensure line chart continuity if needed, or just map reports
      // For simplicity, mapping reports directly as before, but filtered.
      // If 'all' or long range, maybe aggregate? Keeping it simple for now.
      return filteredReports.map(report => ({
        name: report.date ? new Date(report.date).toLocaleDateString('en-US', { weekday: 'short' }) : '?',
        value: report.metricValue
      }));
  }, [filteredReports]);

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
        {/* MODIFIED HEADER */}
        <header className="px-6 pt-2 pb-4 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full border-2 border-slate-100 overflow-hidden shadow-sm">
                 {data.profile.photoUrl ? <img src={data.profile.photoUrl} alt="User" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-100 flex items-center justify-center text-xl"><i className="bi bi-person"></i></div>}
              </div>
              <div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Good Morning 👋</p>
                 <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">{data.profile.name.split(' ')[0]}</h2>
              </div>
           </div>
        </header>

        {/* TRIAL JOURNEY WIDGET (NEW) */}
        {trialMessage && (
          <div className="px-6">
            <div className={`p-6 rounded-[2.5rem] shadow-xl animate-in slide-in-from-top-4 duration-700 ${
              trialMessage.type === 'urgent' ? 'bg-rose-600 text-white' : 
              trialMessage.type === 'warning' ? 'bg-amber-500 text-white' : 'bg-slate-900 text-white'
            }`}>
               <div className="flex gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-2xl shrink-0 italic">!</div>
                  <div className="space-y-3">
                     <p className="text-[9px] font-black uppercase tracking-widest opacity-60">{trialMessage.title}</p>
                     <p className="text-sm font-bold leading-tight">{trialMessage.desc}</p>
                     <button 
                      onClick={() => onNavigate?.(trialMessage.target || 'billing')}
                      className="px-6 py-2.5 bg-white text-slate-900 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                     >
                        {trialMessage.cta}
                     </button>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* SUBSCRIPTION & EXPIRY INFO BAR (MOBILE) */}
        <div className="px-6">
           <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center text-sm shadow-lg"><i className="bi bi-patch-check-fill"></i></div>
                 <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Paket Aktif</p>
                    <p className="text-sm font-black text-indigo-600 uppercase">{data.plan}</p>
                 </div>
              </div>
              <div className="text-right">
                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Masa Berlaku</p>
                 <p className="text-xs font-black text-slate-700">
                    {data.expiryDate ? new Date(data.expiryDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Selamanya'}
                 </p>
              </div>
           </div>
        </div>

        <div className="px-6 space-y-4">
           {/* Skill Readiness Card */}
           <div className="bg-gradient-to-br from-indigo-600 to-blue-500 p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-200 text-white relative overflow-hidden group">
              <div className="relative z-10">
                 <p className="text-4xl font-black tracking-tighter mb-2">{progressPercent}% <span className="text-sm font-bold uppercase tracking-widest opacity-80 block">Skill Readiness Score</span></p>
                 <p className="text-xs font-medium opacity-90 leading-relaxed max-w-[200px]">"{currentAffirmation}"</p>
              </div>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 text-7xl opacity-20 transform rotate-12 group-hover:scale-110 transition-transform duration-700"><i className="bi bi-gem"></i></div>
           </div>
           
           {/* Account Completion Card */}
           <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-xl"><i className="bi bi-person-check"></i></div>
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Account Readiness</p>
                    <p className="text-lg font-black text-slate-800 leading-none">{accountReadiness}% Profil Lengkap</p>
                 </div>
              </div>
              <button onClick={() => onOpenOnboarding ? onOpenOnboarding() : onNavigate?.('profile')} className="text-[9px] font-black text-blue-600 uppercase tracking-widest border-b border-blue-600/30">Lengkapi</button>
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
                    <span className="text-[9px] font-black text-slate-700 uppercase tracking-tighter text-center leading-tight">{item.label}</span>
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

        {/* Recent Activity List */}
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
      <div className="hidden lg:block space-y-8 animate-in fade-in duration-700 pb-20">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Dashboard Overview</h2>
            <div className="flex items-center gap-3 mt-1">
                <p className="text-slate-500 font-medium">Pantau progres karir dan pengembangan diri Anda.</p>
                <div className="h-4 w-[1px] bg-slate-300"></div>
                <p className="text-indigo-600 font-bold text-sm bg-indigo-50 px-3 py-1 rounded-full">
                  Sisa Masa Aktif: {daysRemaining === Infinity ? 'Selamanya' : daysRemaining < 0 ? 'Habis' : `${daysRemaining} Hari`}
                </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                <select 
                    value={dashboardFilter} 
                    onChange={(e) => setDashboardFilter(e.target.value as any)}
                    className="bg-transparent text-xs font-bold text-slate-700 outline-none px-3 py-2 cursor-pointer"
                >
                    <option value="all">Semua Waktu</option>
                    <option value="today">Hari Ini</option>
                    <option value="7days">7 Hari Terakhir</option>
                    <option value="1month">1 Bulan Terakhir</option>
                    <option value="3months">3 Bulan Terakhir</option>
                    <option value="6months">6 Bulan Terakhir</option>
                    <option value="1year">1 Tahun Terakhir</option>
                    <option value="range">Pilih Tanggal</option>
                </select>
                {dashboardFilter === 'range' && (
                    <div className="flex items-center gap-2 px-2 border-l border-slate-100">
                        <input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} className="text-[10px] font-bold text-slate-600 outline-none bg-transparent" />
                        <span className="text-slate-300">-</span>
                        <input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} className="text-[10px] font-bold text-slate-600 outline-none bg-transparent" />
                    </div>
                )}
             </div>
             <p className="text-sm font-bold text-slate-500 hidden xl:block">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </header>

        {/* ROW 1: METRICS */}
        <div className="grid grid-cols-4 gap-6">
           {/* 1. Total Daily Work */}
           <MetricCard 
             title="Total Aktivitas" 
             value={filteredReports.length} 
             subtitle={dashboardFilter === 'all' ? "Total Work Logs" : "Filtered Logs"} 
             icon={<i className="bi bi-journal-text"></i>} 
             color="indigo" 
           />
           
           {/* 2. Top Skill */}
           <MetricCard 
             title="Top Skill" 
             value={topSkill ? topSkill.name : '-'} 
             subtitle={topSkill ? `${topSkill.count}x digunakan` : 'Belum ada data'} 
             icon={<i className="bi bi-star-fill"></i>} 
             color="amber" 
           />

           {/* 4. Weekly Summary (Now Filtered Summary) */}
           <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Ringkasan Periode</p>
              <div className="flex items-center justify-between mb-2">
                 <span className="text-sm font-bold text-slate-600">Logs</span>
                 <span className="text-xl font-black text-slate-900">{summaryStats.logs}</span>
              </div>
              <div className="flex items-center justify-between">
                 <span className="text-sm font-bold text-slate-600">Refleksi</span>
                 <span className="text-xl font-black text-slate-900">{summaryStats.reflections}</span>
              </div>
           </div>

           {/* 7. Nearest Event */}
           <div className="bg-slate-900 p-6 rounded-[2.5rem] text-white shadow-lg flex flex-col justify-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-5xl"><i className="bi bi-calendar-event"></i></div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Agenda Terdekat</p>
              {nearestEvent ? (
                <>
                  <p className="text-lg font-black leading-tight truncate">{nearestEvent.title}</p>
                  <p className="text-xs font-bold mt-1 opacity-80">{new Date(nearestEvent.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • {nearestEvent.time}</p>
                </>
              ) : (
                <p className="text-sm font-bold opacity-80">Tidak ada agenda mendatang</p>
              )}
           </div>
        </div>

        {/* ROW 2: CHARTS */}
        <div className="grid grid-cols-3 gap-6">
           {/* 3. Line Chart (Daily Activity) */}
           <div className="col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-lg font-black text-slate-800">Aktivitas Harian</h3>
                 <span className="text-xs font-bold text-slate-400 uppercase">{dashboardFilter === 'all' ? 'Semua Waktu' : 'Periode Terpilih'}</span>
              </div>
              <div className="h-64">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={filteredChartData}>
                       <defs>
                          <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                             <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                       <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                       <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}} />
                       <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} fill="url(#colorActivity)" />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>

           {/* 5. Skill Gap Radar */}
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h3 className="text-lg font-black text-slate-800 mb-6">Skill Radar (Current)</h3>
              <div className="h-64">
                 <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                       <PolarGrid stroke="#e2e8f0" />
                       <PolarAngleAxis dataKey="subject" tick={{fontSize: 9, fill: '#64748b', fontWeight: 'bold'}} />
                       <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                       <Radar name="Current Level" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} />
                       <Tooltip formatter={(value: any, name: any, props: any) => [`${value}/5 (${props.payload.percentage}%)`, name]} contentStyle={{borderRadius: '12px', fontSize: '12px'}} />
                       <Legend iconType="circle" wrapperStyle={{fontSize: '10px', paddingTop: '10px'}} />
                    </RadarChart>
                 </ResponsiveContainer>
              </div>
           </div>
        </div>

        {/* ROW 3: LISTS */}
        <div className="grid grid-cols-3 gap-6">
           {/* 8. Latest Activities */}
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h3 className="text-lg font-black text-slate-800 mb-6">Aktivitas Terakhir</h3>
              <div className="space-y-4">
                 {recentActivities.map((log, i) => (
                    <div key={i} className="flex items-center gap-3 pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                       <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs"><i className="bi bi-pencil"></i></div>
                       <div className="flex-1 overflow-hidden">
                          <p className="text-xs font-bold text-slate-800 truncate">{log.activity}</p>
                          <p className="text-[10px] text-slate-400">{new Date(log.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}</p>
                       </div>
                    </div>
                 ))}
                 {recentActivities.length === 0 && <p className="text-xs text-slate-400 italic">Belum ada aktivitas.</p>}
              </div>
           </div>

           {/* 9. Pending Todos */}
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h3 className="text-lg font-black text-slate-800 mb-6">To-Do Pending</h3>
              <div className="space-y-4">
                 {pendingTodos.map((todo, i) => (
                    <div key={i} className="flex items-center gap-3 pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                       <div className="w-4 h-4 rounded border-2 border-slate-300"></div>
                       <div className="flex-1 overflow-hidden">
                          <p className="text-xs font-bold text-slate-800 truncate">{todo.task}</p>
                          <p className="text-[10px] text-slate-400">{todo.category}</p>
                       </div>
                    </div>
                 ))}
                 {pendingTodos.length === 0 && <p className="text-xs text-slate-400 italic">Semua tugas selesai!</p>}
              </div>
           </div>

           {/* 6. Achievements */}
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h3 className="text-lg font-black text-slate-800 mb-6">Pencapaian</h3>
              <div className="space-y-4">
                 {filteredAchievements.slice(0, 3).map((ach, i) => (
                    <div key={i} className="flex items-center gap-3 pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                       <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center text-xs"><i className="bi bi-trophy-fill"></i></div>
                       <div className="flex-1 overflow-hidden">
                          <p className="text-xs font-bold text-slate-800 truncate">{ach.title}</p>
                          <p className="text-[10px] text-slate-400">{ach.category}</p>
                       </div>
                    </div>
                 ))}
                 {filteredAchievements.length === 0 && <p className="text-xs text-slate-400 italic">Belum ada pencapaian.</p>}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ title: string; value: number | string; subtitle: string; icon: React.ReactNode; color: string }> = ({ title, value, subtitle, icon, color }) => {
  const colors: Record<string, string> = { indigo: 'bg-indigo-50 text-indigo-600', emerald: 'bg-emerald-50 text-emerald-600', slate: 'bg-slate-100 text-slate-900', amber: 'bg-amber-50 text-amber-600', blue: 'bg-blue-50 text-blue-600' };
  return (
    <div className="bg-white p-10 rounded-[3rem] shadow-[0_2px_40px_rgba(0,0,0,0.02)] border border-slate-100 transition-all duration-500 hover:shadow-[0_20px_60px_rgba(0,0,0,0.05)] hover:-translate-y-2 group"><div className={`w-14 h-14 ${colors[color]} rounded-2xl flex items-center justify-center mb-8 shadow-inner group-hover:scale-110 transition-transform duration-500 text-2xl`}>{icon}</div><p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mb-2">{title}</p><h4 className="text-2xl font-black text-slate-900 tracking-tight leading-none">{value}</h4><p className="text-[10px] text-slate-500 mt-5 font-black uppercase tracking-widest opacity-60 italic">{subtitle}</p></div>
  );
};

export default Dashboard;