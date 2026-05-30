
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Contact, AppData, SubscriptionPlan } from '../types';
import { signInWithGoogleContacts } from '../services/firebase';

interface NetworkingProps {
  contacts: Contact[];
  relations?: string[];
  followUpPlans?: string[];
  companies?: string[];
  positions?: string[];
  onAdd: (c: Contact) => void;
  onUpdate: (c: Contact) => void;
  onDelete: (id: string) => void;
  onRenameRelation?: (oldName: string, newName: string) => void;
  onUpdateRelations?: (r: string[]) => void;
  onRenameFollowUpPlan?: (oldName: string, newName: string) => void;
  onUpdateFollowUpPlans?: (p: string[]) => void;
  onRenameCompany?: (oldName: string, newName: string) => void;
  onUpdateCompanies?: (c: string[]) => void;
  onRenamePosition?: (oldName: string, newName: string) => void;
  onUpdatePositions?: (p: string[]) => void;
  appData?: AppData;
  onUpgrade?: () => void;
}

const Networking: React.FC<NetworkingProps> = ({ 
  contacts, 
  relations = ['Rekan (Peer)', 'Mentor', 'Atasan (Superior)', 'Klien (Client)', 'HR / Recruiter'],
  followUpPlans = ['WhatsApp Segera', 'Kirim Email', 'Atur Jadwal Meeting', 'Tunggu Respon', 'Selesai / Terhubung'],
  companies: masterCompanies = [],
  positions: masterPositions = [],
  onAdd, 
  onUpdate, 
  onDelete, 
  onRenameRelation,
  onUpdateRelations,
  onRenameFollowUpPlan,
  onUpdateFollowUpPlans,
  onRenameCompany,
  onUpdateCompanies,
  onRenamePosition,
  onUpdatePositions,
  appData, 
  onUpgrade 
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Contact | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  
  const [showManageMenu, setShowManageMenu] = useState(false);
  
  // Filters
  const [filterCompany, setFilterCompany] = useState('');
  const [filterPosition, setFilterPosition] = useState('');
  const [filterFollowUp, setFilterFollowUp] = useState('');

  const companiesList = useMemo(() => {
    const fromContacts = Array.from(new Set(contacts.map(c => c.company).filter(Boolean)));
    return Array.from(new Set([...masterCompanies, ...fromContacts]));
  }, [contacts, masterCompanies]);

  const positionsList = useMemo(() => {
    const fromContacts = Array.from(new Set(contacts.map(c => c.position).filter(Boolean)));
    return Array.from(new Set([...masterPositions, ...fromContacts]));
  }, [contacts, masterPositions]);

  const filteredContacts = useMemo(() => {
    return contacts.filter(c => {
      const matchesSearch = (c.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) || 
        (c.company || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
        (c.position || '').toLowerCase().includes((searchQuery || '').toLowerCase());
      
      const matchesCompany = !filterCompany || c.company === filterCompany;
      const matchesPosition = !filterPosition || c.position === filterPosition;
      const matchesFollowUp = !filterFollowUp || c.followUpPlan === filterFollowUp;

      return matchesSearch && matchesCompany && matchesPosition && matchesFollowUp;
    });
  }, [contacts, searchQuery, filterCompany, filterPosition, filterFollowUp]);

  const openAddForm = () => {
    // VALIDASI LIMIT DATABASE PAKET FREE
    const limit = appData?.planLimits?.networking || 10;
    if (appData?.plan === SubscriptionPlan.FREE && contacts.length >= Number(limit)) {
      alert(`Batas kontak networking tercapai (${limit}). Silakan upgrade paket untuk mengelola lebih banyak relasi.`);
      onUpgrade?.();
      return;
    }
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const openEditForm = (item: Contact) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const FilterIcon = () => (
    <svg className="w-3 h-3 ml-2 opacity-50 inline" fill="currentColor" viewBox="0 0 20 20">
      <path d="M5 10l5 5 5-5H5z" />
    </svg>
  );

  const limit = appData?.planLimits?.networking || 10;

  const [isSyncing, setIsSyncing] = useState(false);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [googleContacts, setGoogleContacts] = useState<Contact[]>([]);
  const [selectedGoogleIds, setSelectedGoogleIds] = useState<Set<string>>(new Set());
  const [importSearch, setImportSearch] = useState('');
  
  // Selection for export
  const [selectedLocalIds, setSelectedLocalIds] = useState<Set<string>>(new Set());

  const handleGoogleSync = async () => {
    try {
      setIsSyncing(true);
      const authResult = await signInWithGoogleContacts();
      if (!authResult || !authResult.accessToken) {
        alert("Gagal mendapatkan akses ke Google Contacts.");
        return;
      }
      setGoogleAccessToken(authResult.accessToken);
      alert("Berhasil terhubung dengan Google! Silakan klik 'Import Google' untuk melihat daftar kontak.");
    } catch (error: any) {
      console.error("Sync error:", error);
      if (error.code === 'auth/popup-blocked') {
        alert("Popup diblokir! Mohon izinkan popup atau buka di tab baru.");
      } else {
        alert("Gagal sinkronisasi Google.");
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFetchGoogleContacts = async () => {
    if (!googleAccessToken) {
      await handleGoogleSync();
      return;
    }

    try {
      setIsSyncing(true);
      const response = await fetch('/api/contacts', {
        headers: { 'Authorization': `Bearer ${googleAccessToken}` }
      });
      const result = await response.json();
      if (result.success) {
        setGoogleContacts(result.contacts);
        setSelectedGoogleIds(new Set());
        setShowImportModal(true);
      } else {
        if (response.status === 401) {
          setGoogleAccessToken(null);
          alert("Sesi Google berakhir, silakan sinkron ulang.");
        } else {
          alert("Gagal mengambil kontak: " + result.error);
        }
      }
    } catch (error) {
      alert("Terjadi kesalahan koneksi.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleImportSelected = () => {
    const toImport = googleContacts.filter(c => selectedGoogleIds.has(c.id));
    if (toImport.length === 0) return;
    
    // Filter existing by email
    const newItems = toImport.filter(ni => !contacts.some(c => c.email && c.email.toLowerCase() === ni.email.toLowerCase()));
    
    if (newItems.length === 0) {
      alert("Semua kontak yang dipilih sudah ada di daftar.");
    } else {
      newItems.forEach(ni => onAdd(ni));
      alert(`Berhasil mengimpor ${newItems.length} kontak!`);
      setShowImportModal(false);
    }
  };

  const handleExportSelected = async () => {
    if (selectedLocalIds.size === 0) {
      alert("Pilih minimal satu kontak lokal untuk diekspor.");
      return;
    }

    if (!googleAccessToken) {
      await handleGoogleSync();
      return;
    }

    const toExport = contacts.filter(c => selectedLocalIds.has(c.id));

    try {
      setIsSyncing(true);
      const response = await fetch('/api/contacts/export', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${googleAccessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ contacts: toExport })
      });

      const result = await response.json();
      if (result.success) {
        const successCount = result.results.filter((r: any) => r.success).length;
        alert(`Export selesai: ${successCount} berhasil, ${toExport.length - successCount} gagal.`);
        setSelectedLocalIds(new Set());
      } else {
        alert("Gagal export: " + result.error);
      }
    } catch (error) {
      alert("Gagal export kontak.");
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredGoogleContacts = googleContacts.filter(c => 
    c.name.toLowerCase().includes(importSearch.toLowerCase()) || 
    c.email.toLowerCase().includes(importSearch.toLowerCase())
  );

  const toggleSelectAllLocal = () => {
    if (selectedLocalIds.size === contacts.length) {
      setSelectedLocalIds(new Set());
    } else {
      setSelectedLocalIds(new Set(contacts.map(c => c.id)));
    }
  };

  const [showRelationManager, setShowRelationManager] = useState(false);
  const [newRelationName, setNewRelationName] = useState('');
  const [editingRelation, setEditingRelation] = useState<{old: string, next: string} | null>(null);

  const handleAddRelation = () => {
    if (!newRelationName.trim()) return;
    if (relations.includes(newRelationName.trim())) {
      alert("Relasi sudah ada.");
      return;
    }
    const next = [...relations, newRelationName.trim()];
    onUpdateRelations?.(next);
    setNewRelationName('');
  };

  const handleDeleteRelation = (rel: string) => {
    if (!window.confirm(`Hapus tipe relasi "${rel}"? Kontak yang menggunakan tipe ini akan tetap memilikinya sampai diubah.`)) return;
    const next = relations.filter(r => r !== rel);
    onUpdateRelations?.(next);
  };

  const handleRenameRelation = () => {
    if (!editingRelation || !editingRelation.next.trim()) return;
    if (relations.includes(editingRelation.next.trim()) && editingRelation.next.trim() !== editingRelation.old) {
      alert("Nama relasi baru sudah ada.");
      return;
    }
    
    if (onRenameRelation) {
      onRenameRelation(editingRelation.old, editingRelation.next.trim());
    } else {
      const next = relations.map(r => r === editingRelation.old ? editingRelation.next.trim() : r);
      onUpdateRelations?.(next);
    }
    
    setEditingRelation(null);
  };
  
  const [showFollowUpManager, setShowFollowUpManager] = useState(false);
  const [newFollowUpName, setNewFollowUpName] = useState('');
  const [editingFollowUp, setEditingFollowUp] = useState<{old: string, next: string} | null>(null);

  const handleAddFollowUp = () => {
    if (!newFollowUpName.trim()) return;
    if (followUpPlans.includes(newFollowUpName.trim())) {
      alert("Rencana sudah ada.");
      return;
    }
    const next = [...followUpPlans, newFollowUpName.trim()];
    onUpdateFollowUpPlans?.(next);
    setNewFollowUpName('');
  };

  const handleDeleteFollowUp = (p: string) => {
    if (!window.confirm(`Hapus rencana "${p}"? Kontak yang menggunakan rencana ini akan tetap memilikinya sampai diubah.`)) return;
    const next = followUpPlans.filter(item => item !== p);
    onUpdateFollowUpPlans?.(next);
  };

  const handleRenameFollowUp = () => {
    if (!editingFollowUp || !editingFollowUp.next.trim()) return;
    if (followUpPlans.includes(editingFollowUp.next.trim()) && editingFollowUp.next.trim() !== editingFollowUp.old) {
      alert("Nama rencana baru sudah ada.");
      return;
    }
    
    if (onRenameFollowUpPlan) {
      onRenameFollowUpPlan(editingFollowUp.old, editingFollowUp.next.trim());
    } else {
      const next = followUpPlans.map(p => p === editingFollowUp.old ? editingFollowUp.next.trim() : p);
      onUpdateFollowUpPlans?.(next);
    }
    
    setEditingFollowUp(null);
  };

  const [showCompanyManager, setShowCompanyManager] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [editingCompany, setEditingCompany] = useState<{old: string, next: string} | null>(null);

  const handleAddCompany = () => {
    if (!newCompanyName.trim()) return;
    if (masterCompanies.includes(newCompanyName.trim())) {
      alert("Perusahaan sudah ada.");
      return;
    }
    const next = [...masterCompanies, newCompanyName.trim()];
    onUpdateCompanies?.(next);
    setNewCompanyName('');
  };

  const handleDeleteCompany = (comp: string) => {
    if (!window.confirm(`Hapus perusahaan "${comp}"? Kontak yang menggunakan perusahaan ini akan tetap memilikinya sampai diubah.`)) return;
    const next = masterCompanies.filter(item => item !== comp);
    onUpdateCompanies?.(next);
  };

  const handleRenameCompany = () => {
    if (!editingCompany || !editingCompany.next.trim()) return;
    if (masterCompanies.includes(editingCompany.next.trim()) && editingCompany.next.trim() !== editingCompany.old) {
      alert("Nama perusahaan baru sudah ada.");
      return;
    }
    if (onRenameCompany) {
      onRenameCompany(editingCompany.old, editingCompany.next.trim());
    } else {
      const next = masterCompanies.map(c => c === editingCompany.old ? editingCompany.next.trim() : c);
      onUpdateCompanies?.(next);
    }
    setEditingCompany(null);
  };

  const [showPositionManager, setShowPositionManager] = useState(false);
  const [newPositionName, setNewPositionName] = useState('');
  const [editingPosition, setEditingPosition] = useState<{old: string, next: string} | null>(null);

  const handleAddPosition = () => {
    if (!newPositionName.trim()) return;
    if (masterPositions.includes(newPositionName.trim())) {
      alert("Jabatan sudah ada.");
      return;
    }
    const next = [...masterPositions, newPositionName.trim()];
    onUpdatePositions?.(next);
    setNewPositionName('');
  };

  const handleDeletePosition = (pos: string) => {
    if (!window.confirm(`Hapus jabatan "${pos}"? Kontak yang menggunakan jabatan ini akan tetap memilikinya sampai diubah.`)) return;
    const next = masterPositions.filter(item => item !== pos);
    onUpdatePositions?.(next);
  };

  const handleRenamePosition = () => {
    if (!editingPosition || !editingPosition.next.trim()) return;
    if (masterPositions.includes(editingPosition.next.trim()) && editingPosition.next.trim() !== editingPosition.old) {
      alert("Nama jabatan baru sudah ada.");
      return;
    }
    if (onRenamePosition) {
      onRenamePosition(editingPosition.old, editingPosition.next.trim());
    } else {
      const next = masterPositions.map(p => p === editingPosition.old ? editingPosition.next.trim() : p);
      onUpdatePositions?.(next);
    }
    setEditingPosition(null);
  };

  return (
    <div className="space-y-4 md:space-y-8 animate-in fade-in duration-700 pb-24 lg:pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-6">
        <div>
          <h2 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">Networking Tracker</h2>
          <p className="text-slate-500 mt-1 text-xs lg:text-sm">Lacak relasi profesional, mentor, dan rekan industri Anda.</p>
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button 
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <i className="bi bi-table mr-2"></i>
              Table
            </button>
            <button 
              onClick={() => setViewMode('kanban')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'kanban' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <i className="bi bi-kanban mr-2"></i>
              Kanban
            </button>
          </div>

          {/* Manage master data dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowManageMenu(!showManageMenu)}
              className={`px-6 py-3.5 border-2 font-black rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest ${showManageMenu ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
            >
              <i className="bi bi-grid-fill"></i>
              Data Relasi
              <i className={`bi bi-chevron-${showManageMenu ? 'up' : 'down'} ml-1`}></i>
            </button>

            <AnimatePresence>
              {showManageMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowManageMenu(false)}></div>
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute right-0 mt-3 w-64 bg-white rounded-[2rem] shadow-2xl border border-slate-100 z-50 overflow-hidden"
                  >
                    <div className="p-3 grid grid-cols-1 gap-1">
                      <button 
                        onClick={() => { setShowCompanyManager(true); setShowManageMenu(false); }}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-xl transition-all text-left"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><i className="bi bi-building"></i></div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-800">Perusahaan</p>
                          <p className="text-[9px] text-slate-400 font-bold">Kelola Daftar Perusahaan</p>
                        </div>
                      </button>
                      <button 
                        onClick={() => { setShowPositionManager(true); setShowManageMenu(false); }}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-xl transition-all text-left"
                      >
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><i className="bi bi-person-badge"></i></div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-800">Jabatan</p>
                          <p className="text-[9px] text-slate-400 font-bold">Kelola Daftar Jabatan</p>
                        </div>
                      </button>
                      <button 
                        onClick={() => { setShowFollowUpManager(true); setShowManageMenu(false); }}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-xl transition-all text-left"
                      >
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center"><i className="bi bi-list-check"></i></div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-800">Rencana</p>
                          <p className="text-[9px] text-slate-400 font-bold">Kelola Action Plan</p>
                        </div>
                      </button>
                      <button 
                        onClick={() => { setShowRelationManager(true); setShowManageMenu(false); }}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-xl transition-all text-left"
                      >
                        <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center"><i className="bi bi-gear-fill"></i></div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-800">Hubungan</p>
                          <p className="text-[9px] text-slate-400 font-bold">Kelola Tipe Relasi</p>
                        </div>
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          {!googleAccessToken ? (
            <button 
              onClick={handleGoogleSync}
              disabled={isSyncing}
              className="w-full md:w-auto px-6 py-3.5 bg-white text-blue-600 border-2 border-blue-600 font-black rounded-2xl shadow-sm hover:bg-blue-50 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest disabled:opacity-50"
            >
              <i className={`bi bi-google ${isSyncing ? 'animate-spin' : ''}`}></i>
              {isSyncing ? 'Connecting...' : 'Sync Google'}
            </button>
          ) : (
            <>
              <button 
                onClick={handleFetchGoogleContacts}
                disabled={isSyncing}
                className="w-full md:w-auto px-6 py-3.5 bg-white text-emerald-600 border-2 border-emerald-600 font-black rounded-2xl shadow-sm hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest disabled:opacity-50"
              >
                <i className={`bi bi-download ${isSyncing ? 'animate-spin' : ''}`}></i>
                Import Google
              </button>
              <button 
                onClick={handleExportSelected}
                disabled={isSyncing}
                className="w-full md:w-auto px-6 py-3.5 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest disabled:opacity-50"
              >
                <i className={`bi bi-upload ${isSyncing ? 'animate-spin' : ''}`}></i>
                Export ({selectedLocalIds.size})
              </button>
            </>
          )}
          <button onClick={openAddForm} className="w-full md:w-auto px-6 py-3.5 bg-blue-600 text-white font-black rounded-2xl shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest">
            <span className="text-xl">+</span>
            Kontak Baru
          </button>
        </div>
      </header>

      {/* INFO KUOTA (QUOTA BANNER) - HIDDEN FOR PRO USERS */}
      {appData?.plan === SubscriptionPlan.FREE && (
        <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-[2rem] flex flex-col sm:flex-row justify-between items-center gap-3 md:gap-6 mx-1 shadow-sm">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-indigo-200">
                 <i className="bi bi-people-fill"></i>
              </div>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kapasitas Networking Vault ({appData?.plan})</p>
                 <p className="text-sm font-black text-slate-800 tracking-tight">
                    {contacts.length} / {limit === 'unlimited' ? '∞' : limit} Relasi Terdaftar
                 </p>
              </div>
           </div>
           <button 
              onClick={onUpgrade}
              className="w-full sm:w-auto px-8 py-3 bg-white text-indigo-600 font-black rounded-xl text-[10px] uppercase tracking-widest shadow-sm border border-indigo-100 hover:bg-indigo-50 transition-all active:scale-95"
           >
              🚀 Upgrade Plan
           </button>
        </div>
      )}

      {/* Summary Box & Search Toggle */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
        <div className="flex w-full lg:w-[400px] border-2 border-slate-900 overflow-hidden rounded-2xl shadow-sm">
          <div className="bg-blue-600 text-white px-4 lg:px-6 py-2.5 flex-1 font-black text-[10px] lg:text-xs uppercase tracking-widest flex items-center justify-center border-r-2 border-slate-900">
            TOTAL KONTAK
          </div>
          <div className="bg-slate-100 flex-1 flex items-center justify-center text-lg lg:text-xl font-black text-slate-900">
            {contacts.length}
          </div>
        </div>
        
        <button 
          onClick={() => setShowSearch(!showSearch)}
          className={`w-12 h-12 flex items-center justify-center rounded-full border-2 transition-all shrink-0 ${showSearch ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100' : 'bg-white text-slate-400 hover:text-blue-500 hover:border-blue-200 shadow-sm'}`}
        >
          <i className={`bi ${showSearch ? 'bi-x-lg' : 'bi-search'}`}></i>
        </button>
      </div>

      {/* Collapsible Search & Filters */}
      <AnimatePresence>
        {showSearch && (
          <motion.div 
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-4 bg-slate-50/50 p-4 lg:p-6 rounded-[2rem] border border-slate-100 mb-2 shadow-sm">
               {/* Search Input Row */}
               <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500">
                    <i className="bi bi-search"></i>
                  </span>
                  <input 
                    type="text"
                    placeholder="Cari nama, jabatan, perusahaan..."
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-white shadow-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-xs"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
               </div>

               {/* Advanced Filters Row */}
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <select 
                    className="px-4 py-3.5 rounded-2xl border border-slate-200 bg-white shadow-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-xs cursor-pointer"
                    value={filterCompany}
                    onChange={(e) => setFilterCompany(e.target.value)}
                  >
                    <option value="">Semua Perusahaan</option>
                    {companiesList.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select 
                    className="px-4 py-3.5 rounded-2xl border border-slate-200 bg-white shadow-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-xs cursor-pointer"
                    value={filterPosition}
                    onChange={(e) => setFilterPosition(e.target.value)}
                  >
                    <option value="">Semua Jabatan</option>
                    {positionsList.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <select 
                    className="px-4 py-3.5 rounded-2xl border border-slate-200 bg-white shadow-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-xs cursor-pointer"
                    value={filterFollowUp}
                    onChange={(e) => setFilterFollowUp(e.target.value)}
                  >
                    <option value="">Semua Rencana</option>
                    {followUpPlans.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content (Table or Kanban) */}
      {viewMode === 'table' ? (
        <>
          {/* Responsive Content: Table for Desktop, Cards for Mobile */}
          <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1100px]">
          <thead>
            <tr className="bg-emerald-500 text-white text-[11px] font-black uppercase tracking-widest">
              <th className="px-4 py-4 border-r border-white/20 text-center w-12 bg-slate-800">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded cursor-pointer accent-blue-600"
                  checked={contacts.length > 0 && selectedLocalIds.size === contacts.length}
                  onChange={toggleSelectAllLocal}
                />
              </th>
              <th className="px-4 py-4 border-r border-white/20 text-center w-14 bg-blue-600">NO</th>
              <th className="px-4 py-3 md:px-6 md:py-4 border-r border-white/20 w-52">NAMA KONTAK <FilterIcon /></th>
              <th className="px-4 py-3 md:px-6 md:py-4 border-r border-white/20 w-44">NO HP <FilterIcon /></th>
              <th className="px-4 py-3 md:px-6 md:py-4 border-r border-white/20 w-44">EMAIL <FilterIcon /></th>
              <th className="px-4 py-3 md:px-6 md:py-4 border-r border-white/20 w-48">JABATAN <FilterIcon /></th>
              <th className="px-4 py-3 md:px-6 md:py-4 border-r border-white/20 w-48">PERUSAHAAN <FilterIcon /></th>
              <th className="px-4 py-3 md:px-6 md:py-4 border-r border-white/20">CATATAN INTERAKSI <FilterIcon /></th>
              <th className="px-4 py-3 md:px-6 md:py-4">RENCANA FOLLOW UP <FilterIcon /></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredContacts.map((contact, index) => (
              <tr key={contact.id} className={`hover:bg-slate-50 transition-colors group ${selectedLocalIds.has(contact.id) ? 'bg-blue-50/50' : ''}`}>
                <td className="px-4 py-5 border-r border-slate-200 text-center">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded cursor-pointer accent-blue-600"
                    checked={selectedLocalIds.has(contact.id)}
                    onChange={() => {
                      const newSet = new Set(selectedLocalIds);
                      if (newSet.has(contact.id)) newSet.delete(contact.id);
                      else newSet.add(contact.id);
                      setSelectedLocalIds(newSet);
                    }}
                  />
                </td>
                <td className="px-4 py-5 border-r border-slate-200 text-center bg-blue-50/20 font-black text-blue-600">{index + 1}</td>
                <td className="px-6 py-5 border-r border-slate-200">
                  <div className="font-black text-slate-800 text-sm">{contact.name}</div>
                  <div className="mt-1">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-wider rounded-md">{contact.relation}</span>
                  </div>
                </td>
                <td className="px-6 py-5 border-r border-slate-200 font-bold text-slate-600 text-xs">{contact.phone || '-'}</td>
                <td className="px-6 py-5 border-r border-slate-200 font-bold text-blue-500 text-xs truncate max-w-[150px]">{contact.email || '-'}</td>
                <td className="px-6 py-5 border-r border-slate-200 font-black text-slate-700 text-sm truncate">{contact.position}</td>
                <td className="px-6 py-5 border-r border-slate-200 font-bold text-slate-500 text-sm truncate">{contact.company}</td>
                <td className="px-6 py-5 border-r border-slate-200">
                  <p className="text-xs text-slate-600 leading-relaxed font-medium line-clamp-2">"{contact.lastInteractionNote}"</p>
                </td>
                <td className="px-6 py-5">
                  <div className="flex justify-between items-center gap-4">
                    <p className="text-xs text-emerald-600 font-black leading-relaxed italic line-clamp-2">{contact.followUpPlan || 'Belum ada rencana'}</p>
                    <div className="flex gap-1 opacity-100 transition-opacity">
                      <button onClick={() => openEditForm(contact)} className="p-2 text-slate-400 hover:text-blue-600">✎</button>
                      <button onClick={() => onDelete(contact.id)} className="p-2 text-slate-400 hover:text-red-500">✕</button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Contact Cards */}
      <div className="lg:hidden space-y-4">
        {filteredContacts.map((contact, index) => (
          <div key={contact.id} className="bg-white rounded-[2rem] p-3 md:p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-xs">#{index + 1}</div>
                <div>
                  <h4 className="font-black text-slate-800 text-base leading-tight">{contact.name}</h4>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[8px] font-black uppercase tracking-widest rounded-md">{contact.relation}</span>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEditForm(contact)} className="p-2 text-slate-300">✎</button>
                <button onClick={() => onDelete(contact.id)} className="p-2 text-slate-300">✕</button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-2xl">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Position</p>
                  <p className="text-[11px] font-bold text-slate-700 truncate">{contact.position}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Company</p>
                  <p className="text-[11px] font-bold text-slate-700 truncate">{contact.company}</p>
                </div>
              </div>

              <div className="bg-blue-50/30 p-4 rounded-2xl border border-blue-50/50">
                <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">Last Interaction</p>
                <p className="text-xs font-medium text-slate-600 leading-relaxed italic">" {contact.lastInteractionNote} "</p>
              </div>

              {contact.followUpPlan && (
                <div className="bg-emerald-50/30 p-4 rounded-2xl border border-emerald-50/50">
                  <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-1">Next Plan</p>
                  <p className="text-xs font-black text-emerald-600 italic">★ {contact.followUpPlan}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                {contact.phone && <span className="text-[10px] font-bold text-slate-400">📞 {contact.phone}</span>}
                {contact.email && <span className="text-[10px] font-bold text-slate-400">✉️ {contact.email}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  ) : (
        /* Kanban Canvasing View */
        <div className="flex gap-6 overflow-x-auto pb-6 -mx-1 px-1 min-h-[600px] animate-in fade-in duration-500">
          {followUpPlans.map(plan => {
            const columnContacts = filteredContacts.filter(c => c.followUpPlan === plan);
            return (
              <div key={plan} className="w-[320px] flex-shrink-0 flex flex-col gap-4">
                <div className="flex items-center justify-between px-2">
                  <h4 className="font-black text-slate-800 text-xs uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    {plan}
                    <span className="ml-1 bg-slate-100 text-slate-400 px-2 py-0.5 rounded-lg text-[10px]">{columnContacts.length}</span>
                  </h4>
                </div>
                
                <div className="flex-1 space-y-4 bg-slate-50/50 p-2 rounded-[2rem] border-2 border-dashed border-slate-100">
                  {columnContacts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                       <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Belum ada relasi</p>
                    </div>
                  ) : (
                    columnContacts.map(contact => (
                      <div 
                        key={contact.id} 
                        className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer group"
                        onClick={() => openEditForm(contact)}
                      >
                         <div className="flex flex-col gap-3">
                            <div>
                               <div className="flex items-center justify-between">
                                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-500 text-[8px] font-black uppercase tracking-widest rounded-md">{contact.relation}</span>
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                     <button className="text-slate-300 hover:text-blue-500 text-xs">✎</button>
                                  </div>
                               </div>
                               <h5 className="font-black text-slate-800 text-sm mt-2">{contact.name}</h5>
                            </div>

                            <div className="space-y-1">
                               <p className="text-[10px] font-bold text-slate-500 truncate">{contact.position}</p>
                               <p className="text-[11px] font-black text-emerald-600 truncate">{contact.company}</p>
                            </div>

                            <div className="pt-2 border-t border-slate-50">
                               <p className="text-[10px] text-slate-400 italic line-clamp-2">"{contact.lastInteractionNote}"</p>
                            </div>

                            <div className="flex items-center justify-between text-[9px] font-black text-slate-300 uppercase tracking-tighter">
                               <span>📅 {contact.lastInteractionDate}</span>
                            </div>
                         </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
          
          {/* Uncategorized / Unknown column if needed */}
          {filteredContacts.filter(c => !c.followUpPlan || !followUpPlans.includes(c.followUpPlan)).length > 0 && (
             <div className="w-[320px] flex-shrink-0 flex flex-col gap-4">
                <div className="flex items-center justify-between px-2">
                  <h4 className="font-black text-slate-400 text-xs uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                    Tanpa Rencana
                    <span className="ml-1 bg-slate-100 text-slate-400 px-2 py-0.5 rounded-lg text-[10px]">
                      {filteredContacts.filter(c => !c.followUpPlan || !followUpPlans.includes(c.followUpPlan)).length}
                    </span>
                  </h4>
                </div>
                <div className="flex-1 space-y-4 bg-slate-50/50 p-2 rounded-[2rem] border-2 border-dashed border-slate-100">
                  {filteredContacts.filter(c => !c.followUpPlan || !followUpPlans.includes(c.followUpPlan)).map(contact => (
                    <div 
                      key={contact.id} 
                      className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:border-emerald-200 transition-all cursor-pointer group"
                      onClick={() => openEditForm(contact)}
                    >
                       <h5 className="font-black text-slate-800 text-sm">{contact.name}</h5>
                       <p className="text-[10px] font-bold text-slate-500">{contact.position} at {contact.company}</p>
                    </div>
                  ))}
                </div>
             </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-0 sm:p-4">
          <div className="bg-white w-full max-w-2xl rounded-[1.5rem] md:rounded-[2.5rem] shadow-2xl p-5 md:p-4 md:p-6 lg:p-10 animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto relative">
            <button onClick={() => setIsFormOpen(false)} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors z-[60]"><i className="bi bi-x-lg"></i></button>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-4 md:mb-8">
              {editingItem ? 'Update Contact' : 'New Networking Contact'}
            </h3>
            <ContactForm 
              initialData={editingItem}
              relations={relations}
              followUpPlans={followUpPlans}
              companies={companiesList}
              positions={positionsList}
              onSubmit={(data) => {
                if (editingItem) {
                  onUpdate({ ...editingItem, ...data } as Contact);
                } else {
                  onAdd({ ...data, id: Math.random().toString(36).substr(2, 9) } as Contact);
                }
                setIsFormOpen(false);
              }}
              onCancel={() => setIsFormOpen(false)}
            />
          </div>
        </div>
      )}
      
      {/* Follow-up Plan Manager Modal */}
      {showFollowUpManager && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[110] p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in duration-300">
            <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-indigo-50">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Rencana</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Kelola opsi rencana tindak lanjut Anda.</p>
              </div>
              <button onClick={() => setShowFollowUpManager(false)} className="w-10 h-10 flex items-center justify-center bg-white text-slate-400 hover:text-slate-600 rounded-full shadow-sm"><i className="bi bi-x-lg"></i></button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  className="flex-1 px-5 py-3 rounded-xl border border-slate-200 outline-none bg-slate-50/50 font-bold text-xs"
                  placeholder="Nama rencana baru... (misal: Follow UP via LinkedIn)"
                  value={newFollowUpName}
                  onChange={(e) => setNewFollowUpName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddFollowUp()}
                />
                <button onClick={handleAddFollowUp} className="px-6 py-3 bg-indigo-600 text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700">Tambah</button>
              </div>

              <div className="space-y-2 overflow-y-auto max-h-[50vh] pr-2">
                {followUpPlans.map(p => (
                  <div key={p} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white group hover:border-indigo-200 transition-all">
                    {editingFollowUp?.old === p ? (
                      <div className="flex-1 flex gap-2">
                        <input 
                          type="text" 
                          className="flex-1 px-4 py-2 rounded-lg border border-indigo-200 outline-none bg-indigo-50/30 font-bold text-xs"
                          value={editingFollowUp.next}
                          autoFocus
                          onChange={(e) => setEditingFollowUp({...editingFollowUp, next: e.target.value})}
                          onKeyDown={(e) => e.key === 'Enter' && handleRenameFollowUp()}
                        />
                        <button onClick={handleRenameFollowUp} className="text-indigo-600 font-black text-xs px-2">OK</button>
                        <button onClick={() => setEditingFollowUp(null)} className="text-slate-400 font-black text-xs px-2">X</button>
                      </div>
                    ) : (
                      <>
                        <span className="font-bold text-slate-700 text-sm">{p}</span>
                        <div className="flex gap-2">
                          <button onClick={() => setEditingFollowUp({old: p, next: p})} className="p-2 text-slate-300 hover:text-indigo-500 transition-colors"><i className="bi bi-pencil-square"></i></button>
                          <button onClick={() => handleDeleteFollowUp(p)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><i className="bi bi-trash3"></i></button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 italic">
               <p className="text-[10px] text-slate-400 font-medium text-center">Mengubah nama rencana akan memperbarui semua kontak yang menggunakan rencana tersebut.</p>
            </div>
          </div>
        </div>
      )}

      {/* Relation Manager Modal */}
      {showRelationManager && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[110] p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in duration-300">
            <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Hubungan</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Kelola opsi dropdown hubungan Anda.</p>
              </div>
              <button onClick={() => setShowRelationManager(false)} className="w-10 h-10 flex items-center justify-center bg-white text-slate-400 hover:text-slate-600 rounded-full shadow-sm"><i className="bi bi-x-lg"></i></button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  className="flex-1 px-5 py-3 rounded-xl border border-slate-200 outline-none bg-slate-50/50 font-bold text-xs"
                  placeholder="Nama relasi baru... (misal: Family, Partner)"
                  value={newRelationName}
                  onChange={(e) => setNewRelationName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddRelation()}
                />
                <button onClick={handleAddRelation} className="px-6 py-3 bg-blue-600 text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700">Tambah</button>
              </div>

              <div className="space-y-2 overflow-y-auto max-h-[50vh] pr-2">
                {relations.map(rel => (
                  <div key={rel} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white group hover:border-blue-200 transition-all">
                    {editingRelation?.old === rel ? (
                      <div className="flex-1 flex gap-2">
                        <input 
                          type="text" 
                          className="flex-1 px-4 py-2 rounded-lg border border-blue-200 outline-none bg-blue-50/30 font-bold text-xs"
                          value={editingRelation.next}
                          autoFocus
                          onChange={(e) => setEditingRelation({...editingRelation, next: e.target.value})}
                          onKeyDown={(e) => e.key === 'Enter' && handleRenameRelation()}
                        />
                        <button onClick={handleRenameRelation} className="text-blue-600 font-black text-xs px-2">OK</button>
                        <button onClick={() => setEditingRelation(null)} className="text-slate-400 font-black text-xs px-2">X</button>
                      </div>
                    ) : (
                      <>
                        <span className="font-bold text-slate-700 text-sm">{rel}</span>
                        <div className="flex gap-2">
                          <button onClick={() => setEditingRelation({old: rel, next: rel})} className="p-2 text-slate-300 hover:text-blue-500 transition-colors"><i className="bi bi-pencil-square"></i></button>
                          <button onClick={() => handleDeleteRelation(rel)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><i className="bi bi-trash3"></i></button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 italic">
               <p className="text-[10px] text-slate-400 font-medium text-center">Menghapus data tipe relasi tidak akan mengubah data kontak lama yang sudah menggunakannya.</p>
            </div>
          </div>
        </div>
      )}

      {/* Perusahaan Manager Modal */}
      {showCompanyManager && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[110] p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in duration-300">
            <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Perusahaan</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Kelola daftar perusahaan relasi Anda.</p>
              </div>
              <button onClick={() => setShowCompanyManager(false)} className="w-10 h-10 flex items-center justify-center bg-white text-slate-400 hover:text-slate-600 rounded-full shadow-sm"><i className="bi bi-x-lg"></i></button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  className="flex-1 px-5 py-3 rounded-xl border border-slate-200 outline-none bg-slate-50/50 font-bold text-xs"
                  placeholder="Nama perusahaan baru..."
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCompany()}
                />
                <button onClick={handleAddCompany} className="px-6 py-3 bg-blue-600 text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700">Tambah</button>
              </div>

              <div className="space-y-2 overflow-y-auto max-h-[50vh] pr-2">
                {masterCompanies.map(c => (
                  <div key={c} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white group hover:border-blue-200 transition-all">
                    {editingCompany?.old === c ? (
                      <div className="flex-1 flex gap-2">
                        <input 
                          type="text" 
                          className="flex-1 px-4 py-2 rounded-lg border border-blue-200 outline-none bg-blue-50/30 font-bold text-xs"
                          value={editingCompany.next}
                          autoFocus
                          onChange={(e) => setEditingCompany({...editingCompany, next: e.target.value})}
                          onKeyDown={(e) => e.key === 'Enter' && handleRenameCompany()}
                        />
                        <button onClick={handleRenameCompany} className="text-blue-600 font-black text-xs px-2">OK</button>
                        <button onClick={() => setEditingCompany(null)} className="text-slate-400 font-black text-xs px-2">X</button>
                      </div>
                    ) : (
                      <>
                        <span className="font-bold text-slate-700 text-sm">{c}</span>
                        <div className="flex gap-2">
                          <button onClick={() => setEditingCompany({old: c, next: c})} className="p-2 text-slate-300 hover:text-blue-500 transition-colors"><i className="bi bi-pencil-square"></i></button>
                          <button onClick={() => handleDeleteCompany(c)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><i className="bi bi-trash3"></i></button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 italic">
               <p className="text-[10px] text-slate-400 font-medium text-center">Menghapus data perusahaan tidak akan mengubah data kontak lama yang sudah menggunakannya.</p>
            </div>
          </div>
        </div>
      )}

      {/* Jabatan Manager Modal */}
      {showPositionManager && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[110] p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in duration-300">
            <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Jabatan</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Kelola daftar jabatan relasi Anda.</p>
              </div>
              <button onClick={() => setShowPositionManager(false)} className="w-10 h-10 flex items-center justify-center bg-white text-slate-400 hover:text-slate-600 rounded-full shadow-sm"><i className="bi bi-x-lg"></i></button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  className="flex-1 px-5 py-3 rounded-xl border border-slate-200 outline-none bg-slate-50/50 font-bold text-xs"
                  placeholder="Nama jabatan baru..."
                  value={newPositionName}
                  onChange={(e) => setNewPositionName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddPosition()}
                />
                <button onClick={handleAddPosition} className="px-6 py-3 bg-blue-600 text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700">Tambah</button>
              </div>

              <div className="space-y-2 overflow-y-auto max-h-[50vh] pr-2">
                {masterPositions.map(p => (
                  <div key={p} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white group hover:border-blue-200 transition-all">
                    {editingPosition?.old === p ? (
                      <div className="flex-1 flex gap-2">
                        <input 
                          type="text" 
                          className="flex-1 px-4 py-2 rounded-lg border border-blue-200 outline-none bg-blue-50/30 font-bold text-xs"
                          value={editingPosition.next}
                          autoFocus
                          onChange={(e) => setEditingPosition({...editingPosition, next: e.target.value})}
                          onKeyDown={(e) => e.key === 'Enter' && handleRenamePosition()}
                        />
                        <button onClick={handleRenamePosition} className="text-blue-600 font-black text-xs px-2">OK</button>
                        <button onClick={() => setEditingPosition(null)} className="text-slate-400 font-black text-xs px-2">X</button>
                      </div>
                    ) : (
                      <>
                        <span className="font-bold text-slate-700 text-sm">{p}</span>
                        <div className="flex gap-2">
                          <button onClick={() => setEditingPosition({old: p, next: p})} className="p-2 text-slate-300 hover:text-blue-500 transition-colors"><i className="bi bi-pencil-square"></i></button>
                          <button onClick={() => handleDeletePosition(p)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><i className="bi bi-trash3"></i></button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 italic">
               <p className="text-[10px] text-slate-400 font-medium text-center">Menghapus data jabatan tidak akan mengubah data kontak lama yang sudah menggunakannya.</p>
            </div>
          </div>
        </div>
      )}

      {/* Google Contacts Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[110] p-0 md:p-8">
          <div className="bg-white w-full max-w-3xl rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in duration-300">
            <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-emerald-50">
              <div>
                <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Import Google Contacts</h3>
                <p className="text-xs text-slate-500 font-bold mt-1">Pilih relasi yang ingin Anda simpan ke Networking Vault.</p>
              </div>
              <button 
                onClick={() => setShowImportModal(false)}
                className="w-10 h-10 flex items-center justify-center bg-white text-slate-400 hover:text-slate-600 rounded-full shadow-sm"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="p-4 bg-white border-b border-slate-100">
              <div className="relative">
                <i className="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input 
                  type="text"
                  placeholder="Cari nama atau email di Google Contacts..."
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-bold text-xs"
                  value={importSearch}
                  onChange={(e) => setImportSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredGoogleContacts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-3xl mb-2">🔎</div>
                  <p className="text-slate-400 font-black text-xs uppercase tracking-widest">Tidak ada kontak ditemukan</p>
                </div>
              ) : (
                filteredGoogleContacts.map(c => {
                  const isExist = contacts.some(lc => lc.email && lc.email.toLowerCase() === c.email.toLowerCase());
                  return (
                    <div 
                      key={c.id} 
                      className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${isExist ? 'bg-slate-50 opacity-60' : 'hover:border-emerald-500 cursor-pointer'} ${selectedGoogleIds.has(c.id) ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/10' : 'bg-white border-slate-100'}`}
                      onClick={() => {
                        if (isExist) return;
                        const newSet = new Set(selectedGoogleIds);
                        if (newSet.has(c.id)) newSet.delete(c.id);
                        else newSet.add(c.id);
                        setSelectedGoogleIds(newSet);
                      }}
                    >
                      <div className="flex-shrink-0">
                        {isExist ? (
                          <div className="w-5 h-5 rounded-full bg-slate-300 flex items-center justify-center text-[10px] text-white">✓</div>
                        ) : (
                          <input 
                            type="checkbox" 
                            readOnly
                            checked={selectedGoogleIds.has(c.id)}
                            className="w-5 h-5 rounded border-slate-300 accent-emerald-600"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-black text-slate-800 text-sm truncate">{c.name}</p>
                          {isExist && <span className="text-[9px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md font-black uppercase tracking-tighter">SUDAH ADA</span>}
                        </div>
                        <p className="text-xs text-slate-500 font-medium truncate">{c.email || c.phone || 'No Email/Phone'}</p>
                        {c.company && <p className="text-[10px] text-emerald-600 font-black mt-0.5 uppercase tracking-tight">{c.position} @ {c.company}</p>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest">
                {selectedGoogleIds.size} Relasi dipilih
              </p>
              <div className="flex gap-3 w-full md:w-auto">
                <button 
                  onClick={() => setShowImportModal(false)}
                  className="flex-1 md:flex-none px-6 py-3 bg-white text-slate-600 font-black rounded-xl border border-slate-200 text-xs uppercase tracking-widest"
                >
                  Batal
                </button>
                <button 
                  onClick={handleImportSelected}
                  disabled={selectedGoogleIds.size === 0}
                  className="flex-1 md:flex-none px-10 py-3 bg-emerald-600 text-white font-black rounded-xl shadow-lg shadow-emerald-200 text-xs uppercase tracking-widest disabled:opacity-50"
                >
                  Import Sekarang
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ContactForm: React.FC<{ 
  initialData: Contact | null; 
  relations: string[];
  followUpPlans: string[];
  companies: string[];
  positions: string[];
  onSubmit: (data: Partial<Contact>) => void; 
  onCancel: () => void 
}> = ({ initialData, relations, followUpPlans, companies, positions, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Contact>>(initialData || {
    name: '', phone: '', email: '', company: companies[0] || '', position: positions[0] || '', 
    relation: relations[0] || '', lastInteractionNote: '', 
    followUpPlan: followUpPlans[0] || '', 
    lastInteractionDate: new Date().toISOString().split('T')[0]
  });

  return (
    <div className="space-y-3 md:space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-3 md:gap-6">
        <div className="md:col-span-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Nama Kontak</label>
          <input className="w-full px-5 py-3 lg:py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-bold text-xs" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Alex Johnson" required />
        </div>
        
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">No HP</label>
          <input className="w-full px-5 py-3 lg:py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-bold text-xs" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="0812xxxx" />
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Email</label>
          <input type="email" className="w-full px-5 py-3 lg:py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-bold text-xs" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="alex@company.com" />
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Jabatan</label>
          <select 
            className="w-full px-5 py-3 lg:py-4 rounded-2xl border border-slate-200 outline-none bg-white font-bold text-xs cursor-pointer" 
            value={formData.position || ''} 
            onChange={e => setFormData({ ...formData, position: e.target.value })}
            required
          >
            <option value="" disabled>Pilih Jabatan</option>
            {positions.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Perusahaan</label>
          <select 
            className="w-full px-5 py-3 lg:py-4 rounded-2xl border border-slate-200 outline-none bg-white font-bold text-xs cursor-pointer" 
            value={formData.company || ''} 
            onChange={e => setFormData({ ...formData, company: e.target.value })}
            required
          >
            <option value="" disabled>Pilih Perusahaan</option>
            {companies.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Hubungan</label>
          <select className="w-full px-5 py-3 lg:py-4 rounded-2xl border border-slate-200 outline-none bg-white font-bold text-xs cursor-pointer" value={formData.relation || ''} onChange={e => setFormData({ ...formData, relation: e.target.value as any })}>
            {relations.map(rel => (
              <option key={rel} value={rel}>{rel}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Tgl Interaksi</label>
          <input type="date" className="w-full px-5 py-3 lg:py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-bold text-xs" value={formData.lastInteractionDate || ''} onChange={e => setFormData({ ...formData, lastInteractionDate: e.target.value })} />
        </div>

        <div className="md:col-span-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Catatan Interaksi</label>
          <textarea rows={2} className="w-full px-5 py-3 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-bold resize-none text-xs" value={formData.lastInteractionNote || ''} onChange={e => setFormData({ ...formData, lastInteractionNote: e.target.value })} placeholder="Bahas soal apa?" />
        </div>

        <div className="md:col-span-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Rencana Follow Up</label>
          <select 
            className="w-full px-5 py-3 lg:py-4 rounded-2xl border border-emerald-100 outline-none bg-emerald-50/30 font-bold text-xs cursor-pointer text-emerald-700"
            value={formData.followUpPlan || ''} 
            onChange={e => setFormData({ ...formData, followUpPlan: e.target.value })}
          >
            {followUpPlans.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex gap-4 pt-4 lg:pt-6">
        <button onClick={onCancel} className="flex-1 py-4 lg:py-5 text-slate-400 font-black rounded-2xl text-xs">Batal</button>
        <button onClick={() => onSubmit(formData)} className="flex-1 py-4 lg:py-5 bg-slate-900 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl hover:bg-black text-xs">Simpan</button>
      </div>
    </div>
  );
};

export default Networking;
