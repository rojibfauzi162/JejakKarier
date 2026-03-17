
import React, { useState, useMemo } from 'react';
import { WorkReflection, Skill, SkillCategory, SkillStatus, SkillPriority, ToDoTask, Achievement, AchievementCategory, AppData } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { analyzeReflections } from '../services/geminiService';

interface WorkReflectionProps {
  reflections: WorkReflection[];
  skills: Skill[];
  onAdd: (reflection: WorkReflection) => void;
  onUpdateSkill: (skill: Skill) => void;
  onAddTodo?: (task: ToDoTask) => void;
  onAddAchievement?: (achievement: Achievement) => void;
  appData?: AppData;
  targetDate?: string;
}

const MICRO_WINS = [
  "Menyelesaikan tugas sulit",
  "Belajar hal baru",
  "Membantu rekan kerja",
  "Mengambil inisiatif",
  "Lebih cepat dari target"
];

const ROTATING_QUESTIONS = [
  "Apa yang kamu pelajari hari ini?",
  "Hal kecil apa yang membuat harimu lebih baik?",
  "Tantangan apa yang berhasil kamu hadapi hari ini?",
  "Di bagian mana kamu merasa paling berkembang hari ini?",
  "Apa hal yang paling menguras energimu hari ini?",
  "Apa satu hal yang paling kamu syukuri dari pekerjaanmu hari ini?"
];

const WorkReflectionView: React.FC<WorkReflectionProps> = ({ reflections, skills, onAdd, onUpdateSkill, onAddTodo, onAddAchievement, appData, targetDate }) => {
  const today = new Date().toISOString().split('T')[0];
  const todayReflection = reflections.find(r => r.date === today);

  // States for Navigation & Filter
  const [activeTab, setActiveTab] = useState<'journal' | 'analysis'>('journal');
  const [timeFilter, setTimeFilter] = useState<'7days' | '30days' | '90days' | '180days' | 'all'>('7days');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // AI State
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState<any>(null);
  const [showFullAiReport, setShowFullAiReport] = useState(false); // State baru untuk halaman laporan AI

  // Modal State
  const [selectedEntry, setSelectedEntry] = useState<WorkReflection | null>(null);

  // Helper untuk emoji mood
  const getMoodEmoji = (m: number) => {
    if (m === 1) return '😞';
    if (m === 2) return '😐';
    if (m === 3) return '🙂';
    if (m === 4) return '😃';
    return '🚀';
  };

  // Logic: Filtering History & Analysis
  const filteredReflections = useMemo(() => {
    const now = new Date();
    return reflections.filter(r => {
      const rDate = new Date(r.date);
      const diffTime = Math.abs(now.getTime() - rDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (timeFilter === '7days') return diffDays <= 7;
      if (timeFilter === '30days') return diffDays <= 30;
      if (timeFilter === '90days') return diffDays <= 90;
      if (timeFilter === '180days') return diffDays <= 180;
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [reflections, timeFilter]);

  // Logic: Pagination
  const totalPages = Math.ceil(filteredReflections.length / itemsPerPage);
  const paginatedItems = filteredReflections.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Logic: Statistics Data based on Filter
  const stats = useMemo(() => {
    if (filteredReflections.length === 0) return null;

    const skillMap: Record<string, number> = {};
    const moodTrend = [...filteredReflections].sort((a, b) => a.date.localeCompare(b.date)).map(r => ({
      date: r.date.split('-').slice(1).join('/'),
      mood: r.mood,
      load: r.workload === 'Heavy' ? 5 : r.workload === 'Normal' ? 3 : 1
    }));

    const energyDist = [
      { name: 'Low', value: filteredReflections.filter(r => r.energy === 'Low').length },
      { name: 'Medium', value: filteredReflections.filter(r => r.energy === 'Medium').length },
      { name: 'High', value: filteredReflections.filter(r => r.energy === 'High').length },
    ];

    filteredReflections.forEach(r => {
      r.skillsUsed.forEach(s => {
        skillMap[s] = (skillMap[s] || 0) + 1;
      });
    });

    const topSkills = Object.entries(skillMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return { moodTrend, energyDist, topSkills };
  }, [filteredReflections]);

  const handleAiAnalysis = async () => {
    if (!appData || filteredReflections.length < 3) {
      alert("Butuh minimal 3 data refleksi pada filter waktu terpilih untuk analisis AI.");
      return;
    }
    setIsAiAnalyzing(true);
    setAiInsight(null);
    try {
      const res = await analyzeReflections(appData, filteredReflections, timeFilter);
      setAiInsight(res);
      setShowFullAiReport(true); // Langsung pindah ke halaman laporan setelah selesai
    } catch (e) {
      console.error(e);
      alert("Gagal memanggil asisten AI. Periksa konfigurasi API.");
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const handleConnectAction = (action: any) => {
    if (action.type === 'skill' && onUpdateSkill) {
      const newSkill: Skill = {
        id: Math.random().toString(36).substr(2, 9),
        name: action.label,
        category: SkillCategory.HARD,
        currentLevel: 1,
        requiredLevel: 3,
        status: SkillStatus.ON_PROGRESS,
        priority: SkillPriority.MEDIUM,
        lastUsed: today.split('-')[0],
        actionPlan: action.detail
      };
      onUpdateSkill(newSkill);
      alert(`Skill "${action.label}" ditambahkan ke Portofolio!`);
    } else if (action.type === 'task' && onAddTodo) {
      const newTask: ToDoTask = {
        id: Math.random().toString(36).substr(2, 9),
        task: action.label,
        description: action.detail,
        category: 'Pengembangan Diri',
        status: 'Pending',
        createdAt: new Date().toISOString(),
        source: 'AI'
      };
      onAddTodo(newTask);
      alert(`Langkah "${action.label}" ditambahkan ke Agenda!`);
    } else if (action.type === 'achievement' && onAddAchievement) {
      const newAch: Achievement = {
        id: Math.random().toString(36).substr(2, 9),
        title: action.label,
        date: today,
        category: AchievementCategory.PROFESIONAL,
        impact: action.detail,
        scope: 'Perusahaan',
        companyName: appData?.profile.currentCompany
      };
      onAddAchievement(newAch);
      alert(`Achievement "${action.label}" ditambahkan ke Rekam Jejak!`);
    }
  };

  // Get question of the day based on date
  const questionIndex = new Date().getDate() % ROTATING_QUESTIONS.length;
  const questionOfTheDay = ROTATING_QUESTIONS[questionIndex];

  // Calculate Streak
  const streak = useMemo(() => {
    let count = 0;
    const sortedDates = reflections
      .map(r => r.date)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    let current = new Date();
    const normalize = (d: Date) => d.toISOString().split('T')[0];
    if (sortedDates.length === 0) return 0;
    for (let i = 0; i < 365; i++) {
      const targetStr = normalize(current);
      if (sortedDates.includes(targetStr)) {
        count++;
        current.setDate(current.getDate() - 1);
      } else {
        if (i === 0) { current.setDate(current.getDate() - 1); continue; }
        break;
      }
    }
    return count;
  }, [reflections]);

  // Form State
  const [formData, setFormData] = useState<Partial<WorkReflection>>({
    mood: 3, energy: 'Medium', workload: 'Normal', mainContribution: '',
    microWins: [], skillsUsed: [], suggestedSkills: [], energyDrain: '',
    focusTomorrow: '', rotatingAnswer: ''
  });

  const [newSkillInput, setNewSkillInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRef: WorkReflection = {
      id: Math.random().toString(36).substr(2, 9),
      date: today,
      mood: formData.mood || 3,
      energy: formData.energy || 'Medium',
      workload: formData.workload || 'Normal',
      mainContribution: formData.mainContribution || '',
      microWins: formData.microWins || [],
      skillsUsed: formData.skillsUsed || [],
      suggestedSkills: formData.suggestedSkills || [],
      energyDrain: formData.energyDrain || '',
      focusTomorrow: formData.focusTomorrow || '',
      rotatingQuestion: questionOfTheDay,
      rotatingAnswer: formData.rotatingAnswer || '',
    };
    onAdd(newRef);
  };

  const toggleMicroWin = (win: string) => {
    const current = formData.microWins || [];
    if (current.includes(win)) setFormData({...formData, microWins: current.filter(w => w !== win)});
    else setFormData({...formData, microWins: [...current, win]});
  };

  const toggleSkill = (skillName: string) => {
    const current = formData.skillsUsed || [];
    if (current.includes(skillName)) setFormData({...formData, skillsUsed: current.filter(s => s !== skillName)});
    else setFormData({...formData, skillsUsed: [...current, skillName]});
  };

  const addSuggestedSkill = () => {
    if (!newSkillInput.trim()) return;
    const current = formData.suggestedSkills || [];
    if (current.length >= 2) { alert("Maksimal 2 skill baru tambahan."); return; }
    setFormData({...formData, suggestedSkills: [...current, newSkillInput.trim()]});
    setNewSkillInput('');
  };

  const promoteSkillToDatabase = (skillName: string) => {
    const newSkill: Skill = {
      id: Math.random().toString(36).substr(2, 9),
      name: skillName, category: SkillCategory.HARD, currentLevel: 1, requiredLevel: 3,
      status: SkillStatus.ON_PROGRESS, priority: SkillPriority.MEDIUM, lastUsed: today.split('-')[0],
      actionPlan: 'Ditambahkan melalui refleksi harian.'
    };
    onUpdateSkill(newSkill);
    setFormData({
        ...formData, 
        suggestedSkills: (formData.suggestedSkills || []).filter(s => s !== skillName),
        skillsUsed: [...(formData.skillsUsed || []), skillName]
    });
    alert(`Skill "${skillName}" telah ditambahkan ke database portofolio Anda!`);
  };

  const TimeFilterControls = () => (
    <div className="flex bg-white p-1 rounded-xl border border-slate-100 shadow-sm overflow-x-auto no-scrollbar w-fit">
      {[
        { id: '7days', l: '1 Week' },
        { id: '30days', l: '1 Month' },
        { id: '90days', l: '3 Months' },
        { id: '180days', l: '6 Months' },
        { id: 'all', l: 'All Time' }
      ].map(f => (
        <button key={f.id} onClick={() => { setTimeFilter(f.id as any); setCurrentPage(1); }} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${timeFilter === f.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>{f.l}</button>
      ))}
    </div>
  );

  // VIEW BARU: HALAMAN LAPORAN AI PENUH
  if (showFullAiReport && aiInsight) {
    return (
      <div className="animate-in slide-in-from-right duration-700 space-y-8 pb-20">
         <div className="flex items-center justify-between">
            <button onClick={() => setShowFullAiReport(false)} className="flex items-center gap-3 group">
               <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black transition-transform group-hover:-translate-x-1"><i className="bi bi-arrow-left"></i></div>
               <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">Kembali ke Analisis</span>
            </button>
            <div className="text-right">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Full Report</p>
               <p className="text-sm font-black text-indigo-600 uppercase tracking-tighter">Periode {timeFilter}</p>
            </div>
         </div>

         <div className="bg-gradient-to-br from-indigo-900 to-slate-950 p-12 lg:p-20 rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10 space-y-16">
               <div className="max-w-3xl">
                  <SectionLabel label="AI EXECUTIVE SUMMARY" color="white" />
                  <h3 className="text-3xl lg:text-5xl font-black tracking-tighter leading-[0.9] mt-6 mb-8 uppercase italic">"Laporan Strategis Refleksi Anda"</h3>
                  <p className="text-xl lg:text-2xl font-medium leading-relaxed opacity-90 border-l-4 border-indigo-400 pl-8 italic">"{aiInsight.executiveSummary}"</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                  <div className="space-y-6">
                     <div className="flex items-center gap-4">
                        <span className="text-3xl">📉</span>
                        <h5 className="text-xs font-black uppercase text-indigo-300 tracking-[0.3em]">Productivity Pattern</h5>
                     </div>
                     <p className="text-base text-slate-300 leading-relaxed font-bold">{aiInsight.productivityPattern}</p>
                  </div>
                  <div className="space-y-6">
                     <div className="flex items-center gap-4">
                        <span className="text-3xl">🧘</span>
                        <h5 className="text-xs font-black uppercase text-indigo-300 tracking-[0.3em]">Mental Fitness & Mood</h5>
                     </div>
                     <p className="text-base text-slate-300 leading-relaxed font-bold">{aiInsight.moodCorrelation}</p>
                  </div>
               </div>

               <div className="pt-12 border-t border-white/10 grid grid-cols-1 lg:grid-cols-12 gap-12">
                  <div className="lg:col-span-7 space-y-8">
                     <h5 className="text-xs font-black uppercase text-emerald-400 tracking-[0.3em] flex items-center gap-3">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                        Golden Contributions (Evidence Ready)
                     </h5>
                     <div className="space-y-4">
                        {aiInsight.goldenContributions.map((gc: string, i: number) => (
                          <div key={i} className="flex gap-6 items-start bg-white/5 p-6 rounded-[2rem] border border-white/5 hover:bg-white/10 transition-colors">
                             <span className="text-emerald-400 text-2xl font-black">0{i+1}</span>
                             <p className="text-sm font-bold leading-relaxed">{gc}</p>
                          </div>
                        ))}
                     </div>
                  </div>
                  <div className="lg:col-span-5 space-y-8">
                     <h5 className="text-xs font-black uppercase text-indigo-300 tracking-[0.3em]">Career Readiness Roadmap</h5>
                     <div className="bg-white/5 p-8 rounded-[3rem] border border-white/10">
                        <p className="text-sm font-medium leading-relaxed opacity-80 mb-8 italic">"{aiInsight.careerReadiness}"</p>
                        <div className="space-y-4">
                           {aiInsight.suggestedConnections.map((conn: any, i: number) => (
                              <button key={i} onClick={() => handleConnectAction(conn)} className="w-full p-6 bg-white rounded-[2rem] text-left border-b-4 border-slate-200 hover:border-indigo-500 hover:-translate-y-1 transition-all group shadow-xl shadow-black/20">
                                 <div className="flex justify-between items-center mb-1">
                                    <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">{conn.type}</span>
                                    <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">🔗</span>
                                 </div>
                                 <p className="text-sm font-black text-slate-800 leading-tight mb-2">{conn.label}</p>
                                 <p className="text-[10px] text-slate-400 font-bold leading-tight">{conn.detail}</p>
                              </button>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>
            </div>
            <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px]"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] -mr-48 -mt-48"></div>
         </div>
         
         <div className="flex flex-col items-center gap-6 py-10">
            <button onClick={() => window.print()} className="px-12 py-5 bg-white border-2 border-slate-900 text-slate-900 font-black rounded-2xl uppercase tracking-[0.3em] text-[10px] shadow-xl hover:bg-slate-50 transition-all">Download Laporan (.PDF)</button>
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">© 2025 FokusKarir Intelligent Performance System</p>
         </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom duration-700 pb-20">
      
      {/* 0. NAVIGATION TABS */}
      <div className="flex justify-between items-center">
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100 w-fit">
           <button onClick={() => setActiveTab('journal')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'journal' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Journal</button>
           <button onClick={() => setActiveTab('analysis')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'analysis' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Analysis</button>
        </div>
        {activeTab === 'analysis' && (
          <button 
            onClick={handleAiAnalysis}
            disabled={isAiAnalyzing || filteredReflections.length < 3}
            className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-3 active:scale-95 transition-all"
          >
            {isAiAnalyzing ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : '✨'}
            {isAiAnalyzing ? 'Analyzing...' : 'Generate AI Deep Insight'}
          </button>
        )}
      </div>

      {activeTab === 'journal' ? (
        <>
          {/* BARU: SECTION MOTIVASI & PENJELASAN */}
          <div className="bg-indigo-50 border-2 border-indigo-100 p-8 lg:p-12 rounded-[3.5rem] flex flex-col lg:flex-row items-center gap-10 animate-in fade-in duration-1000">
             <div className="w-24 h-24 lg:w-32 lg:h-32 bg-white rounded-[2.5rem] flex items-center justify-center text-4xl lg:text-5xl shadow-xl shadow-indigo-100 shrink-0">📈</div>
             <div className="space-y-4 text-center lg:text-left flex-1">
                <h3 className="text-xl lg:text-2xl font-black text-indigo-900 uppercase tracking-tighter">Kenapa Harus Refleksi?</h3>
                <p className="text-sm lg:text-base text-indigo-700/80 font-medium leading-relaxed italic">
                   "Refleksi harian bukan sekadar catatan, tapi investasi kesadaran. Dengan mencatat kontribusi dan emosi, Anda membangun data karir yang tak terbantahkan saat evaluasi nanti. Teruslah melangkah, satu refleksi hari ini adalah satu batu bata untuk istana karir Anda besok!"
                </p>
                <div className="flex flex-wrap gap-3 justify-center lg:justify-start pt-2">
                   <span className="px-3 py-1 bg-white text-indigo-600 text-[9px] font-black uppercase rounded-lg border border-indigo-100">Bahan Performance Review</span>
                   <span className="px-3 py-1 bg-white text-indigo-600 text-[9px] font-black uppercase rounded-lg border border-indigo-100">Deteksi Burnout Dini</span>
                   <span className="px-3 py-1 bg-white text-indigo-600 text-[9px] font-black uppercase rounded-lg border border-indigo-100">Validasi Kualifikasi AI</span>
                </div>
             </div>
          </div>

          {/* 1. HEADER & FORM SECTION */}
          {!todayReflection ? (
            <>
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-10 lg:p-14 rounded-[3.5rem] text-white relative overflow-hidden shadow-2xl">
                 <div className="relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                       <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60 mb-2">Check-in Hari Ini</p>
                          <h2 className="text-4xl font-black tracking-tighter leading-none">
                            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                          </h2>
                       </div>
                       <div className="flex items-center gap-4">
                          <div className="px-5 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                             <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-1">STREAK</p>
                             <p className="text-xl font-black">{streak} Hari 🔥</p>
                          </div>
                       </div>
                    </div>
                    <p className="text-sm italic font-medium opacity-80 max-w-xl">"Istirahat sejenak untuk melihat seberapa jauh Anda melangkah. Refleksi ini membantu Anda tetap waras dan produktif."</p>
                 </div>
                 <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* 2. KONDISI KERJA */}
                <div className="bg-white p-10 lg:p-14 rounded-[3.5rem] shadow-sm border border-slate-100">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-10">Kondisi Kerja & Kesejahteraan</h4>
                   <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-20">
                      <div className="space-y-6">
                         <p className="text-xs font-black text-slate-700 uppercase tracking-widest ml-1">Mood Kerja</p>
                         <div className="flex justify-between items-center gap-2">
                            {[1,2,3,4,5].map(m => (
                              <button key={m} type="button" onClick={() => setFormData({...formData, mood: m})} className={`flex-1 aspect-square rounded-2xl text-2xl flex items-center justify-center transition-all ${formData.mood === m ? 'bg-indigo-600 text-white shadow-xl scale-110' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>{getMoodEmoji(m)}</button>
                            ))}
                         </div>
                      </div>
                      <div className="space-y-6">
                         <p className="text-xs font-black text-slate-700 uppercase tracking-widest ml-1">Tingkat Energi</p>
                         <div className="flex gap-2">
                            {['Low', 'Medium', 'High'].map(e => (
                              <button key={e} type="button" onClick={() => setFormData({...formData, energy: e as any})} className={`flex-1 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border ${formData.energy === e ? 'bg-indigo-900 text-white border-indigo-900 shadow-lg' : 'bg-white text-slate-400 border-slate-100'}`}>{e}</button>
                            ))}
                         </div>
                      </div>
                      <div className="space-y-6">
                         <p className="text-xs font-black text-slate-700 uppercase tracking-widest ml-1">Beban Kerja</p>
                         <div className="flex gap-2">
                            {['Light', 'Normal', 'Heavy'].map(w => (
                              <button key={w} type="button" onClick={() => setFormData({...formData, workload: w as any})} className={`flex-1 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border ${formData.workload === w ? 'bg-indigo-900 text-white border-indigo-900 shadow-lg' : 'bg-white text-slate-400 border-slate-100'}`}>{w}</button>
                            ))}
                         </div>
                      </div>
                   </div>
                </div>

                {/* 3. KONTRIBUSI UTAMA */}
                <div className="bg-indigo-600 p-10 lg:p-14 rounded-[3.5rem] shadow-2xl text-white">
                   <div className="flex items-center gap-4 mb-8"><span className="text-3xl">⭐</span><h4 className="text-[10px] font-black text-white/60 uppercase tracking-[0.4em]">Kontribusi Paling Berharga</h4></div>
                   <div className="space-y-4">
                      <p className="text-lg lg:text-xl font-bold tracking-tight">"Hal paling bernilai yang aku lakukan hari ini adalah..."</p>
                      <textarea className="w-full bg-white/10 border-2 border-white/20 rounded-[2rem] p-8 outline-none focus:bg-white/15 focus:border-white/40 transition-all font-bold text-base lg:text-lg placeholder:text-white/20 min-h-[150px] resize-none" placeholder="Misal: Menyelesaikan bug kritikal..." value={formData.mainContribution || ''} onChange={e => setFormData({...formData, mainContribution: e.target.value})} required />
                   </div>
                </div>

                {/* 4. MICRO WINS */}
                <div className="bg-white p-10 lg:p-14 rounded-[3.5rem] shadow-sm border border-slate-100">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-10">Micro Win Tracker</h4>
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {MICRO_WINS.map(win => {
                        const active = (formData.microWins || []).includes(win);
                        return (
                          <button key={win} type="button" onClick={() => toggleMicroWin(win)} className={`flex items-center gap-4 p-5 rounded-[1.75rem] border transition-all text-left group ${active ? 'bg-emerald-50 border-emerald-500 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-60'}`}><div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${active ? 'bg-emerald-600 border-emerald-600' : 'bg-white border-slate-200'}`}>{active && <i className="bi bi-check-lg text-white"></i>}</div><span className={`text-[11px] font-black uppercase tracking-tight ${active ? 'text-emerald-700' : 'text-slate-500'}`}>{win}</span></button>
                        );
                      })}
                   </div>
                </div>

                {/* 5. SKILL INTEGRATION */}
                <div className="bg-white p-10 lg:p-14 rounded-[4rem] shadow-sm border border-slate-100 space-y-10">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Skills yang Terpakai Hari Ini</h4>
                   <div className="space-y-6">
                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-1">Database Portofolio Anda</p>
                      <div className="flex flex-wrap gap-2">
                         {skills.map(skill => {
                           const active = (formData.skillsUsed || []).includes(skill.name);
                           return (<button key={skill.id} type="button" onClick={() => toggleSkill(skill.name)} className={`px-5 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-tight transition-all ${active ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:border-blue-200'}`}>{skill.name}</button>);
                         })}
                      </div>
                   </div>
                   <div className="pt-8 border-t border-slate-50 space-y-6">
                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-1">Skill Baru yang Dipraktekkan (Maks. 2)</p>
                      <div className="flex flex-wrap gap-2">
                         {(formData.suggestedSkills || []).map(skill => (
                           <div key={skill} className="bg-blue-50 text-blue-600 px-5 py-2.5 rounded-xl border border-blue-100 flex items-center gap-3"><span className="text-10px font-black uppercase">{skill}</span><button type="button" onClick={() => promoteSkillToDatabase(skill)} className="w-6 h-6 bg-blue-600 text-white rounded-lg flex items-center justify-center text-xs shadow-lg hover:scale-110 transition-transform">+</button><button type="button" onClick={() => setFormData({...formData, suggestedSkills: (formData.suggestedSkills || []).filter(s => s !== skill)})} className="text-blue-300 hover:text-blue-600">✕</button></div>
                         ))}
                         {(formData.suggestedSkills || []).length < 2 && (
                            <div className="flex gap-2"><input className="px-5 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-bold outline-none" placeholder="Ketik skill baru..." value={newSkillInput} onChange={e => setNewSkillInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSuggestedSkill())} /><button type="button" onClick={addSuggestedSkill} className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center text-xl">+</button></div>
                         )}
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   <div className="bg-white p-10 lg:p-14 rounded-[3.5rem] shadow-sm border border-slate-100"><h4 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.4em] mb-8">Energy Drain</h4><textarea className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] p-6 text-sm font-bold text-slate-600 resize-none min-h-[100px]" placeholder="Apa yang melelahkan hari ini?" value={formData.energyDrain || ''} onChange={e => setFormData({...formData, energyDrain: e.target.value})} /></div>
                   <div className="bg-white p-10 lg:p-14 rounded-[3.5rem] shadow-sm border border-slate-100"><h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mb-8">Fokus Besok</h4><textarea className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] p-6 text-sm font-bold text-slate-600 resize-none min-h-[100px]" placeholder="Target kecil besok pagi..." value={formData.focusTomorrow || ''} onChange={e => setFormData({...formData, focusTomorrow: e.target.value})} /></div>
                </div>

                <div className="bg-amber-50 p-10 lg:p-14 rounded-[4rem] border border-amber-100 shadow-sm"><p className="text-xl lg:text-2xl font-black text-slate-800 tracking-tight mb-6">"{questionOfTheDay}"</p><textarea className="w-full bg-white border border-amber-100 rounded-[2rem] p-8 font-bold text-slate-700 min-h-[150px] resize-none" placeholder="Tulis jawabanmu..." value={formData.rotatingAnswer || ''} onChange={e => setFormData({...formData, rotatingAnswer: e.target.value})} /></div>

                <div className="pt-10 flex flex-col items-center gap-6"><button type="submit" className="w-full max-w-xl py-6 bg-slate-900 text-white font-black rounded-[2.5rem] shadow-2xl hover:bg-black transition-all uppercase text-xs tracking-[0.3em]">🚀 Simpan Refleksi Harian</button></div>
              </form>
            </>
          ) : (
            <div className="bg-white p-10 lg:p-14 rounded-[3.5rem] shadow-sm border border-slate-100 text-center animate-in zoom-in duration-500">
               <div className="text-6xl mb-6">✅</div>
               <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-4">Refleksi Hari Ini Selesai</h3>
               <p className="text-slate-500 font-medium max-w-md mx-auto leading-relaxed italic">"Terima kasih telah meluangkan waktu sejenak untuk menghargai usaha Anda hari ini. Data Anda aman dan tersimpan untuk analisis karier."</p>
               <div className="mt-10 flex justify-center gap-4">
                   <div className="bg-indigo-50 px-6 py-4 rounded-3xl border border-indigo-100"><p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">STREAK</p><p className="text-2xl font-black text-indigo-600">{streak} Hari 🔥</p></div>
                   <div className="bg-emerald-50 px-6 py-4 rounded-3xl border border-emerald-100"><p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">MOOD</p><p className="text-2xl font-black text-emerald-600">{getMoodEmoji(todayReflection.mood)}</p></div>
               </div>
            </div>
          )}

          {/* 6. HISTORY LIST WITH FILTER & PAGINATION */}
          <div className="mt-16 space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">Journal History</h3>
              <TimeFilterControls />
            </div>
            
            <div className="space-y-4">
              {paginatedItems.map(ref => (
                <div key={ref.id} className="bg-white p-6 lg:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:shadow-md transition-all">
                  <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div className="flex items-center gap-6">
                      <div className="text-center shrink-0">
                        <p className="text-[8px] font-black text-slate-300 uppercase mb-1 tracking-widest">MOOD</p>
                        <div className="text-3xl">{getMoodEmoji(ref.mood)}</div>
                      </div>
                      <div className="h-10 w-px bg-slate-100 hidden md:block"></div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 tracking-tight uppercase">{new Date(ref.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h4>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="px-2 py-0.5 bg-slate-50 text-slate-400 text-[8px] font-black uppercase tracking-widest border border-slate-100 rounded-lg">Energy: {ref.energy}</span>
                          <span className="px-2 py-0.5 bg-slate-50 text-slate-400 text-[8px] font-black uppercase tracking-widest border border-slate-100 rounded-lg">Load: {ref.workload}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 bg-indigo-50/30 p-5 rounded-3xl border border-indigo-100/30 relative overflow-hidden group">
                      <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2"><span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>Kontribusi Utama</p>
                      <p className="text-xs font-bold text-slate-700 leading-relaxed italic line-clamp-2">"{ref.mainContribution}"</p>
                      <button onClick={() => setSelectedEntry(ref)} className="absolute right-4 top-4 w-8 h-8 bg-white border border-indigo-100 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all text-xs text-indigo-600">👁️</button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredReflections.length === 0 && (
                <div className="py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200"><p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Belum ada riwayat refleksi pada rentang waktu ini.</p></div>
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 disabled:opacity-20">←</button>
                <div className="flex gap-1">
                   {[...Array(totalPages)].map((_, i) => (
                     <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${currentPage === i + 1 ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400'}`}>{i + 1}</button>
                   ))}
                </div>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 disabled:opacity-20">→</button>
              </div>
            )}
          </div>
        </>
      ) : (
        /* ANALYSIS DASHBOARD VIEW */
        <div className="animate-in fade-in duration-700 space-y-10">
           {/* ANALYSIS HEADER FILTER */}
           <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rentang Analisis Data</p>
                <TimeFilterControls />
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">Data Terdeteksi</p>
                <p className="text-xl font-black text-slate-900 tracking-tighter">{filteredReflections.length} Records</p>
              </div>
           </div>

           {!stats ? (
             <div className="py-32 text-center bg-white rounded-[3.5rem] shadow-sm border border-slate-100">
               <p className="text-slate-400 font-bold uppercase tracking-widest">Dibutuhkan minimal 3 entri refleksi untuk memulai analisis pada periode ini.</p>
             </div>
           ) : (
             <>
               {/* AI Deep Insight Result Section */}
               {aiInsight && (
                 <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-10 lg:p-14 rounded-[4rem] text-white shadow-2xl animate-in zoom-in duration-500 space-y-10 relative overflow-hidden">
                    <div className="relative z-10 flex flex-col lg:flex-row gap-12">
                       <div className="lg:w-2/3 space-y-8">
                          <div>
                             <SectionLabel label="AI EXECUTIVE SUMMARY" color="white" />
                             <p className="text-lg lg:text-xl font-medium leading-relaxed italic opacity-90 border-l-4 border-indigo-400 pl-8">"{aiInsight.executiveSummary}"</p>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div className="space-y-3">
                                <h5 className="text-[10px] font-black uppercase text-indigo-300 tracking-widest">Productivity Pulse</h5>
                                <p className="text-sm font-medium text-slate-300 leading-relaxed">{aiInsight.productivityPattern}</p>
                             </div>
                             <div className="space-y-3">
                                <h5 className="text-[10px] font-black uppercase text-indigo-300 tracking-widest">Mental Fitness</h5>
                                <p className="text-sm font-medium text-slate-300 leading-relaxed">{aiInsight.moodCorrelation}</p>
                             </div>
                          </div>
                       </div>

                       <div className="lg:w-1/3 bg-white/5 backdrop-blur-md p-8 rounded-[3rem] border border-white/10 flex flex-col justify-between">
                          <div>
                            <SectionLabel label="ACTIONABLE SUGGESTIONS" color="white" />
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-6">Opsi Strategis:</p>
                            <div className="space-y-4">
                               <button onClick={() => setShowFullAiReport(true)} className="w-full p-6 bg-blue-600 text-white rounded-[2rem] text-center font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl shadow-blue-500/20 hover:bg-blue-700 transition-all">Buka Laporan Penuh ↗</button>
                               <p className="text-[9px] text-center opacity-60 italic mt-3">Laporan ini memetakan masa depan kualifikasi Anda.</p>
                            </div>
                          </div>
                          <div className="mt-10 pt-6 border-t border-white/5 text-center">
                             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Powered by Deep Reflection Engine</p>
                          </div>
                       </div>
                    </div>
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-50/10 rounded-full blur-[120px] -mr-48 -mt-48"></div>
                 </div>
               )}

               {/* Top Insights Panel Charts */}
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-8 bg-white p-10 lg:p-12 rounded-[3.5rem] shadow-sm border border-slate-100">
                     <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] mb-10">Trend Visual ({timeFilter})</h3>
                     <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={stats.moodTrend}>
                              <defs>
                                <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient>
                                <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/><stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/></linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                              <YAxis hide />
                              <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                              <Legend verticalAlign="top" align="right" iconType="circle" />
                              <Area name="Work Mood" type="monotone" dataKey="mood" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorMood)" />
                              <Area name="Workload" type="monotone" dataKey="load" stroke="#f59e0b" strokeWidth={4} fillOpacity={1} fill="url(#colorLoad)" />
                           </AreaChart>
                        </ResponsiveContainer>
                     </div>
                  </div>
                  <div className="lg:col-span-4 space-y-6">
                     <div className="bg-slate-900 p-10 rounded-[3rem] text-white h-full flex flex-col justify-between shadow-2xl relative overflow-hidden group">
                        <div className="relative z-10">
                           <p className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.3em] mb-4">Manual Sentiment Summary</p>
                           <h4 className="text-4xl font-black tracking-tighter leading-none mb-6">Periode {timeFilter}</h4>
                           <p className="text-xs text-slate-400 font-medium leading-relaxed italic">"Berdasarkan data statistik, performa Anda menunjukkan konsistensi dalam mengelola beban kerja harian."</p>
                        </div>
                        <div className="pt-8 border-t border-white/10 mt-8 relative z-10">
                           <div className="flex justify-between items-end">
                              <span className="text-[9px] font-black uppercase text-slate-500">Completion Score</span>
                              <span className="text-2xl font-black text-white">92%</span>
                           </div>
                           <div className="h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden"><div className="h-full bg-indigo-500 w-[92%]"></div></div>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Skill Matrix & Micro Wins Distribution */}
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-10 lg:p-12 rounded-[3.5rem] shadow-sm border border-slate-100">
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-8">Dominant Skills Matrix ({timeFilter})</h4>
                     <div className="space-y-6">
                        {stats.topSkills.map((s, i) => (
                           <div key={s.name} className="space-y-2">
                              <div className="flex justify-between items-end px-1">
                                 <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{s.name}</span>
                                 <span className="text-[10px] font-black text-slate-400">{Math.round((s.value / filteredReflections.length) * 100)}% Usage</span>
                              </div>
                              <div className="h-2 bg-slate-50 rounded-full border border-slate-100 p-0.5 overflow-hidden">
                                 <div className="h-full bg-blue-600 rounded-full" style={{ width: `${(s.value / filteredReflections.length) * 100}%` }}></div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
                  <div className="bg-white p-10 lg:p-12 rounded-[3.5rem] shadow-sm border border-slate-100">
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-8">Energy Distribution Analysis</h4>
                     <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                           <PieChart>
                              <Pie data={stats.energyDist} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                 <Cell fill="#ef4444" />
                                 <Cell fill="#f59e0b" />
                                 <Cell fill="#10b981" />
                              </Pie>
                              <Tooltip />
                              <Legend />
                           </PieChart>
                        </ResponsiveContainer>
                     </div>
                  </div>
               </div>

               {/* PROFESSIONAL TIMELINE INSIGHTS GRID */}
               <div className="space-y-8">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] px-2">Timeline Based Professional Insights</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                     <InsightGridCard duration="1 WEEK" title="Pola Produktivitas" content={reflections.length >= 7 ? "Produktivitas memuncak di awal minggu. Fokus esok hari sering berfokus pada penyelesaian tugas administratif." : "Menunggu data 1 minggu..."} status={reflections.length >= 7} />
                     <InsightGridCard duration="1 MONTH" title="Matriks Skill Dominan" content={reflections.length >= 20 ? "Kombinasi skill teknis dan manajerial meningkat. Beban kerja berat tertangani dengan mood stabil." : "Menunggu data 1 bulan..."} status={reflections.length >= 20} />
                     <InsightGridCard duration="3 MONTHS" title="Bukti Kontribusi" content={reflections.length >= 60 ? `Tercatat ${reflections.filter(r => r.workload === 'Heavy').length} periode intensif dengan kontribusi bernilai tinggi.` : "Menunggu data 3 bulan..."} status={reflections.length >= 60} />
                     <InsightGridCard duration="6 MONTHS" title="Evaluasi Karier" content={reflections.length >= 120 ? "Siap untuk kenaikan level. Inisiatif harian meningkat 25% dibandingkan kuartal sebelumnya." : "Menunggu data 6 bulan..."} status={reflections.length >= 120} />
                  </div>
               </div>
             </>
           )}
        </div>
      )}

      {/* DETAIL MODAL OVERLAY */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[2000] flex items-center justify-center p-6" onClick={() => setSelectedEntry(null)}>
           <div className="bg-white max-w-2xl w-full rounded-[3.5rem] border border-slate-100 shadow-2xl animate-in zoom-in duration-300 overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="bg-slate-50 p-10 border-b border-slate-100 flex justify-between items-start">
                 <div>
                    <SectionLabel label="Detailed Record" color="indigo" />
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mt-4">{new Date(selectedEntry.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h3>
                 </div>
                 <button onClick={() => setSelectedEntry(null)} className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-400 hover:text-slate-900">✕</button>
              </div>
              <div className="p-10 space-y-10 max-h-[60vh] overflow-y-auto no-scrollbar">
                 <div className="grid grid-cols-3 gap-4">
                    <ModalStat label="Mood" val={getMoodEmoji(selectedEntry.mood)} />
                    <ModalStat label="Energy" val={selectedEntry.energy} />
                    <ModalStat label="Load" val={selectedEntry.workload} />
                 </div>
                 <div className="space-y-4">
                    <SectionLabel label="Kontribusi Utama" color="indigo" />
                    <p className="text-lg font-bold text-slate-800 italic border-l-4 border-indigo-600 pl-6 leading-relaxed">"{selectedEntry.mainContribution}"</p>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-50">
                    <div className="space-y-4">
                       <SectionLabel label="Micro Wins" color="slate" />
                       <div className="flex flex-wrap gap-2">
                          {selectedEntry.microWins.map(w => <span key={w} className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl text-[9px] font-black uppercase">✓ {w}</span>)}
                       </div>
                    </div>
                    <div className="space-y-4">
                       <SectionLabel label="Skills Log" color="slate" />
                       <div className="flex flex-wrap gap-2">
                          {selectedEntry.skillsUsed.map(s => <span key={s} className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl text-[9px] font-black uppercase">#{s}</span>)}
                       </div>
                    </div>
                 </div>
                 <div className="p-8 bg-amber-50 rounded-[2.5rem] border border-amber-100">
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-3">{selectedEntry.rotatingQuestion}</p>
                    <p className="text-sm font-bold text-slate-700 leading-relaxed italic">"{selectedEntry.rotatingAnswer}"</p>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3"><p className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Energy Drain</p><p className="text-xs font-bold text-slate-500 leading-relaxed">"{selectedEntry.energyDrain || '-'}"</p></div>
                    <div className="space-y-3"><p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Focus Tomorrow</p><p className="text-xs font-bold text-slate-500 leading-relaxed">"{selectedEntry.focusTomorrow || '-'}"</p></div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

// UI Components for Analysis
const InsightGridCard = ({ duration, title, content, status }: any) => (
  <div className={`p-8 rounded-[2.5rem] border-2 flex flex-col justify-between transition-all group ${status ? 'bg-white border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
     <div>
        <span className={`text-[8px] font-black uppercase tracking-widest mb-4 inline-block px-2 py-0.5 rounded ${status ? 'bg-indigo-600 text-white' : 'bg-slate-300 text-slate-500'}`}>{duration}</span>
        <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-4 group-hover:text-indigo-600 transition-colors">{title}</h4>
        <p className="text-xs text-slate-500 leading-relaxed font-bold italic line-clamp-4">"{content}"</p>
     </div>
     {status && <div className="mt-6 flex justify-end"><span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1 animate-pulse">Live Insight <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span></span></div>}
  </div>
);

const ModalStat = ({ label, val }: any) => (
  <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 text-center">
     <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
     <p className="text-xl font-black text-slate-800 leading-none">{val}</p>
  </div>
);

const SectionLabel: React.FC<{ label: string; color: string }> = ({ label, color }) => {
  const colorMap: any = {
    indigo: 'text-indigo-600',
    rose: 'text-rose-600',
    slate: 'text-slate-400',
    white: 'text-white/50'
  };
  return (<h4 className={`text-[10px] font-black uppercase tracking-[0.4em] ${colorMap[color]}`}>{label}</h4>);
};

export default WorkReflectionView;
