
import React, { useState } from 'react';
import { AppData, AiStrategy, AiRecommendation, ToDoTask, Training, TrainingStatus, SkillPriority, Certification } from '../../../types';
import { analyzeSkillGap } from '../../../services/geminiService';

interface AiStrategistProps {
  data: AppData;
  onSaveStrategy?: (strategy: AiStrategy) => void;
  onAddTodo?: (task: ToDoTask) => void;
  onAddTraining: (t: Training) => void;
  onAddCert: (c: Certification) => void;
  showToast: (m: string, t?: 'success' | 'error' | 'info') => void;
}

const AiStrategist: React.FC<AiStrategistProps> = ({ 
  data, onSaveStrategy, onAddTodo, onAddTraining, onAddCert, showToast 
}) => {
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [aiStatusMessage, setAiStatusMessage] = useState('');
  const [aiLang, setAiLang] = useState<'id' | 'en'>('id');
  const [aiResults, setAiResults] = useState<any>(data?.aiStrategies && data.aiStrategies.length > 0 ? data.aiStrategies[0] : null);

  const [confirmation, setConfirmation] = useState<{
    type: 'todo' | 'training' | 'cert';
    item: any;
    meta?: string;
  } | null>(null);

  // Helper untuk merender data mentah dari AI secara aman guna menghindari React Error #31
  const safeRender = (val: any, fallback: string = ""): string => {
    if (val === null || val === undefined) return fallback;
    if (typeof val === 'string' || typeof val === 'number') return String(val);
    if (typeof val === 'object') {
      if (val.name) return String(val.name);
      if (val.text) return String(val.text);
      if (val.label) return String(val.label);
      if (val.major) return String(val.major);
      return fallback;
    }
    return fallback;
  };

  const handleRunAiStrategist = async () => {
    setIsAiAnalyzing(true);
    setAiProgress(0);
    
    const progressInterval = setInterval(() => {
      setAiProgress(prev => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 5;
      });
    }, 1200);

    try {
      const result = await analyzeSkillGap(data, aiLang);
      if (result) {
        clearInterval(progressInterval);
        setAiProgress(100);
        
        const strategyEntry: any = {
          ...result,
          version: (data.aiStrategies?.length || 0) + 1,
          date: new Date().toISOString(),
          language: aiLang
        };
        
        setAiResults(strategyEntry);
        if (onSaveStrategy) onSaveStrategy(strategyEntry);
        
        setTimeout(() => {
          setIsAiAnalyzing(false);
          showToast("Strategi Karir Baru Berhasil Disusun! 🧠", 'success');
        }, 800);
      } else {
        throw new Error("Data AI kosong");
      }
    } catch (e: any) {
      clearInterval(progressInterval);
      setIsAiAnalyzing(false);
      showToast(e.message || "Gagal kalibrasi AI. Periksa koneksi atau API Key.", 'error');
    }
  };

  const executeAddAction = () => {
    if (!confirmation) return;
    const { type, item } = confirmation;

    if (type === 'todo' && onAddTodo) {
      onAddTodo({ id: Math.random().toString(36).substr(2, 9), task: safeRender(item), category: 'Pengembangan Diri', status: 'Pending', createdAt: new Date().toISOString(), source: 'AI' });
      showToast("Ditambahkan ke Daily Plan! 🚀");
    } else if (type === 'training') {
      onAddTraining({ id: Math.random().toString(36).substr(2, 9), name: safeRender(item.name), provider: safeRender(item.provider), cost: 0, date: new Date().toISOString().split('T')[0], topic: safeRender(item.detail), status: TrainingStatus.PLANNED, link: '', notes: safeRender(item.priceRange), progress: 0, deadline: '', priority: SkillPriority.MEDIUM });
      showToast("Training dicatat! 📖");
    } else if (type === 'cert') {
      onAddCert({ id: Math.random().toString(36).substr(2, 9), name: safeRender(item.name), issuer: safeRender(item.provider), date: '', expiryDate: '', isActive: false, relatedSkill: safeRender(item.detail), fileLink: '', status: TrainingStatus.PLANNED });
      showToast("Certification dicatat! 📜");
    }
    setConfirmation(null);
  };

  return (
    <div className="space-y-10">
      {confirmation && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[2000] flex items-center justify-center p-6">
           <div className="bg-white max-w-md w-full rounded-[3.5rem] p-10 border border-slate-100 shadow-2xl animate-in zoom-in duration-300">
              <div className="text-center">
                 <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner"><i className="bi bi-question-lg text-3xl"></i></div>
                 <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">Konfirmasi</h3>
                 <p className="text-slate-400 font-bold text-xs uppercase tracking-widest leading-relaxed mb-10">Tambahkan ke Rencana Anda?</p>
                 <div className="flex gap-4">
                    <button onClick={() => setConfirmation(null)} className="flex-1 py-4 bg-slate-50 text-slate-400 font-black rounded-2xl uppercase text-[10px] tracking-widest">Batal</button>
                    <button onClick={executeAddAction} className="flex-[2] py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-xl hover:bg-indigo-700 transition-all">Ya, Tambahkan!</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      <div className="bg-slate-950 p-8 lg:p-12 rounded-[3.5rem] text-white relative overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.4)]">
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-10">
            <div className="w-20 h-20 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-4xl shadow-[0_0_50px_rgba(79,70,229,0.4)]">🧠</div>
            <div className="flex gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
              <button onClick={() => setAiLang('id')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${aiLang === 'id' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-white'}`}>ID</button>
              <button onClick={() => setAiLang('en')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${aiLang === 'en' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-white'}`}>EN</button>
            </div>
          </div>
          <h3 className="text-3xl lg:text-4xl font-black tracking-tighter mb-6 uppercase leading-none">AI Qualification Strategist</h3>
          <p className="text-slate-400 text-base lg:text-lg max-w-2xl leading-relaxed font-medium">Asisten cerdas untuk mengukur skor kesiapan dan merekomendasikan langkah mikro strategis.</p>
          {isAiAnalyzing && (
            <div className="mt-10 space-y-6">
               <div className="flex justify-between items-end mb-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 animate-pulse">Menghitung Strategi...</p>
                  <p className="text-2xl font-black text-white">{Math.round(aiProgress)}%</p>
               </div>
               <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/10">
                  <div className="h-full bg-gradient-to-r from-indigo-600 to-blue-500 rounded-full transition-all duration-700" style={{ width: `${aiProgress}%` }}></div>
               </div>
            </div>
          )}
          <div className="mt-10"><button onClick={handleRunAiStrategist} disabled={isAiAnalyzing} className="px-12 py-5 bg-indigo-600 text-white font-black rounded-[2rem] uppercase text-[11px] shadow-xl hover:bg-indigo-500 active:scale-95 disabled:opacity-50 transition-all">{isAiAnalyzing ? 'MEMPROSES...' : 'UPDATE STRATEGI KARIR'}</button></div>
        </div>
      </div>

      {aiResults && !isAiAnalyzing && (
        <div className="space-y-10 animate-in zoom-in duration-700">
           {/* NEXT SMALL ACTIONS */}
           <div className="bg-white p-10 lg:p-14 rounded-[4rem] shadow-sm border border-slate-100 text-center">
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mb-12">Langkah Cepat (Apa yang harus kamu lakukan minggu ini)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <ActionCard timeframe="MINGGU INI" action={safeRender(aiResults.immediateActions?.weekly)} color="rose" icon="🗓️" onPlan={() => setConfirmation({ type: 'todo', item: aiResults.immediateActions?.weekly })} />
                 <ActionCard timeframe="BULAN INI" action={safeRender(aiResults.immediateActions?.monthly)} color="indigo" icon="🗓️" onPlan={() => setConfirmation({ type: 'todo', item: aiResults.immediateActions?.monthly })} />
                 <ActionCard timeframe="BULAN DEPAN" action={safeRender(aiResults.immediateActions?.nextMonth)} color="emerald" icon="🚀" onPlan={() => setConfirmation({ type: 'todo', item: aiResults.immediateActions?.nextMonth })} />
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
             {/* READINESS INDEX */}
             <div className="lg:col-span-4 bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100 flex flex-col items-center text-center">
                <div className="relative mb-8 flex items-center justify-center">
                   <div className="w-48 h-48 rounded-full border-[14px] border-slate-50 flex flex-col items-center justify-center relative shadow-inner bg-slate-50/20">
                      <p className="text-6xl font-black text-slate-900 tracking-tighter leading-none">{safeRender(aiResults.readinessScore, "0")}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">/ 100</p>
                      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100"><circle cx="50" cy="50" r="43" fill="transparent" stroke="currentColor" strokeWidth="14" className="text-indigo-600" strokeDasharray="270.17" strokeDashoffset={270.17 - (270.17 * (Number(aiResults.readinessScore) || 0) / 100)} strokeLinecap="round" /></svg>
                   </div>
                </div>
                <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-2">Skor Kesiapan Kerja</h4>
                <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight mb-2">Untuk Posisi Target:</p>
                <p className="text-base font-black text-indigo-600 uppercase tracking-tighter leading-tight bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100">{safeRender(aiResults.targetGoal || data.profile.shortTermTarget)}</p>
                <p className="text-[8px] text-slate-400 font-bold uppercase max-w-[200px] leading-relaxed mt-4">(Seberapa siap kamu dipromosikan atau diterima kerja di posisi ini)</p>
             </div>

             {/* EXECUTIVE ANALYSIS */}
             <div className="lg:col-span-8 bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100 h-full flex flex-col justify-center">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-8">Analisis Peluang Karir (Prediksi AI tentang masa depanmu)</h4>
                <p className="text-base text-slate-600 leading-relaxed font-medium italic">"{safeRender(aiResults.scoreExplanation || 'AI sedang menganalisis potensi Anda...')}"</p>
                <div className="mt-8 p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100 text-sm font-black text-indigo-900 italic">"{safeRender(aiResults.motivation || 'Teruslah melangkah, masa depan Anda cerah!')}"</div>
             </div>
           </div>

           {/* REQUIREMENTS OVERVIEW */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 lg:p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex items-start gap-6">
                 <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-[1.75rem] flex items-center justify-center text-3xl shadow-inner shrink-0">⏳</div>
                 <div>
                    <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3">Standard Pengalaman Kerja</h4>
                    <p className="text-sm font-black text-slate-800 leading-relaxed uppercase">{safeRender(aiResults.experiencePrerequisites || "Minimal 2-3 tahun di posisi terkait")}</p>
                 </div>
              </div>
              <div className="bg-white p-8 lg:p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex items-start gap-6">
                 <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-[1.75rem] flex items-center justify-center text-3xl shadow-inner shrink-0">🎓</div>
                 <div>
                    <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3">Saran Pendidikan Formal</h4>
                    <p className="text-sm font-black text-slate-800 leading-relaxed uppercase">
                      {safeRender(aiResults.educationRecommendation?.strata || "Minimal Sarjana (S1)")} - {safeRender(aiResults.educationRecommendation?.major || aiResults.relevantEducation || "Jurusan Spesifik")}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold mt-2 italic">"{safeRender(aiResults.educationRecommendation?.detail || "Kualifikasi akademik yang direkomendasikan untuk menunjang daya saing Anda.")}"</p>
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* STRATEGIC RECOMMENDATIONS */}
              <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100">
                 <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] mb-8">Kursus & Sertifikasi Yang Disarankan AI</h4>
                 <div className="space-y-8">
                    <div>
                       <p className="text-[9px] font-black text-slate-400 uppercase mb-4 flex items-center gap-2"><span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>PELATIHAN (TRAINING)</p>
                       {Array.isArray(aiResults.recommendations?.trainings) && aiResults.recommendations.trainings.length > 0 ? aiResults.recommendations.trainings.map((t: AiRecommendation, i: number) => (
                         <RecommendationCard key={i} item={t} type="training" onPlan={() => setConfirmation({ type: 'training', item: t })} color="indigo" safeRender={safeRender} />
                       )) : <p className="text-[10px] text-slate-400 italic">Tidak ada rekomendasi pelatihan saat ini.</p>}
                    </div>
                    <div>
                       <p className="text-[9px] font-black text-slate-400 uppercase mb-4 flex items-center gap-2"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>SERTIFIKASI (CERTIFICATION)</p>
                       {Array.isArray(aiResults.recommendations?.certifications) && aiResults.recommendations.certifications.length > 0 ? aiResults.recommendations.certifications.map((c: AiRecommendation, i: number) => (
                         <RecommendationCard key={i} item={c} type="cert" onPlan={() => setConfirmation({ type: 'cert', item: c })} color="emerald" safeRender={safeRender} />
                       )) : <p className="text-[10px] text-slate-400 italic">Tidak ada rekomendasi sertifikasi saat ini.</p>}
                    </div>
                 </div>
              </div>

              {/* CRITICAL GAPS */}
              <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100 h-full">
                 <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.4em] mb-8">Skill yang Masih Kurang (Celah yang harus segera kamu tutup)</h4>
                 <div className="space-y-6">
                    {Array.isArray(aiResults.criticalGaps) && aiResults.criticalGaps.length > 0 ? aiResults.criticalGaps.map((gap: any, i: number) => (
                      <div key={i} className="p-6 bg-rose-50/40 rounded-[2.5rem] border border-rose-100">
                        <div className="flex justify-between mb-3"><p className="font-black text-slate-800 text-sm uppercase">{safeRender(gap.skill)}</p><span className="px-3 py-1 bg-rose-600 text-white text-[8px] font-black rounded-full uppercase">{safeRender(gap.priority)}</span></div>
                        <p className="text-[12px] text-slate-600 leading-relaxed font-bold italic opacity-70">"{safeRender(gap.why)}"</p>
                      </div>
                    )) : <p className="text-[10px] text-slate-400 italic p-6">Selamat! Tidak ada gap kritis yang terdeteksi.</p>}
                 </div>
              </div>
           </div>

           {/* EXPERIENCE ROADMAP PREREQUISITES */}
           <div className="bg-white p-10 lg:p-14 rounded-[4rem] shadow-sm border border-slate-100">
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mb-12">Peta Jalan Pengalaman Kerja (Jalur Posisi & Durasi)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                 {Array.isArray(aiResults.experienceRoadmap) && aiResults.experienceRoadmap.length > 0 ? aiResults.experienceRoadmap.map((step: any, i: number) => (
                   <div key={i} className="relative pl-14 group">
                      <div className="absolute left-0 top-0 w-10 h-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-sm shadow-xl group-hover:scale-110 transition-transform">{i + 1}</div>
                      <h5 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-2">{safeRender(step.position)}</h5>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase border border-indigo-100">Bidang: {safeRender(step.field || 'Relevan')}</span>
                        <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase border border-slate-200">Durasi: {safeRender(step.duration)}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-medium italic">"Fokus: {safeRender(step.focus)}"</p>
                   </div>
                 )) : (
                   <div className="col-span-full py-10 text-center text-slate-400 italic">Analisis roadmap pengalaman sedang disinkronkan...</div>
                 )}
              </div>
           </div>

           {/* ROADMAP DETAILED STEPS */}
           <div className="bg-white p-10 lg:p-14 rounded-[4rem] shadow-sm border border-slate-100">
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mb-12">Langkah Mikro Strategis (Urutan Eksekusi)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                 {Array.isArray(aiResults.roadmapSteps) && aiResults.roadmapSteps.length > 0 ? aiResults.roadmapSteps.map((step: any, i: number) => (
                   <div key={i} className="relative pl-14">
                      <div className="absolute left-0 top-0 w-10 h-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-sm shadow-xl">{i + 1}</div>
                      <h5 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-2">{safeRender(step.title)}</h5>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{safeRender(step.detail)}</p>
                   </div>
                 )) : <p className="col-span-full text-center text-slate-400 italic">Menyusun langkah mikro...</p>}
              </div>
           </div>

           {/* EXECUTIVE SUMMARY CONCLUSION */}
           <div className="bg-indigo-600 p-10 lg:p-14 rounded-[4rem] shadow-2xl text-white">
              <h4 className="text-[11px] font-black text-white/50 uppercase tracking-[0.4em] mb-8 text-center">KESIMPULAN STRATEGIS</h4>
              <p className="text-lg lg:text-xl font-bold leading-relaxed text-center max-w-4xl mx-auto italic">"{safeRender(aiResults.executiveSummary || 'Strategi karier Anda telah siap untuk dieksekusi.')}"</p>
           </div>
        </div>
      )}
    </div>
  );
};

const ActionCard = ({ timeframe, action, color, icon, onPlan }: any) => {
  const colors: any = { rose: 'bg-rose-50 text-rose-600', indigo: 'bg-indigo-50 text-indigo-600', emerald: 'bg-emerald-50 text-emerald-600' };
  const btns: any = { rose: 'bg-rose-600 hover:bg-rose-700', indigo: 'bg-indigo-600 hover:bg-indigo-700', emerald: 'bg-emerald-600 hover:bg-emerald-700' };
  return (
    <div className={`p-8 rounded-[3rem] border-2 group hover:shadow-2xl transition-all ${colors[color]}`}>
       <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-2xl shadow-inner mb-6 group-hover:scale-110 transition-transform">{icon}</div>
       <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 opacity-70">{timeframe}</p>
       <p className="text-xs font-bold leading-relaxed flex-1 mb-8">{action || "Memproses..."}</p>
       <button onClick={onPlan} className={`w-full py-4 text-white text-[9px] font-black uppercase rounded-2xl transition-all tracking-widest ${btns[color]}`}>+ Add to Daily Plan 🚀</button>
    </div>
  );
};

const RecommendationCard = ({ item, onPlan, color, safeRender }: any) => {
  const colors: any = { indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100', emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
  const btns: any = { indigo: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100', emerald: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100' };
  return (
    <div className={`p-6 rounded-[2.5rem] border group hover:shadow-lg transition-all duration-500 flex flex-col mb-4 ${colors[color]}`}>
      <div className="flex-1 mb-4">
          <p className="text-xs font-black text-slate-800 uppercase tracking-tight leading-snug">{safeRender(item.name)}</p>
          <div className="flex flex-wrap gap-4 mt-3">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">📅 {safeRender(item.schedule)}</span>
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">💰 {safeRender(item.priceRange)}</span>
          </div>
      </div>
      <button onClick={onPlan} className={`w-full py-3 text-white text-[9px] font-black uppercase rounded-xl shadow-lg active:scale-95 transition-all tracking-widest ${btns[color]}`}>Tambahkan ke Plan</button>
    </div>
  );
};

export default AiStrategist;
