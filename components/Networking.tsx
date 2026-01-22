
import React, { useState, useMemo } from 'react';
import { Contact } from '../types';

interface NetworkingProps {
  contacts: Contact[];
  onAdd: (c: Contact) => void;
  onUpdate: (c: Contact) => void;
  onDelete: (id: string) => void;
}

const Networking: React.FC<NetworkingProps> = ({ contacts, onAdd, onUpdate, onDelete }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Contact | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredContacts = useMemo(() => {
    return contacts.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.position.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [contacts, searchQuery]);

  const openAddForm = () => {
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

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-24 lg:pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">Networking Tracker</h2>
          <p className="text-slate-500 mt-1 text-xs lg:text-sm">Lacak relasi profesional, mentor, dan rekan industri Anda.</p>
        </div>
        <button onClick={openAddForm} className="w-full md:w-auto px-6 py-3.5 bg-blue-600 text-white font-black rounded-2xl shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest">
          <span className="text-xl">+</span>
          Kontak Baru
        </button>
      </header>

      {/* Summary Box & Search */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
        <div className="flex w-full lg:w-[400px] border-2 border-slate-900 overflow-hidden rounded-2xl shadow-sm">
          <div className="bg-blue-600 text-white px-4 lg:px-6 py-2.5 flex-1 font-black text-[10px] lg:text-xs uppercase tracking-widest flex items-center justify-center border-r-2 border-slate-900">
            TOTAL KONTAK
          </div>
          <div className="bg-slate-100 flex-1 flex items-center justify-center text-lg lg:text-xl font-black text-slate-900">
            {contacts.length}
          </div>
        </div>
        <div className="flex-1 relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input 
            type="text"
            placeholder="Cari nama, jabatan..."
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-white shadow-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Responsive Content: Table for Desktop, Cards for Mobile */}
      <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1100px]">
          <thead>
            <tr className="bg-emerald-500 text-white text-[11px] font-black uppercase tracking-widest">
              <th className="px-4 py-4 border-r border-white/20 text-center w-16 bg-blue-600">NO <FilterIcon /></th>
              <th className="px-6 py-4 border-r border-white/20 w-52">NAMA KONTAK <FilterIcon /></th>
              <th className="px-6 py-4 border-r border-white/20 w-44">NO HP <FilterIcon /></th>
              <th className="px-6 py-4 border-r border-white/20 w-44">EMAIL <FilterIcon /></th>
              <th className="px-6 py-4 border-r border-white/20 w-48">JABATAN <FilterIcon /></th>
              <th className="px-6 py-4 border-r border-white/20 w-48">PERUSAHAAN <FilterIcon /></th>
              <th className="px-6 py-4 border-r border-white/20">CATATAN INTERAKSI <FilterIcon /></th>
              <th className="px-6 py-4">RENCANA FOLLOW UP <FilterIcon /></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredContacts.map((contact, index) => (
              <tr key={contact.id} className="hover:bg-slate-50 transition-colors group">
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
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
          <div key={contact.id} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
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

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl p-6 lg:p-10 animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-8">
              {editingItem ? 'Update Contact' : 'New Networking Contact'}
            </h3>
            <ContactForm 
              initialData={editingItem}
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
    </div>
  );
};

const ContactForm: React.FC<{ initialData: Contact | null; onSubmit: (data: Partial<Contact>) => void; onCancel: () => void }> = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Contact>>(initialData || {
    name: '', phone: '', email: '', company: '', position: '', 
    relation: 'peer', lastInteractionNote: '', followUpPlan: '', 
    lastInteractionDate: new Date().toISOString().split('T')[0]
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
        <div className="md:col-span-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Nama Kontak</label>
          <input className="w-full px-5 py-3 lg:py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-bold text-xs" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Alex Johnson" required />
        </div>
        
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">No HP</label>
          <input className="w-full px-5 py-3 lg:py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-bold text-xs" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="0812xxxx" />
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Email</label>
          <input type="email" className="w-full px-5 py-3 lg:py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-bold text-xs" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="alex@company.com" />
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Jabatan</label>
          <input className="w-full px-5 py-3 lg:py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-bold text-xs" value={formData.position} onChange={e => setFormData({ ...formData, position: e.target.value })} placeholder="Role" required />
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Perusahaan</label>
          <input className="w-full px-5 py-3 lg:py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-bold text-xs" value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} placeholder="Company" required />
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Hubungan</label>
          <select className="w-full px-5 py-3 lg:py-4 rounded-2xl border border-slate-200 outline-none bg-white font-bold text-xs cursor-pointer" value={formData.relation} onChange={e => setFormData({ ...formData, relation: e.target.value as any })}>
            <option value="peer">Rekan (Peer)</option>
            <option value="mentor">Mentor</option>
            <option value="superior">Atasan (Superior)</option>
            <option value="client">Klien (Client)</option>
            <option value="HR">HR / Recruiter</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Tgl Interaksi</label>
          <input type="date" className="w-full px-5 py-3 lg:py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-bold text-xs" value={formData.lastInteractionDate} onChange={e => setFormData({ ...formData, lastInteractionDate: e.target.value })} />
        </div>

        <div className="md:col-span-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Catatan Interaksi</label>
          <textarea rows={2} className="w-full px-5 py-3 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 font-bold resize-none text-xs" value={formData.lastInteractionNote} onChange={e => setFormData({ ...formData, lastInteractionNote: e.target.value })} placeholder="Bahas soal apa?" />
        </div>

        <div className="md:col-span-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Rencana Follow Up</label>
          <textarea rows={2} className="w-full px-5 py-3 rounded-2xl border border-emerald-100 outline-none bg-emerald-50/30 font-bold resize-none text-emerald-700 text-xs" value={formData.followUpPlan} onChange={e => setFormData({ ...formData, followUpPlan: e.target.value })} placeholder="Langkah selanjutnya?" />
        </div>
      </div>
      <div className="flex gap-4 pt-4 lg:pt-6">
        <button onClick={onCancel} className="flex-1 py-4 lg:py-5 text-slate-400 font-black uppercase tracking-widest hover:bg-slate-50 rounded-2xl text-xs">Batal</button>
        <button onClick={() => onSubmit(formData)} className="flex-1 py-4 lg:py-5 bg-slate-900 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl hover:bg-black text-xs">Simpan</button>
      </div>
    </div>
  );
};

export default Networking;
