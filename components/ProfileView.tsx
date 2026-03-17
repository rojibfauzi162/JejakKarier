
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, WorkExperience, Education, AppData, SubscriptionPlan } from '../types';
import { generateProfileBio } from '../services/geminiService';
// Added import for auth to fix "Cannot find name 'auth'" errors
import { auth } from '../services/firebase';

interface ProfileViewProps {
  profile: UserProfile;
  workExperiences: WorkExperience[];
  educations: Education[];
  onUpdateProfile: (profile: UserProfile) => void;
  onAddWork: (w: WorkExperience) => void;
  onUpdateWork: (w: WorkExperience) => void;
  onDeleteWork: (id: string) => void;
  onAddEducation: (e: Education) => void;
  onUpdateEducation: (e: Education) => void;
  onDeleteEducation: (id: string) => void;
  appData?: AppData;
}

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

const ProfileView: React.FC<ProfileViewProps> = ({ 
  profile, workExperiences, educations,
  onUpdateProfile, onAddWork, onUpdateWork, onDeleteWork,
  onAddEducation, onUpdateEducation, onDeleteEducation,
  appData
}) => {
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [isEditingWork, setIsEditingWork] = useState<string | null>(null);
  const [isEditingEdu, setIsEditingEdu] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States for AI Generate Limit
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [aiLimitRemaining, setAiLimitRemaining] = useState(3);

  // States for flexible education year range
  const [isRangeEdu, setIsRangeEdu] = useState(false);
  const [startYearEdu, setStartYearEdu] = useState('');
  const [endYearEdu, setEndYearEdu] = useState('');

  // Effect to sync and check AI limits from local storage
  // FIX: Dependency ditambahkan agar limit dicek ulang setiap kali status Auth berubah
  useEffect(() => {
    const checkLimit = () => {
      const today = new Date().toISOString().split('T')[0];
      const currentUser = auth.currentUser;
      const userKey = currentUser ? currentUser.uid : 'guest';
      
      const saved = localStorage.getItem(`ai_bio_usage_${userKey}`);
      if (saved) {
        try {
          const { date, count } = JSON.parse(saved);
          if (date === today) {
            setAiLimitRemaining(Math.max(0, 3 - count));
          } else {
            setAiLimitRemaining(3);
          }
        } catch (e) {
          setAiLimitRemaining(3);
        }
      } else {
        setAiLimitRemaining(3);
      }
    };
    
    checkLimit();
    // Listener auth untuk memastikan limit terdeteksi saat user login/logout
    const unsubscribe = auth.onAuthStateChanged(() => checkLimit());
    return () => unsubscribe();
  }, []);

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return "-";
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(formData);
    alert('Informasi profil diperbarui!');
  };

  const handleAiBio = async () => {
    // Debug log untuk memastikan aksi klik terdeteksi
    console.log("[AI ACTION] Generate bio clicked. Limit remaining:", aiLimitRemaining);
    
    if (!appData) {
        alert("Data profil belum siap. Silakan refresh halaman.");
        return;
    }

    if (aiLimitRemaining <= 0) {
      alert("Maaf, limit generate bio AI Anda hari ini sudah habis (Maksimal 3x sehari). Silakan coba lagi besok.");
      return;
    }

    setIsGeneratingBio(true);
    try {
      const bio = await generateProfileBio(appData);
      if (bio) {
        setFormData(prev => ({ ...prev, description: bio }));
        
        // Update Limit
        const today = new Date().toISOString().split('T')[0];
        const userKey = auth.currentUser ? auth.currentUser.uid : 'guest';
        const saved = localStorage.getItem(`ai_bio_usage_${userKey}`);
        let newCount = 1;
        
        if (saved) {
          const { date, count } = JSON.parse(saved);
          newCount = date === today ? count + 1 : 1;
        }
        
        localStorage.setItem(`ai_bio_usage_${userKey}`, JSON.stringify({ date: today, count: newCount }));
        setAiLimitRemaining(3 - newCount);
        alert("✨ Bio profesional Anda telah berhasil digenerate!");
      }
    } catch (e: any) {
      console.error("[AI ERROR]", e.message);
      alert("Gagal generate bio: " + e.message);
    } finally {
      setIsGeneratingBio(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const createNewWork = () => {
    // VALIDASI LIMIT DATABASE PAKET FREE
    const limit = appData?.planLimits?.workExperience || 2;
    if (appData?.plan === SubscriptionPlan.FREE && workExperiences.length >= Number(limit)) {
      alert(`Batas riwayat pekerjaan tercapai (${limit}). Silakan upgrade paket untuk menambahkan lebih banyak.`);
      return;
    }
    const id = Math.random().toString(36).substr(2, 9);
    onAddWork({ id, position: '', company: '', duration: '', description: '' });
    setIsEditingWork(id);
  };

  const createNewEdu = () => {
    // VALIDASI LIMIT DATABASE PAKET FREE
    const limit = appData?.planLimits?.education || 2;
    if (appData?.plan === SubscriptionPlan.FREE && educations.length >= Number(limit)) {
      alert(`Batas riwayat pendidikan tercapai (${limit}). Silakan upgrade paket untuk menambahkan lebih banyak.`);
      return;
    }
    const id = Math.random().toString(36).substr(2, 9);
    setIsRangeEdu(false);
    setStartYearEdu('');
    setEndYearEdu('');
    onAddEducation({ id, degree: '', institution: '', year: '', description: '' });
    setIsEditingEdu(id);
  };

  const handleEditEdu = (edu: Education) => {
    setIsEditingEdu(edu.id);
    const range = edu.year.includes(' - ');
    setIsRangeEdu(range);
    if (range) {
      const [start, end] = edu.year.split(' - ');
      setStartYearEdu(start);
      setEndYearEdu(end);
    } else {
      setStartYearEdu(edu.year);
      setEndYearEdu('');
    }
  };

  const handleEduYearChange = (edu: Education, start: string, end: string, range: boolean) => {
    setStartYearEdu(start);
    setEndYearEdu(end);
    const finalYear = range && end ? `${start} - ${end}` : start;
    onUpdateEducation({ ...edu, year: finalYear });
  };

  // List Item Management for Work Description
  const handleAddWorkDescItem = (work: WorkExperience) => {
    const current = work.description || '';
    const items = current.split('\n').filter(s => s.trim() !== '');
    items.push('Butir deskripsi baru...');
    onUpdateWork({ ...work, description: items.join('\n') });
  };

  const handleUpdateWorkDescItem = (work: WorkExperience, index: number, value: string) => {
    const items = (work.description || '').split('\n');
    items[index] = value;
    onUpdateWork({ ...work, description: items.join('\n') });
  };

  const handleRemoveWorkDescItem = (work: WorkExperience, index: number) => {
    const items = (work.description || '').split('\n');
    items.splice(index, 1);
    onUpdateWork({ ...work, description: items.join('\n') });
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-top-4 duration-700 pb-20">
      <header className="border-b border-slate-200 pb-6">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Professional Profile Builder</h2>
        <p className="text-slate-500 mt-1">Lengkapi informasi diri untuk mendapatkan rekomendasi karir yang lebih akurat.</p>
      </header>

      {/* 01: Identitas Diri */}
      <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">01</div>
          <h3 className="text-xl font-bold text-slate-800">Identitas Diri</h3>
        </div>
        <form onSubmit={handleProfileSubmit} className="space-y-8">
          <div className="flex flex-col md:flex-row gap-10">
            {/* Photo Section */}
            <div className="flex flex-col items-center gap-4">
               <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-40 h-40 bg-slate-50 rounded-full border-4 border-white shadow-xl overflow-hidden cursor-pointer group relative flex items-center justify-center"
               >
                 {formData.photoUrl ? (
                   <img src={formData.photoUrl} alt="Profile" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                 ) : (
                   <span className="text-4xl">👤</span>
                 )}
                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <span className="text-white text-xs font-black uppercase tracking-widest">Ganti Foto</span>
                 </div>
               </div>
               <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handlePhotoUpload} 
                className="hidden" 
                accept="image/*"
               />
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Foto Formal 1:1</p>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <InputGroup label="Nama Lengkap" value={formData.name} onChange={v => setFormData({ ...formData, name: v })} placeholder="e.g. Alex Johnson" />
              </div>
              
              <InputGroup label="Tempat Lahir" value={formData.birthPlace} onChange={v => setFormData({ ...formData, birthPlace: v })} placeholder="e.g. Jakarta" />
              <InputGroup label="Tanggal Lahir" type="date" value={formData.birthDate} onChange={v => setFormData({ ...formData, birthDate: v })} />
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Usia (Otomatis)</label>
                <div className="w-full px-5 py-3.5 rounded-2xl border border-slate-100 bg-slate-50 text-slate-800 font-bold">
                  {calculateAge(formData.birthDate)}
                </div>
              </div>
              <InputGroup label="Status" value={formData.maritalStatus} onChange={v => setFormData({ ...formData, maritalStatus: v })} placeholder="e.g. Lajang / Menikah" />
              
              <InputGroup label="Email" type="email" value={formData.email} onChange={v => setFormData({ ...formData, email: v })} placeholder="e.g. alex@mail.com" />
              <InputGroup label="Nomor Handphone" value={formData.phone} onChange={v => setFormData({ ...formData, phone: v })} placeholder="e.g. 08123456789" />
              <InputGroup label="Domisili" value={formData.domicile} onChange={v => setFormData({ ...formData, domicile: v })} placeholder="e.g. Jakarta Selatan" />
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Kategori Jabatan</label>
                <select 
                  className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 outline-none bg-slate-50/30 text-slate-800 font-bold focus:ring-4 focus:ring-blue-500/5 transition-all"
                  value={formData.jobCategory || ''}
                  onChange={e => setFormData({ ...formData, jobCategory: e.target.value })}
                >
                  <option value="" disabled>Pilih Kategori...</option>
                  {JOB_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <InputGroup label="Perusahaan / Instansi Sekarang" value={formData.currentCompany} onChange={v => setFormData({ ...formData, currentCompany: v })} placeholder="e.g. Tax Solutions Global" />
              <InputGroup label="Jabatan Sekarang" value={formData.currentPosition} onChange={v => setFormData({ ...formData, currentPosition: v })} placeholder="e.g. Tax Associate" />
              
              {/* Kolom Deskripsi Diri (Fitur AI dihapus sesuai permintaan) */}
              <div className="md:col-span-2 space-y-3">
                <div className="flex justify-between items-end px-1">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Deskripsi Diri</label>
                </div>
                <textarea 
                  className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/5 outline-none bg-slate-50/30 transition-all text-slate-800 font-medium placeholder:text-slate-300 min-h-[120px] resize-none"
                  placeholder="Ceritakan sedikit tentang latar belakang profesional dan keahlian utama Anda..."
                  value={formData.description || ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
          </div>
          <div className="pt-4 flex justify-end">
            <button className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl text-sm transition-all hover:bg-black active:scale-95">
              Simpan Profil
            </button>
          </div>
        </form>
      </section>

      {/* 02: Work Experience */}
      <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">02</div>
            <h3 className="text-xl font-bold text-slate-800">Riwayat Pekerjaan</h3>
          </div>
          <button 
            onClick={createNewWork}
            className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-sm transition-all hover:bg-indigo-700 shadow-md shadow-indigo-100"
          >
            + Tambah Pengalaman
          </button>
        </div>

        <div className="space-y-6">
          {workExperiences.map(work => (
            <div key={work.id} className="p-6 rounded-2xl bg-slate-50 border border-slate-100 relative group">
              {isEditingWork === work.id ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                      placeholder="Posisi" 
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none"
                      value={work.position || ''} 
                      onChange={e => onUpdateWork({ ...work, position: e.target.value })}
                    />
                    <input 
                      placeholder="Perusahaan" 
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none"
                      value={work.company || ''} 
                      onChange={e => onUpdateWork({ ...work, company: e.target.value })}
                    />
                    <input 
                      placeholder="Durasi (e.g. 2020 - Sekarang)" 
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none"
                      value={work.duration || ''} 
                      onChange={e => onUpdateWork({ ...work, duration: e.target.value })}
                    />
                  </div>
                  
                  {/* List Item-based Work Description Editor */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Butir Deskripsi & Pencapaian</label>
                      <button 
                        type="button" 
                        onClick={() => handleAddWorkDescItem(work)}
                        className="text-[9px] font-black text-indigo-600 uppercase border border-indigo-100 px-3 py-1 rounded-lg hover:bg-indigo-50"
                      >
                        + Item Baru
                      </button>
                    </div>
                    <div className="space-y-2">
                       {(work.description || '').split('\n').map((item, idx) => (
                         <div key={idx} className="flex gap-2 animate-in slide-in-from-right-2 duration-300">
                           <div className="w-1.5 h-1.5 rounded-full bg-indigo-200 mt-4 shrink-0"></div>
                           <input 
                            className="flex-1 bg-white border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-indigo-400"
                            value={item || ''}
                            onChange={(e) => handleUpdateWorkDescItem(work, idx, e.target.value)}
                           />
                           <button 
                            type="button"
                            onClick={() => handleRemoveWorkDescItem(work, idx)}
                            className="w-10 h-10 bg-rose-50 text-rose-400 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"
                           >
                             ✕
                           </button>
                         </div>
                       ))}
                       {(!work.description || work.description.trim() === '') && (
                         <p className="text-[10px] text-slate-400 italic text-center py-4 bg-white/50 border border-dashed rounded-xl">Belum ada butir deskripsi. Klik "Item Baru" untuk memulai.</p>
                       )}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button onClick={() => setIsEditingWork(null)} className="px-10 py-3 bg-indigo-600 text-white font-black rounded-xl text-[10px] uppercase tracking-widest shadow-xl">Selesai</button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-800 text-lg">{work.position || 'Judul Posisi'}</h4>
                    <p className="text-indigo-600 font-semibold text-sm">{work.company || 'Nama Perusahaan'}</p>
                    <p className="text-xs text-slate-400 font-medium mt-1 uppercase">{work.duration}</p>
                    <div className="mt-4 space-y-2">
                       {(work.description || '').split('\n').filter(s => s.trim() !== '').map((item, idx) => (
                         <div key={idx} className="flex gap-3 items-start">
                           <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0"></span>
                           <p className="text-sm text-slate-600 leading-relaxed">{item}</p>
                         </div>
                       ))}
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-100 transition-opacity">
                    <button onClick={() => setIsEditingWork(work.id)} className="p-2 text-slate-400 hover:text-indigo-600">✎</button>
                    <button onClick={() => onDeleteWork(work.id)} className="p-2 text-slate-400 hover:text-red-500">✕</button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {workExperiences.length === 0 && (
            <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
              <p className="text-slate-400 text-sm">Belum ada riwayat pekerjaan.</p>
            </div>
          )}
        </div>
      </section>

      {/* 03: Education */}
      <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold">03</div>
            <h3 className="text-xl font-bold text-slate-800">Pendidikan</h3>
          </div>
          <button 
            onClick={createNewEdu}
            className="px-5 py-2.5 bg-amber-600 text-white font-bold rounded-xl text-sm transition-all hover:bg-amber-700 shadow-md shadow-amber-100"
          >
            + Tambah Pendidikan
          </button>
        </div>

        <div className="space-y-6">
          {educations.map((edu, idx) => (
            <div key={edu.id} className="p-6 rounded-2xl bg-slate-50 border border-slate-100 relative group">
              {isEditingEdu === edu.id ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                      placeholder="Gelar / Program Studi" 
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none"
                      value={edu.degree || ''} 
                      onChange={e => onUpdateEducation({ ...edu, degree: e.target.value })}
                    />
                    <input 
                      placeholder="Institusi" 
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none"
                      value={edu.institution || ''} 
                      onChange={e => onUpdateEducation({ ...edu, institution: e.target.value })}
                    />
                    
                    <div className="md:col-span-2 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Waktu Pendidikan</label>
                        <div className="flex bg-white p-1 rounded-lg border border-slate-100">
                          <button type="button" onClick={() => { setIsRangeEdu(false); handleEduYearChange(edu, startYearEdu, '', false); }} className={`px-3 py-1 text-[9px] font-black rounded-md transition-all ${!isRangeEdu ? 'bg-amber-100 text-amber-700 shadow-sm' : 'text-slate-400'}`}>Single Year</button>
                          <button type="button" onClick={() => setIsRangeEdu(true)} className={`px-3 py-1 text-[9px] font-black rounded-md transition-all ${isRangeEdu ? 'bg-amber-100 text-amber-700 shadow-sm' : 'text-slate-400'}`}>Range</button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input 
                          placeholder="Tahun Mulai/Lulus" 
                          className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none"
                          value={startYearEdu || ''} 
                          onChange={e => handleEduYearChange(edu, e.target.value, endYearEdu, isRangeEdu)}
                        />
                        {isRangeEdu && (
                          <input 
                            placeholder="Tahun Berakhir" 
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none animate-in slide-in-from-left-2"
                            value={endYearEdu || ''} 
                            onChange={e => handleEduYearChange(edu, startYearEdu, e.target.value, true)}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  <textarea 
                    placeholder="Detail singkat (IPK, Fokus Studi, dll.)" 
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none min-h-[80px]"
                    value={edu.description || ''} 
                    onChange={e => onUpdateEducation({ ...edu, description: e.target.value })}
                  />
                  <div className="flex justify-end">
                    <button onClick={() => setIsEditingEdu(null)} className="px-6 py-2 bg-amber-600 text-white font-bold rounded-lg text-xs">Selesai</button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-start">
                  <div className="flex gap-4">
                    <span className="text-slate-900 font-bold text-lg">{idx + 1}.</span>
                    <div>
                      <h4 className="font-bold text-slate-800 text-lg leading-snug">{edu.degree || edu.institution}</h4>
                      {edu.degree && edu.institution && edu.degree !== edu.institution && (
                        <p className="text-slate-700 font-medium text-sm mt-0.5">{edu.institution}</p>
                      )}
                      <p className="text-sm text-slate-500 italic mt-1 font-medium">{edu.year}</p>
                      <p className="text-sm text-slate-600 mt-2 leading-relaxed">{edu.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-100 transition-opacity">
                    <button onClick={() => handleEditEdu(edu)} className="p-2 text-slate-400 hover:text-amber-600">✎</button>
                    <button onClick={() => onDeleteEducation(edu.id)} className="p-2 text-slate-400 hover:text-red-500">✕</button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {educations.length === 0 && (
            <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
              <p className="text-slate-400 text-sm">Belum ada riwayat pendidikan.</p>
            </div>
          )}
        </div>
      </section>

      {/* 04: Future Vision */}
      <section className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-white/10 text-white rounded-xl flex items-center justify-center font-bold">04</div>
            <h3 className="text-xl font-bold">Visi Karir</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Target Jangka Pendek (1-2 thn)</label>
              <input 
                className="w-full px-5 py-4 rounded-2xl border border-white/10 focus:ring-4 focus:ring-blue-500/20 outline-none bg-white/5 transition-all text-white font-medium"
                value={formData.shortTermTarget || ''}
                onChange={e => setFormData({ ...formData, shortTermTarget: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Target Jangka Panjang (5+ thn)</label>
              <input 
                className="w-full px-5 py-4 rounded-2xl border border-white/10 focus:ring-4 focus:ring-blue-500/20 outline-none bg-white/5 transition-all text-white font-medium"
                value={formData.longTermTarget || ''}
                onChange={e => setFormData({ ...formData, longTermTarget: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-8 flex justify-end">
            <button 
              onClick={() => onUpdateProfile(formData)}
              className="px-10 py-4 bg-white text-slate-900 font-extrabold rounded-2xl shadow-xl transition-all transform hover:-translate-y-1 active:scale-95"
            >
              Simpan Target Karir
            </button>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[100px] -mr-32 -mt-32"></div>
      </section>
    </div>
  );
};

const InputGroup: React.FC<{ label: string; value: string | number; onChange: (val: string) => void; type?: string; placeholder?: string }> = ({ label, value, onChange, type = "text", placeholder }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <input 
      type={type} 
      placeholder={placeholder}
      className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/5 outline-none bg-slate-50/30 transition-all text-slate-800 font-medium placeholder:text-slate-300"
      value={value || ''} 
      onChange={e => onChange(e.target.value)}
    />
  </div>
);

export default ProfileView;
