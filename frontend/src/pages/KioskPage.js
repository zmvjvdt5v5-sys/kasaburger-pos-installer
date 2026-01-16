import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, Banknote, ArrowLeft, CheckCircle, Receipt, Package, UtensilsCrossed } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Default Menu Data
const DEFAULT_MENU = {
  categories: [
    { id: 'et-burger', name: 'Et Burger', icon: '🍔' },
    { id: 'premium', name: 'Premium Gourmet', icon: '👑' },
    { id: 'tavuk', name: 'Tavuk Burger', icon: '🍗' },
    { id: 'atistirmalik', name: 'Atıştırmalıklar', icon: '🍟' },
    { id: 'icecek', name: 'İçecekler', icon: '🥤' },
    { id: 'tatli', name: 'Tatlılar', icon: '🍫' },
  ],
  products: [
    // Et Burger
    { id: 'kasa-classic', name: 'Kasa Classic Burger', description: '150 gr. özel baharatlı dana köfte, taze yeşillik, Kasa Gizli Sos', price: 460, category: 'et-burger', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400' },
    { id: 'golden-burger', name: 'Golden Burger', description: '150 gr. Dry-Aged köfte, brioche ekmek, yenilebilir altın kaplama, trüf sos, double cheddar', price: 1190, category: 'et-burger', image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400', premium: true },
    { id: 'cheese-lover', name: 'Cheese Lover Burger', description: '150 gr. dana köfte, çift cheddar + erimiş peynir sosu, karamelize soğan', price: 560, category: 'et-burger', image: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400' },
    { id: 'no7-burger', name: 'No:7 Burger', description: '150 gr. özel reçeteli dana köfte, double cheddar, jalapeno, acılı kasa sos', price: 540, category: 'et-burger', image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400' },
    { id: 'hirsiz-polis', name: 'Hırsız & Polis Burger', description: '2x150 gr. dana köfte, Polis sos (tatlı), Hırsız (acı), cheddar', price: 490, category: 'et-burger', image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400' },
    
    // Premium Gourmet
    { id: 'viking-burger', name: 'Viking Burger', description: '150 gr. dana köfte, 20 gr. cheddar peyniri, çıtır soğan, viking sos', price: 430, category: 'premium', image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400' },
    { id: 'milano-burger', name: 'Milano Burger', description: '150gr. dana köfte, mozzarella, kuru domates, pesto mayo, roka', price: 440, category: 'premium', image: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400' },
    { id: 'kasa-double-xl', name: 'Kasa Double XL', description: '300 gr. dana köfte, 40 gr. cheddar, karamelize soğan, kasa özel sos', price: 640, category: 'premium', image: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=400', premium: true },
    { id: 'smoky-bbq', name: 'Smoky BBQ Burger', description: '150 gr. dana köfte, 20 gr. cheddar, kızartılmış pastırma, bbq sos', price: 560, category: 'premium', image: 'https://images.unsplash.com/photo-1608767221051-2b9d18f35a2f?w=400' },
    { id: 'animal-style', name: 'Animal Style Burger', description: '150 gr. dana köfte, cheddar peynir, karamelize soğan, animal sos', price: 550, category: 'premium', image: 'https://images.unsplash.com/photo-1596956470007-2bf6095e7e16?w=400' },
    
    // Tavuk Burger
    { id: 'crispy-chicken', name: 'Crispy Chicken Burger', description: 'Çıtır paneli tavuk göğsü, taze yeşillik, turşu, mayonez', price: 360, category: 'tavuk', image: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400' },
    { id: 'double-crispy', name: 'Double Crispy Chicken', description: 'Double tavuk, cheddar, taze yeşillik, acılı kasa sos, turşu', price: 410, category: 'tavuk', image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400' },
    { id: 'animal-chicken', name: 'Animal Style Chicken', description: 'Çıtır paneli tavuk göğsü, karamelize soğan, double cheddar, animal sos', price: 430, category: 'tavuk', image: 'https://images.unsplash.com/photo-1513185158878-8d8c2a2a3da3?w=400' },
    { id: 'hirsiz-chicken', name: '(Spicy) Hırsız Burger', description: 'Acı marinasyonlu çıtır tavuk, cheddar, acılı kasa mayonez, jalapeno', price: 420, category: 'tavuk', image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400' },
    { id: 'polis-chicken', name: '(Sweet) Polis Burger', description: 'Tatlı marinasyonlu çıtır tavuk, tatlı kasa sos, taze yeşillik, mozzarella', price: 420, category: 'tavuk', image: 'https://images.unsplash.com/photo-1615297928064-24977384d0da?w=400' },
    { id: 'milano-chicken', name: 'Milano Chicken Burger', description: 'İnce paneli çıtır tavuk, pesto mayo, kurutulmuş domates, mozzarella', price: 440, category: 'tavuk', image: 'https://images.unsplash.com/photo-1585325701165-351af916e581?w=400' },
    { id: 'viking-chicken', name: 'Viking Chicken Burger', description: 'Viking sos, çıtır tavuk, cheddar, kornişon turşu, çıtır soğan', price: 430, category: 'tavuk', image: 'https://images.unsplash.com/photo-1610440042657-612c34d95e9f?w=400' },
    
    // Atıştırmalıklar
    { id: 'mac-cheese', name: 'Mac and Cheese Topları', description: 'Çıtır kaplamalı peynirli makarna topları', price: 170, category: 'atistirmalik', image: 'https://images.unsplash.com/photo-1543339494-b4cd4f7ba686?w=400' },
    { id: 'mozarella-sticks', name: 'Mozarella Sticks (6 adet)', description: 'Yarım porsiyon patates ile', price: 210, category: 'atistirmalik', image: 'https://images.unsplash.com/photo-1531749668029-2db88e27a9b9?w=400' },
    { id: 'sogan-halkasi', name: 'Soğan Halkası (8 adet)', description: 'Yarım porsiyon patates ile', price: 180, category: 'atistirmalik', image: 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=400' },
    { id: 'cheese-fries', name: 'Prison Cheese Lover Fries', description: 'Cheddar soslu patates', price: 150, category: 'atistirmalik', image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400' },
    { id: 'truffle-fries', name: 'Prison Truffle Fries', description: 'Trüf soslu patates', price: 175, category: 'atistirmalik', image: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=400' },
    { id: 'cajun-fries', name: 'Prison Hot Lockdown Fries', description: 'Cajun baharatlı acılı patates', price: 160, category: 'atistirmalik', image: 'https://images.unsplash.com/photo-1598679253544-2c97992403ea?w=400' },
    
    // İçecekler
    { id: 'cola', name: 'Coca Cola', description: '330ml kutu', price: 45, category: 'icecek', image: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400' },
    { id: 'cola-zero', name: 'Coca Cola Zero', description: '330ml kutu şekersiz', price: 45, category: 'icecek', image: 'https://images.unsplash.com/photo-1624552184280-9e9631bbeee9?w=400' },
    { id: 'fanta', name: 'Fanta', description: '330ml kutu portakal', price: 45, category: 'icecek', image: 'https://images.unsplash.com/photo-1624517452488-04869289c4ca?w=400' },
    { id: 'sprite', name: 'Sprite', description: '330ml kutu limon', price: 45, category: 'icecek', image: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400' },
    { id: 'ayran', name: 'Ayran', description: '300ml', price: 35, category: 'icecek', image: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400' },
    { id: 'su', name: 'Su', description: '500ml', price: 20, category: 'icecek', image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400' },
    { id: 'ice-tea-seftali', name: 'Ice Tea Şeftali', description: '330ml kutu', price: 45, category: 'icecek', image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400' },
    { id: 'ice-tea-limon', name: 'Ice Tea Limon', description: '330ml kutu', price: 45, category: 'icecek', image: 'https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=400' },
    { id: 'limonata', name: 'Ev Yapımı Limonata', description: 'Taze sıkılmış', price: 55, category: 'icecek', image: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400' },
    { id: 'milkshake-cikolata', name: 'Milkshake Çikolata', description: 'Kremalı çikolatalı', price: 85, category: 'icecek', image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400' },
    { id: 'milkshake-cilek', name: 'Milkshake Çilek', description: 'Kremalı çilekli', price: 85, category: 'icecek', image: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=400' },
    { id: 'milkshake-vanilya', name: 'Milkshake Vanilya', description: 'Kremalı vanilyalı', price: 85, category: 'icecek', image: 'https://images.unsplash.com/photo-1568901839119-631418a3910d?w=400' },
    // Pepsi Grubu
    { id: 'pepsi', name: 'Pepsi', description: '330ml kutu', price: 45, category: 'icecek', image: 'https://images.unsplash.com/photo-1553456558-aff63285bdd1?w=400' },
    { id: 'pepsi-max', name: 'Pepsi Max', description: '330ml kutu şekersiz', price: 45, category: 'icecek', image: 'https://images.unsplash.com/photo-1630152835334-5cd64e5d6e91?w=400' },
    { id: 'yedigun', name: 'Yedigün', description: '330ml kutu portakal', price: 45, category: 'icecek', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400' },
    { id: 'fruko', name: 'Fruko', description: '330ml kutu gazoz', price: 45, category: 'icecek', image: 'https://images.unsplash.com/photo-1527960471264-932f39eb5846?w=400' },
    { id: 'lipton-seftali', name: 'Lipton Ice Tea Şeftali', description: '330ml kutu', price: 45, category: 'icecek', image: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=400' },
    { id: 'lipton-limon', name: 'Lipton Ice Tea Limon', description: '330ml kutu', price: 45, category: 'icecek', image: 'https://images.unsplash.com/photo-1507281549113-040fcfef650e?w=400' },
    
    // Tatlılar
    { id: 'choco-bomb', name: 'Kasa Choco Bomb', description: 'Çikolata patlaması', price: 200, category: 'tatli', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400' },
    { id: 'churros', name: 'Churros', description: 'Taze kızartılmış churros, çikolata sos', price: 180, category: 'tatli', image: 'https://images.unsplash.com/photo-1624371414361-e670edf7bb3b?w=400' },
    { id: 'oreo-dream', name: 'Oreo Dream Cup', description: 'Oreo parçacıklı dondurma', price: 220, category: 'tatli', image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400' },
  ]
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
};

const KioskPage = () => {
  const [menuData, setMenuData] = useState(DEFAULT_MENU);
  const [selectedCategory, setSelectedCategory] = useState('et-burger');
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showServiceType, setShowServiceType] = useState(false);
  const [serviceType, setServiceType] = useState(null); // 'paket' or 'masa'
  const [showPayment, setShowPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [orderNumber, setOrderNumber] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [tableNumber, setTableNumber] = useState('');

  // Load menu from backend
  useEffect(() => {
    const loadMenu = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/kiosk/menu`);
        if (response.ok) {
          const data = await response.json();
          if (data.products && data.products.length > 0) {
            setMenuData(data);
          }
        }
      } catch (error) {
        console.log('Using default menu');
      }
    };
    loadMenu();
  }, []);

  const filteredProducts = menuData.products.filter(p => p.category === selectedCategory);
  
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    toast.success(`${product.name} sepete eklendi`);
  };

  const updateQuantity = (productId, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === productId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean);
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setShowCart(false);
  };

  const selectServiceType = (type) => {
    setServiceType(type);
    setShowServiceType(false);
    setShowPayment(true);
  };

  const processPayment = async (method) => {
    setProcessing(true);
    
    try {
      // Save order to backend
      const orderData = {
        items: cart.map(item => ({
          product_id: item.id,
          product_name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          total: item.price * item.quantity
        })),
        total: cartTotal,
        service_type: serviceType,
        table_number: serviceType === 'masa' ? tableNumber : null,
        payment_method: method
      };

      const response = await fetch(`${BACKEND_URL}/api/kiosk/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      let newOrderNumber;
      if (response.ok) {
        const data = await response.json();
        newOrderNumber = data.order_number;
      } else {
        newOrderNumber = `KB-${Date.now().toString().slice(-6)}`;
      }
      
      setOrderNumber(newOrderNumber);
    } catch (error) {
      setOrderNumber(`KB-${Date.now().toString().slice(-6)}`);
    }
    
    setProcessing(false);
    setShowPayment(false);
    setShowReceipt(true);
  };

  const completeOrder = () => {
    setCart([]);
    setShowReceipt(false);
    setOrderNumber(null);
    setServiceType(null);
    setTableNumber('');
    toast.success('Siparişiniz alındı! İyi günler dileriz.');
  };

  useEffect(() => {
    if (cart.length === 0 && showCart) {
      setShowCart(false);
    }
  }, [cart.length, showCart]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-white overflow-hidden">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-sm border-b border-orange-500/20 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src="https://customer-assets.emergentagent.com/job_kasaburger-pos/artifacts/oruytxht_b3459348-380a-4e05-8eb6-989bd31e2066.jpeg" 
              alt="Kasa Burger" 
              className="h-16 w-16 object-contain"
            />
            <div>
              <h1 className="text-3xl font-bold text-orange-500">KASA BURGER</h1>
              <p className="text-sm text-zinc-400">Self-Servis Sipariş</p>
            </div>
          </div>
          
          <Button 
            onClick={() => setShowCart(true)}
            className="relative bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 text-xl rounded-2xl shadow-lg shadow-orange-500/30"
            disabled={cart.length === 0}
          >
            <ShoppingCart className="h-8 w-8 mr-3" />
            <span>Sepetim</span>
            {cartCount > 0 && (
              <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-lg px-3 py-1">
                {cartCount}
              </Badge>
            )}
          </Button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-100px)]">
        {/* Categories Sidebar */}
        <aside className="w-48 bg-black/30 border-r border-white/10 p-4 space-y-3">
          <h2 className="text-lg font-semibold text-zinc-400 mb-4">Kategoriler</h2>
          {menuData.categories.map(category => (
            <Button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              variant={selectedCategory === category.id ? "default" : "ghost"}
              className={`w-full justify-start text-left py-6 text-lg ${
                selectedCategory === category.id 
                  ? 'bg-orange-500 text-white' 
                  : 'text-zinc-300 hover:bg-white/10'
              }`}
            >
              <span className="text-2xl mr-3">{category.icon}</span>
              {category.name}
            </Button>
          ))}
        </aside>

        {/* Products Grid */}
        <main className="flex-1 p-6 overflow-y-auto">
          <h2 className="text-2xl font-bold mb-6 text-orange-400">
            {menuData.categories.find(c => c.id === selectedCategory)?.name}
          </h2>
          
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <Card 
                key={product.id} 
                className="bg-zinc-800/50 border-zinc-700 hover:border-orange-500/50 transition-all duration-300 cursor-pointer group overflow-hidden"
                onClick={() => addToCart(product)}
              >
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  {product.premium && (
                    <Badge className="absolute top-3 right-3 bg-yellow-500 text-black">
                      👑 Premium
                    </Badge>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-bold text-lg text-white mb-1">{product.name}</h3>
                  <p className="text-sm text-zinc-400 line-clamp-2 mb-3">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-orange-400">{formatCurrency(product.price)}</span>
                    <Button 
                      size="sm" 
                      className="bg-orange-500 hover:bg-orange-600 rounded-full"
                      onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>

      {/* Cart Drawer */}
      <Dialog open={showCart} onOpenChange={setShowCart}>
        <DialogContent className="bg-zinc-900 border-zinc-700 text-white max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-3">
              <ShoppingCart className="h-7 w-7 text-orange-500" />
              Sepetim ({cartCount} ürün)
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            {cart.map(item => (
              <div key={item.id} className="flex items-center gap-4 bg-zinc-800/50 p-4 rounded-xl">
                <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-lg" />
                <div className="flex-1">
                  <h4 className="font-semibold">{item.name}</h4>
                  <p className="text-orange-400 font-bold">{formatCurrency(item.price)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    size="icon" 
                    variant="outline" 
                    className="h-10 w-10 rounded-full"
                    onClick={() => updateQuantity(item.id, -1)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-xl font-bold w-8 text-center">{item.quantity}</span>
                  <Button 
                    size="icon" 
                    variant="outline" 
                    className="h-10 w-10 rounded-full"
                    onClick={() => updateQuantity(item.id, 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="destructive" 
                    className="h-10 w-10 rounded-full ml-2"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-zinc-700 pt-4 space-y-4">
            <div className="flex justify-between text-xl font-bold">
              <span>Toplam</span>
              <span className="text-orange-400">{formatCurrency(cartTotal)}</span>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1 py-6"
                onClick={clearCart}
              >
                <Trash2 className="mr-2 h-5 w-5" />
                Sepeti Temizle
              </Button>
              <Button 
                className="flex-1 py-6 bg-orange-500 hover:bg-orange-600 text-lg"
                onClick={() => { setShowCart(false); setShowServiceType(true); }}
              >
                Devam Et
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Service Type Selection Dialog */}
      <Dialog open={showServiceType} onOpenChange={setShowServiceType}>
        <DialogContent className="bg-zinc-900 border-zinc-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">Servis Türü Seçin</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-6">
            <Button 
              className="w-full py-12 text-xl bg-blue-600 hover:bg-blue-700 flex flex-col items-center gap-3"
              onClick={() => selectServiceType('paket')}
            >
              <Package className="h-12 w-12" />
              <span>Paket Servis</span>
              <span className="text-sm opacity-70">Siparişimi paket olarak alacağım</span>
            </Button>
            
            <Button 
              className="w-full py-12 text-xl bg-green-600 hover:bg-green-700 flex flex-col items-center gap-3"
              onClick={() => selectServiceType('masa')}
            >
              <UtensilsCrossed className="h-12 w-12" />
              <span>Masaya Servis</span>
              <span className="text-sm opacity-70">Siparişim masama getirilsin</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full py-6"
              onClick={() => { setShowServiceType(false); setShowCart(true); }}
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Geri Dön
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="bg-zinc-900 border-zinc-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">Ödeme Yöntemi Seçin</DialogTitle>
          </DialogHeader>
          
          {processing ? (
            <div className="py-12 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto mb-4" />
              <p className="text-xl">Ödeme işleniyor...</p>
            </div>
          ) : (
            <div className="space-y-4 py-6">
              <div className="bg-zinc-800/50 p-4 rounded-xl mb-6">
                <div className="flex items-center gap-2 mb-2">
                  {serviceType === 'paket' ? (
                    <><Package className="h-5 w-5 text-blue-400" /><span className="text-blue-400">Paket Servis</span></>
                  ) : (
                    <><UtensilsCrossed className="h-5 w-5 text-green-400" /><span className="text-green-400">Masaya Servis</span></>
                  )}
                </div>
                <p className="text-zinc-400 mb-2">Ödenecek Tutar</p>
                <p className="text-4xl font-bold text-orange-400">{formatCurrency(cartTotal)}</p>
              </div>

              {serviceType === 'masa' && (
                <div className="mb-4">
                  <label className="text-sm text-zinc-400 mb-2 block">Masa Numarası</label>
                  <input
                    type="text"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="Masa numaranızı girin"
                    className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-4 py-3 text-white text-center text-xl"
                  />
                </div>
              )}
              
              <Button 
                className="w-full py-8 text-xl bg-green-600 hover:bg-green-700"
                onClick={() => processPayment('cash')}
              >
                <Banknote className="mr-4 h-8 w-8" />
                Nakit Ödeme
              </Button>
              
              <Button 
                className="w-full py-8 text-xl bg-blue-600 hover:bg-blue-700"
                onClick={() => processPayment('card')}
              >
                <CreditCard className="mr-4 h-8 w-8" />
                Kredi Kartı
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full py-6"
                onClick={() => { setShowPayment(false); setShowServiceType(true); }}
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Geri Dön
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={() => {}}>
        <DialogContent className="bg-zinc-900 border-zinc-700 text-white max-w-md [&>button]:hidden">
          <div className="text-center py-6">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <h2 className="text-3xl font-bold text-green-500 mb-2">Sipariş Alındı!</h2>
            <p className="text-zinc-400">Siparişiniz hazırlanıyor</p>
          </div>
          
          <div className="bg-white text-black p-6 rounded-xl space-y-4">
            <div className="text-center border-b border-dashed border-zinc-300 pb-4">
              <img 
                src="https://customer-assets.emergentagent.com/job_kasaburger-pos/artifacts/oruytxht_b3459348-380a-4e05-8eb6-989bd31e2066.jpeg" 
                alt="Kasa Burger" 
                className="h-12 w-12 mx-auto mb-2"
              />
              <h3 className="font-bold text-lg">KASA BURGER</h3>
              <p className="text-sm text-zinc-500">Self-Servis Sipariş Fişi</p>
            </div>
            
            <div className="text-center py-4">
              <p className="text-sm text-zinc-500">Sipariş Numaranız</p>
              <p className="text-5xl font-bold text-orange-500 my-2">{orderNumber}</p>
              <p className="text-xs text-zinc-400">{new Date().toLocaleString('tr-TR')}</p>
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100">
                {serviceType === 'paket' ? (
                  <><Package className="h-4 w-4" /><span>Paket Servis</span></>
                ) : (
                  <><UtensilsCrossed className="h-4 w-4" /><span>Masa: {tableNumber || '-'}</span></>
                )}
              </div>
            </div>
            
            <div className="border-t border-dashed border-zinc-300 pt-4 space-y-2">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.quantity}x {item.name}</span>
                  <span>{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            
            <div className="border-t border-dashed border-zinc-300 pt-4">
              <div className="flex justify-between font-bold text-lg">
                <span>TOPLAM</span>
                <span>{formatCurrency(cartTotal)}</span>
              </div>
            </div>
            
            <div className="text-center text-xs text-zinc-500 pt-4">
              <p>Lütfen sipariş numaranızı ekranda bekleyiniz.</p>
              <p>İyi günler dileriz! 🍔</p>
            </div>
          </div>
          
          <Button 
            className="w-full py-6 text-xl bg-orange-500 hover:bg-orange-600 mt-4"
            onClick={completeOrder}
          >
            <Receipt className="mr-2 h-6 w-6" />
            Tamam
          </Button>
        </DialogContent>
      </Dialog>

      {/* Footer Cart Summary */}
      {cart.length > 0 && !showCart && !showServiceType && !showPayment && !showReceipt && (
        <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm border-t border-orange-500/30 p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-orange-500/20 p-3 rounded-full">
                <ShoppingCart className="h-8 w-8 text-orange-500" />
              </div>
              <div>
                <p className="text-zinc-400">{cartCount} ürün</p>
                <p className="text-2xl font-bold text-orange-400">{formatCurrency(cartTotal)}</p>
              </div>
            </div>
            <Button 
              onClick={() => setShowCart(true)}
              className="bg-orange-500 hover:bg-orange-600 px-12 py-6 text-xl rounded-2xl"
            >
              Sepeti Görüntüle
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default KioskPage;
