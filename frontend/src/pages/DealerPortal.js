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
  MessageSquare
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

const DealerPortal = () => {
  const navigate = useNavigate();
  const [dealer, setDealer] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPassword, setChangingPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('order');
  
  // Ödeme yapma state'leri
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_method: 'mail_order',
    payment_date: new Date().toISOString().split('T')[0],
    reference_no: '',
    notes: ''
  });
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const token = localStorage.getItem('dealer_token');

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
      
      const [productsRes, ordersRes, invoicesRes, paymentsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/dealer-portal/products`, { headers }),
        fetch(`${BACKEND_URL}/api/dealer-portal/orders`, { headers }),
        fetch(`${BACKEND_URL}/api/dealer-portal/invoices`, { headers }),
        fetch(`${BACKEND_URL}/api/dealer-portal/payments`, { headers }).catch(() => ({ ok: false })),
      ]);

      if (productsRes.ok) setProducts(await productsRes.json());
      if (ordersRes.ok) setOrders(await ordersRes.json());
      if (invoicesRes.ok) setInvoices(await invoicesRes.json());
      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        setPayments(paymentsData);
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
      toast.error('Sepet boş');
      return;
    }
    if (!deliveryDate) {
      toast.error('Teslimat tarihi seçin');
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

      if (!response.ok) throw new Error('Sipariş gönderilemedi');

      toast.success('Sipariş başarıyla oluşturuldu!');
      setCart([]);
      setDeliveryDate('');
      setNotes('');
      setOrderDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error(error.message);
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
        payment_method: 'mail_order',
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
          <TabsList className="grid w-full grid-cols-4 bg-card border border-border">
            <TabsTrigger value="order" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Sipariş Ver
            </TabsTrigger>
            <TabsTrigger value="make-payment" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              <CreditCard className="h-4 w-4 mr-2" />
              Ödeme Yap
            </TabsTrigger>
            <TabsTrigger value="payments" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              <History className="h-4 w-4 mr-2" />
              Ödemelerim
            </TabsTrigger>
            <TabsTrigger value="ekstre" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              <Receipt className="h-4 w-4 mr-2" />
              Ekstre
            </TabsTrigger>
          </TabsList>

          {/* SİPARİŞ VER TAB */}
          <TabsContent value="order" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Products */}
              <div className="lg:col-span-2">
                <Card className="bg-card border-border/50">
                  <CardHeader>
                    <CardTitle className="font-heading flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      Ürünler
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {products.map((product) => (
                        <div
                          key={product.id}
                          className="p-4 rounded-lg border border-border/50 bg-background/50 hover:border-primary/50 transition-colors"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-medium">{product.name}</h3>
                              <p className="text-xs text-muted-foreground">{product.code}</p>
                            </div>
                            <span className="font-mono text-primary font-bold">
                              {formatCurrency(product.base_price)}
                            </span>
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
                      ))}
                    </div>
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
                            className="w-full bg-primary" 
                            onClick={handleSubmitOrder}
                            disabled={submitting || cart.length === 0}
                          >
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Sipariş Ver
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

          {/* ÖDEMELER TAB */}
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
                            <TableCell>{payment.payment_method === 'cash' ? 'Nakit' : payment.payment_method === 'bank_transfer' ? 'Havale' : payment.payment_method}</TableCell>
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
        </Tabs>
      </main>
    </div>
  );
};

export default DealerPortal;
