// KioskAdmin v2.2 - Updated: 2026-01-17
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Image, Save, Loader2, Monitor, ExternalLink, RefreshCw, Upload } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const DEFAULT_CATEGORIES = [
  { id: 'et-burger', name: 'Et Burger', icon: '🍔' },
  { id: 'premium', name: 'Premium', icon: '👑' },
  { id: 'tavuk', name: 'Tavuk', icon: '🍗' },
  { id: 'atistirmalik', name: 'Yan Ürün', icon: '🍟' },
  { id: 'icecek', name: 'İçecek', icon: '🥤' },
  { id: 'tatli', name: 'Tatlı', icon: '🍫' },
];

const DEFAULT_PRODUCTS = [
  // ET BURGER
  {id: "kasa-classic", name: "Kasa Classic Burger", category: "et-burger", price: 460, image: "https://images.unsplash.com/photo-1599082267955-266a170c214e?w=600&q=80", is_active: true, description: "150 gr. özel baharatlı dana köfte, taze yeşillik, Kasa Gizli Sos"},
  {id: "golden-burger", name: "Golden Burger", category: "et-burger", price: 1190, image: "https://images.unsplash.com/photo-1603508102983-99b101395d1a?w=600&q=80", is_active: true, is_premium: true, description: "150 gr. Dry-Aged köfte, brioche ekmek, yenilebilir altın kaplama, trüf sos, double cheddar"},
  {id: "cheese-lover", name: "Cheese Lover Burger", category: "et-burger", price: 560, image: "https://images.unsplash.com/photo-1585238341710-4d3ff484184d?w=600&q=80", is_active: true, description: "150 gr. dana köfte, çift cheddar + erimiş peynir sosu, karamelize soğan"},
  {id: "no7-burger", name: "No:7 Burger", category: "et-burger", price: 540, image: "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=600&q=80", is_active: true, description: "150 gr. dana köfte, double cheddar, jalapeno, acılı kasa sos, çıtır soğan"},
  {id: "hirsiz-polis", name: "Hırsız & Polis Burger", category: "et-burger", price: 490, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80", is_active: true, description: "2x150 gr. dana köfte, Polis sos (tatlı), Hırsız (acı), cheddar"},
  // PREMIUM GOURMET
  {id: "viking-burger", name: "Viking Burger", category: "premium", price: 430, image: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=600&q=80", is_active: true, is_premium: true, description: "150 gr. dana köfte, 20 gr. cheddar peyniri, çıtır soğan, viking sos"},
  {id: "milano-burger", name: "Milano Burger", category: "premium", price: 440, image: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=600&q=80", is_active: true, is_premium: true, description: "150gr. dana köfte, mozzarella, kuru domates, pesto mayo, roka"},
  {id: "kasa-double-xl", name: "Kasa Double XL", category: "premium", price: 640, image: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=600&q=80", is_active: true, is_premium: true, description: "300 gr. dana köfte, 40 gr. cheddar, karamelize soğan, kasa özel sos"},
  {id: "smoky-bbq", name: "Smoky BBQ Burger", category: "premium", price: 560, image: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=600&q=80", is_active: true, is_premium: true, description: "150 gr. dana köfte, 20 gr. cheddar, kızartılmış pastırma, bbq sos"},
  {id: "animal-style", name: "Animal Style Burger", category: "premium", price: 550, image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&q=80", is_active: true, is_premium: true, description: "150 gr. dana köfte, cheddar peynir, karamelize soğan, animal sos"},
  // TAVUK BURGER
  {id: "crispy-chicken", name: "Crispy Chicken Burger", category: "tavuk", price: 360, image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&q=80", is_active: true, description: "Çıtır paneli tavuk göğsü, taze yeşillik, turşu, mayonez"},
  {id: "double-crispy", name: "Double Crispy Chicken", category: "tavuk", price: 410, image: "https://images.unsplash.com/photo-1562967914-608f82629710?w=600&q=80", is_active: true, description: "Double tavuk, cheddar, taze yeşillik, acılı kasa sos, turşu"},
  {id: "animal-chicken", name: "Animal Style Chicken", category: "tavuk", price: 430, image: "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=600&q=80", is_active: true, description: "Çıtır paneli tavuk göğsü, karamelize soğan, double cheddar, animal sos"},
  {id: "spicy-hirsiz", name: "(Spicy) Hırsız Burger", category: "tavuk", price: 420, image: "https://images.unsplash.com/photo-1513185158878-8d8c2a2a3da3?w=600&q=80", is_active: true, description: "Acı marinasyonlu çıtır tavuk, cheddar, acılı kasa mayonez, jalapeno"},
  {id: "sweet-polis", name: "(Sweet) Polis Burger", category: "tavuk", price: 420, image: "https://images.unsplash.com/photo-1610440042657-612c34d95e9f?w=600&q=80", is_active: true, description: "Tatlı marinasyonlu çıtır tavuk, tatlı kasa sos, taze yeşillik, mozzarella"},
  {id: "milano-chicken", name: "Milano Chicken Burger", category: "tavuk", price: 440, image: "https://images.unsplash.com/photo-1585325701165-351af916e581?w=600&q=80", is_active: true, description: "İnce paneli çıtır tavuk, pesto mayo, kurutulmuş domates, mozzarella"},
  {id: "viking-chicken", name: "Viking Chicken Burger", category: "tavuk", price: 430, image: "https://images.unsplash.com/photo-1587132137056-bfbf0166836e?w=600&q=80", is_active: true, description: "Viking sos, çıtır tavuk, cheddar, kornişon turşu, çıtır soğan"},
  // ATISTIRMALIKLAR
  {id: "mac-cheese", name: "Mac and Cheese Topları", category: "atistirmalik", price: 170, image: "https://images.unsplash.com/photo-1543339494-b4cd4f7ba686?w=600&q=80", is_active: true},
  {id: "mozarella-sticks", name: "Mozarella Sticks", category: "atistirmalik", price: 210, image: "https://images.unsplash.com/photo-1548340748-6d2b7d7da280?w=600&q=80", is_active: true, description: "6 adet (yarım porsiyon patates ile)"},
  {id: "sogan-halkasi", name: "Soğan Halkası", category: "atistirmalik", price: 180, image: "https://images.unsplash.com/photo-1639024471283-03518883512d?w=600&q=80", is_active: true, description: "8 adet (yarım porsiyon patates ile)"},
  {id: "cheese-fries", name: "Prison Cheese Lover Fries", category: "atistirmalik", price: 150, image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&q=80", is_active: true, description: "Cheddar soslu patates"},
  {id: "truffle-fries", name: "Prison Truffle Fries", category: "atistirmalik", price: 175, image: "https://images.unsplash.com/photo-1630384060421-cb20aff8a689?w=600&q=80", is_active: true, description: "Trüf soslu patates"},
  {id: "cajun-fries", name: "Prison Hot Lockdown Fries", category: "atistirmalik", price: 160, image: "https://images.unsplash.com/photo-1598679253544-2c97992403ea?w=600&q=80", is_active: true, description: "Cajun baharatlı patates"},
  // İÇECEKLER
  {id: "ayran", name: "Ayran", category: "icecek", price: 35, image: "https://images.unsplash.com/photo-1596151163116-98a5033814c2?w=600&q=80", is_active: true},
  {id: "su", name: "Su", category: "icecek", price: 20, image: "https://images.unsplash.com/photo-1564419320461-6870880221ad?w=600&q=80", is_active: true},
  {id: "limonata", name: "Limonata", category: "icecek", price: 55, image: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=600&q=80", is_active: true},
  {id: "pepsi", name: "Pepsi", category: "icecek", price: 45, image: "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=600&q=80", is_active: true},
  {id: "milkshake", name: "Milkshake", category: "icecek", price: 85, image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=80", is_active: true},
  // TATLILAR
  {id: "choco-bomb", name: "Kasa Choco Bomb", category: "tatli", price: 200, image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&q=80", is_active: true},
  {id: "churros", name: "Churros", category: "tatli", price: 180, image: "https://images.pexels.com/photos/2035706/pexels-photo-2035706.jpeg?auto=compress&cs=tinysrgb&w=600", is_active: true},
  {id: "oreo-dream", name: "Oreo Dream Cup", category: "tatli", price: 220, image: "https://images.unsplash.com/photo-1612078960206-1709f1f0c969?w=600&q=80", is_active: true},
];

const KioskAdmin = () => {
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    price: '',
    category: 'et-burger',
    image: '',
    premium: false
  });
  const [selectedCategory, setSelectedCategory] = useState('all');
  const fileInputRef = useRef(null);

  // Dosya yükleme fonksiyonu
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Dosya boyutu kontrolü (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Dosya boyutu 5MB\'dan küçük olmalı');
      return;
    }

    // Dosya tipi kontrolü
    if (!file.type.startsWith('image/')) {
      toast.error('Sadece resim dosyaları yüklenebilir');
      return;
    }

    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const token = localStorage.getItem('kasaburger_token');
      const response = await fetch(`${BACKEND_URL}/api/upload/image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formDataUpload
      });

      if (response.ok) {
        const data = await response.json();
        // Tam URL oluştur
        const imageUrl = data.url.startsWith('/') ? `${BACKEND_URL}${data.url}` : data.url;
        setFormData(prev => ({ ...prev, image: imageUrl }));
        toast.success('Resim yüklendi!');
      } else {
        toast.error('Resim yüklenemedi');
      }
    } catch (error) {
      toast.error('Yükleme hatası');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const seedProducts = async (forceReset = false) => {
    if (forceReset) {
      if (!window.confirm('⚠️ DİKKAT: Tüm ürünler silinip varsayılanlar yüklenecek. Yaptığınız değişiklikler kaybolacak. Devam etmek istiyor musunuz?')) {
        return;
      }
    }
    setSeeding(true);
    try {
      const token = localStorage.getItem('kasaburger_token');
      const url = forceReset 
        ? `${BACKEND_URL}/api/kiosk/products/reset`
        : `${BACKEND_URL}/api/kiosk/products/seed`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.seeded || data.reset) {
        toast.success(`${data.count} ürün yüklendi!`);
        loadProducts();
      } else {
        toast.info(data.message || 'İşlem yapılmadı');
      }
    } catch (error) {
      toast.error('İşlem başarısız');
    } finally {
      setSeeding(false);
    }
  };

  const loadProducts = async () => {
    try {
      const token = localStorage.getItem('kasaburger_token');
      console.log('[KioskAdmin] Loading products, token exists:', !!token);
      
      const response = await fetch(`${BACKEND_URL}/api/kiosk/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('[KioskAdmin] Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[KioskAdmin] Products loaded:', data?.length || 0);
        if (data && data.length > 0) {
          setProducts(data);
        } else {
          // API boş döndü, fallback kullan
          console.log('[KioskAdmin] API returned empty, using defaults');
          setProducts(DEFAULT_PRODUCTS);
        }
      } else if (response.status === 401 || response.status === 403) {
        // Auth hatası - token geçersiz olabilir
        console.error('[KioskAdmin] Auth error, status:', response.status);
        toast.error('Oturum süresi dolmuş, lütfen tekrar giriş yapın');
        // Fallback ürünleri göster
        setProducts(DEFAULT_PRODUCTS);
      } else {
        console.error('[KioskAdmin] API error, status:', response.status);
        setProducts(DEFAULT_PRODUCTS);
      }
    } catch (error) {
      console.error('[KioskAdmin] Load error:', error);
      // Hata durumunda varsayılan ürünler kullan
      setProducts(DEFAULT_PRODUCTS);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.category) {
      toast.error('Lütfen zorunlu alanları doldurun');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('kasaburger_token');
      const productData = {
        ...formData,
        id: formData.id || formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        price: parseFloat(formData.price)
      };

      const url = editingProduct 
        ? `${BACKEND_URL}/api/kiosk/products/${editingProduct.id}`
        : `${BACKEND_URL}/api/kiosk/products`;
      
      const response = await fetch(url, {
        method: editingProduct ? 'PUT' : 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
      });

      if (response.ok) {
        toast.success(editingProduct ? 'Ürün güncellendi' : 'Ürün eklendi');
        setDialogOpen(false);
        resetForm();
        loadProducts();
      } else {
        const err = await response.json();
        toast.error(err.detail || 'İşlem başarısız');
      }
    } catch (error) {
      toast.error('Kaydetme başarısız');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;
    
    try {
      const token = localStorage.getItem('kasaburger_token');
      const response = await fetch(`${BACKEND_URL}/api/kiosk/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        toast.success('Ürün silindi');
        loadProducts();
      }
    } catch (error) {
      toast.error('Silme başarısız');
    }
  };

  const openEditDialog = (product) => {
    setEditingProduct(product);
    setFormData({
      id: product.id,
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      category: product.category,
      image: product.image || '',
      premium: product.premium || false
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      id: '',
      name: '',
      description: '',
      price: '',
      category: 'et-burger',
      image: '',
      premium: false
    });
  };

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
  };

  const getCategoryName = (id) => {
    return DEFAULT_CATEGORIES.find(c => c.id === id)?.name || id;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Monitor className="h-8 w-8 text-primary" />
            Kiosk Yönetimi
          </h1>
          <p className="text-muted-foreground">Self-servis kiosk ürünlerini ve görsellerini yönetin</p>
        </div>
        <div className="flex gap-3">
          <Button variant="destructive" onClick={() => seedProducts(true)} disabled={seeding} size="sm">
            {seeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Ürünleri Sıfırla
          </Button>
          <Button variant="outline" asChild>
            <a href="https://kiosk.kasaburger.net.tr/kiosk" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Kiosk'u Görüntüle
            </a>
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Yeni Ürün
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingProduct ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Ürün Adı *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Kasa Classic Burger"
                    />
                  </div>
                  <div>
                    <Label>Fiyat (₺) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="460"
                    />
                  </div>
                  <div>
                    <Label>Kategori *</Label>
                    <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DEFAULT_CATEGORIES.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.icon} {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label>Açıklama</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="150 gr. özel baharatlı dana köfte..."
                      rows={2}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Görsel</Label>
                    <div className="flex gap-2">
                      <Input
                        value={formData.image}
                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                        placeholder="https://... veya dosya yükleyin"
                        className="flex-1"
                      />
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        {uploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">URL yapıştırın veya bilgisayardan resim yükleyin (max 5MB)</p>
                    {formData.image && (
                      <div className="mt-2 relative h-32 rounded-lg overflow-hidden bg-muted">
                        <img 
                          src={formData.image} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="premium"
                      checked={formData.premium}
                      onChange={(e) => setFormData({ ...formData, premium: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="premium">Premium Ürün (👑 etiketli gösterilir)</Label>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    İptal
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {editingProduct ? 'Güncelle' : 'Kaydet'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {DEFAULT_CATEGORIES.map(cat => {
          const count = products.filter(p => p.category === cat.id).length;
          return (
            <Card 
              key={cat.id} 
              className={`cursor-pointer transition-colors ${selectedCategory === cat.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? 'all' : cat.id)}
            >
              <CardContent className="p-4 text-center">
                <span className="text-3xl">{cat.icon}</span>
                <p className="font-medium mt-1">{cat.name}</p>
                <p className="text-2xl font-bold text-primary">{count}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Ürünler {selectedCategory !== 'all' && `(${getCategoryName(selectedCategory)})`}</span>
            {selectedCategory !== 'all' && (
              <Button variant="ghost" size="sm" onClick={() => setSelectedCategory('all')}>
                Tümünü Göster
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Henüz ürün eklenmemiş</p>
              <p className="text-sm">Yeni ürün eklemek için yukarıdaki butonu kullanın</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Görsel</TableHead>
                  <TableHead>Ürün Adı</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Fiyat</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      {product.image ? (
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded-lg"
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/64?text=No+Image'; }}
                        />
                      ) : (
                        <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                          <Image className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">{product.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {DEFAULT_CATEGORIES.find(c => c.id === product.category)?.icon} {getCategoryName(product.category)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">{formatCurrency(product.price)}</TableCell>
                    <TableCell>
                      {product.premium && <Badge className="bg-yellow-500">👑 Premium</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEditDialog(product)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(product.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default KioskAdmin;
