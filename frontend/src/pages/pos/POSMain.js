import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { ScrollArea } from '../../components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  UtensilsCrossed, Users, Clock, CreditCard, Banknote, Smartphone,
  Plus, Minus, Trash2, Send, Receipt, ChefHat, Bell, Printer,
  Search, X, Check, Split, Percent, MessageSquare, Coffee,
  Package, Bike, ShoppingBag, RefreshCw, Volume2, AlertCircle
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Masa durumları
const TABLE_STATUS = {
  empty: { label: 'Boş', color: 'bg-green-500/20 border-green-500/50 text-green-400' },
  occupied: { label: 'Dolu', color: 'bg-orange-500/20 border-orange-500/50 text-orange-400' },
  reserved: { label: 'Rezerve', color: 'bg-blue-500/20 border-blue-500/50 text-blue-400' },
  bill: { label: 'Hesap', color: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' }
};

// Sipariş kaynakları
const ORDER_SOURCES = {
  table: { label: 'Masa', icon: UtensilsCrossed, color: 'text-orange-400' },
  takeaway: { label: 'Gel-Al', icon: ShoppingBag, color: 'text-green-400' },
  delivery: { label: 'Paket', icon: Bike, color: 'text-blue-400' },
  yemeksepeti: { label: 'Yemeksepeti', icon: Package, color: 'text-pink-400' },
  getir: { label: 'Getir', icon: Package, color: 'text-purple-400' },
  trendyol: { label: 'Trendyol', icon: Package, color: 'text-orange-400' },
  migros: { label: 'Migros', icon: Package, color: 'text-green-400' }
};

export default function POSMain({ isDealer = false }) {
  // State
  const [tables, setTables] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [currentOrder, setCurrentOrder] = useState({ items: [], notes: '' });
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [showOrderSource, setShowOrderSource] = useState(false);
  const [orderSource, setOrderSource] = useState('table');
  const [pendingOrders, setPendingOrders] = useState([]);
  const [deliveryOrders, setDeliveryOrders] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Token
  const getToken = () => localStorage.getItem('kasaburger_token') || localStorage.getItem('dealer_token');

  // Verileri yükle
  const loadData = useCallback(async () => {
    try {
      const token = getToken();
      const headers = { Authorization: `Bearer ${token}` };

      // Ürünleri yükle
      const prodRes = await fetch(`${BACKEND_URL}/api/kiosk/products`, { headers });
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData.filter(p => p.is_active !== false));
        
        // Kategorileri çıkar
        const cats = [...new Set(prodData.map(p => p.category))];
        setCategories(cats);
      }

      // Masaları yükle veya varsayılan oluştur
      const tablesRes = await fetch(`${BACKEND_URL}/api/pos/tables`, { headers });
      if (tablesRes.ok) {
        const tablesData = await tablesRes.json();
        setTables(tablesData.length > 0 ? tablesData : generateDefaultTables());
      } else {
        setTables(generateDefaultTables());
      }

      // Platform siparişlerini yükle
      const deliveryRes = await fetch(`${BACKEND_URL}/api/delivery/orders`, { headers });
      if (deliveryRes.ok) {
        const deliveryData = await deliveryRes.json();
        setDeliveryOrders(deliveryData.filter(o => o.status === 'pending' || o.status === 'preparing'));
      }

      setLoading(false);
    } catch (error) {
      console.error('Load error:', error);
      setTables(generateDefaultTables());
      setLoading(false);
    }
  }, []);

  // Varsayılan masalar
  const generateDefaultTables = () => {
    const defaultTables = [];
    // Salon 1 - 10 masa
    for (let i = 1; i <= 10; i++) {
      defaultTables.push({
        id: `table-${i}`,
        number: i,
        section: 'Salon',
        capacity: i <= 4 ? 2 : 4,
        status: 'empty',
        order: null
      });
    }
    // Bahçe - 5 masa
    for (let i = 11; i <= 15; i++) {
      defaultTables.push({
        id: `table-${i}`,
        number: i,
        section: 'Bahçe',
        capacity: 4,
        status: 'empty',
        order: null
      });
    }
    return defaultTables;
  };

  useEffect(() => {
    loadData();
    // Her 30 saniyede güncelle
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Masa seç
  const handleTableSelect = (table) => {
    if (table.status === 'empty') {
      setSelectedTable(table);
      setCurrentOrder({ items: [], notes: '', tableId: table.id, tableNumber: table.number });
      setOrderSource('table');
    } else if (table.order) {
      setSelectedTable(table);
      setCurrentOrder(table.order);
    }
  };

  // Ürün ekle
  const addToOrder = (product) => {
    setCurrentOrder(prev => {
      const existingIndex = prev.items.findIndex(item => item.id === product.id && !item.note);
      if (existingIndex >= 0) {
        const newItems = [...prev.items];
        newItems[existingIndex].quantity += 1;
        return { ...prev, items: newItems };
      }
      return {
        ...prev,
        items: [...prev.items, { ...product, quantity: 1, note: '' }]
      };
    });
  };

  // Ürün çıkar
  const removeFromOrder = (index) => {
    setCurrentOrder(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // Miktar değiştir
  const updateQuantity = (index, delta) => {
    setCurrentOrder(prev => {
      const newItems = [...prev.items];
      newItems[index].quantity = Math.max(1, newItems[index].quantity + delta);
      return { ...prev, items: newItems };
    });
  };

  // Toplam hesapla
  const calculateTotal = () => {
    return currentOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  // Siparişi gönder
  const sendOrder = async () => {
    if (currentOrder.items.length === 0) {
      toast.error('Sipariş boş!');
      return;
    }

    try {
      const token = getToken();
      const orderData = {
        source: orderSource,
        table_id: selectedTable?.id,
        table_number: selectedTable?.number,
        items: currentOrder.items,
        notes: currentOrder.notes,
        total: calculateTotal(),
        status: 'pending',
        created_at: new Date().toISOString()
      };

      const response = await fetch(`${BACKEND_URL}/api/pos/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        toast.success('Sipariş mutfağa gönderildi!');
        
        // Masayı güncelle
        if (selectedTable) {
          setTables(prev => prev.map(t => 
            t.id === selectedTable.id 
              ? { ...t, status: 'occupied', order: { ...currentOrder, total: calculateTotal() } }
              : t
          ));
        }
        
        // Formu temizle
        setCurrentOrder({ items: [], notes: '' });
        setSelectedTable(null);
      } else {
        throw new Error('Sipariş gönderilemedi');
      }
    } catch (error) {
      console.error('Order error:', error);
      toast.error('Sipariş gönderilemedi!');
    }
  };

  // Filtrelenmiş ürünler
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Kategori isimleri
  const categoryNames = {
    'et-burger': '🍔 Et Burger',
    'tavuk': '🍗 Tavuk',
    'premium': '⭐ Premium',
    'atistirmalik': '🍟 Atıştırmalık',
    'icecek': '🥤 İçecek',
    'tatli': '🍰 Tatlı'
  };

  // Para formatı
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex">
      {/* Sol Panel - Masalar ve Sipariş Kaynakları */}
      <div className="w-80 bg-zinc-900 border-r border-zinc-800 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800">
          <h1 className="text-xl font-bold text-orange-500 flex items-center gap-2">
            <UtensilsCrossed className="h-6 w-6" />
            KBYS Adisyon
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Kasa Burger Yönetim Sistemi</p>
        </div>

        {/* Sipariş Kaynakları */}
        <div className="p-3 border-b border-zinc-800">
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(ORDER_SOURCES).slice(0, 4).map(([key, source]) => {
              const Icon = source.icon;
              return (
                <button
                  key={key}
                  onClick={() => {
                    setOrderSource(key);
                    if (key !== 'table') {
                      setSelectedTable(null);
                      setCurrentOrder({ items: [], notes: '', source: key });
                    }
                  }}
                  className={`p-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
                    orderSource === key 
                      ? 'bg-orange-500/20 border border-orange-500' 
                      : 'bg-zinc-800 hover:bg-zinc-700'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${source.color}`} />
                  <span className="text-xs">{source.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Platform Siparişleri */}
        {deliveryOrders.length > 0 && (
          <div className="p-3 border-b border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-zinc-400">Platform Siparişleri</span>
              <Badge className="bg-red-500">{deliveryOrders.length}</Badge>
            </div>
            <ScrollArea className="h-24">
              {deliveryOrders.map(order => (
                <div key={order.id} className="p-2 bg-zinc-800 rounded mb-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-orange-400">{order.platform}</span>
                    <span className="text-zinc-400">#{order.order_id?.slice(-4)}</span>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </div>
        )}

        {/* Masa Listesi */}
        <ScrollArea className="flex-1 p-3">
          <div className="space-y-4">
            {['Salon', 'Bahçe'].map(section => (
              <div key={section}>
                <h3 className="text-sm font-medium text-zinc-400 mb-2">{section}</h3>
                <div className="grid grid-cols-3 gap-2">
                  {tables.filter(t => t.section === section).map(table => {
                    const status = TABLE_STATUS[table.status];
                    const isSelected = selectedTable?.id === table.id;
                    return (
                      <button
                        key={table.id}
                        onClick={() => handleTableSelect(table)}
                        className={`p-3 rounded-lg border-2 transition-all ${status.color} ${
                          isSelected ? 'ring-2 ring-orange-500' : ''
                        }`}
                      >
                        <div className="text-lg font-bold">{table.number}</div>
                        <div className="text-xs opacity-70">{table.capacity} kişi</div>
                        {table.order && (
                          <div className="text-xs font-bold mt-1">
                            {formatCurrency(table.order.total || 0)}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Durum Göstergesi */}
        <div className="p-3 border-t border-zinc-800">
          <div className="flex justify-between text-xs">
            {Object.entries(TABLE_STATUS).map(([key, status]) => (
              <div key={key} className="flex items-center gap-1">
                <div className={`w-3 h-3 rounded ${status.color.split(' ')[0]}`}></div>
                <span className="text-zinc-500">{status.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Orta Panel - Ürünler */}
      <div className="flex-1 flex flex-col">
        {/* Kategori ve Arama */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-900">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Ürün ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-zinc-800 border-zinc-700"
              />
            </div>
            <Button variant="outline" onClick={loadData} size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
              className="whitespace-nowrap"
            >
              Tümü
            </Button>
            {categories.map(cat => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className="whitespace-nowrap"
              >
                {categoryNames[cat] || cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Ürün Grid */}
        <ScrollArea className="flex-1 p-4">
          <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addToOrder(product)}
                className="bg-zinc-800 hover:bg-zinc-700 rounded-xl p-3 text-left transition-all hover:scale-105 active:scale-95"
              >
                <div className="aspect-square rounded-lg overflow-hidden bg-zinc-700 mb-2">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => e.target.src = 'https://via.placeholder.com/150?text=🍔'}
                  />
                </div>
                <h3 className="font-medium text-sm truncate">{product.name}</h3>
                <p className="text-orange-400 font-bold">{formatCurrency(product.price)}</p>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Sağ Panel - Sipariş */}
      <div className="w-96 bg-zinc-900 border-l border-zinc-800 flex flex-col">
        {/* Sipariş Başlığı */}
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-lg">
                {selectedTable ? `Masa ${selectedTable.number}` : 
                 orderSource === 'takeaway' ? 'Gel-Al Sipariş' :
                 orderSource === 'delivery' ? 'Paket Sipariş' : 'Yeni Sipariş'}
              </h2>
              <p className="text-xs text-zinc-500">
                {currentOrder.items.length} ürün
              </p>
            </div>
            {currentOrder.items.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setCurrentOrder({ items: [], notes: '' })}
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Temizle
              </Button>
            )}
          </div>
        </div>

        {/* Sipariş Listesi */}
        <ScrollArea className="flex-1 p-4">
          {currentOrder.items.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <UtensilsCrossed className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Sipariş boş</p>
              <p className="text-xs mt-1">Ürün eklemek için tıklayın</p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentOrder.items.map((item, index) => (
                <div key={index} className="bg-zinc-800 rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-orange-400 text-sm">{formatCurrency(item.price)}</p>
                      {item.note && (
                        <p className="text-xs text-zinc-400 mt-1">Not: {item.note}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(index, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-bold">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(index, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-400"
                        onClick={() => removeFromOrder(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-right text-sm font-bold text-zinc-300 mt-2">
                    {formatCurrency(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Sipariş Notu */}
        {currentOrder.items.length > 0 && (
          <div className="p-4 border-t border-zinc-800">
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Sipariş notu..."
                value={currentOrder.notes}
                onChange={(e) => setCurrentOrder(prev => ({ ...prev, notes: e.target.value }))}
                className="pl-10 bg-zinc-800 border-zinc-700"
              />
            </div>
          </div>
        )}

        {/* Toplam ve Butonlar */}
        <div className="p-4 border-t border-zinc-800 space-y-3">
          <div className="flex items-center justify-between text-xl font-bold">
            <span>Toplam</span>
            <span className="text-orange-400">{formatCurrency(calculateTotal())}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={sendOrder}
              disabled={currentOrder.items.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              <Send className="h-4 w-4 mr-2" />
              Mutfağa Gönder
            </Button>
            <Button
              onClick={() => setShowPayment(true)}
              disabled={currentOrder.items.length === 0}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Ödeme Al
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" size="sm">
              <Printer className="h-4 w-4 mr-1" />
              Yazdır
            </Button>
            <Button variant="outline" size="sm">
              <Split className="h-4 w-4 mr-1" />
              Böl
            </Button>
            <Button variant="outline" size="sm">
              <Percent className="h-4 w-4 mr-1" />
              İndirim
            </Button>
          </div>
        </div>
      </div>

      {/* Ödeme Dialog */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-orange-500" />
              Ödeme Al - {formatCurrency(calculateTotal())}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Button 
                className="h-20 flex-col gap-2 bg-green-600 hover:bg-green-700"
                onClick={() => handlePayment('cash')}
              >
                <Banknote className="h-8 w-8" />
                <span>Nakit</span>
              </Button>
              <Button 
                className="h-20 flex-col gap-2 bg-blue-600 hover:bg-blue-700"
                onClick={() => handlePayment('card')}
              >
                <CreditCard className="h-8 w-8" />
                <span>Kredi Kartı</span>
              </Button>
            </div>

            {/* Online Ödeme */}
            <Button 
              className="w-full h-14 flex-col gap-1 bg-cyan-600 hover:bg-cyan-700"
              onClick={() => handlePayment('online')}
            >
              <span className="text-sm">💳 Online Ödeme (Platformdan Ödenmiş)</span>
            </Button>

            <div className="grid grid-cols-4 gap-2">
              {['Sodexo', 'Multinet', 'Ticket', 'Setcard'].map(card => (
                <Button
                  key={card}
                  variant="outline"
                  className="h-16 flex-col text-xs"
                  onClick={() => handlePayment(card.toLowerCase())}
                >
                  <Smartphone className="h-5 w-5 mb-1" />
                  {card}
                </Button>
              ))}
            </div>

            <Button variant="outline" className="w-full" onClick={() => setShowPayment(false)}>
              İptal
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
