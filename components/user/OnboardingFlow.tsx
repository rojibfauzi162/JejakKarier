
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AppData, 
  UserRole, 
  SubscriptionPlan, 
  AccountStatus, 
  WorkExperience, 
  Education, 
  Skill, 
  SkillCategory, 
  SkillStatus, 
  SkillPriority,
  DailyReport,
  AiStrategy
} from '../../types';
import { analyzeSkillGap } from '../../services/geminiService';
import { saveUserData } from '../../services/firebase';

interface OnboardingFlowProps {
  data: AppData;
  onComplete: (updatedData: AppData) => void;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ data, onComplete }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<AppData>({ ...data });
  const [loading, setLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState<AiStrategy | null>(null);

  // Step 1: Profile & Career
  const [profile, setProfile] = useState(formData.profile);
  const [workExp, setWorkExp] = useState<WorkExperience[]>(formData.workExperiences || []);
  const [edu, setEdu] = useState<Education[]>(formData.educations || []);

  // Step 2: Skills
  const [skills, setSkills] = useState<Skill[]>(formData.skills || []);

  // Step 4: Daily Plan
  const [dailyPlan, setDailyPlan] = useState<Partial<DailyReport>>({
    activity: '',
    description: '',
    category: 'Umum',
    context: 'Personal',
    output: '',
    metricValue: 0,
    metricLabel: 'Menit',
    reflection: '',
    isPlan: true
  });

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleSaveProfile = () => {
    setFormData(prev => ({
      ...prev,
      profile,
      workExperiences: workExp,
      educations: edu
    }));
    nextStep();
  };

  const handleSaveSkills = () => {
    setFormData(prev => ({
      ...prev,
      skills
    }));
    generateAiInsight();
  };

  const generateAiInsight = async () => {
    setLoading(true);
    nextStep(); // Move to insight step while loading
    try {
      const updatedData = {
        ...formData,
        skills
      };
      const insight = await analyzeSkillGap(updatedData);
      setAiInsight(insight);
    } catch (error) {
      console.error("AI Insight Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async () => {
    setLoading(true);
    const finalData: AppData = {
      ...formData,
      dailyReports: [
        ...(formData.dailyReports || []),
        {
          ...dailyPlan,
          id: Math.random().toString(36).substr(2, 9),
          date: new Date().toISOString().split('T')[0],
        } as DailyReport
      ],
      onboardingCompleted: true
    };
    
    try {
      if (finalData.uid) {
        await saveUserData(finalData.uid, finalData);
      }
      onComplete(finalData);
    } catch (error) {
      console.error("Finalize Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const addWorkExp = () => {
    const newWork: WorkExperience = {
      id: Math.random().toString(36).substr(2, 9),
      position: '',
      company: '',
      duration: '',
      description: ''
    };
    setWorkExp([...workExp, newWork]);
  };

  const addEdu = () => {
    const newEdu: Education = {
      id: Math.random().toString(36).substr(2, 9),
      degree: '',
      institution: '',
      year: '',
      description: ''
    };
    setEdu([...edu, newEdu]);
  };

  const addSkill = () => {
    const newSkill: Skill = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      category: SkillCategory.HARD,
      currentLevel: 1,
      requiredLevel: 5,
      status: SkillStatus.GAP,
      priority: SkillPriority.MEDIUM,
      lastUsed: new Date().toISOString().split('T')[0],
      actionPlan: ''
    };
    setSkills([...skills, newSkill]);
  };

  const handleSkip = async () => {
    if (window.confirm('Apakah Anda yakin ingin melewati proses onboarding? Anda bisa melengkapi profil nanti.')) {
      setLoading(true);
      const finalData: AppData = {
        ...formData,
        onboardingCompleted: true
      };
      try {
        if (finalData.uid) {
          await saveUserData(finalData.uid, finalData);
        }
        onComplete(finalData);
      } catch (error) {
        console.error("Skip Error:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSkipStep = () => {
    nextStep();
  };

  const JOB_CATEGORIES = [
    'Operasional & Produksi',
    'Pemasaran & Penjualan',
    'Keuangan & Akuntansi',
    'Sumber Daya Manusia (SDM/HR)',
    'Teknologi Informasi (IT)',
    'Administrasi & Umum',
    'Research & Development (R&D) / Inovasi',
    'Logistik & Rantai Pasok',
    'Layanan Pelanggan',
    'Hukum & Kepatuhan'
  ];

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-4xl w-full bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col min-h-[80vh]">
        
        {/* Progress Bar */}
        <div className="h-2 bg-slate-100 flex relative">
          {[1, 2, 3, 4, 5, 6, 7].map(i => (
            <div 
              key={i} 
              className={`flex-1 transition-all duration-500 ${step >= i ? 'bg-indigo-600' : 'bg-transparent'}`}
            />
          ))}
        </div>

        <div className="p-8 lg:p-12 flex-1 flex flex-col">
          {/* Logo & Tagline */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <i className="bi bi-rocket-takeoff-fill text-xl"></i>
              </div>
              <span className="text-2xl font-black text-slate-900 tracking-tight">FOKUSKARIR</span>
            </div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Rencanakan Karir Impianmu</p>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Identitas Diri</h2>
                    <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">Langkah 1 dari 7</span>
                  </div>
                  <p className="text-slate-500 font-medium">Lengkapi data diri Anda agar AI dapat melakukan analisis tahap awal.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Lengkap</label>
                    <input 
                      type="text" 
                      value={profile.name} 
                      onChange={e => setProfile({...profile, name: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold text-slate-900"
                      placeholder="Contoh: Budi Santoso"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nomor Handphone</label>
                    <input 
                      type="text" 
                      value={profile.phone} 
                      onChange={e => setProfile({...profile, phone: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold text-slate-900"
                      placeholder="Contoh: 08123456789"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tempat Lahir</label>
                    <input 
                      type="text" 
                      value={profile.birthPlace} 
                      onChange={e => setProfile({...profile, birthPlace: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold text-slate-900"
                      placeholder="Contoh: Jakarta"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal Lahir</label>
                    <input 
                      type="date" 
                      value={profile.birthDate} 
                      onChange={e => setProfile({...profile, birthDate: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold text-slate-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Pernikahan</label>
                    <input 
                      type="text" 
                      value={profile.maritalStatus} 
                      onChange={e => setProfile({...profile, maritalStatus: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold text-slate-900"
                      placeholder="Contoh: Lajang / Menikah"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Domisili</label>
                    <input 
                      type="text" 
                      value={profile.domicile} 
                      onChange={e => setProfile({...profile, domicile: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold text-slate-900"
                      placeholder="Contoh: Jakarta Selatan"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kategori Pekerjaan</label>
                    <select 
                      value={profile.jobCategory} 
                      onChange={e => setProfile({...profile, jobCategory: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold text-slate-900"
                    >
                      <option value="">Pilih Kategori...</option>
                      {JOB_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                </div>

                <div className="pt-8 space-y-6">
                  <button 
                    onClick={handleSaveProfile}
                    className="w-full py-5 bg-indigo-600 text-white font-black rounded-[2rem] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                  >
                    Lanjutkan
                  </button>
                  <button 
                    onClick={handleSkipStep}
                    className="w-full text-center text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-slate-600 transition-all"
                  >
                    Lewati Step ini
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Target Karir</h2>
                    <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">Langkah 2 dari 7</span>
                  </div>
                  <p className="text-slate-500 font-medium">Informasi ini penting untuk analisis gap karir tahap awal.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Perusahaan Saat Ini</label>
                    <input 
                      type="text" 
                      value={profile.currentCompany} 
                      onChange={e => setProfile({...profile, currentCompany: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold text-slate-900"
                      placeholder="Contoh: PT Teknologi Maju"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Posisi Saat Ini</label>
                    <input 
                      type="text" 
                      value={profile.currentPosition} 
                      onChange={e => setProfile({...profile, currentPosition: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold text-slate-900"
                      placeholder="Contoh: Junior Developer"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Jangka Pendek (1-2 Tahun)</label>
                    <input 
                      type="text" 
                      value={profile.shortTermTarget} 
                      onChange={e => setProfile({...profile, shortTermTarget: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold text-slate-900"
                      placeholder="Contoh: Senior Product Manager"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Jangka Panjang (3-5 Tahun)</label>
                    <input 
                      type="text" 
                      value={profile.longTermTarget} 
                      onChange={e => setProfile({...profile, longTermTarget: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold text-slate-900"
                      placeholder="Contoh: Chief Product Officer"
                    />
                  </div>
                </div>

                <div className="pt-8 space-y-6">
                  <div className="flex gap-4">
                    <button 
                      onClick={prevStep}
                      className="flex-1 py-5 bg-slate-100 text-slate-600 font-black rounded-[2rem] uppercase tracking-widest hover:bg-slate-200 transition-all"
                    >
                      Kembali
                    </button>
                    <button 
                      onClick={handleSaveProfile}
                      className="flex-[2] py-5 bg-indigo-600 text-white font-black rounded-[2rem] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                    >
                      Lanjutkan
                    </button>
                  </div>
                  <button 
                    onClick={handleSkipStep}
                    className="w-full text-center text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-slate-600 transition-all"
                  >
                    Lewati Step ini
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Pengalaman Kerja</h2>
                    <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">Langkah 3 dari 7</span>
                  </div>
                  <p className="text-slate-500 font-medium">Riwayat pekerjaan membantu AI memahami jam terbang dan pengalaman Anda.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Daftar Pengalaman</h3>
                    <button onClick={addWorkExp} className="text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:underline">+ Tambah</button>
                  </div>
                  <div className="space-y-4">
                    {workExp.map((w, i) => (
                      <div key={w.id} className="p-6 bg-slate-50 rounded-3xl space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input 
                            placeholder="Posisi" 
                            value={w.position} 
                            onChange={e => {
                              const newW = [...workExp];
                              newW[i].position = e.target.value;
                              setWorkExp(newW);
                            }}
                            className="bg-white px-4 py-3 rounded-xl border-none font-bold text-sm"
                          />
                          <input 
                            placeholder="Perusahaan" 
                            value={w.company} 
                            onChange={e => {
                              const newW = [...workExp];
                              newW[i].company = e.target.value;
                              setWorkExp(newW);
                            }}
                            className="bg-white px-4 py-3 rounded-xl border-none font-bold text-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-8 space-y-6">
                  <div className="flex gap-4">
                    <button 
                      onClick={prevStep}
                      className="flex-1 py-5 bg-slate-100 text-slate-600 font-black rounded-[2rem] uppercase tracking-widest hover:bg-slate-200 transition-all"
                    >
                      Kembali
                    </button>
                    <button 
                      onClick={handleSaveProfile}
                      className="flex-[2] py-5 bg-indigo-600 text-white font-black rounded-[2rem] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                    >
                      Lanjutkan
                    </button>
                  </div>
                  <button 
                    onClick={handleSkipStep}
                    className="w-full text-center text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-slate-600 transition-all"
                  >
                    Lewati Step ini
                  </button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div 
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Pendidikan</h2>
                    <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">Langkah 4 dari 7</span>
                  </div>
                  <p className="text-slate-500 font-medium">Latar belakang pendidikan menjadi fondasi saran karir Anda.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Riwayat Pendidikan</h3>
                    <button onClick={addEdu} className="text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:underline">+ Tambah</button>
                  </div>
                  <div className="space-y-4">
                    {edu.map((e, i) => (
                      <div key={e.id} className="p-6 bg-slate-50 rounded-3xl space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input 
                            placeholder="Gelar / Bidang" 
                            value={e.degree} 
                            onChange={val => {
                              const newE = [...edu];
                              newE[i].degree = val.target.value;
                              setEdu(newE);
                            }}
                            className="bg-white px-4 py-3 rounded-xl border-none font-bold text-sm"
                          />
                          <input 
                            placeholder="Institusi" 
                            value={e.institution} 
                            onChange={val => {
                              const newE = [...edu];
                              newE[i].institution = val.target.value;
                              setEdu(newE);
                            }}
                            className="bg-white px-4 py-3 rounded-xl border-none font-bold text-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-8 space-y-6">
                  <div className="flex gap-4">
                    <button 
                      onClick={prevStep}
                      className="flex-1 py-5 bg-slate-100 text-slate-600 font-black rounded-[2rem] uppercase tracking-widest hover:bg-slate-200 transition-all"
                    >
                      Kembali
                    </button>
                    <button 
                      onClick={handleSaveProfile}
                      className="flex-[2] py-5 bg-indigo-600 text-white font-black rounded-[2rem] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                    >
                      Lanjutkan
                    </button>
                  </div>
                  <button 
                    onClick={handleSkipStep}
                    className="w-full text-center text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-slate-600 transition-all"
                  >
                    Lewati Step ini
                  </button>
                </div>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div 
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Keahlian (Skills)</h2>
                    <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">Langkah 5 dari 7</span>
                  </div>
                  <p className="text-slate-500 font-medium">Input skill yang Anda miliki saat ini untuk dianalisis oleh AI.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Daftar Skill</h3>
                    <button onClick={addSkill} className="text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:underline">+ Tambah Skill</button>
                  </div>
                  <div className="space-y-4">
                    {skills.map((s, i) => (
                      <div key={s.id} className="p-6 bg-slate-50 rounded-3xl flex gap-4 items-center">
                        <input 
                          placeholder="Nama Skill (Contoh: React.js)" 
                          value={s.name} 
                          onChange={e => {
                            const newS = [...skills];
                            newS[i].name = e.target.value;
                            setSkills(newS);
                          }}
                          className="flex-1 bg-white px-4 py-3 rounded-xl border-none font-bold text-sm"
                        />
                        <select 
                          value={s.currentLevel}
                          onChange={e => {
                            const newS = [...skills];
                            newS[i].currentLevel = parseInt(e.target.value);
                            setSkills(newS);
                          }}
                          className="bg-white px-4 py-3 rounded-xl border-none font-bold text-sm"
                        >
                          {[1,2,3,4,5].map(l => <option key={l} value={l}>Level {l}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-8 space-y-6">
                  <div className="flex gap-4">
                    <button 
                      onClick={prevStep}
                      className="flex-1 py-5 bg-slate-100 text-slate-600 font-black rounded-[2rem] uppercase tracking-widest hover:bg-slate-200 transition-all"
                    >
                      Kembali
                    </button>
                    <button 
                      onClick={handleSaveSkills}
                      className="flex-[2] py-5 bg-indigo-600 text-white font-black rounded-[2rem] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                    >
                      Analisis dengan AI
                    </button>
                  </div>
                  <button 
                    onClick={handleSkipStep}
                    className="w-full text-center text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-slate-600 transition-all"
                  >
                    Lewati Step ini
                  </button>
                </div>
              </motion.div>
            )}

            {step === 6 && (
              <motion.div 
                key="step6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">AI Career Insight</h2>
                    <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">Langkah 6 dari 7</span>
                  </div>
                  <p className="text-slate-500 font-medium">Berdasarkan data Anda, inilah analisis strategis dari AI kami.</p>
                </div>

                {loading ? (
                  <div className="py-20 flex flex-col items-center justify-center space-y-6">
                    <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">AI sedang menganalisis data Anda...</p>
                  </div>
                ) : aiInsight ? (
                  <div className="space-y-6">
                    <div className="p-8 bg-indigo-50 rounded-[2.5rem] border border-indigo-100">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-indigo-100">
                          <i className="bi bi-stars"></i>
                        </div>
                        <h3 className="text-xl font-black text-indigo-900 uppercase tracking-tight">Executive Summary</h3>
                      </div>
                      <p className="text-indigo-900/70 font-medium leading-relaxed">{aiInsight.executiveSummary}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Kesiapan Karir</h4>
                        <div className="text-4xl font-black text-slate-900 mb-2">{aiInsight.readinessScore}%</div>
                        <p className="text-xs text-slate-500 font-medium">{aiInsight.scoreExplanation}</p>
                      </div>
                      <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Gap Kritis</h4>
                        <div className="space-y-2">
                          {aiInsight.criticalGaps.slice(0, 2).map((g, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-rose-500 rounded-full"></div>
                              <span className="text-xs font-bold text-slate-700">{g.skill}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-20 text-center text-slate-400 font-bold uppercase text-[10px]">Gagal memuat insight. Silakan coba lagi.</div>
                )}

                <div className="pt-8">
                  <button 
                    onClick={nextStep}
                    disabled={loading}
                    className="w-full py-5 bg-indigo-600 text-white font-black rounded-[2rem] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                  >
                    Lanjutkan ke Aktivitas
                  </button>
                </div>
              </motion.div>
            )}

            {step === 7 && (
              <motion.div 
                key="step7"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Rencana Hari Ini</h2>
                    <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">Langkah 7 dari 7</span>
                  </div>
                  <p className="text-slate-500 font-medium italic">"Catatan kecil hari ini bisa membantu Anda melihat perkembangan karir ke depan."</p>
                </div>

                <div className="p-8 bg-emerald-50 rounded-[2.5rem] border border-emerald-100">
                  <p className="text-emerald-900/70 font-medium text-center">"Hanya butuh 1 menit untuk mencatat aktivitas hari ini."</p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Apa aktivitas utama hari ini?</label>
                    <input 
                      type="text" 
                      value={dailyPlan.activity} 
                      onChange={e => setDailyPlan({...dailyPlan, activity: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold text-slate-900"
                      placeholder="Contoh: Belajar React.js Dasar"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detail / Output yang Diharapkan</label>
                    <textarea 
                      value={dailyPlan.output} 
                      onChange={e => setDailyPlan({...dailyPlan, output: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold text-slate-900 min-h-[100px]"
                      placeholder="Contoh: Menyelesaikan modul 1 dan membuat project kecil"
                    />
                  </div>
                </div>

                <div className="pt-8">
                  <button 
                    onClick={handleFinalize}
                    disabled={loading || !dailyPlan.activity}
                    className="w-full py-5 bg-indigo-600 text-white font-black rounded-[2rem] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {loading ? 'Menyimpan...' : 'Selesaikan Onboarding'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;
