// KioskPage v2.1 - Updated: 2026-01-18 - Cloudinary görselleri eklendi
import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, ArrowLeft, CheckCircle, Package, UtensilsCrossed, Smartphone, MessageSquare } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const DEFAULT_PRODUCTS = [
  // ET BURGER - Cloudinary görselleri
  {id: "kasa-classic", name: "Kasa Classic Burger", category: "Et Burger", price: 460, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719627/kasaburger/products/lxmwj2opjfgpn5wfyvni.jpg"},
  {id: "golden-burger", name: "Golden Burger", category: "Et Burger", price: 1190, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719644/kasaburger/products/etnwv98b4qqa3dhs7j5w.jpg", is_premium: true},
  {id: "cheese-lover", name: "Cheese Lover Burger", category: "Et Burger", price: 560, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719667/kasaburger/products/c2kdofwltpm4xsrcheuu.jpg"},
  {id: "no7-burger", name: "No:7 Burger", category: "Et Burger", price: 540, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719690/kasaburger/products/dvqjrymmcqtfjxiuc29z.jpg"},
  {id: "hirsiz-polis", name: "Hırsız & Polis Burger", category: "Et Burger", price: 490, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719731/kasaburger/products/zo9ysvxshviqu7pbqztq.jpg"},
  // PREMIUM GOURMET
  {id: "viking-burger", name: "Viking Burger", category: "Premium", price: 430, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719764/kasaburger/products/fojwkaq08bwngprupkgt.jpg", is_premium: true},
  {id: "milano-burger", name: "Milano Burger", category: "Premium", price: 440, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719790/kasaburger/products/oybw8jxjs53wleejjeen.jpg", is_premium: true},
  {id: "kasa-double-xl", name: "Kasa Double XL", category: "Premium", price: 640, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719837/kasaburger/products/e5erpcna8ufgyl4roxhh.jpg", is_premium: true},
  {id: "smoky-bbq", name: "Smoky BBQ Burger", category: "Premium", price: 560, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719856/kasaburger/products/zx1kw1d23traidkigrdv.jpg", is_premium: true},
  {id: "animal-style", name: "Animal Style Burger", category: "Premium", price: 550, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719882/kasaburger/products/sdgw0vm1iicwkjvvkeee.jpg", is_premium: true},
  // TAVUK BURGER
  {id: "crispy-chicken", name: "Crispy Chicken Burger", category: "Tavuk", price: 360, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719954/kasaburger/products/xobrshlgrwd4opojrmum.jpg"},
  {id: "double-crispy", name: "Double Crispy Chicken", category: "Tavuk", price: 410, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719978/kasaburger/products/ronl4qic10vbgjictclt.jpg"},
  {id: "animal-chicken", name: "Animal Style Chicken", category: "Tavuk", price: 430, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720009/kasaburger/products/lpmkvz6bhfewl5pgskic.jpg"},
  {id: "spicy-hirsiz", name: "(Spicy) Hırsız Burger", category: "Tavuk", price: 420, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720039/kasaburger/products/bvxcrizznvjaqjvxlucu.jpg"},
  {id: "sweet-polis", name: "(Sweet) Polis Burger", category: "Tavuk", price: 420, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720071/kasaburger/products/w50qmsz041zi7h4pjkwu.jpg"},
  {id: "milano-chicken", name: "Milano Chicken Burger", category: "Tavuk", price: 440, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720100/kasaburger/products/tfrehnmtr9juqankalhj.jpg"},
  {id: "viking-chicken", name: "Viking Chicken Burger", category: "Tavuk", price: 430, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720128/kasaburger/products/qwg6eqpyimd8dpn9nr1v.jpg"},
  // ATISTIRMALIKLAR
  {id: "mac-cheese", name: "Mac and Cheese Topları", category: "Yan Ürün", price: 170, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720160/kasaburger/products/jnzrcojxzkdrgb5u2exk.jpg"},
  {id: "mozarella-sticks", name: "Mozarella Sticks", category: "Yan Ürün", price: 210, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720187/kasaburger/products/kvsrbiutiqdqhoolov8z.jpg"},
  {id: "sogan-halkasi", name: "Soğan Halkası", category: "Yan Ürün", price: 180, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720212/kasaburger/products/ujatmwdny3it8dzcikkn.jpg"},
  {id: "cheese-fries", name: "Prison Cheese Lover Fries", category: "Yan Ürün", price: 150, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720240/kasaburger/products/dzxb0lv41xafeybynhri.jpg"},
  {id: "truffle-fries", name: "Prison Truffle Fries", category: "Yan Ürün", price: 175, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720258/kasaburger/products/cj3px5epr92okzergc7c.jpg"},
  {id: "cajun-fries", name: "Prison Hot Lockdown Fries", category: "Yan Ürün", price: 160, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720282/kasaburger/products/csdwzqwozldfxxt7pkpr.jpg"},
  // İÇECEKLER
  {id: "ayran", name: "Ayran", category: "İçecek", price: 35, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720311/kasaburger/products/xgrn8fvph9jaeh1bqwat.jpg"},
  {id: "su", name: "Su", category: "İçecek", price: 20, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720333/kasaburger/products/jl2q8smtq7de6lh16uul.jpg"},
  {id: "limonata", name: "Limonata", category: "İçecek", price: 55, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720355/kasaburger/products/exyjmazfyp4hyx2hbxsu.jpg"},
  {id: "pepsi", name: "Pepsi", category: "İçecek", price: 45, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720380/kasaburger/products/zu98squbgxxa0hppmxwn.jpg"},
  {id: "milkshake", name: "Milkshake", category: "İçecek", price: 85, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720424/kasaburger/products/uitufnzpxr7fatrttobr.jpg"},
  // TATLILAR
  {id: "choco-bomb", name: "Kasa Choco Bomb", category: "Tatlı", price: 200, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768687930/kasaburger/products/ohr3dgedrnaz53p8p26t.jpg"},
  {id: "churros", name: "Churros", category: "Tatlı", price: 180, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768686916/kasaburger/products/yveoyknzrq0w0kuwxxvq.jpg"},
  {id: "oreo-dream", name: "Oreo Dream Cup", category: "Tatlı", price: 220, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768686685/kasaburger/products/ktej7vqaqnm2qt5fjnce.jpg"},
];

const MENU_DATA = {
  categories: [
    { id: 'Et Burger', name: 'Burger', icon: '🍔' },
    { id: 'Premium', name: 'Premium', icon: '👑' },
    { id: 'Tavuk', name: 'Tavuk', icon: '🍗' },
    { id: 'Yan Ürün', name: 'Yan Ürün', icon: '🍟' },
    { id: 'İçecek', name: 'İçecek', icon: '🥤' },
    { id: 'Tatlı', name: 'Tatlı', icon: '🍫' },
  ],
  products: DEFAULT_PRODUCTS
};

const formatPrice = (amount) => `₺${amount.toFixed(0)}`;

const KioskPage = () => {
  const [menuData, setMenuData] = useState(MENU_DATA);
  const [selectedCategory, setSelectedCategory] = useState('Et Burger');
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
  
  // Combo ve Promosyon State'leri
  const [combos, setCombos] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [showCombos, setShowCombos] = useState(false);
  const [activePromoIndex, setActivePromoIndex] = useState(0);

  // Sadakat Programı State'leri
  const [showLoyalty, setShowLoyalty] = useState(false);
  const [loyaltyPhone, setLoyaltyPhone] = useState('');
  const [loyaltyMember, setLoyaltyMember] = useState(null);
  const [loyaltyRewards, setLoyaltyRewards] = useState([]);
  const [loyaltyConfig, setLoyaltyConfig] = useState(null);
  const [showRewards, setShowRewards] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(null);
  
  // Referans Sistemi State'leri
  const [referralCode, setReferralCode] = useState('');
  const [referralInfo, setReferralInfo] = useState(null);
  const [showReferral, setShowReferral] = useState(false);
  const [referralInput, setReferralInput] = useState('');
  
  // Doğum Günü State'leri
  const [birthdayStatus, setBirthdayStatus] = useState(null);
  const [showBirthdayInput, setShowBirthdayInput] = useState(false);
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');

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

  // Load menu from backend with auto-refresh
  useEffect(() => {
    const loadMenu = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/kiosk/products`);
        if (response.ok) {
          const data = await response.json();
          if (data?.length > 0) {
            setMenuData(prev => ({ ...prev, products: data }));
            
            // Kategorileri ürünlerden çıkar
            const uniqueCategories = [...new Set(data.map(p => p.category).filter(Boolean))];
            const categoryIcons = {
              'Et Burger': '🍔', 'Premium': '👑', 'Tavuk': '🍗',
              'Yan Ürün': '🍟', 'İçecek': '🥤', 'Tatlı': '🍫'
            };
            const categories = uniqueCategories.map(cat => ({
              id: cat,
              name: cat,
              icon: categoryIcons[cat] || '📦'
            }));
            if (categories.length > 0) {
              setMenuData(prev => ({ ...prev, categories }));
              // İlk kategoriyi seç
              if (!uniqueCategories.includes(selectedCategory)) {
                setSelectedCategory(uniqueCategories[0]);
              }
            }
          }
        }
      } catch (e) { 
        console.log('Using default menu');
      }
    };
    
    // İlk yükleme
    loadMenu();
    
    // Her 10 saniyede kontrol et (anlık güncelleme için)
    const interval = setInterval(loadMenu, 10000);
    
    return () => clearInterval(interval);
  }, [selectedCategory]);

  // Combo ve Promosyon yükleme
  useEffect(() => {
    const loadCombosAndPromos = async () => {
      try {
        const [combosRes, promosRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/kiosk/combos`),
          fetch(`${BACKEND_URL}/api/kiosk/promotions`)
        ]);
        
        if (combosRes.ok) {
          const combosData = await combosRes.json();
          setCombos(combosData || []);
        }
        
        if (promosRes.ok) {
          const promosData = await promosRes.json();
          setPromotions(promosData || []);
        }
      } catch (e) {
        console.log('Combo/Promo yüklenemedi');
      }
    };
    
    loadCombosAndPromos();
    const interval = setInterval(loadCombosAndPromos, 30000);
    return () => clearInterval(interval);
  }, []);

  // Sadakat programı verilerini yükle
  useEffect(() => {
    const loadLoyaltyData = async () => {
      try {
        const [rewardsRes, configRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/kiosk/loyalty/rewards`),
          fetch(`${BACKEND_URL}/api/kiosk/loyalty/config`)
        ]);
        
        if (rewardsRes.ok) {
          const rewardsData = await rewardsRes.json();
          setLoyaltyRewards(rewardsData || []);
        }
        
        if (configRes.ok) {
          const configData = await configRes.json();
          setLoyaltyConfig(configData);
        }
      } catch (e) {
        console.log('Sadakat verileri yüklenemedi');
      }
    };
    
    loadLoyaltyData();
  }, []);

  // Promosyon banner rotasyonu
  useEffect(() => {
    if (promotions.length > 1) {
      const interval = setInterval(() => {
        setActivePromoIndex(prev => (prev + 1) % promotions.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [promotions.length]);

  const filteredProducts = menuData.products.filter(p => p.category === selectedCategory);
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Combo sepete ekleme
  const addComboToCart = (combo) => {
    const comboProducts = combo.products.map(pid => menuData.products.find(p => p.id === pid)).filter(Boolean);
    
    // Hediye ürün varsa ekle
    let giftInfo = null;
    if (combo.gift_product_id) {
      const giftProduct = menuData.products.find(p => p.id === combo.gift_product_id);
      giftInfo = {
        id: combo.gift_product_id,
        name: combo.gift_product_name || giftProduct?.name || 'Hediye Ürün',
        message: combo.gift_message || '🎁 Hediye!'
      };
    }
    
    const comboItem = {
      id: `combo-${combo.id}-${Date.now()}`,
      name: combo.name,
      price: combo.combo_price,
      quantity: 1,
      isCombo: true,
      comboProducts: comboProducts.map(p => p.name),
      giftProduct: giftInfo,
      note: ''
    };
    setCart(prev => [...prev, comboItem]);
    
    if (giftInfo) {
      toast.success(`${combo.name} sepete eklendi! ${giftInfo.message}`, { duration: 3000 });
    } else {
      toast.success(`${combo.name} sepete eklendi! 🎉`);
    }
    setShowCombos(false);
  };

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

  // Sadakat üye arama
  const lookupLoyaltyMember = async () => {
    if (loyaltyPhone.length < 10) {
      toast.error('Geçerli bir telefon numarası girin');
      return;
    }
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/kiosk/loyalty/member/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: loyaltyPhone })
      });
      
      if (response.ok) {
        const data = await response.json();
        setLoyaltyMember(data);
        
        if (data.is_new) {
          toast.success(`Hoşgeldiniz! ${data.welcome_bonus || 50} bonus puan kazandınız! 🎉`, { duration: 4000 });
        } else {
          toast.success(`Tekrar hoşgeldiniz ${data.member.name || ''}! ${data.member.total_points} puanınız var.`);
        }
      } else {
        toast.error('Üyelik bulunamadı');
      }
    } catch (e) {
      toast.error('Bağlantı hatası');
    }
  };

  // Ödül kullan
  const redeemReward = async (reward) => {
    if (!loyaltyMember?.member) {
      toast.error('Önce telefon numaranızı girin');
      return;
    }
    
    if (loyaltyMember.member.total_points < reward.points_required) {
      toast.error(`Bu ödül için ${reward.points_required - loyaltyMember.member.total_points} puan daha gerekli`);
      return;
    }
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/kiosk/loyalty/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: loyaltyMember.member.phone, 
          reward_id: reward.id 
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Ödülü sepete ekle (ücretsiz olarak)
        if (reward.reward_type === 'free_product') {
          const freeProduct = menuData.products.find(p => p.id === reward.reward_value);
          if (freeProduct) {
            setCart(prev => [...prev, { 
              ...freeProduct, 
              quantity: 1, 
              price: 0, 
              isReward: true,
              note: `🎁 Sadakat Ödülü: ${reward.name}`
            }]);
          }
        }
        
        // Üye bilgisini güncelle
        setLoyaltyMember(prev => ({
          ...prev,
          member: { ...prev.member, total_points: data.new_total }
        }));
        
        toast.success(`🎁 ${reward.name} ödülünüz sepete eklendi!`);
        setShowRewards(false);
      } else {
        toast.error('Ödül kullanılamadı');
      }
    } catch (e) {
      toast.error('Bağlantı hatası');
    }
  };

  // Sipariş sonrası puan kazan
  const earnLoyaltyPoints = async (orderId) => {
    if (!loyaltyMember?.member) return;
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/kiosk/loyalty/earn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: loyaltyMember.member.phone,
          order_total: cartTotal,
          order_id: orderId
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setEarnedPoints(data);
      }
    } catch (e) {
      console.log('Puan kazanma hatası');
    }
  };

  // Referans kodu getir
  const loadReferralCode = async () => {
    if (!loyaltyMember?.member?.phone) return;
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/kiosk/loyalty/member/${loyaltyMember.member.phone}/referral-code`);
      if (response.ok) {
        const data = await response.json();
        setReferralInfo(data);
      }
    } catch (e) {
      console.log('Referans kodu yüklenemedi');
    }
  };

  // Referans kodu uygula
  const applyReferralCode = async () => {
    if (!loyaltyMember?.member?.phone || !referralInput.trim()) {
      toast.error('Lütfen geçerli bir referans kodu girin');
      return;
    }
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/kiosk/loyalty/member/apply-referral`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: loyaltyMember.member.phone,
          referral_code: referralInput.trim().toUpperCase()
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || `🎉 ${data.bonus_earned} puan kazandınız!`, { duration: 4000 });
        
        // Üye bilgisini güncelle
        setLoyaltyMember(prev => ({
          ...prev,
          member: { ...prev.member, total_points: prev.member.total_points + data.bonus_earned }
        }));
        
        setReferralInput('');
        setShowReferral(false);
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Referans kodu uygulanamadı');
      }
    } catch (e) {
      toast.error('Bağlantı hatası');
    }
  };

  // Doğum günü durumunu kontrol et
  const checkBirthdayStatus = async () => {
    if (!loyaltyMember?.member?.phone) return;
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/kiosk/loyalty/member/${loyaltyMember.member.phone}/birthday-status`);
      if (response.ok) {
        const data = await response.json();
        setBirthdayStatus(data);
      }
    } catch (e) {
      console.log('Doğum günü durumu alınamadı');
    }
  };

  // Doğum günü kaydet
  const saveBirthday = async () => {
    if (!birthMonth || !birthDay) {
      toast.error('Lütfen ay ve gün seçin');
      return;
    }
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/kiosk/loyalty/member/set-birthday`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: loyaltyMember.member.phone,
          birth_date: `${birthMonth}-${birthDay}`
        })
      });
      
      if (response.ok) {
        toast.success('Doğum günü kaydedildi! 🎂');
        setShowBirthdayInput(false);
        checkBirthdayStatus();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Kayıt başarısız');
      }
    } catch (e) {
      toast.error('Bağlantı hatası');
    }
  };

  // Doğum günü bonusunu al
  const claimBirthdayBonus = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/kiosk/loyalty/member/claim-birthday-bonus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: loyaltyMember.member.phone })
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success(data.message, { duration: 5000 });
        
        // Ücretsiz burger'ı sepete ekle
        if (data.free_product_id) {
          const freeProduct = menuData.products.find(p => p.id === data.free_product_id);
          if (freeProduct) {
            setCart(prev => [...prev, {
              ...freeProduct,
              quantity: 1,
              price: 0,
              isReward: true,
              isBirthdayGift: true,
              note: '🎂 Doğum Günü Hediyesi'
            }]);
          }
        }
        
        // Puanları güncelle
        setLoyaltyMember(prev => ({
          ...prev,
          member: { ...prev.member, total_points: data.new_total_points }
        }));
        
        // Durumu güncelle
        setBirthdayStatus(prev => ({
          ...prev,
          can_claim_bonus: false,
          already_claimed_this_year: true
        }));
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Bonus alınamadı');
      }
    } catch (e) {
      toast.error('Bağlantı hatası');
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
            note: item.note || '',
            isReward: item.isReward || false
          })),
          total: cartTotal,
          service_type: serviceType,
          table_number: serviceType === 'masa' ? tableNumber : null,
          payment_method: method,
          loyalty_phone: loyaltyMember?.member?.phone || null
        })
      });
      const data = response.ok ? await response.json() : null;
      const newOrderNumber = data?.order_number || `${Date.now().toString().slice(-4)}`;
      setOrderNumber(newOrderNumber);
      
      // Sadakat puanı kazan
      if (loyaltyMember?.member) {
        await earnLoyaltyPoints(data?.id || newOrderNumber);
      }
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
                      <span>{item.isReward ? '🎁 Hediye' : formatPrice(item.price * item.quantity)}</span>
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
              
              {/* Kazanılan Puanlar */}
              {earnedPoints && (
                <div className="mt-3 pt-3 border-t border-dashed bg-gradient-to-r from-yellow-500/10 to-orange-500/10 -mx-4 px-4 py-3">
                  <p className="text-sm font-bold text-orange-600 mb-1">🎉 Tebrikler! Puan Kazandınız</p>
                  <div className="flex justify-between text-sm">
                    <span>Kazanılan Puan:</span>
                    <span className="font-bold text-green-600">+{earnedPoints.total_earned}</span>
                  </div>
                  {earnedPoints.bonus_points > 0 && (
                    <p className="text-xs text-orange-500">({earnedPoints.base_points} + {earnedPoints.bonus_points} bonus)</p>
                  )}
                  <div className="flex justify-between text-sm mt-1">
                    <span>Toplam Puanınız:</span>
                    <span className="font-bold">{earnedPoints.new_total}</span>
                  </div>
                  {earnedPoints.tier_upgraded && (
                    <p className="text-sm font-bold text-purple-600 mt-2 animate-pulse">
                      🎊 {earnedPoints.tier_info?.name} seviyesine yükseldiniz!
                    </p>
                  )}
                </div>
              )}
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
        <div className="flex items-center gap-4">
          {/* Sadakat Programı Butonu */}
          <Button 
            onClick={() => setShowLoyalty(true)} 
            className={`px-6 py-4 text-lg gap-2 rounded-xl ${
              loyaltyMember 
                ? 'bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700' 
                : 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700'
            }`}
          >
            {loyaltyMember ? (
              <>
                {loyaltyConfig?.tiers?.[loyaltyMember.member?.tier]?.icon || '🥉'} 
                <span>{loyaltyMember.member?.total_points || 0} Puan</span>
              </>
            ) : (
              <>⭐ Puan Kazan</>
            )}
          </Button>
          
          {/* Combo Menü Butonu */}
          {combos.length > 0 && (
            <Button 
              onClick={() => setShowCombos(true)} 
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 px-6 py-4 text-lg gap-2 rounded-xl"
            >
              🎁 Menüler
              <span className="bg-white/20 px-2 py-0.5 rounded text-sm">%{Math.round(combos[0]?.discount_percent || 15)} İndirim</span>
            </Button>
          )}
          {cartCount > 0 && (
            <Button onClick={() => setShowCart(true)} className="bg-orange-500 hover:bg-orange-600 px-6 py-4 text-lg gap-3 rounded-xl">
              <ShoppingCart className="h-6 w-6" />
              <span>{cartCount} Ürün</span>
              <span className="font-bold">{formatPrice(cartTotal)}</span>
            </Button>
          )}
        </div>
      </header>

      {/* Promosyon Banner */}
      {promotions.length > 0 && (
        <div 
          className="px-8 py-3 flex items-center justify-center gap-4 transition-all duration-500"
          style={{ backgroundColor: promotions[activePromoIndex]?.banner_color || '#FF6B00' }}
        >
          <span className="text-2xl">🔥</span>
          <div className="text-center">
            <span className="font-bold text-lg">{promotions[activePromoIndex]?.title}</span>
            <span className="ml-3 text-white/90">{promotions[activePromoIndex]?.description}</span>
          </div>
          {promotions.length > 1 && (
            <div className="flex gap-1 ml-4">
              {promotions.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`w-2 h-2 rounded-full transition-all ${idx === activePromoIndex ? 'bg-white w-4' : 'bg-white/40'}`} 
                />
              ))}
            </div>
          )}
        </div>
      )}

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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => openProductWithNote(product)}
                className="group bg-zinc-900 rounded-2xl overflow-hidden text-left transition-all hover:ring-2 hover:ring-orange-500 active:scale-[0.98] shadow-lg flex flex-col h-full"
              >
                {/* Görsel Alanı - Sabit oran */}
                <div className="relative w-full aspect-square overflow-hidden bg-zinc-800">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                  />
                  {product.is_premium && (
                    <span className="absolute top-3 right-3 bg-gradient-to-r from-yellow-500 to-amber-400 text-black text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                      👑 Premium
                    </span>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>
                {/* İçerik Alanı */}
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-bold text-base text-white leading-tight mb-2 line-clamp-2">{product.name}</h3>
                  {product.description && (
                    <p className="text-zinc-400 text-sm leading-snug mb-3 line-clamp-2 flex-1">{product.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-auto pt-2">
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
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-orange-500" /> Sepetim
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-3 space-y-3">
            {cart.map((item, index) => (
              <div key={`${item.id}-${index}`} className="flex gap-4 bg-zinc-800/80 p-4 rounded-xl border border-zinc-700/50">
                <img src={item.image} alt={item.name} className="w-24 h-24 object-cover rounded-lg flex-shrink-0" onError={(e) => { e.target.src = 'https://via.placeholder.com/96?text=Combo'; }} />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-base text-white mb-1">
                    {item.isCombo && <span className="text-green-400 mr-1">🎁</span>}
                    {item.name}
                  </h4>
                  {item.isCombo && item.comboProducts && (
                    <p className="text-zinc-400 text-xs mb-1">
                      İçerik: {item.comboProducts.join(', ')}
                    </p>
                  )}
                  {item.giftProduct && (
                    <div className="bg-pink-500/20 border border-pink-500/30 rounded px-2 py-1 mb-2 inline-flex items-center gap-1">
                      <span className="text-pink-400 text-xs font-bold">+ {item.giftProduct.name} 🎁</span>
                    </div>
                  )}
                  {item.description && !item.isCombo && (
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
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-lg">
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
            
            {/* Kazanılan Puanlar (Desktop) */}
            {earnedPoints && (
              <div className="mt-3 pt-3 border-t border-dashed bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg p-3">
                <p className="text-sm font-bold text-orange-600 mb-1">🎉 Tebrikler! Puan Kazandınız</p>
                <div className="flex justify-between text-sm">
                  <span>Kazanılan Puan:</span>
                  <span className="font-bold text-green-600">+{earnedPoints.total_earned}</span>
                </div>
                {earnedPoints.bonus_points > 0 && (
                  <p className="text-xs text-orange-500">({earnedPoints.base_points} + {earnedPoints.bonus_points} bonus)</p>
                )}
                <div className="flex justify-between text-sm mt-1">
                  <span>Toplam Puanınız:</span>
                  <span className="font-bold">{earnedPoints.new_total}</span>
                </div>
                {earnedPoints.tier_upgraded && (
                  <p className="text-sm font-bold text-purple-600 mt-2 animate-pulse">
                    🎊 {earnedPoints.tier_info?.name} seviyesine yükseldiniz!
                  </p>
                )}
              </div>
            )}
          </div>
          <Button className="w-full py-6 bg-orange-500 hover:bg-orange-600 text-lg mt-2 animate-pulse" onClick={completeOrder}>
            ✓ TAMAM - Yeni Sipariş
          </Button>
          <p className="text-center text-xs text-zinc-500">Ekran 15 saniye sonra otomatik kapanacak</p>
        </DialogContent>
      </Dialog>

      {/* Combo Menü Dialog */}
      <Dialog open={showCombos} onOpenChange={setShowCombos}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-3">
              🎁 Menü Fırsatları
              <span className="text-sm font-normal text-zinc-400">Kombinasyon menülerde indirimli fiyatlar</span>
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {combos.map(combo => (
              <div 
                key={combo.id} 
                className="bg-zinc-800 rounded-2xl overflow-hidden border border-zinc-700 hover:border-orange-500 transition-all group"
              >
                <div className="relative h-40 overflow-hidden">
                  <img 
                    src={combo.image} 
                    alt={combo.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute top-3 right-3 bg-green-500 text-white font-bold px-3 py-1 rounded-full text-sm">
                    %{combo.discount_percent} İNDİRİM
                  </div>
                  {combo.start_hour && combo.end_hour && (
                    <div className="absolute top-3 left-3 bg-purple-500 text-white font-bold px-3 py-1 rounded-full text-sm flex items-center gap-1">
                      🕐 {combo.start_hour}:00-{combo.end_hour}:00
                    </div>
                  )}
                  {combo.gift_product_id && (
                    <div className="absolute top-3 left-3 bg-pink-500 text-white font-bold px-3 py-1 rounded-full text-sm animate-pulse">
                      {combo.gift_message || '🎁 Hediye!'}
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="font-bold text-xl text-white">{combo.name}</h3>
                    <p className="text-zinc-300 text-sm">{combo.description}</p>
                  </div>
                </div>
                <div className="p-4">
                  {/* Hediye Ürün Banner */}
                  {combo.gift_product_id && (
                    <div className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 rounded-lg p-2 mb-3 flex items-center gap-2">
                      <span className="text-2xl">🎁</span>
                      <div>
                        <p className="text-pink-400 font-bold text-sm">{combo.gift_message || 'Hediye Ürün!'}</p>
                        <p className="text-zinc-400 text-xs">{combo.gift_product_name}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-zinc-500 line-through text-lg">₺{combo.original_price}</span>
                      <span className="text-green-400 font-black text-2xl ml-2">₺{combo.combo_price}</span>
                    </div>
                    <span className="text-orange-400 font-bold">
                      ₺{combo.original_price - combo.combo_price} Kazanç
                    </span>
                  </div>
                  <Button 
                    onClick={() => addComboToCart(combo)}
                    className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-lg font-bold rounded-xl"
                  >
                    {combo.gift_product_id ? 'Sepete Ekle + Hediye 🎁' : 'Sepete Ekle 🛒'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {combos.length === 0 && (
            <div className="text-center py-10 text-zinc-400">
              <span className="text-4xl block mb-3">🎁</span>
              Şu anda aktif menü fırsatı bulunmuyor
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Sadakat Programı Dialog */}
      <Dialog open={showLoyalty} onOpenChange={setShowLoyalty}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-3">
              ⭐ Sadakat Programı
            </DialogTitle>
          </DialogHeader>
          
          {!loyaltyMember ? (
            // Telefon numarası girişi
            <div className="space-y-4 py-4">
              <p className="text-zinc-400 text-center">
                Telefon numaranızı girerek puan kazanın ve ödüller kazanın!
              </p>
              <div className="space-y-2">
                <label className="text-sm text-zinc-400">Telefon Numarası</label>
                <Input
                  type="tel"
                  placeholder="05XX XXX XX XX"
                  value={loyaltyPhone}
                  onChange={(e) => setLoyaltyPhone(e.target.value.replace(/\D/g, ''))}
                  className="bg-zinc-800 border-zinc-700 text-white text-center text-xl py-6"
                  maxLength={11}
                />
              </div>
              <Button 
                onClick={lookupLoyaltyMember} 
                className="w-full py-6 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-lg"
                disabled={loyaltyPhone.length < 10}
              >
                Devam Et
              </Button>
              
              {/* Avantajlar */}
              <div className="mt-4 pt-4 border-t border-zinc-800">
                <p className="text-sm text-zinc-400 mb-3">Üyelik Avantajları:</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-zinc-800 rounded-lg p-3 text-center">
                    <span className="text-2xl block mb-1">🎯</span>
                    <p>Her ₺1 = 1 Puan</p>
                  </div>
                  <div className="bg-zinc-800 rounded-lg p-3 text-center">
                    <span className="text-2xl block mb-1">🎁</span>
                    <p>Ücretsiz Ürünler</p>
                  </div>
                  <div className="bg-zinc-800 rounded-lg p-3 text-center">
                    <span className="text-2xl block mb-1">💎</span>
                    <p>VIP Seviyeler</p>
                  </div>
                  <div className="bg-zinc-800 rounded-lg p-3 text-center">
                    <span className="text-2xl block mb-1">🎉</span>
                    <p>Özel İndirimler</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Üye bilgileri
            <div className="space-y-4 py-4">
              {/* Üye Kartı */}
              <div className={`rounded-2xl p-6 relative overflow-hidden ${
                loyaltyMember.member.tier === 'platinum' ? 'bg-gradient-to-br from-slate-800 to-slate-900' :
                loyaltyMember.member.tier === 'gold' ? 'bg-gradient-to-br from-yellow-600 to-amber-700' :
                loyaltyMember.member.tier === 'silver' ? 'bg-gradient-to-br from-slate-400 to-slate-600' :
                'bg-gradient-to-br from-orange-700 to-amber-900'
              }`}>
                <div className="absolute top-0 right-0 w-32 h-32 opacity-10 text-8xl">
                  {loyaltyMember.tier_info?.icon || '🥉'}
                </div>
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-4xl">{loyaltyMember.tier_info?.icon || '🥉'}</span>
                    <div>
                      <p className="font-bold text-lg">{loyaltyMember.member.name || 'Üye'}</p>
                      <p className="text-white/70 text-sm">{loyaltyMember.tier_info?.name || 'Bronz'} Üye</p>
                    </div>
                  </div>
                  <div className="text-center py-4">
                    <p className="text-sm text-white/70">Toplam Puan</p>
                    <p className="text-5xl font-black">{loyaltyMember.member.total_points}</p>
                  </div>
                  {loyaltyMember.next_tier && (
                    <div className="mt-2 bg-black/20 rounded-lg p-2 text-center text-sm">
                      {loyaltyMember.next_tier.icon} {loyaltyMember.next_tier.name} için {loyaltyMember.next_tier.points_needed} puan
                    </div>
                  )}
                </div>
              </div>
              
              {/* İstatistikler */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-800 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-orange-500">{loyaltyMember.member.total_orders}</p>
                  <p className="text-xs text-zinc-400">Sipariş</p>
                </div>
                <div className="bg-zinc-800 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-500">₺{loyaltyMember.member.total_spent?.toFixed(0) || 0}</p>
                  <p className="text-xs text-zinc-400">Harcama</p>
                </div>
              </div>
              
              {/* Aksiyonlar */}
              <div className="space-y-2">
                <Button 
                  onClick={() => { setShowLoyalty(false); setShowRewards(true); }}
                  className="w-full py-5 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-lg"
                >
                  🎁 Ödüllerimi Gör ({loyaltyRewards.filter(r => loyaltyMember.member.total_points >= r.points_required).length} kullanılabilir)
                </Button>
                
                {/* Referans Sistemi */}
                <div className="border-t border-zinc-700 pt-3">
                  <p className="text-sm text-zinc-400 mb-2">🤝 Arkadaşını Davet Et</p>
                  {!referralInfo ? (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={loadReferralCode}
                    >
                      Referans Kodumu Göster
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg p-3">
                        <p className="text-xs text-zinc-400 mb-1">Senin Referans Kodun:</p>
                        <p className="text-2xl font-black text-purple-400 tracking-wider">{referralInfo.referral_code}</p>
                        <p className="text-xs text-zinc-500 mt-1">
                          Arkadaşın bu kodu girerse ikiniz de <span className="text-green-400">{referralInfo.bonus_per_referral} puan</span> kazanırsınız!
                        </p>
                        {referralInfo.referral_count > 0 && (
                          <p className="text-xs text-purple-400 mt-2">
                            ✨ {referralInfo.referral_count} arkadaş davet ettiniz!
                          </p>
                        )}
                      </div>
                      
                      {!loyaltyMember.member.referred_by && (
                        <div className="bg-zinc-800 rounded-lg p-3">
                          <p className="text-xs text-zinc-400 mb-2">Referans kodun var mı?</p>
                          <div className="flex gap-2">
                            <Input
                              value={referralInput}
                              onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
                              placeholder="KBXXXX"
                              className="bg-zinc-700 border-zinc-600 text-white"
                              maxLength={10}
                            />
                            <Button 
                              onClick={applyReferralCode}
                              disabled={!referralInput.trim()}
                              className="bg-purple-500 hover:bg-purple-600"
                            >
                              Uygula
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => { setLoyaltyMember(null); setLoyaltyPhone(''); setReferralInfo(null); }}
                >
                  Farklı Numara Gir
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Ödüller Dialog */}
      <Dialog open={showRewards} onOpenChange={setShowRewards}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center justify-between">
              <span>🎁 Ödüllerim</span>
              {loyaltyMember && (
                <span className="text-lg font-normal bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded-full">
                  {loyaltyMember.member.total_points} Puan
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            {loyaltyRewards.map(reward => {
              const canRedeem = loyaltyMember?.member?.total_points >= reward.points_required;
              const progress = Math.min(100, ((loyaltyMember?.member?.total_points || 0) / reward.points_required) * 100);
              
              return (
                <div 
                  key={reward.id}
                  className={`rounded-xl p-4 border ${canRedeem ? 'bg-zinc-800 border-yellow-500/50' : 'bg-zinc-800/50 border-zinc-700'}`}
                >
                  <div className="flex gap-4">
                    {reward.image && (
                      <img src={reward.image} alt={reward.name} className="w-20 h-20 object-cover rounded-lg" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold">{reward.name}</h4>
                        <span className={`text-sm font-bold ${canRedeem ? 'text-yellow-500' : 'text-zinc-500'}`}>
                          {reward.points_required} Puan
                        </span>
                      </div>
                      <p className="text-sm text-zinc-400 mb-2">{reward.description}</p>
                      
                      {!canRedeem && (
                        <div className="mb-2">
                          <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-yellow-500 to-amber-600 transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <p className="text-xs text-zinc-500 mt-1">
                            {reward.points_required - (loyaltyMember?.member?.total_points || 0)} puan daha gerekli
                          </p>
                        </div>
                      )}
                      
                      <Button
                        size="sm"
                        onClick={() => redeemReward(reward)}
                        disabled={!canRedeem}
                        className={canRedeem 
                          ? 'bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700' 
                          : 'bg-zinc-700 cursor-not-allowed'
                        }
                      >
                        {canRedeem ? '🎁 Kullan' : '🔒 Kilitli'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <Button variant="outline" onClick={() => setShowRewards(false)} className="w-full">
            Kapat
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KioskPage;
