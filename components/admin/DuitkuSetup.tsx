
import React, { useState, useEffect } from 'react';
import { DuitkuConfig } from '../../types';
import { getDuitkuConfig, saveDuitkuConfig } from '../../services/firebase';
import { Save, RefreshCw, ExternalLink, ShieldCheck, AlertCircle } from 'lucide-react';

interface DuitkuSetupProps {
  onToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const DuitkuSetup: React.FC<DuitkuSetupProps> = ({ onToast }) => {
  const [config, setConfig] = useState<DuitkuConfig>({
    merchantCode: '',
    apiKey: '',
    environment: 'sandbox',
    callbackUrl: '',
    returnUrl: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data = await getDuitkuConfig();
        if (data) {
          setConfig(data);
        } else {
          // Default values if not exists
          const currentUrl = window.location.origin;
          setConfig({
            merchantCode: '',
            apiKey: '',
            environment: 'sandbox',
            callbackUrl: `${currentUrl}/api/dk/cb`,
            returnUrl: `${currentUrl}/`
          });
        }
      } catch (error) {
        onToast("Gagal memuat konfigurasi Duitku", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTestConnection = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      console.log("[DUITKU] Testing connection via /api/dk/test...");
      const response = await fetch(`/api/dk/test?t=${Date.now()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config) // Send the current config state
      });
      
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        console.log("[DUITKU] API Response:", data);
        if (data.success) {
          setTestResult({ success: true, message: "Koneksi Berhasil! API Key & Merchant Code valid." });
        } else {
          setTestResult({ 
            success: false, 
            message: `Gagal: ${data.message || "Periksa kembali Merchant Code & API Key."}` 
          });
        }
      } else {
        const text = await response.text();
        console.error("Server returned non-JSON response:", text.substring(0, 500));
        const isHtml = text.toLowerCase().includes("<!doctype html>") || text.toLowerCase().includes("<html>");
        
        if (isHtml && 'serviceWorker' in navigator) {
          console.log("Detected HTML response for API. Unregistering Service Worker and reloading...");
          const registrations = await navigator.serviceWorker.getRegistrations();
          for(let registration of registrations) {
            await registration.unregister();
          }
          window.location.reload();
          return;
        }

        setTestResult({ 
          success: false, 
          message: `Server Error (${response.status}): Respons server tidak valid ${isHtml ? '(HTML)' : ''}. ${isHtml ? 'Memuat ulang halaman untuk membersihkan cache...' : 'Respons: ' + text.substring(0, 50)}` 
        });
      }
    } catch (err: any) {
      console.error("[DUITKU] Fetch error:", err);
      setTestResult({ success: false, message: "Koneksi Gagal: " + err.message });
    } finally {
      setTestLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveDuitkuConfig(config);
      onToast("Konfigurasi Duitku berhasil disimpan!", "success");
    } catch (error: any) {
      onToast(`Gagal menyimpan: ${error.message}`, "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="w-8 h-8" />
              <h2 className="text-2xl font-bold">Duitku Payment Gateway Setup</h2>
            </div>
            <p className="text-blue-100 opacity-90">
              Konfigurasikan akun Duitku Anda untuk mulai menerima pembayaran otomatis.
            </p>
          </div>
          <button 
            type="button"
            onClick={handleTestConnection}
            disabled={testLoading}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {testLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            Test Koneksi
          </button>
        </div>

        {testResult && (
          <div className={`m-8 p-4 rounded-2xl border flex flex-col gap-3 animate-in slide-in-from-top-2 ${testResult.success ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
            <div className="flex items-center gap-3">
              <i className={`bi ${testResult.success ? 'bi-check-circle-fill' : 'bi-exclamation-octagon-fill'} text-lg`}></i>
              <p className="text-xs font-bold">{testResult.message}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSave} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Merchant Code</label>
              <input
                type="text"
                value={config.merchantCode}
                onChange={(e) => setConfig({ ...config, merchantCode: e.target.value })}
                placeholder="Contoh: D1234"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                required
              />
              <p className="text-xs text-gray-500">Dapatkan dari Dashboard Duitku {'>'} Project Settings</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">API Key (Merchant Key)</label>
              <input
                type="password"
                value={config.apiKey}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                placeholder="Masukkan API Key Anda"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Environment</label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setConfig({ ...config, environment: 'sandbox' })}
                className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all font-medium ${
                  config.environment === 'sandbox'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
                }`}
              >
                Sandbox (Testing)
              </button>
              <button
                type="button"
                onClick={() => setConfig({ ...config, environment: 'production' })}
                className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all font-medium ${
                  config.environment === 'production'
                    ? 'border-green-600 bg-green-50 text-green-700'
                    : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
                }`}
              >
                Production (Live)
              </button>
            </div>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-bold mb-1">PENTING: Konfigurasi URL di Dashboard Duitku</p>
              <p>Pastikan Anda memasukkan URL di bawah ini ke dalam pengaturan proyek Anda di Dashboard Duitku agar sistem bisa memproses pembayaran secara otomatis.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex justify-between">
                <span>Callback URL</span>
                <button 
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(config.callbackUrl || '');
                    onToast("URL disalin!", "info");
                  }}
                  className="text-blue-600 hover:underline text-xs"
                >
                  Salin URL
                </button>
              </label>
              <input
                type="text"
                value={config.callbackUrl || ''}
                onChange={(e) => setConfig({ ...config, callbackUrl: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-600 font-mono text-xs"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex justify-between">
                <span>Return URL (Halaman Sukses)</span>
                <button 
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(config.returnUrl || '');
                    onToast("URL disalin!", "info");
                  }}
                  className="text-blue-600 hover:underline text-xs"
                >
                  Salin URL
                </button>
              </label>
              <input
                type="text"
                value={config.returnUrl || ''}
                onChange={(e) => setConfig({ ...config, returnUrl: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-600 font-mono text-xs"
              />
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Simpan Konfigurasi
            </button>
            <a
              href={config.environment === 'production' ? 'https://dashboard.duitku.com/' : 'https://sandbox.duitku.com/'}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-4 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-2"
            >
              <ExternalLink className="w-5 h-5" />
              Buka Dashboard Duitku
            </a>
          </div>
        </form>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4 font-bold">1</div>
          <h3 className="font-bold text-gray-900 mb-2">Dapatkan API Key</h3>
          <p className="text-sm text-gray-500">Login ke Duitku, buka Project Settings, dan salin Merchant Code serta Merchant Key Anda.</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4 font-bold">2</div>
          <h3 className="font-bold text-gray-900 mb-2">Simpan di Sini</h3>
          <p className="text-sm text-gray-500">Masukkan data tersebut ke form di atas dan klik simpan. Pilih Sandbox untuk percobaan.</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4 font-bold">3</div>
          <h3 className="font-bold text-gray-900 mb-2">Set Callback</h3>
          <p className="text-sm text-gray-500">Salin Callback URL di atas dan tempelkan ke kolom 'Url Callback' di dashboard Duitku.</p>
        </div>
      </div>
    </div>
  );
};

export default DuitkuSetup;
