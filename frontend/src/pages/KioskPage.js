import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, Banknote, ArrowLeft, CheckCircle, Package, UtensilsCrossed } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const MENU_DATA = {
  categories: [
    { id: 'et-burger', name: 'Et Burger', icon: '🍔' },
    { id: 'premium', name: 'Premium', icon: '👑' },
    { id: 'tavuk', name: 'Tavuk', icon: '🍗' },
    { id: 'atistirmalik', name: 'Atıştırmalık', icon: '🍟' },
    { id: 'icecek', name: 'İçecekler', icon: '🥤' },
    { id: 'tatli', name: 'Tatlılar', icon: '🍫' },
  ],
  products: [
    // Et Burger
    { id: 'kasa-classic', name: 'Kasa Classic', price: 460, category: 'et-burger', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400' },
    { id: 'golden-burger', name: 'Golden Burger', price: 1190, category: 'et-burger', image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400', premium: true },
    { id: 'cheese-lover', name: 'Cheese Lover', price: 560, category: 'et-burger', image: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400' },
    { id: 'no7-burger', name: 'No:7 Acılı', price: 540, category: 'et-burger', image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400' },
    { id: 'hirsiz-polis', name: 'Hırsız & Polis', price: 490, category: 'et-burger', image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400' },
    // Premium
    { id: 'viking-burger', name: 'Viking Burger', price: 430, category: 'premium', image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400' },
    { id: 'milano-burger', name: 'Milano Burger', price: 440, category: 'premium', image: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400' },
    { id: 'kasa-double-xl', name: 'Kasa Double XL', price: 640, category: 'premium', image: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=400', premium: true },
    { id: 'smoky-bbq', name: 'Smoky BBQ', price: 560, category: 'premium', image: 'https://images.unsplash.com/photo-1608767221051-2b9d18f35a2f?w=400' },
    // Tavuk
    { id: 'crispy-chicken', name: 'Crispy Chicken', price: 360, category: 'tavuk', image: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400' },
    { id: 'double-crispy', name: 'Double Crispy', price: 410, category: 'tavuk', image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400' },
    { id: 'animal-chicken', name: 'Animal Chicken', price: 430, category: 'tavuk', image: 'https://images.unsplash.com/photo-1513185158878-8d8c2a2a3da3?w=400' },
    { id: 'milano-chicken', name: 'Milano Chicken', price: 440, category: 'tavuk', image: 'https://images.unsplash.com/photo-1585325701165-351af916e581?w=400' },
    // Atıştırmalık
    { id: 'mac-cheese', name: 'Mac & Cheese', price: 170, category: 'atistirmalik', image: 'https://images.unsplash.com/photo-1543339494-b4cd4f7ba686?w=400' },
    { id: 'mozarella-sticks', name: 'Mozarella Sticks', price: 210, category: 'atistirmalik', image: 'https://images.unsplash.com/photo-1531749668029-2db88e27a9b9?w=400' },
    { id: 'sogan-halkasi', name: 'Soğan Halkası', price: 180, category: 'atistirmalik', image: 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=400' },
    { id: 'cheese-fries', name: 'Cheese Fries', price: 150, category: 'atistirmalik', image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400' },
    // İçecekler
    { id: 'ayran', name: 'Ayran', price: 35, category: 'icecek', image: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400' },
    { id: 'su', name: 'Su', price: 20, category: 'icecek', image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400' },
    { id: 'limonata', name: 'Limonata', price: 55, category: 'icecek', image: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400' },
    { id: 'pepsi', name: 'Pepsi', price: 45, category: 'icecek', image: 'https://images.unsplash.com/photo-1553456558-aff63285bdd1?w=400' },
    { id: 'milkshake', name: 'Milkshake', price: 85, category: 'icecek', image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400' },
    // Tatlılar
    { id: 'choco-bomb', name: 'Choco Bomb', price: 200, category: 'tatli', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400' },
    { id: 'churros', name: 'Churros', price: 180, category: 'tatli', image: 'https://images.unsplash.com/photo-1624371414361-e670edf7bb3b?w=400' },
    { id: 'oreo-dream', name: 'Oreo Dream', price: 220, category: 'tatli', image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400' },
  ]
};

const formatPrice = (amount) => `₺${amount.toFixed(0)}`;

const KioskPage = () => {
  const [menuData, setMenuData] = useState(MENU_DATA);
  const [selectedCategory, setSelectedCategory] = useState('et-burger');
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showServiceType, setShowServiceType] = useState(false);
  const [serviceType, setServiceType] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [orderNumber, setOrderNumber] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [tableNumber, setTableNumber] = useState('');

  useEffect(() => {
    const loadMenu = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/kiosk/menu`);
        if (response.ok) {
          const data = await response.json();
          if (data.products?.length > 0) setMenuData(data);
        }
      } catch (e) { /* use default */ }
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
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    toast.success(`${product.name} eklendi`);
  };

  const updateQuantity = (productId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = item.quantity + delta;
        return newQty <= 0 ? null : { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean));
  };

  const processPayment = async (method) => {
    setProcessing(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/kiosk/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(item => ({ product_id: item.id, product_name: item.name, quantity: item.quantity, unit_price: item.price, total: item.price * item.quantity })),
          total: cartTotal,
          service_type: serviceType,
          table_number: serviceType === 'masa' ? tableNumber : null,
          payment_method: method
        })
      });
      const data = response.ok ? await response.json() : null;
      setOrderNumber(data?.order_number || `KB-${Date.now().toString().slice(-6)}`);
    } catch (e) {
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
  };

  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-zinc-900 px-6 py-3 flex items-center justify-between border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <img src="https://customer-assets.emergentagent.com/job_kasaburger-pos/artifacts/oruytxht_b3459348-380a-4e05-8eb6-989bd31e2066.jpeg" alt="Logo" className="h-12 w-12" />
          <span className="text-2xl font-bold text-orange-500">KASA BURGER</span>
        </div>
        {cartCount > 0 && (
          <Button onClick={() => setShowCart(true)} className="bg-orange-500 hover:bg-orange-600 px-6 py-5 text-lg gap-3">
            <ShoppingCart className="h-6 w-6" />
            <span>{cartCount} Ürün</span>
            <span className="font-bold">{formatPrice(cartTotal)}</span>
          </Button>
        )}
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Categories - Left Side */}
        <nav className="w-28 bg-zinc-900 flex flex-col border-r border-zinc-800">
          {menuData.categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex flex-col items-center justify-center py-5 px-2 transition-all ${
                selectedCategory === cat.id ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              <span className="text-3xl mb-1">{cat.icon}</span>
              <span className="text-xs font-medium text-center leading-tight">{cat.name}</span>
            </button>
          ))}
        </nav>

        {/* Products Grid */}
        <main className="flex-1 p-4 overflow-y-auto bg-zinc-950">
          <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-zinc-900 rounded-xl overflow-hidden text-left transition-all hover:ring-2 hover:ring-orange-500 active:scale-95"
              >
                <div className="relative aspect-square">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  {product.premium && (
                    <span className="absolute top-2 right-2 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded">👑</span>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm text-white truncate">{product.name}</h3>
                  <p className="text-orange-500 font-bold text-lg mt-1">{formatPrice(product.price)}</p>
                </div>
              </button>
            ))}
          </div>
        </main>
      </div>

      {/* Bottom Bar - Quick Cart */}
      {cartCount > 0 && !showCart && (
        <div className="bg-zinc-900 border-t border-zinc-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <ShoppingCart className="h-8 w-8 text-orange-500" />
            <div>
              <p className="text-sm text-zinc-400">{cartCount} ürün</p>
              <p className="text-xl font-bold text-orange-500">{formatPrice(cartTotal)}</p>
            </div>
          </div>
          <Button onClick={() => setShowCart(true)} className="bg-orange-500 hover:bg-orange-600 px-10 py-6 text-lg rounded-xl">
            Siparişi Tamamla
          </Button>
        </div>
      )}

      {/* Cart Dialog */}
      <Dialog open={showCart} onOpenChange={setShowCart}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-orange-500" /> Sepetim
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto py-2 space-y-2">
            {cart.map(item => (
              <div key={item.id} className="flex items-center gap-3 bg-zinc-800 p-3 rounded-lg">
                <img src={item.image} alt={item.name} className="w-14 h-14 object-cover rounded" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{item.name}</h4>
                  <p className="text-orange-500 font-bold">{formatPrice(item.price * item.quantity)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => updateQuantity(item.id, -1)}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-6 text-center font-bold">{item.quantity}</span>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => updateQuantity(item.id, 1)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-zinc-800 pt-4 space-y-3">
            <div className="flex justify-between text-lg font-bold">
              <span>Toplam</span>
              <span className="text-orange-500">{formatPrice(cartTotal)}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 py-5" onClick={() => { setCart([]); setShowCart(false); }}>
                <Trash2 className="h-4 w-4 mr-2" /> Temizle
              </Button>
              <Button className="flex-1 py-5 bg-orange-500 hover:bg-orange-600" onClick={() => { setShowCart(false); setShowServiceType(true); }}>
                Devam Et
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Service Type Dialog */}
      <Dialog open={showServiceType} onOpenChange={setShowServiceType}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl text-center">Nereden Alacaksınız?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <Button className="w-full py-10 text-lg bg-blue-600 hover:bg-blue-700 flex flex-col gap-2" onClick={() => { setServiceType('paket'); setShowServiceType(false); setShowPayment(true); }}>
              <Package className="h-10 w-10" />
              <span>Paket Servis</span>
            </Button>
            <Button className="w-full py-10 text-lg bg-green-600 hover:bg-green-700 flex flex-col gap-2" onClick={() => { setServiceType('masa'); setShowServiceType(false); setShowPayment(true); }}>
              <UtensilsCrossed className="h-10 w-10" />
              <span>Masaya Servis</span>
            </Button>
            <Button variant="outline" className="w-full" onClick={() => { setShowServiceType(false); setShowCart(true); }}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Geri
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl text-center">Ödeme</DialogTitle>
          </DialogHeader>
          {processing ? (
            <div className="py-10 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mx-auto mb-4" />
              <p>İşleniyor...</p>
            </div>
          ) : (
            <div className="space-y-3 py-4">
              <div className="text-center py-4 bg-zinc-800 rounded-lg">
                <p className="text-sm text-zinc-400">Toplam Tutar</p>
                <p className="text-4xl font-bold text-orange-500">{formatPrice(cartTotal)}</p>
              </div>
              {serviceType === 'masa' && (
                <input type="text" value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} placeholder="Masa No" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-center text-xl" />
              )}
              <Button className="w-full py-8 text-lg bg-green-600 hover:bg-green-700" onClick={() => processPayment('cash')}>
                <Banknote className="h-6 w-6 mr-3" /> Nakit
              </Button>
              <Button className="w-full py-8 text-lg bg-blue-600 hover:bg-blue-700" onClick={() => processPayment('card')}>
                <CreditCard className="h-6 w-6 mr-3" /> Kredi Kartı
              </Button>
              <Button variant="outline" className="w-full" onClick={() => { setShowPayment(false); setShowServiceType(true); }}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Geri
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={() => {}}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-sm [&>button]:hidden">
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-green-500">Sipariş Alındı!</h2>
          </div>
          <div className="bg-white text-black p-5 rounded-xl text-center">
            <p className="text-sm text-zinc-500">Sipariş No</p>
            <p className="text-4xl font-bold text-orange-500 my-2">{orderNumber}</p>
            <p className="text-xs text-zinc-400">{new Date().toLocaleString('tr-TR')}</p>
            <div className="mt-4 pt-4 border-t border-dashed text-left space-y-1">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.quantity}x {item.name}</span>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-dashed flex justify-between font-bold">
              <span>TOPLAM</span>
              <span>{formatPrice(cartTotal)}</span>
            </div>
          </div>
          <Button className="w-full py-6 bg-orange-500 hover:bg-orange-600 text-lg mt-2" onClick={completeOrder}>
            Tamam
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KioskPage;
