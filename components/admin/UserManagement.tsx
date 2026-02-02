
import React from 'react';
import { AppData } from '../../types';

interface UserManagementProps {
  users: AppData[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onManage: (user: AppData) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, searchQuery, setSearchQuery, onManage }) => {
  return (
    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
       <div className="p-8 border-b border-slate-50">
          <input 
            type="text" 
            placeholder="Cari user (nama/email)..." 
            className="w-full px-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-xs"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
       </div>
       <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black uppercase text-slate-400 bg-slate-50/50">
                <th className="px-8 py-4">Identitas</th>
                <th className="px-6 py-4 text-center">Paket</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-8 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map(u => (
                <tr key={u.uid} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-4">
                    <p className="font-black text-slate-800 text-sm">{u.profile?.name || 'User'}</p>
                    <p className="text-[10px] font-bold text-slate-400">{u.profile?.email}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-3 py-1 bg-slate-100 rounded-lg text-[9px] font-black uppercase">{u.plan}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${u.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{u.status}</span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <button onClick={() => onManage(u)} className="text-indigo-600 font-black text-[10px] uppercase hover:underline">Kelola</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
       </div>
    </div>
  );
};

export default UserManagement;
