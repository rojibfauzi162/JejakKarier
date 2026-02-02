
import React from 'react';

interface AdminStatCardProps {
  title: string;
  value: number | string;
  sub: string;
  icon: string;
  color: 'blue' | 'amber' | 'emerald' | 'indigo';
}

const AdminStatCard: React.FC<AdminStatCardProps> = ({ title, value, sub, icon, color }) => {
  const colorMap: any = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100'
  };
  return (
    <div className={`p-8 rounded-[2.5rem] border flex flex-col justify-center items-center text-center shadow-sm ${colorMap[color]}`}>
      <div className="text-xl mb-1">{icon}</div>
      <p className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-1">{title}</p>
      <p className="text-2xl font-black">{value}</p>
      <p className="text-[8px] font-bold mt-1 opacity-50 uppercase">{sub}</p>
    </div>
  );
};

export default AdminStatCard;
