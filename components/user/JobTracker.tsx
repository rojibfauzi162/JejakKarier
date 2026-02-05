
import React, { useState, useMemo } from 'react';
import { JobApplication, JobStatus } from '../../types';

interface JobTrackerProps {
  applications: JobApplication[];
  onAdd: (j: JobApplication) => void;
  onUpdate: (j: JobApplication) => void;
  onDelete: (id: string) => void;
}

const JobTracker: React.FC<JobTrackerProps> = ({ applications, onAdd, onUpdate, onDelete }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<JobApplication | null>(null);

  const getStatusStyle = (status: JobStatus) => {
    switch(status) {
      case JobStatus.SUDAH_KIRIM: return 'bg-blue-50 text-blue-600 border-blue-200';
      case JobStatus.WAWANCARA: return 'bg-purple-50 text-purple-600 border-purple-200';
      case JobStatus.DITOLAK: return 'bg-rose-50 text-rose-600 border-rose-200';
      default: return 'bg-slate-50 text-slate-400 border-slate-300';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-24 lg:pb-16">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <h2 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight uppercase">Loker Tracker</h2>
        <button onClick={() => setIsFormOpen(true)} className="px-6 py-3.5 bg-emerald-600 text-white font-black rounded-2xl shadow-xl hover:bg-emerald-700 transition-all text-xs uppercase tracking-widest">+ Log Lamaran Baru</button>
      </header>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-20 text-center text-slate-400 italic">Daftar lamaran pekerjaan Anda akan muncul di sini.</div>
      </div>
    </div>
  );
};

export default JobTracker;
