
import React, { useState } from 'react';
import { UserProfile, WorkExperience, Education } from '../types';

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
}

const ProfileView: React.FC<ProfileViewProps> = ({ 
  profile, workExperiences, educations,
  onUpdateProfile, onAddWork, onUpdateWork, onDeleteWork,
  onAddEducation, onUpdateEducation, onDeleteEducation
}) => {
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [isEditingWork, setIsEditingWork] = useState<string | null>(null);
  const [isEditingEdu, setIsEditingEdu] = useState<string | null>(null);

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

  const createNewWork = () => {
    const id = Math.random().toString(36).substr(2, 9);
    onAddWork({ id, position: '', company: '', duration: '', description: '' });
    setIsEditingWork(id);
  };

  const createNewEdu = () => {
    const id = Math.random().toString(36).substr(2, 9);
    onAddEducation({ id, degree: '', institution: '', year: '', description: '' });
    setIsEditingEdu(id);
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <InputGroup label="Nama Lengkap" value={formData.name} onChange={v => setFormData({ ...formData, name: v })} placeholder="e.g. Alex Johnson" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Usia (Otomatis)</label>
              <div className="w-full px-5 py-3.5 rounded-2xl border border-slate-100 bg-slate-50 text-slate-800 font-bold">
                {calculateAge(formData.birthDate)}
              </div>
            </div>
            
            <InputGroup label="Tempat Lahir" value={formData.birthPlace} onChange={v => setFormData({ ...formData, birthPlace: v })} placeholder="e.g. Jakarta" />
            <InputGroup label="Tanggal Lahir" type="date" value={formData.birthDate} onChange={v => setFormData({ ...formData, birthDate: v })} />
            <InputGroup label="Status" value={formData.maritalStatus} onChange={v => setFormData({ ...formData, maritalStatus: v })} placeholder="e.g. Lajang / Menikah" />
            
            <InputGroup label="Email" type="email" value={formData.email} onChange={v => setFormData({ ...formData, email: v })} placeholder="e.g. alex@mail.com" />
            <InputGroup label="Nomor Handphone" value={formData.phone} onChange={v => setFormData({ ...formData, phone: v })} placeholder="e.g. 08123456789" />
            <InputGroup label="Domisili" value={formData.domicile} onChange={v => setFormData({ ...formData, domicile: v })} placeholder="e.g. Jakarta Selatan" />
            
            <InputGroup label="Target Role Utama" value={formData.mainCareer} onChange={v => setFormData({ ...formData, mainCareer: v })} placeholder="e.g. Senior Product Manager" />
            <InputGroup label="Current Company" value={formData.currentCompany} onChange={v => setFormData({ ...formData, currentCompany: v })} placeholder="e.g. Tech Industries" />
            <InputGroup label="Current Title" value={formData.currentPosition} onChange={v => setFormData({ ...formData, currentPosition: v })} placeholder="e.g. Mid-level Engineer" />
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
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                      placeholder="Posisi" 
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none"
                      value={work.position} 
                      onChange={e => onUpdateWork({ ...work, position: e.target.value })}
                    />
                    <input 
                      placeholder="Perusahaan" 
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none"
                      value={work.company} 
                      onChange={e => onUpdateWork({ ...work, company: e.target.value })}
                    />
                    <input 
                      placeholder="Durasi (e.g. 2020 - Sekarang)" 
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none"
                      value={work.duration} 
                      onChange={e => onUpdateWork({ ...work, duration: e.target.value })}
                    />
                  </div>
                  <textarea 
                    placeholder="Deskripsi pekerjaan & pencapaian..." 
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none min-h-[100px]"
                    value={work.description} 
                    onChange={e => onUpdateWork({ ...work, description: e.target.value })}
                  />
                  <div className="flex justify-end">
                    <button onClick={() => setIsEditingWork(null)} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg text-xs">Selesai</button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-800 text-lg">{work.position || 'Judul Posisi'}</h4>
                    <p className="text-indigo-600 font-semibold text-sm">{work.company || 'Nama Perusahaan'}</p>
                    <p className="text-xs text-slate-400 font-medium mt-1 uppercase">{work.duration}</p>
                    <p className="text-sm text-slate-600 mt-4 leading-relaxed line-clamp-3">{work.description}</p>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
          {educations.map(edu => (
            <div key={edu.id} className="p-6 rounded-2xl bg-slate-50 border border-slate-100 relative group">
              {isEditingEdu === edu.id ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                      placeholder="Gelar / Program Studi" 
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none"
                      value={edu.degree} 
                      onChange={e => onUpdateEducation({ ...edu, degree: e.target.value })}
                    />
                    <input 
                      placeholder="Institusi" 
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none"
                      value={edu.institution} 
                      onChange={e => onUpdateEducation({ ...edu, institution: e.target.value })}
                    />
                    <input 
                      placeholder="Tahun Kelulusan" 
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none"
                      value={edu.year} 
                      onChange={e => onUpdateEducation({ ...edu, year: e.target.value })}
                    />
                  </div>
                  <textarea 
                    placeholder="Detail singkat (IPK, Fokus Studi, dll.)" 
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none min-h-[80px]"
                    value={edu.description} 
                    onChange={e => onUpdateEducation({ ...edu, description: e.target.value })}
                  />
                  <div className="flex justify-end">
                    <button onClick={() => setIsEditingEdu(null)} className="px-6 py-2 bg-amber-600 text-white font-bold rounded-lg text-xs">Selesai</button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-800 text-lg">{edu.degree || 'Judul Gelar'}</h4>
                    <p className="text-amber-600 font-semibold text-sm">{edu.institution || 'Nama Institusi'}</p>
                    <p className="text-xs text-slate-400 font-bold mt-1 uppercase">{edu.year}</p>
                    <p className="text-sm text-slate-500 mt-2">{edu.description}</p>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setIsEditingEdu(edu.id)} className="p-2 text-slate-400 hover:text-amber-600">✎</button>
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
                value={formData.shortTermTarget}
                onChange={e => setFormData({ ...formData, shortTermTarget: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Target Jangka Panjang (5+ thn)</label>
              <input 
                className="w-full px-5 py-4 rounded-2xl border border-white/10 focus:ring-4 focus:ring-blue-500/20 outline-none bg-white/5 transition-all text-white font-medium"
                value={formData.longTermTarget}
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
