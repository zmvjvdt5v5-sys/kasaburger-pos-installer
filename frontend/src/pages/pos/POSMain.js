import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Textarea } from '../../components/ui/textarea';
import { toast } from 'sonner';
import { 
  UtensilsCrossed, Users, CreditCard, Banknote, Smartphone, QrCode,
  Plus, Minus, Trash2, Send, Receipt, ChefHat, Printer, Gift,
  Search, X, Check, Split, Percent, MessageSquare, ArrowLeftRight,
  Package, Bike, ShoppingBag, RefreshCw, Settings, LogOut, Home,
  Clock, DollarSign, TrendingUp, FileText, Merge, Move, Edit3,
  GripVertical, Bell, Volume2, ScanLine
} from 'lucide-react';
import { BarcodeScanButton, useBarcodeListener } from '../../components/BarcodeScanner';
import { PushNotificationToggle } from '../../components/PushNotifications';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// WebSocket URL'ini doğru şekilde oluştur
const getWebSocketUrl = () => {
  if (!BACKEND_URL) return null;
  
  try {
    const url = new URL(BACKEND_URL);
    // Production'da wss, development'da ws kullan
    const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    // Port varsa ekle, yoksa varsayılan port kullanılır
    const wsUrl = `${wsProtocol}//${url.host}`;
    return wsUrl;
  } catch (e) {
    console.error('WebSocket URL oluşturma hatası:', e);
    return null;
  }
};

const WS_URL = getWebSocketUrl();

// Masa durumları
const TABLE_STATUS = {
  empty: { label: 'Boş', color: 'bg-emerald-500/20 border-emerald-500 text-emerald-400', bg: 'bg-emerald-500' },
  occupied: { label: 'Dolu', color: 'bg-orange-500/20 border-orange-500 text-orange-400', bg: 'bg-orange-500' },
  reserved: { label: 'Rezerve', color: 'bg-blue-500/20 border-blue-500 text-blue-400', bg: 'bg-blue-500' },
  bill: { label: 'Hesap', color: 'bg-yellow-500/20 border-yellow-500 text-yellow-400', bg: 'bg-yellow-500' },
  merged: { label: 'Birleşik', color: 'bg-purple-500/20 border-purple-500 text-purple-400', bg: 'bg-purple-500' }
};

// Ödeme yöntemleri
const PAYMENT_METHODS = [
  { id: 'cash', label: 'Nakit', icon: Banknote, color: 'bg-green-600 hover:bg-green-700' },
  { id: 'card', label: 'Kredi Kartı', icon: CreditCard, color: 'bg-blue-600 hover:bg-blue-700' },
  { id: 'sodexo', label: 'Sodexo', icon: QrCode, color: 'bg-red-600 hover:bg-red-700' },
  { id: 'multinet', label: 'Multinet', icon: QrCode, color: 'bg-amber-600 hover:bg-amber-700' },
  { id: 'setcard', label: 'Setcard', icon: QrCode, color: 'bg-cyan-600 hover:bg-cyan-700' },
];

// Platform Online Ödemeleri
const PLATFORM_PAYMENTS = [
  { id: 'yemeksepeti_online', label: 'Yemeksepeti Online', icon: Smartphone, color: 'bg-pink-600 hover:bg-pink-700' },
  { id: 'getir_online', label: 'Getir Online', icon: Smartphone, color: 'bg-purple-600 hover:bg-purple-700' },
  { id: 'trendyol_online', label: 'Trendyol Online', icon: Smartphone, color: 'bg-orange-600 hover:bg-orange-700' },
  { id: 'migros_online', label: 'Migros Online', icon: Smartphone, color: 'bg-green-700 hover:bg-green-800' },
];

export default function POSMain() {
  // State
  const [sections, setSections] = useState([]);
  const [tables, setTables] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('tables'); // tables, order, kitchen, reports
  const [orderSource, setOrderSource] = useState('table'); // table, takeaway, delivery
  
  // Delivery orders state
  const [deliveryOrders, setDeliveryOrders] = useState([]);
  const [showDeliveryPanel, setShowDeliveryPanel] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef(null);
  const prevDeliveryCountRef = useRef(0);
  
  // Drag-drop state
  const [editMode, setEditMode] = useState(false);
  const [draggingTable, setDraggingTable] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // WebSocket state
  const [wsConnected, setWsConnected] = useState(false);
  const [newOrderAlert, setNewOrderAlert] = useState(null);
  const wsRef = useRef(null);
  
  // Dialogs
  const [showPayment, setShowPayment] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);
  const [showSplitBill, setShowSplitBill] = useState(false);
  const [showItemNote, setShowItemNote] = useState(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showIkram, setShowIkram] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showMerge, setShowMerge] = useState(false);
  const [selectedMergeTables, setSelectedMergeTables] = useState([]);
  
  // POS Settings
  const [posSettings, setPosSettings] = useState({
    soundEnabled: true,
    autoAcceptOrders: false,
    defaultPrepTime: 30,
    printerEnabled: false,
    printerIP: '192.168.1.100',
    printerPort: 9100,
    showDeliveryPanel: true,
    autoRefreshInterval: 15
  });
  
  // Payment state
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [tipAmount, setTipAmount] = useState(0);
  const [discountType, setDiscountType] = useState('percent');
  const [discountValue, setDiscountValue] = useState(0);
  const [splitCount, setSplitCount] = useState(2);

  const searchRef = useRef(null);
  const mapContainerRef = useRef(null);

  // Token
  const getToken = () => localStorage.getItem('kasaburger_token') || localStorage.getItem('dealer_token');

  // Veri yükleme
  const loadData = useCallback(async () => {
    try {
      const token = getToken();
      const headers = { Authorization: `Bearer ${token}` };

      // Paralel istekler
      const [sectionsRes, tablesRes, productsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/pos/sections`, { headers }),
        fetch(`${BACKEND_URL}/api/pos/tables`, { headers }),
        fetch(`${BACKEND_URL}/api/kiosk/products`, { headers })
      ]);

      if (sectionsRes.ok) {
        const sectionsData = await sectionsRes.json();
        setSections(sectionsData);
        if (!selectedSection && sectionsData.length > 0) {
          setSelectedSection(sectionsData[0].id);
        }
      }

      if (tablesRes.ok) {
        const tablesData = await tablesRes.json();
        setTables(tablesData);
      }

      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData.filter(p => p.available !== false));
        const cats = [...new Set(productsData.map(p => p.category).filter(Boolean))];
        setCategories(cats);
      }

      setLoading(false);
    } catch (error) {
      console.error('Load error:', error);
      setLoading(false);
    }
  }, [selectedSection]);

  useEffect(() => {
    loadData();
    loadDeliveryOrders();
    const interval = setInterval(loadData, 30000);
    const deliveryInterval = setInterval(loadDeliveryOrders, 15000); // Delivery siparişlerini 15 saniyede bir kontrol et
    return () => {
      clearInterval(interval);
      clearInterval(deliveryInterval);
    };
  }, [loadData]);

  // Delivery siparişlerini yükle
  const loadDeliveryOrders = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${BACKEND_URL}/api/delivery/orders/live`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        
        // Yeni sipariş geldi mi kontrol et
        const newOrders = data.filter(o => o.status === 'new');
        if (newOrders.length > prevDeliveryCountRef.current) {
          // Sesli bildirim
          if (soundEnabled) {
            playNotificationSound();
          }
          toast.success(`🚀 ${newOrders.length - prevDeliveryCountRef.current} yeni teslimat siparişi!`, { duration: 5000 });
        }
        prevDeliveryCountRef.current = newOrders.length;
        
        setDeliveryOrders(data);
      }
    } catch (error) {
      console.error('Delivery orders load error:', error);
    }
  };

  // Sesli bildirim çal
  const playNotificationSound = () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.volume = 0.7;
      audio.play().catch(() => {});
    } catch (e) {
      console.log('Audio play error:', e);
    }
  };

  // Delivery siparişini POS'a al
  const acceptDeliveryOrder = async (order) => {
    try {
      const token = getToken();
      const response = await fetch(`${BACKEND_URL}/api/delivery/orders/${order.id}/accept`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ prep_time: 30 })
      });
      
      if (response.ok) {
        toast.success('Sipariş kabul edildi!');
        loadDeliveryOrders();
        
        // Siparişi POS'a aktar
        const items = (order.items || []).map(item => ({
          product_id: item.product_id || item.id,
          product_name: item.name || item.product_name,
          price: item.price || item.unit_price || 0,
          quantity: item.quantity || 1,
          note: item.note || '',
          portion: 'tam',
          is_ikram: false
        }));
        
        setCurrentOrder({
          items,
          notes: `${order.platform?.toUpperCase()} - ${order.customer_name || 'Müşteri'} - ${order.customer_phone || ''}\n${order.customer_address || ''}`,
          table_id: null,
          source: 'delivery',
          platform: order.platform,
          external_id: order.external_id,
          discount_type: null,
          discount_value: 0
        });
        setOrderSource('delivery');
        setActiveView('order');
      } else {
        toast.error('Sipariş kabul edilemedi');
      }
    } catch (error) {
      console.error('Accept error:', error);
      toast.error('İşlem başarısız');
    }
  };

  // Delivery siparişini reddet
  const rejectDeliveryOrder = async (order, reason = 'Yoğunluk') => {
    try {
      const token = getToken();
      const response = await fetch(`${BACKEND_URL}/api/delivery/orders/${order.id}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });
      
      if (response.ok) {
        toast.success('Sipariş reddedildi');
        loadDeliveryOrders();
      }
    } catch (error) {
      console.error('Reject error:', error);
      toast.error('İşlem başarısız');
    }
  };

  // Delivery siparişini hazır işaretle
  const markDeliveryReady = async (order) => {
    try {
      const token = getToken();
      await fetch(`${BACKEND_URL}/api/delivery/orders/${order.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'ready' })
      });
      toast.success('Sipariş hazır!');
      loadDeliveryOrders();
    } catch (error) {
      console.error('Status update error:', error);
    }
  };

  // WebSocket bağlantısı (geliştirilmiş reconnection)
  useEffect(() => {
    if (!WS_URL) {
      console.warn('WebSocket URL oluşturulamadı');
      return;
    }
    
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 10;
    const reconnectInterval = 3000;
    let isManualClose = false;
    
    const connectWebSocket = () => {
      try {
        const wsUrl = `${WS_URL}/ws/kitchen`;
        console.log('WebSocket bağlanıyor:', wsUrl);
        const ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          console.log('WebSocket bağlandı');
          setWsConnected(true);
          reconnectAttempts = 0; // Başarılı bağlantıda sıfırla
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'order_update') {
              // Yeni sipariş bildirimi
              if (data.action === 'new_order') {
                setNewOrderAlert(data);
                // Ses çal
                if (soundEnabled) {
                  playNotificationSound();
                }
                toast.info('🔔 Yeni sipariş geldi!', { duration: 5000 });
                loadData(); // Verileri yenile
              } else if (data.action === 'status_change') {
                loadData();
              }
            }
          } catch (e) {
            console.error('WS message parse error:', e);
          }
        };
        
        ws.onclose = (event) => {
          setWsConnected(false);
          
          if (isManualClose) {
            console.log('WebSocket manuel olarak kapatıldı');
            return;
          }
          
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            console.log(`WebSocket kapandı, yeniden bağlanıyor... (Deneme ${reconnectAttempts}/${maxReconnectAttempts})`);
            setTimeout(connectWebSocket, reconnectInterval);
          } else {
            console.error('WebSocket maksimum yeniden bağlanma denemesine ulaştı');
          }
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };
        
        wsRef.current = ws;
      } catch (error) {
        console.error('WebSocket bağlantı hatası:', error);
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          setTimeout(connectWebSocket, reconnectInterval);
        }
      }
    };
    
    connectWebSocket();
    
    return () => {
      isManualClose = true;
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, [loadData, soundEnabled]);

  // Drag-drop fonksiyonları
  const handleDragStart = (e, table) => {
    if (!editMode) return;
    setDraggingTable(table);
    const rect = e.target.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleDragOver = (e) => {
    if (!editMode || !draggingTable) return;
    e.preventDefault();
  };

  const handleDrop = async (e) => {
    if (!editMode || !draggingTable || !mapContainerRef.current) return;
    
    const containerRect = mapContainerRef.current.getBoundingClientRect();
    const newX = Math.max(0, e.clientX - containerRect.left - dragOffset.x);
    const newY = Math.max(0, e.clientY - containerRect.top - dragOffset.y);
    
    // API'ye pozisyon güncelle
    try {
      const token = getToken();
      await fetch(`${BACKEND_URL}/api/pos/tables/${draggingTable.id}/position`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ position_x: Math.round(newX), position_y: Math.round(newY) })
      });
      
      // Local state güncelle
      setTables(prev => prev.map(t => 
        t.id === draggingTable.id 
          ? { ...t, position_x: Math.round(newX), position_y: Math.round(newY) }
          : t
      ));
      
      toast.success('Masa konumu güncellendi');
    } catch (error) {
      console.error('Position update error:', error);
      toast.error('Konum güncellenemedi');
    }
    
    setDraggingTable(null);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F1') { e.preventDefault(); setActiveView('tables'); }
      if (e.key === 'F2') { e.preventDefault(); setActiveView('kitchen'); }
      if (e.key === 'F3') { e.preventDefault(); setActiveView('reports'); }
      if (e.key === 'F5') { e.preventDefault(); loadData(); }
      if (e.key === 'Escape') {
        setShowPayment(false);
        setShowDiscount(false);
        setShowSplitBill(false);
        setShowItemNote(null);
      }
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loadData]);

  // Masa seçimi
  const handleTableSelect = async (table) => {
    setSelectedTable(table);
    
    if (table.status === 'empty') {
      // Yeni sipariş başlat
      setCurrentOrder({
        items: [],
        notes: '',
        table_id: table.id,
        source: 'table',
        discount_type: null,
        discount_value: 0
      });
      setActiveView('order');
    } else if (table.current_order) {
      // Mevcut siparişi aç
      setCurrentOrder(table.current_order);
      setActiveView('order');
    } else if (table.current_order_id) {
      // Siparişi API'den al
      try {
        const token = getToken();
        const res = await fetch(`${BACKEND_URL}/api/pos/orders/${table.current_order_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const order = await res.json();
          setCurrentOrder(order);
          setActiveView('order');
        }
      } catch (error) {
        console.error('Order fetch error:', error);
      }
    }
  };

  // Sipariş kaynağı seç (Gel-Al, Paket)
  const handleSourceSelect = (source) => {
    setOrderSource(source);
    setSelectedTable(null);
    setCurrentOrder({
      items: [],
      notes: '',
      source: source,
      table_id: null,
      discount_type: null,
      discount_value: 0
    });
    setActiveView('order');
  };

  // Ürün ekle
  const addToOrder = (product) => {
    if (!currentOrder) return;
    
    setCurrentOrder(prev => {
      const existingIndex = prev.items.findIndex(
        item => item.product_id === product.id && !item.note && item.portion === 'tam'
      );
      
      if (existingIndex >= 0) {
        const newItems = [...prev.items];
        newItems[existingIndex].quantity += 1;
        return { ...prev, items: newItems };
      }
      
      return {
        ...prev,
        items: [...prev.items, {
          product_id: product.id,
          product_name: product.name,
          price: product.price || product.base_price || 0,
          quantity: 1,
          note: '',
          portion: 'tam',
          is_ikram: false
        }]
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
      const newQty = newItems[index].quantity + delta;
      if (newQty <= 0) {
        return { ...prev, items: newItems.filter((_, i) => i !== index) };
      }
      newItems[index].quantity = newQty;
      return { ...prev, items: newItems };
    });
  };

  // Ürün notu ekle
  const addItemNote = (index, note) => {
    setCurrentOrder(prev => {
      const newItems = [...prev.items];
      newItems[index].note = note;
      return { ...prev, items: newItems };
    });
    setShowItemNote(null);
  };

  // İkram yap
  const markAsIkram = async (index, reason) => {
    setCurrentOrder(prev => {
      const newItems = [...prev.items];
      newItems[index].is_ikram = true;
      newItems[index].ikram_reason = reason;
      newItems[index].original_price = newItems[index].price;
      newItems[index].price = 0;
      return { ...prev, items: newItems };
    });
    setShowIkram(null);
    toast.success('Ürün ikram olarak işaretlendi');
  };

  // Toplam hesapla
  const calculateSubtotal = () => {
    if (!currentOrder?.items) return 0;
    return currentOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateDiscount = () => {
    const subtotal = calculateSubtotal();
    if (currentOrder?.discount_type === 'percent') {
      return subtotal * (currentOrder.discount_value / 100);
    }
    if (currentOrder?.discount_type === 'fixed') {
      return currentOrder.discount_value;
    }
    return 0;
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount();
  };

  // İndirim uygula
  const applyDiscount = () => {
    setCurrentOrder(prev => ({
      ...prev,
      discount_type: discountType,
      discount_value: discountValue
    }));
    setShowDiscount(false);
    toast.success('İndirim uygulandı');
  };

  // Masa Birleştir
  const handleMergeTables = async () => {
    if (selectedMergeTables.length < 2) {
      toast.error('En az 2 masa seçin');
      return;
    }

    try {
      const token = getToken();
      const mainTable = selectedMergeTables[0];
      const otherTables = selectedMergeTables.slice(1);

      const response = await fetch(`${BACKEND_URL}/api/pos/tables/merge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          main_table_id: mainTable.id,
          merge_table_ids: otherTables.map(t => t.id)
        })
      });

      if (response.ok) {
        toast.success(`${selectedMergeTables.length} masa birleştirildi`);
        loadData();
        setShowMerge(false);
        setSelectedMergeTables([]);
      } else {
        toast.error('Birleştirme başarısız');
      }
    } catch (error) {
      console.error('Merge error:', error);
      toast.error('İşlem başarısız');
    }
  };

  // Masa Ayır
  const handleSplitTable = async (tableId) => {
    try {
      const token = getToken();
      const response = await fetch(`${BACKEND_URL}/api/pos/tables/${tableId}/split`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success('Masa ayrıldı');
        loadData();
      } else {
        toast.error('Ayırma başarısız');
      }
    } catch (error) {
      console.error('Split error:', error);
      toast.error('İşlem başarısız');
    }
  };

  // Toggle masa seçimi (birleştirme için)
  const toggleTableForMerge = (table) => {
    if (selectedMergeTables.find(t => t.id === table.id)) {
      setSelectedMergeTables(prev => prev.filter(t => t.id !== table.id));
    } else {
      setSelectedMergeTables(prev => [...prev, table]);
    }
  };

  // Siparişi gönder
  const sendOrder = async () => {
    if (!currentOrder?.items?.length) {
      toast.error('Sipariş boş!');
      return;
    }

    try {
      const token = getToken();
      const orderData = {
        table_id: currentOrder.table_id,
        source: currentOrder.source || orderSource,
        items: currentOrder.items,
        notes: currentOrder.notes || '',
        discount_type: currentOrder.discount_type,
        discount_value: currentOrder.discount_value || 0
      };

      const url = currentOrder.id 
        ? `${BACKEND_URL}/api/pos/orders/${currentOrder.id}`
        : `${BACKEND_URL}/api/pos/orders`;
      
      const method = currentOrder.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Sipariş mutfağa gönderildi!');
        
        // Order ID'yi kaydet
        if (result.order?.id) {
          setCurrentOrder(prev => ({ ...prev, id: result.order.id, order_number: result.order.order_number }));
          
          // WebSocket ile mutfağa bildir
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: 'new_order',
              order_id: result.order.id,
              order_number: result.order.order_number
            }));
          }
        }
        
        // Masaları yenile
        loadData();
      } else {
        throw new Error('Sipariş gönderilemedi');
      }
    } catch (error) {
      console.error('Order error:', error);
      toast.error('Sipariş gönderilemedi!');
    }
  };

  // Ödeme al
  const handlePayment = async (method) => {
    if (!currentOrder?.id && !currentOrder?.items?.length) {
      toast.error('Önce siparişi kaydedin!');
      return;
    }

    try {
      const token = getToken();
      let orderId = currentOrder.id;

      // Sipariş yoksa önce oluştur
      if (!orderId) {
        const orderRes = await fetch(`${BACKEND_URL}/api/pos/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            table_id: currentOrder.table_id,
            source: currentOrder.source || orderSource,
            items: currentOrder.items,
            notes: currentOrder.notes || '',
            discount_type: currentOrder.discount_type,
            discount_value: currentOrder.discount_value || 0
          })
        });

        if (!orderRes.ok) throw new Error('Sipariş kaydedilemedi');
        const orderResult = await orderRes.json();
        orderId = orderResult.order?.id;
      }

      // Ödemeyi kaydet
      const paymentRes = await fetch(`${BACKEND_URL}/api/pos/orders/${orderId}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          method: method,
          amount: calculateTotal(),
          tip: tipAmount
        })
      });

      if (paymentRes.ok) {
        const methodLabels = {
          cash: 'Nakit', card: 'Kredi Kartı', online: 'Online',
          sodexo: 'Sodexo', multinet: 'Multinet', setcard: 'Setcard'
        };
        toast.success(`${methodLabels[method]} ödeme alındı! ₺${calculateTotal().toFixed(2)}`);
        
        setShowPayment(false);
        setCurrentOrder(null);
        setSelectedTable(null);
        setTipAmount(0);
        setActiveView('tables');
        loadData();
      } else {
        throw new Error('Ödeme kaydedilemedi');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Ödeme işlemi başarısız!');
    }
  };

  // Hesap böl
  const handleSplitBill = async () => {
    if (splitCount < 2) {
      toast.error('En az 2 kişiye bölünmeli');
      return;
    }

    const perPerson = calculateTotal() / splitCount;
    toast.success(`Kişi başı: ₺${perPerson.toFixed(2)}`);
    setShowSplitBill(false);
  };

  // Masa transferi
  const handleTransfer = async (targetTableId) => {
    if (!selectedTable) return;

    try {
      const token = getToken();
      const response = await fetch(
        `${BACKEND_URL}/api/pos/tables/${selectedTable.id}/transfer/${targetTableId}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.ok) {
        toast.success('Sipariş aktarıldı!');
        setShowTransfer(false);
        setCurrentOrder(null);
        setSelectedTable(null);
        setActiveView('tables');
        loadData();
      }
    } catch (error) {
      toast.error('Transfer başarısız!');
    }
  };

  // Filtrelenmiş ürünler
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Seçili bölgedeki masalar
  const sectionTables = tables.filter(t => t.section_id === selectedSection);

  // Para formatı
  const formatCurrency = (amount) => `₺${(amount || 0).toFixed(2)}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto"></div>
          <p className="text-zinc-400 mt-4">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-zinc-950 text-white flex flex-col overflow-hidden">
      {/* Top Bar */}
      <header className="h-14 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="h-6 w-6 text-orange-500" />
            <span className="font-bold text-lg">KBYS Adisyon</span>
          </div>
          
          {/* View Tabs */}
          <div className="flex bg-zinc-800 rounded-lg p-1 ml-4">
            <button
              onClick={() => setActiveView('tables')}
              className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                activeView === 'tables' ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span className="hidden sm:inline">Masalar</span>
              <Home className="h-4 w-4 sm:hidden" />
            </button>
            <button
              onClick={() => setActiveView('kitchen')}
              className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                activeView === 'kitchen' ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span className="hidden sm:inline">Mutfak</span>
              <ChefHat className="h-4 w-4 sm:hidden" />
            </button>
            <button
              onClick={() => setActiveView('reports')}
              className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                activeView === 'reports' ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span className="hidden sm:inline">Raporlar</span>
              <TrendingUp className="h-4 w-4 sm:hidden" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* WebSocket Status */}
          <div className={`flex items-center gap-1 text-xs ${wsConnected ? 'text-green-400' : 'text-red-400'}`}>
            <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
            {wsConnected ? 'Canlı' : 'Bağlantı Yok'}
          </div>
          
          {/* Sound Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={soundEnabled ? 'text-green-400' : 'text-zinc-500'}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
          </Button>
          
          {/* Delivery Panel Toggle */}
          {activeView === 'tables' && (
            <Button
              variant={showDeliveryPanel ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowDeliveryPanel(!showDeliveryPanel)}
              className={showDeliveryPanel ? 'bg-pink-600 hover:bg-pink-700' : ''}
            >
              <Bike className="h-4 w-4 mr-1" />
              Teslimat
              {deliveryOrders.filter(o => o.status === 'new').length > 0 && (
                <Badge className="ml-1 bg-red-500 text-white animate-pulse">
                  {deliveryOrders.filter(o => o.status === 'new').length}
                </Badge>
              )}
            </Button>
          )}
          
          {/* Edit Mode Toggle */}
          {activeView === 'tables' && (
            <Button
              variant={editMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => setEditMode(!editMode)}
              className={editMode ? 'bg-purple-600 hover:bg-purple-700' : ''}
            >
              <Edit3 className="h-4 w-4 mr-1" />
              {editMode ? 'Düzenleme Açık' : 'Masaları Düzenle'}
            </Button>
          )}

          {/* Merge Tables Toggle */}
          {activeView === 'tables' && (
            <Button
              variant={showMerge ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setShowMerge(!showMerge);
                setSelectedMergeTables([]);
              }}
              className={showMerge ? 'bg-cyan-600 hover:bg-cyan-700' : ''}
            >
              <Merge className="h-4 w-4 mr-1" />
              {showMerge ? `Birleştir (${selectedMergeTables.length})` : 'Masa Birleştir'}
            </Button>
          )}
          
          {/* Quick Actions */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSourceSelect('takeaway')}
            className="border-green-600 text-green-400 hover:bg-green-600/20"
          >
            <ShoppingBag className="h-4 w-4 mr-2" />
            Gel-Al
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSourceSelect('delivery')}
            className="border-blue-600 text-blue-400 hover:bg-blue-600/20"
          >
            <Bike className="h-4 w-4 mr-2" />
            Paket
          </Button>
          
          {/* Barcode Scanner */}
          <BarcodeScanButton 
            onScan={(code) => {
              // Barkodla ürün ara ve sepete ekle
              const product = products.find(p => p.barcode === code || p.sku === code);
              if (product) {
                addToOrder(product);
                toast.success(`${product.name} eklendi`);
              } else {
                toast.error(`Ürün bulunamadı: ${code}`);
              }
            }}
            className="text-orange-400"
          />
          
          {/* Push Notifications */}
          <PushNotificationToggle />
          
          <Button variant="ghost" size="icon" onClick={loadData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Tables View */}
        {activeView === 'tables' && (
          <div className="flex-1 flex">
            {/* Section Tabs */}
            <div className="w-16 bg-zinc-900 border-r border-zinc-800 flex flex-col py-2">
              {sections.map(section => (
                <button
                  key={section.id}
                  onClick={() => setSelectedSection(section.id)}
                  className={`py-3 px-2 text-xs font-medium text-center transition-colors border-l-2 ${
                    selectedSection === section.id
                      ? 'border-orange-500 bg-zinc-800 text-white'
                      : 'border-transparent text-zinc-500 hover:text-white hover:bg-zinc-800'
                  }`}
                  style={{ borderLeftColor: selectedSection === section.id ? section.color : 'transparent' }}
                >
                  <div className="w-2 h-2 rounded-full mx-auto mb-1" style={{ backgroundColor: section.color }}></div>
                  {section.name?.split(' ')[0]}
                </button>
              ))}
            </div>

            {/* Tables Map - Drag & Drop */}
            <div 
              ref={mapContainerRef}
              className={`flex-1 p-4 overflow-auto relative ${showDeliveryPanel ? '' : ''}`}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {editMode ? (
                /* Edit Mode - Free positioning */
                <div className="relative min-h-[600px] bg-zinc-900/50 rounded-xl border-2 border-dashed border-zinc-700">
                  <div className="absolute top-2 left-2 text-xs text-zinc-500 flex items-center gap-2">
                    <GripVertical className="h-4 w-4" />
                    Masaları sürükleyerek konumlandırın
                  </div>
                  {sectionTables.map(table => {
                    const status = TABLE_STATUS[table.status] || TABLE_STATUS.empty;
                    return (
                      <div
                        key={table.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, table)}
                        style={{
                          position: 'absolute',
                          left: table.position_x || 0,
                          top: (table.position_y || 0) + 30,
                          cursor: 'move'
                        }}
                        className={`w-24 h-24 rounded-xl border-2 p-2 flex flex-col items-center justify-center transition-all ${status.color} ${
                          draggingTable?.id === table.id ? 'opacity-50 scale-95' : 'hover:scale-105'
                        }`}
                      >
                        <GripVertical className="h-3 w-3 absolute top-1 right-1 text-zinc-500" />
                        <span className="text-xl font-bold">{table.name?.replace('Masa ', '') || '?'}</span>
                        <span className="text-xs opacity-70">{table.capacity} kişi</span>
                      </div>
                    );
                  })}
                </div>
              ) : showMerge ? (
                /* Merge Mode - Select tables to merge */
                <div className="space-y-4">
                  <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3 text-center">
                    <p className="text-cyan-400 text-sm">
                      Birleştirmek istediğiniz masaları seçin. İlk seçilen ana masa olur.
                    </p>
                    {selectedMergeTables.length >= 2 && (
                      <Button
                        size="sm"
                        className="mt-2 bg-cyan-600 hover:bg-cyan-700"
                        onClick={handleMergeTables}
                      >
                        <Merge className="h-4 w-4 mr-1" />
                        {selectedMergeTables.length} Masayı Birleştir
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                    {sectionTables.map(table => {
                      const status = TABLE_STATUS[table.status] || TABLE_STATUS.empty;
                      const isSelected = selectedMergeTables.find(t => t.id === table.id);
                      const selectionIndex = selectedMergeTables.findIndex(t => t.id === table.id);
                      return (
                        <button
                          key={table.id}
                          onClick={() => toggleTableForMerge(table)}
                          className={`aspect-square rounded-xl border-2 p-3 flex flex-col items-center justify-center transition-all hover:scale-105 relative ${
                            isSelected 
                              ? 'border-cyan-500 bg-cyan-500/20 ring-2 ring-cyan-500' 
                              : status.color
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center text-xs font-bold">
                              {selectionIndex + 1}
                            </div>
                          )}
                          <span className="text-2xl font-bold">{table.name?.replace('Masa ', '') || '?'}</span>
                          <span className="text-xs opacity-70 mt-1">{table.capacity} kişi</span>
                          {table.status === 'merged' && (
                            <Badge className="mt-1 text-xs bg-purple-500">Birleşik</Badge>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Normal Mode - Grid layout */
                <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                  {sectionTables.map(table => {
                    const status = TABLE_STATUS[table.status] || TABLE_STATUS.empty;
                    return (
                      <button
                        key={table.id}
                        onClick={() => handleTableSelect(table)}
                        className={`aspect-square rounded-xl border-2 p-3 flex flex-col items-center justify-center transition-all hover:scale-105 ${status.color} relative`}
                      >
                        {/* Birleşik masa ikonu */}
                        {table.status === 'merged' && (
                          <div className="absolute top-1 right-1">
                            <Merge className="h-3 w-3 text-purple-400" />
                          </div>
                        )}
                        {/* Ayır butonu */}
                        {table.merged_tables?.length > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSplitTable(table.id);
                            }}
                            className="absolute top-1 left-1 p-1 rounded bg-red-500/80 hover:bg-red-500"
                            title="Masaları Ayır"
                          >
                            <Split className="h-3 w-3" />
                          </button>
                        )}
                        <span className="text-2xl font-bold">{table.name?.replace('Masa ', '') || '?'}</span>
                        <span className="text-xs opacity-70 mt-1">{table.capacity} kişi</span>
                        {table.current_order && (
                          <span className="text-sm font-bold mt-1 text-orange-400">
                            {formatCurrency(table.current_order.total || 0)}
                          </span>
                        )}
                        {table.merged_tables?.length > 0 && (
                          <span className="text-xs text-purple-400 mt-1">
                            +{table.merged_tables.length} masa
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Status Legend */}
              <div className="flex justify-center gap-6 mt-6 pt-4 border-t border-zinc-800">
                {Object.entries(TABLE_STATUS).slice(0, 4).map(([key, status]) => (
                  <div key={key} className="flex items-center gap-2 text-sm text-zinc-400">
                    <div className={`w-4 h-4 rounded ${status.bg}`}></div>
                    {status.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Orders Panel */}
            {showDeliveryPanel && (
              <DeliveryOrdersPanel 
                orders={deliveryOrders}
                onAccept={acceptDeliveryOrder}
                onReject={rejectDeliveryOrder}
                onReady={markDeliveryReady}
                onRefresh={loadDeliveryOrders}
              />
            )}
          </div>
        )}

        {/* Order View */}
        {activeView === 'order' && (
          <div className="flex-1 flex">
            {/* Products Panel */}
            <div className="flex-1 flex flex-col bg-zinc-900">
              {/* Search & Categories */}
              <div className="p-3 border-b border-zinc-800">
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <Input
                    ref={searchRef}
                    placeholder="Ürün ara... (Ctrl+F)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-zinc-800 border-zinc-700"
                  />
                </div>
                <ScrollArea className="w-full" orientation="horizontal">
                  <div className="flex gap-2 pb-2">
                    <Button
                      variant={selectedCategory === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory('all')}
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
                        {cat}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Products Grid */}
              <ScrollArea className="flex-1 p-3">
                <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                  {filteredProducts.map(product => (
                    <button
                      key={product.id}
                      onClick={() => addToOrder(product)}
                      className="bg-zinc-800 hover:bg-zinc-700 rounded-lg overflow-hidden text-left transition-all border border-zinc-700 hover:border-orange-500 hover:scale-[1.02]"
                    >
                      {product.image ? (
                        <div className="aspect-square w-full bg-zinc-900 relative">
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          {product.is_premium && (
                            <Badge className="absolute top-1 right-1 bg-yellow-500 text-black text-xs">Premium</Badge>
                          )}
                        </div>
                      ) : (
                        <div className="aspect-square w-full bg-zinc-900 flex items-center justify-center">
                          <UtensilsCrossed className="h-8 w-8 text-zinc-600" />
                        </div>
                      )}
                      <div className="p-2">
                        <div className="text-sm font-medium truncate">{product.name}</div>
                        <div className="text-orange-400 font-bold text-lg">
                          {formatCurrency(product.price || product.base_price)}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Order Panel */}
            <div className="w-96 bg-zinc-950 border-l border-zinc-800 flex flex-col">
              {/* Order Header */}
              <div className="p-4 border-b border-zinc-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-lg">
                      {selectedTable ? `Masa ${selectedTable.name?.replace('Masa ', '')}` : 
                       orderSource === 'takeaway' ? 'Gel-Al Sipariş' : 'Paket Sipariş'}
                    </h2>
                    {currentOrder?.order_number && (
                      <p className="text-sm text-zinc-500">{currentOrder.order_number}</p>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => {
                    setActiveView('tables');
                    setCurrentOrder(null);
                    setSelectedTable(null);
                  }}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Order Items */}
              <ScrollArea className="flex-1">
                <div className="p-3 space-y-2">
                  {currentOrder?.items?.map((item, index) => (
                    <div
                      key={index}
                      className={`bg-zinc-900 rounded-lg p-3 border ${
                        item.is_ikram ? 'border-purple-500/50 bg-purple-500/10' : 'border-zinc-800'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium flex items-center gap-2">
                            {item.product_name}
                            {item.is_ikram && <Badge className="bg-purple-500 text-xs">İkram</Badge>}
                          </div>
                          {item.note && (
                            <p className="text-xs text-orange-400 mt-1">📝 {item.note}</p>
                          )}
                          <div className="text-sm text-zinc-400 mt-1">
                            {formatCurrency(item.price)} x {item.quantity}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-orange-400">
                            {formatCurrency(item.price * item.quantity)}
                          </div>
                        </div>
                      </div>
                      
                      {/* Item Actions */}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(index, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(index, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-zinc-400 hover:text-white"
                            onClick={() => setShowItemNote(index)}
                          >
                            <MessageSquare className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-purple-400 hover:text-purple-300"
                            onClick={() => setShowIkram(index)}
                            disabled={item.is_ikram}
                          >
                            <Gift className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-400 hover:text-red-300"
                            onClick={() => removeFromOrder(index)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {(!currentOrder?.items || currentOrder.items.length === 0) && (
                    <div className="text-center py-12 text-zinc-500">
                      <UtensilsCrossed className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>Sipariş boş</p>
                      <p className="text-sm">Ürün eklemek için soldan seçin</p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Order Footer */}
              <div className="border-t border-zinc-800 p-4 space-y-3">
                {/* Totals */}
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between text-zinc-400">
                    <span>Ara Toplam</span>
                    <span>{formatCurrency(calculateSubtotal())}</span>
                  </div>
                  {calculateDiscount() > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>İndirim</span>
                      <span>-{formatCurrency(calculateDiscount())}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-zinc-700">
                    <span>Toplam</span>
                    <span className="text-orange-400">{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-4 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDiscount(true)}
                    className="text-xs"
                  >
                    <Percent className="h-3 w-3 mr-1" />
                    İndirim
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSplitBill(true)}
                    className="text-xs"
                  >
                    <Split className="h-3 w-3 mr-1" />
                    Böl
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTransfer(true)}
                    disabled={!selectedTable}
                    className="text-xs"
                  >
                    <Move className="h-3 w-3 mr-1" />
                    Aktar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    <Printer className="h-3 w-3 mr-1" />
                    Fiş
                  </Button>
                </div>

                {/* Main Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={sendOrder}
                    disabled={!currentOrder?.items?.length}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Mutfağa Gönder
                  </Button>
                  <Button
                    onClick={() => {
                      setPaymentAmount(calculateTotal());
                      setShowPayment(true);
                    }}
                    disabled={!currentOrder?.items?.length}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Ödeme Al
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Kitchen View */}
        {activeView === 'kitchen' && (
          <KitchenView />
        )}

        {/* Reports View */}
        {activeView === 'reports' && (
          <ReportsView />
        )}
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg">
          <DialogHeader>
            <DialogTitle>Ödeme Al</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center py-4 bg-zinc-800 rounded-lg">
              <p className="text-sm text-zinc-400">Toplam Tutar</p>
              <p className="text-3xl font-bold text-orange-400">{formatCurrency(calculateTotal())}</p>
            </div>
            
            <div>
              <label className="text-sm text-zinc-400">Bahşiş</label>
              <Input
                type="number"
                value={tipAmount}
                onChange={(e) => setTipAmount(parseFloat(e.target.value) || 0)}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>

            {/* Normal Ödeme Yöntemleri */}
            <div>
              <p className="text-sm text-zinc-400 mb-2">Ödeme Yöntemi</p>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map(method => {
                  const Icon = method.icon;
                  return (
                    <Button
                      key={method.id}
                      onClick={() => handlePayment(method.id)}
                      className={`h-14 ${method.color}`}
                    >
                      <Icon className="h-5 w-5 mr-2" />
                      {method.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Platform Online Ödemeleri */}
            <div>
              <p className="text-sm text-zinc-400 mb-2">Platform Online Ödemeleri</p>
              <div className="grid grid-cols-2 gap-2">
                {PLATFORM_PAYMENTS.map(method => {
                  const Icon = method.icon;
                  return (
                    <Button
                      key={method.id}
                      onClick={() => handlePayment(method.id)}
                      className={`h-14 ${method.color}`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {method.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Discount Dialog */}
      <Dialog open={showDiscount} onOpenChange={setShowDiscount}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-sm">
          <DialogHeader>
            <DialogTitle>İndirim Uygula</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={discountType === 'percent' ? 'default' : 'outline'}
                onClick={() => setDiscountType('percent')}
                className="flex-1"
              >
                % Yüzde
              </Button>
              <Button
                variant={discountType === 'fixed' ? 'default' : 'outline'}
                onClick={() => setDiscountType('fixed')}
                className="flex-1"
              >
                ₺ Tutar
              </Button>
            </div>
            <Input
              type="number"
              value={discountValue}
              onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
              placeholder={discountType === 'percent' ? 'Yüzde (%)' : 'Tutar (₺)'}
              className="bg-zinc-800 border-zinc-700"
            />
            <Button onClick={applyDiscount} className="w-full">
              Uygula
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Split Bill Dialog */}
      <Dialog open={showSplitBill} onOpenChange={setShowSplitBill}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-sm">
          <DialogHeader>
            <DialogTitle>Hesabı Böl</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-zinc-400">Toplam: {formatCurrency(calculateTotal())}</p>
            </div>
            <div className="flex items-center justify-center gap-4">
              <Button variant="outline" onClick={() => setSplitCount(Math.max(2, splitCount - 1))}>
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-2xl font-bold w-16 text-center">{splitCount}</span>
              <Button variant="outline" onClick={() => setSplitCount(splitCount + 1)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-center py-4 bg-zinc-800 rounded-lg">
              <p className="text-sm text-zinc-400">Kişi Başı</p>
              <p className="text-2xl font-bold text-orange-400">
                {formatCurrency(calculateTotal() / splitCount)}
              </p>
            </div>
            <Button onClick={handleSplitBill} className="w-full">
              Böl ve Ödeme Al
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Item Note Dialog */}
      <Dialog open={showItemNote !== null} onOpenChange={() => setShowItemNote(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-sm">
          <DialogHeader>
            <DialogTitle>Ürün Notu</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              id="item-note"
              placeholder="Örn: Soğansız, az pişmiş..."
              className="bg-zinc-800 border-zinc-700"
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowItemNote(null)} className="flex-1">
                İptal
              </Button>
              <Button
                onClick={() => {
                  const note = document.getElementById('item-note').value;
                  addItemNote(showItemNote, note);
                }}
                className="flex-1"
              >
                Kaydet
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ikram Dialog */}
      <Dialog open={showIkram !== null} onOpenChange={() => setShowIkram(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-sm">
          <DialogHeader>
            <DialogTitle>İkram Sebebi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              id="ikram-reason"
              placeholder="İkram sebebi..."
              className="bg-zinc-800 border-zinc-700"
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowIkram(null)} className="flex-1">
                İptal
              </Button>
              <Button
                onClick={() => {
                  const reason = document.getElementById('ikram-reason').value;
                  markAsIkram(showIkram, reason);
                }}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                İkram Yap
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={showTransfer} onOpenChange={setShowTransfer}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
          <DialogHeader>
            <DialogTitle>Siparişi Aktar</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-2 max-h-64 overflow-auto">
            {tables.filter(t => t.status === 'empty' && t.id !== selectedTable?.id).map(table => (
              <Button
                key={table.id}
                variant="outline"
                onClick={() => handleTransfer(table.id)}
                className="h-16"
              >
                {table.name?.replace('Masa ', '')}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* POS Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              POS Ayarları
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Ses ve Bildirimler */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                Ses ve Bildirimler
              </h3>
              <div className="space-y-2 pl-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Sipariş Sesi</span>
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`w-10 h-6 rounded-full transition-colors ${soundEnabled ? 'bg-green-500' : 'bg-zinc-700'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform mx-1 ${soundEnabled ? 'translate-x-4' : ''}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Teslimat Paneli</span>
                  <button
                    onClick={() => setShowDeliveryPanel(!showDeliveryPanel)}
                    className={`w-10 h-6 rounded-full transition-colors ${showDeliveryPanel ? 'bg-green-500' : 'bg-zinc-700'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform mx-1 ${showDeliveryPanel ? 'translate-x-4' : ''}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Yazıcı Ayarları */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <Printer className="h-4 w-4" />
                Yazıcı Ayarları
              </h3>
              <div className="space-y-3 pl-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Otomatik Fiş Yazdır</span>
                  <button
                    onClick={() => setPosSettings(p => ({ ...p, printerEnabled: !p.printerEnabled }))}
                    className={`w-10 h-6 rounded-full transition-colors ${posSettings.printerEnabled ? 'bg-green-500' : 'bg-zinc-700'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform mx-1 ${posSettings.printerEnabled ? 'translate-x-4' : ''}`} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-zinc-500">Yazıcı IP</label>
                    <Input
                      value={posSettings.printerIP}
                      onChange={(e) => setPosSettings(p => ({ ...p, printerIP: e.target.value }))}
                      placeholder="192.168.1.100"
                      className="bg-zinc-800 border-zinc-700 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500">Port</label>
                    <Input
                      type="number"
                      value={posSettings.printerPort}
                      onChange={(e) => setPosSettings(p => ({ ...p, printerPort: parseInt(e.target.value) }))}
                      placeholder="9100"
                      className="bg-zinc-800 border-zinc-700 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Teslimat Ayarları */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <Bike className="h-4 w-4" />
                Teslimat Ayarları
              </h3>
              <div className="space-y-3 pl-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Otomatik Sipariş Kabul</span>
                  <button
                    onClick={() => setPosSettings(p => ({ ...p, autoAcceptOrders: !p.autoAcceptOrders }))}
                    className={`w-10 h-6 rounded-full transition-colors ${posSettings.autoAcceptOrders ? 'bg-green-500' : 'bg-zinc-700'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform mx-1 ${posSettings.autoAcceptOrders ? 'translate-x-4' : ''}`} />
                  </button>
                </div>
                <div>
                  <label className="text-xs text-zinc-500">Varsayılan Hazırlık Süresi (dk)</label>
                  <Input
                    type="number"
                    value={posSettings.defaultPrepTime}
                    onChange={(e) => setPosSettings(p => ({ ...p, defaultPrepTime: parseInt(e.target.value) }))}
                    min="5"
                    max="120"
                    className="bg-zinc-800 border-zinc-700 text-sm w-24"
                  />
                </div>
              </div>
            </div>

            {/* Hızlı Linkler */}
            <div className="space-y-3 pt-3 border-t border-zinc-800">
              <h3 className="text-sm font-medium text-zinc-300">Hızlı Erişim</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowSettings(false);
                    window.open('/delivery-settings', '_blank');
                  }}
                  className="text-xs"
                >
                  <Smartphone className="h-3 w-3 mr-1" />
                  Platform Ayarları
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowSettings(false);
                    window.open('/dealer-portal/inpos-settings', '_blank');
                  }}
                  className="text-xs"
                >
                  <Printer className="h-3 w-3 mr-1" />
                  InPOS Ayarları
                </Button>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
              <Button variant="outline" onClick={() => setShowSettings(false)}>
                Kapat
              </Button>
              <Button
                onClick={() => {
                  toast.success('Ayarlar kaydedildi');
                  setShowSettings(false);
                }}
                className="bg-orange-500 hover:bg-orange-600"
              >
                Kaydet
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Kitchen View Component
function KitchenView() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const getToken = () => localStorage.getItem('kasaburger_token') || localStorage.getItem('dealer_token');

  const loadOrders = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${BACKEND_URL}/api/pos/kitchen`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Kitchen load error:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (orderId, status) => {
    try {
      const token = getToken();
      await fetch(`${BACKEND_URL}/api/pos/kitchen/${orderId}/${status}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(status === 'preparing' ? 'Hazırlanıyor' : status === 'ready' ? 'Hazır!' : 'Servis Edildi');
      loadOrders();
    } catch (error) {
      toast.error('İşlem başarısız');
    }
  };

  const statusColors = {
    pending: 'border-yellow-500 bg-yellow-500/10',
    preparing: 'border-orange-500 bg-orange-500/10',
    ready: 'border-green-500 bg-green-500/10'
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center">Yükleniyor...</div>;
  }

  return (
    <div className="flex-1 p-4 overflow-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orders.map(order => (
          <Card key={order.id} className={`bg-zinc-900 border-2 ${statusColors[order.status]}`}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="font-bold text-lg">{order.order_number}</span>
                  {order.table_id && (
                    <Badge className="ml-2 bg-zinc-700">Masa</Badge>
                  )}
                </div>
                <Badge className={
                  order.status === 'pending' ? 'bg-yellow-500' :
                  order.status === 'preparing' ? 'bg-orange-500' : 'bg-green-500'
                }>
                  {order.status === 'pending' ? 'Bekliyor' :
                   order.status === 'preparing' ? 'Hazırlanıyor' : 'Hazır'}
                </Badge>
              </div>
              
              <div className="space-y-2 mb-4">
                {order.items?.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>
                      <span className="font-medium">{item.quantity}x</span> {item.product_name}
                      {item.note && <span className="text-orange-400 text-xs ml-1">({item.note})</span>}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                {order.status === 'pending' && (
                  <Button
                    onClick={() => updateStatus(order.id, 'preparing')}
                    className="flex-1 bg-orange-600 hover:bg-orange-700"
                    size="sm"
                  >
                    Hazırla
                  </Button>
                )}
                {order.status === 'preparing' && (
                  <Button
                    onClick={() => updateStatus(order.id, 'ready')}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    size="sm"
                  >
                    Hazır
                  </Button>
                )}
                {order.status === 'ready' && (
                  <Button
                    onClick={() => updateStatus(order.id, 'served')}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    size="sm"
                  >
                    Servis Edildi
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}

        {orders.length === 0 && (
          <div className="col-span-full text-center py-12 text-zinc-500">
            <ChefHat className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg">Bekleyen sipariş yok</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Reports View Component
function ReportsView() {
  const [summary, setSummary] = useState(null);
  const [range, setRange] = useState('today');
  const [loading, setLoading] = useState(true);

  const getToken = () => localStorage.getItem('kasaburger_token') || localStorage.getItem('dealer_token');

  const loadSummary = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${BACKEND_URL}/api/pos/reports/summary?range=${range}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (error) {
      console.error('Reports load error:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSummary();
  }, [range]);

  const formatCurrency = (amount) => `₺${(amount || 0).toFixed(2)}`;

  if (loading) {
    return <div className="flex-1 flex items-center justify-center">Yükleniyor...</div>;
  }

  return (
    <div className="flex-1 p-6 overflow-auto">
      {/* Range Selector */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Satış Raporları</h2>
        <div className="flex gap-2">
          {[
            { id: 'today', label: 'Bugün' },
            { id: 'week', label: 'Hafta' },
            { id: 'month', label: 'Ay' }
          ].map(r => (
            <Button
              key={r.id}
              variant={range === r.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRange(r.id)}
            >
              {r.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-zinc-900 border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Toplam Satış</p>
              <p className="text-2xl font-bold text-green-400">{formatCurrency(summary?.totalSales)}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Receipt className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Sipariş Sayısı</p>
              <p className="text-2xl font-bold text-blue-400">{summary?.totalOrders || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-500/20 rounded-lg">
              <TrendingUp className="h-6 w-6 text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Ortalama Adisyon</p>
              <p className="text-2xl font-bold text-orange-400">{formatCurrency(summary?.averageOrder)}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Gift className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Bahşişler</p>
              <p className="text-2xl font-bold text-purple-400">{formatCurrency(summary?.tips)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Payment Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-zinc-900 border-zinc-800 p-4">
          <h3 className="font-bold mb-4">Ödeme Yöntemleri</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Nakit</span>
              <span className="font-bold text-green-400">{formatCurrency(summary?.cashSales)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Kredi Kartı</span>
              <span className="font-bold text-blue-400">{formatCurrency(summary?.cardSales)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Online Ödeme</span>
              <span className="font-bold text-purple-400">{formatCurrency(summary?.onlineSales)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Yemek Kartı</span>
              <span className="font-bold text-amber-400">{formatCurrency(summary?.mealCardSales)}</span>
            </div>
          </div>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 p-4">
          <h3 className="font-bold mb-4">Sipariş Kaynakları</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Masa</span>
              <span className="font-bold">{summary?.tableOrders || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Gel-Al</span>
              <span className="font-bold">{summary?.takeawayOrders || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Paket</span>
              <span className="font-bold">{summary?.deliveryOrders || 0}</span>
            </div>
            <div className="flex justify-between items-center border-t border-zinc-700 pt-3 mt-3">
              <span className="text-zinc-400">İndirimler</span>
              <span className="font-bold text-red-400">-{formatCurrency(summary?.discounts)}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// Delivery Orders Panel Component
function DeliveryOrdersPanel({ orders, onAccept, onReject, onReady, onRefresh }) {
  const PLATFORM_CONFIG = {
    yemeksepeti: { name: 'Yemeksepeti', color: 'bg-pink-500', textColor: 'text-pink-400', logo: '🍽️' },
    getir: { name: 'Getir', color: 'bg-purple-500', textColor: 'text-purple-400', logo: '🛵' },
    trendyol: { name: 'Trendyol', color: 'bg-orange-500', textColor: 'text-orange-400', logo: '🛒' },
    migros: { name: 'Migros', color: 'bg-orange-600', textColor: 'text-orange-300', logo: '🏪' }
  };

  const STATUS_CONFIG = {
    new: { label: 'YENİ', color: 'bg-blue-500', pulse: true },
    accepted: { label: 'ONAYLANDI', color: 'bg-green-500', pulse: false },
    preparing: { label: 'HAZIRLANIYOR', color: 'bg-yellow-500', pulse: false },
    ready: { label: 'HAZIR', color: 'bg-purple-500', pulse: false }
  };

  const formatCurrency = (amount) => `₺${(amount || 0).toFixed(2)}`;
  const newOrders = orders.filter(o => o.status === 'new');
  const activeOrders = orders.filter(o => ['accepted', 'preparing'].includes(o.status));
  const readyOrders = orders.filter(o => o.status === 'ready');

  return (
    <div className="w-80 bg-zinc-900 border-l border-zinc-800 flex flex-col" data-testid="delivery-orders-panel">
      {/* Header */}
      <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bike className="h-5 w-5 text-pink-400" />
          <span className="font-bold">Teslimat Siparişleri</span>
          {newOrders.length > 0 && (
            <Badge className="bg-red-500 animate-pulse">{newOrders.length}</Badge>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Orders List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {/* New Orders Section */}
          {newOrders.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-blue-400 px-2 mb-2 flex items-center gap-1">
                <Bell className="h-3 w-3" />
                YENİ SİPARİŞLER ({newOrders.length})
              </p>
              {newOrders.map(order => {
                const platform = PLATFORM_CONFIG[order.platform] || PLATFORM_CONFIG.yemeksepeti;
                return (
                  <div
                    key={order.id}
                    className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-2 animate-pulse"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span>{platform.logo}</span>
                        <span className={`text-sm font-bold ${platform.textColor}`}>{platform.name}</span>
                      </div>
                      <Badge className="bg-blue-500">YENİ</Badge>
                    </div>
                    
                    <div className="text-sm mb-2">
                      <p className="font-medium">{order.customer_name || 'Müşteri'}</p>
                      <p className="text-xs text-zinc-400 truncate">{order.customer_address}</p>
                    </div>
                    
                    <div className="text-xs text-zinc-400 mb-2">
                      {(order.items || []).slice(0, 2).map((item, i) => (
                        <span key={i}>{item.quantity || 1}x {item.name || item.product_name}{i < 1 && order.items?.length > 1 ? ', ' : ''}</span>
                      ))}
                      {(order.items?.length || 0) > 2 && <span> +{order.items.length - 2}</span>}
                    </div>
                    
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-lg text-orange-400">
                        {formatCurrency(order.total)}
                      </span>
                      <span className="text-xs text-zinc-500">{order.payment_method === 'online' ? '💳 Online Ödendi' : '💵 Kapıda'}</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => onAccept(order)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Kabul
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onReject(order)}
                        className="text-red-400 border-red-500/30 hover:bg-red-500/20"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Active Orders Section */}
          {activeOrders.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-yellow-400 px-2 mb-2 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                HAZIRLANIYOR ({activeOrders.length})
              </p>
              {activeOrders.map(order => {
                const platform = PLATFORM_CONFIG[order.platform] || PLATFORM_CONFIG.yemeksepeti;
                const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.accepted;
                return (
                  <div
                    key={order.id}
                    className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-2"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span>{platform.logo}</span>
                        <span className="text-xs text-zinc-400">{order.order_number}</span>
                      </div>
                      <Badge className={status.color}>{status.label}</Badge>
                    </div>
                    
                    <p className="text-sm font-medium mb-1">{order.customer_name}</p>
                    <p className="text-sm font-bold text-orange-400 mb-2">{formatCurrency(order.total)}</p>
                    
                    <Button
                      size="sm"
                      onClick={() => onReady(order)}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      <Package className="h-4 w-4 mr-1" />
                      Hazır
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Ready Orders Section */}
          {readyOrders.length > 0 && (
            <div>
              <p className="text-xs font-medium text-purple-400 px-2 mb-2 flex items-center gap-1">
                <Package className="h-3 w-3" />
                TESLİMAT BEKLİYOR ({readyOrders.length})
              </p>
              {readyOrders.map(order => {
                const platform = PLATFORM_CONFIG[order.platform] || PLATFORM_CONFIG.yemeksepeti;
                return (
                  <div
                    key={order.id}
                    className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 mb-2"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span>{platform.logo} {order.order_number}</span>
                      <Badge className="bg-purple-500">HAZIR</Badge>
                    </div>
                    <p className="text-sm">{order.customer_name}</p>
                    <p className="text-xs text-zinc-400">{order.customer_phone}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {orders.length === 0 && (
            <div className="text-center py-8 text-zinc-500">
              <Bike className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Bekleyen sipariş yok</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer Stats */}
      <div className="p-3 border-t border-zinc-800 grid grid-cols-3 gap-2 text-center text-xs">
        <div>
          <p className="text-zinc-400">Yeni</p>
          <p className="font-bold text-blue-400">{newOrders.length}</p>
        </div>
        <div>
          <p className="text-zinc-400">Hazır.</p>
          <p className="font-bold text-yellow-400">{activeOrders.length}</p>
        </div>
        <div>
          <p className="text-zinc-400">Bekliyor</p>
          <p className="font-bold text-purple-400">{readyOrders.length}</p>
        </div>
      </div>
    </div>
  );
}

