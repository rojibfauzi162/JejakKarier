
import React, { useState, useEffect, useMemo } from 'react';
import { AppData, Skill, Training, Certification, SkillStatus, SkillCategory, SkillPriority, TrainingStatus, AiStrategy } from '../types';
import { analyzeSkillGap } from '../services/geminiService';

interface SkillTrackerProps {
  data?: AppData;
  skills: Skill[];
  trainings: Training[];
  certs: Certification[];
  onAddSkill: (s: Skill) => void;
  onUpdateSkill: (s: Skill) => void;
  onDeleteSkill: (id: string) => void;
  onAddTraining: (t: Training) => void;
  onUpdateTraining: (t: Training) => void;
  onDeleteTraining: (id: string) => void;
  onAddCert: (c: Certification) => void;
  onUpdateCert: (c: Certification) => void;
  onDeleteCert: (id: string) => void;
  onSaveStrategy?: (strategy: AiStrategy) => void;
}

const SkillTracker: React.FC<SkillTrackerProps> = ({ 
  data, skills, trainings, certs, 
  onAddSkill, onUpdateSkill, onDeleteSkill,
  onAddTraining, onUpdateTraining, onDeleteTraining,
  onAddCert, onUpdateCert, onDeleteCert,
  onSaveStrategy
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'skills' | 'learning' | 'certs' | 'ai'>('skills');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Filter States for Training History
  const [fPriority, setFPriority] = useState('All');
  const [fStatus, setFStatus] = useState('All');
  const [fPlatform, setFPlatform] = useState('All');
  const [fTime, setFTime] = useState('all');
  const [fStart, setFStart] = useState('');
  const [fEnd, setFEnd] = useState('');
  
  // Filter States for Certification
  const [fCertStatus, setFCertStatus] = useState('All');
  const [fCertSkill, setFCertSkill] = useState('All');
  const [fCertTime, setFCertTime] = useState('all');
  const [fCertStart, setFCertStart] = useState('');
  const [fCertEnd, setFCertEnd] = useState('');

  // Pagination States
  const [trainPage, setTrainPage] = useState(1);
  const [certPage, setCertPage] = useState(1);
  const trainPerPage = 5;
  const certPerPage = 5;

  // AI Strategist States
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiResults, setAiResults] = useState<AiStrategy | null>(data?.aiStrategies && data.aiStrategies.length > 0 ? data.aiStrategies[0] : null);
  const [aiLang, setAiLang] = useState<'id' | 'en'>('id');
  const [showHistory, setShowHistory] = useState(false);

  // Fix: implement missing openAddForm function
  const openAddForm = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  // Fix: implement missing openEditForm function
  const openEditForm = (item: any) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleRunAiStrategist = async () => {
    if (!data) return;
    setIsAiAnalyzing(true);
    try {
      const result = await analyzeSkillGap(data, aiLang);
      if (result) {
        const newVersion = (data.aiStrategies?.length || 0) + 1;
        const strategyEntry: AiStrategy = {
          ...result,
          version: newVersion,
          date: new Date().toISOString(),
          language: aiLang
        };
        setAiResults(strategyEntry);
        if (onSaveStrategy) onSaveStrategy(strategyEntry);
      }
    } catch (e) {
      console.error("AI Analysis error:", e);
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const getPriorityStyle = (priority: string) => {
    const p = priority.toUpperCase();
    if (p.includes('CRITICAL')) return 'bg-rose-50 text-rose-600 border-rose-100';
    if (p.includes('HIGH')) return 'bg-blue-50 text-blue-600 border-blue-100';
    if (p.includes('MEDIUM')) return 'bg-amber-50 text-amber-600 border-amber-100';
    return 'bg-slate-50 text-slate-500 border-slate-100';
  };

  const getStatusStyle = (status: SkillStatus) => {
    switch(status) {
      case SkillStatus.ACHIEVED: return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case SkillStatus.ON_PROGRESS: return 'bg-blue-50 text-blue-600 border-blue-100';
      case SkillStatus.GAP: return 'bg-slate-50 text-slate-400 border-slate-200';
      default: return 'bg-slate-50 text-slate-400';
    }
  };

  const getCertStatusStyle = (status?: TrainingStatus) => {
    switch(status) {
      case TrainingStatus.COMPLETED: return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case TrainingStatus.ON_PROCESS: return 'bg-blue-50 text-blue-600 border-blue-100';
      case TrainingStatus.PLANNED: return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-slate-50 text-slate-400 border-slate-100';
    }
  };

  // Helper to check if cert deadline is overdue
  const isCertOverdue = (cert: Certification) => {
    if (cert.status === TrainingStatus.PLANNED && cert.deadline) {
      return new Date(cert.deadline) < new Date();
    }
    return false;
  };

  // Extract platforms
  const platforms = useMemo(() => {
    const p = new Set(trainings.map(t => t.provider));
    return ['All', ...Array.from(p)];
  }, [trainings]);

  // Extract unique skills from certs for filtering
  const certRelatedSkills = useMemo(() => {
    const s = new Set(certs.map(c => c.relatedSkill).filter(Boolean));
    return ['All', ...Array.from(s)];
  }, [certs]);

  // Filtered Training Logic
  const filteredTrainings = useMemo(() => {
    return trainings.filter(t => {
      const itemPriority = t.priority || SkillPriority.MEDIUM;
      const matchesPriority = fPriority === 'All' || itemPriority === fPriority;
      const matchesStatus = fStatus === 'All' || t.status === fStatus;
      const matchesPlatform = fPlatform === 'All' || t.provider === fPlatform;

      let matchesTime = true;
      if (fTime !== 'all') {
        const dateStr = t.date.includes(' - ') ? t.date.split(' - ')[0] : t.date;
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = (now.getTime() - date.getTime()) / (1000 * 3600 * 24);

        if (fTime === '7days') matchesTime = diffDays <= 7;
        else if (fTime === '30days') matchesTime = diffDays <= 30;
        else if (fTime === '90days') matchesTime = diffDays <= 90;
        else if (fTime === '365days') matchesTime = diffDays <= 365;
        else if (fTime === 'custom' && fStart && fEnd) {
          matchesTime = date >= new Date(fStart) && date <= new Date(fEnd);
        }
      }
      return matchesPriority && matchesStatus && matchesPlatform && matchesTime;
    });
  }, [trainings, fPriority, fStatus, fPlatform, fTime, fStart, fEnd]);

  // Filtered Cert Logic
  const filteredCerts = useMemo(() => {
    return certs.filter(c => {
      const matchesStatus = fCertStatus === 'All' || (c.status || TrainingStatus.COMPLETED) === fCertStatus;
      const matchesSkill = fCertSkill === 'All' || c.relatedSkill === fCertSkill;

      let matchesTime = true;
      if (fCertTime !== 'all') {
        const date = new Date(c.date);
        const now = new Date();
        const diffDays = (now.getTime() - date.getTime()) / (1000 * 3600 * 24);

        if (fCertTime === '7days') matchesTime = diffDays <= 7;
        else if (fCertTime === '30days') matchesTime = diffDays <= 30;
        else if (fCertTime === '90days') matchesTime = diffDays <= 90;
        else if (fCertTime === '365days') matchesTime = diffDays <= 365;
        else if (fCertTime === 'custom' && fCertStart && fCertEnd) {
          matchesTime = date >= new Date(fCertStart) && date <= new Date(fCertEnd);
        }
      }
      return matchesStatus && matchesSkill && matchesTime;
    });
  }, [certs, fCertStatus, fCertSkill, fCertTime, fCertStart, fCertEnd]);

  const totalTrainPages = Math.ceil(filteredTrainings.length / trainPerPage);
  const paginatedTrainings = filteredTrainings.slice((trainPage - 1) * trainPerPage, trainPage * trainPerPage);

  const totalCertPages = Math.ceil(filteredCerts.length / certPerPage);
  const paginatedCerts = filteredCerts.slice((certPage - 1) * certPerPage, certPage * certPerPage);

  // Reset pages when filters change
  useEffect(() => { setTrainPage(1); }, [fPriority, fStatus, fPlatform, fTime]);
  useEffect(() => { setCertPage(1); }, [fCertStatus, fCertSkill, fCertTime]);

  // Metrics for Training
  const totalCourses = trainings.length;
  const onProcessCount = trainings.filter(t => t.status === TrainingStatus.ON_PROCESS).length;
  const completedCount = trainings.filter(t => t.status === TrainingStatus.COMPLETED).length;
  const percentage = totalCourses > 0 ? ((completedCount / totalCourses) * 100).toFixed(0) : "0";
  const totalCost = trainings.reduce((acc, t) => acc + (t.cost || 0), 0);

  // Metrics for Certification
  const certCount = certs.length;
  const certPlannedCount = certs.filter(c => c.status === TrainingStatus.PLANNED).length;
  const certOnProcessCount = certs.filter(c => c.status === TrainingStatus.ON_PROCESS).length;
  const certCompletedCount = certs.filter(c => !c.status || c.status === TrainingStatus.COMPLETED).length;

  // Score comparison logic
  const prevScore = data?.aiStrategies && data.aiStrategies.length > 1 ? data.aiStrategies[1].readinessScore : null;
  const scoreDiff = aiResults && prevScore !== null ? aiResults.readinessScore - prevScore : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-16">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="w-full">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Growth & Intelligence</h2>
          {/* Container Sub-Tab */}
          <div className="relative mt-5">
            <div className="flex gap-2 overflow-x-auto pb-4 -mx-4 px-4 no-scrollbar lg:mx-0 lg:px-0 snap-x">
              <SubTabButton active={activeSubTab === 'skills'} onClick={() => setActiveSubTab('skills')} label="Skill Matrix" icon="🎯" />
              <SubTabButton active={activeSubTab === 'learning'} onClick={() => setActiveSubTab('learning')} label="Training History" icon="📖" />
              <SubTabButton active={activeSubTab === 'certs'} onClick={() => setActiveSubTab('certs')} label="Certification" icon="📜" />
              <SubTabButton active={activeSubTab === 'ai'} onClick={() => setActiveSubTab('ai')} label="AI Strategist" icon="🧠" />
              <div className="w-8 shrink-0 lg:hidden"></div>
            </div>
            <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none lg:hidden"></div>
          </div>
        </div>
        {activeSubTab !== 'ai' && (
          <button 
            onClick={openAddForm}
            className="group flex items-center justify-center gap-2 px-6 py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl transition-all hover:bg-black hover:scale-[1.02] active:scale-[0.98] w-full md:w-auto"
          >
            <span className="text-xl">+</span>
            <span className="text-xs uppercase tracking-widest">Add {activeSubTab === 'skills' ? 'Skill' : activeSubTab === 'learning' ? 'Course' : 'Cert'}</span>
          </button>
        )}
      </header>

      {/* Dashboard Stats for Training */}
      {activeSubTab === 'learning' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-top duration-500">
          <StatWidget title="Total Course" value={totalCourses} icon="📚" color="blue" />
          <StatWidget title="In Progress" value={onProcessCount} icon="⏳" color="amber" />
          <StatWidget title="Achievement" value={`${percentage}%`} icon="🔥" color="emerald" />
          <StatWidget title="Investment" value={`Rp ${(totalCost/1000).toFixed(0)}k`} icon="💎" color="purple" />
        </div>
      )}

      {/* Dashboard Stats for Certification */}
      {activeSubTab === 'certs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-top duration-500">
          <StatWidget title="Total Certs" value={certCount} icon="📜" color="blue" />
          <StatWidget title="Planned" value={certPlannedCount} icon="📅" color="amber" />
          <StatWidget title="On Process" value={certOnProcessCount} icon="⏳" color="indigo" />
          <StatWidget title="Achieved" value={certCompletedCount} icon="🏆" color="emerald" />
        </div>
      )}

      {/* Forms Overlay */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[110] p-4">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl p-8 lg:p-12 animate-in zoom-in duration-300 overflow-y-auto max-h-[90vh]">
            {activeSubTab === 'skills' && <SkillForm initialData={editingItem} onSubmit={(d) => { editingItem ? onUpdateSkill(d as Skill) : onAddSkill({ ...d, id: Math.random().toString() } as Skill); setIsFormOpen(false); }} onCancel={() => setIsFormOpen(false)} />}
            {activeSubTab === 'learning' && <TrainingForm initialData={editingItem} onSubmit={(d) => { editingItem ? onUpdateTraining(d as Training) : onAddTraining({ ...d, id: Math.random().toString() } as Training); setIsFormOpen(false); }} onCancel={() => setIsFormOpen(false)} />}
            {activeSubTab === 'certs' && <CertForm skills={skills} initialData={editingItem} onSubmit={(d) => { editingItem ? onUpdateCert(d as Certification) : onAddCert({ ...d, id: Math.random().toString() } as Certification); setIsFormOpen(false); }} onCancel={() => setIsFormOpen(false)} />}
          </div>
        </div>
      )}

      {/* AI Strategist Module (unchanged) */}
      {activeSubTab === 'ai' && (
        <div className="space-y-8 animate-in fade-in duration-700">
          <div className="bg-slate-900 p-10 lg:p-14 rounded-[3.5rem] text-white relative overflow-hidden shadow-2xl">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center text-4xl shadow-xl shadow-blue-500/20">🧠</div>
                <div className="flex gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10">
                  <button onClick={() => setAiLang('id')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${aiLang === 'id' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}>ID</button>
                  <button onClick={() => setAiLang('en')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${aiLang === 'en' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}>EN</button>
                </div>
              </div>
              <h3 className="text-3xl lg:text-4xl font-black tracking-tighter mb-4 uppercase">AI Qualification Strategist</h3>
              <p className="text-slate-400 text-sm lg:text-base max-w-2xl leading-relaxed font-medium">
                Mesin penentu kualifikasi cerdas. AI akan mengukur skor kesiapan Anda, merekomendasikan langkah mikro (Next Small Action), 
                dan menyesuaikan strategi seiring perkembangan portofolio Anda.
              </p>
              <div className="flex flex-wrap gap-4 mt-10">
                <button 
                  onClick={handleRunAiStrategist}
                  disabled={isAiAnalyzing}
                  className="px-12 py-5 bg-blue-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest hover:bg-blue-700 transition-all shadow-xl active:scale-95 disabled:opacity-50"
                >
                  {isAiAnalyzing ? (aiLang === 'id' ? 'Menganalisis...' : 'Analyzing...') : (aiLang === 'id' ? 'Update Strategi Karir' : 'Update Career Strategy')}
                </button>
                {data?.aiStrategies && data.aiStrategies.length > 0 && (
                  <button 
                    onClick={() => setShowHistory(!showHistory)}
                    className="px-8 py-5 bg-white/10 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest border border-white/10 hover:bg-white/20 transition-all"
                  >
                    {showHistory ? 'Hide Versions' : `Roadmap History (v${data.aiStrategies.length})`}
                  </button>
                )}
              </div>
            </div>
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[150px] -mr-64 -mt-64"></div>
          </div>

          {/* Version History Navigation */}
          {showHistory && data?.aiStrategies && (
            <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar animate-in slide-in-from-top-4">
              {data.aiStrategies.map((strat, idx) => (
                <button 
                  key={idx}
                  onClick={() => { setAiResults(strat); setShowHistory(false); }}
                  className={`px-6 py-4 rounded-2xl border-2 shrink-0 transition-all text-left ${aiResults?.version === strat.version ? 'border-blue-600 bg-white shadow-xl' : 'border-slate-100 bg-slate-50/50 opacity-60 hover:opacity-100'}`}
                >
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Roadmap v{strat.version}</p>
                  <p className="text-xs font-black text-slate-700">{new Date(strat.date).toLocaleDateString(aiLang === 'id' ? 'id-ID' : 'en-US', { month: 'long', year: 'numeric' })}</p>
                </button>
              ))}
            </div>
          )}

          {aiResults && (
            <div className="space-y-8 animate-in zoom-in duration-500">
              {/* Readiness Score Card */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-10 lg:p-12 rounded-[3.5rem] shadow-sm border border-slate-100 relative overflow-hidden flex flex-col md:flex-row items-center gap-12">
                   <div className="relative shrink-0">
                      <div className="w-40 h-40 rounded-full border-[12px] border-slate-50 flex flex-col items-center justify-center relative">
                         <p className="text-5xl font-black text-slate-900 tracking-tighter">{aiResults.readinessScore}</p>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">/ 100</p>
                         <svg className="absolute -inset-2 w-44 h-44 -rotate-90">
                           <circle cx="88" cy="88" r="80" fill="transparent" stroke="currentColor" strokeWidth="12" className="text-blue-600" strokeDasharray={502} strokeDashoffset={502 - (502 * aiResults.readinessScore / 100)} strokeLinecap="round" />
                         </svg>
                      </div>
                      {scoreDiff !== 0 && (
                        <div className={`absolute -top-2 -right-2 px-3 py-1 rounded-full font-black text-[10px] shadow-lg flex items-center gap-1 ${scoreDiff > 0 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                          {scoreDiff > 0 ? '▲' : '▼'} {Math.abs(scoreDiff)}
                        </div>
                      )}
                   </div>
                   <div>
                      <h4 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.3em] mb-4">
                        {aiLang === 'id' ? `Kesiapan Menuju ${aiResults.targetGoal}` : `Readiness for ${aiResults.targetGoal}`}
                      </h4>
                      <p className="text-base text-slate-600 leading-relaxed font-medium italic">
                        "{aiResults.scoreExplanation}"
                      </p>
                   </div>
                   <div className="absolute bottom-0 right-0 w-32 h-32 bg-slate-50 rounded-tl-[4rem] -mr-12 -mb-12"></div>
                </div>

                <div className="bg-indigo-600 p-10 rounded-[3.5rem] text-white relative overflow-hidden flex flex-col justify-center">
                   <div className="relative z-10">
                      <div className="text-3xl mb-4">✨</div>
                      <p className="text-lg font-bold leading-relaxed italic opacity-90">
                        "{aiResults.motivation}"
                      </p>
                      <p className="text-[9px] font-black uppercase tracking-[0.3em] mt-6 text-indigo-200">System Message v{aiResults.version}</p>
                   </div>
                   <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -mr-24 -mt-24"></div>
                </div>
              </div>

              {/* Next Small Actions */}
              <div className="bg-white p-10 lg:p-12 rounded-[3.5rem] shadow-sm border border-slate-100">
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-10 text-center">
                  {aiLang === 'id' ? 'Langkah Mikro Berikutnya (Micro Actions)' : 'Next Small Actions'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   <ActionCard timeframe={aiLang === 'id' ? 'Minggu Ini' : 'This Week'} action={aiResults.immediateActions?.weekly || (aiLang === 'id' ? 'Belum tersedia' : 'Not available')} color="rose" icon="📅" />
                   <ActionCard timeframe={aiLang === 'id' ? 'Bulan Ini' : 'This Month'} action={aiResults.immediateActions?.monthly || (aiLang === 'id' ? 'Belum tersedia' : 'Not available')} color="blue" icon="🗓️" />
                   <ActionCard timeframe={aiLang === 'id' ? 'Bulan Depan' : 'Next Month'} action={aiResults.immediateActions?.nextMonth || (aiLang === 'id' ? 'Belum tersedia' : 'Not available')} color="emerald" icon="🚀" />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Critical Gaps */}
                <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
                  <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                    <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
                    {aiLang === 'id' ? 'Gap Skill Kritis' : 'Crucial Skill Gaps'}
                  </h4>
                  <div className="space-y-6">
                    {aiResults.criticalGaps?.map((gap: any, i: number) => (
                      <div key={i} className="p-6 bg-rose-50/50 rounded-3xl border border-rose-100 group hover:bg-rose-50 transition-all">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-black text-slate-800 text-base">{gap.skill}</p>
                          <span className={`px-2 py-0.5 text-white text-[8px] font-black rounded uppercase tracking-widest ${getPriorityStyle(gap.priority).split(' ')[0].replace('bg-', 'bg-').replace('-50', '-600')}`}>{gap.priority}</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed font-medium italic">"{gap.why}"</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
                  <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-8">{aiLang === 'id' ? 'Rekomendasi Spesifik' : 'Specific Recommendations'}</h4>
                  <div className="space-y-8">
                     <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Training / Course</p>
                        <div className="space-y-3">
                           {aiResults.recommendations?.trainings?.map((t: string, i: number) => (
                             <div key={i} className="flex items-center gap-3 p-4 bg-blue-50/30 rounded-2xl border border-blue-50">
                                <span className="text-lg">🎓</span>
                                <span className="text-xs font-bold text-slate-700">{t}</span>
                             </div>
                           ))}
                        </div>
                     </div>
                     <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Certification</p>
                        <div className="space-y-3">
                           {aiResults.recommendations?.certifications?.map((c: string, i: number) => (
                             <div key={i} className="flex items-center gap-3 p-4 bg-amber-50/30 rounded-2xl border border-amber-50">
                                <span className="text-lg">📜</span>
                                <span className="text-xs font-bold text-slate-700">{c}</span>
                             </div>
                           ))}
                        </div>
                     </div>
                  </div>
                </div>

                {/* Detailed Steps */}
                <div className="lg:col-span-2 bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-10">Detailed Roadmap Steps</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                     {aiResults.roadmapSteps?.map((step: any, i: number) => (
                       <div key={i} className="relative pl-12">
                          <div className="absolute left-0 top-0 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-xs shadow-lg">{i + 1}</div>
                          <h5 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-2">{step.title}</h5>
                          <p className="text-xs text-slate-500 leading-relaxed font-medium">{step.detail}</p>
                       </div>
                     ))}
                  </div>
                </div>

                {/* Executive Summary */}
                <div className="lg:col-span-2 bg-slate-50 p-12 rounded-[3.5rem] border border-slate-100">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Executive Summary</h4>
                  <p className="text-base text-slate-600 leading-loose font-medium first-letter:text-4xl first-letter:font-black first-letter:text-slate-900 first-letter:float-left first-letter:mr-3">
                    {aiResults.executiveSummary}
                  </p>
                </div>
              </div>
            </div>
          )}

          {!aiResults && !isAiAnalyzing && (
            <div className="py-24 text-center space-y-4 bg-slate-50/50 rounded-[3.5rem] border-4 border-dashed border-slate-100 animate-in fade-in duration-1000">
               <div className="text-5xl mb-6">🕯️</div>
               <p className="text-slate-400 font-black uppercase tracking-widest text-xs">
                 {aiLang === 'id' ? 'Belum Ada Strategi Terdeteksi' : 'No Strategy Detected'}
               </p>
               <p className="text-slate-300 text-[10px] font-bold uppercase tracking-widest max-w-xs mx-auto">
                 {aiLang === 'id' ? 'Tanpa AI aktif, Anda akan kehilangan arah langkah berikutnya. Klik tombol di atas untuk memulai.' : 'Without active AI, you will lose track of your next steps. Click the button above to start.'}
               </p>
            </div>
          )}
        </div>
      )}

      {/* Skill Matrix Table */}
      {activeSubTab === 'skills' && (
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <th className="px-8 py-5">Skill Name</th>
                  <th className="px-6 py-5 text-center">Proficiency</th>
                  <th className="px-8 py-5">Matrix Visualization</th>
                  <th className="px-6 py-5 text-center">Priority</th>
                  <th className="px-6 py-5">Current Status</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {skills.map(skill => (
                  <tr key={skill.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-base">{skill.name}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{skill.category}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 font-black text-sm text-slate-700">
                        {skill.currentLevel}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex items-center shadow-inner">
                        <div 
                          className={`h-full transition-all duration-1000 ease-out rounded-full ${skill.currentLevel >= 4 ? 'bg-emerald-500' : skill.currentLevel >= 3 ? 'bg-blue-500' : 'bg-amber-500'}`}
                          style={{ width: `${(skill.currentLevel / 5) * 100}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getPriorityStyle(skill.priority)}`}>
                        {skill.priority}
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(skill.status)}`}>
                        {skill.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditForm(skill)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">✎</button>
                        <button onClick={() => onDeleteSkill(skill.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">✕</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {skills.length === 0 && <div className="py-24 text-center text-slate-400 italic font-medium">No skills defined in your matrix.</div>}
          </div>

          <div className="lg:hidden p-4 grid grid-cols-1 gap-4">
            {skills.map(skill => (
              <div key={skill.id} className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 snap-start">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-black text-slate-800 text-lg leading-tight">{skill.name}</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase mt-1 tracking-widest">{skill.category}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEditForm(skill)} className="p-2 text-slate-500 hover:text-blue-600">✎</button>
                    <button onClick={() => onDeleteSkill(skill.id)} className="p-2 text-slate-500 hover:text-red-500">✕</button>
                  </div>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full mb-3 overflow-hidden">
                   <div className="h-full bg-blue-500" style={{ width: `${(skill.currentLevel/5)*100}%` }}></div>
                </div>
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                  <span className={getPriorityStyle(skill.priority).split(' ').slice(1).join(' ')}>{skill.priority}</span>
                  <span className="text-slate-400">Lv.{skill.currentLevel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Training History Tab Content */}
      {activeSubTab === 'learning' && (
        <div className="space-y-6">
          {/* Advanced Filter Bar */}
          <div className="bg-white p-5 lg:p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-end animate-in slide-in-from-top-4 duration-500">
            <div className="flex-1 min-w-[150px]">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Priority</label>
              <select className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold outline-none" value={fPriority} onChange={e => setFPriority(e.target.value)}>
                <option value="All">All Priority</option>
                {Object.values(SkillPriority).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Status</label>
              <select className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold outline-none" value={fStatus} onChange={e => setFStatus(e.target.value)}>
                <option value="All">All Status</option>
                {Object.values(TrainingStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Platform</label>
              <select className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold outline-none" value={fPlatform} onChange={e => setFPlatform(e.target.value)}>
                {platforms.map(p => <option key={p} value={p}>{p === 'All' ? 'All Platform' : p}</option>)}
              </select>
            </div>
            <div className="w-full lg:w-44">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Waktu</label>
              <select className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold outline-none" value={fTime} onChange={e => setFTime(e.target.value)}>
                <option value="all">Semua Waktu</option>
                <option value="7days">7 Hari Terakhir</option>
                <option value="30days">1 Bulan Terakhir</option>
                <option value="90days">3 Bulan Terakhir</option>
                <option value="365days">1 Tahun Terakhir</option>
                <option value="custom">Range Tanggal</option>
              </select>
            </div>
            {fTime === 'custom' && (
              <div className="w-full lg:w-auto flex gap-2 animate-in slide-in-from-left-2">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Start</label>
                  <input type="date" value={fStart} onChange={e => setFStart(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-[10px] font-bold outline-none" />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">End</label>
                  <input type="date" value={fEnd} onChange={e => setFEnd(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-[10px] font-bold outline-none" />
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1000px] table-fixed">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <th className="px-8 py-5 w-auto">Course Detail</th>
                    <th className="px-6 py-5 text-center w-28">Priority</th>
                    <th className="px-8 py-5 w-72">Training Progress</th>
                    <th className="px-6 py-5 w-40">Platform</th>
                    <th className="px-6 py-5 text-center w-36">Investment</th>
                    <th className="px-6 py-5 text-center w-32">Status</th>
                    <th className="px-8 py-5 text-right w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginatedTrainings.map(t => (
                    <tr key={t.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className={`font-bold text-slate-800 text-sm truncate ${t.status === TrainingStatus.COMPLETED ? 'line-through opacity-40' : ''}`}>{t.name}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.topic} • {t.date}</span>
                          {t.deadline && <span className="text-[9px] font-black text-rose-500 uppercase mt-1">Deadline: {t.deadline}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-6 text-center">
                         <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${getPriorityStyle(t.priority || SkillPriority.MEDIUM)}`}>
                           {t.priority || SkillPriority.MEDIUM}
                         </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="w-full space-y-1.5">
                           <div className="flex justify-between items-center text-[8px] font-black text-slate-400 uppercase tracking-widest">
                              <span>Progress Level</span>
                              <span className="text-blue-600">{t.progress || 0}%</span>
                           </div>
                           <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                              <div className="h-full bg-blue-600 rounded-full transition-all duration-1000 shadow-sm" style={{ width: `${t.progress || 0}%` }}></div>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 text-xs font-bold text-slate-600 truncate">{t.provider}</td>
                      <td className="px-6 py-6 text-center font-black text-slate-700 text-sm">Rp {t.cost?.toLocaleString()}</td>
                      <td className="px-6 py-6 text-center">
                        <span className={`px-2 py-1.5 rounded-full text-[8px] font-black uppercase tracking-tighter border inline-block min-w-[80px] ${
                          t.status === TrainingStatus.COMPLETED ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button onClick={() => openEditForm(t)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">✎</button>
                          <button onClick={() => onDeleteTraining(t.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">✕</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredTrainings.length === 0 && <div className="py-24 text-center text-slate-400 italic font-medium">No courses found matching your filters.</div>}
            </div>

            <div className="lg:hidden p-4 grid grid-cols-1 gap-4">
               {paginatedTrainings.map(t => (
                 <div key={t.id} className={`p-6 bg-slate-50/50 rounded-3xl border border-slate-100 transition-all snap-start ${t.status === TrainingStatus.COMPLETED ? 'opacity-80' : ''}`}>
                    <div className="flex justify-between items-start mb-4">
                       <div className="flex-1 mr-4">
                          <h4 className={`font-black text-slate-800 leading-tight text-lg ${t.status === TrainingStatus.COMPLETED ? 'line-through decoration-slate-400' : ''}`}>{t.name}</h4>
                          <div className="flex flex-wrap gap-2 mt-2">
                             <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter border ${t.status === TrainingStatus.COMPLETED ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{t.status}</span>
                             <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase border ${getPriorityStyle(t.priority || SkillPriority.MEDIUM)}`}>{t.priority || SkillPriority.MEDIUM}</span>
                          </div>
                       </div>
                       <div className="flex gap-1 shrink-0">
                          <button onClick={() => openEditForm(t)} className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-blue-600 bg-white rounded-full shadow-sm border border-slate-100 transition-colors">✎</button>
                          <button onClick={() => onDeleteTraining(t.id)} className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-rose-600 bg-white rounded-full shadow-sm border border-slate-100 transition-colors">✕</button>
                       </div>
                    </div>
                    
                    <div className="space-y-4">
                       <div className="w-full bg-white p-4 rounded-2xl border border-slate-100">
                          <div className="flex justify-between items-center mb-2">
                             <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Module Progress</span>
                             <span className="text-[10px] font-black text-blue-600">{t.progress || 0}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden shadow-inner">
                             <div className="h-full bg-blue-600 rounded-full transition-all duration-1000" style={{ width: `${t.progress || 0}%` }}></div>
                          </div>
                       </div>

                       <div className="flex justify-between text-xs text-slate-500 bg-white/50 p-3 rounded-2xl border border-slate-100">
                          <div className="flex flex-col gap-1">
                             <span className="text-[8px] uppercase font-black text-slate-400 tracking-widest">Investment</span>
                             <span className="font-black text-blue-600">Rp {t.cost?.toLocaleString()}</span>
                          </div>
                          <div className="flex flex-col gap-1 text-right">
                             <span className="text-[8px] uppercase font-black text-slate-400 tracking-widest">Deadline</span>
                             <span className="font-black text-rose-500">{t.deadline || '-'}</span>
                          </div>
                       </div>
                    </div>
                    <a href={t.link} target="_blank" rel="noreferrer" className="block text-center w-full mt-4 py-2.5 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-100 active:scale-95 transition-all">Visit Resource →</a>
                 </div>
               ))}
               {filteredTrainings.length === 0 && <div className="py-12 text-center text-slate-400 italic">No courses found matching your filters.</div>}
            </div>
          </div>

          {/* Pagination Controls */}
          {totalTrainPages > 1 && (
            <div className="flex items-center justify-between bg-white px-6 lg:px-8 py-4 rounded-[2rem] border border-slate-100 shadow-sm animate-in slide-in-from-bottom-4">
              <button disabled={trainPage === 1} onClick={() => setTrainPage(p => p - 1)} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-colors">← Prev</button>
              <div className="flex gap-2">
                {[...Array(totalTrainPages)].map((_, i) => (
                  <button key={i} onClick={() => setTrainPage(i + 1)} className={`w-8 h-8 rounded-xl text-[10px] font-black transition-all ${trainPage === i + 1 ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>{i + 1}</button>
                ))}
              </div>
              <button disabled={trainPage === totalTrainPages} onClick={() => setTrainPage(p => p + 1)} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-colors">Next →</button>
            </div>
          )}
        </div>
      )}

      {/* Certification Tab Content */}
      {activeSubTab === 'certs' && (
        <div className="space-y-6">
          {/* Advanced Filter Bar for Certification */}
          <div className="bg-white p-5 lg:p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-end animate-in slide-in-from-top-4 duration-500">
            <div className="flex-1 min-w-[150px]">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Status</label>
              <select className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold outline-none" value={fCertStatus} onChange={e => setFCertStatus(e.target.value)}>
                <option value="All">All Status</option>
                {Object.values(TrainingStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Related Skill</label>
              <select className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold outline-none" value={fCertSkill} onChange={e => setFCertSkill(e.target.value)}>
                {certRelatedSkills.map(s => <option key={s} value={s}>{s === 'All' ? 'All Skills' : s}</option>)}
              </select>
            </div>
            <div className="w-full lg:w-44">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Waktu</label>
              <select className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold outline-none" value={fCertTime} onChange={e => setFCertTime(e.target.value)}>
                <option value="all">Semua Waktu</option>
                <option value="7days">7 Hari Terakhir</option>
                <option value="30days">1 Bulan Terakhir</option>
                <option value="90days">3 Bulan Terakhir</option>
                <option value="365days">1 Tahun Terakhir</option>
                <option value="custom">Range Tanggal</option>
              </select>
            </div>
            {fCertTime === 'custom' && (
              <div className="w-full lg:w-auto flex gap-2 animate-in slide-in-from-left-2">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Start</label>
                  <input type="date" value={fCertStart} onChange={e => setFCertStart(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-[10px] font-bold outline-none" />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">End</label>
                  <input type="date" value={fCertEnd} onChange={e => setFCertEnd(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-[10px] font-bold outline-none" />
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1100px] table-fixed">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <th className="px-8 py-5 w-auto">Certification Details</th>
                    <th className="px-6 py-5 text-center w-36">Status</th>
                    <th className="px-6 py-5 w-48 text-center">Nomor Sertifikat</th>
                    <th className="px-6 py-5 text-center w-40">Date</th>
                    <th className="px-6 py-5 w-44">Related Skill</th>
                    <th className="px-8 py-5 text-right w-36">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginatedCerts.map(c => {
                    const overdue = isCertOverdue(c);
                    return (
                      <tr key={c.id} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 text-sm truncate">{c.name}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{c.issuer}</span>
                          </div>
                        </td>
                        <td className="px-6 py-6 text-center">
                          <span className={`px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-tighter border inline-block min-w-[90px] ${getCertStatusStyle(c.status)}`}>
                            {c.status || TrainingStatus.COMPLETED}
                          </span>
                        </td>
                        <td className="px-6 py-6 text-center">
                          <span className="text-[10px] font-mono font-bold text-slate-500 break-all">{c.certNumber || '-'}</span>
                        </td>
                        <td className="px-6 py-6 text-center">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-600">{c.date || '-'}</span>
                            {c.status === TrainingStatus.PLANNED && c.deadline && (
                              <span className={`text-[9px] font-black uppercase mt-1 ${overdue ? 'text-rose-600 animate-pulse' : 'text-slate-400'}`}>
                                Target: {c.deadline}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex flex-wrap gap-1">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[8px] font-black uppercase tracking-tighter rounded border border-blue-100 max-w-full truncate">
                              {c.relatedSkill}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => openEditForm(c)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">✎</button>
                            <button onClick={() => onDeleteCert(c.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">✕</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredCerts.length === 0 && <div className="py-24 text-center text-slate-400 italic font-medium">No certifications found matching your filters.</div>}
            </div>

            <div className="lg:hidden p-4 grid grid-cols-1 gap-4">
              {paginatedCerts.map(c => {
                const overdue = isCertOverdue(c);
                return (
                  <div key={c.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 group transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl shadow-inner">📜</div>
                      <div className="flex gap-2">
                        <button onClick={() => openEditForm(c)} className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-blue-600 bg-slate-50 rounded-xl transition-all">✎</button>
                        <button onClick={() => onDeleteCert(c.id)} className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-rose-600 bg-slate-50 rounded-xl transition-all">✕</button>
                      </div>
                    </div>
                    <h4 className="text-lg font-black text-slate-800 tracking-tight leading-tight mb-1">{c.name}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">{c.issuer}</p>
                    
                    <div className="space-y-4 pt-4 border-t border-slate-50">
                      <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                        <span className="text-slate-400">Status</span>
                        <span className={getCertStatusStyle(c.status).split(' ').slice(1).join(' ')}>{c.status || 'Completed'}</span>
                      </div>
                      {c.status === TrainingStatus.PLANNED && c.deadline && (
                        <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                          <span className="text-slate-400">Target Date</span>
                          <span className={overdue ? 'text-rose-600' : 'text-slate-700'}>{c.deadline}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                        <span className="text-slate-400">Nomor</span>
                        <span className="text-slate-600 truncate max-w-[150px]">{c.certNumber || '-'}</span>
                      </div>
                      <a href={c.fileLink} target="_blank" rel="noreferrer" className="block w-full py-3 text-center bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-colors">Verify Record</a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pagination for Certifications */}
          {totalCertPages > 1 && (
            <div className="flex items-center justify-between bg-white px-6 lg:px-8 py-4 rounded-[2rem] border border-slate-100 shadow-sm">
              <button disabled={certPage === 1} onClick={() => setCertPage(p => p - 1)} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-colors">← Prev</button>
              <div className="flex gap-2">
                {[...Array(totalCertPages)].map((_, i) => (
                  <button key={i} onClick={() => setCertPage(i + 1)} className={`w-8 h-8 rounded-xl text-[10px] font-black transition-all ${certPage === i + 1 ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>{i + 1}</button>
                ))}
              </div>
              <button disabled={certPage === totalCertPages} onClick={() => setCertPage(p => p + 1)} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-colors">Next →</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* Sub-components */

const ActionCard: React.FC<{ timeframe: string; action: string; color: string; icon: string }> = ({ timeframe, action, color, icon }) => {
  const colorMap: any = {
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100'
  };
  return (
    <div className={`p-8 rounded-[2.5rem] border group hover:shadow-xl transition-all duration-500 ${colorMap[color]}`}>
       <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-white/50 flex items-center justify-center text-2xl shadow-inner">{icon}</div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">{timeframe}</p>
       </div>
       <p className="text-sm font-black leading-relaxed text-slate-800">
         {action}
       </p>
    </div>
  );
};

/* Dashboard Widgets */
const StatWidget: React.FC<{ title: string; value: string | number; icon: string; color: string }> = ({ title, value, icon, color }) => {
  const colorMap: any = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100'
  };
  return (
    <div className="bg-white p-7 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-6 group hover:shadow-md transition-all">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-inner border ${colorMap[color]}`}>{icon}</div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <p className="text-2xl font-black text-slate-900 tracking-tight">{value}</p>
      </div>
    </div>
  );
};

const SubTabButton: React.FC<{ active: boolean; onClick: () => void; label: string; icon: string }> = ({ active, onClick, label, icon }) => (
  <button 
    onClick={onClick} 
    className={`flex items-center gap-2 px-4 md:px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border shrink-0 snap-center ${ 
      active ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'text-slate-400 hover:bg-white bg-slate-50/50 border-slate-100 hover:border-slate-200' 
    }`}
  >
    <span className="text-base">{icon}</span>
    <span className="whitespace-nowrap">{label}</span>
  </button>
);

/* Form Sub-components */

const SkillForm: React.FC<{ initialData?: Skill; onSubmit: (data: Partial<Skill>) => void; onCancel: () => void }> = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Skill>>(initialData || { name: '', category: SkillCategory.HARD, currentLevel: 3, requiredLevel: 5, status: SkillStatus.GAP, priority: SkillPriority.MEDIUM, actionPlan: '', lastUsed: new Date().getFullYear().toString() });
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Expertise Detail</h3>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Define your competency benchmarks</p>
      </div>
      <div className="space-y-5">
         <InputGroup label="Skill Title" value={formData.name || ''} onChange={v => setFormData({...formData, name: v})} placeholder="e.g. Strategic Tax Planning" />
         <div className="grid grid-cols-2 gap-5">
            <SelectGroup label="Classification" value={formData.category} onChange={v => setFormData({...formData, category: v as SkillCategory})} options={[SkillCategory.HARD, SkillCategory.SOFT]} />
            <SelectGroup label="Priority" value={formData.priority} onChange={v => setFormData({...formData, priority: v as SkillPriority})} options={[SkillPriority.CRITICAL, SkillPriority.HIGH, SkillPriority.MEDIUM, SkillPriority.LOW]} />
         </div>
         <div className="grid grid-cols-2 gap-5">
            <InputGroup label="Current Level (1-5)" type="number" value={formData.currentLevel || 1} onChange={v => setFormData({...formData, currentLevel: parseInt(v) || 1})} />
            <InputGroup label="Last Used (Year)" type="text" value={formData.lastUsed || ''} onChange={v => setFormData({...formData, lastUsed: v})} placeholder="2025" />
         </div>
         <SelectGroup label="Status" value={formData.status} onChange={v => setFormData({...formData, status: v as SkillStatus})} options={[SkillStatus.GAP, SkillStatus.ON_PROGRESS, SkillStatus.ACHIEVED]} />
         <div className="space-y-1.5">
           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Development Roadmap</label>
           <textarea placeholder="Outline your improvement plan..." rows={3} className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-bold resize-none text-slate-700" value={formData.actionPlan} onChange={e => setFormData({...formData, actionPlan: e.target.value})} />
         </div>
      </div>
      <div className="flex gap-4 pt-4">
        <button onClick={onCancel} className="flex-1 py-5 text-slate-400 font-black uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition-colors">Cancel</button>
        <button onClick={() => onSubmit(formData)} className="flex-1 py-5 bg-blue-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all hover:bg-blue-700">Save Skill</button>
      </div>
    </div>
  );
};

const TrainingForm: React.FC<{ initialData?: Training; onSubmit: (data: Partial<Training>) => void; onCancel: () => void }> = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Training>>(initialData || { 
    name: '', 
    provider: '', 
    cost: 0, 
    date: new Date().toISOString().split('T')[0], 
    topic: '', 
    status: TrainingStatus.ON_PROCESS, 
    notes: '',
    progress: 0,
    deadline: '',
    priority: SkillPriority.MEDIUM
  });

  const [isRange, setIsRange] = useState(initialData?.date.includes(' - ') || false);
  const [startDate, setStartDate] = useState(initialData?.date.split(' - ')[0] || new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(initialData?.date.split(' - ')[1] || '');

  // Logika otomatis progres 100% saat status Completed
  useEffect(() => {
    if (formData.status === TrainingStatus.COMPLETED && formData.progress !== 100) {
      setFormData(prev => ({ ...prev, progress: 100 }));
    }
  }, [formData.status]);

  useEffect(() => {
    const finalDate = isRange && endDate ? `${startDate} - ${endDate}` : startDate;
    setFormData(prev => ({ ...prev, date: finalDate }));
  }, [startDate, endDate, isRange]);

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Learning Record</h3>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Track your educational growth</p>
      </div>
      <div className="space-y-5">
         <InputGroup label="Course Title" value={formData.name || ''} onChange={v => setFormData({...formData, name: v})} placeholder="e.g. Advanced Tax Compliance" />
         
         <div className="grid grid-cols-2 gap-5">
            <InputGroup label="Academy / Provider" value={formData.provider || ''} onChange={v => setFormData({...formData, provider: v})} placeholder="Klikpajak" />
            <InputGroup label="Investment (IDR)" type="number" value={formData.cost || 0} onChange={v => setFormData({...formData, cost: parseInt(v) || 0})} />
         </div>

         {/* Time Logic: Single or Range */}
         <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Waktu Pelatihan</label>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button type="button" onClick={() => setIsRange(false)} className={`px-3 py-1 text-[9px] font-black rounded-md transition-all ${!isRange ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>Single</button>
                <button type="button" onClick={() => setIsRange(true)} className={`px-3 py-1 text-[9px] font-black rounded-md transition-all ${isRange ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>Range</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <InputGroup label={isRange ? "Mulai" : "Tanggal"} type="date" value={startDate} onChange={v => setStartDate(v)} />
               {isRange && <InputGroup label="Berakhir" type="date" value={endDate} onChange={v => setEndDate(v)} />}
            </div>
         </div>

         <div className="grid grid-cols-2 gap-5">
            <SelectGroup label="Status" value={formData.status} onChange={v => setFormData({...formData, status: v as TrainingStatus})} options={[TrainingStatus.PLANNED, TrainingStatus.ON_PROCESS, TrainingStatus.COMPLETED]} />
            <SelectGroup label="Priority" value={formData.priority} onChange={v => setFormData({...formData, priority: v as SkillPriority})} options={[SkillPriority.CRITICAL, SkillPriority.HIGH, SkillPriority.MEDIUM, SkillPriority.LOW]} />
         </div>

         <div className="grid grid-cols-2 gap-5">
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Progress (1-100%)</label>
               <div className="flex items-center gap-4">
                  <input 
                    type="range" min="0" max="100" 
                    className="flex-1 accent-blue-600 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                    value={formData.progress || 0} 
                    onChange={e => setFormData({...formData, progress: parseInt(e.target.value) || 0})} 
                  />
                  <span className="text-xs font-black text-blue-600 min-w-[30px]">{formData.progress || 0}%</span>
               </div>
            </div>
            <InputGroup label="Deadline Pelatihan" type="date" value={formData.deadline || ''} onChange={v => setFormData({...formData, deadline: v})} />
         </div>

         <InputGroup label="Material Link" value={formData.link || ''} onChange={v => setFormData({...formData, link: v})} placeholder="https://..." />
         <textarea placeholder="Key takeaways..." rows={3} className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-bold resize-none text-slate-700" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
      </div>
      <div className="flex gap-4 pt-4">
        <button onClick={onCancel} className="flex-1 py-5 text-slate-400 font-black uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition-colors">Cancel</button>
        <button onClick={() => onSubmit(formData)} className="flex-1 py-5 bg-amber-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all hover:bg-amber-600">Save Record</button>
      </div>
    </div>
  );
};

const CertForm: React.FC<{ skills: Skill[], initialData?: Certification; onSubmit: (data: Partial<Certification>) => void; onCancel: () => void }> = ({ skills, initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Certification>>(initialData || { 
    name: '', 
    issuer: '', 
    date: new Date().toISOString().split('T')[0], 
    relatedSkill: '', 
    fileLink: '', 
    isActive: true,
    status: TrainingStatus.COMPLETED,
    deadline: '',
    certNumber: ''
  });

  const [isCustomSkill, setIsCustomSkill] = useState(false);
  const skillOptions = useMemo(() => skills.map(s => s.name), [skills]);

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Professional Credential</h3>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Formalize your expertise</p>
      </div>
      <div className="space-y-5">
         <InputGroup label="Nama Sertifikasi" value={formData.name || ''} onChange={v => setFormData({...formData, name: v})} placeholder="Brevet A & B" />
         
         <div className="grid grid-cols-2 gap-5">
            <InputGroup label="Penyelenggara" value={formData.issuer || ''} onChange={v => setFormData({...formData, issuer: v})} placeholder="e.g. IKPI" />
            <InputGroup label="Nomor Sertifikat" value={formData.certNumber || ''} onChange={v => setFormData({...formData, certNumber: v})} placeholder="e.g. CERT-12345" />
         </div>

         <div className="grid grid-cols-2 gap-5">
            <SelectGroup label="Status" value={formData.status} onChange={v => setFormData({...formData, status: v as TrainingStatus})} options={[TrainingStatus.PLANNED, TrainingStatus.ON_PROCESS, TrainingStatus.COMPLETED]} />
            <div className="space-y-1.5">
               <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Related Skill</label>
                  <button type="button" onClick={() => setIsCustomSkill(!isCustomSkill)} className="text-[8px] font-black text-blue-600 uppercase tracking-widest hover:underline">{isCustomSkill ? 'Dropdown' : 'Custom Input'}</button>
               </div>
               {isCustomSkill ? (
                 <input className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-bold text-xs" value={formData.relatedSkill} onChange={e => setFormData({...formData, relatedSkill: e.target.value})} placeholder="Input custom skill..." />
               ) : (
                 <select className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none bg-white font-bold text-xs" value={formData.relatedSkill} onChange={e => setFormData({...formData, relatedSkill: e.target.value})}>
                    <option value="">Pilih Skill...</option>
                    {skillOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                 </select>
               )}
            </div>
         </div>

         <div className="grid grid-cols-2 gap-5">
            <InputGroup label="Date Issued / Achieved" type="date" value={formData.date || ''} onChange={v => setFormData({...formData, date: v})} />
            {formData.status === TrainingStatus.PLANNED && (
              <InputGroup label="Deadline (If Planned)" type="date" value={formData.deadline || ''} onChange={v => setFormData({...formData, deadline: v})} />
            )}
         </div>
         
         <InputGroup label="Verification Link" value={formData.fileLink || ''} onChange={v => setFormData({...formData, fileLink: v})} placeholder="https://drive..." />
      </div>
      <div className="flex gap-4 pt-4">
        <button onClick={onCancel} className="flex-1 py-5 text-slate-400 font-black uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition-colors">Cancel</button>
        <button onClick={() => onSubmit(formData)} className="flex-1 py-5 bg-emerald-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all hover:bg-emerald-600">Save Cert</button>
      </div>
    </div>
  );
};

const InputGroup: React.FC<{ label: string, value: string | number, onChange: (v: string) => void, type?: string, placeholder?: string }> = ({ label, value, onChange, type = "text", placeholder }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <input 
      type={type} 
      placeholder={placeholder}
      className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-bold focus:ring-4 focus:ring-blue-500/5 transition-all text-slate-700 text-xs" 
      value={value} 
      onChange={e => onChange(e.target.value)} 
    />
  </div>
);

const SelectGroup: React.FC<{ label: string, value: any, onChange: (v: string) => void, options: string[] }> = ({ label, value, onChange, options }) => (
  <div className="space-y-1.5">
    {label && <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>}
    <select 
      className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none bg-white font-bold cursor-pointer hover:bg-slate-50 transition-colors text-slate-700 text-xs" 
      value={value} 
      onChange={e => onChange(e.target.value)} 
    >
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

export default SkillTracker;
