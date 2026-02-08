import React, { useState, useMemo, useEffect } from 'react';
import { AppData, ProjectStatus, TrainingStatus, AiInsightRecord, Achievement, AchievementCategory } from '../types';
import { generateCareerInsight } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

interface AiInsightActivityProps {
  data: AppData;
  onUpdateInsights?: (insights: AiInsightRecord[]) => void;
  onAddAchievement?: (achievement: Achievement) => void;
}

const AiInsightActivity: React.FC<AiInsightActivityProps> = ({ data, onUpdateInsights, onAddAchievement }) => {
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [audience, setAudience] = useState<'self' | 'supervisor'>('self');
  const [selectedContexts, setSelectedContexts] = useState<string[]>(['Perusahaan']);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [aiStatusMessage, setAiStatusMessage] = useState('');
  const [insightResult, setInsightResult] = useState<any>(null);
  const [viewingHistoryId, setViewingHistoryId] = useState<string | null>(null);
  const [addedAchievementIds, setAddedAchievementIds] = useState<Set<number>>(new Set());

  // Metadata terkunci untuk tampilan laporan
  const [lockedMetadata, setLockedMetadata] = useState<{ period: string, audience: string, dateRange?: string } | null>(null);

  const getWeekOfMonth = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return Math.ceil((date.getDate() + firstDay) / 7);
  };

  const availableDatesMap = useMemo(() => {
    const map: Record<string, Record<string, Set<string>>> = {};
    const relevantLogs = data.dailyReports?.filter(l => selectedContexts.includes(l.context)) || [];
    
    relevantLogs.forEach(log => {
      const d = new Date(log.date);
      const y = d.getFullYear().toString();
      const m = d.getMonth().toString();
      const w = getWeekOfMonth(d).toString();
      
      if (!map[y]) map[y] = {};
      if (!map[y][m]) map[y][m] = new Set();
      map[y][m].add(w);
    });
    
    return map;
  }, [data.dailyReports, selectedContexts]);

  const availableYears = useMemo(() => Object.keys(availableDatesMap).sort().reverse(), [availableDatesMap]);
  const [selectedYear, setSelectedYear] = useState(availableYears[0] || "");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedWeek, setSelectedWeek] = useState("");

  const monthsList = [
    {v: "0", l: "Januari"}, {v: "1", l: "Februari"}, {v: "2", l: "Maret"}, 
    {v: "3", l: "April"}, {v: "4", l: "Mei"}, {v: "5", l: "Juni"}, 
    {v: "6", l: "Juli"}, {v: "7", l: "Agustus"}, {v: "8", l: "September"}, 
    {v: "9", l: "Oktober"}, {v: "10", l: "November"}, {v: "11", l: "Desember"}
  ];

  const availableMonths = useMemo(() => {
    if (!selectedYear || !availableDatesMap[selectedYear]) return [];
    return Object.keys(availableDatesMap[selectedYear]).sort((a,b) => parseInt(a) - parseInt(b));
  }, [availableDatesMap, selectedYear]);

  const availableWeeks = useMemo(() => {
    if (!selectedYear || !selectedMonth || !availableDatesMap[selectedYear][selectedMonth]) return [];
    return Array.from(availableDatesMap[selectedYear][selectedMonth]).sort();
  }, [availableDatesMap, selectedYear, selectedMonth]);

  useEffect(() => {
    if (audience === 'supervisor') {
      setSelectedContexts(['Perusahaan']);
    }
  }, [audience]);

  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) setSelectedYear(availableYears[0]);
  }, [availableYears]);

  useEffect(() => {
    if (availableMonths.length > 0 && !availableMonths.includes(selectedMonth)) setSelectedMonth(availableMonths[availableMonths.length - 1]);
  }, [availableMonths]);

  useEffect(() => {
    if (availableWeeks.length > 0 && !availableWeeks.includes(selectedWeek)) setSelectedWeek(availableWeeks[0]);
  }, [availableWeeks]);

  const insights = useMemo(() => data.aiInsights || [], [data.aiInsights]);

  const filteredLogsForAi = useMemo(() => {
    return data.dailyReports?.filter(log => {
      const d = new Date(log.date);
      const isContextMatch = selectedContexts.includes(log.context);
      const isYearMatch = d.getFullYear().toString() === selectedYear;
      const isMonthMatch = d.getMonth().toString() === selectedMonth;
      if (!isContextMatch || !isYearMatch || !isMonthMatch) return false;
      if (period === 'weekly') return getWeekOfMonth(d).toString() === selectedWeek;
      return true;
    }) || [];
  }, [data.dailyReports, selectedYear, selectedMonth, selectedWeek, period, selectedContexts]);

  const taskStats = useMemo(() => {
    const isSupervisorMode = (lockedMetadata?.audience || audience).includes('SUPERVISOR');
    const filteredProjects = data.personalProjects?.filter(p => !isSupervisorMode) || [];
    
    const selesai = filteredLogsForAi.length; 
    const proses = filteredProjects.filter(p => p.status === ProjectStatus.PROSES).length;
    const tertunda = data.trainings?.filter(t => t.status === TrainingStatus.PLANNED).length || 0;
    return { selesai, proses, tertunda };
  }, [filteredLogsForAi, data, audience, lockedMetadata]);

  const chartData = [
    { name: 'Selesai', value: taskStats.selesai, color: '#10b981' },
    { name: 'Proses', value: taskStats.proses, color: '#3b82f6' },
    { name: 'Tertunda', value: taskStats.tertunda, color: '#f59e0b' },
  ];

  const handleGenerate = async () => {
    if (filteredLogsForAi.length === 0) {
      alert("Tidak ada data log aktivitas pada periode waktu yang dipilih.");
      return;
    }

    setIsGenerating(true);
    setProgress(5);
    setAiStatusMessage('Menginisialisasi Protokol...');
    setInsightResult(null);
    setViewingHistoryId(null);
    setAddedAchievementIds(new Set());
    
    const messages = [
      "Menginisialisasi Protokol...",
      "Menghubungkan ke Gateway AI...",
      "Memindai Log Aktivitas...",
      "Menganalisis Performa...",
      "Mendeteksi Pencapaian...",
      "Menyusun Ringkasan...",
      "Sinkronisasi Insight...",
      "Finalisasi Laporan..."
    ];

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        let next;
        if (prev < 70) {
          next = prev + Math.random() * 8;
        } else if (prev < 90) {
          next = prev + Math.random() * 3;
        } else if (prev < 98) {
          next = prev + Math.random() * 0.5;
        } else {
          next = 99.2;
        }
        
        const msgIndex = Math.min(Math.floor((next / 100) * messages.length), messages.length - 1);
        setAiStatusMessage(messages[msgIndex]);
        return next;
      });
    }, 1200);

    try {
      const filteredData: AppData = { ...data, dailyReports: filteredLogsForAi };
      const result = await generateCareerInsight(filteredData, audience, period, selectedContexts);
      
      clearInterval(progressInterval);

      if (result) {
        setProgress(100);
        setAiStatusMessage('Analisis Selesai!');
        
        const monthLabel = monthsList.find(m => m.v === selectedMonth)?.l || "";
        const label = period === 'weekly' ? `${monthLabel} ${selectedYear} - M${selectedWeek}` : `${monthLabel} ${selectedYear}`;

        const newRecord: AiInsightRecord = {
          id: Math.random().toString(36).substr(2, 9),
          date: new Date().toISOString(),
          label, period, audience, contexts: selectedContexts, result
        };

        if (onUpdateInsights) onUpdateInsights([newRecord, ...insights]);

        setTimeout(() => {
          setInsightResult(result);
          setLockedMetadata({ 
            period: period === 'weekly' ? 'WEEKLY REPORT' : 'MONTHLY REPORT', 
            audience: `AUDIENCE: ${audience.toUpperCase()}`,
            dateRange: `PERIODE: ${new Date(result.startDate).toLocaleDateString('id-ID', {day:'2-digit', month:'short'})} - ${new Date(result.endDate).toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric'})}`
          });
          setIsGenerating(false);
          setAiStatusMessage('');
          setProgress(0);
        }, 800);
      } else {
        throw new Error("AI Gagal mengembalikan data. Sistem akan mencoba kembali.");
      }
    } catch (e: any) {
      clearInterval(progressInterval);
      setIsGenerating(false);
      setAiStatusMessage('');
      setProgress(0);
      console.error("Generate Insight Error:", e);
      alert(e.message || "Gagal generate insight. Pastikan koneksi internet lancar.");
    }
  };

  const handleViewHistory = (item: AiInsightRecord) => {
    setInsightResult(item.result);
    setViewingHistoryId(item.id);
    setAddedAchievementIds(new Set());
    setLockedMetadata({
      period: item.period === 'weekly' ? 'WEEKLY REPORT' : 'MONTHLY REPORT',
      audience: `AUDIENCE: ${item.audience.toUpperCase()}`,
      dateRange: item.result?.startDate ? `PERIODE: ${new Date(item.result.startDate).toLocaleDateString('id-ID', {day:'2-digit', month:'short'})} - ${new Date(item.result.endDate).toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric'})}` : undefined
    });
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  const handleAddAchievement = (ach: any, index: number) => {
    if (!onAddAchievement) return;
    
    const newAchievement: Achievement = {
      id: Math.random().toString(36).substr(2, 9),
      title: ach.title,
      date: new Date().toISOString().split('T')[0],
      category: ach.category as AchievementCategory,
      impact: ach.impact,
      scope: ach.scope as 'Perusahaan' | 'Personal',
      companyName: ach.scope === 'Perusahaan' ? data.profile.currentCompany : ''
    };

    onAddAchievement(newAchievement);
    setAddedAchievementIds(prev => new Set(Array.from(prev).concat(index)));
  };

  const ContextCheckbox = ({ label, active, onClick }: any) => (
    <button onClick={onClick} className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${active ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-60 hover:opacity-100'}`}>
       <span className={`text-[10px] font-black uppercase tracking-widest ${active ? 'text-indigo-600' : 'text-slate-400'}`}>{label}</span>
       <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${active ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-200'}`}>{active && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}</div>
    </button>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">AI Insight Activity</h2>
          <p className="text-slate-500 font-medium italic">"Resume performa cerdas untuk refleksi diri dan bukti kontribusi."</p>
        </div>
        <div className="flex flex-col items-center md:items-end gap-2 w-full md:w-auto">
          <button 
            onClick={handleGenerate} 
            disabled={isGenerating || availableYears.length === 0} 
            className={`px-8 py-3 font-black rounded-2xl shadow-xl transition-all text-[10px] uppercase tracking-widest min-w-[220px] ${isGenerating ? 'bg-slate-400 text-white cursor-wait' : 'bg-slate-900 text-white hover:bg-black'}`}
          >
            {isGenerating ? `LOADING ${Math.round(progress)}%` : '🚀 Generate Insight'}
          </button>
          {isGenerating && (
            <p className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.2em] animate-pulse text-center md:text-right px-2">
              {aiStatusMessage}
            </p>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Pilih Konteks Data</p>
            <div className="space-y-3">
               <ContextCheckbox label="Perusahaan (Kantor)" active={selectedContexts.includes('Perusahaan')} onClick={() => audience !== 'supervisor' && setSelectedContexts(p => p.includes('Perusahaan') ? p.filter(c => c !== 'Perusahaan') : [...p, 'Perusahaan'])} />
               <ContextCheckbox label="Proyek Personal" active={selectedContexts.includes('Personal')} onClick={() => audience !== 'supervisor' && setSelectedContexts(p => p.includes('Personal') ? p.filter(c => c !== 'Personal') : [...p, 'Personal'])} />
               <ContextCheckbox label="Sampingan / Freelance" active={selectedContexts.includes('Sampingan')} onClick={() => audience !== 'supervisor' && setSelectedContexts(p => p.includes('Sampingan') ? p.filter(c => c !== 'Sampingan') : [...p, 'Sampingan'])} />
            </div>
            {audience === 'supervisor' && <p className="text-[8px] text-rose-500 font-bold uppercase mt-3 px-1">* Konteks dikunci untuk laporan atasan</p>}
          </div>
        </div>

        <div className="lg:col-span-8 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Audiens Laporan</p>
                <div className="flex bg-slate-100 p-1 rounded-2xl">
                  <button onClick={() => setAudience('self')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${audience === 'self' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Diri Sendiri</button>
                  <button onClick={() => setAudience('supervisor')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${audience === 'supervisor' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Atasan</button>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Periode Ringkasan</p>
                <div className="flex bg-slate-100 p-1 rounded-2xl">
                  <button onClick={() => setPeriod('weekly')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${period === 'weekly' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Mingguan</button>
                  <button onClick={() => setPeriod('monthly')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${period === 'monthly' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Bulanan</button>
                </div>
              </div>
           </div>

           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Konfigurasi Waktu Analisis</p>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Tahun</label>
                <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 font-bold text-xs outline-none">{availableYears.map(y => <option key={y} value={y}>{y}</option>)}</select>
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Bulan</label>
                <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 font-bold text-xs outline-none">{availableMonths.map(m => <option key={m} value={m}>{monthsList.find(ml => ml.v === m)?.l}</option>)}</select>
              </div>
              {period === 'weekly' && (
                <div className="space-y-1 animate-in slide-in-from-left-2">
                  <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Minggu</label>
                  <select value={selectedWeek} onChange={e => setSelectedWeek(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 font-bold text-xs outline-none">{availableWeeks.map(w => <option key={w} value={w}>Minggu {w}</option>)}</select>
                </div>
              )}
           </div>
        </div>
      </div>

      <div className="bg-[#0f172a] p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
         <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-center items-center">
            <div className="space-y-2">
               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Tugas Selesai</p>
               <p className="text-6xl font-black text-[#10b981] tracking-tighter">{taskStats.selesai}</p>
            </div>
            <div className="border-y md:border-y-0 md:border-x border-white/10 py-6 md:py-0 space-y-2">
               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Dalam Proses</p>
               <p className="text-6xl font-black text-[#3b82f6] tracking-tighter">{taskStats.proses}</p>
            </div>
            <div className="space-y-2">
               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Tertunda/Plan</p>
               <p className="text-6xl font-black text-[#f59e0b] tracking-tighter">{taskStats.tertunda}</p>
            </div>
         </div>
      </div>

      {insightResult && (
        <div className="animate-in zoom-in duration-500 space-y-10">
          <div className="bg-white p-10 lg:p-14 rounded-[4rem] shadow-2xl border border-slate-100">
            <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-8">
               <div className="space-y-4">
                  <h3 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none break-words">{insightResult.title}</h3>
                  <div className="flex flex-wrap gap-3">
                     <span className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest">{lockedMetadata?.period}</span>
                     <span className="px-4 py-1.5 bg-slate-900 text-white rounded-full text-[9px] font-black uppercase tracking-widest">{lockedMetadata?.audience}</span>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{lockedMetadata?.dateRange}</p>
               </div>
               <div className="hidden md:flex w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2.5rem] items-center justify-center text-3xl shrink-0">✨</div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-16">
              <div className="lg:col-span-7 bg-indigo-50/30 p-10 rounded-[3rem] border border-indigo-100 flex flex-col justify-center">
                 <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-6">Executive Summary</p>
                 <p className="text-[15px] text-slate-700 italic font-medium leading-relaxed">"{insightResult.summary || 'AI sedang menyusun ringkasan strategis berdasarkan aktivitas Anda...'}"</p>
              </div>
              <div className="lg:col-span-5 bg-slate-50/50 p-8 rounded-[3rem] border border-slate-100">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 text-center">Snapshot Overview</p>
                 <div className="w-full h-48">
                    <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={chartData} margin={{ top: 30, right: 10, left: 10, bottom: 5 }}>
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} />
                          <YAxis hide />
                          <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={40}>
                             {chartData.map((e, i) => <Cell key={i} fill={e.color} />)}
                             <LabelList dataKey="value" position="top" style={{ fill: '#64748b', fontSize: 14, fontWeight: 900 }} />
                          </Bar>
                       </BarChart>
                    </ResponsiveContainer>
                 </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-16">
               {insightResult.sections?.map((section: any, i: number) => (
                 <div key={i} className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] border-b pb-4">{section.label}</h4>
                    <div className="text-[14px] text-slate-600 leading-relaxed font-medium whitespace-pre-line">
                       {section.content}
                    </div>
                 </div>
               ))}
            </div>

            {/* NEW SECTION: AI Detected Achievements */}
            {insightResult.detectedAchievements && insightResult.detectedAchievements.length > 0 && (
              <div className="mt-20 pt-10 border-t border-slate-100">
                 <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.5em] mb-8">Pencapaian (Achievements) Terdeteksi</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {insightResult.detectedAchievements?.map((ach: any, idx: number) => (
                      <div key={idx} className="p-8 bg-emerald-50/30 rounded-[3rem] border border-emerald-100 flex flex-col justify-between transition-all hover:shadow-lg">
                         <div>
                            <div className="flex justify-between items-start mb-4">
                               <h5 className="text-base font-black text-slate-800 leading-snug uppercase tracking-tight">{ach.title}</h5>
                               <span className="px-3 py-1 bg-white text-emerald-600 text-[8px] font-black uppercase tracking-widest rounded-full border border-emerald-100">{ach.category}</span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium italic leading-relaxed mb-6">"{ach.impact}"</p>
                         </div>
                         <button 
                           onClick={() => handleAddAchievement(ach, idx)}
                           disabled={addedAchievementIds.has(idx)}
                           className={`w-full py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all ${
                             addedAchievementIds.has(idx) 
                               ? 'bg-emerald-500 text-white shadow-inner cursor-default' 
                               : 'bg-slate-900 text-white hover:bg-black shadow-xl'
                           }`}
                         >
                           {addedAchievementIds.has(idx) ? '✓ Berhasil Ditambahkan' : 'Tambahkan ke Achievement'}
                         </button>
                      </div>
                    ))}
                 </div>
              </div>
            )}

            <div className="mt-20 pt-10 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-8">
                {insightResult.metrics?.map((m: any, i: number) => (
                  <div key={i} className="bg-slate-50/50 p-6 rounded-[2rem] text-center md:text-left transition-all hover:shadow-lg">
                     <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">{m.label}</p>
                     <p className="text-2xl font-black text-slate-900 tracking-tight">{m.value}</p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      <div className="pt-10">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] mb-8 ml-2">Insight History Log</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {insights.map(item => (
             <button key={item.id} onClick={() => handleViewHistory(item)} className={`p-6 rounded-[2.5rem] border text-left transition-all group ${viewingHistoryId === item.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl' : 'bg-white border-slate-100 shadow-sm hover:border-indigo-200'}`}>
                <h4 className={`text-sm font-black uppercase tracking-tight mb-1 ${viewingHistoryId === item.id ? 'text-white' : 'text-slate-800'}`}>{item.label}</h4>
                <p className={`text-[10px] font-bold uppercase tracking-widest ${viewingHistoryId === item.id ? 'text-white/60' : 'text-slate-400'}`}>Generated: {new Date(item.date).toLocaleDateString('id-ID')}</p>
             </button>
           ))}
        </div>
      </div>

      {!insightResult && insights.length === 0 && !isGenerating && (
        <div className="py-32 text-center space-y-6 bg-white rounded-[4rem] border-4 border-dashed border-slate-100 animate-in fade-in duration-1000">
           <div className="text-6xl mb-6 opacity-30 italic">🕯️</div>
           <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-xs">Awaiting Calibration...</p>
           <p className="text-slate-300 font-bold text-[10px] uppercase tracking-widest px-8">Pilih parameter di atas lalu tekan 'Generate' untuk melihat ringkasan AI.</p>
        </div>
      )}
    </div>
  );
};

export default AiInsightActivity;