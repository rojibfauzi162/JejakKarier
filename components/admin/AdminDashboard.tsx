
import React, { useState, useMemo } from 'react';
import AdminStatCard from './AdminStatCard';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';
import { AppData, PaymentStatus, SubscriptionPlan, AccountStatus } from '../../types';

interface AdminDashboardProps {
  stats: {
    total: number;
    activeToday: number;
    totalTokens: number;
    totalAiOps: number;
  };
  users: AppData[];
  onBulkFix?: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ stats, users, onBulkFix }) => {
  const [dateFilter, setDateFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');

  const filteredData = useMemo(() => {
    let list = [...users];
    if (planFilter !== 'all') {
      list = list.filter(u => u.plan === planFilter);
    }
    // Date filter logic simplified for MVP (Today/Week/All)
    const today = new Date().toISOString().split('T')[0];
    if (dateFilter === 'today') {
      list = list.filter(u => u.joinedAt.includes(today) || u.lastLogin.includes(today));
    }
    return list;
  }, [users, dateFilter, planFilter]);

  const financialStats = useMemo(() => {
    const allTxs: any[] = [];
    filteredData.forEach(u => {
      if (u.manualTransactions) {
        u.manualTransactions.forEach(t => allTxs.push(t));
      }
    });

    const paidCount = allTxs.filter(t => t.status === PaymentStatus.PAID).length;
    const unpaidCount = allTxs.filter(t => t.status === PaymentStatus.UNPAID).length;
    
    const activeUsers = filteredData.filter(u => u.status === AccountStatus.ACTIVE).length;
    const inactiveUsers = filteredData.filter(u => u.status === AccountStatus.INACTIVE || u.status === AccountStatus.BANNED).length;
    const totalUsers = filteredData.length || 1;
    const churnRate = ((inactiveUsers / totalUsers) * 100).toFixed(1);

    // Revenue Trend (Last 7 days)
    const trend: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      trend[d.toISOString().split('T')[0]] = 0;
    }
    allTxs.filter(t => t.status === PaymentStatus.PAID).forEach(t => {
      const day = t.date.split('T')[0];
      if (trend[day] !== undefined) trend[day] += t.amount;
    });

    const trendData = Object.entries(trend).map(([name, value]) => ({ name, value }));
    const paymentData = [
      { name: 'Sudah Bayar', value: paidCount, color: '#10b981' },
      { name: 'Belum Bayar', value: unpaidCount, color: '#ef4444' }
    ];

    return { paidCount, unpaidCount, activeUsers, churnRate, trendData, paymentData };
  }, [filteredData]);

  const handleFixSubscriptions = async () => {
    if (onBulkFix) onBulkFix();
  };

  return (
    <div className="space-y-10">
      {/* Filters Bar */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center">
         <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase text-slate-400">Filter:</span>
            <select 
              className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-[10px] font-black outline-none"
              value={dateFilter || ''}
              onChange={e => setDateFilter(e.target.value)}
            >
               <option value="all">Semua Waktu</option>
               <option value="today">Hari Ini</option>
            </select>
            <select 
              className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-[10px] font-black outline-none"
              value={planFilter || ''}
              onChange={e => setPlanFilter(e.target.value)}
            >
               <option value="all">Semua Paket</option>
               {Object.values(SubscriptionPlan).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
         </div>
         <div className="flex-1"></div>
         <div className="flex items-center gap-4">
            <button 
              onClick={handleFixSubscriptions}
              className="px-6 py-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all"
            >
              Sync & Fix Subscriptions
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-slate-50 text-slate-600 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all"
            >
              Manual Data Sync (Reload)
            </button>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
               {filteredData.length} User Terfilter
            </p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <AdminStatCard title="User Aktif" value={financialStats.activeUsers} sub="Member Premium" icon="⭐" color="blue" />
         <AdminStatCard title="Churn Rate" value={`${financialStats.churnRate}%`} sub="Tingkat Berhenti" icon="📉" color="rose" />
         <AdminStatCard title="Sudah Bayar" value={financialStats.paidCount} sub="Transaksi Sukses" icon="💰" color="emerald" />
         <AdminStatCard title="Belum Bayar" value={financialStats.unpaidCount} sub="Invoice Pending" icon="⏳" color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         {/* Trend Pendapatan Manual */}
         <div className="lg:col-span-8 bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-8">
               <h4 className="text-sm font-black uppercase text-slate-900">Trend Pendapatan (Manual)</h4>
               <span className="text-[9px] font-black text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full tracking-widest uppercase">Last 7 Days</span>
            </div>
            <div className="h-72 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={financialStats.trendData}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                     <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                     <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                     <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={40} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Status Pembayaran Pie Chart */}
         <div className="lg:col-span-4 bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col items-center">
            <h4 className="text-sm font-black uppercase text-slate-900 mb-8 self-start">Rasio Pembayaran</h4>
            <div className="h-64 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie 
                       data={financialStats.paymentData} 
                       innerRadius={60} 
                       outerRadius={80} 
                       paddingAngle={5} 
                       dataKey="value"
                     >
                        {financialStats.paymentData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                     </Pie>
                     <Tooltip />
                     <Legend verticalAlign="bottom" />
                  </PieChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
