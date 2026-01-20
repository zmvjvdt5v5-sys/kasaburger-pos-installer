import React, { useState, useEffect, useRef } from 'react';
import { Bell, Clock, ChefHat, Check, Volume2, VolumeX } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function SalonDisplay() {
  const [readyOrders, setReadyOrders] = useState([]);
  const [preparingOrders, setPreparingOrders] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef(null);
  const lastReadyCountRef = useRef(0);

  // Bildirim sesi
  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    audioRef.current.volume = 0.8;
  }, []);

  const playSound = () => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  // Siparişleri yükle
  const loadReadyOrders = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/kitchen/salon-display`);
      if (response.ok) {
        const data = await response.json();
        
        // Yeni hazır sipariş bildirimi
        if (data.ready_orders.length > lastReadyCountRef.current) {
          playSound();
        }
        lastReadyCountRef.current = data.ready_orders.length;
        
        setReadyOrders(data.ready_orders || []);
        setPreparingOrders(data.preparing_orders || []);
      }
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  useEffect(() => {
    loadReadyOrders();
    const interval = setInterval(loadReadyOrders, 3000); // Her 3 saniyede güncelle
    return () => clearInterval(interval);
  }, []);

  // Saat güncelle
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Kaynak tipine göre renk
  const getSourceStyle = (source) => {
    switch (source) {
      case 'table':
        return 'bg-orange-500 text-white';
      case 'kiosk':
      case 'takeaway':
      case 'delivery':
        return 'bg-green-500 text-white';
      default:
        return 'bg-pink-500 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-600 to-orange-500 p-6 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <ChefHat className="h-16 w-16 text-white" />
            <div>
              <h1 className="text-4xl font-bold">KASA BURGER</h1>
              <p className="text-orange-100 text-xl">Sipariş Durumu</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition"
            >
              {soundEnabled ? <Volume2 className="h-8 w-8" /> : <VolumeX className="h-8 w-8" />}
            </button>
            <div className="text-right">
              <div className="text-5xl font-bold font-mono">
                {currentTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-orange-100">
                {currentTime.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 flex gap-8 overflow-hidden">
        {/* Sol: Hazırlanan Siparişler */}
        <div className="w-1/3 flex flex-col">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Clock className="h-8 w-8 text-blue-400 animate-spin" style={{ animationDuration: '3s' }} />
            <h2 className="text-3xl font-bold text-blue-400">HAZIRLANIYOR</h2>
          </div>
          
          {preparingOrders.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-zinc-600">
              <p className="text-xl">Hazırlanan sipariş yok</p>
            </div>
          ) : (
            <div className="flex-1 grid grid-cols-2 gap-4 content-start overflow-auto">
              {preparingOrders.map((order, index) => (
                <div
                  key={`prep-${order.display_code}-${index}`}
                  className="bg-blue-600/30 border-2 border-blue-500 rounded-xl p-4 flex flex-col items-center justify-center"
                >
                  <div className="text-3xl font-bold text-blue-300">
                    {order.display_code}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-blue-400 mt-1">
                    <Clock className="h-4 w-4" />
                    <span>Hazırlanıyor</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sağ: Hazır Siparişler (Daha büyük alan) */}
        <div className="w-2/3 flex flex-col">
          <div className="flex items-center justify-center gap-4 mb-6">
            <Bell className="h-10 w-10 text-green-400 animate-bounce" />
            <h2 className="text-4xl font-bold text-green-400">HAZIR - TESLİM ALIN</h2>
            <Bell className="h-10 w-10 text-green-400 animate-bounce" />
          </div>

          {/* Sipariş Grid */}
          {readyOrders.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
              <ChefHat className="h-24 w-24 mb-4 opacity-30" />
              <p className="text-2xl font-bold">Hazır sipariş yok</p>
              <p className="text-lg mt-2">Siparişiniz hazır olduğunda numaranız burada belirecek</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 flex-1 content-start overflow-auto">
              {readyOrders.map((order, index) => (
                <div
                  key={`ready-${order.display_code}-${index}`}
                  className={`${getSourceStyle(order.source)} rounded-2xl p-8 flex flex-col items-center justify-center shadow-2xl transform hover:scale-105 transition-all`}
                  style={{
                    animation: 'pulse 2s infinite',
                    animationDelay: `${index * 0.1}s`
                  }}
                >
                  <div className="text-5xl font-bold mb-2">
                    {order.display_code}
                  </div>
                  <div className="flex items-center gap-2 text-xl opacity-90">
                    <Check className="h-6 w-6" />
                    <span>HAZIR</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer - Bilgilendirme */}
      <footer className="bg-zinc-900 p-6 shrink-0">
        <div className="flex justify-between items-center">
          <div className="flex gap-8 text-xl">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-orange-500"></div>
              <span className="text-zinc-400">MASA = Salon Siparişi</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-green-500"></div>
              <span className="text-zinc-400">PKT = Paket / Self Servis</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-pink-500"></div>
              <span className="text-zinc-400">ONLNPKT = Online Sipariş</span>
            </div>
          </div>
          
          <div className="text-zinc-500 text-lg">
            Fişinizdeki numarayı kontrol edin
          </div>
        </div>
      </footer>

      {/* Full Screen Overlay for New Ready Order */}
      {readyOrders.length > 0 && (
        <style>{`
          @keyframes glow {
            0%, 100% { box-shadow: 0 0 20px rgba(34, 197, 94, 0.5); }
            50% { box-shadow: 0 0 60px rgba(34, 197, 94, 0.8); }
          }
          .animate-glow {
            animation: glow 2s infinite;
          }
        `}</style>
      )}
    </div>
  );
}
