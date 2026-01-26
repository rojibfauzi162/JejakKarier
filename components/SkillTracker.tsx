
import React, { useState, useEffect, useMemo } from 'react';
import { AppData, Skill, Training, Certification, SkillStatus, SkillCategory, SkillPriority, TrainingStatus, AiStrategy, AiRecommendation } from '../types';
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

  // States for Detail View
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<{type: 'training' | 'cert', data: any} | null>(null);
  
  // State for Image Preview Pop-up
  const [certPreviewUrl, setCertPreviewUrl] = useState<string | null>(null);

  // AI Strategist States
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [aiStatusMessage, setAiStatusMessage] = useState('');
  const [aiResults, setAiResults] = useState<AiStrategy | null>(data?.aiStrategies && data.aiStrategies.length > 0 ? data.aiStrategies[0] : null);
  const [aiLang, setAiLang] = useState<'id' | 'en'>('id');
  const [showHistory, setShowHistory] = useState(false);

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

  const openAddForm = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const openEditForm = (item: any) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const openDetail = (item: any, type: 'training' | 'cert') => {
    setViewingItem({ type, data: item });
    setIsDetailOpen(true);
  };

  // Helper to create data fingerprint for change validation
  const getDataFingerprint = () => {
    if (!data) return "";
    return JSON.stringify({
      profile: {
        pos: data.profile.currentPosition,
        com: data.profile.currentCompany,
        st: data.profile.shortTermTarget,
        lt: data.profile.longTermTarget
      },
      skills: data.skills.map(s => ({n: s.name, l: s.currentLevel})),
      trainings: data.trainings.map(t => ({n: t.name, s: t.status})),
      certs: data.certifications.map(c => ({n: c.name, s: c.status}))
    });
  };

  const handleRunAiStrategist = async () => {
    if (!data) return;
    
    // Check if data has changed since last analysis
    const currentFingerprint = getDataFingerprint();
    if (aiResults?.dataFingerprint === currentFingerprint && !showHistory) {
      alert(aiLang === 'id' ? "Data profil & kompetensi Anda belum berubah sejak analisis terakhir. Menampilkan strategi yang sudah ada." : "Profile & competency data hasn't changed since last analysis. Displaying current strategy.");
      return;
    }

    setIsAiAnalyzing(true);
    setAiProgress(0);
    
    // Progress messages mapping
    const messages = aiLang === 'id' ? [
      "Menginisialisasi Engine...",
      "Menganalisis Profil Pengguna...",
      "Memindai Matriks Kompetensi...",
      "Mendeteksi Skill Gap Kritis...",
      "Menghitung Indeks Kesiapan...",
      "Mengkurasi Rekomendasi Pelatihan...",
      "Menyusun Roadmap Strategis...",
      "Finalisasi Strategi Karir..."
    ] : [
      "Initializing Engine...",
      "Analyzing User Profile...",
      "Scanning Competency Matrix...",
      "Detecting Critical Skill Gaps...",
      "Calculating Readiness Index...",
      "Curating Training Recommendations...",
      "Structuring Strategic Roadmap...",
      "Finalizing Career Strategy..."
    ];

    setAiStatusMessage(messages[0]);

    // Interval to simulate progress while waiting for API
    const progressInterval = setInterval(() => {
      setAiProgress(prev => {
        if (prev >= 95) return prev;
        const next = prev + (Math.random() * 5);
        
        // Update message based on progress
        const msgIndex = Math.min(Math.floor((next / 100) * messages.length), messages.length - 1);
        setAiStatusMessage(messages[msgIndex]);
        
        return next;
      });
    }, 1200);

    try {
      const result = await analyzeSkillGap(data, aiLang);
      if (result) {
        clearInterval(progressInterval);
        setAiProgress(100);
        setAiStatusMessage(aiLang === 'id' ? 'Strategi Berhasil Disusun!' : 'Strategy Successfully Generated!');

        const newVersion = (data.aiStrategies?.length || 0) + 1;
        const strategyEntry: AiStrategy = {
          ...result,
          version: newVersion,
          date: new Date().toISOString(),
          language: aiLang,
          dataFingerprint: currentFingerprint
        };

        // Delay slighty so user sees 100%
        setTimeout(() => {
          setAiResults(strategyEntry);
          setIsAiAnalyzing(false);
          if (onSaveStrategy) onSaveStrategy(strategyEntry);
        }, 800);
      } else {
        // Handle failure where result is null but no exception thrown
        clearInterval(progressInterval);
        setIsAiAnalyzing(false);
        alert(aiLang === 'id' ? "Gagal memproses strategi. AI tidak mengembalikan data yang valid." : "Failed to process strategy. AI returned invalid data.");
      }
    } catch (e) {
      console.error("AI Analysis error:", e);
      clearInterval(progressInterval);
      setIsAiAnalyzing(false);
      alert(aiLang === 'id' ? "Gagal melakukan kalibrasi AI. Silakan coba lagi." : "AI calibration failed. Please try again.");
    }
  };

  const handlePlanRecommendation = (item: AiRecommendation, type: 'training' | 'cert') => {
    if (type === 'training') {
      const newTraining: Training = {
        id: Math.random().toString(36).substr(2, 9),
        name: item.name,
        provider: item.provider,
        cost: 0,
        date: new Date().toISOString().split('T')[0],
        topic: item.detail,
        status: TrainingStatus.PLANNED,
        link: item.url || '',
        notes: `Recommended by AI. Price: ${item.priceRange}. Schedule: ${item.schedule}`,
        progress: 0,
        deadline: '',
        priority: SkillPriority.MEDIUM
      };
      onAddTraining(newTraining);
    } else {
      const newCert: Certification = {
        id: Math.random().toString(36).substr(2, 9),
        name: item.name,
        issuer: item.provider,
        date: '',
        expiryDate: '',
        isActive: false,
        relatedSkill: item.detail,
        fileLink: item.url || '',
        status: TrainingStatus.PLANNED,
        deadline: ''
      };
      onAddCert(newCert);
    }
    alert(`${item.name} telah ditambahkan ke tab ${type === 'training' ? 'Training History' : 'Certification'} dengan status Planned.`);
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

  const isCertOverdue = (cert: Certification) => {
    if (cert.status === TrainingStatus.PLANNED && cert.deadline) {
      return new Date(cert.deadline) < new Date();
    }
    return false;
  };

  const platforms = useMemo(() => {
    const p = new Set(trainings.map(t => t.provider));
    return ['All', ...Array.from(p)];
  }, [trainings]);

  const certRelatedSkills = useMemo(() => {
    const s = new Set(certs.map(c => c.relatedSkill).filter(Boolean));
    return ['All', ...Array.from(s)];
  }, [certs]);

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

  useEffect(() => { setTrainPage(1); }, [fPriority, fStatus, fPlatform, fTime]);
  useEffect(() => { setCertPage(1); }, [fCertStatus, fCertSkill, fCertTime]);

  const totalCourses = trainings.length;
  const onProcessCount = trainings.filter(t => t.status === TrainingStatus.ON_PROCESS).length;
  const completedCount = trainings.filter(t => t.status === TrainingStatus.COMPLETED).length;
  const percentage = totalCourses > 0 ? ((completedCount / totalCourses) * 100).toFixed(0) : "0";
  const totalCost = trainings.reduce((acc, t) => acc + (t.cost || 0), 0);

  const certCount = certs.length;
  const certPlannedCount = certs.filter(c => c.status === TrainingStatus.PLANNED).length;
  const certOnProcessCount = certs.filter(c => c.status === TrainingStatus.ON_PROCESS).length;
  const certCompletedCount = certs.filter(c => !c.status || c.status === TrainingStatus.COMPLETED).length;

  const prevScore = data?.aiStrategies && data.aiStrategies.length > 1 ? data.aiStrategies[1].readinessScore : null;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-16">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="w-full">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Growth & Intelligence</h2>
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

      {activeSubTab === 'learning' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-top duration-500">
          <StatWidget title="Total Course" value={totalCourses} icon="📚" color="blue" />
          <StatWidget title="In Progress" value={onProcessCount} icon="⏳" color="amber" />
          <StatWidget title="Achievement" value={`${percentage}%`} icon="🔥" color="emerald" />
          <StatWidget title="Investment" value={`Rp ${(totalCost/1000).toFixed(0)}k`} icon="💎" color="purple" />
        </div>
      )}

      {activeSubTab === 'certs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-top duration-500">
          <StatWidget title="Total Certs" value={certCount} icon="📜" color="blue" />
          <StatWidget title="Planned" value={certPlannedCount} icon="📅" color="amber" />
          <StatWidget title="On Process" value={certOnProcessCount} icon="⏳" color="indigo" />
          <StatWidget title="Achieved" value={certCompletedCount} icon="🏆" color="emerald" />
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[110] p-4">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl p-8 lg:p-12 animate-in zoom-in duration-300 overflow-y-auto max-h-[90vh]">
            {activeSubTab === 'skills' && <SkillForm initialData={editingItem} onSubmit={(d) => { editingItem ? onUpdateSkill(d as Skill) : onAddSkill({ ...d, id: Math.random().toString() } as Skill); setIsFormOpen(false); }} onCancel={() => setIsFormOpen(false)} />}
            {activeSubTab === 'learning' && <TrainingForm initialData={editingItem} onSubmit={(d) => { editingItem ? onUpdateTraining(d as Training) : onAddTraining({ ...d, id: Math.random().toString() } as Training); setIsFormOpen(false); }} onCancel={() => setIsFormOpen(false)} />}
            {activeSubTab === 'certs' && <CertForm skills={skills} initialData={editingItem} onSubmit={(d) => { editingItem ? onUpdateCert(d as Certification) : onAddCert({ ...d, id: Math.random().toString() } as Certification); setIsFormOpen(false); }} onCancel={() => setIsFormOpen(false)} />}
          </div>
        </div>
      )}

      {isDetailOpen && viewingItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[120] p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-8 lg:p-12 animate-in zoom-in duration-300 overflow-y-auto max-h-[90vh]">
             <div className="flex justify-between items-start mb-8">
                <div>
                   <h3 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight uppercase">Record Detail</h3>
                   <p className="text-slate-400 font-bold text-[10px] tracking-widest mt-1 uppercase">Comprehensive view of your {viewingItem.type === 'training' ? 'learning history' : 'credential'}</p>
                </div>
                <button onClick={() => setIsDetailOpen(false)} className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-slate-900 rounded-full transition-colors font-black">✕</button>
             </div>
             
             {viewingItem.type === 'training' ? (
               <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <DetailGroup label="Course Title" val={viewingItem.data.name} />
                     <DetailGroup label="Academy / Provider" val={viewingItem.data.provider} />
                     <DetailGroup label="Topic" val={viewingItem.data.topic} />
                     <DetailGroup label="Date" val={viewingItem.data.date} />
                     <DetailGroup label="Investment" val={`Rp ${viewingItem.data.cost?.toLocaleString()}`} />
                     <DetailGroup label="Priority" val={viewingItem.data.priority} />
                  </div>
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Notes & Reflection</p>
                     <p className="text-sm font-medium text-slate-600 italic leading-relaxed">"{viewingItem.data.notes || 'No notes available.'}"</p>
                  </div>
                  {viewingItem.data.certLink && (
                    <div className="pt-4 border-t border-slate-100">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Validation Evidence</p>
                       <button 
                        onClick={() => setCertPreviewUrl(viewingItem.data.certLink)}
                        className="flex items-center justify-center gap-3 w-full py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
                       >
                         View Certificate Document 📜
                       </button>
                    </div>
                  )}
               </div>
             ) : (
               <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <DetailGroup label="Credential Name" val={viewingItem.data.name} />
                     <DetailGroup label="Issuer" val={viewingItem.data.issuer} />
                     <DetailGroup label="Cert Number" val={viewingItem.data.certNumber || '-'} />
                     <DetailGroup label="Related Skill" val={viewingItem.data.relatedSkill} />
                     <DetailGroup label="Status" val={viewingItem.data.status || 'Completed'} />
                     <DetailGroup label="Date Issued" val={viewingItem.data.date || '-'} />
                  </div>
                  {viewingItem.data.fileLink && (
                    <div className="pt-4 border-t border-slate-100">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Verification Asset</p>
                       <button 
                        onClick={() => setCertPreviewUrl(viewingItem.data.fileLink)}
                        className="flex items-center justify-center gap-3 w-full py-4 bg-emerald-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all"
                       >
                         Open Verified Record 📜
                       </button>
                    </div>
                  )}
               </div>
             )}
          </div>
        </div>
      )}

      {/* Pop-up Image Preview Modal */}
      {certPreviewUrl && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl flex items-center justify-center z-[200] p-4" onClick={() => setCertPreviewUrl(null)}>
          <div className="relative max-w-4xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
            <div className="absolute top-4 right-4 flex gap-2">
              <a href={certPreviewUrl} target="_blank" rel="noreferrer" className="w-10 h-10 bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-all shadow-xl">
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
              </a>
              <button onClick={() => setCertPreviewUrl(null)} className="w-10 h-10 bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-rose-600 transition-all shadow-xl font-black">✕</button>
            </div>
            
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
               <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-black">J</div>
               <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Document Integrity Preview</p>
            </div>

            <div className="bg-slate-100 min-h-[400px] flex items-center justify-center overflow-hidden">
               {certPreviewUrl.startsWith('data:image') || certPreviewUrl.match(/\.(jpeg|jpg|gif|png|webp)$/) ? (
                 <img src={certPreviewUrl} alt="Certificate Preview" className="max-w-full max-h-[80vh] object-contain shadow-2xl" />
               ) : (
                 <div className="p-20 text-center space-y-6">
                    <div className="text-6xl">📄</div>
                    <p className="font-black text-slate-800 uppercase tracking-tight">Dokumen Eksternal / PDF</p>
                    <p className="text-slate-400 text-xs font-medium max-w-xs mx-auto">Pratinjau langsung tidak tersedia untuk format ini. Silakan buka di tab baru.</p>
                    <a href={certPreviewUrl} target="_blank" rel="noreferrer" className="inline-block px-8 py-4 bg-blue-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-xl hover:bg-blue-700 transition-all">
                      Buka Dokumen Penuh ↗
                    </a>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'ai' && (
        <div className="space-y-10 animate-in fade-in duration-700">
          {/* Main Control Panel */}
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
              <p className="text-slate-400 text-base lg:text-lg max-w-2xl leading-relaxed font-medium">
                Mesin penentu kualifikasi cerdas. AI akan mengukur skor kesiapan Anda, merekomendasikan langkah mikro (Next Small Action) berbasis data pasar riil, dan menyesuaikan strategi seiring perkembangan portofolio Anda.
              </p>

              {isAiAnalyzing && (
                <div className="mt-10 space-y-6 animate-in slide-in-from-top-4">
                   <div className="flex justify-between items-end mb-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 animate-pulse">{aiStatusMessage}</p>
                      <p className="text-2xl font-black text-white tracking-tighter">{Math.round(aiProgress)}%</p>
                   </div>
                   <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/10 p-0.5">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-500 rounded-full transition-all duration-700 shadow-[0_0_20px_rgba(79,70,229,0.5)]" 
                        style={{ width: `${aiProgress}%` }}
                      ></div>
                   </div>
                </div>
              )}

              <div className="flex flex-wrap gap-4 mt-10">
                <button 
                  onClick={handleRunAiStrategist}
                  disabled={isAiAnalyzing}
                  className="px-12 py-5 bg-indigo-600 text-white font-black rounded-[2rem] uppercase text-[11px] tracking-[0.2em] hover:bg-indigo-500 transition-all shadow-[0_20px_40px_-10px_rgba(79,70,229,0.5)] active:scale-95 disabled:opacity-50 group min-w-[280px]"
                >
                  {isAiAnalyzing ? (aiLang === 'id' ? 'KALIBRASI SEDANG BERJALAN...' : 'CALIBRATION IN PROGRESS...') : (aiLang === 'id' ? 'UPDATE STRATEGI KARIR' : 'UPDATE CAREER STRATEGY')}
                </button>
                {!isAiAnalyzing && data?.aiStrategies && data.aiStrategies.length > 0 && (
                  <button 
                    onClick={() => setShowHistory(!showHistory)}
                    className="px-8 py-5 bg-white/5 text-white font-black rounded-[2rem] uppercase text-[11px] tracking-[0.2em] border border-white/10 hover:bg-white/10 transition-all backdrop-blur-sm"
                  >
                    {showHistory ? 'CLOSE LOG' : `ROADMAP HISTORY (v${data.aiStrategies.length})`}
                  </button>
                )}
              </div>
            </div>
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[180px] -mr-80 -mt-80 animate-pulse"></div>
          </div>

          {showHistory && !isAiAnalyzing && data?.aiStrategies && (
            <div className="flex gap-3 overflow-x-auto pb-8 no-scrollbar snap-x snap-proximity flex-nowrap animate-in slide-in-from-top-6 duration-500">
              {data.aiStrategies.map((strat, idx) => (
                <button 
                  key={idx}
                  onClick={() => { setAiResults(strat); setShowHistory(false); }}
                  className={`px-8 py-5 rounded-3xl border-2 shrink-0 transition-all text-left snap-start group min-w-[180px] ${aiResults?.version === strat.version ? 'border-indigo-600 bg-white shadow-xl' : 'border-slate-100 bg-white/50 opacity-60 hover:opacity-100'}`}
                >
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest group-hover:text-indigo-400">Version {strat.version}</p>
                  <p className="text-[11px] font-black text-slate-700 uppercase tracking-tighter">{new Date(strat.date).toLocaleDateString(aiLang === 'id' ? 'id-ID' : 'en-US', { month: 'long', year: 'numeric', day: 'numeric' })}</p>
                </button>
              ))}
            </div>
          )}

          {aiResults && !isAiAnalyzing && (
            (() => {
              const currentScore = Number(aiResults?.readinessScore) || 0;
              const prevScoreVal = prevScore !== null ? Number(prevScore) : null;
              const scoreDiff = prevScoreVal !== null ? currentScore - prevScoreVal : 0;
              
              return (
                <div className="space-y-10 animate-in zoom-in duration-700">
                  {/* TOP ROW: READINESS & SUMMARY */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-4 bg-white p-10 lg:p-12 rounded-[3.5rem] shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-slate-100 relative overflow-hidden flex flex-col items-center text-center self-start">
                       <div className="relative mb-8 flex items-center justify-center">
                          <div className="w-48 h-48 rounded-full border-[14px] border-slate-50 flex flex-col items-center justify-center relative shadow-inner bg-slate-50/20">
                             <p className="text-6xl font-black text-slate-900 tracking-tighter leading-none">{currentScore}</p>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">/ 100</p>
                             <svg className="absolute inset-0 w-full h-full -rotate-90 overflow-visible" viewBox="0 0 100 100">
                               <circle 
                                 cx="50" cy="50" r="43" 
                                 fill="transparent" 
                                 stroke="currentColor" 
                                 strokeWidth="14" 
                                 className="text-indigo-600 drop-shadow-[0_0_8px_rgba(79,70,229,0.3)]" 
                                 strokeDasharray="270.17" 
                                 strokeDashoffset={270.17 - (270.17 * currentScore / 100)} 
                                 strokeLinecap="round" 
                               />
                             </svg>
                          </div>
                          {scoreDiff !== 0 && !isNaN(scoreDiff) && (
                            <div className={`absolute -top-2 -right-2 px-3 py-1.5 rounded-2xl font-black text-[10px] shadow-xl flex items-center gap-1.5 border-2 ${scoreDiff > 0 ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-rose-500 text-white border-rose-400'}`}>
                              {scoreDiff > 0 ? '▲' : '▼'} {Math.abs(scoreDiff)}
                            </div>
                          )}
                       </div>
                       <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-4">
                         {aiLang === 'id' ? 'Skor Kesiapan Karir' : 'Career Readiness Index'}
                       </h4>
                       <div className="w-full mt-4 p-5 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col items-center justify-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 opacity-60">TARGET GOAL</p>
                        <p className="text-xs font-black text-slate-800 uppercase tracking-tighter leading-tight max-w-[200px] text-center">
                          {aiResults.targetGoal || 'N/A'}
                        </p>
                       </div>
                    </div>

                    <div className="lg:col-span-8 bg-white p-10 lg:p-12 rounded-[3.5rem] shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col justify-center min-h-full">
                       <SectionLabel label={aiLang === 'id' ? 'ANALISIS EKSEKUTIF' : 'EXECUTIVE ANALYSIS'} color="indigo" />
                       <div className="text-sm lg:text-[15px] text-slate-600 leading-relaxed font-medium italic relative space-y-4 whitespace-pre-line">
                          <span className="text-6xl text-slate-100 absolute -top-8 -left-4 font-serif pointer-events-none select-none">"</span>
                          {(aiResults.scoreExplanation || '').split('\n').map((para, i) => para.trim() ? <p key={i} className="relative z-10">{para}</p> : null)}
                       </div>
                       <div className="mt-10 p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100 flex items-center gap-6">
                          <div className="text-3xl animate-bounce">✨</div>
                          <p className="text-sm font-black text-indigo-900 italic leading-tight opacity-80">
                            "{aiResults.motivation || '--'}"
                          </p>
                       </div>
                    </div>
                  </div>

                  {/* NEXT SMALL ACTIONS (MICRO ACTIONS) */}
                  <div className="bg-white p-10 lg:p-14 rounded-[4rem] shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-slate-100">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mb-12 text-center">
                      {aiLang === 'id' ? 'LANGKAH MIKRO BERIKUTNYA (MICRO ACTIONS)' : 'NEXT SMALL ACTIONS'}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                       <ActionCard timeframe={aiLang === 'id' ? 'MINGGU INI' : 'THIS WEEK'} action={aiResults.immediateActions?.weekly} color="rose" icon="🗓️" />
                       <ActionCard timeframe={aiLang === 'id' ? 'BULAN INI' : 'THIS MONTH'} action={aiResults.immediateActions?.monthly} color="indigo" icon="🗓️" />
                       <ActionCard timeframe={aiLang === 'id' ? 'BULAN DEPAN' : 'NEXT MONTH'} action={aiResults.immediateActions?.nextMonth} color="emerald" icon="🚀" />
                    </div>
                  </div>

                  {/* EXPERIENCE ROADMAP PREREQUISITES */}
                  <div className="bg-white p-10 lg:p-14 rounded-[4rem] shadow-sm border border-slate-100">
                    <SectionLabel label={aiLang === 'id' ? 'PRASYARAT JALUR PENGALAMAN' : 'EXPERIENCE PATHWAY PREREQUISITES'} color="indigo" />
                    <div className="relative">
                      {/* Timeline Line */}
                      <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-slate-100 lg:hidden"></div>
                      
                      <div className="space-y-10 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-12 relative">
                        {aiResults.experienceRoadmap?.map((step, i) => (
                          <div key={i} className="relative pl-14 lg:pl-0 flex flex-col group">
                            {/* Dot / Indicator */}
                            <div className="absolute left-0 lg:relative lg:mb-6 w-10 h-10 bg-indigo-50 border-2 border-indigo-500 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-sm shadow-lg shadow-indigo-100 group-hover:scale-110 transition-transform z-10">
                              {i + 1}
                            </div>
                            
                            <div className="lg:mt-2">
                               <div className="flex items-center gap-3 mb-2">
                                  <h5 className="text-base font-black text-slate-800 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{step.position}</h5>
                               </div>
                               <div className="flex items-center gap-3 mb-4">
                                  <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest">{step.duration}</span>
                               </div>
                               <p className="text-[11px] text-slate-500 leading-relaxed font-bold opacity-80 border-l-2 border-slate-100 pl-4 py-1 italic">
                                 "Fokus Utama: {step.focus}"
                               </p>
                            </div>

                            {/* Arrow for Desktop */}
                            {i < (aiResults.experienceRoadmap?.length || 0) - 1 && (
                              <div className="hidden lg:block absolute top-5 -right-6 text-slate-200 animate-pulse">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* GAPS & RECOMMENDATIONS */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Critical Gaps Section */}
                    <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100 flex flex-col h-full">
                      <SectionLabel label={aiLang === 'id' ? 'GAP SKILL KRITIS' : 'CRUCIAL SKILL GAPS'} color="rose" />
                      <div className="space-y-6 flex-1">
                        {(aiResults.criticalGaps?.length || 0) > 0 ? aiResults.criticalGaps?.map((gap: any, i: number) => (
                          <div key={i} className="p-6 bg-rose-50/40 rounded-[2.5rem] border border-rose-100 group hover:bg-rose-50 transition-all duration-500">
                            <div className="flex justify-between items-center mb-3">
                              <p className="font-black text-slate-800 text-sm uppercase tracking-tight">{gap.skill}</p>
                              <span className={`px-3 py-1 text-white text-[8px] font-black rounded-full uppercase tracking-widest shadow-sm ${gap.priority?.includes('CRITICAL') ? 'bg-rose-600' : 'bg-rose-400'}`}>{gap.priority}</span>
                            </div>
                            <p className="text-[12px] text-slate-600 leading-relaxed font-bold italic opacity-70">"{gap.why}"</p>
                          </div>
                        )) : (
                          <div className="p-10 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                             <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">No Critical Gaps Detected</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Recommendations Section */}
                    <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100">
                      <SectionLabel label={aiLang === 'id' ? 'REKOMENDASI STRATEGIS' : 'STRATEGIC RECOMMENDATIONS'} color="indigo" />
                      <div className="space-y-8">
                         <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                               <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                               TRAINING / COURSE
                            </p>
                            <div className="grid grid-cols-1 gap-4">
                               {aiResults.recommendations?.trainings?.map((t: AiRecommendation, i: number) => (
                                 <RecommendationCard key={i} item={t} type="training" onPlan={() => handlePlanRecommendation(t, 'training')} color="indigo" />
                               ))}
                            </div>
                         </div>
                         <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                               <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                               CERTIFICATION
                            </p>
                            <div className="grid grid-cols-1 gap-4">
                               {aiResults.recommendations?.certifications?.map((c: AiRecommendation, i: number) => (
                                 <RecommendationCard key={i} item={c} type="cert" onPlan={() => handlePlanRecommendation(c, 'cert')} color="emerald" />
                               ))}
                            </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* DETAILED ROADMAP STEPS */}
                <div className="bg-white p-10 lg:p-14 rounded-[4rem] shadow-sm border border-slate-100">
                  <SectionLabel label={aiLang === 'id' ? 'ROADMAP DETAILED STEPS' : 'DETAILED ROADMAP STEPS'} color="slate" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12 relative">
                     {(aiResults.roadmapSteps?.length || 0) > 0 ? aiResults.roadmapSteps?.map((step: any, i: number) => (
                       <div key={i} className="relative pl-14 group">
                          <div className="absolute left-0 top-0 w-10 h-10 bg-slate-900 text-white rounded-[1rem] flex items-center justify-center font-black text-sm shadow-xl group-hover:scale-110 transition-transform">{i + 1}</div>
                          <h5 className="text-[13px] font-black text-slate-800 uppercase tracking-tight mb-2 group-hover:text-indigo-600 transition-colors">{step.title}</h5>
                          <p className="text-[11px] text-slate-500 leading-relaxed font-bold opacity-80">{step.detail}</p>
                       </div>
                     )) : (
                        <div className="col-span-full py-10 text-center bg-slate-50 rounded-3xl">
                          <p className="text-slate-400 font-bold text-[10px] uppercase">Roadmap Generation in Progress</p>
                        </div>
                     )}
                  </div>
                </div>

                {/* SUMMARY FOOTER */}
                <div className="bg-slate-950 p-10 lg:p-14 rounded-[4rem] border border-white/10 text-white/90 relative overflow-hidden">
                  <div className="relative z-10">
                    <SectionLabel label="SUMMARY CONCLUSION" color="white" />
                    <div className="text-base lg:text-lg text-slate-300 leading-relaxed font-medium space-y-6 first-letter:text-5xl first-letter:font-black first-letter:text-indigo-500 first-letter:float-left first-letter:mr-4 first-letter:mt-1 whitespace-pre-line">
                      {(aiResults.executiveSummary || '').split('\n').map((para, i) => para.trim() ? <p key={i}>{para}</p> : null)}
                    </div>
                  </div>
                  <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px] -mr-32 -mb-32"></div>
                </div>
              </div>
            )
          })())}

          {!aiResults && !isAiAnalyzing && (
            <div className="py-32 text-center space-y-6 bg-slate-50/50 rounded-[4rem] border-4 border-dashed border-slate-100 animate-in fade-in duration-1000">
               <div className="text-6xl mb-6 opacity-30">🕯️</div>
               <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-xs">
                 {aiLang === 'id' ? 'BELUM ADA STRATEGI TERDETEKSI' : 'NO STRATEGY DETECTED'}
               </p>
               <p className="text-slate-300 font-bold text-[10px] uppercase tracking-widest">TEKAN TOMBOL UPDATE UNTUK MEMULAI ANALISIS KUALIFIKASI</p>
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
                      <div className="flex justify-end gap-1.5 opacity-100 transition-opacity">
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
                    <th className="px-8 py-5 text-right w-40">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginatedTrainings.map(t => (
                    <tr key={t.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold text-slate-800 text-sm truncate ${t.status === TrainingStatus.COMPLETED ? 'line-through opacity-40' : ''}`}>{t.name}</span>
                            {t.certLink && (
                              <button onClick={() => setCertPreviewUrl(t.certLink || null)} className="text-indigo-600 hover:scale-110 transition-transform" title="Lihat Sertifikat">
                                📜
                              </button>
                            )}
                          </div>
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
                        <div className="flex justify-end gap-1.5 opacity-100 transition-opacity">
                          <button onClick={() => openDetail(t, 'training')} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" title="View Detail">👁️</button>
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
                 <div key={t.id} className={`p-6 bg-white rounded-3xl border border-slate-100 transition-all snap-start ${t.status === TrainingStatus.COMPLETED ? 'opacity-80' : ''}`}>
                    <div className="flex justify-between items-start mb-4">
                       <div className="flex-1 mr-4">
                          <h4 className={`font-black text-slate-800 leading-tight text-lg ${t.status === TrainingStatus.COMPLETED ? 'line-through decoration-slate-400' : ''}`}>{t.name}</h4>
                          <div className="flex flex-wrap gap-2 mt-2">
                             <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter border ${t.status === TrainingStatus.COMPLETED ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{t.status}</span>
                             <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase border ${getPriorityStyle(t.priority || SkillPriority.MEDIUM)}`}>{t.priority || SkillPriority.MEDIUM}</span>
                          </div>
                       </div>
                       <div className="flex gap-1 shrink-0">
                          <button onClick={() => openDetail(t, 'training')} className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-emerald-600 bg-white rounded-full shadow-sm border border-slate-100 transition-colors">👁️</button>
                          <button onClick={() => openEditForm(t)} className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-blue-600 bg-white rounded-full shadow-sm border border-slate-100 transition-colors">✎</button>
                          <button onClick={() => onDeleteTraining(t.id)} className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-rose-600 bg-white rounded-full shadow-sm border border-slate-100 transition-colors">✕</button>
                       </div>
                    </div>
                    
                    <div className="space-y-4">
                       <div className="w-full bg-white p-4 rounded-2xl border border-slate-100">
                          <div className="flex justify-between items-center mb-2">
                             <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Module Progress</span>
                             <span className="text-10px font-black text-blue-600">{t.progress || 0}%</span>
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
                    <div className="flex gap-2 mt-4">
                       <a href={t.link} target="_blank" rel="noreferrer" className="flex-1 text-center py-2.5 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-100 active:scale-95 transition-all">Visit Resource →</a>
                       {t.certLink && (
                         <button onClick={() => openDetail(t, 'training')} className="flex-1 text-center py-2.5 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 active:scale-95 transition-all">View Detail 👁️</button>
                       )}
                    </div>
                 </div>
               ))}
               {filteredTrainings.length === 0 && <div className="py-12 text-center text-slate-400 italic">No courses found matching your filters.</div>}
            </div>
          </div>

          {totalTrainPages > 1 && (
            <div className="flex items-center justify-between bg-white px-6 lg:px-8 py-4 rounded-[2rem] border border-slate-100 shadow-sm animate-in slide-in-from-bottom-4">
              <button disabled={trainPage === 1} onClick={() => setTrainPage(p => p - 1)} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-colors">← Prev</button>
              <div className="flex gap-2">
                {[...Array(totalTrainPages)].map((_, i) => (
                  <button key={i} onClick={() => setTrainPage(i + 1)} className={`w-8 h-8 rounded-xl text-[10px] font-black transition-all ${trainPage === i + 1 ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>{i + 1}</button>
                ))}
              </div>
              <button disabled={trainPage === totalCertPages} onClick={() => setTrainPage(p => p + 1)} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-colors">Next →</button>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'certs' && (
        <div className="space-y-6">
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
                  <input type="date" value={fEnd} onChange={e => setFCertEnd(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-[10px] font-bold outline-none" />
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
                    <th className="px-8 py-5 text-right w-44">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginatedCerts.map(c => {
                    const overdue = isCertOverdue(c);
                    return (
                      <tr key={c.id} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 text-sm truncate">{c.name}</span>
                              {c.fileLink && (
                                <button onClick={() => setCertPreviewUrl(c.fileLink)} className="text-indigo-600 hover:scale-110 transition-transform" title="View Certificate">
                                  📜
                                </button>
                              )}
                            </div>
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
                          <div className="flex justify-end gap-2 opacity-100 transition-opacity">
                            <button onClick={() => openDetail(c, 'cert')} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" title="View Detail">👁️</button>
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
                        <button onClick={() => openDetail(c, 'cert')} className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-emerald-600 bg-slate-50 rounded-xl transition-all">👁️</button>
                        <button onClick={() => openEditForm(c)} className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-blue-600 bg-slate-50 rounded-xl transition-all">✎</button>
                        <button onClick={() => onDeleteCert(c.id)} className="p-2 text-slate-500 hover:text-rose-600 bg-slate-50 rounded-xl transition-all">✕</button>
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
                      <button onClick={() => openDetail(c, 'cert')} className="block w-full py-3 text-center bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-colors">View Detail 👁️</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

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

const DetailGroup: React.FC<{ label: string; val: string | number }> = ({ label, val }) => (
  <div className="space-y-1.5">
     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</p>
     <p className="px-5 py-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold text-slate-800 text-xs">{val}</p>
  </div>
);

const SectionLabel: React.FC<{ label: string; color: string }> = ({ label, color }) => {
  const colorMap: any = {
    indigo: 'text-indigo-600',
    rose: 'text-rose-600',
    slate: 'text-slate-400',
    white: 'text-white/50'
  };
  return (
    <h4 className={`text-[10px] font-black uppercase tracking-[0.4em] mb-8 ${colorMap[color]}`}>{label}</h4>
  );
};

const ActionCard: React.FC<{ timeframe: string; action: string; color: string; icon: string }> = ({ timeframe, action, color, icon }) => {
  const colorMap: any = {
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100'
  };
  return (
    <div className={`p-8 rounded-[3rem] border-2 group hover:shadow-2xl transition-all duration-700 hover:-translate-y-2 flex flex-col items-center text-center ${colorMap[color]}`}>
       <div className="w-14 h-14 rounded-2xl bg-white/50 flex items-center justify-center text-2xl shadow-inner mb-6 group-hover:scale-110 transition-transform">{icon}</div>
       <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 opacity-70">{timeframe}</p>
       <p className="text-xs font-bold leading-relaxed text-slate-800">
         {action || "Langkah strategis sedang diproses..."}
       </p>
    </div>
  );
};

const RecommendationCard: React.FC<{ item: AiRecommendation; type: string; onPlan: () => void; color: string }> = ({ item, type, onPlan, color }) => {
  const colorMap: any = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100'
  };
  
  const buttonLabel = type === 'training' 
    ? 'TAMBAHKAN KE PLAN TRAINING' 
    : 'TAMBAHKAN KE PLAN CERTIFICATION';

  return (
    <div className={`p-6 rounded-[2.5rem] border group hover:shadow-lg transition-all duration-500 flex flex-col ${colorMap[color]}`}>
      <div className="flex-1 mb-4">
          <p className="text-xs font-black text-slate-800 uppercase tracking-tight leading-snug">{item.name}</p>
          <div className="flex flex-wrap gap-4 mt-3">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">📅 {item.schedule}</span>
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">💰 {item.priceRange}</span>
          </div>
      </div>
      <button 
        onClick={onPlan}
        className={`w-full py-3 text-white text-[9px] font-black uppercase rounded-xl shadow-lg active:scale-95 transition-all tracking-widest ${color === 'indigo' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'}`}
      >
        {buttonLabel}
      </button>
    </div>
  );
};

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
    priority: SkillPriority.MEDIUM,
    certLink: ''
  });

  const [isRange, setIsRange] = useState(initialData?.date.includes(' - ') || false);
  const [startDate, setStartDate] = useState(initialData?.date.split(' - ')[0] || new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(initialData?.date.split(' - ')[1] || '');

  const handleCertUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, certLink: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

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
         
         <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Certificate Document (File/Link)</label>
            <div className="flex gap-2">
               <input 
                 placeholder="https://link-sertifikat.com" 
                 className="flex-1 px-5 py-3 lg:py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-bold text-xs" 
                 value={formData.certLink || ''} 
                 onChange={e => setFormData({...formData, certLink: e.target.value})} 
               />
               <label className="cursor-pointer bg-slate-900 text-white px-5 flex items-center justify-center rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-black transition-colors">
                  Upload
                  <input type="file" className="hidden" accept=".pdf,image/*" onChange={handleCertUpload} />
               </label>
            </div>
            {formData.certLink && formData.certLink.startsWith('data:') && (
               <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest ml-1">✓ File Attached (Ready to save)</p>
            )}
         </div>

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, fileLink: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

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
         
         <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Certificate Document (File/Link)</label>
            <div className="flex gap-2">
               <input 
                 placeholder="https://link-sertifikat.com" 
                 className="flex-1 px-5 py-3 lg:py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-bold text-xs" 
                 value={formData.fileLink || ''} 
                 onChange={e => setFormData({...formData, fileLink: e.target.value})} 
               />
               <label className="cursor-pointer bg-slate-900 text-white px-5 flex items-center justify-center rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-black transition-colors">
                  Upload
                  <input type="file" className="hidden" accept=".pdf,image/*" onChange={handleFileUpload} />
               </label>
            </div>
            {formData.fileLink && formData.fileLink.startsWith('data:') && (
               <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest ml-1">✓ File Attached (Ready to save)</p>
            )}
         </div>
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
