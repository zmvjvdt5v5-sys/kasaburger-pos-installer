import React, { useState, useEffect } from 'react';
import { formatCurrency, formatDateTime } from '../lib/utils';
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
import { Plus, Trash2, CreditCard, Search, Loader2, Banknote, Building, Receipt, Wallet } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    invoice_id: '',
    dealer_id: '',
    dealer_name: '',
    amount: '',
    payment_method: 'cash',
    payment_date: new Date().toISOString().slice(0, 10),
    reference_no: '',
    notes: '',
  });

  const token = localStorage.getItem('kasaburger_token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [paymentsRes, invoicesRes, dealersRes, summaryRes] = await Promise.all([
        axios.get(`${API_URL}/api/payments`, { headers }),
        axios.get(`${API_URL}/api/invoices`, { headers }),
        axios.get(`${API_URL}/api/dealers`, { headers }),
        axios.get(`${API_URL}/api/payments/summary`, { headers }),
      ]);
      setPayments(paymentsRes.data);
      setInvoices(invoicesRes.data.filter(i => i.status !== 'paid'));
      setDealers(dealersRes.data);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error('Load error:', error);
      toast.error('Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleInvoiceSelect = (invoiceId) => {
    const invoice = invoices.find(i => i.id === invoiceId);
    if (invoice) {
      const remaining = invoice.total - (invoice.paid_amount || 0);
      setFormData({
        ...formData,
        invoice_id: invoiceId,
        dealer_id: invoice.dealer_id,
        dealer_name: invoice.dealer_name,
        amount: remaining.toString(),
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.invoice_id || !formData.amount) {
      toast.error('Fatura ve tutar zorunludur');
      return;
    }

    setSaving(true);
    try {
      await axios.post(`${API_URL}/api/payments`, {
        ...formData,
        amount: parseFloat(formData.amount),
      }, { headers });
      toast.success('Ödeme kaydedildi');
      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Kaydetme başarısız');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu ödemeyi silmek istediğinize emin misiniz?')) return;
    try {
      await axios.delete(`${API_URL}/api/payments/${id}`, { headers });
      toast.success('Ödeme silindi');
      loadData();
    } catch (error) {
      toast.error('Silme başarısız');
    }
  };

  const resetForm = () => {
    setFormData({
      invoice_id: '',
      dealer_id: '',
      dealer_name: '',
      amount: '',
      payment_method: 'cash',
      payment_date: new Date().toISOString().slice(0, 10),
      reference_no: '',
      notes: '',
    });
  };

  const getPaymentMethodLabel = (method) => {
    const methods = {
      cash: 'Nakit',
      bank_transfer: 'Havale/EFT',
      credit_card: 'Kredi Kartı',
      check: 'Çek',
    };
    return methods[method] || method;
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'cash': return <Banknote className="h-4 w-4" />;
      case 'bank_transfer': return <Building className="h-4 w-4" />;
      case 'credit_card': return <CreditCard className="h-4 w-4" />;
      case 'check': return <Receipt className="h-4 w-4" />;
      default: return <Wallet className="h-4 w-4" />;
    }
  };

  const filteredPayments = payments.filter(
    (p) =>
      p.payment_number?.toLowerCase().includes(search.toLowerCase()) ||
      p.dealer_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.invoice_number?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="payments-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold">Ödemeler</h1>
          <p className="text-muted-foreground">Bayi ödemelerini takip edin</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground shadow-lg shadow-primary/20" data-testid="add-payment-btn">
              <Plus className="h-4 w-4 mr-2" />
              Ödeme Al
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="font-heading flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Yeni Ödeme
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Fatura Seç *</Label>
                <Select value={formData.invoice_id} onValueChange={handleInvoiceSelect}>
                  <SelectTrigger className="bg-input/50">
                    <SelectValue placeholder="Fatura seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {invoices.map((invoice) => (
                      <SelectItem key={invoice.id} value={invoice.id}>
                        {invoice.invoice_number} - {invoice.dealer_name} ({formatCurrency(invoice.total - (invoice.paid_amount || 0))} kalan)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tutar (₺) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="bg-input/50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ödeme Yöntemi</Label>
                  <Select value={formData.payment_method} onValueChange={(v) => setFormData({ ...formData, payment_method: v })}>
                    <SelectTrigger className="bg-input/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Nakit</SelectItem>
                      <SelectItem value="bank_transfer">Havale/EFT</SelectItem>
                      <SelectItem value="credit_card">Kredi Kartı</SelectItem>
                      <SelectItem value="check">Çek</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ödeme Tarihi</Label>
                  <Input
                    type="date"
                    value={formData.payment_date}
                    onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                    className="bg-input/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Referans No</Label>
                  <Input
                    value={formData.reference_no}
                    onChange={(e) => setFormData({ ...formData, reference_no: e.target.value })}
                    placeholder="İşlem no, çek no vb."
                    className="bg-input/50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notlar</Label>
                <Input
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ödeme ile ilgili notlar"
                  className="bg-input/50"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  İptal
                </Button>
                <Button type="submit" className="bg-primary" disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Kaydet
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-emerald-500/10">
                <Wallet className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Toplam Tahsilat</p>
                <p className="text-xl font-bold text-emerald-500">{formatCurrency(summary?.total_collected || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-amber-500/10">
                <Receipt className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tahsil Edilecek</p>
                <p className="text-xl font-bold text-amber-500">{formatCurrency(summary?.total_unpaid || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-blue-500/10">
                <CreditCard className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ödeme Sayısı</p>
                <p className="text-xl font-bold">{summary?.payment_count || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10">
                <Banknote className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Nakit Tahsilat</p>
                <p className="text-xl font-bold">{formatCurrency(summary?.by_method?.cash || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Ödeme ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-input/50"
        />
      </div>

      {/* Payments Table */}
      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle className="font-heading flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Ödeme Listesi ({filteredPayments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPayments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Henüz ödeme kaydı yok
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead>Ödeme No</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Bayi</TableHead>
                    <TableHead>Fatura</TableHead>
                    <TableHead>Yöntem</TableHead>
                    <TableHead className="text-right">Tutar</TableHead>
                    <TableHead className="text-right">İşlem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id} className="border-border/50 table-row-hover">
                      <TableCell className="font-mono text-sm">{payment.payment_number}</TableCell>
                      <TableCell>{payment.payment_date}</TableCell>
                      <TableCell>{payment.dealer_name}</TableCell>
                      <TableCell className="font-mono text-sm">{payment.invoice_number}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                          {getPaymentMethodIcon(payment.payment_method)}
                          {getPaymentMethodLabel(payment.payment_method)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-emerald-500">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(payment.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
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
    </div>
  );
};

export default Payments;
