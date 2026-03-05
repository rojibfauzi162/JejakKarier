import React, { useState, useEffect } from 'react';
import { AppData, EmailCampaign, EmailSettings, EmailLog, SystemTraining } from '../../types';
import { getAllUsers, getEmailConfig, saveEmailConfig, getEmailCampaigns, saveEmailCampaign, getEmailLogs, saveEmailLog, getSystemTrainings } from '../../services/firebase';

interface EmailMarketingProps {
  data: AppData;
  onUpdateData: (data: Partial<AppData>) => void;
}

const EmailMarketing: React.FC<EmailMarketingProps> = ({ data, onUpdateData }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'create' | 'list' | 'settings'>('dashboard');
  const [users, setUsers] = useState<AppData[]>([]);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [trainings, setTrainings] = useState<SystemTraining[]>([]);
  const [showTrainingSelector, setShowTrainingSelector] = useState(false);
  const [loading, setLoading] = useState(false);

  // Settings State
  const [settings, setSettings] = useState<EmailSettings>({
    senderEmail: 'noreply@jejakkarir.id',
    senderName: 'JejakKarir Team',
    smtpHost: 'smtp-relay.brevo.com',
    smtpPort: 587
  });

  // Campaign Form State
  const [campaignForm, setCampaignForm] = useState<Partial<EmailCampaign>>({
    title: '',
    subject: '',
    content: '',
    filters: {
      skillTags: [],
      companyCategory: [],
      trainingInterest: [],
      manualUserIds: []
    },
    status: 'draft'
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [allUsers, emailConfig, allCampaigns, allLogs, allTrainings] = await Promise.all([
          getAllUsers(),
          getEmailConfig(),
          getEmailCampaigns(),
          getEmailLogs(),
          getSystemTrainings()
        ]);
        
        setUsers(allUsers);
        if (emailConfig) setSettings(emailConfig);
        setCampaigns(allCampaigns);
        setLogs(allLogs);
        setTrainings(allTrainings);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleSaveSettings = async () => {
    try {
      await saveEmailConfig(settings);
      alert('Pengaturan email berhasil disimpan!');
    } catch (error) {
      console.error("Error saving settings:", error);
      alert('Gagal menyimpan pengaturan.');
    }
  };

  const calculateAudience = () => {
    if (!users.length) return 0;
    return users.filter(u => {
      // Basic filtering logic
      const matchesSkill = campaignForm.filters?.skillTags?.length 
        ? u.profile?.skillTags?.some(s => campaignForm.filters?.skillTags?.includes(s)) 
        : true;
      
      const matchesIndustry = campaignForm.filters?.companyCategory?.length
        ? u.profile?.companyCategory?.some(c => campaignForm.filters?.companyCategory?.includes(c))
        : true;

      const matchesTraining = campaignForm.filters?.trainingInterest?.length
        ? u.profile?.trainingInterest?.some(t => campaignForm.filters?.trainingInterest?.includes(t))
        : true;
      
      const isManualSelected = campaignForm.filters?.manualUserIds?.includes(u.uid || '');
      
      // Combine filters (AND logic for filters, OR for manual selection)
      // If no filters are set, it should probably match ALL unless manual is used?
      // Let's assume filters are restrictive. If any filter is set, it must match.
      // If no filters set, match none? Or all? Usually all if no filters.
      // But here we initialize with empty arrays.
      
      const hasFilters = (campaignForm.filters?.skillTags?.length || 0) > 0 || 
                         (campaignForm.filters?.companyCategory?.length || 0) > 0 || 
                         (campaignForm.filters?.trainingInterest?.length || 0) > 0;

      if (!hasFilters && !isManualSelected) return true; // Match all if no filters

      return (matchesSkill && matchesIndustry && matchesTraining) || isManualSelected;
    }).length;
  };

  const handleCreateCampaign = async () => {
    const newCampaign: EmailCampaign = {
      id: Math.random().toString(36).substr(2, 9),
      title: campaignForm.title || 'Untitled Campaign',
      subject: campaignForm.subject || 'No Subject',
      content: campaignForm.content || '',
      createdAt: new Date().toISOString(),
      createdBy: data?.profile?.name || 'Unknown Admin',
      filters: campaignForm.filters || {},
      status: 'draft', // Default to draft
      recipientCount: calculateAudience()
    };

    try {
        await saveEmailCampaign(newCampaign);
        setCampaigns([...campaigns, newCampaign]);
        setCampaignForm({ title: '', subject: '', content: '', filters: {}, status: 'draft' });
        setActiveTab('list');
        alert('Campaign berhasil dibuat (Draft)!');
    } catch (e) {
        console.error(e);
        alert('Gagal membuat campaign.');
    }
  };

  const sendEmail = async (campaign: EmailCampaign) => {
    if (!settings.brevoApiKey) {
      alert('Harap konfigurasi API Key Brevo terlebih dahulu di menu Settings.');
      return;
    }

    const audience = users.filter(u => {
       // Re-apply filters to get actual recipients
       // For demo, we just simulate
       return true; 
    }).slice(0, 5); // Limit for safety in demo

    if (confirm(`Kirim email ke ${audience.length} user (Simulasi)?`)) {
        try {
            // Simulate sending
            const newLogs: EmailLog[] = audience.map(u => ({
                id: Math.random().toString(36).substr(2, 9),
                campaignId: campaign.id,
                userId: u.uid || 'unknown',
                userEmail: u.profile?.email || 'unknown@example.com',
                status: 'sent',
                sentAt: new Date().toISOString(),
                type: 'marketing'
            }));

            // Save logs
            for (const log of newLogs) {
                await saveEmailLog(log);
            }

            // Update campaign status
            const updatedCampaign: EmailCampaign = { ...campaign, status: 'sent', sentAt: new Date().toISOString() };
            await saveEmailCampaign(updatedCampaign);

            setCampaigns(campaigns.map(c => c.id === campaign.id ? updatedCampaign : c));
            setLogs([...logs, ...newLogs]);
            
            alert('Email berhasil dikirim (Simulasi)!');
        } catch (e) {
            console.error(e);
            alert('Gagal mengirim email.');
        }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Email Marketing</h2>
            <p className="text-slate-500 font-medium">Kelola kampanye email dan notifikasi sistem.</p>
        </div>
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            {(['dashboard', 'create', 'list', 'settings'] as const).map(tab => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    {tab}
                </button>
            ))}
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl mb-4"><i className="bi bi-envelope-paper-fill"></i></div>
                <h3 className="text-4xl font-black text-slate-900">{campaigns.length}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Total Campaign</p>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-xl mb-4"><i className="bi bi-check-circle-fill"></i></div>
                <h3 className="text-4xl font-black text-slate-900">{logs.filter(l => l.status === 'sent').length}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Email Terkirim</p>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-xl mb-4"><i className="bi bi-people-fill"></i></div>
                <h3 className="text-4xl font-black text-slate-900">{users.length}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Total Audience</p>
            </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="bg-white p-8 lg:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm max-w-3xl">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-8">Konfigurasi SMTP / API</h3>
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sender Name</label>
                        <input 
                            className="w-full px-5 py-3 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-indigo-500"
                            value={settings.senderName}
                            onChange={e => setSettings({...settings, senderName: e.target.value})}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sender Email</label>
                        <input 
                            className="w-full px-5 py-3 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-indigo-500"
                            value={settings.senderEmail}
                            onChange={e => setSettings({...settings, senderEmail: e.target.value})}
                        />
                    </div>
                </div>
                
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Brevo API Key (v3)</label>
                    <input 
                        type="password"
                        className="w-full px-5 py-3 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-indigo-500"
                        value={settings.brevoApiKey || ''}
                        onChange={e => setSettings({...settings, brevoApiKey: e.target.value})}
                        placeholder="xkeysib-..."
                    />
                    <p className="text-[10px] text-slate-400 italic">API Key disimpan secara aman di database konfigurasi sistem.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">SMTP Host</label>
                        <input 
                            className="w-full px-5 py-3 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-indigo-500"
                            value={settings.smtpHost}
                            onChange={e => setSettings({...settings, smtpHost: e.target.value})}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Port</label>
                        <input 
                            type="number"
                            className="w-full px-5 py-3 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-indigo-500"
                            value={settings.smtpPort}
                            onChange={e => setSettings({...settings, smtpPort: parseInt(e.target.value)})}
                        />
                    </div>
                </div>

                <div className="pt-6">
                    <button onClick={handleSaveSettings} className="px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">Simpan Konfigurasi</button>
                </div>
            </div>
        </div>
      )}

      {activeTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Judul Campaign (Internal)</label>
                        <input 
                            className="w-full px-5 py-3 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-indigo-500"
                            value={campaignForm.title}
                            onChange={e => setCampaignForm({...campaignForm, title: e.target.value})}
                            placeholder="Contoh: Promo Webinar Data Science"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject Email</label>
                        <input 
                            className="w-full px-5 py-3 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-indigo-500"
                            value={campaignForm.subject}
                            onChange={e => setCampaignForm({...campaignForm, subject: e.target.value})}
                            placeholder="Contoh: Jangan lewatkan kesempatan ini!"
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Konten Email (HTML)</label>
                            <button onClick={() => setShowTrainingSelector(!showTrainingSelector)} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                                <i className="bi bi-plus-circle"></i> Insert Training
                            </button>
                        </div>
                        {showTrainingSelector && (
                            <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                                {trainings.map(t => (
                                    <button 
                                        key={t.id}
                                        onClick={() => {
                                            const html = `
                                                <div style="border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; margin: 20px 0; background-color: #f8fafc;">
                                                    <h3 style="margin-top: 0; color: #1e293b;">${t.title}</h3>
                                                    <p style="color: #64748b; font-size: 14px;">${t.description.substring(0, 100)}...</p>
                                                    <p style="font-weight: bold; color: #334155;">Date: ${new Date(t.date).toLocaleDateString()}</p>
                                                    <a href="${window.location.origin}/trainings/${t.id}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 10px;">View Details</a>
                                                </div>
                                            `;
                                            setCampaignForm({...campaignForm, content: (campaignForm.content || '') + html});
                                            setShowTrainingSelector(false);
                                        }}
                                        className="text-left p-2 hover:bg-white rounded-lg transition-colors text-xs font-medium text-slate-700 border border-transparent hover:border-slate-200"
                                    >
                                        {t.title} ({new Date(t.date).toLocaleDateString()})
                                    </button>
                                ))}
                            </div>
                        )}
                        <textarea 
                            className="w-full px-5 py-3 rounded-xl border border-slate-200 font-medium text-sm outline-none focus:border-indigo-500 min-h-[300px] font-mono"
                            value={campaignForm.content}
                            onChange={e => setCampaignForm({...campaignForm, content: e.target.value})}
                            placeholder="<h1>Halo {name},</h1><p>Isi email Anda di sini...</p>"
                        />
                        <p className="text-[10px] text-slate-400">Gunakan placeholder: {'{name}'}, {'{email}'}</p>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6 sticky top-8">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Target Audience</h3>
                    
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Filter Skill</label>
                            <input 
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 text-xs" 
                                placeholder="Ketik skill (pisahkan koma)..."
                                onBlur={(e) => {
                                    const tags = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                                    setCampaignForm({
                                        ...campaignForm, 
                                        filters: { ...campaignForm.filters, skillTags: tags }
                                    });
                                }}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Filter Industri</label>
                            <input 
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 text-xs" 
                                placeholder="Ketik industri (pisahkan koma)..."
                                onBlur={(e) => {
                                    const tags = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                                    setCampaignForm({
                                        ...campaignForm, 
                                        filters: { ...campaignForm.filters, companyCategory: tags }
                                    });
                                }}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Minat Training</label>
                            <input 
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 text-xs" 
                                placeholder="Ketik minat (pisahkan koma)..."
                                onBlur={(e) => {
                                    const tags = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                                    setCampaignForm({
                                        ...campaignForm, 
                                        filters: { ...campaignForm.filters, trainingInterest: tags }
                                    });
                                }}
                            />
                        </div>
                        
                        {/* Manual Selection Mockup */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih User Manual</label>
                            <div className="max-h-40 overflow-y-auto border border-slate-100 rounded-xl p-2 space-y-1">
                                {users.slice(0, 10).map(u => (
                                    <label key={u.uid} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="rounded text-indigo-600"
                                            onChange={(e) => {
                                                const current = campaignForm.filters?.manualUserIds || [];
                                                const next = e.target.checked 
                                                    ? [...current, u.uid!] 
                                                    : current.filter(id => id !== u.uid);
                                                setCampaignForm({
                                                    ...campaignForm,
                                                    filters: { ...campaignForm.filters, manualUserIds: next }
                                                });
                                            }}
                                        />
                                        <span className="text-xs font-bold text-slate-700">{u.profile?.name || 'Unknown User'}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-xs font-bold text-slate-500">Estimasi Penerima:</span>
                                <span className="text-xl font-black text-indigo-600">{calculateAudience()}</span>
                            </div>
                            <button onClick={handleCreateCampaign} className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">Simpan & Jadwalkan</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {activeTab === 'list' && (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Campaign</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Audience</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {campaigns.map(campaign => (
                        <tr key={campaign.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-8 py-6">
                                <p className="font-bold text-slate-900">{campaign.title}</p>
                                <p className="text-xs text-slate-500">{campaign.subject}</p>
                            </td>
                            <td className="px-8 py-6">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                    campaign.status === 'sent' ? 'bg-emerald-50 text-emerald-600' : 
                                    campaign.status === 'scheduled' ? 'bg-blue-50 text-blue-600' : 
                                    'bg-slate-100 text-slate-500'
                                }`}>
                                    {campaign.status}
                                </span>
                            </td>
                            <td className="px-8 py-6 text-sm font-bold text-slate-600">{campaign.recipientCount}</td>
                            <td className="px-8 py-6 text-right">
                                {campaign.status === 'draft' && (
                                    <button onClick={() => sendEmail(campaign)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700">Kirim</button>
                                )}
                            </td>
                        </tr>
                    ))}
                    {campaigns.length === 0 && (
                        <tr>
                            <td colSpan={4} className="px-8 py-12 text-center text-slate-400 text-sm font-medium italic">Belum ada campaign dibuat.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      )}
    </div>
  );
};

export default EmailMarketing;
