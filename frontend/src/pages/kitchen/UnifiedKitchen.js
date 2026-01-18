import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import { 
  ChefHat, Clock, Check, Bell, Volume2, VolumeX, 
  Flame, Timer, AlertCircle, RefreshCw, Printer,
  UtensilsCrossed, Package, Bike, ShoppingBag, Monitor,
  Maximize2, ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Sipariş durumları
const ORDER_STATUS = {
  pending: { label: 'Bekliyor', color: 'bg-yellow-500', textColor: 'text-yellow-500', icon: Clock },
  preparing: { label: 'Hazırlanıyor', color: 'bg-blue-500', textColor: 'text-blue-500', icon: Flame },
  ready: { label: 'Hazır', color: 'bg-green-500', textColor: 'text-green-500', icon: Check },
  Yeni: { label: 'Bekliyor', color: 'bg-yellow-500', textColor: 'text-yellow-500', icon: Clock },
  Hazırlanıyor: { label: 'Hazırlanıyor', color: 'bg-blue-500', textColor: 'text-blue-500', icon: Flame },
  Hazır: { label: 'Hazır', color: 'bg-green-500', textColor: 'text-green-500', icon: Check },
  confirmed: { label: 'Onaylandı', color: 'bg-yellow-500', textColor: 'text-yellow-500', icon: Clock }
};

// Sipariş kaynakları ve kod tipleri
const CODE_CONFIG = {
  table: { 
    label: 'Masa', 
    icon: UtensilsCrossed, 
    color: 'text-orange-400', 
    bg: 'bg-orange-500/20',
    borderColor: 'border-orange-500'
  },
  package: { 
    label: 'Paket', 
    icon: ShoppingBag, 
    color: 'text-green-400', 
    bg: 'bg-green-500/20',
    borderColor: 'border-green-500'
  },
  online: { 
    label: 'Online', 
    icon: Bike, 
    color: 'text-pink-400', 
    bg: 'bg-pink-500/20',
    borderColor: 'border-pink-500'
  },
  kiosk: { 
    label: 'Kiosk', 
    icon: Monitor, 
    color: 'text-purple-400', 
    bg: 'bg-purple-500/20',
    borderColor: 'border-purple-500'
  }
};

export default function UnifiedKitchen() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ pending: 0, preparing: 0, ready: 0 });
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [filter, setFilter] = useState('all'); // all, pending, preparing, ready
  const audioRef = useRef(null);
  const lastOrderCountRef = useRef(0);
  const containerRef = useRef(null);

  // Bildirim sesi
  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audioRef.current.volume = 1.0;
  }, []);

  const playSound = () => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  // Token
  const getToken = () => localStorage.getItem('kasaburger_token') || localStorage.getItem('dealer_token');

  // Siparişleri ve istatistikleri yükle
  const loadOrders = useCallback(async () => {
    try {
      const token = getToken();
      
      // Paralel istekler
      const [ordersRes, statsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/kitchen/orders`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${BACKEND_URL}/api/kitchen/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        
        // Yeni sipariş bildirimi
        const pendingCount = ordersData.filter(o => 
          o.status === 'pending' || o.status === 'Yeni' || o.status === 'confirmed'
        ).length;
        
        if (pendingCount > lastOrderCountRef.current) {
          playSound();
          toast.success(`🔔 ${pendingCount - lastOrderCountRef.current} yeni sipariş!`, { duration: 5000 });
        }
        lastOrderCountRef.current = pendingCount;
        
        setOrders(ordersData);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      setLoading(false);
    } catch (error) {
      console.error('Load error:', error);
      setLoading(false);
    }
  }, [soundEnabled]);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 5000); // Her 5 saniyede güncelle
    return () => clearInterval(interval);
  }, [loadOrders]);

  // Sipariş durumunu güncelle
  const updateOrderStatus = async (order, newStatus) => {
    try {
      const token = getToken();
      const response = await fetch(`${BACKEND_URL}/api/kitchen/orders/${order.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        const statusMessages = {
          preparing: '🔥 Hazırlanıyor!',
          ready: '✅ Hazır!',
          served: '🍽️ Teslim Edildi!'
        };
        toast.success(statusMessages[newStatus] || 'Durum güncellendi!');
        loadOrders();
      }
    } catch (error) {
      toast.error('Güncelleme başarısız!');
    }
  };

  // Fiş yazdır
  const printReceipt = async (order) => {
    try {
      const token = getToken();
      const response = await fetch(`${BACKEND_URL}/api/kitchen/print`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ order_id: order.id })
      });

      const result = await response.json();
      if (result.status === 'success') {
        toast.success(`Fiş yazdırıldı: ${result.queue_number}`);
      } else {
        toast.warning(result.message);
      }
    } catch (error) {
      toast.error('Yazdırma hatası!');
    }
  };

  // Tam ekran modu
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Geçen süre
  const getElapsedTime = (createdAt) => {
    const diff = Math.floor((Date.now() - new Date(createdAt)) / 1000 / 60);
    if (diff < 1) return 'Az önce';
    if (diff < 60) return `${diff} dk`;
    return `${Math.floor(diff / 60)} sa ${diff % 60} dk`;
  };

  // Filtrelenmiş siparişler
  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    if (filter === 'pending') return ['pending', 'Yeni', 'confirmed'].includes(order.status);
    if (filter === 'preparing') return ['preparing', 'Hazırlanıyor'].includes(order.status);
    if (filter === 'ready') return ['ready', 'Hazır'].includes(order.status);
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-orange-500 mx-auto"></div>
          <p className="text-white text-xl mt-4">Mutfak Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 p-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)}
              className="text-zinc-400 hover:text-white"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <ChefHat className="h-10 w-10 text-orange-500" />
            <div>
              <h1 className="text-2xl font-bold">Birleşik Mutfak Ekranı</h1>
              <p className="text-zinc-500 text-sm">Tüm siparişler tek ekranda</p>
            </div>
          </div>

          {/* İstatistikler */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg transition-all ${
                filter === 'pending' ? 'bg-yellow-500 text-black' : 'bg-yellow-500/20 text-yellow-400'
              }`}
            >
              <span className="font-bold text-2xl">{stats.pending}</span>
              <span className="text-sm ml-2">Bekleyen</span>
            </button>
            <button
              onClick={() => setFilter('preparing')}
              className={`px-4 py-2 rounded-lg transition-all ${
                filter === 'preparing' ? 'bg-blue-500 text-white' : 'bg-blue-500/20 text-blue-400'
              }`}
            >
              <span className="font-bold text-2xl">{stats.preparing}</span>
              <span className="text-sm ml-2">Hazırlanıyor</span>
            </button>
            <button
              onClick={() => setFilter('ready')}
              className={`px-4 py-2 rounded-lg transition-all ${
                filter === 'ready' ? 'bg-green-500 text-white' : 'bg-green-500/20 text-green-400'
              }`}
            >
              <span className="font-bold text-2xl">{stats.ready}</span>
              <span className="text-sm ml-2">Hazır</span>
            </button>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="px-3 py-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white text-sm"
              >
                Tümü
              </button>
            )}
          </div>

          {/* Kontroller */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={soundEnabled ? 'text-green-400' : 'text-zinc-500'}
            >
              {soundEnabled ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
              <Maximize2 className="h-6 w-6" />
            </Button>
            <Button variant="outline" onClick={loadOrders}>
              <RefreshCw className="h-5 w-5 mr-2" />
              Yenile
            </Button>
          </div>
        </div>
      </header>

      {/* Sipariş Grid - Dokunmatik için büyük kartlar */}
      <main className="flex-1 p-4 overflow-auto">
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500">
            <ChefHat className="h-32 w-32 mb-6 opacity-20" />
            <p className="text-3xl font-bold">Bekleyen sipariş yok</p>
            <p className="text-lg mt-2">Yeni siparişler otomatik olarak görünecek</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {filteredOrders.map(order => {
              const codeConfig = CODE_CONFIG[order.code_type] || CODE_CONFIG.package;
              const CodeIcon = codeConfig.icon;
              const status = ORDER_STATUS[order.status] || ORDER_STATUS.pending;
              const StatusIcon = status.icon;
              const elapsed = getElapsedTime(order.created_at);
              const elapsedMinutes = parseInt(elapsed) || 0;
              const isUrgent = elapsed.includes('dk') && elapsedMinutes > 10;
              const isCritical = elapsed.includes('dk') && elapsedMinutes > 20;

              return (
                <Card 
                  key={order.id}
                  className={`bg-zinc-900 border-2 transition-all ${
                    isCritical ? 'border-red-500 animate-pulse shadow-lg shadow-red-500/30' : 
                    isUrgent ? 'border-orange-500 animate-pulse' : 
                    codeConfig.borderColor
                  }`}
                >
                  <CardContent className="p-4">
                    {/* Header - Büyük sipariş kodu */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl ${codeConfig.bg}`}>
                          <CodeIcon className={`h-8 w-8 ${codeConfig.color}`} />
                        </div>
                        <div>
                          <div className={`font-bold text-3xl ${isCritical ? 'text-red-400' : isUrgent ? 'text-orange-400' : 'text-white'}`}>
                            {order.display_code || order.queue_number || order.order_number || '---'}
                          </div>
                          <div className="text-sm text-zinc-500 flex items-center gap-1">
                            {codeConfig.label}
                            {order.table_name && <span className="text-orange-400 ml-1">• {order.table_name}</span>}
                          </div>
                        </div>
                      </div>
                      <Badge className={`${status.color} text-white px-3 py-1`}>
                        <StatusIcon className="h-4 w-4 mr-1" />
                        {status.label}
                      </Badge>
                    </div>

                    {/* Ürünler - Büyük ve okunabilir */}
                    <div className="space-y-2 mb-4 max-h-56 overflow-y-auto">
                      {(order.items || []).map((item, idx) => (
                        <div 
                          key={idx} 
                          className="flex items-center justify-between bg-zinc-800 p-3 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <span className="bg-orange-500 text-black font-bold w-10 h-10 rounded-lg flex items-center justify-center text-xl">
                              {item.quantity}
                            </span>
                            <span className="text-lg font-medium">
                              {item.product_name || item.name}
                            </span>
                          </div>
                          {item.note && (
                            <span className="text-sm text-yellow-400 bg-yellow-500/20 px-2 py-1 rounded">
                              📝 {item.note}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Notlar */}
                    {order.notes && (
                      <div className="bg-yellow-500/20 p-3 rounded-lg mb-4 text-yellow-400">
                        📝 {order.notes}
                      </div>
                    )}

                    {/* Footer - Süre ve Aksiyonlar */}
                    <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                      <div className={`flex items-center gap-2 text-lg ${
                        isCritical ? 'text-red-400 font-bold' : 
                        isUrgent ? 'text-orange-400 font-bold' : 'text-zinc-400'
                      }`}>
                        <Timer className="h-5 w-5" />
                        <span>{elapsed}</span>
                        {isCritical && <AlertCircle className="h-5 w-5 animate-bounce" />}
                      </div>
                      
                      {/* Büyük Dokunmatik Butonlar */}
                      <div className="flex gap-2">
                        {['pending', 'Yeni', 'confirmed'].includes(order.status) && (
                          <Button 
                            size="lg"
                            className="bg-blue-600 hover:bg-blue-700 text-lg px-6 py-3 h-auto"
                            onClick={() => updateOrderStatus(order, 'preparing')}
                          >
                            <Flame className="h-6 w-6 mr-2" />
                            Hazırla
                          </Button>
                        )}
                        {['preparing', 'Hazırlanıyor'].includes(order.status) && (
                          <Button 
                            size="lg"
                            className="bg-green-600 hover:bg-green-700 text-lg px-6 py-3 h-auto"
                            onClick={() => updateOrderStatus(order, 'ready')}
                          >
                            <Check className="h-6 w-6 mr-2" />
                            Hazır
                          </Button>
                        )}
                        {['ready', 'Hazır'].includes(order.status) && (
                          <Button 
                            size="lg"
                            className="bg-purple-600 hover:bg-purple-700 text-lg px-6 py-3 h-auto"
                            onClick={() => updateOrderStatus(order, 'served')}
                          >
                            <UtensilsCrossed className="h-6 w-6 mr-2" />
                            Teslim
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="lg"
                          className="px-4 py-3 h-auto"
                          onClick={() => printReceipt(order)}
                        >
                          <Printer className="h-6 w-6" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Bottom Bar - Saat ve Tarih */}
      <footer className="bg-zinc-900 border-t border-zinc-800 p-3 flex justify-between items-center shrink-0">
        <div className="text-zinc-500">
          Son güncelleme: {new Date().toLocaleTimeString('tr-TR')}
        </div>
        <div className="flex items-center gap-4">
          <Badge className="bg-orange-500/20 text-orange-400 text-lg px-4 py-2">
            MASA = Salon
          </Badge>
          <Badge className="bg-green-500/20 text-green-400 text-lg px-4 py-2">
            PKT = Paket/Kiosk
          </Badge>
          <Badge className="bg-pink-500/20 text-pink-400 text-lg px-4 py-2">
            ONLNPKT = Online
          </Badge>
        </div>
        <div className="text-2xl font-bold text-orange-500">
          {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </footer>
    </div>
  );
}
