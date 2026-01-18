import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Switch } from '../components/ui/switch';
import { 
  Package, RefreshCw, Check, X, Clock, Truck, User,
  Settings, Bell, Phone, MapPin, FileText, Printer,
  CreditCard, MessageSquare, Timer, Volume2, VolumeX,
  Smartphone, ChevronDown, ChevronUp, Play, DollarSign
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

// Platform yapılandırması
const PLATFORMS = {
  yemeksepeti: { name: 'Yemeksepeti', color: '#E11D48', logo: '🍽️', bgClass: 'bg-pink-500' },
  trendyol: { name: 'Trendyol Yemek', color: '#F97316', logo: '🛒', bgClass: 'bg-orange-500' },
  getir: { name: 'Getir Yemek', color: '#7C3AED', logo: '🛵', bgClass: 'bg-purple-500' },
  migros: { name: 'Migros Yemek', color: '#EA580C', logo: '🏪', bgClass: 'bg-orange-600' }
};

const STATUS_MAP = {
  new: { label: 'YENİ SİPARİŞ', color: 'bg-blue-500', pulse: true },
  accepted: { label: 'ONAYLANDI', color: 'bg-green-500', pulse: false },
  preparing: { label: 'HAZIRLANIYOR', color: 'bg-yellow-500', pulse: false },
  ready: { label: 'HAZIR', color: 'bg-purple-500', pulse: false },
  on_the_way: { label: 'YOLDA', color: 'bg-indigo-500', pulse: false },
  delivered: { label: 'TESLİM EDİLDİ', color: 'bg-gray-500', pulse: false },
  cancelled: { label: 'İPTAL', color: 'bg-red-500', pulse: false }
};

// Ses dosyası URL'si
const NOTIFICATION_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

export default function DeliveryPanel({ isDealer = false }) {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ pending: 0, today: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [expandedOrders, setExpandedOrders] = useState(new Set());
  const [filter, setFilter] = useState('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [printerSettings, setPrinterSettings] = useState({ enabled: false, ip: '', port: 9100 });
  const [prepTime, setPrepTime] = useState(30);
  
  const audioRef = useRef(null);
  const previousOrderCount = useRef(0);
  const pollingInterval = useRef(null);

  // Ses çal
  const playSound = useCallback(() => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.log('Audio play failed:', e));
    }
  }, [soundEnabled]);

  // Push Notification gönder
  const sendNotification = useCallback((title, body) => {
    if (notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/logo192.png',
        badge: '/logo192.png',
        vibrate: [200, 100, 200],
        tag: 'new-order',
        renotify: true
      });
    }
  }, [notificationsEnabled]);

  // Notification izni iste
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        toast.success('Bildirimler aktif!');
      } else {
        toast.error('Bildirim izni reddedildi');
      }
    }
  };

  // Siparişleri yükle
  const loadOrders = useCallback(async () => {
    try {
      const token = localStorage.getItem('kasaburger_token');
      const response = await fetch(`${BACKEND_URL}/api/delivery/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Yeni sipariş kontrolü
        const newOrders = data.filter(o => o.status === 'new');
        if (newOrders.length > previousOrderCount.current) {
          // Yeni sipariş geldi!
          playSound();
          const latestOrder = newOrders[0];
          sendNotification(
            `🍔 Yeni Sipariş - ${PLATFORMS[latestOrder.platform]?.name}`,
            `${latestOrder.customer_name} - ${formatCurrency(latestOrder.total)}`
          );
        }
        previousOrderCount.current = newOrders.length;
        
        setOrders(data);
        
        // İstatistikler
        const pending = data.filter(o => ['new', 'accepted', 'preparing'].includes(o.status)).length;
        const today = data.length;
        const revenue = data.reduce((sum, o) => sum + (o.total || 0), 0);
        setStats({ pending, today, revenue });
      }
    } catch (error) {
      console.error('Sipariş yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  }, [playSound, sendNotification]);

  // Siparişleri platformlardan çek
  const fetchFromPlatforms = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('kasaburger_token');
      const response = await fetch(`${BACKEND_URL}/api/delivery/orders/fetch`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        toast.success(`${result.fetched} yeni sipariş alındı`);
        loadOrders();
      }
    } catch (error) {
      toast.error('Siparişler alınamadı');
    } finally {
      setLoading(false);
    }
  };

  // Sipariş onayla
  const acceptOrder = async (orderId) => {
    try {
      const token = localStorage.getItem('kasaburger_token');
      const response = await fetch(`${BACKEND_URL}/api/delivery/orders/${orderId}/accept`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ preparation_time: prepTime })
      });
      
      if (response.ok) {
        toast.success(`Sipariş onaylandı (${prepTime} dk)`);
        loadOrders();
        setSelectedOrder(null);
      }
    } catch (error) {
      toast.error('Onaylama başarısız');
    }
  };

  // Sipariş reddet
  const rejectOrder = async (orderId, reason = 'Restoran meşgul') => {
    if (!window.confirm('Siparişi reddetmek istediğinize emin misiniz?')) return;
    
    try {
      const token = localStorage.getItem('kasaburger_token');
      await fetch(`${BACKEND_URL}/api/delivery/orders/${orderId}/reject`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ reason })
      });
      toast.success('Sipariş reddedildi');
      loadOrders();
      setSelectedOrder(null);
    } catch (error) {
      toast.error('İşlem başarısız');
    }
  };

  // Hazır işaretle
  const markReady = async (orderId) => {
    try {
      const token = localStorage.getItem('kasaburger_token');
      await fetch(`${BACKEND_URL}/api/delivery/orders/${orderId}/ready`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Sipariş hazır!');
      loadOrders();
    } catch (error) {
      toast.error('İşlem başarısız');
    }
  };

  // Yazdır
  const printOrder = async (orderId) => {
    try {
      const token = localStorage.getItem('kasaburger_token');
      const response = await fetch(`${BACKEND_URL}/api/printer/print-order/${orderId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.status === 'success') {
        toast.success('Yazdırıldı!');
      } else {
        toast.error(result.message || 'Yazdırma başarısız');
      }
    } catch (error) {
      toast.error('Yazdırma hatası');
    }
  };

  // Para formatla
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount || 0);
  };

  // Tarih formatla
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  // Expand/Collapse toggle
  const toggleExpand = (orderId) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  // Filtrelenmiş siparişler
  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    if (filter === 'pending') return ['new', 'accepted', 'preparing'].includes(order.status);
    if (filter === 'completed') return ['ready', 'delivered'].includes(order.status);
    return order.platform === filter;
  });

  // Polling başlat
  useEffect(() => {
    loadOrders();
    pollingInterval.current = setInterval(loadOrders, 15000); // 15 saniyede bir
    
    // Audio element oluştur
    audioRef.current = new Audio(NOTIFICATION_SOUND);
    audioRef.current.volume = 1.0;
    
    // Notification permission kontrolü
    if ('Notification' in window && Notification.permission === 'granted') {
      setNotificationsEnabled(true);
    }
    
    return () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
    };
  }, [loadOrders]);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-orange-500">
                📦 {isDealer ? 'Canlı Siparişlerim' : 'Paket Siparişleri'}
              </h1>
              
              {/* İstatistikler */}
              <div className="hidden md:flex items-center gap-4 ml-8">
                <div className="flex items-center gap-2 bg-yellow-500/20 px-3 py-1.5 rounded-full">
                  <Bell className="h-4 w-4 text-yellow-400" />
                  <span className="font-bold text-yellow-400">{stats.pending}</span>
                  <span className="text-yellow-400/70 text-sm">Bekleyen</span>
                </div>
                <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1.5 rounded-full">
                  <DollarSign className="h-4 w-4 text-green-400" />
                  <span className="font-bold text-green-400">{formatCurrency(stats.revenue)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Ses Toggle */}
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={soundEnabled ? 'text-green-400' : 'text-zinc-500'}
              >
                {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              </Button>
              
              {/* Bildirim Toggle */}
              <Button 
                variant="ghost" 
                size="icon"
                onClick={notificationsEnabled ? () => setNotificationsEnabled(false) : requestNotificationPermission}
                className={notificationsEnabled ? 'text-blue-400' : 'text-zinc-500'}
              >
                <Smartphone className="h-5 w-5" />
              </Button>
              
              {/* Ayarlar */}
              <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)}>
                <Settings className="h-5 w-5" />
              </Button>
              
              {/* Yenile */}
              <Button variant="outline" size="sm" onClick={loadOrders} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Yenile
              </Button>
              
              {/* Siparişleri Çek */}
              <Button onClick={fetchFromPlatforms} disabled={loading} className="bg-green-600 hover:bg-green-700">
                <Bell className="h-4 w-4 mr-1" />
                Çek
              </Button>
            </div>
          </div>
          
          {/* Filtreler */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {[
              { id: 'all', label: 'Tümü' },
              { id: 'pending', label: '⏳ Bekleyen', highlight: stats.pending > 0 },
              { id: 'completed', label: '✅ Tamamlanan' },
              ...Object.entries(PLATFORMS).map(([id, p]) => ({ id, label: `${p.logo} ${p.name}` }))
            ].map(f => (
              <Button
                key={f.id}
                size="sm"
                variant={filter === f.id ? 'default' : 'outline'}
                onClick={() => setFilter(f.id)}
                className={`whitespace-nowrap ${filter === f.id && f.id === 'pending' ? 'bg-yellow-600' : ''} ${f.highlight ? 'ring-2 ring-yellow-500' : ''}`}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Sipariş Listesi */}
      <div className="max-w-7xl mx-auto p-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-20">
            <Package className="h-20 w-20 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500 text-xl">Sipariş bulunmuyor</p>
            <p className="text-zinc-600 mt-2">Siparişleri çekmek için yukarıdaki butonu kullanın</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredOrders.map(order => {
              const platform = PLATFORMS[order.platform] || {};
              const status = STATUS_MAP[order.status] || {};
              const isExpanded = expandedOrders.has(order._internal_id);
              const isNew = order.status === 'new';
              
              return (
                <Card 
                  key={order._internal_id}
                  className={`bg-zinc-900 border-zinc-800 overflow-hidden transition-all ${
                    isNew ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-500/20' : ''
                  } ${status.pulse ? 'animate-pulse' : ''}`}
                >
                  <CardContent className="p-0">
                    {/* Ana Satır */}
                    <div 
                      className="p-4 cursor-pointer hover:bg-zinc-800/50 transition-colors"
                      onClick={() => toggleExpand(order._internal_id)}
                    >
                      <div className="flex items-center gap-4">
                        {/* Platform Logo */}
                        <div 
                          className={`w-16 h-16 rounded-xl flex items-center justify-center text-3xl ${platform.bgClass}`}
                          style={{ backgroundColor: platform.color + '30' }}
                        >
                          {platform.logo}
                        </div>
                        
                        {/* Sipariş Bilgileri */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold text-white ${status.color}`}>
                              {status.label}
                            </span>
                            <span className="text-zinc-500 text-sm font-mono">
                              #{order.platform_order_id?.slice(-8)}
                            </span>
                            <span className="text-zinc-600 text-sm">
                              {formatTime(order.created_at)}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-zinc-500" />
                            <span className="font-bold text-lg">{order.customer_name}</span>
                          </div>
                          
                          <div className="flex items-center gap-4 mt-1 text-sm text-zinc-400">
                            <span className="flex items-center gap-1">
                              <Package className="h-3.5 w-3.5" />
                              {order.items?.length || 0} ürün
                            </span>
                            <span className="flex items-center gap-1">
                              <CreditCard className="h-3.5 w-3.5" />
                              {order.payment_method || 'Online'}
                            </span>
                          </div>
                        </div>
                        
                        {/* Tutar ve Aksiyonlar */}
                        <div className="text-right">
                          <p className="text-2xl font-black text-green-400">{formatCurrency(order.total)}</p>
                          
                          <div className="flex items-center gap-2 mt-2 justify-end">
                            {isNew && (
                              <>
                                <Button 
                                  size="sm" 
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={(e) => { e.stopPropagation(); acceptOrder(order._internal_id); }}
                                >
                                  <Check className="h-4 w-4 mr-1" /> Onayla
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={(e) => { e.stopPropagation(); rejectOrder(order._internal_id); }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {order.status === 'accepted' && (
                              <Button 
                                size="sm" 
                                className="bg-purple-600 hover:bg-purple-700"
                                onClick={(e) => { e.stopPropagation(); markReady(order._internal_id); }}
                              >
                                <Package className="h-4 w-4 mr-1" /> Hazır
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={(e) => { e.stopPropagation(); printOrder(order._internal_id); }}
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                            {isExpanded ? <ChevronUp className="h-5 w-5 text-zinc-500" /> : <ChevronDown className="h-5 w-5 text-zinc-500" />}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Genişletilmiş Detaylar */}
                    {isExpanded && (
                      <div className="border-t border-zinc-800 bg-zinc-950 p-4">
                        <div className="grid md:grid-cols-2 gap-6">
                          {/* Sol: Müşteri ve Adres */}
                          <div className="space-y-4">
                            <div className="bg-zinc-900 rounded-xl p-4">
                              <h4 className="text-orange-400 font-bold mb-3 flex items-center gap-2">
                                <User className="h-4 w-4" /> Müşteri Bilgileri
                              </h4>
                              <div className="space-y-2">
                                <p className="flex items-center gap-2">
                                  <span className="text-zinc-500 w-20">Ad Soyad:</span>
                                  <span className="font-medium">{order.customer_name}</span>
                                </p>
                                <p className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-zinc-500" />
                                  <a href={`tel:${order.customer_phone}`} className="text-blue-400 hover:underline">
                                    {order.customer_phone}
                                  </a>
                                </p>
                              </div>
                            </div>
                            
                            <div className="bg-zinc-900 rounded-xl p-4">
                              <h4 className="text-orange-400 font-bold mb-3 flex items-center gap-2">
                                <MapPin className="h-4 w-4" /> Teslimat Adresi
                              </h4>
                              <p className="text-zinc-300 leading-relaxed">{order.customer_address}</p>
                            </div>
                            
                            {order.note && (
                              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                                <h4 className="text-yellow-400 font-bold mb-2 flex items-center gap-2">
                                  <MessageSquare className="h-4 w-4" /> Sipariş Notu
                                </h4>
                                <p className="text-yellow-200">{order.note}</p>
                              </div>
                            )}
                          </div>
                          
                          {/* Sağ: Ürünler */}
                          <div className="bg-zinc-900 rounded-xl p-4">
                            <h4 className="text-orange-400 font-bold mb-3 flex items-center gap-2">
                              <FileText className="h-4 w-4" /> Sipariş Detayı
                            </h4>
                            <div className="space-y-3">
                              {order.items?.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-start pb-2 border-b border-zinc-800 last:border-0">
                                  <div className="flex-1">
                                    <p className="font-medium">
                                      <span className="text-orange-400 font-bold mr-2">{item.quantity}x</span>
                                      {item.name}
                                    </p>
                                    {item.note && (
                                      <p className="text-yellow-400 text-sm mt-1">📝 {item.note}</p>
                                    )}
                                    {item.options?.length > 0 && (
                                      <p className="text-zinc-500 text-sm mt-1">
                                        {item.options.map(o => o.name || o).join(', ')}
                                      </p>
                                    )}
                                  </div>
                                  <p className="text-green-400 font-bold ml-4">
                                    {formatCurrency(item.price * item.quantity)}
                                  </p>
                                </div>
                              ))}
                            </div>
                            
                            <div className="border-t border-zinc-700 mt-4 pt-4 space-y-2">
                              {order.delivery_fee > 0 && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-zinc-500">Teslimat Ücreti</span>
                                  <span>{formatCurrency(order.delivery_fee)}</span>
                                </div>
                              )}
                              <div className="flex justify-between text-lg font-bold">
                                <span>TOPLAM</span>
                                <span className="text-green-400">{formatCurrency(order.total)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Ödeme</span>
                                <span className="text-blue-400">{order.payment_method || 'Online Ödeme'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Alt Aksiyonlar */}
                        <div className="flex gap-3 mt-4 pt-4 border-t border-zinc-800">
                          {isNew && (
                            <>
                              <div className="flex items-center gap-2 bg-zinc-900 rounded-lg px-3 py-2">
                                <Timer className="h-4 w-4 text-zinc-400" />
                                <span className="text-sm text-zinc-400">Hazırlık:</span>
                                <select 
                                  value={prepTime}
                                  onChange={(e) => setPrepTime(parseInt(e.target.value))}
                                  className="bg-zinc-800 border-none text-white rounded px-2 py-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <option value={15}>15 dk</option>
                                  <option value={20}>20 dk</option>
                                  <option value={25}>25 dk</option>
                                  <option value={30}>30 dk</option>
                                  <option value={40}>40 dk</option>
                                  <option value={50}>50 dk</option>
                                  <option value={60}>60 dk</option>
                                </select>
                              </div>
                              <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => acceptOrder(order._internal_id)}>
                                <Check className="h-4 w-4 mr-2" /> Siparişi Onayla ({prepTime} dk)
                              </Button>
                              <Button variant="destructive" onClick={() => rejectOrder(order._internal_id)}>
                                <X className="h-4 w-4 mr-2" /> Reddet
                              </Button>
                            </>
                          )}
                          {order.status === 'accepted' && (
                            <Button className="flex-1 bg-purple-600 hover:bg-purple-700" onClick={() => markReady(order._internal_id)}>
                              <Package className="h-4 w-4 mr-2" /> Hazır Olarak İşaretle
                            </Button>
                          )}
                          <Button variant="outline" onClick={() => printOrder(order._internal_id)}>
                            <Printer className="h-4 w-4 mr-2" /> Yazdır
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Ayarlar Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-orange-500" />
              Paket Servis Ayarları
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Ses Bildirimi */}
            <div className="flex items-center justify-between bg-zinc-800 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <Volume2 className="h-5 w-5 text-zinc-400" />
                <div>
                  <p className="font-medium">Ses Bildirimi</p>
                  <p className="text-xs text-zinc-500">Yeni sipariş gelince ses çal</p>
                </div>
              </div>
              <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
            </div>
            
            {/* Push Bildirimi */}
            <div className="flex items-center justify-between bg-zinc-800 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-zinc-400" />
                <div>
                  <p className="font-medium">Masaüstü Bildirimi</p>
                  <p className="text-xs text-zinc-500">Tarayıcı bildirimi gönder</p>
                </div>
              </div>
              <Switch 
                checked={notificationsEnabled} 
                onCheckedChange={(checked) => {
                  if (checked) requestNotificationPermission();
                  else setNotificationsEnabled(false);
                }} 
              />
            </div>
            
            {/* Yazıcı Ayarları */}
            <div className="bg-zinc-800 p-4 rounded-lg space-y-3">
              <div className="flex items-center gap-3">
                <Printer className="h-5 w-5 text-zinc-400" />
                <p className="font-medium">Yazıcı Ayarları</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-500">IP Adresi</label>
                  <Input
                    value={printerSettings.ip}
                    onChange={(e) => setPrinterSettings({...printerSettings, ip: e.target.value})}
                    placeholder="192.168.1.100"
                    className="bg-zinc-900 border-zinc-700 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500">Port</label>
                  <Input
                    type="number"
                    value={printerSettings.port}
                    onChange={(e) => setPrinterSettings({...printerSettings, port: parseInt(e.target.value)})}
                    placeholder="9100"
                    className="bg-zinc-900 border-zinc-700 mt-1"
                  />
                </div>
              </div>
            </div>
            
            {/* Webhook Bilgisi */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-blue-400 font-medium mb-2">📡 Webhook URL'leri</p>
              <p className="text-xs text-zinc-400 mb-1">Platform panellerinde bu URL'leri ayarlayın:</p>
              <code className="text-xs text-blue-300 block mt-2">/api/webhook/yemeksepeti</code>
              <code className="text-xs text-blue-300 block">/api/webhook/trendyol</code>
              <code className="text-xs text-blue-300 block">/api/webhook/getir</code>
              <code className="text-xs text-blue-300 block">/api/webhook/migros</code>
            </div>
            
            <Button className="w-full bg-orange-500 hover:bg-orange-600" onClick={() => setShowSettings(false)}>
              Tamam
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
