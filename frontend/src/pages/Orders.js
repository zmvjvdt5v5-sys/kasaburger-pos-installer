import React, { useState, useEffect } from 'react';
import { ordersAPI, dealersAPI, productsAPI } from '../lib/api';
import { formatCurrency, formatDate, getStatusColor, getStatusText } from '../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Plus, Trash2, ShoppingCart, Search, Loader2, MoreHorizontal, X, Truck, CheckCircle, XCircle, FileText } from 'lucide-react';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    dealer_id: '',
    dealer_name: '',
    items: [],
    delivery_date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [currentItem, setCurrentItem] = useState({
    product_id: '',
    product_name: '',
    quantity: '',
    unit_price: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [ordersRes, dealersRes, productsRes] = await Promise.all([
        ordersAPI.getAll(),
        dealersAPI.getAll(),
        productsAPI.getAll(),
      ]);
      setOrders(ordersRes.data);
      setDealers(dealersRes.data);
      setProducts(productsRes.data);
    } catch (error) {
      toast.error('Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleDealerChange = (dealerId) => {
    const dealer = dealers.find(d => d.id === dealerId);
    setFormData({ ...formData, dealer_id: dealerId, dealer_name: dealer?.name || '' });
  };

  const handleProductChange = (productId) => {
    const product = products.find(p => p.id === productId);
    const dealer = dealers.find(d => d.id === formData.dealer_id);
    const specialPrice = dealer?.pricing?.find(pr => pr.product_id === productId)?.special_price;
    const price = specialPrice || product?.base_price || 0;
    
    setCurrentItem({
      ...currentItem,
      product_id: productId,
      product_name: product?.name || '',
      unit_price: price.toString(),
    });
  };

  const handleAddItem = () => {
    if (!currentItem.product_id || !currentItem.quantity || !currentItem.unit_price) {
      toast.error('Ürün, miktar ve fiyat gerekli');
      return;
    }
    const total = parseFloat(currentItem.quantity) * parseFloat(currentItem.unit_price);
    setFormData({
      ...formData,
      items: [...formData.items, { ...currentItem, total }],
    });
    setCurrentItem({ product_id: '', product_name: '', quantity: '', unit_price: '' });
  };

  const handleRemoveItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.dealer_id || formData.items.length === 0 || !formData.delivery_date) {
      toast.error('Lütfen bayi, ürünler ve teslimat tarihini girin');
      return;
    }

    setSaving(true);
    try {
      await ordersAPI.create({
        ...formData,
        items: formData.items.map(i => ({
          ...i,
          quantity: parseFloat(i.quantity),
          unit_price: parseFloat(i.unit_price),
          total: parseFloat(i.total),
        })),
      });
      toast.success('Sipariş oluşturuldu');
      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'İşlem başarısız');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await ordersAPI.updateStatus(id, status);
      toast.success('Durum güncellendi');
      loadData();
    } catch (error) {
      toast.error('Güncelleme başarısız');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu siparişi silmek istediğinize emin misiniz?')) return;

    try {
      await ordersAPI.delete(id);
      toast.success('Sipariş silindi');
      loadData();
    } catch (error) {
      toast.error('Silme işlemi başarısız');
    }
  };

  const resetForm = () => {
    setFormData({
      dealer_id: '',
      dealer_name: '',
      items: [],
      delivery_date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setCurrentItem({ product_id: '', product_name: '', quantity: '', unit_price: '' });
  };

  const filteredOrders = orders.filter(
    (o) =>
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.dealer_name.toLowerCase().includes(search.toLowerCase())
  );

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => sum + item.total, 0);
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="orders-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold">Siparişler</h1>
          <p className="text-muted-foreground">Sipariş yönetimi ve takibi</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground shadow-lg shadow-primary/20" data-testid="add-order-btn">
              <Plus className="h-4 w-4 mr-2" />
              Yeni Sipariş
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading">Yeni Sipariş</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bayi *</Label>
                  <Select value={formData.dealer_id} onValueChange={handleDealerChange}>
                    <SelectTrigger className="bg-input/50" data-testid="order-dealer-select">
                      <SelectValue placeholder="Bayi seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {dealers.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Teslimat Tarihi *</Label>
                  <Input
                    type="date"
                    value={formData.delivery_date}
                    onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                    className="bg-input/50"
                    data-testid="order-date-input"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-3">
                <Label>Ürünler *</Label>
                <div className="p-4 rounded-md border border-border bg-background/50">
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    <Select value={currentItem.product_id} onValueChange={handleProductChange}>
                      <SelectTrigger className="bg-input/50" data-testid="order-product-select">
                        <SelectValue placeholder="Ürün" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Miktar"
                      value={currentItem.quantity}
                      onChange={(e) => setCurrentItem({ ...currentItem, quantity: e.target.value })}
                      className="bg-input/50"
                      data-testid="order-quantity-input"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Birim Fiyat"
                      value={currentItem.unit_price}
                      onChange={(e) => setCurrentItem({ ...currentItem, unit_price: e.target.value })}
                      className="bg-input/50"
                      data-testid="order-price-input"
                    />
                    <Button type="button" onClick={handleAddItem} className="bg-primary" data-testid="add-order-item-btn">
                      Ekle
                    </Button>
                  </div>

                  {formData.items.length > 0 && (
                    <div className="space-y-2">
                      {formData.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-2 rounded bg-muted/50">
                          <span className="text-sm">{item.product_name}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground">
                              {item.quantity} x {formatCurrency(item.unit_price)}
                            </span>
                            <span className="font-mono text-sm font-medium">{formatCurrency(item.total)}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItem(index)}
                              className="h-6 w-6 text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-between pt-2 border-t border-border mt-2">
                        <span className="font-medium">Ara Toplam:</span>
                        <span className="font-mono font-bold">{formatCurrency(calculateSubtotal())}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">KDV (%20):</span>
                        <span className="font-mono">{formatCurrency(calculateSubtotal() * 0.20)}</span>
                      </div>
                      <div className="flex justify-between text-lg">
                        <span className="font-bold">Toplam:</span>
                        <span className="font-mono font-bold text-primary">{formatCurrency(calculateSubtotal() * 1.20)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notlar</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Sipariş notları..."
                  className="bg-input/50"
                  data-testid="order-notes-input"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => { setDialogOpen(false); resetForm(); }}>İptal</Button>
                <Button type="submit" className="bg-primary" disabled={saving} data-testid="order-save-btn">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Sipariş Oluştur
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card className="bg-card border-border/50">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Sipariş ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-input/50"
              data-testid="order-search"
            />
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle className="font-heading flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Sipariş Listesi ({filteredOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {search ? 'Arama sonucu bulunamadı' : 'Henüz sipariş yok'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead>Sipariş No</TableHead>
                    <TableHead>Bayi</TableHead>
                    <TableHead>Teslimat</TableHead>
                    <TableHead>Toplam</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id} className="border-border/50 table-row-hover" data-testid={`order-row-${order.id}`}>
                      <TableCell className="font-mono text-sm">{order.order_number}</TableCell>
                      <TableCell className="font-medium">{order.dealer_name}</TableCell>
                      <TableCell>{formatDate(order.delivery_date)}</TableCell>
                      <TableCell className="font-mono">{formatCurrency(order.total)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusText(order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`order-actions-${order.id}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-card border-border">
                            {order.status === 'pending' && (
                              <>
                                <DropdownMenuItem onClick={() => handleStatusUpdate(order.id, 'processing')}>
                                  <Truck className="h-4 w-4 mr-2" /> İşleme Al
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusUpdate(order.id, 'delivered')}>
                                  <CheckCircle className="h-4 w-4 mr-2" /> Teslim Edildi
                                </DropdownMenuItem>
                              </>
                            )}
                            {order.status === 'processing' && (
                              <DropdownMenuItem onClick={() => handleStatusUpdate(order.id, 'delivered')}>
                                <CheckCircle className="h-4 w-4 mr-2" /> Teslim Edildi
                              </DropdownMenuItem>
                            )}
                            {order.status !== 'delivered' && order.status !== 'cancelled' && (
                              <DropdownMenuItem onClick={() => handleStatusUpdate(order.id, 'cancelled')}>
                                <XCircle className="h-4 w-4 mr-2" /> İptal Et
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleDelete(order.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Sil
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Orders;
