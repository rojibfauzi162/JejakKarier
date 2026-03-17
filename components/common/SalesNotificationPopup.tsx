
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SalesNotification, SalesPopupConfig } from '../../types';
import { getSalesNotifications, getSalesPopupConfig, getRealSalesData } from '../../services/firebase';

const SalesNotificationPopup: React.FC = () => {
  useEffect(() => {
    console.log("[SalesPopup] Component mounted");
  }, []);
  const [config, setConfig] = useState<SalesPopupConfig>({
    mode: 'manual',
    intervalMin: 8,
    intervalMax: 15,
    displayDuration: 5,
    isEnabled: true,
    maskName: true,
    manualRatio: 60,
    updatedAt: new Date().toISOString()
  });
  const [manualData, setManualData] = useState<SalesNotification[]>([
    { id: 'd1', nama: 'Budi', paket: 'Paket Tahunan', aksi: 'baru saja bergabung', label: 'Member Baru', createdAt: new Date().toISOString() },
    { id: 'd2', nama: 'Siti', paket: 'Paket 3 Bulanan', aksi: 'baru saja upgrade', label: 'Premium', createdAt: new Date().toISOString() },
    { id: 'd3', nama: 'Andi', paket: 'Paket Bulanan', aksi: 'baru saja mendaftar', label: 'Aktif', createdAt: new Date().toISOString() }
  ]);
  const [realData, setRealData] = useState<any[]>([]);
  const [currentNotif, setCurrentNotif] = useState<any | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [conf, manual, real] = await Promise.all([
        getSalesPopupConfig(),
        getSalesNotifications(),
        getRealSalesData()
      ]);
      
      // Fallback dummy data if everything is empty
      const finalManual: SalesNotification[] = manual.length > 0 ? manual : [
        { id: 'd1', nama: 'Budi', paket: 'Paket Tahunan', aksi: 'baru saja bergabung', label: 'Member Baru', createdAt: new Date().toISOString() },
        { id: 'd2', nama: 'Siti', paket: 'Paket 3 Bulanan', aksi: 'baru saja upgrade', label: 'Premium', createdAt: new Date().toISOString() },
        { id: 'd3', nama: 'Andi', paket: 'Paket Bulanan', aksi: 'baru saja mendaftar', label: 'Aktif', createdAt: new Date().toISOString() }
      ];

      console.log("[SalesPopup] Data fetched:", { 
        isEnabled: conf?.isEnabled, 
        mode: conf?.mode,
        manualCount: manual.length, 
        realCount: real.length,
        usingFallback: manual.length === 0
      });
      
      if (conf) setConfig(conf);
      setManualData(finalManual);
      setRealData(real);
    } catch (error) {
      console.error("[SalesPopup] Error fetching data:", error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getTimeAgo = (timestamp: string) => {
    if (!timestamp) return "baru saja";
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return "baru saja";
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    return then.toLocaleDateString();
  };

  const getRandomManualTime = () => {
    const times = ["baru saja", "2 menit lalu", "5 menit lalu", "12 menit lalu", "24 menit lalu", "45 menit lalu"];
    return times[Math.floor(Math.random() * times.length)];
  };

  const getRandomAction = () => {
    const actions = [
      "baru saja membeli",
      "bergabung hari ini",
      "upgrade ke paket tahunan",
      "memilih paket hemat",
      "baru saja mendaftar"
    ];
    return actions[Math.floor(Math.random() * actions.length)];
  };

  const maskName = (name: string) => {
    if (!name) return "User";
    if (name.length <= 2) return name + "***";
    return name.substring(0, 2) + "***";
  };

  const showNextNotification = useCallback(() => {
    if (!config || !config.isEnabled) {
      console.log("[SalesPopup] Popup disabled or config missing");
      return;
    }

    let selectedData: any = null;
    
    const useManual = () => {
      if (manualData.length === 0) return null;
      const item = manualData[Math.floor(Math.random() * manualData.length)];
      return {
        ...item,
        isManual: true,
        timeAgo: getRandomManualTime(),
        aksi: item.aksi || getRandomAction()
      };
    };

    const useReal = () => {
      if (realData.length === 0) return useManual();
      const item = realData[Math.floor(Math.random() * realData.length)];
      return {
        ...item,
        isManual: false,
        timeAgo: getTimeAgo(item.createdAt),
        aksi: item.aksi || "baru saja membeli"
      };
    };

    if (config.mode === 'manual') {
      selectedData = useManual();
    } else if (config.mode === 'real') {
      selectedData = useReal();
    } else if (config.mode === 'mix') {
      const rand = Math.random() * 100;
      if (rand < config.manualRatio) {
        selectedData = useManual();
      } else {
        selectedData = useReal();
      }
    }

    if (selectedData) {
      console.log("[SalesPopup] Showing notification:", selectedData.nama);
      setCurrentNotif(selectedData);
      setIsVisible(true);
      
      // Hide after displayDuration
      setTimeout(() => {
        setIsVisible(false);
      }, config.displayDuration * 1000);

      // Schedule next one AFTER this one hides
      const nextInterval = (Math.random() * (config.intervalMax - config.intervalMin) + config.intervalMin) * 1000;
      timeoutRef.current = setTimeout(showNextNotification, nextInterval + (config.displayDuration * 1000));
    } else {
      console.log("[SalesPopup] No data to show, retrying in 10s");
      timeoutRef.current = setTimeout(showNextNotification, 10000);
    }
  }, [config, manualData, realData]);

  useEffect(() => {
    if (config && config.isEnabled) {
      console.log("[SalesPopup] Starting notification loop");
      const initialDelay = Math.random() * 3000 + 2000; // 2-5 seconds
      timeoutRef.current = setTimeout(showNextNotification, initialDelay);
      
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }
  }, [config?.isEnabled, config?.mode, showNextNotification]);

  useEffect(() => {
    const handleTest = () => {
      console.log("[SalesPopup] Test event received");
      showNextNotification();
    };
    window.addEventListener('test-sales-popup', handleTest);
    return () => window.removeEventListener('test-sales-popup', handleTest);
  }, [showNextNotification]);

  if (!config.isEnabled) {
    console.log("[SalesPopup] Config is disabled, not rendering");
    return null;
  }

  const displayName = currentNotif && config.maskName ? maskName(currentNotif.nama) : (currentNotif?.nama || "");

  return (
    <AnimatePresence>
      {isVisible && currentNotif && (
        <motion.div
          key={currentNotif.id || 'sales-popup'}
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -100, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          className="fixed bottom-6 left-6 z-[9999] flex items-center gap-4 bg-white p-4 rounded-2xl shadow-2xl border border-slate-100 max-w-sm"
        >
          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 text-xl border border-amber-100 shrink-0">
            <i className="bi bi-patch-check-fill"></i>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-black text-slate-900 truncate">{displayName}</span>
              {currentNotif.label && (
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-full uppercase tracking-widest">
                  {currentNotif.label}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 leading-tight">
              {currentNotif.aksi} <span className="font-bold text-slate-700">{currentNotif.paket}</span>
            </p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
              {currentNotif.timeAgo}
            </p>
          </div>
          <button 
            onClick={() => setIsVisible(false)}
            className="text-slate-300 hover:text-slate-500 transition-colors"
          >
            <i className="bi bi-x"></i>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SalesNotificationPopup;
