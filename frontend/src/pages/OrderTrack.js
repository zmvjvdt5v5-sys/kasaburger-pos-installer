import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Clock, ChefHat, Check, Package, Bell, Volume2, VolumeX } from 'lucide-react';
import { Button } from '../components/ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Sipariş durumları
const ORDER_STAGES = [
  { id: 'pending', label: 'Sipariş Alındı', icon: Package },
  { id: 'preparing', label: 'Hazırlanıyor', icon: ChefHat },
  { id: 'ready', label: 'Hazır', icon: Check }
];

// Türkçe durum eşleştirmesi
const STATUS_MAP = {
  'Yeni': 'pending',
  'Hazırlanıyor': 'preparing',
  'Hazır': 'ready',
  'Teslim Edildi': 'delivered',
  'pending': 'pending',
  'preparing': 'preparing',
  'ready': 'ready',
  'delivered': 'delivered'
};

export default function OrderTrack() {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const audioRef = useRef(null);
  const lastStatusRef = useRef(null);

  // Bildirim sesi - sipariş hazır olunca
  useEffect(() => {
    try {
      audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      audioRef.current.volume = 1.0;
    } catch (e) {
      console.warn('Audio initialization failed:', e);
    }
  }, []);

  // Browser notification izni iste (Safari uyumlu)
  useEffect(() => {
    // Safari ve iOS'ta Notification API farklı çalışabilir
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        setNotificationPermission(Notification.permission);
      } catch (e) {
        console.warn('Notification permission check failed:', e);
      }
    }
  }, []);

  // Bildirim sesi çal
  const playReadySound = useCallback(() => {
    if (soundEnabled && audioRef.current) {
      try {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(function(err) {
          console.warn('Audio play failed:', err);
        });
      } catch (e) {
        console.warn('Audio error:', e);
      }
    }
  }, [soundEnabled]);

  // Browser notification gönder (Safari uyumlu)
  const sendNotification = useCallback(function(title, body) {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;
    
    try {
      if (Notification.permission === 'granted') {
        new Notification(title, {
          body: body,
          icon: 'https://customer-assets.emergentagent.com/job_kasaburger-pos/artifacts/oruytxht_b3459348-380a-4e05-8eb6-989bd31e2066.jpeg',
          tag: 'order-ready'
        });
      }
    } catch (e) {
      console.warn('Notification failed:', e);
    }
  }, []);

  // Sipariş durumunu çek
  const fetchOrderStatus = useCallback(function() {
    if (!orderNumber) return;
    
    fetch(BACKEND_URL + '/api/order-track/' + orderNumber)
      .then(function(response) {
        if (!response.ok) {
          if (response.status === 404) {
            setError('Sipariş bulunamadı');
          } else {
            setError('Bir hata oluştu');
          }
          setLoading(false);
          return null;
        }
        return response.json();
      })
      .then(function(data) {
        if (!data) return;
        
        setOrder(data);
        setError(null);
        setLoading(false);

        // Durum değişti mi kontrol et
        var status = data.status || '';
        var normalizedStatus = STATUS_MAP[status] || status;
        
        if (lastStatusRef.current && lastStatusRef.current !== normalizedStatus) {
          // Hazır olduysa bildirim gönder
          if (normalizedStatus === 'ready') {
            playReadySound();
            sendNotification(
              'Siparişiniz Hazır!',
              orderNumber + ' numaralı siparişiniz teslim almaya hazır.'
            );
          }
        }
        lastStatusRef.current = normalizedStatus;
      })
      .catch(function(err) {
        console.error('Fetch error:', err);
        setError('Bağlantı hatası');
        setLoading(false);
      });
  }, [orderNumber, playReadySound, sendNotification]);

  // İlk yükleme ve polling
  useEffect(function() {
    fetchOrderStatus();
    var interval = setInterval(fetchOrderStatus, 3000);
    return function() {
      clearInterval(interval);
    };
  }, [fetchOrderStatus]);

  // Normalize edilmiş durum
  var normalizedStatus = 'pending';
  if (order && order.status) {
    normalizedStatus = STATUS_MAP[order.status] || order.status;
  }
  var currentStageIndex = ORDER_STAGES.findIndex(function(s) {
    return s.id === normalizedStatus;
  });
  if (currentStageIndex < 0) currentStageIndex = 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-zinc-400">Sipariş yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-white mb-2">{error}</h1>
          <p className="text-zinc-400">Sipariş numaranızı kontrol edin</p>
          <p className="text-zinc-500 mt-2 font-mono">{orderNumber}</p>
        </div>
      </div>
    );
  }

  var isReady = normalizedStatus === 'ready';
  var isDelivered = normalizedStatus === 'delivered';
  var displayCode = (order && (order.display_code || order.queue_number || order.order_number)) || orderNumber;

  return (
    <div className={'min-h-screen flex flex-col ' + (isReady ? 'bg-gradient-to-b from-green-900 to-zinc-950' : 'bg-zinc-950')}>
      {/* Header */}
      <header className="bg-zinc-900/80 backdrop-blur-lg px-5 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <img 
            src="https://customer-assets.emergentagent.com/job_kasaburger-pos/artifacts/oruytxht_b3459348-380a-4e05-8eb6-989bd31e2066.jpeg" 
            alt="Logo" 
            className="h-10 w-10 object-contain rounded-xl"
          />
          <span className="text-xl font-bold text-orange-500">KASA BURGER</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={function() { setSoundEnabled(!soundEnabled); }}
          className="text-zinc-400 hover:text-white"
        >
          {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        
        {/* Sipariş Numarası */}
        <div className={'mb-8 text-center ' + (isReady ? 'animate-pulse' : '')}>
          <p className="text-zinc-400 text-sm mb-2">Sipariş Numaranız</p>
          <div className={'text-5xl md:text-7xl font-black ' + (isReady ? 'text-green-400' : 'text-orange-500')}>
            {displayCode}
          </div>
        </div>

        {/* Teslim Edildi */}
        {isDelivered ? (
          <div className="text-center mb-8">
            <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-16 w-16 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-green-400 mb-2">Teslim Edildi</h2>
            <p className="text-zinc-400">Afiyet olsun! 🍔</p>
          </div>
        ) : isReady ? (
          /* Sipariş Hazır */
          <div className="text-center mb-8">
            <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <Bell className="h-16 w-16 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-green-400 mb-2">Siparişiniz Hazır!</h2>
            <p className="text-zinc-300 text-lg">Lütfen kasaya gelerek siparişinizi teslim alın</p>
          </div>
        ) : (
          /* Progress Bar */
          <div className="w-full max-w-md mb-8">
            <div className="flex justify-between mb-4">
              {ORDER_STAGES.map(function(stage, index) {
                var Icon = stage.icon;
                var isActive = index <= currentStageIndex;
                var isCurrent = index === currentStageIndex;
                
                return (
                  <div key={stage.id} className="flex flex-col items-center flex-1">
                    <div 
                      className={'w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 ' + (
                        isActive 
                          ? (isCurrent 
                            ? 'bg-orange-500 ring-4 ring-orange-500/30 scale-110' 
                            : 'bg-green-500')
                          : 'bg-zinc-800'
                      )}
                    >
                      <Icon className={'h-7 w-7 ' + (isActive ? 'text-white' : 'text-zinc-500')} />
                    </div>
                    <p className={'text-xs mt-2 text-center ' + (isActive ? 'text-white font-semibold' : 'text-zinc-500')}>
                      {stage.label}
                    </p>
                  </div>
                );
              })}
            </div>
            
            {/* Progress Line */}
            <div className="relative h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500 to-orange-500 transition-all duration-500 rounded-full"
                style={{ width: ((currentStageIndex + 1) / ORDER_STAGES.length * 100) + '%' }}
              />
            </div>
          </div>
        )}

        {/* Durum Mesajı */}
        {!isReady && !isDelivered && (
          <div className="text-center">
            <div className="flex items-center gap-2 text-zinc-400 mb-2">
              <Clock className="h-5 w-5" />
              <span>Tahmini süre: ~10-15 dk</span>
            </div>
            <p className="text-zinc-500 text-sm">
              Bu sayfa otomatik güncelleniyor. Siparişiniz hazır olunca bildirim alacaksınız.
            </p>
          </div>
        )}

        {/* Bildirim İzni */}
        {notificationPermission === 'default' && typeof window !== 'undefined' && 'Notification' in window && (
          <div className="mt-8 bg-zinc-900 rounded-2xl p-4 max-w-md">
            <div className="flex items-center gap-3">
              <Bell className="h-6 w-6 text-orange-500" />
              <div className="flex-1">
                <p className="text-white font-semibold">Bildirimleri Aç</p>
                <p className="text-zinc-400 text-sm">Siparişiniz hazır olunca hemen haber verelim</p>
              </div>
              <Button
                onClick={function() {
                  if ('Notification' in window) {
                    Notification.requestPermission().then(function(perm) {
                      setNotificationPermission(perm);
                    });
                  }
                }}
                className="bg-orange-500 hover:bg-orange-600"
              >
                İzin Ver
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-zinc-900/50 px-5 py-4 text-center">
        <p className="text-zinc-500 text-sm">
          Sipariş takip sayfası • Kasa Burger
        </p>
      </footer>
    </div>
  );
}
