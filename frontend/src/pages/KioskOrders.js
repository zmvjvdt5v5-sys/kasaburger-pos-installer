import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { toast } from 'sonner';
import { Bell, BellOff, Printer, Clock, CheckCircle, ChefHat, Package, QrCode, Volume2, VolumeX, RefreshCw } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const KioskOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [qrCode, setQrCode] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const lastOrderCountRef = useRef(0);
  const audioRef = useRef(null);

  // Notification sound - Daha uzun ve sesli
  useEffect(() => {
    // Daha net ve uzun bir bildirim sesi
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audioRef.current.volume = 1.0; // Maksimum ses
  }, []);

  const playNotificationSound = () => {
    if (soundEnabled && audioRef.current) {
      // Sesi 3 kez çal
      let playCount = 0;
      const playSound = () => {
        if (playCount < 3) {
          audioRef.current.currentTime = 0;
          audioRef.current.volume = 1.0;
          audioRef.current.play().catch(() => {});
          playCount++;
          setTimeout(playSound, 600); // 600ms aralıkla tekrar
        }
      };
      playSound();
    }
  };

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('kasaburger_token');
      const response = await fetch(`${BACKEND_URL}/api/kiosk/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        
        // Check for new orders
        const newOrders = data.filter(o => o.status === 'new');
        if (newOrders.length > lastOrderCountRef.current) {
          playNotificationSound();
          toast.success('🔔 Yeni sipariş geldi!');
        }
        lastOrderCountRef.current = newOrders.length;
        
        setOrders(data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto refresh every 5 seconds
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('kasaburger_token');
      const response = await fetch(`${BACKEND_URL}/api/kiosk/orders/${orderId}/status?status=${newStatus}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        toast.success('Durum güncellendi');
        fetchOrders();
      }
    } catch (error) {
      toast.error('Hata oluştu');
    }
  };

  const printOrder = async (order) => {
    // Create print window
    const printContent = `
      <html>
      <head>
        <title>Sipariş #${order.order_number}</title>
        <style>
          body { font-family: 'Courier New', monospace; width: 80mm; margin: 0; padding: 10px; }
          .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
          .logo { font-size: 24px; font-weight: bold; }
          .order-no { font-size: 32px; font-weight: bold; margin: 10px 0; }
          .info { margin: 5px 0; }
          .items { border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 10px 0; margin: 10px 0; }
          .item { display: flex; justify-content: space-between; margin: 5px 0; }
          .total { font-size: 20px; font-weight: bold; text-align: right; }
          .footer { text-align: center; margin-top: 10px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">KASA BURGER</div>
          <div>Self-Servis Sipariş</div>
        </div>
        <div style="text-align:center">
          <div class="order-no">#${order.order_number}</div>
          <div class="info">${new Date(order.created_at).toLocaleString('tr-TR')}</div>
          <div class="info"><strong>${order.service_type === 'masa' ? `Masa: ${order.table_number}` : 'Paket Servis'}</strong></div>
          <div class="info">Ödeme: ${order.payment_method === 'cash' ? 'Nakit' : 'Kredi Kartı'}</div>
        </div>
        <div class="items">
          ${order.items.map(item => `
            <div class="item">
              <span>${item.quantity}x ${item.product_name}</span>
              <span>₺${(item.total || item.unit_price * item.quantity).toFixed(0)}</span>
            </div>
          `).join('')}
        </div>
        <div class="total">TOPLAM: ₺${order.total.toFixed(0)}</div>
        <div class="footer">
          <p>İyi günler dileriz!</p>
          <p>www.kasaburger.net.tr</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const fetchQRCode = async () => {
    try {
      const token = localStorage.getItem('kasaburger_token');
      const response = await fetch(`${BACKEND_URL}/api/kiosk/qr-code`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setQrCode(data);
        setShowQR(true);
      }
    } catch (error) {
      toast.error('QR kod oluşturulamadı');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      new: 'bg-red-500 animate-pulse',
      preparing: 'bg-yellow-500',
      ready: 'bg-green-500',
      completed: 'bg-zinc-500',
      cancelled: 'bg-zinc-700'
    };
    const labels = {
      new: 'YENİ',
      preparing: 'Hazırlanıyor',
      ready: 'Hazır',
      completed: 'Tamamlandı',
      cancelled: 'İptal'
    };
    return <Badge className={`${styles[status]} text-white`}>{labels[status]}</Badge>;
  };

  const newOrders = orders.filter(o => o.status === 'new');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');
  const completedOrders = orders.filter(o => ['completed', 'cancelled'].includes(o.status)).slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Kiosk Siparişleri</h1>
          <p className="text-muted-foreground">Mobil ve kiosk siparişlerini takip edin</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Sound Toggle */}
          <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-lg">
            {soundEnabled ? <Volume2 className="h-5 w-5 text-green-500" /> : <VolumeX className="h-5 w-5 text-zinc-500" />}
            <span className="text-sm">Sesli Uyarı</span>
            <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
          </div>
          
          {/* QR Code Button */}
          <Button variant="outline" onClick={fetchQRCode}>
            <QrCode className="h-5 w-5 mr-2" />
            QR Kod
          </Button>
          
          {/* Refresh Button */}
          <Button variant="outline" onClick={fetchOrders}>
            <RefreshCw className="h-5 w-5 mr-2" />
            Yenile
          </Button>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQR && qrCode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowQR(false)}>
          <Card className="max-w-md" onClick={e => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="text-center">Mobil Sipariş QR Kodu</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <img src={qrCode.qr_code} alt="QR Code" className="mx-auto w-64 h-64" />
              <p className="text-sm text-muted-foreground">{qrCode.url}</p>
              <p className="text-xs text-muted-foreground">Bu QR kodu masalara yerleştirin. Müşteriler telefonlarıyla okutup sipariş verebilir.</p>
              <Button onClick={() => {
                const link = document.createElement('a');
                link.download = 'kasaburger-qr.png';
                link.href = qrCode.qr_code;
                link.click();
              }}>
                QR Kodu İndir
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Order Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* New Orders */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-red-500">
            <Bell className="h-5 w-5 animate-bounce" />
            <h2 className="font-bold text-lg">Yeni ({newOrders.length})</h2>
          </div>
          {newOrders.map(order => (
            <Card key={order.id} className="border-red-500/50 bg-red-500/5">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">#{order.order_number}</span>
                  {getStatusBadge(order.status)}
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>{order.service_type === 'masa' ? `Masa: ${order.table_number}` : 'Paket'}</p>
                  <p>{new Date(order.created_at).toLocaleTimeString('tr-TR')}</p>
                </div>
                <div className="space-y-1 text-sm">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between">
                      <span>{item.quantity}x {item.product_name}</span>
                    </div>
                  ))}
                </div>
                <div className="font-bold text-lg text-orange-500">₺{order.total}</div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 bg-yellow-500 hover:bg-yellow-600" onClick={() => updateOrderStatus(order.id, 'preparing')}>
                    <ChefHat className="h-4 w-4 mr-1" /> Hazırla
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => printOrder(order)}>
                    <Printer className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {newOrders.length === 0 && <p className="text-center text-muted-foreground py-8">Yeni sipariş yok</p>}
        </div>

        {/* Preparing */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-yellow-500">
            <ChefHat className="h-5 w-5" />
            <h2 className="font-bold text-lg">Hazırlanıyor ({preparingOrders.length})</h2>
          </div>
          {preparingOrders.map(order => (
            <Card key={order.id} className="border-yellow-500/50 bg-yellow-500/5">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">#{order.order_number}</span>
                  {getStatusBadge(order.status)}
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>{order.service_type === 'masa' ? `Masa: ${order.table_number}` : 'Paket'}</p>
                </div>
                <div className="space-y-1 text-sm">
                  {order.items.map((item, i) => (
                    <div key={i}>{item.quantity}x {item.product_name}</div>
                  ))}
                </div>
                <Button size="sm" className="w-full bg-green-500 hover:bg-green-600" onClick={() => updateOrderStatus(order.id, 'ready')}>
                  <CheckCircle className="h-4 w-4 mr-1" /> Hazır
                </Button>
              </CardContent>
            </Card>
          ))}
          {preparingOrders.length === 0 && <p className="text-center text-muted-foreground py-8">-</p>}
        </div>

        {/* Ready */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-green-500">
            <Package className="h-5 w-5" />
            <h2 className="font-bold text-lg">Hazır ({readyOrders.length})</h2>
          </div>
          {readyOrders.map(order => (
            <Card key={order.id} className="border-green-500/50 bg-green-500/5">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">#{order.order_number}</span>
                  {getStatusBadge(order.status)}
                </div>
                <div className="text-sm">
                  <p className="font-bold">{order.service_type === 'masa' ? `Masa: ${order.table_number}` : 'Paket'}</p>
                </div>
                <Button size="sm" className="w-full" onClick={() => updateOrderStatus(order.id, 'completed')}>
                  Teslim Edildi
                </Button>
              </CardContent>
            </Card>
          ))}
          {readyOrders.length === 0 && <p className="text-center text-muted-foreground py-8">-</p>}
        </div>

        {/* Completed */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-zinc-500">
            <Clock className="h-5 w-5" />
            <h2 className="font-bold text-lg">Tamamlanan</h2>
          </div>
          {completedOrders.map(order => (
            <Card key={order.id} className="opacity-60">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold">#{order.order_number}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleTimeString('tr-TR')}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">₺{order.total}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KioskOrders;
