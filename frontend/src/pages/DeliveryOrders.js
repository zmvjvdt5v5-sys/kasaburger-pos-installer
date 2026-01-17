import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Switch } from '../components/ui/switch';
import { 
  Package, RefreshCw, Check, X, Clock, Truck,
  Settings, ChevronRight, Bell, TrendingUp, AlertCircle,
  Play, Pause, Phone, MapPin, FileText, Timer, Printer
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

// Platform logoları ve renkleri
const PLATFORM_CONFIG = {
  yemeksepeti: {
    name: 'Yemeksepeti',
    color: 'bg-pink-500',
    bgLight: 'bg-pink-500/20',
    textColor: 'text-pink-400',
    logo: '🍽️'
  },
  trendyol: {
    name: 'Trendyol Yemek',
    color: 'bg-orange-500',
    bgLight: 'bg-orange-500/20',
    textColor: 'text-orange-400',
    logo: '🛒'
  },
  getir: {
    name: 'Getir Yemek',
    color: 'bg-purple-500',
    bgLight: 'bg-purple-500/20',
    textColor: 'text-purple-400',
    logo: '🛵'
  },
  migros: {
    name: 'Migros Yemek',
    color: 'bg-orange-600',
    bgLight: 'bg-orange-600/20',
    textColor: 'text-orange-300',
    logo: '🏪'
  }
};

const STATUS_CONFIG = {
  new: { label: 'Yeni', color: 'bg-blue-500', icon: Bell },
  accepted: { label: 'Onaylandı', color: 'bg-green-500', icon: Check },
  preparing: { label: 'Hazırlanıyor', color: 'bg-yellow-500', icon: Clock },
  ready: { label: 'Hazır', color: 'bg-purple-500', icon: Package },
  on_the_way: { label: 'Yolda', color: 'bg-indigo-500', icon: Truck },
  delivered: { label: 'Teslim Edildi', color: 'bg-gray-500', icon: Check },
  cancelled: { label: 'İptal', color: 'bg-red-500', icon: X }
};

export default function DeliveryOrders() {
  const [platforms, setPlatforms] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [platformSettings, setPlatformSettings] = useState({});
  const [filter, setFilter] = useState('all');
  const [showPrinterSettings, setShowPrinterSettings] = useState(false);
  const [printerSettings, setPrinterSettings] = useState({
    enabled: false,
    type: 'escpos',
    ip: '192.168.1.100',
    port: 9100,
    printer_name: 'default'
  });

  useEffect(() => {
    loadData();
    loadPrinterSettings();
    // Her 30 saniyede bir güncelle
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadPrinterSettings = async () => {
    try {
      const token = localStorage.getItem('kasaburger_token');
      const response = await fetch(`${BACKEND_URL}/api/printer/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (Object.keys(data).length > 0) {
          setPrinterSettings(data);
        }
      }
    } catch (error) {
      console.error('Yazıcı ayarları yüklenemedi:', error);
    }
  };

  const savePrinterSettings = async () => {
    try {
      const token = localStorage.getItem('kasaburger_token');
      const response = await fetch(`${BACKEND_URL}/api/printer/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(printerSettings)
      });
      if (response.ok) {
        toast.success('Yazıcı ayarları kaydedildi');
        setShowPrinterSettings(false);
      }
    } catch (error) {
      toast.error('Yazıcı ayarları kaydedilemedi');
    }
  };

  const testPrinter = async () => {
    try {
      const token = localStorage.getItem('kasaburger_token');
      const response = await fetch(`${BACKEND_URL}/api/printer/test`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.status === 'success') {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Yazıcı testi başarısız');
    }
  };

  const printOrder = async (orderId) => {
    try {
      const token = localStorage.getItem('kasaburger_token');
      const response = await fetch(`${BACKEND_URL}/api/printer/print-order/${orderId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.status === 'success') {
        toast.success('Sipariş yazdırıldı');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Yazdırma başarısız');
    }
  };

  const loadData = async () => {
    try {
      const token = localStorage.getItem('kasaburger_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [platformsRes, ordersRes, statsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/delivery/platforms`, { headers }),
        fetch(`${BACKEND_URL}/api/delivery/orders`, { headers }),
        fetch(`${BACKEND_URL}/api/delivery/stats`, { headers })
      ]);

      if (platformsRes.ok) setPlatforms(await platformsRes.json());
      if (ordersRes.ok) setOrders(await ordersRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNewOrders = async () => {
    setFetching(true);
    try {
      const token = localStorage.getItem('kasaburger_token');
      const response = await fetch(`${BACKEND_URL}/api/delivery/orders/fetch`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        toast.success(`${result.fetched} yeni sipariş alındı`);
        loadData();
      }
    } catch (error) {
      toast.error('Siparişler alınamadı');
    } finally {
      setFetching(false);
    }
  };

  const acceptOrder = async (orderId, prepTime = 30) => {
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
        toast.success('Sipariş onaylandı');
        loadData();
        setSelectedOrder(null);
      }
    } catch (error) {
      toast.error('Sipariş onaylanamadı');
    }
  };

  const rejectOrder = async (orderId, reason = 'Restoran meşgul') => {
    try {
      const token = localStorage.getItem('kasaburger_token');
      const response = await fetch(`${BACKEND_URL}/api/delivery/orders/${orderId}/reject`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ reason })
      });
      
      if (response.ok) {
        toast.success('Sipariş reddedildi');
        loadData();
        setSelectedOrder(null);
      }
    } catch (error) {
      toast.error('İşlem başarısız');
    }
  };

  const markReady = async (orderId) => {
    try {
      const token = localStorage.getItem('kasaburger_token');
      const response = await fetch(`${BACKEND_URL}/api/delivery/orders/${orderId}/ready`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        toast.success('Sipariş hazır olarak işaretlendi');
        loadData();
      }
    } catch (error) {
      toast.error('İşlem başarısız');
    }
  };

  const openSettings = async (platform) => {
    setSelectedPlatform(platform);
    try {
      const token = localStorage.getItem('kasaburger_token');
      const response = await fetch(`${BACKEND_URL}/api/delivery/settings/${platform.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        setPlatformSettings(await response.json());
      } else {
        setPlatformSettings({});
      }
    } catch (error) {
      setPlatformSettings({});
    }
    setShowSettings(true);
  };

  const saveSettings = async () => {
    try {
      const token = localStorage.getItem('kasaburger_token');
      const response = await fetch(`${BACKEND_URL}/api/delivery/settings/${selectedPlatform.id}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(platformSettings)
      });
      
      if (response.ok) {
        toast.success('Ayarlar kaydedildi');
        setShowSettings(false);
        loadData();
      }
    } catch (error) {
      toast.error('Ayarlar kaydedilemedi');
    }
  };

  const testConnection = async () => {
    try {
      const token = localStorage.getItem('kasaburger_token');
      const response = await fetch(`${BACKEND_URL}/api/delivery/test/${selectedPlatform.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const result = await response.json();
      if (result.status === 'success') {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Bağlantı testi başarısız');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount || 0);
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    if (filter === 'pending') return ['new', 'accepted', 'preparing'].includes(order.status);
    return order.platform === filter;
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-orange-500">Paket Servis Siparişleri</h1>
          <p className="text-zinc-400 mt-1">Yemeksepeti, Trendyol, Getir, Migros</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Yenile
          </Button>
          <Button onClick={fetchNewOrders} disabled={fetching} className="bg-green-600 hover:bg-green-700">
            <Bell className={`h-4 w-4 mr-2 ${fetching ? 'animate-pulse' : ''}`} />
            Siparişleri Çek
          </Button>
        </div>
      </div>

      {/* İstatistikler */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <p className="text-zinc-400 text-sm">Bekleyen</p>
              <p className="text-3xl font-bold text-yellow-400">{stats.pending_orders}</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <p className="text-zinc-400 text-sm">Bugün Toplam</p>
              <p className="text-3xl font-bold text-white">{stats.today?.total_orders || 0}</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <p className="text-zinc-400 text-sm">Bugün Gelir</p>
              <p className="text-2xl font-bold text-green-400">{formatCurrency(stats.today?.total_revenue)}</p>
            </CardContent>
          </Card>
          {Object.entries(stats.today?.by_platform || {}).map(([platform, data]) => (
            <Card key={platform} className={`border-zinc-800 ${PLATFORM_CONFIG[platform]?.bgLight || 'bg-zinc-900'}`}>
              <CardContent className="p-4">
                <p className="text-zinc-300 text-sm flex items-center gap-1">
                  <span>{PLATFORM_CONFIG[platform]?.logo}</span>
                  {PLATFORM_CONFIG[platform]?.name || platform}
                </p>
                <p className="text-2xl font-bold text-white">{data.orders}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Platform Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {platforms.map(platform => {
          const config = PLATFORM_CONFIG[platform.id] || {};
          return (
            <Card 
              key={platform.id} 
              className={`border-zinc-800 cursor-pointer hover:ring-2 hover:ring-orange-500 transition-all ${
                platform.is_active ? config.bgLight : 'bg-zinc-900'
              }`}
              onClick={() => openSettings(platform)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{config.logo}</span>
                  <div className={`w-3 h-3 rounded-full ${platform.is_active ? 'bg-green-500' : 'bg-zinc-600'}`} />
                </div>
                <h3 className="font-bold text-white">{platform.name}</h3>
                <p className="text-xs text-zinc-400">
                  {platform.is_configured ? (platform.is_active ? 'Aktif' : 'Yapılandırıldı') : 'Ayarlanmadı'}
                </p>
                <Button variant="ghost" size="sm" className="mt-2 w-full">
                  <Settings className="h-4 w-4 mr-1" /> Ayarlar
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filtreler */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        <Button 
          variant={filter === 'all' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setFilter('all')}
        >
          Tümü
        </Button>
        <Button 
          variant={filter === 'pending' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setFilter('pending')}
          className={filter === 'pending' ? 'bg-yellow-600' : ''}
        >
          <Clock className="h-4 w-4 mr-1" /> Bekleyen
        </Button>
        {Object.entries(PLATFORM_CONFIG).map(([id, config]) => (
          <Button 
            key={id}
            variant={filter === id ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilter(id)}
            className={filter === id ? config.color : ''}
          >
            {config.logo} {config.name}
          </Button>
        ))}
      </div>

      {/* Sipariş Listesi */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-400 text-lg">Henüz sipariş yok</p>
              <p className="text-zinc-500 text-sm mt-1">
                Siparişleri çekmek için yukarıdaki butonu kullanın
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map(order => {
            const platformConfig = PLATFORM_CONFIG[order.platform] || {};
            const statusConfig = STATUS_CONFIG[order.status] || {};
            const StatusIcon = statusConfig.icon || Clock;
            
            return (
              <Card 
                key={order._internal_id} 
                className={`bg-zinc-900 border-zinc-800 hover:border-zinc-700 cursor-pointer transition-all ${
                  order.status === 'new' ? 'ring-2 ring-blue-500 animate-pulse' : ''
                }`}
                onClick={() => setSelectedOrder(order)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Platform Badge */}
                    <div className={`w-14 h-14 rounded-xl ${platformConfig.bgLight} flex items-center justify-center text-2xl`}>
                      {platformConfig.logo}
                    </div>
                    
                    {/* Sipariş Bilgileri */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig.color} text-white`}>
                          {statusConfig.label}
                        </span>
                        <span className="text-zinc-500 text-sm">#{order.platform_order_id?.slice(-6)}</span>
                      </div>
                      <h3 className="font-bold text-white">{order.customer_name}</h3>
                      <p className="text-zinc-400 text-sm truncate">{order.customer_address}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="text-zinc-400">{order.items?.length || 0} ürün</span>
                        <span className="text-green-400 font-bold">{formatCurrency(order.total)}</span>
                      </div>
                    </div>
                    
                    {/* Aksiyonlar */}
                    <div className="flex flex-col gap-2">
                      {order.status === 'new' && (
                        <>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={(e) => { e.stopPropagation(); acceptOrder(order._internal_id); }}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); rejectOrder(order._internal_id); }}>
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {order.status === 'accepted' && (
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={(e) => { e.stopPropagation(); markReady(order._internal_id); }}>
                          <Package className="h-4 w-4 mr-1" /> Hazır
                        </Button>
                      )}
                      <ChevronRight className="h-5 w-5 text-zinc-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Sipariş Detay Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="text-2xl">{PLATFORM_CONFIG[selectedOrder.platform]?.logo}</span>
                  Sipariş #{selectedOrder.platform_order_id?.slice(-6)}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {/* Durum */}
                <div className={`p-3 rounded-lg ${STATUS_CONFIG[selectedOrder.status]?.color} text-white text-center font-bold`}>
                  {STATUS_CONFIG[selectedOrder.status]?.label}
                </div>
                
                {/* Müşteri Bilgileri */}
                <div className="bg-zinc-800 rounded-lg p-4 space-y-2">
                  <h4 className="font-bold text-orange-400 mb-2">Müşteri Bilgileri</h4>
                  <p className="flex items-center gap-2">
                    <span className="text-zinc-400">👤</span>
                    {selectedOrder.customer_name}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-zinc-400" />
                    {selectedOrder.customer_phone}
                  </p>
                  <p className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-zinc-400 mt-1" />
                    <span>{selectedOrder.customer_address}</span>
                  </p>
                </div>
                
                {/* Ürünler */}
                <div className="bg-zinc-800 rounded-lg p-4">
                  <h4 className="font-bold text-orange-400 mb-2">Ürünler</h4>
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item, index) => (
                      <div key={index} className="flex justify-between">
                        <span>
                          {item.quantity}x {item.name}
                          {item.note && <span className="text-yellow-400 text-sm block">📝 {item.note}</span>}
                        </span>
                        <span className="text-green-400">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-zinc-700 mt-3 pt-3 flex justify-between font-bold">
                    <span>Toplam</span>
                    <span className="text-green-400 text-xl">{formatCurrency(selectedOrder.total)}</span>
                  </div>
                </div>
                
                {/* Not */}
                {selectedOrder.note && (
                  <div className="bg-yellow-500/20 rounded-lg p-4">
                    <h4 className="font-bold text-yellow-400 mb-1">Sipariş Notu</h4>
                    <p>{selectedOrder.note}</p>
                  </div>
                )}
                
                {/* Aksiyonlar */}
                {selectedOrder.status === 'new' && (
                  <div className="flex gap-2">
                    <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => acceptOrder(selectedOrder._internal_id)}>
                      <Check className="h-4 w-4 mr-2" /> Onayla (30 dk)
                    </Button>
                    <Button variant="destructive" className="flex-1" onClick={() => rejectOrder(selectedOrder._internal_id)}>
                      <X className="h-4 w-4 mr-2" /> Reddet
                    </Button>
                  </div>
                )}
                {selectedOrder.status === 'accepted' && (
                  <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={() => markReady(selectedOrder._internal_id)}>
                    <Package className="h-4 w-4 mr-2" /> Hazır Olarak İşaretle
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Platform Ayarları Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
          {selectedPlatform && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="text-2xl">{PLATFORM_CONFIG[selectedPlatform.id]?.logo}</span>
                  {selectedPlatform.name} Ayarları
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {/* Aktif/Pasif */}
                <div className="flex items-center justify-between bg-zinc-800 p-4 rounded-lg">
                  <span>Entegrasyon Aktif</span>
                  <Switch
                    checked={platformSettings.is_active || false}
                    onCheckedChange={(checked) => setPlatformSettings({...platformSettings, is_active: checked})}
                  />
                </div>
                
                {/* Platform'a göre ayarlar */}
                {selectedPlatform.id === 'yemeksepeti' && (
                  <>
                    <div>
                      <label className="text-sm text-zinc-400 mb-1 block">Chain Code</label>
                      <Input
                        value={platformSettings.chain_code || ''}
                        onChange={(e) => setPlatformSettings({...platformSettings, chain_code: e.target.value})}
                        className="bg-zinc-800 border-zinc-700"
                        placeholder="Yemeksepeti Chain Code"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-zinc-400 mb-1 block">Remote ID</label>
                      <Input
                        value={platformSettings.remote_id || ''}
                        onChange={(e) => setPlatformSettings({...platformSettings, remote_id: e.target.value})}
                        className="bg-zinc-800 border-zinc-700"
                        placeholder="Remote ID"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-zinc-400 mb-1 block">Vendor ID</label>
                      <Input
                        value={platformSettings.vendor_id || ''}
                        onChange={(e) => setPlatformSettings({...platformSettings, vendor_id: e.target.value})}
                        className="bg-zinc-800 border-zinc-700"
                        placeholder="Vendor ID"
                      />
                    </div>
                  </>
                )}
                
                {(selectedPlatform.id === 'trendyol' || selectedPlatform.id === 'getir') && (
                  <>
                    <div>
                      <label className="text-sm text-zinc-400 mb-1 block">API Key</label>
                      <Input
                        value={platformSettings.api_key || ''}
                        onChange={(e) => setPlatformSettings({...platformSettings, api_key: e.target.value})}
                        className="bg-zinc-800 border-zinc-700"
                        placeholder="API Key"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-zinc-400 mb-1 block">Secret Key</label>
                      <Input
                        type="password"
                        value={platformSettings.secret_key || ''}
                        onChange={(e) => setPlatformSettings({...platformSettings, secret_key: e.target.value})}
                        className="bg-zinc-800 border-zinc-700"
                        placeholder="Secret Key"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-zinc-400 mb-1 block">Restoran ID</label>
                      <Input
                        value={platformSettings.restaurant_id || ''}
                        onChange={(e) => setPlatformSettings({...platformSettings, restaurant_id: e.target.value})}
                        className="bg-zinc-800 border-zinc-700"
                        placeholder="Restoran ID"
                      />
                    </div>
                  </>
                )}
                
                {selectedPlatform.id === 'migros' && (
                  <>
                    <div>
                      <label className="text-sm text-zinc-400 mb-1 block">API Key</label>
                      <Input
                        value={platformSettings.api_key || ''}
                        onChange={(e) => setPlatformSettings({...platformSettings, api_key: e.target.value})}
                        className="bg-zinc-800 border-zinc-700"
                        placeholder="Migros API Key"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-zinc-400 mb-1 block">Store ID</label>
                      <Input
                        value={platformSettings.store_id || ''}
                        onChange={(e) => setPlatformSettings({...platformSettings, store_id: e.target.value})}
                        className="bg-zinc-800 border-zinc-700"
                        placeholder="Mağaza ID"
                      />
                    </div>
                  </>
                )}
                
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" className="flex-1" onClick={testConnection}>
                    <Play className="h-4 w-4 mr-1" /> Bağlantı Test
                  </Button>
                  <Button className="flex-1 bg-orange-500 hover:bg-orange-600" onClick={saveSettings}>
                    Kaydet
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
