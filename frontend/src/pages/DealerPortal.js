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
  Download
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('tr-TR');
};

const getStatusColor = (status) => {
  const colors = {
    pending: 'badge-warning',
    processing: 'badge-info',
    delivered: 'badge-success',
    cancelled: 'badge-error',
    paid: 'badge-success',
    unpaid: 'badge-warning',
  };
  return colors[status] || 'badge-info';
};

const getStatusText = (status) => {
  const texts = {
    pending: 'Beklemede',
    processing: 'Hazırlanıyor',
    delivered: 'Teslim Edildi',
    cancelled: 'İptal',
    paid: 'Ödendi',
    unpaid: 'Ödenmedi',
  };
  return texts[status] || status;
};

const DealerPortal = () => {
  const navigate = useNavigate();
  const [dealer, setDealer] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPassword, setChangingPassword] = useState(false);

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
      
      const [dealerRes, productsRes, ordersRes, invoicesRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/dealer-portal/me`, { headers }),
        fetch(`${BACKEND_URL}/api/dealer-portal/products`, { headers }),
        fetch(`${BACKEND_URL}/api/dealer-portal/orders`, { headers }),
        fetch(`${BACKEND_URL}/api/dealer-portal/invoices`, { headers }),
      ]);

      if (!dealerRes.ok) {
        throw new Error('Oturum süresi dolmuş');
      }

      setDealer(await dealerRes.json());
      setProducts(await productsRes.json());
      setOrders(await ordersRes.json());
      setInvoices(await invoicesRes.json());
    } catch (error) {
      toast.error(error.message);
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('dealer_token');
    localStorage.removeItem('dealer_info');
    navigate('/dealer-login');
  };

  const addToCart = (product) => {
    const existing = cart.find(item => item.product_id === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.product_id === product.id 
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unit_price }
          : item
      ));
    } else {
      setCart([...cart, {
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        unit_price: product.dealer_price,
        total: product.dealer_price
      }]);
    }
    toast.success(`${product.name} sepete eklendi`);
  };

  const updateQuantity = (productId, delta) => {
    setCart(cart.map(item => {
      if (item.product_id === productId) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity, total: newQuantity * item.unit_price };
      }
      return item;
    }));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const getCartTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.20;
    return { subtotal, tax, total: subtotal + tax };
  };

  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      toast.error('Sepetiniz boş');
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
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: cart,
          delivery_date: deliveryDate,
          notes: notes,
        }),
      });

      if (!response.ok) throw new Error('Sipariş oluşturulamadı');

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const cartTotals = getCartTotal();

  return (
    <div className="min-h-screen bg-background grid-texture">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/10 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="https://customer-assets.emergentagent.com/job_kasaburger-pos/artifacts/oruytxht_b3459348-380a-4e05-8eb6-989bd31e2066.jpeg" 
              alt="KasaBurger"
              className="h-10 w-10 object-contain"
            />
            <div>
              <h1 className="font-heading font-bold text-lg">Bayi Portalı</h1>
              <p className="text-xs text-muted-foreground">{dealer?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-muted-foreground">Bakiye</p>
              <p className={`font-mono font-bold ${dealer?.balance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {formatCurrency(dealer?.balance || 0)}
              </p>
            </div>
            <Button variant="ghost" onClick={handleLogout} data-testid="dealer-logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6">
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="products" data-testid="dealer-tab-products">
              <Package className="h-4 w-4 mr-2" />
              Ürünler
            </TabsTrigger>
            <TabsTrigger value="orders" data-testid="dealer-tab-orders">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Siparişlerim
            </TabsTrigger>
            <TabsTrigger value="invoices" data-testid="dealer-tab-invoices">
              <FileText className="h-4 w-4 mr-2" />
              Faturalarım
            </TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Product List */}
              <div className="lg:col-span-2">
                <Card className="bg-card border-border/50">
                  <CardHeader>
                    <CardTitle className="font-heading">Ürünler</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {products.map((product) => (
                        <div 
                          key={product.id} 
                          className="p-4 rounded-md bg-background/50 border border-border/50 hover:border-primary/30 transition-colors"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-medium">{product.name}</h3>
                              <p className="text-xs text-muted-foreground">{product.code}</p>
                            </div>
                            <Badge className="badge-info">{product.unit}</Badge>
                          </div>
                          <div className="flex justify-between items-center mt-3">
                            <p className="font-mono text-lg font-bold text-primary">
                              {formatCurrency(product.dealer_price)}
                            </p>
                            <Button 
                              size="sm" 
                              onClick={() => addToCart(product)}
                              className="bg-primary"
                              data-testid={`add-to-cart-${product.id}`}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Cart */}
              <div className="lg:col-span-1">
                <Card className="bg-card border-border/50 sticky top-20">
                  <CardHeader>
                    <CardTitle className="font-heading flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5 text-primary" />
                      Sepetim ({cart.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {cart.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Sepetiniz boş
                      </p>
                    ) : (
                      <>
                        <ScrollArea className="h-64 mb-4">
                          <div className="space-y-3">
                            {cart.map((item) => (
                              <div key={item.product_id} className="flex items-center justify-between p-2 rounded bg-background/50">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{item.product_name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatCurrency(item.unit_price)} x {item.quantity}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1">
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-6 w-6"
                                      onClick={() => updateQuantity(item.product_id, -1)}
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-6 text-center text-sm">{item.quantity}</span>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-6 w-6"
                                      onClick={() => updateQuantity(item.product_id, 1)}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6 text-destructive"
                                    onClick={() => removeFromCart(item.product_id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>

                        <div className="space-y-2 pt-4 border-t border-border">
                          <div className="flex justify-between text-sm">
                            <span>Ara Toplam:</span>
                            <span className="font-mono">{formatCurrency(cartTotals.subtotal)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>KDV (%20):</span>
                            <span className="font-mono">{formatCurrency(cartTotals.tax)}</span>
                          </div>
                          <div className="flex justify-between font-bold">
                            <span>Toplam:</span>
                            <span className="font-mono text-primary">{formatCurrency(cartTotals.total)}</span>
                          </div>
                        </div>

                        <Button 
                          className="w-full mt-4 bg-primary"
                          onClick={() => setOrderDialogOpen(true)}
                          data-testid="proceed-order-btn"
                        >
                          Sipariş Ver
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card className="bg-card border-border/50">
              <CardHeader>
                <CardTitle className="font-heading">Siparişlerim</CardTitle>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Henüz sipariş yok
                  </p>
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

          {/* Invoices Tab */}
          <TabsContent value="invoices">
            <Card className="bg-card border-border/50">
              <CardHeader>
                <CardTitle className="font-heading">Faturalarım</CardTitle>
              </CardHeader>
              <CardContent>
                {invoices.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Henüz fatura yok
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/50">
                          <TableHead>Fatura No</TableHead>
                          <TableHead>Tarih</TableHead>
                          <TableHead>Vade</TableHead>
                          <TableHead>Toplam</TableHead>
                          <TableHead>Durum</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoices.map((invoice) => (
                          <TableRow key={invoice.id} className="border-border/50">
                            <TableCell className="font-mono">{invoice.invoice_number}</TableCell>
                            <TableCell>{formatDate(invoice.created_at)}</TableCell>
                            <TableCell>{formatDate(invoice.due_date)}</TableCell>
                            <TableCell className="font-mono">{formatCurrency(invoice.total)}</TableCell>
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
          </TabsContent>
        </Tabs>
      </main>

      {/* Order Dialog */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-heading">Sipariş Tamamla</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Teslimat Tarihi *</Label>
              <Input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="bg-input/50"
                data-testid="order-delivery-date"
              />
            </div>
            <div className="space-y-2">
              <Label>Notlar</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Sipariş notları (isteğe bağlı)"
                className="bg-input/50"
                data-testid="order-notes"
              />
            </div>
            <div className="p-4 rounded-md bg-background/50 border border-border">
              <div className="flex justify-between mb-2">
                <span>Ara Toplam:</span>
                <span className="font-mono">{formatCurrency(cartTotals.subtotal)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>KDV (%20):</span>
                <span className="font-mono">{formatCurrency(cartTotals.tax)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Toplam:</span>
                <span className="font-mono text-primary">{formatCurrency(cartTotals.total)}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setOrderDialogOpen(false)} className="flex-1">
                İptal
              </Button>
              <Button 
                onClick={handleSubmitOrder} 
                className="flex-1 bg-primary"
                disabled={submitting}
                data-testid="confirm-order-btn"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Siparişi Onayla
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DealerPortal;
