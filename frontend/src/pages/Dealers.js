import React, { useState, useEffect } from 'react';
import { dealersAPI, productsAPI } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
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
import { Plus, Pencil, Trash2, Users, Search, Loader2, X, Phone, Mail, MapPin, Key, Eye, EyeOff, Copy } from 'lucide-react';

const Dealers = () => {
  const [dealers, setDealers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDealer, setEditingDealer] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    tax_number: '',
    password: '',
    pricing: [],
  });
  const [currentPricing, setCurrentPricing] = useState({
    product_id: '',
    product_name: '',
    special_price: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [dealersRes, productsRes] = await Promise.all([
        dealersAPI.getAll(),
        productsAPI.getAll(),
      ]);
      setDealers(dealersRes.data);
      setProducts(productsRes.data);
    } catch (error) {
      toast.error('Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPricing = () => {
    if (!currentPricing.product_id || !currentPricing.special_price) {
      toast.error('Ürün ve fiyat gerekli');
      return;
    }
    setFormData({
      ...formData,
      pricing: [...formData.pricing, { ...currentPricing }],
    });
    setCurrentPricing({ product_id: '', product_name: '', special_price: '' });
  };

  const handleRemovePricing = (index) => {
    setFormData({
      ...formData,
      pricing: formData.pricing.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.code || !formData.contact_person || !formData.phone || !formData.address) {
      toast.error('Lütfen zorunlu alanları doldurun');
      return;
    }

    setSaving(true);
    try {
      const data = {
        ...formData,
        pricing: formData.pricing.map(p => ({
          ...p,
          special_price: parseFloat(p.special_price),
        })),
      };

      if (editingDealer) {
        await dealersAPI.update(editingDealer.id, data);
        toast.success('Bayi güncellendi');
      } else {
        await dealersAPI.create(data);
        toast.success('Bayi oluşturuldu');
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

  const handleEdit = (dealer) => {
    setEditingDealer(dealer);
    setFormData({
      name: dealer.name,
      code: dealer.code,
      contact_person: dealer.contact_person,
      phone: dealer.phone,
      email: dealer.email || '',
      address: dealer.address,
      tax_number: dealer.tax_number || '',
      pricing: dealer.pricing || [],
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu bayiyi silmek istediğinize emin misiniz?')) return;

    try {
      await dealersAPI.delete(id);
      toast.success('Bayi silindi');
      loadData();
    } catch (error) {
      toast.error('Silme işlemi başarısız');
    }
  };

  const resetForm = () => {
    setEditingDealer(null);
    setFormData({
      name: '',
      code: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      tax_number: '',
      pricing: [],
    });
    setCurrentPricing({ product_id: '', product_name: '', special_price: '' });
  };

  const filteredDealers = dealers.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase()) ||
      d.contact_person.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in" data-testid="dealers-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold">Bayiler</h1>
          <p className="text-muted-foreground">Bayi ve fiyatlandırma yönetimi</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground shadow-lg shadow-primary/20" data-testid="add-dealer-btn">
              <Plus className="h-4 w-4 mr-2" />
              Yeni Bayi
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading">
                {editingDealer ? 'Bayi Düzenle' : 'Yeni Bayi'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bayi Adı *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Örnek Market"
                    className="bg-input/50"
                    data-testid="dealer-name-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bayi Kodu *</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="BY-001"
                    className="bg-input/50"
                    data-testid="dealer-code-input"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Yetkili Kişi *</Label>
                  <Input
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    placeholder="Ahmet Yılmaz"
                    className="bg-input/50"
                    data-testid="dealer-contact-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefon *</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0532 123 4567"
                    className="bg-input/50"
                    data-testid="dealer-phone-input"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>E-posta</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ornek@email.com"
                    className="bg-input/50"
                    data-testid="dealer-email-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vergi No</Label>
                  <Input
                    value={formData.tax_number}
                    onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                    placeholder="1234567890"
                    className="bg-input/50"
                    data-testid="dealer-tax-input"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Adres *</Label>
                <Textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Tam adres..."
                  className="bg-input/50"
                  data-testid="dealer-address-input"
                />
              </div>

              {/* Special Pricing Section */}
              <div className="space-y-3">
                <Label>Özel Fiyatlandırma</Label>
                <div className="p-4 rounded-md border border-border bg-background/50">
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <Select
                      value={currentPricing.product_id}
                      onValueChange={(value) => {
                        const prod = products.find(p => p.id === value);
                        setCurrentPricing({ ...currentPricing, product_id: value, product_name: prod?.name || '' });
                      }}
                    >
                      <SelectTrigger className="bg-input/50 col-span-1" data-testid="pricing-product-select">
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
                      placeholder="Özel Fiyat (₺)"
                      value={currentPricing.special_price}
                      onChange={(e) => setCurrentPricing({ ...currentPricing, special_price: e.target.value })}
                      className="bg-input/50"
                      data-testid="pricing-price-input"
                    />
                    <Button type="button" onClick={handleAddPricing} className="bg-primary" data-testid="add-pricing-btn">
                      Ekle
                    </Button>
                  </div>

                  {formData.pricing.length > 0 && (
                    <div className="space-y-2">
                      {formData.pricing.map((price, index) => (
                        <div key={index} className="flex items-center justify-between p-2 rounded bg-muted/50">
                          <span className="text-sm">{price.product_name}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">{formatCurrency(price.special_price)}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemovePricing(index)}
                              className="h-6 w-6 text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => { setDialogOpen(false); resetForm(); }}>İptal</Button>
                <Button type="submit" className="bg-primary" disabled={saving} data-testid="dealer-save-btn">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {editingDealer ? 'Güncelle' : 'Kaydet'}
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
              placeholder="Bayi ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-input/50"
              data-testid="dealer-search"
            />
          </div>
        </CardContent>
      </Card>

      {/* Dealers Grid */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredDealers.length === 0 ? (
        <Card className="bg-card border-border/50">
          <CardContent className="text-center py-12 text-muted-foreground">
            {search ? 'Arama sonucu bulunamadı' : 'Henüz bayi eklenmemiş'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDealers.map((dealer) => (
            <Card key={dealer.id} className="bg-card border-border/50 hover:border-primary/30 transition-colors" data-testid={`dealer-card-${dealer.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-primary/20 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-heading">{dealer.name}</CardTitle>
                      <p className="text-xs font-mono text-muted-foreground">{dealer.code}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(dealer)} className="h-8 w-8">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(dealer.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{dealer.phone}</span>
                  </div>
                  {dealer.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{dealer.email}</span>
                    </div>
                  )}
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{dealer.address}</span>
                  </div>
                </div>
                <div className="pt-3 border-t border-border/50">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Bakiye</span>
                    <span className={`font-mono font-medium ${dealer.balance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {formatCurrency(dealer.balance)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dealers;
