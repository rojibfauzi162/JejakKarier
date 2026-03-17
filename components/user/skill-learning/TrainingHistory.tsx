
import React, { useState, useMemo, useEffect } from 'react';
import { Training, TrainingStatus, SkillPriority, CareerEvent, EventType, ImportanceLevel, AppData, SubscriptionPlan } from '../../../types';
import PdfViewer from '../../common/PdfViewer';

interface TrainingHistoryProps {
  trainings: Training[];
  onAddTraining: (t: Training) => void;
  onUpdateTraining: (t: Training) => void;
  onDeleteTraining: (id: string) => void;
  showToast: (m: string, t?: 'success' | 'error' | 'info') => void;
  onAddCalendarEvent?: (e: CareerEvent) => void;
  appData?: AppData;
}

const TrainingHistory: React.FC<TrainingHistoryProps> = ({ trainings, onAddTraining, onUpdateTraining, onDeleteTraining, showToast, onAddCalendarEvent, appData }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Training | null>(null);
  
  // Scheduling Modal State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [schedulingItem, setSchedulingItem] = useState<Training | null>(null);
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduleTime, setScheduleTime] = useState('10:00');

  // Certificate Modal State
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [selectedCert, setSelectedCert] = useState<{link: string, name: string} | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

  const openCertModal = (link: string, name: string) => {
    setSelectedCert({ link, name });
    
    // Create Blob URL for PDF to bypass Chrome's data URI restrictions
    if (link.startsWith('data:application/pdf')) {
      try {
        const byteString = atob(link.split(',')[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: 'application/pdf' });
        setPdfBlobUrl(URL.createObjectURL(blob));
      } catch (e) {
        console.error('Error creating PDF blob:', e);
      }
    } else {
      setPdfBlobUrl(null);
    }
    
    setCertModalOpen(true);
  };

  const closeCertModal = () => {
    setCertModalOpen(false);
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
  };

  const stats = useMemo(() => {
    const total = trainings.length;
    const completed = trainings.filter(t => t.status === TrainingStatus.COMPLETED).length;
    const ongoing = trainings.filter(t => t.status === TrainingStatus.ON_PROCESS).length;
    const cost = trainings.reduce((acc, t) => acc + (t.cost || 0), 0);
    return { total, completed, ongoing, cost };
  }, [trainings]);

  const isOverdue = (t: Training) => {
    if ((t.status === TrainingStatus.PLANNED || t.status === TrainingStatus.ON_PROCESS) && t.deadline) {
       return new Date(t.deadline) < new Date();
    }
    return false;
  };

  const openAddForm = () => {
    // VALIDASI LIMIT DATABASE PAKET FREE
    const limit = appData?.planLimits?.trainingHistory || 2;
    if (appData?.plan === SubscriptionPlan.FREE && trainings.length >= Number(limit)) {
      alert(`Batas riwayat pelatihan tercapai (${limit}). Silakan upgrade paket untuk mendata seluruh perjalanan belajar Anda.`);
      return;
    }
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const openScheduleModal = (t: Training) => {
    setSchedulingItem(t);
    setIsScheduleModalOpen(true);
  };

  const handlePushToCalendar = () => {
    if (!onAddCalendarEvent || !schedulingItem) return;
    
    const eventId = Math.random().toString(36).substr(2, 9);
    const newEvent: CareerEvent = {
      id: eventId,
      title: `Training: ${schedulingItem.name}`,
      type: EventType.TRAINING,
      date: scheduleDate,
      time: scheduleTime,
      importance: ImportanceLevel.MEDIUM,
      notes: `Provider: ${schedulingItem.provider}\nTopic: ${schedulingItem.topic}\nStatus: ${schedulingItem.status}\nBiaya: Rp ${schedulingItem.cost?.toLocaleString()}\nCatatan: ${schedulingItem.notes || '-'}`,
      relatedId: schedulingItem.id
    };

    onAddCalendarEvent(newEvent);
    // Update Training to track it's scheduled
    onUpdateTraining({ ...schedulingItem, calendarEventId: eventId });

    setIsScheduleModalOpen(false);
    setSchedulingItem(null);
    alert(`Pelatihan "${newEvent.title}" berhasil dijadwalkan.`);
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatWidget title="Total Course" value={stats.total} icon="📚" color="blue" />
        <StatWidget title="In Progress" value={stats.ongoing} icon="⏳" color="amber" />
        <StatWidget title="Achievement" value={stats.completed} icon="🔥" color="emerald" />
        <StatWidget title="Investment" value={`Rp ${(stats.cost/1000).toFixed(0)}k`} icon="💎" color="purple" />
      </div>

      <div className="flex justify-end px-1">
        <button onClick={openAddForm} className="px-6 py-3 bg-slate-900 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl hover:bg-black transition-all">+ Add Course</button>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="px-8 py-5">Detail Pelatihan</th>
                <th className="px-6 py-5">Kategori & Platform</th>
                <th className="px-6 py-5 text-center">Status & Progres</th>
                <th className="px-6 py-5 text-center">Masa Berlaku</th>
                <th className="px-8 py-5 text-right">Aksi / Kalender</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {trainings.map(t => {
                const overdue = isOverdue(t);
                const isSchedulable = t.status === TrainingStatus.PLANNED && !t.calendarEventId;
                return (
                  <tr key={t.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <p className="font-bold text-slate-800 text-sm">{t.name}</p>
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Rp {t.cost?.toLocaleString('id-ID')}</p>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">{t.category || 'General'}</p>
                      <p className="text-[10px] font-medium text-slate-400">{t.provider}</p>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <div className="inline-flex flex-col gap-2 items-center min-w-[120px]">
                         <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border ${
                           t.status === TrainingStatus.COMPLETED ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                         }`}>{t.status}</span>
                         {t.status === TrainingStatus.ON_PROCESS && (
                           <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-600" style={{ width: `${t.progress}%` }}></div>
                           </div>
                         )}
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <p className={`text-[10px] font-black uppercase ${overdue ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`}>
                        {overdue ? '⚠️ TERLEWAT' : (t.deadline || 'Bebas')}
                      </p>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2 items-center">
                        {isSchedulable && (
                          <button 
                            onClick={() => openScheduleModal(t)}
                            className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-100"
                            title="Jadwalkan ke Kalender"
                          >
                            <i className="bi bi-calendar-plus"></i>
                          </button>
                        )}
                        {t.calendarEventId && (
                           <div className="p-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl" title="Sudah Dijadwalkan">
                             <i className="bi bi-calendar-check-fill"></i>
                           </div>
                        )}
                        {t.certLink && (
                          <button 
                            onClick={() => openCertModal(t.certLink!, t.name)}
                            className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100"
                            title="Lihat Sertifikat"
                          >
                            <i className="bi bi-award"></i>
                          </button>
                        )}
                        <button onClick={() => { setEditingItem(t); setIsFormOpen(true); }} className="p-2.5 text-slate-400 hover:text-blue-600 transition-all">✎</button>
                        <button onClick={() => { onDeleteTraining(t.id); showToast("Data pelatihan dihapus.", "info"); }} className="p-2.5 text-slate-400 hover:text-rose-600 transition-all">✕</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden p-4 space-y-4">
           {trainings.map(t => {
             const overdue = isOverdue(t);
             const isSchedulable = t.status === TrainingStatus.PLANNED && !t.calendarEventId;
             return (
               <div key={t.id} className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
                  <div className="flex justify-between items-start">
                     <div className="flex-1 mr-4">
                        <h4 className="font-black text-slate-800 text-base leading-tight">{t.name}</h4>
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">Rp {t.cost?.toLocaleString('id-ID')}</p>
                     </div>
                     <div className="flex gap-2">
                        {isSchedulable && (
                          <button onClick={() => openScheduleModal(t)} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg text-indigo-600 shadow-sm border border-indigo-50">
                             <i className="bi bi-calendar-plus"></i>
                          </button>
                        )}
                        {t.calendarEventId && <span className="w-8 h-8 flex items-center justify-center text-emerald-600"><i className="bi bi-calendar-check-fill"></i></span>}
                        {t.certLink && (
                          <button onClick={() => openCertModal(t.certLink!, t.name)} className="w-8 h-8 flex items-center justify-center bg-blue-50 rounded-lg text-blue-600 shadow-sm border border-blue-100">
                             <i className="bi bi-award"></i>
                          </button>
                        )}
                        <button onClick={() => { setEditingItem(t); setIsFormOpen(true); }} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg text-slate-400 shadow-sm border border-slate-100">✎</button>
                        <button onClick={() => onDeleteTraining(t.id)} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg text-slate-400 shadow-sm border border-slate-100">✕</button>
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Platform</p>
                        <p className="text-[11px] font-bold text-slate-700 truncate">{t.provider}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase inline-block border ${
                          t.status === TrainingStatus.COMPLETED ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>{t.status}</span>
                     </div>
                  </div>

                  {t.status === TrainingStatus.ON_PROCESS && (
                    <div className="space-y-2">
                       <div className="flex justify-between items-center">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Progress</span>
                          <span className="text-[10px] font-black text-blue-600">{t.progress}%</span>
                       </div>
                       <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600" style={{ width: `${t.progress}%` }}></div>
                       </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2 border-t border-slate-200/50">
                     <span className="text-[9px] font-black text-slate-400 uppercase">Masa Berlaku</span>
                     <span className={`text-[10px] font-black uppercase ${overdue ? 'text-rose-500' : 'text-slate-600'}`}>
                        {overdue ? '⚠️ Terlewat' : (t.deadline || 'Bebas')}
                     </span>
                  </div>
               </div>
             );
           })}
        </div>
      </div>

      {/* SCHEDULE CONFIRMATION MODAL */}
      {isScheduleModalOpen && schedulingItem && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-[2000] p-4">
           <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 animate-in zoom-in duration-300">
              <div className="text-center mb-8">
                 <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl shadow-inner">
                    <i className="bi bi-calendar-event"></i>
                 </div>
                 <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Jadwalkan Belajar</h3>
                 <p className="text-slate-400 text-xs font-bold leading-relaxed mt-2 uppercase tracking-widest">Pilih tanggal untuk aktivitas belajar:</p>
                 <p className="font-black text-indigo-600 text-sm mt-1">{schedulingItem.name}</p>
              </div>

              <div className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Tanggal</label>
                       <input type="date" className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-xs" value={scheduleDate || ''} onChange={e => setScheduleDate(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Jam</label>
                       <input type="time" className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-xs" value={scheduleTime || ''} onChange={e => setScheduleTime(e.target.value)} />
                    </div>
                 </div>

                 <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setIsScheduleModalOpen(false)} className="flex-1 py-4 bg-slate-50 text-slate-400 font-black rounded-2xl uppercase text-[10px] tracking-widest">Batal</button>
                    <button type="button" onClick={handlePushToCalendar} className="flex-[2] py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase text-[10px] shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all">Konfirmasi Jadwal</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* CERTIFICATE MODAL */}
      {certModalOpen && selectedCert && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-[3000] p-4">
           <div className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl p-8 animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                 <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Sertifikat Pelatihan</h3>
                    <p className="text-slate-500 text-xs font-bold mt-1">{selectedCert.name}</p>
                 </div>
                 <button onClick={closeCertModal} className="w-10 h-10 flex items-center justify-center bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition-all">
                    <i className="bi bi-x-lg"></i>
                 </button>
              </div>

              <div className="flex-1 overflow-auto bg-slate-50 rounded-2xl border border-slate-100 p-4 flex items-center justify-center min-h-[300px]">
                 {selectedCert.link.startsWith('data:image/') ? (
                   <img src={selectedCert.link} alt="Certificate" className="max-w-full max-h-[60vh] object-contain rounded-xl shadow-sm" />
                 ) : selectedCert.link.startsWith('data:application/pdf') || selectedCert.link.endsWith('.pdf') ? (
                   <div className="w-full h-full flex flex-col">
                     <PdfViewer url={pdfBlobUrl || selectedCert.link} className="w-full h-full" />
                   </div>
                 ) : (
                   <div className="text-center space-y-4">
                      <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto text-4xl">
                         <i className="bi bi-link-45deg"></i>
                      </div>
                      <p className="text-sm font-bold text-slate-600">Sertifikat tersedia melalui link eksternal</p>
                      <a href={selectedCert.link} target="_blank" rel="noreferrer" className="inline-block px-6 py-3 bg-blue-600 text-white font-black rounded-xl text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md">
                         Buka Link Sertifikat
                      </a>
                   </div>
                 )}
              </div>

              <div className="mt-6 flex justify-end gap-4">
                 <button onClick={closeCertModal} className="px-6 py-3 bg-slate-100 text-slate-500 font-black rounded-xl uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all">
                    Tutup
                 </button>
                 {selectedCert.link.startsWith('data:') && (
                   <a 
                     href={selectedCert.link} 
                     download={`Sertifikat-${selectedCert.name.replace(/\s+/g, '-')}`}
                     className="px-6 py-3 bg-slate-900 text-white font-black rounded-xl uppercase text-[10px] tracking-widest hover:bg-black transition-all shadow-xl flex items-center gap-2"
                   >
                     <i className="bi bi-download"></i> Download
                   </a>
                 )}
              </div>
           </div>
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-[1000] p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-10 lg:p-12 animate-in zoom-in duration-300 overflow-y-auto max-h-[90vh]">
             <h3 className="text-2xl font-black text-slate-900 uppercase mb-8">{editingItem ? 'Ubah Rencana Belajar' : 'Tambah Pelatihan Baru'}</h3>
             <TrainingForm 
               initialData={editingItem} 
               onSubmit={(data: any) => {
                 if (editingItem) onUpdateTraining({ ...editingItem, ...data } as Training);
                 else onAddTraining({ ...data, id: Math.random().toString(36).substr(2,9) } as Training);
                 setIsFormOpen(false);
                 showToast("Data pelatihan diperbarui!");
               }}
               onCancel={() => setIsFormOpen(false)}
             />
          </div>
        </div>
      )}
    </div>
  );
};

const StatWidget = ({ title, value, icon, color }: any) => {
  const colors: any = { blue: 'bg-blue-50 text-blue-600', amber: 'bg-amber-50 text-amber-600', emerald: 'bg-emerald-50 text-emerald-600', purple: 'bg-purple-50 text-purple-600' };
  return (
    <div className={`p-6 rounded-[2rem] border flex items-center gap-4 bg-white shadow-sm ${colors[color]}`}>
      <div className="text-2xl">{icon}</div>
      <div>
        <p className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-0.5">{title}</p>
        <p className="text-xl font-black text-slate-900">{value}</p>
      </div>
    </div>
  );
};

const TrainingForm = ({ initialData, onSubmit, onCancel }: any) => {
  const [form, setForm] = useState(initialData || { name: '', provider: '', topic: '', status: TrainingStatus.ON_PROCESS, cost: 0, date: new Date().toISOString().split('T')[0], deadline: '', progress: 0, category: '', certLink: '' });
  const [pdfBlobUrl, setPdfBlobUrl] = React.useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadType, setUploadType] = useState<'link' | 'file'>(form.certLink?.startsWith('data:') ? 'file' : 'link');

  React.useEffect(() => {
    if (form.certLink?.startsWith('data:application/pdf')) {
      try {
        const byteString = atob(form.certLink.split(',')[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setPdfBlobUrl(url);
        return () => URL.revokeObjectURL(url);
      } catch (e) {
        console.error('Error creating PDF blob:', e);
      }
    } else {
      setPdfBlobUrl(null);
    }
  }, [form.certLink]);
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit PDF size to 1MB to prevent Firebase payload errors
    if (file.type === 'application/pdf' && file.size > 1024 * 1024) {
      alert('Ukuran file PDF maksimal 1MB. Silakan kompres file Anda terlebih dahulu.');
      return;
    }

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        }
      };

      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          
          if (dataUrl.length > 1024 * 1024 * 1.3) {
             alert('Ukuran gambar terlalu besar. Silakan gunakan gambar dengan resolusi lebih kecil.');
             setUploadProgress(0);
             return;
          }
          
          setForm({...form, certLink: dataUrl});
          setUploadProgress(100);
          setTimeout(() => setUploadProgress(0), 1000);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        }
      };

      reader.onloadend = () => {
        setForm({...form, certLink: reader.result as string});
        setUploadProgress(100);
        setTimeout(() => setUploadProgress(0), 1000);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Judul Pelatihan / Kursus</label>
        <input className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-xs" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategori</label>
          <input className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-xs" value={form.category || ''} onChange={e => setForm({...form, category: e.target.value})} placeholder="Misal: IT, Keuangan, Soft Skill" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Platform / Provider</label>
          <input className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-xs" value={form.provider || ''} onChange={e => setForm({...form, provider: e.target.value})} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Waktu Mulai</label>
          <input type="date" className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white font-bold text-xs" value={form.date || ''} onChange={e => setForm({...form, date: e.target.value})} />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Selesai (Deadline)</label>
          <input type="date" className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white font-bold text-xs" value={form.deadline || ''} onChange={e => setForm({...form, deadline: e.target.value})} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
          <select className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white font-bold text-xs" value={form.status || ''} onChange={e => setForm({...form, status: e.target.value})}>
            {Object.values(TrainingStatus).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Biaya Investasi (IDR)</label>
          <input type="number" className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-xs" value={form.cost || ''} onChange={e => setForm({...form, cost: parseInt(e.target.value) || 0})} />
        </div>
      </div>
      {form.status === TrainingStatus.ON_PROCESS && (
        <div className="space-y-3 p-6 bg-blue-50 rounded-3xl animate-in slide-in-from-top-2">
           <div className="flex justify-between items-center">
              <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Progres Belajar</label>
              <span className="text-xs font-black text-blue-600">{form.progress}%</span>
           </div>
           <input type="range" min="0" max="100" className="w-full h-2 bg-blue-100 rounded-full appearance-none cursor-pointer accent-blue-600" value={form.progress || 0} onChange={e => setForm({...form, progress: parseInt(e.target.value)})} />
        </div>
      )}
      <div className="space-y-3">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bukti Sertifikat</label>
        
        <div className="flex p-1 bg-slate-100 rounded-2xl w-fit mb-2">
          <button 
            type="button"
            onClick={() => setUploadType('link')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${uploadType === 'link' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Link URL
          </button>
          <button 
            type="button"
            onClick={() => setUploadType('file')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${uploadType === 'file' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Upload File
          </button>
        </div>

        {uploadType === 'link' ? (
          <input 
            className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-xs" 
            value={form.certLink?.startsWith('data:') ? '' : (form.certLink || '')} 
            onChange={e => setForm({...form, certLink: e.target.value})} 
            placeholder="https://link-sertifikat.com/..." 
          />
        ) : (
          <div className="space-y-3">
            <div className="flex gap-4">
               <div className="flex-1 px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-xs flex items-center text-slate-400">
                 {form.certLink?.startsWith('data:') ? 'File Berhasil Diupload' : 'Belum ada file'}
               </div>
               {form.certLink?.startsWith('data:') && (
                 <button type="button" onClick={() => setForm({...form, certLink: ''})} className="px-4 py-4 bg-rose-50 text-rose-600 font-black rounded-2xl text-[10px] uppercase hover:bg-rose-100 transition-all">
                   Hapus
                 </button>
               )}
               <label className="px-6 py-4 bg-slate-900 text-white font-black rounded-2xl text-[10px] uppercase cursor-pointer hover:bg-black transition-all flex items-center justify-center min-w-[100px]">
                 {form.certLink?.startsWith('data:') ? 'Ganti' : 'Upload'}
                 <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileUpload} />
               </label>
            </div>

            {uploadProgress > 0 && (
              <div className="space-y-2 p-4 bg-blue-50 rounded-2xl animate-in fade-in">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Mengunggah File...</span>
                  <span className="text-[10px] font-black text-blue-600">{uploadProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-blue-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              </div>
            )}
          </div>
        )}

        {form.certLink && (
           <div className="mt-3 p-4 border border-slate-100 rounded-2xl bg-slate-50/50">
             {form.certLink.startsWith('data:image/') ? (
               <img src={form.certLink} alt="Certificate Preview" className="max-h-40 rounded-xl border border-slate-200 mx-auto" />
             ) : form.certLink.startsWith('data:application/pdf') ? (
               <div className="w-full h-60 flex flex-col">
                 <PdfViewer url={pdfBlobUrl || form.certLink} className="w-full h-full" />
               </div>
             ) : (
               <div className="flex items-center justify-between p-2">
                 <a href={form.certLink} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-2">
                   <i className="bi bi-box-arrow-up-right"></i> Lihat Sertifikat (Link)
                 </a>
                 <span className="text-[9px] font-black text-slate-400 uppercase">External Link</span>
               </div>
             )}
           </div>
        )}
      </div>
      {/* Added missing form footer and buttons */}
      <div className="flex gap-4 pt-4">
        <button type="button" onClick={onCancel} className="flex-1 py-4 bg-slate-100 text-slate-400 font-black rounded-2xl uppercase text-[10px]">Batal</button>
        <button type="button" onClick={() => onSubmit(form)} className="flex-[2] py-4 bg-slate-900 text-white font-black rounded-2xl uppercase text-[10px] shadow-xl">Simpan Pelatihan</button>
      </div>
    </div>
  );
};

/* Added missing default export to fix SkillTracker.tsx import error */
export default TrainingHistory;
