import React, { useState, useEffect } from 'react';
import { productionAPI, recipesAPI } from '../lib/api';
import { formatDate, getStatusColor, getStatusText } from '../lib/utils';
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
import { Plus, Trash2, Factory, Loader2, MoreHorizontal, Play, CheckCircle, XCircle } from 'lucide-react';

const Production = () => {
  const [productions, setProductions] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    recipe_id: '',
    product_name: '',
    quantity: '',
    planned_date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productionsRes, recipesRes] = await Promise.all([
        productionAPI.getAll(),
        recipesAPI.getAll(),
      ]);
      setProductions(productionsRes.data);
      setRecipes(recipesRes.data);
    } catch (error) {
      toast.error('Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.recipe_id || !formData.quantity || !formData.planned_date) {
      toast.error('Lütfen zorunlu alanları doldurun');
      return;
    }

    setSaving(true);
    try {
      await productionAPI.create({
        ...formData,
        quantity: parseFloat(formData.quantity),
      });
      toast.success('Üretim emri oluşturuldu');
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
      await productionAPI.updateStatus(id, status);
      toast.success('Durum güncellendi');
      loadData();
    } catch (error) {
      toast.error('Güncelleme başarısız');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu üretim emrini silmek istediğinize emin misiniz?')) return;

    try {
      await productionAPI.delete(id);
      toast.success('Üretim emri silindi');
      loadData();
    } catch (error) {
      toast.error('Silme işlemi başarısız');
    }
  };

  const resetForm = () => {
    setFormData({
      recipe_id: '',
      product_name: '',
      quantity: '',
      planned_date: new Date().toISOString().split('T')[0],
      notes: '',
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'planned': return <Factory className="h-4 w-4" />;
      case 'in_progress': return <Play className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="production-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold">Üretim</h1>
          <p className="text-muted-foreground">Üretim emirlerini yönetin</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground shadow-lg shadow-primary/20" data-testid="add-production-btn">
              <Plus className="h-4 w-4 mr-2" />
              Yeni Üretim Emri
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="font-heading">Yeni Üretim Emri</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Reçete *</Label>
                <Select
                  value={formData.recipe_id}
                  onValueChange={(value) => {
                    const recipe = recipes.find(r => r.id === value);
                    setFormData({ ...formData, recipe_id: value, product_name: recipe?.product_name || '' });
                  }}
                >
                  <SelectTrigger className="bg-input/50" data-testid="production-recipe-select">
                    <SelectValue placeholder="Reçete seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {recipes.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.product_name} ({r.yield_quantity} {r.yield_unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Üretim Miktarı *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="100"
                    className="bg-input/50"
                    data-testid="production-quantity-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Planlanan Tarih *</Label>
                  <Input
                    type="date"
                    value={formData.planned_date}
                    onChange={(e) => setFormData({ ...formData, planned_date: e.target.value })}
                    className="bg-input/50"
                    data-testid="production-date-input"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notlar</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Üretim notları..."
                  className="bg-input/50"
                  data-testid="production-notes-input"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => { setDialogOpen(false); resetForm(); }}>İptal</Button>
                <Button type="submit" className="bg-primary" disabled={saving} data-testid="production-save-btn">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Kaydet
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {['planned', 'in_progress', 'completed', 'cancelled'].map((status) => {
          const count = productions.filter(p => p.status === status).length;
          return (
            <Card key={status} className="bg-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                      {getStatusText(status)}
                    </p>
                    <p className="text-2xl font-heading font-bold">{count}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-md flex items-center justify-center ${getStatusColor(status)}`}>
                    {getStatusIcon(status)}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Production Table */}
      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle className="font-heading flex items-center gap-2">
            <Factory className="h-5 w-5 text-primary" />
            Üretim Emirleri ({productions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : productions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Henüz üretim emri yok
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead>Ürün</TableHead>
                    <TableHead>Miktar</TableHead>
                    <TableHead>Planlanan Tarih</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Notlar</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productions.map((production) => (
                    <TableRow key={production.id} className="border-border/50 table-row-hover" data-testid={`production-row-${production.id}`}>
                      <TableCell className="font-medium">{production.product_name}</TableCell>
                      <TableCell className="font-mono">{production.quantity}</TableCell>
                      <TableCell>{formatDate(production.planned_date)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(production.status)}>
                          {getStatusText(production.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{production.notes || '-'}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`production-actions-${production.id}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-card border-border">
                            {production.status === 'planned' && (
                              <DropdownMenuItem onClick={() => handleStatusUpdate(production.id, 'in_progress')}>
                                <Play className="h-4 w-4 mr-2" /> Başlat
                              </DropdownMenuItem>
                            )}
                            {production.status === 'in_progress' && (
                              <DropdownMenuItem onClick={() => handleStatusUpdate(production.id, 'completed')}>
                                <CheckCircle className="h-4 w-4 mr-2" /> Tamamla
                              </DropdownMenuItem>
                            )}
                            {production.status !== 'completed' && production.status !== 'cancelled' && (
                              <DropdownMenuItem onClick={() => handleStatusUpdate(production.id, 'cancelled')}>
                                <XCircle className="h-4 w-4 mr-2" /> İptal Et
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleDelete(production.id)}
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

export default Production;
