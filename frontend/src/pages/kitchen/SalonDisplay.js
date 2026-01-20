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
      <main className="flex-1 p-8 flex flex-col">
        {/* Hazır Siparişler Başlık */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <Bell className="h-12 w-12 text-green-400 animate-bounce" />
          <h2 className="text-5xl font-bold text-green-400">HAZIR SİPARİŞLER</h2>
          <Bell className="h-12 w-12 text-green-400 animate-bounce" />
        </div>

        {/* Sipariş Grid */}
        {readyOrders.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
            <Clock className="h-32 w-32 mb-6 opacity-30 animate-pulse" />
            <p className="text-4xl font-bold">Hazırlanan siparişler burada görünecek</p>
            <p className="text-2xl mt-4">Siparişiniz hazır olduğunda numaranız ekranda belirecek</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 flex-1 content-start">
            {readyOrders.map((order, index) => (
              <div
                key={`${order.display_code}-${index}`}
                className={`${getSourceStyle(order.source)} rounded-2xl p-8 flex flex-col items-center justify-center shadow-2xl transform hover:scale-105 transition-all animate-pulse`}
                style={{
                  animationDuration: '2s',
                  animationDelay: `${index * 0.1}s`
                }}
              >
                <div className="text-6xl font-bold mb-2">
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
