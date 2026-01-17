// KioskPage v2.1 - Updated: 2026-01-17 - Nakit ödeme kaldırıldı, not ekleme eklendi
import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, ArrowLeft, CheckCircle, Package, UtensilsCrossed, Smartphone, MessageSquare } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const DEFAULT_PRODUCTS = [
  // ET BURGER
  {id: "kasa-classic", name: "Kasa Classic Burger", category: "et-burger", price: 460, image: "https://images.unsplash.com/photo-1599082267955-266a170c214e?w=600&q=80"},
  {id: "golden-burger", name: "Golden Burger", category: "et-burger", price: 1190, image: "https://images.unsplash.com/photo-1603508102983-99b101395d1a?w=600&q=80", is_premium: true},
  {id: "cheese-lover", name: "Cheese Lover Burger", category: "et-burger", price: 560, image: "https://images.unsplash.com/photo-1585238341710-4d3ff484184d?w=600&q=80"},
  {id: "no7-burger", name: "No:7 Burger", category: "et-burger", price: 540, image: "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=600&q=80"},
  {id: "hirsiz-polis", name: "Hırsız & Polis Burger", category: "et-burger", price: 490, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80"},
  // PREMIUM GOURMET
  {id: "viking-burger", name: "Viking Burger", category: "premium", price: 430, image: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=600&q=80", is_premium: true},
  {id: "milano-burger", name: "Milano Burger", category: "premium", price: 440, image: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=600&q=80", is_premium: true},
  {id: "kasa-double-xl", name: "Kasa Double XL", category: "premium", price: 640, image: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=600&q=80", is_premium: true},
  {id: "smoky-bbq", name: "Smoky BBQ Burger", category: "premium", price: 560, image: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=600&q=80", is_premium: true},
  {id: "animal-style", name: "Animal Style Burger", category: "premium", price: 550, image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&q=80", is_premium: true},
  // TAVUK BURGER
  {id: "crispy-chicken", name: "Crispy Chicken Burger", category: "tavuk", price: 360, image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&q=80"},
  {id: "double-crispy", name: "Double Crispy Chicken", category: "tavuk", price: 410, image: "https://images.unsplash.com/photo-1562967914-608f82629710?w=600&q=80"},
  {id: "animal-chicken", name: "Animal Style Chicken", category: "tavuk", price: 430, image: "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=600&q=80"},
  {id: "spicy-hirsiz", name: "(Spicy) Hırsız Burger", category: "tavuk", price: 420, image: "https://images.unsplash.com/photo-1513185158878-8d8c2a2a3da3?w=600&q=80"},
  {id: "sweet-polis", name: "(Sweet) Polis Burger", category: "tavuk", price: 420, image: "https://images.unsplash.com/photo-1610440042657-612c34d95e9f?w=600&q=80"},
  {id: "milano-chicken", name: "Milano Chicken Burger", category: "tavuk", price: 440, image: "https://images.unsplash.com/photo-1585325701165-351af916e581?w=600&q=80"},
  {id: "viking-chicken", name: "Viking Chicken Burger", category: "tavuk", price: 430, image: "https://images.unsplash.com/photo-1587132137056-bfbf0166836e?w=600&q=80"},
  // ATISTIRMALIKLAR
  {id: "mac-cheese", name: "Mac and Cheese Topları", category: "atistirmalik", price: 170, image: "https://images.unsplash.com/photo-1543339494-b4cd4f7ba686?w=600&q=80"},
  {id: "mozarella-sticks", name: "Mozarella Sticks", category: "atistirmalik", price: 210, image: "https://images.unsplash.com/photo-1548340748-6d2b7d7da280?w=600&q=80"},
  {id: "sogan-halkasi", name: "Soğan Halkası", category: "atistirmalik", price: 180, image: "https://images.unsplash.com/photo-1639024471283-03518883512d?w=600&q=80"},
  {id: "cheese-fries", name: "Prison Cheese Lover Fries", category: "atistirmalik", price: 150, image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&q=80"},
  {id: "truffle-fries", name: "Prison Truffle Fries", category: "atistirmalik", price: 175, image: "https://images.unsplash.com/photo-1630384060421-cb20aff8a689?w=600&q=80"},
  {id: "cajun-fries", name: "Prison Hot Lockdown Fries", category: "atistirmalik", price: 160, image: "https://images.unsplash.com/photo-1598679253544-2c97992403ea?w=600&q=80"},
  // İÇECEKLER
  {id: "ayran", name: "Ayran", category: "icecek", price: 35, image: "https://images.unsplash.com/photo-1596151163116-98a5033814c2?w=600&q=80"},
  {id: "su", name: "Su", category: "icecek", price: 20, image: "https://images.unsplash.com/photo-1564419320461-6870880221ad?w=600&q=80"},
  {id: "limonata", name: "Limonata", category: "icecek", price: 55, image: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=600&q=80"},
  {id: "pepsi", name: "Pepsi", category: "icecek", price: 45, image: "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=600&q=80"},
  {id: "milkshake", name: "Milkshake", category: "icecek", price: 85, image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=80"},
  // TATLILAR
  {id: "choco-bomb", name: "Kasa Choco Bomb", category: "tatli", price: 200, image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&q=80"},
  {id: "churros", name: "Churros", category: "tatli", price: 180, image: "https://images.pexels.com/photos/2035706/pexels-photo-2035706.jpeg?auto=compress&cs=tinysrgb&w=600"},
  {id: "oreo-dream", name: "Oreo Dream Cup", category: "tatli", price: 220, image: "https://images.unsplash.com/photo-1612078960206-1709f1f0c969?w=600&q=80"},
];

const MENU_DATA = {
  categories: [
    { id: 'et-burger', name: 'Burger', icon: '🍔' },
    { id: 'premium', name: 'Premium', icon: '👑' },
    { id: 'tavuk', name: 'Tavuk', icon: '🍗' },
    { id: 'atistirmalik', name: 'Yan Ürün', icon: '🍟' },
    { id: 'icecek', name: 'İçecek', icon: '🥤' },
    { id: 'tatli', name: 'Tatlı', icon: '🍫' },
  ],
  products: DEFAULT_PRODUCTS
};

const formatPrice = (amount) => `₺${amount.toFixed(0)}`;

const KioskPage = () => {
  const [menuData, setMenuData] = useState(MENU_DATA);
  const [selectedCategory, setSelectedCategory] = useState('et-burger');
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showServiceType, setShowServiceType] = useState(false);
  const [serviceType, setServiceType] = useState(null);
  const [showTableInput, setShowTableInput] = useState(false);
  const [tableNumber, setTableNumber] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [orderNumber, setOrderNumber] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showProductNote, setShowProductNote] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productNote, setProductNote] = useState('');

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto close receipt after 15 seconds
  useEffect(() => {
    if (showReceipt) {
      const timer = setTimeout(() => {
        completeOrder();
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [showReceipt]);

  // Load menu from backend
  useEffect(() => {
    const loadMenu = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/kiosk/menu`);
        if (response.ok) {
          const data = await response.json();
          if (data.products?.length > 0) {
            setMenuData(prev => ({ ...prev, products: data.products }));
          }
        }
      } catch (e) { /* use default */ }
    };
    loadMenu();
  }, []);

  const filteredProducts = menuData.products.filter(p => p.category === selectedCategory);
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const addToCart = (product, note = '') => {
    setCart(prev => {
      // Her ürün için ayrı satır - note'u da kontrol et
      const existingIndex = prev.findIndex(item => item.id === product.id && item.note === note);
      if (existingIndex >= 0) {
        return prev.map((item, idx) => idx === existingIndex ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1, note: note }];
    });
    toast.success(`${product.name} eklendi`);
  };

  const openProductWithNote = (product) => {
    setSelectedProduct(product);
    setProductNote('');
    setShowProductNote(true);
  };

  const confirmProductAdd = () => {
    if (selectedProduct) {
      addToCart(selectedProduct, productNote);
      setShowProductNote(false);
      setSelectedProduct(null);
      setProductNote('');
    }
  };

  const updateQuantity = (itemIndex, delta) => {
    setCart(prev => prev.map((item, idx) => {
      if (idx === itemIndex) {
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
          items: cart.map(item => ({ 
            product_id: item.id, 
            product_name: item.name, 
            quantity: item.quantity, 
            unit_price: item.price, 
            total: item.price * item.quantity,
            note: item.note || ''
          })),
          total: cartTotal,
          service_type: serviceType,
          table_number: serviceType === 'masa' ? tableNumber : null,
          payment_method: method
        })
      });
      const data = response.ok ? await response.json() : null;
      setOrderNumber(data?.order_number || `${Date.now().toString().slice(-4)}`);
    } catch (e) {
      setOrderNumber(`${Date.now().toString().slice(-4)}`);
    }
    setProcessing(false);
    setShowPayment(false);
    setShowReceipt(true);
  };

  const completeOrder = () => {
    // Sayfayı yenile - yeni müşteri için temiz başlangıç
    window.location.reload();
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        {/* Mobile Header */}
        <header className="bg-zinc-900 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <img src="https://customer-assets.emergentagent.com/job_kasaburger-pos/artifacts/oruytxht_b3459348-380a-4e05-8eb6-989bd31e2066.jpeg" alt="Logo" className="h-12 w-12 object-contain" />
            <span className="text-xl font-bold text-orange-500">KASA BURGER</span>
          </div>
          {cartCount > 0 && (
            <Button onClick={() => setShowCart(true)} className="bg-orange-500 hover:bg-orange-600 px-4 py-2 text-sm gap-2">
              <ShoppingCart className="h-5 w-5" />
              <span>{cartCount}</span>
            </Button>
          )}
        </header>

        {/* Mobile Categories - Horizontal Scroll */}
        <nav className="bg-zinc-900 px-3 py-2 overflow-x-auto flex gap-2 sticky top-14 z-40 border-b border-zinc-800">
          {menuData.categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full whitespace-nowrap transition-all ${
                selectedCategory === cat.id ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              <span className="text-base">{cat.icon}</span>
              <span className="text-sm font-semibold tracking-wide">{cat.name}</span>
            </button>
          ))}
        </nav>

        {/* Mobile Products Grid */}
        <main className="flex-1 p-4 pb-28 bg-gradient-to-b from-zinc-950 to-black">
          <div className="grid grid-cols-2 gap-4">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => openProductWithNote(product)}
                className="bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-2xl overflow-hidden text-left active:scale-95 transition-all border border-zinc-800/50 shadow-xl"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  {product.is_premium && (
                    <span className="absolute top-2 right-2 bg-gradient-to-r from-yellow-500 to-amber-400 text-black text-xs font-bold px-2 py-1 rounded-full shadow-lg">PREMIUM</span>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-sm text-white tracking-wide">{product.name}</h3>
                  {product.description && (
                    <p className="text-zinc-400 text-xs mt-1 line-clamp-2">{product.description}</p>
                  )}
                  <p className="text-orange-400 font-black text-lg mt-1">{formatPrice(product.price)}</p>
                </div>
              </button>
            ))}
          </div>
        </main>

        {/* Mobile Bottom Bar */}
        {cartCount > 0 && !showCart && (
          <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 px-4 py-3 flex items-center justify-between z-50">
            <div>
              <p className="text-xs text-zinc-400">{cartCount} ürün</p>
              <p className="text-lg font-bold text-orange-500">{formatPrice(cartTotal)}</p>
            </div>
            <Button onClick={() => setShowCart(true)} className="bg-orange-500 hover:bg-orange-600 px-6 py-3 text-base rounded-xl">
              Sepete Git
            </Button>
          </div>
        )}

        {/* Cart Dialog */}
        <Dialog open={showCart} onOpenChange={setShowCart}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-[95vw] md:max-w-lg max-h-[90vh] flex flex-col rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <ShoppingCart className="h-6 w-6 text-orange-500" /> Sepetim
              </DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto py-3 space-y-3 max-h-[55vh]">
              {cart.map((item, index) => (
                <div key={`${item.id}-${index}`} className="flex gap-4 bg-zinc-800/80 p-4 rounded-xl border border-zinc-700/50">
                  <img src={item.image} alt={item.name} className="w-24 h-24 object-cover rounded-lg flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-base text-white mb-1">{item.name}</h4>
                    {item.description && (
                      <p className="text-zinc-400 text-sm leading-snug mb-2 line-clamp-2">{item.description}</p>
                    )}
                    {item.note && (
                      <p className="text-yellow-400 text-sm mb-2 flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5" /> {item.note}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-orange-500 font-black text-lg">{formatPrice(item.price * item.quantity)}</p>
                      <div className="flex items-center gap-1 bg-zinc-700 rounded-lg">
                        <Button size="icon" variant="ghost" className="h-9 w-9 hover:bg-zinc-600" onClick={() => updateQuantity(index, -1)}>
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-bold text-lg">{item.quantity}</span>
                        <Button size="icon" variant="ghost" className="h-9 w-9 hover:bg-zinc-600" onClick={() => updateQuantity(index, 1)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-zinc-800 pt-4 space-y-3">
              <div className="flex justify-between text-lg font-bold">
                <span>Toplam</span>
                <span className="text-orange-500">{formatPrice(cartTotal)}</span>
              </div>
              <Button className="w-full py-5 bg-orange-500 hover:bg-orange-600 text-base" onClick={() => { setShowCart(false); setShowServiceType(true); }}>
                Siparişi Tamamla
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Service Type Dialog - Paket/Masa Seçimi */}
        <Dialog open={showServiceType} onOpenChange={setShowServiceType}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-[90vw] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl text-center">Siparişiniz Nasıl Olsun?</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-4">
              <Button 
                className="w-full py-10 text-lg bg-blue-600 hover:bg-blue-700 flex flex-col gap-2" 
                onClick={() => { setServiceType('paket'); setShowServiceType(false); setShowPayment(true); }}
              >
                <Package className="h-12 w-12" />
                <span className="text-xl font-bold">Paket Servis</span>
              </Button>
              <Button 
                className="w-full py-10 text-lg bg-green-600 hover:bg-green-700 flex flex-col gap-2" 
                onClick={() => { setServiceType('masa'); setShowServiceType(false); setShowTableInput(true); }}
              >
                <UtensilsCrossed className="h-12 w-12" />
                <span className="text-xl font-bold">Masaya Servis</span>
              </Button>
              <Button variant="outline" className="w-full mt-2" onClick={() => { setShowServiceType(false); setShowCart(true); }}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Geri
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Product Note Dialog - Ürün Not Ekleme */}
        <Dialog open={showProductNote} onOpenChange={setShowProductNote}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-[95vw] md:max-w-lg rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl text-center flex items-center justify-center gap-2">
                <MessageSquare className="h-5 w-5 text-orange-500" />
                Ürün Ekle
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {selectedProduct && (
                <div className="bg-zinc-800/80 p-4 rounded-xl border border-zinc-700/50">
                  <div className="flex gap-4">
                    <img src={selectedProduct.image} alt={selectedProduct.name} className="w-32 h-32 object-cover rounded-xl flex-shrink-0 shadow-lg" />
                    <div className="flex-1 flex flex-col justify-center">
                      <h3 className="font-bold text-xl text-white mb-2">{selectedProduct.name}</h3>
                      <p className="text-orange-500 font-black text-2xl">{formatPrice(selectedProduct.price)}</p>
                    </div>
                  </div>
                  {selectedProduct.description && (
                    <div className="mt-4 pt-3 border-t border-zinc-700">
                      <p className="text-zinc-300 text-sm leading-relaxed">
                        <span className="text-orange-400 font-medium">İçindekiler: </span>
                        {selectedProduct.description}
                      </p>
                    </div>
                  )}
                </div>
              )}
              <div>
                <label className="text-sm text-zinc-400 mb-2 block">Ekstra istek veya çıkarılacak malzeme:</label>
                <textarea
                  value={productNote}
                  onChange={(e) => setProductNote(e.target.value)}
                  placeholder="Örn: Soğansız, Ekstra sos, Az acılı..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-base resize-none"
                  rows={3}
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 py-5 text-base" onClick={() => { addToCart(selectedProduct, ''); setShowProductNote(false); }}>
                  Notsuz Ekle
                </Button>
                <Button className="flex-1 py-5 text-base bg-orange-500 hover:bg-orange-600" onClick={confirmProductAdd}>
                  Sepete Ekle
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Table Number Dialog */}
        <Dialog open={showTableInput} onOpenChange={setShowTableInput}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-[90vw] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl text-center">Masa Numarası</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-center text-zinc-400 text-sm">Lütfen masa numaranızı girin</p>
              <input
                type="text"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="Örn: 5"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-4 text-center text-2xl font-bold"
                autoFocus
              />
              <Button className="w-full py-5 bg-orange-500 hover:bg-orange-600 text-base" onClick={() => { setShowTableInput(false); setShowPayment(true); }}>
                Devam Et
              </Button>
              <Button variant="outline" className="w-full" onClick={() => { setShowTableInput(false); setShowServiceType(true); }}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Geri
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Payment Dialog */}
        <Dialog open={showPayment} onOpenChange={setShowPayment}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-[90vw] rounded-2xl">
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
                <div className="text-center py-4 bg-zinc-800 rounded-xl">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {serviceType === 'paket' ? <Package className="h-5 w-5 text-blue-400" /> : <UtensilsCrossed className="h-5 w-5 text-green-400" />}
                    <span className="text-sm text-zinc-300">{serviceType === 'paket' ? 'Paket Servis' : `Masa: ${tableNumber}`}</span>
                  </div>
                  <p className="text-3xl font-bold text-orange-500">{formatPrice(cartTotal)}</p>
                </div>
                <Button className="w-full py-6 text-base bg-blue-600 hover:bg-blue-700" onClick={() => processPayment('card')}>
                  <CreditCard className="h-5 w-5 mr-3" /> Kredi Kartı ile Öde
                </Button>
                <Button variant="outline" className="w-full" onClick={() => { setShowPayment(false); serviceType === 'paket' ? setShowServiceType(true) : setShowTableInput(true); }}>
                  <ArrowLeft className="h-4 w-4 mr-2" /> Geri
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Receipt Dialog */}
        <Dialog open={showReceipt} onOpenChange={() => {}}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-[90vw] rounded-2xl [&>button]:hidden">
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-green-500">Sipariş Alındı!</h2>
              <p className="text-zinc-400 text-sm mt-1">Siparişiniz hazırlanıyor</p>
            </div>
            <div className="bg-white text-black p-4 rounded-xl text-center">
              <p className="text-xs text-zinc-500">Sipariş No</p>
              <p className="text-4xl font-bold text-orange-500 my-2">{orderNumber}</p>
              <div className="flex items-center justify-center gap-2 text-sm text-zinc-600">
                {serviceType === 'paket' ? <Package className="h-4 w-4" /> : <UtensilsCrossed className="h-4 w-4" />}
                <span>{serviceType === 'paket' ? 'Paket Servis' : `Masa: ${tableNumber}`}</span>
              </div>
              <div className="mt-3 pt-3 border-t border-dashed text-left space-y-1 text-sm">
                {cart.map((item, index) => (
                  <div key={`${item.id}-${index}`}>
                    <div className="flex justify-between">
                      <span>{item.quantity}x {item.name}</span>
                      <span>{formatPrice(item.price * item.quantity)}</span>
                    </div>
                    {item.note && (
                      <p className="text-xs text-orange-600 ml-4">📝 {item.note}</p>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-dashed flex justify-between font-bold">
                <span>TOPLAM</span>
                <span>{formatPrice(cartTotal)}</span>
              </div>
            </div>
            <Button className="w-full py-6 bg-orange-500 hover:bg-orange-600 text-lg mt-2 animate-pulse" onClick={completeOrder}>
              ✓ TAMAM - Yeni Sipariş
            </Button>
            <p className="text-center text-xs text-zinc-500">Ekran 15 saniye sonra otomatik kapanacak</p>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Desktop Layout (Kiosk Screen)
  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-zinc-900 px-8 py-4 flex items-center justify-between border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <img src="https://customer-assets.emergentagent.com/job_kasaburger-pos/artifacts/oruytxht_b3459348-380a-4e05-8eb6-989bd31e2066.jpeg" alt="Logo" className="h-16 w-16 object-contain" />
          <span className="text-3xl font-bold text-orange-500 tracking-wide">KASA BURGER</span>
        </div>
        {cartCount > 0 && (
          <Button onClick={() => setShowCart(true)} className="bg-orange-500 hover:bg-orange-600 px-6 py-4 text-lg gap-3 rounded-xl">
            <ShoppingCart className="h-6 w-6" />
            <span>{cartCount} Ürün</span>
            <span className="font-bold">{formatPrice(cartTotal)}</span>
          </Button>
        )}
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Categories Sidebar */}
        <nav className="w-40 bg-zinc-900 flex flex-col border-r border-zinc-800">
          <div className="px-4 py-3 border-b border-zinc-800">
            <span className="text-sm font-bold text-white">Kategoriler</span>
          </div>
          {menuData.categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-3 py-3 px-4 transition-all text-left ${
                selectedCategory === cat.id 
                  ? 'bg-orange-500 text-white' 
                  : 'text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              <span className="text-lg">{cat.icon}</span>
              <span className="text-sm font-medium">{cat.name}</span>
            </button>
          ))}
        </nav>

        {/* Products Grid */}
        <main className="flex-1 p-6 overflow-y-auto bg-zinc-950">
          <h2 className="text-2xl font-bold text-orange-500 mb-6">{menuData.categories.find(c => c.id === selectedCategory)?.name || 'Ürünler'}</h2>
          <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => openProductWithNote(product)}
                className="group bg-zinc-900 rounded-2xl overflow-hidden text-left transition-all hover:ring-2 hover:ring-orange-500 active:scale-95 shadow-lg"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  {product.is_premium && (
                    <span className="absolute top-3 right-3 bg-gradient-to-r from-yellow-500 to-amber-400 text-black text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                      👑 Premium
                    </span>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-base text-white leading-tight mb-2">{product.name}</h3>
                  {product.description && (
                    <p className="text-zinc-400 text-sm leading-relaxed mb-3 line-clamp-3">{product.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-orange-500 font-black text-xl">₺{product.price.toLocaleString('tr-TR')}</p>
                    <span className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:bg-orange-400 transition-colors">+</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </main>
      </div>

      {/* Bottom Bar */}
      {cartCount > 0 && !showCart && (
        <div className="bg-gradient-to-r from-zinc-900 to-zinc-950 border-t border-zinc-800 px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-orange-500/20 rounded-xl flex items-center justify-center">
              <ShoppingCart className="h-7 w-7 text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-400 font-medium">{cartCount} ürün</p>
              <p className="text-2xl font-black text-orange-400">{formatPrice(cartTotal)}</p>
            </div>
          </div>
          <Button onClick={() => setShowCart(true)} className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 px-12 py-6 text-lg rounded-xl shadow-lg shadow-orange-500/20 font-bold">
            Siparişi Tamamla
          </Button>
        </div>
      )}

      {/* Desktop Dialogs - Same as mobile but larger */}
      <Dialog open={showCart} onOpenChange={setShowCart}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-orange-500" /> Sepetim
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-2 space-y-2">
            {cart.map((item, index) => (
              <div key={`${item.id}-${index}`} className="flex items-center gap-3 bg-zinc-800 p-3 rounded-lg">
                <img src={item.image} alt={item.name} className="w-14 h-14 object-cover rounded" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{item.name}</h4>
                  {item.note && (
                    <p className="text-xs text-yellow-400 truncate">📝 {item.note}</p>
                  )}
                  <p className="text-orange-500 font-bold">{formatPrice(item.price * item.quantity)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => updateQuantity(index, -1)}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-6 text-center font-bold">{item.quantity}</span>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => updateQuantity(index, 1)}>
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

      {/* Service Type Dialog - Desktop */}
      <Dialog open={showServiceType} onOpenChange={setShowServiceType}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl text-center">Siparişiniz Nasıl Olsun?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <Button 
              className="w-full py-8 text-lg bg-blue-600 hover:bg-blue-700 flex flex-col gap-2" 
              onClick={() => { setServiceType('paket'); setShowServiceType(false); setShowPayment(true); }}
            >
              <Package className="h-10 w-10" />
              <span className="font-bold">Paket Servis</span>
            </Button>
            <Button 
              className="w-full py-8 text-lg bg-green-600 hover:bg-green-700 flex flex-col gap-2" 
              onClick={() => { setServiceType('masa'); setShowServiceType(false); setShowTableInput(true); }}
            >
              <UtensilsCrossed className="h-10 w-10" />
              <span className="font-bold">Masaya Servis</span>
            </Button>
            <Button variant="outline" className="w-full" onClick={() => { setShowServiceType(false); setShowCart(true); }}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Geri
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showTableInput} onOpenChange={setShowTableInput}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl text-center">Masa Numarası</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <input
              type="text"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="Masa No"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-4 text-center text-2xl font-bold"
            />
            <Button className="w-full py-6 bg-orange-500 hover:bg-orange-600" onClick={() => { setShowTableInput(false); setShowPayment(true); }}>
              Devam Et
            </Button>
            <Button variant="outline" className="w-full" onClick={() => { setShowTableInput(false); setShowServiceType(true); }}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Geri
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Note Dialog - Desktop */}
      <Dialog open={showProductNote} onOpenChange={setShowProductNote}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl text-center flex items-center justify-center gap-2">
              <MessageSquare className="h-5 w-5 text-orange-500" />
              {selectedProduct?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedProduct && (
              <div className="flex items-center gap-3 bg-zinc-800 p-3 rounded-xl">
                <img src={selectedProduct.image} alt={selectedProduct.name} className="w-20 h-20 object-cover rounded-lg" />
                <div>
                  <p className="font-bold text-lg">{selectedProduct.name}</p>
                  <p className="text-orange-500 font-bold text-xl">{formatPrice(selectedProduct.price)}</p>
                </div>
              </div>
            )}
            <div>
              <label className="text-sm text-zinc-400 mb-2 block">Ekstra istek veya çıkarılacak malzeme:</label>
              <textarea
                value={productNote}
                onChange={(e) => setProductNote(e.target.value)}
                placeholder="Örn: Soğansız, Ekstra sos, Az acılı..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-base resize-none"
                rows={3}
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 py-4" onClick={() => { addToCart(selectedProduct, ''); setShowProductNote(false); }}>
                Notsuz Ekle
              </Button>
              <Button className="flex-1 py-4 bg-orange-500 hover:bg-orange-600" onClick={confirmProductAdd}>
                Sepete Ekle
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
                <div className="flex items-center justify-center gap-2 mb-2">
                  {serviceType === 'paket' ? <Package className="h-5 w-5 text-blue-400" /> : <UtensilsCrossed className="h-5 w-5 text-green-400" />}
                  <span className="text-sm text-zinc-300">{serviceType === 'paket' ? 'Paket Servis' : `Masa: ${tableNumber}`}</span>
                </div>
                <p className="text-4xl font-bold text-orange-500">{formatPrice(cartTotal)}</p>
              </div>
              <Button className="w-full py-8 text-lg bg-blue-600 hover:bg-blue-700" onClick={() => processPayment('card')}>
                <CreditCard className="h-6 w-6 mr-3" /> Kredi Kartı ile Öde
              </Button>
              <Button variant="outline" className="w-full" onClick={() => { setShowPayment(false); serviceType === 'paket' ? setShowServiceType(true) : setShowTableInput(true); }}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Geri
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
            <div className="flex items-center justify-center gap-2 text-sm text-zinc-600 mb-2">
              {serviceType === 'paket' ? <Package className="h-4 w-4" /> : <UtensilsCrossed className="h-4 w-4" />}
              <span>{serviceType === 'paket' ? 'Paket Servis' : `Masa: ${tableNumber}`}</span>
            </div>
            <p className="text-xs text-zinc-400">{new Date().toLocaleString('tr-TR')}</p>
            <div className="mt-4 pt-4 border-t border-dashed text-left space-y-1">
              {cart.map((item, index) => (
                <div key={`${item.id}-${index}`}>
                  <div className="flex justify-between text-sm">
                    <span>{item.quantity}x {item.name}</span>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                  {item.note && (
                    <p className="text-xs text-orange-600 ml-4">📝 {item.note}</p>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-dashed flex justify-between font-bold">
              <span>TOPLAM</span>
              <span>{formatPrice(cartTotal)}</span>
            </div>
          </div>
          <Button className="w-full py-6 bg-orange-500 hover:bg-orange-600 text-lg mt-2 animate-pulse" onClick={completeOrder}>
            ✓ TAMAM - Yeni Sipariş
          </Button>
          <p className="text-center text-xs text-zinc-500">Ekran 15 saniye sonra otomatik kapanacak</p>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KioskPage;
