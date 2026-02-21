
import React, { useMemo, useState } from 'react';
import { AppData, Skill, DailyReport, WorkReflection, SkillStatus, SkillCategory, SkillPriority } from '../../../types';
import { generateMoveNarrative } from '../../../services/geminiService';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface SkillGapRadarProps {
  data: AppData;
  onSwitchTab?: (tab: string) => void;
  onAddSkill?: (skill: Skill) => void;
}

const SkillGapRadar: React.FC<SkillGapRadarProps> = ({ data, onSwitchTab, onAddSkill }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [confirmSkill, setConfirmSkill] = useState<any | null>(null);

  // 1. DATA AGGREGATION (Last 90 Days)
  const stats = useMemo(() => {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const recentLogs = data.dailyReports.filter(log => new Date(log.date) >= ninetyDaysAgo);
    const recentReflections = data.dailyReflections.filter(ref => new Date(ref.date) >= ninetyDaysAgo);
    
    // A. Skill Utilization
    const skillCounts: Record<string, number> = {};
    let totalSkillTags = 0;
    
    recentLogs.forEach(log => {
      // Assuming skills are tagged in activity or we use categories as proxy if tags aren't explicit
      // For this implementation, let's use the reflection's skillsUsed as it's more accurate
    });

    recentReflections.forEach(ref => {
      (ref.skillsUsed || []).forEach(skill => {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
        totalSkillTags++;
      });
    });

    const utilization = Object.entries(skillCounts)
      .map(([name, count]) => ({
        name,
        percentage: Math.round((count / (totalSkillTags || 1)) * 100)
      }))
      .sort((a, b) => b.percentage - a.percentage);

    // B. Stagnation Index Calculation
    const adminCount = recentLogs.filter(l => l.category.toLowerCase().includes('admin')).length;
    const adminPct = adminCount / (recentLogs.length || 1);
    
    const strategicCount = recentLogs.filter(l => 
      l.category.toLowerCase().includes('strat') || 
      l.activity.toLowerCase().includes('planning') ||
      l.activity.toLowerCase().includes('analis')
    ).length;
    const strategicPct = strategicCount / (recentLogs.length || 1);
    
    // Momentum calculation (avg mood trend)
    const firstHalf = recentReflections.slice(0, Math.floor(recentReflections.length / 2));
    const secondHalf = recentReflections.slice(Math.floor(recentReflections.length / 2));
    const avgMood1 = firstHalf.length ? firstHalf.reduce((a, b) => a + b.mood, 0) / firstHalf.length : 3;
    const avgMood2 = secondHalf.length ? secondHalf.reduce((a, b) => a + b.mood, 0) / secondHalf.length : 3;
    const momentumDown = avgMood2 < avgMood1 ? 1 : 0;

    const stagnationIndex = Math.round(((adminPct * 0.4) + ((1 - strategicPct) * 0.3) + (momentumDown * 0.3)) * 100);

    return { utilization, stagnationIndex, adminPct, strategicPct, recentLogsCount: recentLogs.length };
  }, [data]);

  // 2. ROLE BENCHMARKS (Simplified for deterministic logic)
  const benchmarks: Record<string, Record<string, number>> = {
    "Marketing": { "Strategic Planning": 70, "Data Analysis": 60, "Leadership": 50 },
    "Developer": { "System Design": 70, "Code Quality": 80, "Mentoring": 50 },
    "Admin": { "Process Optimization": 60, "Project Management": 50, "Communication": 70 },
    "Default": { "Strategy": 60, "Analysis": 60, "Leadership": 50 }
  };

  const currentRole = data.profile.currentPosition || "Default";
  const activeBenchmark = Object.keys(benchmarks).find(key => currentRole.toLowerCase().includes(key.toLowerCase())) 
    ? benchmarks[Object.keys(benchmarks).find(key => currentRole.toLowerCase().includes(key.toLowerCase()))!]
    : benchmarks["Default"];

  const skillGaps = useMemo(() => {
    return Object.entries(activeBenchmark).map(([skillName, required]) => {
      const userSkill = data.skills.find(s => s.name.toLowerCase().includes(skillName.toLowerCase()));
      const currentLevel = userSkill ? (userSkill.currentLevel / 5) * 100 : 20; // Normalize to 100
      return {
        name: skillName,
        required,
        current: currentLevel,
        gap: Math.max(0, required - currentLevel)
      };
    }).sort((a, b) => b.gap - a.gap);
  }, [data.skills, activeBenchmark]);

  // 3. OPPORTUNITY MULTIPLIERS
  const multipliers = [
    { skill: "Data Analysis", paths: ["Business Analyst", "Growth Marketing", "Product Analyst", "Strategy"], impact: "Tinggi" },
    { skill: "Leadership", paths: ["Team Lead", "Project Manager", "Operations Manager"], impact: "Tinggi" },
    { skill: "Strategic Thinking", paths: ["Consultant", "Product Manager", "Corporate Strategy"], impact: "Sedang" },
    { skill: "Public Speaking", paths: ["Sales", "Trainer", "Public Relations"], impact: "Sedang" }
  ];

  const leverageSkills = useMemo(() => {
    return multipliers.map(m => {
      const userSkill = data.skills.find(s => s.name.toLowerCase().includes(m.skill.toLowerCase()));
      const currentLevel = userSkill ? userSkill.currentLevel : 1;
      return { ...m, currentLevel };
    }).sort((a, b) => b.paths.length - a.paths.length);
  }, [data.skills]);

  const handleGenerateInsight = async () => {
    setIsAnalyzing(true);
    try {
      const res = await generateMoveNarrative({ 
        utilization: stats.utilization, 
        stagnation: stats.stagnationIndex, 
        gaps: skillGaps, 
        leverage: leverageSkills 
      });
      setAiInsight(res);
    } catch (e) {
      setAiInsight("Gagal memproses insight AI. Namun, Anda tetap bisa melihat data radar di bawah.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* HEADER */}
      <div className="bg-slate-900 p-10 rounded-[3rem] text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-indigo-500 text-xs font-black uppercase tracking-widest rounded-full">Analisis Pintar</span>
              <h2 className="text-3xl font-black uppercase tracking-tighter">Skill Mapping Intelligence</h2>
            </div>
            <p className="text-slate-400 font-medium text-base max-w-xl italic">"Bukan sekadar skill apa yang kurang, tapi bagaimana membuka lebih banyak peluang dengan usaha paling efisien."</p>
          </div>
          <button 
            onClick={handleGenerateInsight}
            disabled={isAnalyzing}
            className="px-8 py-4 bg-white text-slate-900 font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-xl hover:bg-indigo-50 transition-all active:scale-95 disabled:opacity-50"
          >
            {isAnalyzing ? 'Menganalisis...' : 'Generate AI Insight ✨'}
          </button>
        </div>
      </div>

      {aiInsight && (
        <div className="bg-indigo-50 border-2 border-indigo-100 p-8 rounded-[2.5rem] animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <i className="bi bi-cpu-fill"></i>
            </div>
            <h3 className="text-sm font-black text-indigo-900 uppercase tracking-widest">Ringkasan Strategis AI</h3>
          </div>
          <p className="text-slate-700 font-medium leading-relaxed italic whitespace-pre-wrap">"{aiInsight}"</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* RADAR A: UTILIZATION */}
        <div className="lg:col-span-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">A. Radar Penggunaan Skill</h3>
            <span className="text-xs font-bold text-slate-400">90 Hari Terakhir</span>
          </div>
          <div className="h-[300px] w-full">
            {stats.utilization.length >= 3 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={stats.utilization.slice(0, 6)}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis 
                    dataKey="name" 
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }}
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="Penggunaan"
                    dataKey="percentage"
                    stroke="#f97316"
                    fill="#fb923c"
                    fillOpacity={0.6}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-center text-slate-300 italic text-sm px-10">
                Butuh minimal 3 data skill yang sering digunakan untuk menampilkan radar chart.
              </div>
            )}
          </div>
          <div className="space-y-3 pt-4 border-t border-slate-50">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Detail Penggunaan Terbanyak:</p>
            {stats.utilization.slice(0, 3).map((u, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-600 uppercase">{u.name}</span>
                <span className="text-sm font-black text-indigo-600">{u.percentage}%</span>
              </div>
            ))}
          </div>
          {stats.adminPct > 0.6 && (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <p className="text-xs font-bold text-amber-700 leading-relaxed uppercase">Peringatan: Tugas Administratif terlalu dominan ({Math.round(stats.adminPct * 100)}%). Risiko karir jalan di tempat.</p>
            </div>
          )}
        </div>

        {/* RADAR B: BENCHMARK GAP */}
        <div className="lg:col-span-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">B. Cek Kesiapan Naik Level</h3>
            <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Target: {currentRole} Lead</span>
          </div>
          <div className="space-y-6">
            {skillGaps.map((g, i) => (
              <div key={i} className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-black text-slate-700 uppercase tracking-tight">{g.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase">Kurang:</span>
                    <span className={`text-sm font-black ${g.gap > 30 ? 'text-rose-500' : 'text-emerald-500'}`}>{g.gap}%</span>
                  </div>
                </div>
                <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden">
                  <div className="absolute inset-0 bg-indigo-100/50" style={{ width: `${g.required}%` }}></div>
                  <div className="absolute inset-0 bg-indigo-600 rounded-full" style={{ width: `${g.current}%` }}></div>
                </div>
                <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <span>Saat Ini: {Math.round(g.current)}%</span>
                  <span>Dibutuhkan: {g.required}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RADAR C: OPPORTUNITY MULTIPLIER */}
        <div className="lg:col-span-8 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">C. Skill Pembuka Peluang</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {leverageSkills.map((m, i) => (
              <div key={i} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4 hover:border-indigo-300 transition-all group">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">{m.skill}</h4>
                    <span className={`text-xs font-black uppercase tracking-widest ${m.impact === 'Tinggi' ? 'text-emerald-600' : 'text-amber-600'}`}>Dampak: {m.impact}</span>
                  </div>
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm font-black text-sm">
                    +{m.paths.length}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Bisa Pindah Ke:</p>
                  <div className="flex flex-wrap gap-2">
                    {m.paths.map((p, j) => (
                      <span key={j} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600">{p}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RADAR D: STAGNATION RISK */}
        <div className="lg:col-span-4 bg-slate-950 p-8 rounded-[2.5rem] text-white flex flex-col justify-between space-y-8 shadow-xl">
          <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest">D. Indikator Risiko Karir</h3>
          <div className="text-center space-y-4">
            <div className="relative inline-block">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-800" />
                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={364.4} strokeDashoffset={364.4 - (364.4 * stats.stagnationIndex) / 100} className={`${stats.stagnationIndex > 60 ? 'text-rose-500' : stats.stagnationIndex > 30 ? 'text-amber-500' : 'text-emerald-500'} transition-all duration-1000`} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black">{stats.stagnationIndex}%</span>
              </div>
            </div>
            <p className={`text-base font-black uppercase tracking-widest ${
              stats.stagnationIndex >= 70 ? 'text-rose-500' : 
              stats.stagnationIndex >= 50 ? 'text-amber-500' : 
              stats.stagnationIndex >= 20 ? 'text-emerald-400' : 'text-emerald-500'
            }`}>
              {stats.stagnationIndex >= 70 ? 'Bahaya Stagnasi Akut' : 
               stats.stagnationIndex >= 50 ? 'Waspada Stagnasi' : 
               stats.stagnationIndex >= 20 ? 'Kondisi Aman & Bertumbuh' : 'Sangat Aman & Progresif'}
            </p>
          </div>
          <div className="space-y-4 pt-4 border-t border-white/5">
            <p className="text-xs font-medium text-slate-400 italic leading-relaxed">
              "Indikator ini mengukur seberapa besar risiko karir Anda 'jalan di tempat'. Dihitung dari perbandingan tugas rutin (admin) vs tugas strategis, serta tren kepuasan kerja Anda."
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2 opacity-70 border-t border-white/5">
               <div className="text-[10px] font-black uppercase tracking-tighter flex items-center gap-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                 <span>{'<'} 20%: Sangat Aman</span>
               </div>
               <div className="text-[10px] font-black uppercase tracking-tighter flex items-center gap-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                 <span>{'<'} 50%: Aman</span>
               </div>
               <div className="text-[10px] font-black uppercase tracking-tighter flex items-center gap-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                 <span>{'<'} 70%: Waspada</span>
               </div>
               <div className="text-[10px] font-black uppercase tracking-tighter flex items-center gap-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                 <span>{'>'} 70%: Bahaya</span>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* OUTPUT SUMMARY */}
      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-10">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Prioritas Pengembangan Ter-Leverage</h3>
          <p className="text-xs font-bold text-slate-500 leading-relaxed uppercase tracking-widest">
            Ini adalah daftar skill yang memiliki "daya ungkit" tertinggi untuk karir Anda. 
            Menguasai skill ini bukan hanya menambah kompetensi, tapi secara otomatis membuka 
            berbagai jalur karir baru (Cluster Role) sekaligus meningkatkan nilai tawar Anda di pasar kerja.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {leverageSkills.slice(0, 3).map((s, i) => (
            <div key={i} className="relative p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-4 overflow-hidden">
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-indigo-600/5 rounded-full flex items-center justify-center text-4xl font-black text-indigo-600/10">{i + 1}</div>
              <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">{s.skill}</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                  <span className="text-slate-400">Dampak</span>
                  <span className="text-indigo-600">{s.impact}</span>
                </div>
                <p className="text-sm font-bold text-slate-500 leading-relaxed">Membuka {s.paths.length} jalur karier baru dan meningkatkan daya tawar di pasar.</p>
              </div>
              <div className="pt-4">
                <button 
                  onClick={() => setConfirmSkill(s)}
                  className="w-full py-3 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                >
                  Pelajari Skill Ini
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CONFIRMATION MODAL */}
      {confirmSkill && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl space-y-8 animate-in zoom-in-95 duration-300">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center text-4xl mx-auto shadow-sm">
                <i className="bi bi-bullseye"></i>
              </div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Konfirmasi Target</h3>
              <p className="text-xs font-bold text-slate-500 leading-relaxed uppercase tracking-widest">
                Anda akan menambahkan <span className="text-indigo-600">"{confirmSkill.skill}"</span> ke dalam Skill Matrix Anda untuk mulai dipantau perkembangannya.
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl space-y-4 border border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Skill Name</span>
                <span className="text-xs font-black text-slate-700 uppercase">{confirmSkill.skill}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Initial Level</span>
                <span className="text-xs font-black text-slate-700 uppercase">Level 1 (Beginner)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Priority</span>
                <span className="text-xs font-black text-indigo-600 uppercase">High Priority</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setConfirmSkill(null)}
                className="flex-1 py-4 bg-slate-100 text-slate-400 font-black rounded-2xl uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all"
              >
                Batal
              </button>
              <button 
                onClick={() => {
                  if (onAddSkill) {
                    const newSkill: Skill = {
                      id: Math.random().toString(36).substr(2, 9),
                      name: confirmSkill.skill,
                      category: (confirmSkill.skill.toLowerCase().includes('soft') || confirmSkill.skill.toLowerCase().includes('leadership') || confirmSkill.skill.toLowerCase().includes('speaking')) 
                        ? SkillCategory.SOFT
                        : SkillCategory.HARD,
                      currentLevel: 1,
                      requiredLevel: 5,
                      status: SkillStatus.GAP,
                      priority: SkillPriority.HIGH,
                      lastUsed: new Date().toISOString(),
                      actionPlan: `Mulai mempelajari ${confirmSkill.skill} untuk membuka jalur karir: ${confirmSkill.paths.join(', ')}`,
                      isRelevant: true
                    };
                    onAddSkill(newSkill);
                  }
                  
                  if (onSwitchTab) {
                    onSwitchTab('skills');
                  }
                  setConfirmSkill(null);
                }}
                className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
              >
                Ya, Tambahkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillGapRadar;
