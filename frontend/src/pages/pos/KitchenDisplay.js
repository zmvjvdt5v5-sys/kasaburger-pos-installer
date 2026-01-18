import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import { 
  ChefHat, Clock, Check, Bell, Volume2, VolumeX, 
  Flame, Timer, AlertCircle, RefreshCw, Printer,
  UtensilsCrossed, Package, Bike, ShoppingBag
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Sipariş durumları
const ORDER_STATUS = {
  pending: { label: 'Bekliyor', color: 'bg-yellow-500', icon: Clock },
  preparing: { label: 'Hazırlanıyor', color: 'bg-blue-500', icon: Flame },
  ready: { label: 'Hazır', color: 'bg-green-500', icon: Check }
};

// Sipariş kaynakları
const SOURCE_CONFIG = {
  table: { label: 'Masa', icon: UtensilsCrossed, color: 'text-orange-400', bg: 'bg-orange-500/20' },
  takeaway: { label: 'Gel-Al', icon: ShoppingBag, color: 'text-green-400', bg: 'bg-green-500/20' },
  delivery: { label: 'Paket', icon: Bike, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  yemeksepeti: { label: 'Yemeksepeti', icon: Package, color: 'text-pink-400', bg: 'bg-pink-500/20' },
  getir: { label: 'Getir', icon: Package, color: 'text-purple-400', bg: 'bg-purple-500/20' },
  trendyol: { label: 'Trendyol', icon: Package, color: 'text-orange-400', bg: 'bg-orange-500/20' },
  migros: { label: 'Migros', icon: Package, color: 'text-green-400', bg: 'bg-green-500/20' }
};

export default function KitchenDisplay() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef(null);
  const lastOrderCountRef = useRef(0);

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

  // Siparişleri yükle
  const loadOrders = useCallback(async () => {
    try {
      const token = getToken();
      
      // POS siparişleri
      const posRes = await fetch(`${BACKEND_URL}/api/pos/orders?status=pending,preparing`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Kiosk siparişleri
      const kioskRes = await fetch(`${BACKEND_URL}/api/kiosk/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Platform siparişleri
      const deliveryRes = await fetch(`${BACKEND_URL}/api/delivery/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      let allOrders = [];

      if (posRes.ok) {
        const posOrders = await posRes.json();
        allOrders = [...allOrders, ...posOrders.filter(o => o.status !== 'completed' && o.status !== 'ready')];
      }

      if (kioskRes.ok) {
        const kioskOrders = await kioskRes.json();
        const pendingKiosk = kioskOrders.filter(o => 
          o.status === 'pending' || o.status === 'preparing' || o.status === 'Yeni'
        ).map(o => ({ ...o, source: 'kiosk' }));
        allOrders = [...allOrders, ...pendingKiosk];
      }

      if (deliveryRes.ok) {
        const deliveryOrders = await deliveryRes.json();
        const pendingDelivery = deliveryOrders.filter(o => 
          o.status === 'pending' || o.status === 'preparing' || o.status === 'confirmed'
        );
        allOrders = [...allOrders, ...pendingDelivery];
      }

      // Yeni sipariş bildirimi
      if (allOrders.length > lastOrderCountRef.current) {
        playSound();
        toast.success('Yeni sipariş geldi!');
      }
      lastOrderCountRef.current = allOrders.length;

      // Zamana göre sırala
      allOrders.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

      setOrders(allOrders);
      setLoading(false);
    } catch (error) {
      console.error('Load error:', error);
      setLoading(false);
    }
  }, [soundEnabled]);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 10000); // Her 10 saniyede güncelle
    return () => clearInterval(interval);
  }, [loadOrders]);

  // Sipariş durumunu güncelle
  const updateOrderStatus = async (order, newStatus) => {
    try {
      const token = getToken();
      const endpoint = order.source === 'kiosk' 
        ? `/api/kiosk/orders/${order.id}/status`
        : order.platform 
          ? `/api/delivery/orders/${order.id}/status`
          : `/api/pos/orders/${order.id}/status`;

      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        toast.success(
          newStatus === 'preparing' ? 'Sipariş hazırlanıyor!' :
          newStatus === 'ready' ? 'Sipariş hazır!' : 'Durum güncellendi!'
        );
        loadOrders();
      }
    } catch (error) {
      toast.error('Güncelleme başarısız!');
    }
  };

  // Geçen süre
  const getElapsedTime = (createdAt) => {
    const diff = Math.floor((Date.now() - new Date(createdAt)) / 1000 / 60);
    if (diff < 1) return 'Az önce';
    if (diff < 60) return `${diff} dk`;
    return `${Math.floor(diff / 60)} sa ${diff % 60} dk`;
  };

  // Para formatı
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <ChefHat className="h-10 w-10 text-orange-500" />
          <div>
            <h1 className="text-3xl font-bold">Mutfak Ekranı</h1>
            <p className="text-zinc-500">KBYS - Kasa Burger Yönetim Sistemi</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* İstatistikler */}
          <div className="flex gap-4">
            <div className="bg-yellow-500/20 px-4 py-2 rounded-lg">
              <span className="text-yellow-400 font-bold text-2xl">
                {orders.filter(o => o.status === 'pending' || o.status === 'Yeni').length}
              </span>
              <span className="text-yellow-400/70 text-sm ml-2">Bekleyen</span>
            </div>
            <div className="bg-blue-500/20 px-4 py-2 rounded-lg">
              <span className="text-blue-400 font-bold text-2xl">
                {orders.filter(o => o.status === 'preparing').length}
              </span>
              <span className="text-blue-400/70 text-sm ml-2">Hazırlanıyor</span>
            </div>
          </div>

          {/* Kontroller */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={soundEnabled ? 'text-green-400' : 'text-zinc-500'}
          >
            {soundEnabled ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
          </Button>
          <Button variant="outline" onClick={loadOrders}>
            <RefreshCw className="h-5 w-5 mr-2" />
            Yenile
          </Button>
        </div>
      </div>

      {/* Sipariş Grid */}
      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 text-zinc-500">
          <ChefHat className="h-24 w-24 mb-4 opacity-30" />
          <p className="text-2xl">Bekleyen sipariş yok</p>
          <p className="text-sm mt-2">Yeni siparişler otomatik olarak görünecek</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {orders.map(order => {
            const source = SOURCE_CONFIG[order.source || order.platform] || SOURCE_CONFIG.table;
            const SourceIcon = source.icon;
            const status = ORDER_STATUS[order.status] || ORDER_STATUS.pending;
            const StatusIcon = status.icon;
            const elapsed = getElapsedTime(order.created_at);
            const isUrgent = elapsed.includes('dk') && parseInt(elapsed) > 10;

            return (
              <Card 
                key={order.id || order._id}
                className={`bg-zinc-900 border-2 ${
                  isUrgent ? 'border-red-500 animate-pulse' : 'border-zinc-800'
                }`}
              >
                <CardContent className="p-4">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${source.bg}`}>
                        <SourceIcon className={`h-5 w-5 ${source.color}`} />
                      </div>
                      <div>
                        <div className="font-bold text-lg">
                          {order.table_number ? `Masa ${order.table_number}` : 
                           order.order_number ? `#${order.order_number}` :
                           order.order_id ? `#${order.order_id.slice(-4)}` : '#---'}
                        </div>
                        <div className="text-xs text-zinc-500">{source.label}</div>
                      </div>
                    </div>
                    <Badge className={status.color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {status.label}
                    </Badge>
                  </div>

                  {/* Ürünler */}
                  <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                    {(order.items || []).map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-zinc-800 p-2 rounded">
                        <div className="flex items-center gap-2">
                          <span className="bg-orange-500 text-black font-bold w-6 h-6 rounded flex items-center justify-center text-sm">
                            {item.quantity}
                          </span>
                          <span className="text-sm">{item.name}</span>
                        </div>
                        {item.note && (
                          <span className="text-xs text-yellow-400">📝 {item.note}</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Notlar */}
                  {order.notes && (
                    <div className="bg-yellow-500/20 p-2 rounded mb-3 text-sm text-yellow-400">
                      📝 {order.notes}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Timer className="h-4 w-4" />
                      <span className={`text-sm ${isUrgent ? 'text-red-400 font-bold' : ''}`}>
                        {elapsed}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {(order.status === 'pending' || order.status === 'Yeni') && (
                        <Button 
                          size="sm" 
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => updateOrderStatus(order, 'preparing')}
                        >
                          <Flame className="h-4 w-4 mr-1" />
                          Hazırla
                        </Button>
                      )}
                      {order.status === 'preparing' && (
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => updateOrderStatus(order, 'ready')}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Hazır
                        </Button>
                      )}
                      <Button variant="outline" size="icon" className="h-8 w-8">
                        <Printer className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
