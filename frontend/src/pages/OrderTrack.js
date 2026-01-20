import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Clock, ChefHat, Check, Package, Bell, Volume2, VolumeX, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';

// Backend URL
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

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

// K-XXXXXX formatını KIOSK-XXXX formatına çevir
function formatDisplayCode(orderNum) {
  if (!orderNum) return '';
  var upper = orderNum.toUpperCase();
  if (upper.startsWith('K-')) {
    try {
      var num = parseInt(upper.substring(2), 10);
      if (!isNaN(num)) {
        return 'KIOSK-' + String(num).padStart(4, '0');
      }
    } catch (e) {}
  }
  return orderNum;
}

function OrderTrack() {
  const params = useParams();
  const orderNumber = params.orderNumber || '';
  const formattedOrderNumber = formatDisplayCode(orderNumber);
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [debugInfo, setDebugInfo] = useState('');
  const audioRef = useRef(null);
  const lastStatusRef = useRef(null);
  const intervalRef = useRef(null);

  // Bildirim sesi
  useEffect(function() {
    try {
      audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      audioRef.current.volume = 1.0;
    } catch (e) {
      console.warn('Audio init error:', e);
    }
    return function() {
      if (audioRef.current) {
        audioRef.current = null;
      }
    };
  }, []);

  // Ses çal
  function playSound() {
    if (soundEnabled && audioRef.current) {
      try {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(function() {});
      } catch (e) {
        console.warn('Audio play error:', e);
      }
    }
  }

  // Sipariş durumunu çek
  function fetchOrder() {
    if (!orderNumber) {
      setError('Sipariş numarası bulunamadı');
      setLoading(false);
      return;
    }

    if (!BACKEND_URL) {
      setError('Sunucu bağlantısı yapılamadı');
      setLoading(false);
      return;
    }

    var url = BACKEND_URL + '/api/order-track/' + encodeURIComponent(orderNumber);
    setDebugInfo('URL: ' + url);

    fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    })
    .then(function(response) {
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Sipariş bulunamadı');
        }
        throw new Error('Sunucu hatası: ' + response.status);
      }
      return response.json();
    })
    .then(function(data) {
      setOrder(data);
      setError(null);
      setLoading(false);

      // Durum değişikliği kontrolü
      var status = data.status || '';
      var normalizedStatus = STATUS_MAP[status] || status;

      if (lastStatusRef.current && lastStatusRef.current !== normalizedStatus) {
        if (normalizedStatus === 'ready') {
          playSound();
        }
      }
      lastStatusRef.current = normalizedStatus;
    })
    .catch(function(err) {
      console.error('Fetch error:', err);
      setError(err.message || 'Bağlantı hatası');
      setLoading(false);
    });
  }

  // İlk yükleme ve polling
  useEffect(function() {
    fetchOrder();
    intervalRef.current = setInterval(fetchOrder, 5000);
    return function() {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [orderNumber]);

  // Normalize status
  var normalizedStatus = 'pending';
  if (order && order.status) {
    normalizedStatus = STATUS_MAP[order.status] || order.status;
  }

  var currentStageIndex = 0;
  for (var i = 0; i < ORDER_STAGES.length; i++) {
    if (ORDER_STAGES[i].id === normalizedStatus) {
      currentStageIndex = i;
      break;
    }
  }

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-zinc-400 text-lg">Sipariş yükleniyor...</p>
          <p className="text-zinc-600 text-sm mt-2">{formattedOrderNumber}</p>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">{error}</h1>
          <p className="text-zinc-400 mb-4">Sipariş numaranızı kontrol edin</p>
          <div className="bg-zinc-800 px-4 py-2 rounded-lg mb-4">
            <p className="text-zinc-300 font-mono text-sm break-all">{formattedOrderNumber || 'Numara yok'}</p>
          </div>
          <Button 
            onClick={function() { 
              setLoading(true);
              setError(null);
              fetchOrder();
            }}
            className="bg-orange-500 hover:bg-orange-600"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Tekrar Dene
          </Button>
          {debugInfo && (
            <p className="text-zinc-700 text-xs mt-4 break-all">{debugInfo}</p>
          )}
        </div>
      </div>
    );
  }

  var isReady = normalizedStatus === 'ready';
  var isDelivered = normalizedStatus === 'delivered';
  var displayCode = '';
  if (order) {
    displayCode = order.display_code || order.queue_number || order.order_number || formattedOrderNumber;
  } else {
    displayCode = formattedOrderNumber;
  }

  return (
    <div className={'min-h-screen flex flex-col ' + (isReady ? 'bg-gradient-to-b from-green-900 to-zinc-950' : 'bg-zinc-950')}>
      {/* Header */}
      <header className="bg-zinc-900/80 backdrop-blur-lg px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <img 
            src="https://customer-assets.emergentagent.com/job_kasaburger-pos/artifacts/oruytxht_b3459348-380a-4e05-8eb6-989bd31e2066.jpeg" 
            alt="Logo" 
            className="h-8 w-8 object-contain rounded-lg"
          />
          <span className="text-lg font-bold text-orange-500">KASA BURGER</span>
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
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        
        {/* Sipariş Numarası */}
        <div className={'mb-6 text-center ' + (isReady ? 'animate-pulse' : '')}>
          <p className="text-zinc-400 text-sm mb-1">Sipariş Numaranız</p>
          <div className={'text-4xl md:text-6xl font-black ' + (isReady ? 'text-green-400' : 'text-orange-500')}>
            {displayCode}
          </div>
        </div>

        {/* Teslim Edildi */}
        {isDelivered ? (
          <div className="text-center mb-6">
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-green-400 mb-1">Teslim Edildi</h2>
            <p className="text-zinc-400">Afiyet olsun!</p>
          </div>
        ) : isReady ? (
          /* Sipariş Hazır */
          <div className="text-center mb-6">
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3 animate-bounce">
              <Bell className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-green-400 mb-1">Siparişiniz Hazır!</h2>
            <p className="text-zinc-300">Lütfen kasaya gelerek teslim alın</p>
          </div>
        ) : (
          /* Progress Bar */
          <div className="w-full max-w-sm mb-6">
            <div className="flex justify-between mb-3">
              {ORDER_STAGES.map(function(stage, index) {
                var Icon = stage.icon;
                var isActive = index <= currentStageIndex;
                var isCurrent = index === currentStageIndex;
                
                return (
                  <div key={stage.id} className="flex flex-col items-center flex-1">
                    <div 
                      className={'w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ' + (
                        isActive 
                          ? (isCurrent 
                            ? 'bg-orange-500 ring-4 ring-orange-500/30 scale-110' 
                            : 'bg-green-500')
                          : 'bg-zinc-800'
                      )}
                    >
                      <Icon className={'h-6 w-6 ' + (isActive ? 'text-white' : 'text-zinc-500')} />
                    </div>
                    <p className={'text-xs mt-1 text-center ' + (isActive ? 'text-white font-semibold' : 'text-zinc-500')}>
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
            <div className="flex items-center justify-center gap-2 text-zinc-400 mb-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Tahmini süre: ~10-15 dk</span>
            </div>
            <p className="text-zinc-500 text-xs">
              Bu sayfa otomatik güncelleniyor
            </p>
          </div>
        )}

        {/* Manuel Yenile */}
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchOrder}
          className="mt-4 text-zinc-500 hover:text-white"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Yenile
        </Button>
      </main>

      {/* Footer */}
      <footer className="bg-zinc-900/50 px-4 py-3 text-center">
        <p className="text-zinc-600 text-xs">
          Sipariş Takip • Kasa Burger
        </p>
      </footer>
    </div>
  );
}

export default OrderTrack;
