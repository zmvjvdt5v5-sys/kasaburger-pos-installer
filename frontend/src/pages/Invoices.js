import React, { useState, useEffect } from 'react';
import { invoicesAPI, ordersAPI } from '../lib/api';
import { formatCurrency, formatDate, getStatusColor, getStatusText } from '../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
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
import { toast } from 'sonner';
import { Plus, FileText, Search, Loader2, CheckCircle, Eye, Download, FileCode } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [formData, setFormData] = useState({
    order_id: '',
    due_date: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [invoicesRes, ordersRes] = await Promise.all([
        invoicesAPI.getAll(),
        ordersAPI.getAll(),
      ]);
      setInvoices(invoicesRes.data);
      setOrders(ordersRes.data.filter(o => o.status === 'delivered'));
    } catch (error) {
      toast.error('Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderChange = (orderId) => {
    const order = orders.find(o => o.id === orderId);
    setSelectedOrder(order);
    setFormData({ ...formData, order_id: orderId });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.order_id || !formData.due_date) {
      toast.error('Lütfen sipariş ve vade tarihini seçin');
      return;
    }

    if (!selectedOrder) {
      toast.error('Sipariş bulunamadı');
      return;
    }

    setSaving(true);
    try {
      await invoicesAPI.create({
        order_id: formData.order_id,
        dealer_id: selectedOrder.dealer_id,
        dealer_name: selectedOrder.dealer_name,
        items: selectedOrder.items,
        subtotal: selectedOrder.subtotal,
        tax_rate: 20,
        tax_amount: selectedOrder.tax_amount,
        total: selectedOrder.total,
        due_date: formData.due_date,
      });
      toast.success('Fatura oluşturuldu');
      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'İşlem başarısız');
    } finally {
      setSaving(false);
    }
  };

  const handlePayInvoice = async (id) => {
    if (!window.confirm('Bu faturayı ödendi olarak işaretlemek istediğinize emin misiniz?')) return;

    try {
      await invoicesAPI.pay(id);
      toast.success('Fatura ödendi olarak işaretlendi');
      loadData();
    } catch (error) {
      toast.error('İşlem başarısız');
    }
  };

  const handleDownloadXML = async (invoice) => {
    try {
      const token = localStorage.getItem('kasaburger_token');
      const response = await fetch(`${BACKEND_URL}/api/invoices/${invoice.id}/xml`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('XML indirilemedi');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `efatura_${invoice.invoice_number}.xml`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success('E-Fatura XML indirildi');
    } catch (error) {
      toast.error('XML indirme başarısız');
    }
  };

  const handleDownloadPDF = async (invoice) => {
    try {
      const token = localStorage.getItem('kasaburger_token');
      const response = await fetch(`${BACKEND_URL}/api/invoices/${invoice.id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('PDF indirilemedi');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fatura_${invoice.invoice_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success('PDF indirildi');
    } catch (error) {
      toast.error('PDF indirme başarısız');
    }
  };

  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setViewDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ order_id: '', due_date: '' });
    setSelectedOrder(null);
  };

  const filteredInvoices = invoices.filter(
    (i) =>
      i.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      i.dealer_name.toLowerCase().includes(search.toLowerCase())
  );

  const unpaidTotal = invoices.filter(i => i.status === 'unpaid').reduce((sum, i) => sum + i.total, 0);
  const paidTotal = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0);

  return (
    <div className="space-y-6 animate-fade-in" data-testid="invoices-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold">Faturalar</h1>
          <p className="text-muted-foreground">Fatura kesimi ve takibi</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground shadow-lg shadow-primary/20" data-testid="create-invoice-btn">
              <Plus className="h-4 w-4 mr-2" />
              Fatura Kes
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-xl">
            <DialogHeader>
              <DialogTitle className="font-heading">Yeni Fatura</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Teslim Edilmiş Sipariş *</Label>
                <Select value={formData.order_id} onValueChange={handleOrderChange}>
                  <SelectTrigger className="bg-input/50" data-testid="invoice-order-select">
                    <SelectValue placeholder="Sipariş seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {orders.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.order_number} - {o.dealer_name} ({formatCurrency(o.total)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedOrder && (
                <div className="p-4 rounded-md border border-border bg-background/50 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Bayi:</span>
                    <span className="font-medium">{selectedOrder.dealer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Ara Toplam:</span>
                    <span className="font-mono">{formatCurrency(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">KDV (%20):</span>
                    <span className="font-mono">{formatCurrency(selectedOrder.tax_amount)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2">
                    <span className="font-bold">Toplam:</span>
                    <span className="font-mono font-bold text-primary">{formatCurrency(selectedOrder.total)}</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Vade Tarihi *</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="bg-input/50"
                  data-testid="invoice-due-date-input"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => { setDialogOpen(false); resetForm(); }}>İptal</Button>
                <Button type="submit" className="bg-primary" disabled={saving} data-testid="invoice-save-btn">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Fatura Oluştur
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Toplam Fatura</p>
            <p className="text-2xl font-heading font-bold">{invoices.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Ödenmemiş</p>
            <p className="text-2xl font-heading font-bold text-amber-400">{formatCurrency(unpaidTotal)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Tahsil Edilen</p>
            <p className="text-2xl font-heading font-bold text-emerald-400">{formatCurrency(paidTotal)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="bg-card border-border/50">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Fatura ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-input/50"
              data-testid="invoice-search"
            />
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle className="font-heading flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Fatura Listesi ({filteredInvoices.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {search ? 'Arama sonucu bulunamadı' : 'Henüz fatura yok'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead>Fatura No</TableHead>
                    <TableHead>Bayi</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Vade</TableHead>
                    <TableHead>Toplam</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id} className="border-border/50 table-row-hover" data-testid={`invoice-row-${invoice.id}`}>
                      <TableCell className="font-mono text-sm">{invoice.invoice_number}</TableCell>
                      <TableCell className="font-medium">{invoice.dealer_name}</TableCell>
                      <TableCell>{formatDate(invoice.created_at)}</TableCell>
                      <TableCell>{formatDate(invoice.due_date)}</TableCell>
                      <TableCell className="font-mono">{formatCurrency(invoice.total)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(invoice.status)}>
                          {getStatusText(invoice.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewInvoice(invoice)}
                            title="Görüntüle"
                            data-testid={`view-invoice-${invoice.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadPDF(invoice)}
                            className="text-primary hover:text-primary"
                            title="PDF İndir"
                            data-testid={`download-invoice-${invoice.id}`}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadXML(invoice)}
                            className="text-blue-400 hover:text-blue-400"
                            title="E-Fatura XML"
                            data-testid={`xml-invoice-${invoice.id}`}
                          >
                            <FileCode className="h-4 w-4" />
                          </Button>
                          {invoice.status === 'unpaid' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handlePayInvoice(invoice.id)}
                              className="text-emerald-400 hover:text-emerald-400"
                              title="Ödendi İşaretle"
                              data-testid={`pay-invoice-${invoice.id}`}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Invoice Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="bg-card border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading">Fatura Detayı</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-heading font-bold">{selectedInvoice.invoice_number}</h2>
                  <p className="text-muted-foreground">{selectedInvoice.dealer_name}</p>
                </div>
                <Badge className={getStatusColor(selectedInvoice.status)}>
                  {getStatusText(selectedInvoice.status)}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Fatura Tarihi:</span>
                  <p className="font-medium">{formatDate(selectedInvoice.created_at)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Vade Tarihi:</span>
                  <p className="font-medium">{formatDate(selectedInvoice.due_date)}</p>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead>Ürün</TableHead>
                    <TableHead className="text-right">Miktar</TableHead>
                    <TableHead className="text-right">Birim Fiyat</TableHead>
                    <TableHead className="text-right">Toplam</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedInvoice.items.map((item, index) => (
                    <TableRow key={index} className="border-border/50">
                      <TableCell>{item.product_name}</TableCell>
                      <TableCell className="text-right font-mono">{item.quantity}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(item.unit_price)}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(item.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="space-y-2 pt-4 border-t border-border">
                <div className="flex justify-between">
                  <span>Ara Toplam:</span>
                  <span className="font-mono">{formatCurrency(selectedInvoice.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>KDV (%{selectedInvoice.tax_rate}):</span>
                  <span className="font-mono">{formatCurrency(selectedInvoice.tax_amount)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Genel Toplam:</span>
                  <span className="font-mono text-primary">{formatCurrency(selectedInvoice.total)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Invoices;
