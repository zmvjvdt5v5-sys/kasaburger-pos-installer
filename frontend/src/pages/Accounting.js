import React, { useState, useEffect } from 'react';
import { transactionsAPI } from '../lib/api';
import { formatCurrency, formatDateTime } from '../lib/utils';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Trash2, Wallet, Loader2, TrendingUp, TrendingDown, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

const incomeCategories = ['Satış', 'Fatura Ödemesi', 'Diğer Gelir'];
const expenseCategories = ['Hammadde Alımı', 'Personel', 'Kira', 'Elektrik/Su/Doğalgaz', 'Vergi', 'Sigorta', 'Bakım/Onarım', 'Nakliye', 'Diğer Gider'];

const Accounting = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'income',
    category: '',
    amount: '',
    description: '',
  });
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await transactionsAPI.getAll();
      setTransactions(response.data);
    } catch (error) {
      toast.error('Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.category || !formData.amount || !formData.description) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }

    setSaving(true);
    try {
      await transactionsAPI.create({
        ...formData,
        amount: parseFloat(formData.amount),
      });
      toast.success('İşlem kaydedildi');
      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'İşlem başarısız');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu işlemi silmek istediğinize emin misiniz?')) return;

    try {
      await transactionsAPI.delete(id);
      toast.success('İşlem silindi');
      loadData();
    } catch (error) {
      toast.error('Silme işlemi başarısız');
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'income',
      category: '',
      amount: '',
      description: '',
    });
  };

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const netProfit = totalIncome - totalExpense;

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'all') return true;
    return t.type === filter;
  });

  const categories = formData.type === 'income' ? incomeCategories : expenseCategories;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="accounting-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold">Muhasebe</h1>
          <p className="text-muted-foreground">Gelir-gider takibi ve kasa yönetimi</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground shadow-lg shadow-primary/20" data-testid="add-transaction-btn">
              <Plus className="h-4 w-4 mr-2" />
              Yeni İşlem
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="font-heading">Yeni İşlem</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>İşlem Tipi</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value, category: '' })}
                >
                  <SelectTrigger className="bg-input/50" data-testid="transaction-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Gelir</SelectItem>
                    <SelectItem value="expense">Gider</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className="bg-input/50" data-testid="transaction-category-select">
                    <SelectValue placeholder="Kategori seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tutar (₺)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  className="bg-input/50"
                  data-testid="transaction-amount-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Açıklama</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="İşlem açıklaması..."
                  className="bg-input/50"
                  data-testid="transaction-description-input"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => { setDialogOpen(false); resetForm(); }}>İptal</Button>
                <Button type="submit" className="bg-primary" disabled={saving} data-testid="transaction-save-btn">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Kaydet
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
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Toplam Gelir</p>
                <p className="text-2xl font-heading font-bold text-emerald-400">{formatCurrency(totalIncome)}</p>
              </div>
              <div className="w-10 h-10 rounded-md bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Toplam Gider</p>
                <p className="text-2xl font-heading font-bold text-red-400">{formatCurrency(totalExpense)}</p>
              </div>
              <div className="w-10 h-10 rounded-md bg-red-500/20 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Net Kar/Zarar</p>
                <p className={`text-2xl font-heading font-bold ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatCurrency(netProfit)}
                </p>
              </div>
              <div className={`w-10 h-10 rounded-md flex items-center justify-center ${netProfit >= 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                <Wallet className={`h-5 w-5 ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card className="bg-card border-border/50">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="font-heading flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              İşlem Geçmişi ({filteredTransactions.length})
            </CardTitle>
            <Tabs value={filter} onValueChange={setFilter} className="w-auto">
              <TabsList className="bg-background border border-border">
                <TabsTrigger value="all" data-testid="filter-all">Tümü</TabsTrigger>
                <TabsTrigger value="income" data-testid="filter-income">Gelir</TabsTrigger>
                <TabsTrigger value="expense" data-testid="filter-expense">Gider</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Henüz işlem yok
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead>Tarih</TableHead>
                    <TableHead>Tip</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Açıklama</TableHead>
                    <TableHead className="text-right">Tutar</TableHead>
                    <TableHead className="text-right">İşlem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id} className="border-border/50 table-row-hover" data-testid={`transaction-row-${transaction.id}`}>
                      <TableCell className="text-sm">{formatDateTime(transaction.created_at)}</TableCell>
                      <TableCell>
                        {transaction.type === 'income' ? (
                          <Badge className="badge-success flex items-center gap-1 w-fit">
                            <ArrowDownCircle className="h-3 w-3" /> Gelir
                          </Badge>
                        ) : (
                          <Badge className="badge-error flex items-center gap-1 w-fit">
                            <ArrowUpCircle className="h-3 w-3" /> Gider
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{transaction.category}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{transaction.description}</TableCell>
                      <TableCell className={`text-right font-mono font-medium ${transaction.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(transaction.id)}
                          className="text-destructive hover:text-destructive"
                          data-testid={`delete-transaction-${transaction.id}`}
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

export default Accounting;
