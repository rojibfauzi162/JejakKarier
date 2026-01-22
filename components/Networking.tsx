
import React from 'react';
import { Contact } from '../types';

interface NetworkingProps {
  contacts: Contact[];
  onAdd: (c: Contact) => void;
  onDelete: (id: string) => void;
}

const Networking: React.FC<NetworkingProps> = ({ contacts, onAdd, onDelete }) => {
  const addContact = () => {
    onAdd({
      id: Math.random().toString(),
      name: "New Contact",
      company: "Company",
      position: "Position",
      relation: "peer",
      lastInteractionNote: "Initial meeting",
      lastInteractionDate: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Networking Tracker</h2>
          <p className="text-slate-500">Keep track of mentors, peers, and clients.</p>
        </div>
        <button onClick={addContact} className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg">
          + Add Contact
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contacts.map(contact => (
          <div key={contact.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 group">
             <div className="flex justify-between mb-4">
               <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                 {contact.name[0]}
               </div>
               <button onClick={() => onDelete(contact.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500">✕</button>
             </div>
             <h4 className="font-bold text-slate-800 text-lg">{contact.name}</h4>
             <p className="text-sm text-slate-500">{contact.position} at {contact.company}</p>
             <span className="inline-block mt-3 px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full uppercase">
               {contact.relation}
             </span>
             <div className="mt-6 pt-4 border-t border-slate-50">
               <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Last Interaction</p>
               <p className="text-xs text-slate-600 line-clamp-2 italic">"{contact.lastInteractionNote}"</p>
               <p className="text-[9px] text-slate-400 mt-2">{contact.lastInteractionDate}</p>
             </div>
          </div>
        ))}
        {contacts.length === 0 && <div className="col-span-full py-20 text-center text-slate-400">No contacts tracked yet.</div>}
      </div>
    </div>
  );
};

export default Networking;
