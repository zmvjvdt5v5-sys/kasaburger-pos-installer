import React, { useState, useEffect } from 'react';
import { materialsAPI, stockMovementsAPI } from '../lib/api';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Boxes, Search, Loader2, ArrowDownCircle, ArrowUpCircle, Upload, Download, FileSpreadsheet } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Materials = () => {
  const [materials, setMaterials] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [movementDialogOpen, setMovementDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [importing, setImporting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    unit: 'kg',
    stock_quantity: '0',
    min_stock: '0',
    unit_price: '0',
  });
  const [movementData, setMovementData] = useState({
    material_id: '',
    material_name: '',
    type: 'in',
    quantity: '',
    reason: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [materialsRes, movementsRes] = await Promise.all([
        materialsAPI.getAll(),
        stockMovementsAPI.getAll(),
      ]);
      setMaterials(materialsRes.data);
      setMovements(movementsRes.data);
    } catch (error) {
      toast.error('Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      toast.error('Lütfen zorunlu alanları doldurun');
      return;
    }

    setSaving(true);
    try {
      const data = {
        ...formData,
        stock_quantity: parseFloat(formData.stock_quantity) || 0,
        min_stock: parseFloat(formData.min_stock) || 0,
        unit_price: parseFloat(formData.unit_price) || 0,
      };

      if (editingMaterial) {
        await materialsAPI.update(editingMaterial.id, data);
        toast.success('Hammadde güncellendi');
      } else {
        await materialsAPI.create(data);
        toast.success('Hammadde oluşturuldu');
      }

      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'İşlem başarısız');
    } finally {
      setSaving(false);
    }
  };

  const handleMovementSubmit = async (e) => {
    e.preventDefault();
    if (!movementData.material_id || !movementData.quantity || !movementData.reason) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }

    setSaving(true);
    try {
      await stockMovementsAPI.create({
        ...movementData,
        quantity: parseFloat(movementData.quantity),
      });
      toast.success('Stok hareketi kaydedildi');
      setMovementDialogOpen(false);
      setMovementData({ material_id: '', material_name: '', type: 'in', quantity: '', reason: '' });
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'İşlem başarısız');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (material) => {
    setEditingMaterial(material);
    setFormData({
      name: material.name,
      code: material.code,
      unit: material.unit,
      stock_quantity: material.stock_quantity.toString(),
      min_stock: material.min_stock.toString(),
      unit_price: material.unit_price.toString(),
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu hammaddeyi silmek istediğinize emin misiniz?')) return;

    try {
      await materialsAPI.delete(id);
      toast.success('Hammadde silindi');
      loadData();
    } catch (error) {
      toast.error('Silme işlemi başarısız');
    }
  };

  const resetForm = () => {
    setEditingMaterial(null);
    setFormData({
      name: '',
      code: '',
      unit: 'kg',
      stock_quantity: '0',
      min_stock: '0',
      unit_price: '0',
    });
  };

  const filteredMaterials = materials.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.code.toLowerCase().includes(search.toLowerCase())
  );

  const getStockStatus = (material) => {
    if (material.stock_quantity <= 0) return { text: 'Stok Yok', class: 'badge-error' };
    if (material.stock_quantity <= material.min_stock) return { text: 'Düşük', class: 'badge-warning' };
    return { text: 'Yeterli', class: 'badge-success' };
  };

  const downloadTemplate = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/materials/template-excel`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'hammadde_sablonu.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Şablon indirildi');
    } catch (error) {
      toast.error('Şablon indirilemedi');
    }
  };

  const handleExcelImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(`${API_URL}/api/materials/import-excel`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success(response.data.message);
      if (response.data.errors?.length > 0) {
        response.data.errors.forEach(err => toast.warning(err));
      }
      setImportDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Excel içe aktarma başarısız');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="materials-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold">Hammaddeler</h1>
          <p className="text-muted-foreground">Stok ve hammadde yönetimi</p>
        </div>
        <div className="flex gap-2">
          {/* Excel Import Dialog */}
          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-primary/50 hover:bg-primary/10">
                <Upload className="h-4 w-4 mr-2" />
                Excel'den Aktar
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="font-heading flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-primary" />
                  Excel'den Hammadde Aktar
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Excel dosyası ile toplu hammadde ekleyebilirsiniz. Önce şablonu indirin, doldurun ve yükleyin.
                </p>
                <Button variant="outline" onClick={downloadTemplate} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Şablonu İndir
                </Button>
                <div className="border-2 border-dashed border-primary/30 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleExcelImport}
                    className="hidden"
                    id="material-excel-upload"
                    disabled={importing}
                  />
                  <label htmlFor="material-excel-upload" className="cursor-pointer">
                    {importing ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="text-sm">Yükleniyor...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-primary" />
                        <span className="text-sm">Excel dosyası seçin veya sürükleyin</span>
                        <span className="text-xs text-muted-foreground">.xlsx veya .xls</span>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={movementDialogOpen} onOpenChange={setMovementDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-primary/50 text-primary" data-testid="add-movement-btn">
                <ArrowDownCircle className="h-4 w-4 mr-2" />
                Stok Hareketi
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="font-heading">Stok Hareketi</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleMovementSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Hammadde</Label>
                  <Select
                    value={movementData.material_id}
                    onValueChange={(value) => {
                      const mat = materials.find(m => m.id === value);
                      setMovementData({ ...movementData, material_id: value, material_name: mat?.name || '' });
                    }}
                  >
                    <SelectTrigger className="bg-input/50" data-testid="movement-material-select">
                      <SelectValue placeholder="Hammadde seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {materials.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Hareket Tipi</Label>
                    <Select value={movementData.type} onValueChange={(value) => setMovementData({ ...movementData, type: value })}>
                      <SelectTrigger className="bg-input/50" data-testid="movement-type-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in">Giriş</SelectItem>
                        <SelectItem value="out">Çıkış</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Miktar</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={movementData.quantity}
                      onChange={(e) => setMovementData({ ...movementData, quantity: e.target.value })}
                      className="bg-input/50"
                      data-testid="movement-quantity-input"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Açıklama</Label>
                  <Input
                    value={movementData.reason}
                    onChange={(e) => setMovementData({ ...movementData, reason: e.target.value })}
                    placeholder="Satın alma, üretim vb."
                    className="bg-input/50"
                    data-testid="movement-reason-input"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={() => setMovementDialogOpen(false)}>İptal</Button>
                  <Button type="submit" className="bg-primary" disabled={saving} data-testid="movement-save-btn">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Kaydet
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground shadow-lg shadow-primary/20" data-testid="add-material-btn">
                <Plus className="h-4 w-4 mr-2" />
                Yeni Hammadde
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="font-heading">
                  {editingMaterial ? 'Hammadde Düzenle' : 'Yeni Hammadde'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Hammadde Adı *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Dana Kıyma"
                      className="bg-input/50"
                      data-testid="material-name-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Kod *</Label>
                    <Input
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="HM-001"
                      className="bg-input/50"
                      data-testid="material-code-input"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Birim</Label>
                    <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                      <SelectTrigger className="bg-input/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">Kilogram</SelectItem>
                        <SelectItem value="gr">Gram</SelectItem>
                        <SelectItem value="lt">Litre</SelectItem>
                        <SelectItem value="adet">Adet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Mevcut Stok</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                      className="bg-input/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Min. Stok</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.min_stock}
                      onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                      className="bg-input/50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Birim Fiyatı (₺)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                    className="bg-input/50"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={() => { setDialogOpen(false); resetForm(); }}>İptal</Button>
                  <Button type="submit" className="bg-primary" disabled={saving} data-testid="material-save-btn">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {editingMaterial ? 'Güncelle' : 'Kaydet'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="materials" className="space-y-4">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="materials" data-testid="materials-tab">Hammaddeler</TabsTrigger>
          <TabsTrigger value="movements" data-testid="movements-tab">Stok Hareketleri</TabsTrigger>
        </TabsList>

        <TabsContent value="materials" className="space-y-4">
          {/* Search */}
          <Card className="bg-card border-border/50">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Hammadde ara..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-input/50"
                  data-testid="material-search"
                />
              </div>
            </CardContent>
          </Card>

          {/* Materials Table */}
          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2">
                <Boxes className="h-5 w-5 text-primary" />
                Hammadde Listesi ({filteredMaterials.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredMaterials.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {search ? 'Arama sonucu bulunamadı' : 'Henüz hammadde eklenmemiş'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50">
                        <TableHead>Kod</TableHead>
                        <TableHead>Hammadde Adı</TableHead>
                        <TableHead>Stok</TableHead>
                        <TableHead>Min. Stok</TableHead>
                        <TableHead>Birim Fiyat</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead className="text-right">İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMaterials.map((material) => {
                        const status = getStockStatus(material);
                        return (
                          <TableRow key={material.id} className="border-border/50 table-row-hover">
                            <TableCell className="font-mono text-sm">{material.code}</TableCell>
                            <TableCell className="font-medium">{material.name}</TableCell>
                            <TableCell className="font-mono">{material.stock_quantity} {material.unit}</TableCell>
                            <TableCell className="font-mono">{material.min_stock} {material.unit}</TableCell>
                            <TableCell className="font-mono">{formatCurrency(material.unit_price)}</TableCell>
                            <TableCell>
                              <Badge className={status.class}>{status.text}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(material)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(material.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements">
          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle className="font-heading">Stok Hareketleri</CardTitle>
            </CardHeader>
            <CardContent>
              {movements.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Henüz stok hareketi yok
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50">
                        <TableHead>Tarih</TableHead>
                        <TableHead>Hammadde</TableHead>
                        <TableHead>Tip</TableHead>
                        <TableHead>Miktar</TableHead>
                        <TableHead>Açıklama</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movements.map((movement) => (
                        <TableRow key={movement.id} className="border-border/50 table-row-hover">
                          <TableCell className="text-sm">{formatDateTime(movement.created_at)}</TableCell>
                          <TableCell className="font-medium">{movement.material_name}</TableCell>
                          <TableCell>
                            {movement.type === 'in' ? (
                              <Badge className="badge-success flex items-center gap-1 w-fit">
                                <ArrowDownCircle className="h-3 w-3" /> Giriş
                              </Badge>
                            ) : (
                              <Badge className="badge-error flex items-center gap-1 w-fit">
                                <ArrowUpCircle className="h-3 w-3" /> Çıkış
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-mono">{movement.quantity}</TableCell>
                          <TableCell>{movement.reason}</TableCell>
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
    </div>
  );
};

export default Materials;
