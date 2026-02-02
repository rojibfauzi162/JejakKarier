
import React from 'react';
import AdminStatCard from './AdminStatCard';

interface AdminDashboardProps {
  stats: {
    total: number;
    activeToday: number;
    totalTokens: number;
    totalAiOps: number;
  };
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
       <AdminStatCard title="Total User" value={stats.total} sub="User Terdaftar" icon="👥" color="blue" />
       <AdminStatCard title="Aktif Hari Ini" value={stats.activeToday} sub="Login Sesi" icon="⚡" color="amber" />
       <AdminStatCard title="Generasi AI" value={stats.totalAiOps} sub="Total Request" icon="🤖" color="emerald" />
       <AdminStatCard title="Token Lokal" value={stats.totalTokens.toLocaleString()} sub="Penggunaan Sistem" icon="💎" color="indigo" />
    </div>
  );
};

export default AdminDashboard;
