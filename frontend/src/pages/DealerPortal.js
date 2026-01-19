import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { 
  ShoppingCart, 
  Package, 
  FileText, 
  LogOut, 
  Plus, 
  Minus, 
  Trash2, 
  Loader2,
  Store,
  Wallet,
  Key,
  Download,
  CreditCard,
  Receipt,
  History,
  Send,
  Building,
  Calendar,
  Hash,
  MessageSquare,
  Megaphone,
  Percent,
  Tag,
  Bell,
  Sparkles,
  Plug,
  Bike,
  Package,
  FileText,
  BarChart
} from 'lucide-react';
import { Textarea } from '../components/ui/textarea';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('tr-TR');
};

const getStatusColor = (status) => {
  const colors = {
    pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    processing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    delivered: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
    paid: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    unpaid: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    partial: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };
  return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
};

const getStatusText = (status) => {
  const texts = {
    pending: 'Beklemede',
    processing: 'Hazırlanıyor',
    delivered: 'Teslim Edildi',
    cancelled: 'İptal',
    paid: 'Ödendi',
    unpaid: 'Ödenmedi',
    partial: 'Kısmi Ödeme',
  };
  return texts[status] || status;
};

const DealerPortal = ({ initialTab = 'order' }) => {
  const navigate = useNavigate();
  const [dealer, setDealer] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPassword, setChangingPassword] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Ödeme yapma state'leri
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_method: 'sanal_pos',
    payment_date: new Date().toISOString().split('T')[0],
    reference_no: '',
    notes: ''
  });
  const [cardForm, setCardForm] = useState({
    cardHolderName: '',
    cardNumber: '',
    expireMonth: '',
    expireYear: '',
    cvc: ''
  });
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [processingCard, setProcessingCard] = useState(false);

  const token = localStorage.getItem('dealer_token');
  
  // Kategorileri hesapla - alfabetik sırala
  const categories = React.useMemo(() => {
    const cats = {};
    products.forEach(p => {
      const cat = p.category || 'Diğer';
      if (!cats[cat]) cats[cat] = 0;
      cats[cat]++;
    });
    // Alfabetik sırala (Türkçe karakterleri destekle)
    return Object.entries(cats).sort((a, b) => a[0].localeCompare(b[0], 'tr'));
  }, [products]);
  
  // İlk kategoriyi varsayılan olarak seç
  React.useEffect(() => {
    if (categories.length > 0 && selectedCategory === 'all') {
      setSelectedCategory(categories[0][0]);
    }
  }, [categories]);
  
  // Filtrelenmiş ürünler
  const filteredProducts = React.useMemo(() => {
    return products.filter(p => {
      const matchesCategory = (p.category || 'Diğer') === selectedCategory;
      const matchesSearch = !searchQuery || 
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  useEffect(() => {
    if (!token) {
      navigate('/dealer-login');
      return;
    }
    loadData();
  }, [token, navigate]);

  const loadData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      const [productsRes, ordersRes, invoicesRes, paymentsRes, campaignsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/dealer-portal/products`, { headers }),
        fetch(`${BACKEND_URL}/api/dealer-portal/orders`, { headers }),
        fetch(`${BACKEND_URL}/api/dealer-portal/invoices`, { headers }),
        fetch(`${BACKEND_URL}/api/dealer-portal/payments`, { headers }).catch(() => ({ ok: false })),
        fetch(`${BACKEND_URL}/api/dealer-portal/campaigns`, { headers }).catch(() => ({ ok: false })),
      ]);

      if (productsRes.ok) setProducts(await productsRes.json());
      if (ordersRes.ok) setOrders(await ordersRes.json());
      if (invoicesRes.ok) setInvoices(await invoicesRes.json());
      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        setPayments(paymentsData);
      }
      if (campaignsRes.ok) {
        const campaignsData = await campaignsRes.json();
        setCampaigns(campaignsData);
      }

      const dealerInfo = JSON.parse(localStorage.getItem('dealer_info') || '{}');
      setDealer(dealerInfo);
    } catch (error) {
      console.error('Load error:', error);
      toast.error('Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('dealer_token');
    localStorage.removeItem('dealer_info');
    navigate('/dealer-login');
  };

  // Kampanya indirimi hesapla
  const getDiscountedPrice = (basePrice) => {
    // Aktif indirim kampanyası var mı?
    const discountCampaign = campaigns.find(c => c.campaign_type === 'discount' && c.discount_value);
    if (!discountCampaign) return null;
    
    if (discountCampaign.discount_type === 'percent') {
      return basePrice * (1 - discountCampaign.discount_value / 100);
    } else {
      return Math.max(0, basePrice - discountCampaign.discount_value);
    }
  };

  // Aktif indirim kampanyası
  const activeDiscountCampaign = campaigns.find(c => c.campaign_type === 'discount' && c.discount_value);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Yeni şifreler eşleşmiyor');
      return;
    }
    if (passwordData.newPassword.length < 4) {
      toast.error('Şifre en az 4 karakter olmalı');
      return;
    }
    setChangingPassword(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/dealer-portal/change-password?old_password=${passwordData.oldPassword}&new_password=${passwordData.newPassword}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Şifre değiştirilemedi');
      }
      toast.success('Şifre başarıyla değiştirildi');
      setPasswordDialogOpen(false);
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setChangingPassword(false);
    }
  };

  const downloadInvoicePdf = async (invoiceId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/dealer-portal/invoices/${invoiceId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('PDF indirilemedi');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `fatura_${invoiceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Fatura indirildi');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const addToCart = (product) => {
    const existing = cart.find(item => item.product_id === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.product_id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        product_id: product.id,
        product_name: product.name,
        unit_price: product.base_price,
        quantity: 1,
        total: product.base_price
      }]);
    }
    toast.success(`${product.name} sepete eklendi`);
  };

  const updateQuantity = (productId, delta) => {
    setCart(cart.map(item => {
      if (item.product_id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty, total: newQty * item.unit_price };
      }
      return item;
    }));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.total, 0);

  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      toast.error('Sepet boş!');
      return;
    }
    if (!deliveryDate) {
      toast.error('Lütfen teslimat tarihi seçin!');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/dealer-portal/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          items: cart,
          total: cartTotal,
          delivery_date: deliveryDate,
          notes: notes
        })
      });

      // Safely parse JSON response
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError);
        throw new Error('Sunucu yanıtı işlenemedi. Lütfen tekrar deneyin.');
      }
      
      if (!response.ok) {
        throw new Error(data.detail || 'Sipariş gönderilemedi');
      }

      // Kredi limiti aşımı kontrolü
      if (data.status === 'pending_approval' || data.warning) {
        toast.warning(data.warning || 'Siparişiniz onay bekliyor', {
          duration: 6000,
          description: `Sipariş No: ${data.order?.order_number || ''}`
        });
      } else {
        toast.success('Sipariş başarıyla oluşturuldu!');
      }
      
      setCart([]);
      setDeliveryDate('');
      setNotes('');
      setOrderDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Order error:', error);
      toast.error(error.message || 'Sipariş gönderilemedi');
    } finally {
      setSubmitting(false);
    }
  };

  // Ödeme gönderme fonksiyonu
  const handleSubmitPayment = async () => {
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      toast.error('Geçerli bir tutar girin');
      return;
    }

    // Sanal POS için kart bilgilerini kontrol et
    if (paymentForm.payment_method === 'sanal_pos') {
      if (!cardForm.cardHolderName || !cardForm.cardNumber || !cardForm.expireMonth || !cardForm.expireYear || !cardForm.cvc) {
        toast.error('Lütfen tüm kart bilgilerini doldurun');
        return;
      }
      
      // Kart numarası validasyonu
      const cleanCardNumber = cardForm.cardNumber.replace(/\s/g, '');
      if (cleanCardNumber.length < 15 || cleanCardNumber.length > 16) {
        toast.error('Geçersiz kart numarası');
        return;
      }

      setProcessingCard(true);
      try {
        const response = await fetch(`${BACKEND_URL}/api/dealer-portal/iyzico-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            amount: parseFloat(paymentForm.amount),
            card_holder_name: cardForm.cardHolderName,
            card_number: cleanCardNumber,
            expire_month: cardForm.expireMonth,
            expire_year: cardForm.expireYear,
            cvc: cardForm.cvc,
            installment: 1
          })
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.detail || 'Ödeme işlemi başarısız');
        }

        toast.success(`✅ ${data.message} - ${parseFloat(paymentForm.amount).toLocaleString('tr-TR')} TL`);
        setPaymentForm({
          amount: '',
          payment_method: 'sanal_pos',
          payment_date: new Date().toISOString().split('T')[0],
          reference_no: '',
          notes: ''
        });
        setCardForm({
          cardHolderName: '',
          cardNumber: '',
          expireMonth: '',
          expireYear: '',
          cvc: ''
        });
        loadData();
        setActiveTab('payments');
      } catch (error) {
        toast.error(error.message);
      } finally {
        setProcessingCard(false);
      }
      return;
    }

    // Diğer ödeme yöntemleri için bildirim gönder
    setSubmittingPayment(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/dealer-portal/submit-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(paymentForm.amount),
          payment_method: paymentForm.payment_method,
          payment_date: paymentForm.payment_date,
          reference_no: paymentForm.reference_no,
          notes: paymentForm.notes
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Ödeme bildirimi gönderilemedi');
      }

      toast.success('Ödeme bildiriminiz alındı! Onay bekliyor.');
      setPaymentForm({
        amount: '',
        payment_method: 'sanal_pos',
        payment_date: new Date().toISOString().split('T')[0],
        reference_no: '',
        notes: ''
      });
      loadData();
      setActiveTab('payments');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Calculate totals for ekstre
  const totalDebt = invoices.filter(i => i.status !== 'paid').reduce((sum, i) => sum + (i.total - (i.paid_amount || 0)), 0);
  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Store className="h-8 w-8 text-primary" />
              <div>
                <h1 className="font-heading font-bold text-lg">KasaBurger</h1>
                <p className="text-xs text-muted-foreground">Bayi Portalı - {dealer?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs text-muted-foreground">Bakiye</p>
                <p className={`font-mono font-bold ${(dealer?.balance || 0) > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {formatCurrency(dealer?.balance || 0)}
                </p>
              </div>
              {/* Help/Guide Button */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => window.open('/bayi-rehber', '_blank')}
                title="Kullanım Rehberi"
                className="text-blue-400 hover:text-blue-300"
              >
                <Bell className="h-4 w-4" />
                <span className="hidden md:inline ml-1">Rehber</span>
              </Button>
              {/* Password Change Dialog */}
              <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" title="Şifre Değiştir">
                    <Key className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border">
                  <DialogHeader>
                    <DialogTitle className="font-heading flex items-center gap-2">
                      <Key className="h-5 w-5 text-primary" />
                      Şifre Değiştir
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Mevcut Şifre</Label>
                      <Input
                        type="password"
                        value={passwordData.oldPassword}
                        onChange={(e) => setPasswordData({...passwordData, oldPassword: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Yeni Şifre</Label>
                      <Input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Yeni Şifre (Tekrar)</Label>
                      <Input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={changingPassword}>
                      {changingPassword ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Şifreyi Değiştir
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
              <Button variant="ghost" onClick={handleLogout} data-testid="dealer-logout">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-8 bg-card border border-border">
            <TabsTrigger value="order" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              <ShoppingCart className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Sipariş</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              <Package className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Ürünler</span>
            </TabsTrigger>
            <TabsTrigger value="invoices" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              <FileText className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Faturalar</span>
            </TabsTrigger>
            <TabsTrigger value="make-payment" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              <CreditCard className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Ödeme</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              <History className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Ödemeler</span>
            </TabsTrigger>
            <TabsTrigger value="ekstre" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              <Receipt className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Ekstre</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              <BarChart className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Raporlar</span>
            </TabsTrigger>
            <TabsTrigger value="platforms" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white">
              <Bike className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Platformlar</span>
            </TabsTrigger>
          </TabsList>

          {/* SİPARİŞ VER TAB */}
          <TabsContent value="order" className="space-y-6">
            {/* Aktif Kampanyalar Banner */}
            {campaigns.length > 0 && (
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <div 
                    key={campaign.id}
                    className="relative overflow-hidden rounded-xl border-2 border-primary/50 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-4 animate-pulse-slow"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/10 rounded-full translate-y-1/2 -translate-x-1/2" />
                    
                    <div className="relative flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-primary/20 border border-primary/30">
                        {campaign.campaign_type === 'discount' ? (
                          <Percent className="h-8 w-8 text-primary" />
                        ) : campaign.campaign_type === 'new_product' ? (
                          <Tag className="h-8 w-8 text-blue-400" />
                        ) : (
                          <Bell className="h-8 w-8 text-amber-400" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                          <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                            {campaign.campaign_type === 'discount' ? 'KAMPANYA' : campaign.campaign_type === 'new_product' ? 'YENİ ÜRÜN' : 'DUYURU'}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-1">{campaign.title}</h3>
                        {campaign.description && (
                          <p className="text-sm text-muted-foreground mb-2">{campaign.description}</p>
                        )}
                        
                        <div className="flex items-center gap-4">
                          {campaign.campaign_type === 'discount' && campaign.discount_value && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/20 text-green-400 font-bold text-lg border border-green-500/30">
                              {campaign.discount_type === 'percent' ? `%${campaign.discount_value}` : `${campaign.discount_value} TL`} İNDİRİM
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {campaign.end_date?.slice(0, 10)} tarihine kadar
                          </span>
                        </div>
                      </div>
                      
                      <div className="hidden sm:block">
                        <Megaphone className="h-16 w-16 text-primary/30" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Products */}
              <div className="lg:col-span-2">
                <Card className="bg-card border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="font-heading flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      Ürünler ({filteredProducts.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Kategori Filtreleme */}
                    <div className="mb-4 space-y-3">
                      {/* Arama */}
                      <div className="relative">
                        <Input
                          placeholder="Ürün ara..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="bg-input/50 pl-10"
                        />
                        <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
                      
                      {/* Kategori Butonları - Alfabetik sıralı */}
                      <div className="flex flex-wrap gap-2">
                        {categories.map(([cat, count]) => (
                          <Button
                            key={cat}
                            size="sm"
                            variant={selectedCategory === cat ? 'default' : 'outline'}
                            onClick={() => setSelectedCategory(cat)}
                            className="text-xs"
                          >
                            {cat} ({count})
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Ürün Listesi */}
                    <ScrollArea className="h-[500px] pr-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {filteredProducts.map((product) => {
                          const discountedPrice = getDiscountedPrice(product.base_price);
                          return (
                            <div
                              key={product.id}
                              className={`p-3 rounded-lg border bg-background/50 hover:border-primary/50 transition-colors relative ${
                                activeDiscountCampaign ? 'border-green-500/50 ring-1 ring-green-500/20' : 'border-border/50'
                              }`}
                            >
                              {activeDiscountCampaign && (
                                <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                                  <Percent className="h-3 w-3" />
                                  {activeDiscountCampaign.discount_type === 'percent' 
                                    ? `%${activeDiscountCampaign.discount_value}` 
                                    : `${activeDiscountCampaign.discount_value}TL`}
                                </div>
                              )}
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h4 className="font-medium text-sm">{product.name}</h4>
                                  <p className="text-xs text-muted-foreground">{product.code}</p>
                                  <Badge variant="outline" className="mt-1 text-xs">
                                    {product.category || 'Diğer'}
                                  </Badge>
                                </div>
                                <div className="text-right">
                                  {discountedPrice ? (
                                    <>
                                      <span className="text-xs text-muted-foreground line-through block">
                                        {formatCurrency(product.base_price)}
                                      </span>
                                      <span className="font-mono text-green-500 font-bold text-sm">
                                        {formatCurrency(discountedPrice)}
                                      </span>
                                    </>
                                  ) : (
                                    <span className="font-mono text-primary font-bold text-sm">
                                      {formatCurrency(product.base_price)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                className="w-full mt-2"
                                onClick={() => addToCart(product)}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Sepete Ekle
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                      
                      {filteredProducts.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">
                          Bu kategoride ürün bulunamadı
                        </p>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Cart */}
              <div>
                <Card className="bg-card border-border/50 sticky top-24">
                  <CardHeader>
                    <CardTitle className="font-heading flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5 text-primary" />
                      Sepet ({cart.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {cart.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Sepet boş
                      </p>
                    ) : (
                      <div className="space-y-4">
                        <ScrollArea className="h-64">
                          <div className="space-y-3 pr-4">
                            {cart.map((item) => (
                              <div key={item.product_id} className="flex items-center justify-between p-2 rounded-md bg-background/50">
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{item.product_name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatCurrency(item.unit_price)} x {item.quantity}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateQuantity(item.product_id, -1)}>
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="w-6 text-center">{item.quantity}</span>
                                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateQuantity(item.product_id, 1)}>
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeFromCart(item.product_id)}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>

                        <div className="border-t border-border pt-4 space-y-3">
                          <div className="flex justify-between font-bold">
                            <span>Toplam:</span>
                            <span className="text-primary">{formatCurrency(cartTotal)}</span>
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Teslimat Tarihi</Label>
                            <Input
                              type="date"
                              value={deliveryDate}
                              onChange={(e) => setDeliveryDate(e.target.value)}
                              min={new Date().toISOString().split('T')[0]}
                              className="bg-input/50"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Notlar (Opsiyonel)</Label>
                            <Input
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              placeholder="Sipariş notu..."
                              className="bg-input/50"
                            />
                          </div>

                          <Button 
                            className="w-full bg-primary hover:bg-primary/90" 
                            onClick={handleSubmitOrder}
                            disabled={submitting || cart.length === 0}
                            data-testid="submit-order-btn"
                          >
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            {!deliveryDate && cart.length > 0 ? '⚠️ Tarih Seçin' : 'Sipariş Ver'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Recent Orders */}
            <Card className="bg-card border-border/50">
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Son Siparişlerim
                </CardTitle>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Henüz sipariş yok</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/50">
                          <TableHead>Sipariş No</TableHead>
                          <TableHead>Tarih</TableHead>
                          <TableHead>Teslimat</TableHead>
                          <TableHead>Toplam</TableHead>
                          <TableHead>Durum</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.slice(0, 5).map((order) => (
                          <TableRow key={order.id} className="border-border/50">
                            <TableCell className="font-mono">{order.order_number}</TableCell>
                            <TableCell>{formatDate(order.created_at)}</TableCell>
                            <TableCell>{formatDate(order.delivery_date)}</TableCell>
                            <TableCell className="font-mono">{formatCurrency(order.total)}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(order.status)}>
                                {getStatusText(order.status)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ÖDEME YAP TAB */}
          <TabsContent value="make-payment" className="space-y-6">
            {/* Current Balance Card */}
            <Card className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/30">
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Güncel Borcunuz</p>
                  <p className="text-4xl font-bold font-mono text-amber-400">
                    {formatCurrency(totalDebt)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Payment Form */}
            <Card className="bg-card border-border/50">
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2">
                  <Send className="h-5 w-5 text-primary" />
                  Ödeme Bildirimi Gönder
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-w-md">
                  {/* Amount */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Ödeme Tutarı *
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                        placeholder="0.00"
                        className="bg-input/50 pl-8"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₺</span>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Ödeme Yöntemi
                    </Label>
                    <select
                      value={paymentForm.payment_method}
                      onChange={(e) => setPaymentForm({...paymentForm, payment_method: e.target.value})}
                      className="w-full h-10 px-3 rounded-md border border-border bg-input/50 text-foreground"
                    >
                      <option value="sanal_pos">💳 Sanal POS (Kredi Kartı)</option>
                      <option value="mail_order">Mail Order (Telefonda Kart)</option>
                      <option value="bank_transfer">Havale/EFT</option>
                      <option value="cash">Nakit</option>
                    </select>
                  </div>

                  {/* Sanal POS Info */}
                  {paymentForm.payment_method === 'sanal_pos' && (
                    <div className="space-y-4">
                      <div className="p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-lg">
                        <p className="text-sm text-blue-400 mb-2 flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          <strong>💳 Kredi Kartı ile Ödeme (iyzico)</strong>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Kart bilgilerinizi girin ve güvenli ödeme yapın.
                        </p>
                      </div>
                      
                      {/* Card Form */}
                      <div className="space-y-3 p-4 bg-card/50 rounded-lg border border-border">
                        <div className="space-y-2">
                          <Label>Kart Üzerindeki İsim *</Label>
                          <Input
                            type="text"
                            value={cardForm.cardHolderName}
                            onChange={(e) => setCardForm({...cardForm, cardHolderName: e.target.value.toUpperCase()})}
                            placeholder="AD SOYAD"
                            className="bg-input/50 uppercase"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Kart Numarası *</Label>
                          <Input
                            type="text"
                            value={cardForm.cardNumber}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '').substring(0, 16);
                              const formatted = val.replace(/(\d{4})(?=\d)/g, '$1 ');
                              setCardForm({...cardForm, cardNumber: formatted});
                            }}
                            placeholder="0000 0000 0000 0000"
                            className="bg-input/50 font-mono"
                            maxLength={19}
                          />
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-2">
                            <Label>Ay *</Label>
                            <select
                              value={cardForm.expireMonth}
                              onChange={(e) => setCardForm({...cardForm, expireMonth: e.target.value})}
                              className="w-full h-10 px-3 rounded-md border border-border bg-input/50 text-foreground"
                            >
                              <option value="">Ay</option>
                              {Array.from({length: 12}, (_, i) => (
                                <option key={i+1} value={String(i+1).padStart(2, '0')}>
                                  {String(i+1).padStart(2, '0')}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label>Yıl *</Label>
                            <select
                              value={cardForm.expireYear}
                              onChange={(e) => setCardForm({...cardForm, expireYear: e.target.value})}
                              className="w-full h-10 px-3 rounded-md border border-border bg-input/50 text-foreground"
                            >
                              <option value="">Yıl</option>
                              {Array.from({length: 10}, (_, i) => {
                                const year = new Date().getFullYear() + i;
                                return (
                                  <option key={year} value={String(year)}>
                                    {year}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label>CVC *</Label>
                            <Input
                              type="text"
                              value={cardForm.cvc}
                              onChange={(e) => setCardForm({...cardForm, cvc: e.target.value.replace(/\D/g, '').substring(0, 4)})}
                              placeholder="123"
                              className="bg-input/50 font-mono"
                              maxLength={4}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payment Date */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Ödeme Tarihi
                    </Label>
                    <Input
                      type="date"
                      value={paymentForm.payment_date}
                      onChange={(e) => setPaymentForm({...paymentForm, payment_date: e.target.value})}
                      className="bg-input/50"
                    />
                  </div>

                  {/* Reference Number */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      Referans No (Dekont/İşlem No)
                    </Label>
                    <Input
                      value={paymentForm.reference_no}
                      onChange={(e) => setPaymentForm({...paymentForm, reference_no: e.target.value})}
                      placeholder="Havale dekont numarası veya işlem referansı"
                      className="bg-input/50"
                    />
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Açıklama
                    </Label>
                    <Textarea
                      value={paymentForm.notes}
                      onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                      placeholder="Ödeme ile ilgili not..."
                      className="bg-input/50"
                      rows={3}
                    />
                  </div>

                  {/* Submit Button */}
                  <Button 
                    className="w-full bg-primary mt-4" 
                    onClick={handleSubmitPayment}
                    disabled={submittingPayment || processingCard || !paymentForm.amount}
                  >
                    {(submittingPayment || processingCard) ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CreditCard className="h-4 w-4 mr-2" />
                    )}
                    {paymentForm.payment_method === 'sanal_pos' 
                      ? (processingCard ? 'Ödeme İşleniyor...' : '💳 Kartla Öde')
                      : 'Ödeme Bildir'
                    }
                  </Button>

                  {paymentForm.payment_method === 'sanal_pos' ? (
                    <p className="text-xs text-green-500 text-center mt-2">
                      🔒 Ödemeniz iyzico güvencesiyle işlenecektir.
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Ödeme bildiriminiz admin tarafından onaylandıktan sonra bakiyenize yansıyacaktır.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Bank Info Card */}
            <Card className="bg-card border-border/50">
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2">
                  <Building className="h-5 w-5 text-primary" />
                  Banka Hesap Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="p-3 rounded-md bg-background/50 border border-border/50">
                    <p className="font-medium">KasaBurger Gıda Ltd. Şti.</p>
                    <p className="text-muted-foreground">Ziraat Bankası - İstanbul Şubesi</p>
                    <p className="font-mono mt-2">TR00 0000 0000 0000 0000 0000 00</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Havale/EFT yaparken açıklama kısmına bayi kodunuzu ({dealer?.code}) yazınız.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ÖDEMELERİM TAB */}
          <TabsContent value="payments" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-card border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-amber-500/10">
                      <Wallet className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Toplam Borç</p>
                      <p className="text-xl font-bold text-amber-500">{formatCurrency(totalDebt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-emerald-500/10">
                      <CreditCard className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Toplam Ödeme</p>
                      <p className="text-xl font-bold text-emerald-500">{formatCurrency(totalPaid)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-primary/10">
                      <Receipt className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Güncel Bakiye</p>
                      <p className={`text-xl font-bold ${(dealer?.balance || 0) > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {formatCurrency(dealer?.balance || 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Unpaid Invoices */}
            <Card className="bg-card border-border/50">
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2">
                  <FileText className="h-5 w-5 text-amber-500" />
                  Ödenmemiş Faturalar
                </CardTitle>
              </CardHeader>
              <CardContent>
                {invoices.filter(i => i.status !== 'paid').length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Ödenmemiş fatura yok ✓</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/50">
                          <TableHead>Fatura No</TableHead>
                          <TableHead>Tarih</TableHead>
                          <TableHead>Vade</TableHead>
                          <TableHead>Tutar</TableHead>
                          <TableHead>Kalan</TableHead>
                          <TableHead>Durum</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoices.filter(i => i.status !== 'paid').map((invoice) => (
                          <TableRow key={invoice.id} className="border-border/50">
                            <TableCell className="font-mono">{invoice.invoice_number}</TableCell>
                            <TableCell>{formatDate(invoice.created_at)}</TableCell>
                            <TableCell>{formatDate(invoice.due_date)}</TableCell>
                            <TableCell className="font-mono">{formatCurrency(invoice.total)}</TableCell>
                            <TableCell className="font-mono text-amber-500">
                              {formatCurrency(invoice.total - (invoice.paid_amount || 0))}
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(invoice.status)}>
                                {getStatusText(invoice.status)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment History */}
            <Card className="bg-card border-border/50">
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Ödeme Geçmişi
                </CardTitle>
              </CardHeader>
              <CardContent>
                {payments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Henüz ödeme kaydı yok</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/50">
                          <TableHead>Tarih</TableHead>
                          <TableHead>Fatura</TableHead>
                          <TableHead>Yöntem</TableHead>
                          <TableHead>Tutar</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map((payment) => (
                          <TableRow key={payment.id} className="border-border/50">
                            <TableCell>{formatDate(payment.payment_date)}</TableCell>
                            <TableCell className="font-mono">{payment.invoice_number}</TableCell>
                            <TableCell>{payment.payment_method === 'cash' ? 'Nakit' : payment.payment_method === 'bank_transfer' ? 'Havale' : payment.payment_method === 'sanal_pos' ? '💳 Sanal POS' : payment.payment_method === 'mail_order' ? 'Mail Order' : payment.payment_method}</TableCell>
                            <TableCell className="font-mono text-emerald-500">{formatCurrency(payment.amount)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* EKSTRE TAB */}
          <TabsContent value="ekstre" className="space-y-6">
            {/* Account Summary */}
            <Card className="bg-gradient-to-r from-primary/20 to-orange-500/20 border-primary/30">
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Hesap Özeti</p>
                  <p className="text-4xl font-bold font-mono mb-2">
                    <span className={totalDebt > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                      {formatCurrency(totalDebt)}
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {totalDebt > 0 ? 'Toplam borcunuz' : 'Borcunuz bulunmamaktadır'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* All Invoices */}
            <Card className="bg-card border-border/50">
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Tüm Faturalar
                </CardTitle>
              </CardHeader>
              <CardContent>
                {invoices.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Henüz fatura yok</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/50">
                          <TableHead>Fatura No</TableHead>
                          <TableHead>Tarih</TableHead>
                          <TableHead>Vade</TableHead>
                          <TableHead>Tutar</TableHead>
                          <TableHead>Ödenen</TableHead>
                          <TableHead>Durum</TableHead>
                          <TableHead className="text-right">İşlem</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoices.map((invoice) => (
                          <TableRow key={invoice.id} className="border-border/50">
                            <TableCell className="font-mono">{invoice.invoice_number}</TableCell>
                            <TableCell>{formatDate(invoice.created_at)}</TableCell>
                            <TableCell>{formatDate(invoice.due_date)}</TableCell>
                            <TableCell className="font-mono">{formatCurrency(invoice.total)}</TableCell>
                            <TableCell className="font-mono text-emerald-500">{formatCurrency(invoice.paid_amount || 0)}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(invoice.status)}>
                                {getStatusText(invoice.status)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => downloadInvoicePdf(invoice.id)}
                                title="PDF İndir"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* All Orders */}
            <Card className="bg-card border-border/50">
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  Tüm Siparişler
                </CardTitle>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Henüz sipariş yok</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/50">
                          <TableHead>Sipariş No</TableHead>
                          <TableHead>Tarih</TableHead>
                          <TableHead>Teslimat</TableHead>
                          <TableHead>Toplam</TableHead>
                          <TableHead>Durum</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map((order) => (
                          <TableRow key={order.id} className="border-border/50">
                            <TableCell className="font-mono">{order.order_number}</TableCell>
                            <TableCell>{formatDate(order.created_at)}</TableCell>
                            <TableCell>{formatDate(order.delivery_date)}</TableCell>
                            <TableCell className="font-mono">{formatCurrency(order.total)}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(order.status)}>
                                {getStatusText(order.status)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* PLATFORMLAR TAB */}
          <TabsContent value="platforms" className="space-y-6">
            <Card className="bg-card border-pink-500/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-pink-500/20">
                      <Bike className="h-6 w-6 text-pink-400" />
                    </div>
                    <div>
                      <CardTitle>Yemek Platform Entegrasyonları</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Yemeksepeti, Getir, Trendyol ve Migros platformlarını bağlayın
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Info */}
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <div className="flex items-start gap-3">
                    <Bell className="h-5 w-5 text-blue-400 mt-0.5" />
                    <div className="text-sm">
                      <p className="text-blue-300 font-medium mb-2">Platform Entegrasyonu Nasıl Çalışır?</p>
                      <ul className="text-blue-300/70 space-y-1 list-disc ml-4">
                        <li>Platform API bilgilerinizi girerek siparişleri otomatik alın</li>
                        <li>Yeni sipariş geldiğinde POS sisteminde sesli bildirim alın</li>
                        <li>Siparişleri tek tıkla kabul edin veya reddedin</li>
                        <li>Hazırlık sürelerini platformlara otomatik bildirin</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Platform Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { id: 'yemeksepeti', name: 'Yemeksepeti', logo: '🍽️', color: 'bg-pink-500' },
                    { id: 'getir', name: 'Getir Yemek', logo: '🛵', color: 'bg-purple-500' },
                    { id: 'trendyol', name: 'Trendyol Yemek', logo: '🛒', color: 'bg-orange-500' },
                    { id: 'migros', name: 'Migros Yemek', logo: '🏪', color: 'bg-orange-600' }
                  ].map(platform => (
                    <Card 
                      key={platform.id}
                      className="cursor-pointer hover:scale-[1.02] transition-all border-white/10 hover:border-white/30"
                      onClick={() => navigate('/dealer-portal/delivery-settings')}
                    >
                      <CardContent className="p-4 text-center">
                        <span className="text-4xl">{platform.logo}</span>
                        <p className="text-sm font-medium mt-2">{platform.name}</p>
                        <Badge variant="outline" className="mt-2 text-xs">
                          Yapılandır →
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* CTA Button */}
                <div className="text-center pt-4">
                  <Button
                    size="lg"
                    onClick={() => navigate('/dealer-portal/delivery-settings')}
                    className="bg-pink-500 hover:bg-pink-600"
                  >
                    <Plug className="h-5 w-5 mr-2" />
                    Platform Ayarlarına Git
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ÜRÜN KATALOĞU TAB */}
          <TabsContent value="products" className="space-y-6">
            <Card className="bg-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Package className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <CardTitle>Ürün Kataloğu</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Sipariş verebileceğiniz tüm ürünler
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {products.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Henüz ürün bulunmuyor</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map((product) => (
                      <div key={product.id} className="p-4 border rounded-lg hover:border-primary transition-colors">
                        <div className="flex items-center gap-3">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="w-16 h-16 rounded object-cover" />
                          ) : (
                            <div className="w-16 h-16 rounded bg-muted flex items-center justify-center">
                              <Package className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1">
                            <h4 className="font-medium">{product.name}</h4>
                            <p className="text-sm text-muted-foreground">{product.category}</p>
                            <p className="text-primary font-bold">{formatCurrency(product.price)}</p>
                          </div>
                        </div>
                        {product.description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{product.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* FATURALARIM TAB */}
          <TabsContent value="invoices" className="space-y-6">
            <Card className="bg-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/20">
                    <FileText className="h-6 w-6 text-orange-400" />
                  </div>
                  <div>
                    <CardTitle>Faturalarım</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Tüm fatura ve borç dökümleri
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {invoices.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Henüz fatura bulunmuyor</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3">Fatura No</th>
                            <th className="text-left p-3">Tarih</th>
                            <th className="text-right p-3">Tutar</th>
                            <th className="text-right p-3">Ödenen</th>
                            <th className="text-right p-3">Kalan</th>
                            <th className="text-center p-3">Durum</th>
                            <th className="text-center p-3">İşlem</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoices.map((invoice) => (
                            <tr key={invoice.id} className="border-b hover:bg-muted/50">
                              <td className="p-3 font-medium">{invoice.invoice_number}</td>
                              <td className="p-3">{new Date(invoice.date).toLocaleDateString('tr-TR')}</td>
                              <td className="p-3 text-right">{formatCurrency(invoice.total)}</td>
                              <td className="p-3 text-right text-green-500">{formatCurrency(invoice.paid_amount || 0)}</td>
                              <td className="p-3 text-right text-red-500">{formatCurrency(invoice.total - (invoice.paid_amount || 0))}</td>
                              <td className="p-3 text-center">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  invoice.status === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                }`}>
                                  {invoice.status === 'paid' ? 'Ödendi' : 'Bekliyor'}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => downloadInvoicePdf(invoice.id)}
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  PDF
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* RAPORLARIM TAB */}
          <TabsContent value="reports" className="space-y-6">
            <Card className="bg-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <BarChart className="h-6 w-6 text-purple-400" />
                  </div>
                  <div>
                    <CardTitle>Raporlarım</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Sipariş ve ödeme raporları
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {/* Toplam Sipariş */}
                  <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                    <div className="flex items-center gap-3">
                      <ShoppingCart className="h-8 w-8 text-blue-400" />
                      <div>
                        <p className="text-sm text-muted-foreground">Toplam Sipariş</p>
                        <p className="text-2xl font-bold text-blue-400">{orders.length}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Toplam Ödeme */}
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                    <div className="flex items-center gap-3">
                      <Wallet className="h-8 w-8 text-green-400" />
                      <div>
                        <p className="text-sm text-muted-foreground">Toplam Ödeme</p>
                        <p className="text-2xl font-bold text-green-400">
                          {formatCurrency(payments.filter(p => p.status === 'approved').reduce((sum, p) => sum + p.amount, 0))}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Güncel Bakiye */}
                  <div className={`p-4 rounded-lg ${dealerInfo?.balance >= 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'} border`}>
                    <div className="flex items-center gap-3">
                      <Receipt className="h-8 w-8" style={{ color: dealerInfo?.balance >= 0 ? '#4ade80' : '#f87171' }} />
                      <div>
                        <p className="text-sm text-muted-foreground">Güncel Bakiye</p>
                        <p className={`text-2xl font-bold ${dealerInfo?.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatCurrency(Math.abs(dealerInfo?.balance || 0))}
                          <span className="text-sm ml-1">{dealerInfo?.balance >= 0 ? '(Alacak)' : '(Borç)'}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Son Siparişler */}
                <div className="mt-6">
                  <h4 className="font-medium mb-4">Son 10 Sipariş</h4>
                  {orders.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Henüz sipariş yok</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3">Sipariş No</th>
                            <th className="text-left p-3">Tarih</th>
                            <th className="text-right p-3">Tutar</th>
                            <th className="text-center p-3">Durum</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.slice(0, 10).map((order) => (
                            <tr key={order.id} className="border-b hover:bg-muted/50">
                              <td className="p-3 font-medium">{order.order_number}</td>
                              <td className="p-3">{new Date(order.created_at).toLocaleDateString('tr-TR')}</td>
                              <td className="p-3 text-right">{formatCurrency(order.total)}</td>
                              <td className="p-3 text-center">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  order.status === 'delivered' ? 'bg-green-500/20 text-green-400' :
                                  order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                  'bg-blue-500/20 text-blue-400'
                                }`}>
                                  {order.status === 'delivered' ? 'Teslim Edildi' :
                                   order.status === 'pending' ? 'Bekliyor' : order.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default DealerPortal;
