// KioskAdmin v2.3 - Updated: 2026-01-19 - Kategori Yönetimi Eklendi
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Image, Save, Loader2, Monitor, ExternalLink, RefreshCw, Upload, GripVertical, Layers, Package, Gift, Percent } from 'lucide-react';

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
  // ET BURGER - Cloudinary görselleri (18 Ocak 2026 yükleme)
  {id: "kasa-classic", name: "Kasa Classic Burger", category: "et-burger", price: 460, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719627/kasaburger/products/lxmwj2opjfgpn5wfyvni.jpg", is_active: true, description: "150 gr. özel baharatlı dana köfte, taze yeşillik, Kasa Gizli Sos"},
  {id: "golden-burger", name: "Golden Burger", category: "et-burger", price: 1190, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719644/kasaburger/products/etnwv98b4qqa3dhs7j5w.jpg", is_active: true, is_premium: true, description: "150 gr. Dry-Aged köfte, brioche ekmek, yenilebilir altın kaplama, trüf sos, double cheddar"},
  {id: "cheese-lover", name: "Cheese Lover Burger", category: "et-burger", price: 560, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719667/kasaburger/products/c2kdofwltpm4xsrcheuu.jpg", is_active: true, description: "150 gr. dana köfte, çift cheddar + erimiş peynir sosu, karamelize soğan"},
  {id: "no7-burger", name: "No:7 Burger", category: "et-burger", price: 540, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719690/kasaburger/products/dvqjrymmcqtfjxiuc29z.jpg", is_active: true, description: "150 gr. dana köfte, double cheddar, jalapeno, acılı kasa sos, çıtır soğan"},
  {id: "hirsiz-polis", name: "Hırsız & Polis Burger", category: "et-burger", price: 490, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719731/kasaburger/products/zo9ysvxshviqu7pbqztq.jpg", is_active: true, description: "2x150 gr. dana köfte, Polis sos (tatlı), Hırsız (acı), cheddar"},
  // PREMIUM GOURMET
  {id: "viking-burger", name: "Viking Burger", category: "premium", price: 430, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719764/kasaburger/products/fojwkaq08bwngprupkgt.jpg", is_active: true, is_premium: true, description: "150 gr. dana köfte, 20 gr. cheddar peyniri, çıtır soğan, viking sos"},
  {id: "milano-burger", name: "Milano Burger", category: "premium", price: 440, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719790/kasaburger/products/oybw8jxjs53wleejjeen.jpg", is_active: true, is_premium: true, description: "150gr. dana köfte, mozzarella, kuru domates, pesto mayo, roka"},
  {id: "kasa-double-xl", name: "Kasa Double XL", category: "premium", price: 640, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719837/kasaburger/products/e5erpcna8ufgyl4roxhh.jpg", is_active: true, is_premium: true, description: "300 gr. dana köfte, 40 gr. cheddar, karamelize soğan, kasa özel sos"},
  {id: "smoky-bbq", name: "Smoky BBQ Burger", category: "premium", price: 560, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719856/kasaburger/products/zx1kw1d23traidkigrdv.jpg", is_active: true, is_premium: true, description: "150 gr. dana köfte, 20 gr. cheddar, kızartılmış pastırma, bbq sos"},
  {id: "animal-style", name: "Animal Style Burger", category: "premium", price: 550, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719882/kasaburger/products/sdgw0vm1iicwkjvvkeee.jpg", is_active: true, is_premium: true, description: "150 gr. dana köfte, cheddar peynir, karamelize soğan, animal sos"},
  // TAVUK BURGER
  {id: "crispy-chicken", name: "Crispy Chicken Burger", category: "tavuk", price: 360, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719954/kasaburger/products/xobrshlgrwd4opojrmum.jpg", is_active: true, description: "Çıtır paneli tavuk göğsü, taze yeşillik, turşu, mayonez"},
  {id: "double-crispy", name: "Double Crispy Chicken", category: "tavuk", price: 410, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719978/kasaburger/products/ronl4qic10vbgjictclt.jpg", is_active: true, description: "Double tavuk, cheddar, taze yeşillik, acılı kasa sos, turşu"},
  {id: "animal-chicken", name: "Animal Style Chicken", category: "tavuk", price: 430, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720009/kasaburger/products/lpmkvz6bhfewl5pgskic.jpg", is_active: true, description: "Çıtır paneli tavuk göğsü, karamelize soğan, double cheddar, animal sos"},
  {id: "spicy-hirsiz", name: "(Spicy) Hırsız Burger", category: "tavuk", price: 420, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720039/kasaburger/products/bvxcrizznvjaqjvxlucu.jpg", is_active: true, description: "Acı marinasyonlu çıtır tavuk, cheddar, acılı kasa mayonez, jalapeno"},
  {id: "sweet-polis", name: "(Sweet) Polis Burger", category: "tavuk", price: 420, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720071/kasaburger/products/w50qmsz041zi7h4pjkwu.jpg", is_active: true, description: "Tatlı marinasyonlu çıtır tavuk, tatlı kasa sos, taze yeşillik, mozzarella"},
  {id: "milano-chicken", name: "Milano Chicken Burger", category: "tavuk", price: 440, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720100/kasaburger/products/tfrehnmtr9juqankalhj.jpg", is_active: true, description: "İnce paneli çıtır tavuk, pesto mayo, kurutulmuş domates, mozzarella"},
  {id: "viking-chicken", name: "Viking Chicken Burger", category: "tavuk", price: 430, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720128/kasaburger/products/qwg6eqpyimd8dpn9nr1v.jpg", is_active: true, description: "Viking sos, çıtır tavuk, cheddar, kornişon turşu, çıtır soğan"},
  // ATISTIRMALIKLAR
  {id: "mac-cheese", name: "Mac and Cheese Topları", category: "atistirmalik", price: 170, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720160/kasaburger/products/jnzrcojxzkdrgb5u2exk.jpg", is_active: true},
  {id: "mozarella-sticks", name: "Mozarella Sticks", category: "atistirmalik", price: 210, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720187/kasaburger/products/kvsrbiutiqdqhoolov8z.jpg", is_active: true, description: "6 adet (yarım porsiyon patates ile)"},
  {id: "sogan-halkasi", name: "Soğan Halkası", category: "atistirmalik", price: 180, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720212/kasaburger/products/ujatmwdny3it8dzcikkn.jpg", is_active: true, description: "8 adet (yarım porsiyon patates ile)"},
  {id: "cheese-fries", name: "Prison Cheese Lover Fries", category: "atistirmalik", price: 150, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720240/kasaburger/products/dzxb0lv41xafeybynhri.jpg", is_active: true, description: "Cheddar soslu patates"},
  {id: "truffle-fries", name: "Prison Truffle Fries", category: "atistirmalik", price: 175, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720258/kasaburger/products/cj3px5epr92okzergc7c.jpg", is_active: true, description: "Trüf soslu patates"},
  {id: "cajun-fries", name: "Prison Hot Lockdown Fries", category: "atistirmalik", price: 160, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720282/kasaburger/products/csdwzqwozldfxxt7pkpr.jpg", is_active: true, description: "Cajun baharatlı patates"},
  // İÇECEKLER
  {id: "ayran", name: "Ayran", category: "icecek", price: 35, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720311/kasaburger/products/xgrn8fvph9jaeh1bqwat.jpg", is_active: true},
  {id: "su", name: "Su", category: "icecek", price: 20, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720333/kasaburger/products/jl2q8smtq7de6lh16uul.jpg", is_active: true},
  {id: "limonata", name: "Limonata", category: "icecek", price: 55, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720355/kasaburger/products/exyjmazfyp4hyx2hbxsu.jpg", is_active: true},
  {id: "pepsi", name: "Pepsi", category: "icecek", price: 45, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720380/kasaburger/products/zu98squbgxxa0hppmxwn.jpg", is_active: true},
  {id: "milkshake", name: "Milkshake", category: "icecek", price: 85, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720424/kasaburger/products/uitufnzpxr7fatrttobr.jpg", is_active: true},
  // TATLILAR
  {id: "choco-bomb", name: "Kasa Choco Bomb", category: "tatli", price: 200, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768687930/kasaburger/products/ohr3dgedrnaz53p8p26t.jpg", is_active: true},
  {id: "churros", name: "Churros", category: "tatli", price: 180, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768686916/kasaburger/products/yveoyknzrq0w0kuwxxvq.jpg", is_active: true},
  {id: "oreo-dream", name: "Oreo Dream Cup", category: "tatli", price: 220, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768686685/kasaburger/products/ktej7vqaqnm2qt5fjnce.jpg", is_active: true},
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
    category: 'Et Burger',
    image: '',
    premium: false
  });
  const [selectedCategory, setSelectedCategory] = useState('all');
  const fileInputRef = useRef(null);
  
  // Kategori Yönetimi State'leri
  const [categories, setCategories] = useState([]);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', icon: '📦', order: 0 });
  const [activeTab, setActiveTab] = useState('products');

  // Combo ve Promosyon State'leri
  const [combos, setCombos] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [comboDialogOpen, setComboDialogOpen] = useState(false);
  const [promoDialogOpen, setPromoDialogOpen] = useState(false);
  const [editingCombo, setEditingCombo] = useState(null);
  const [editingPromo, setEditingPromo] = useState(null);
  const [comboForm, setComboForm] = useState({
    name: '', description: '', products: [], original_price: 0, combo_price: 0,
    discount_percent: 0, image: '', is_active: true, start_hour: null, end_hour: null
  });
  const [promoForm, setPromoForm] = useState({
    title: '', description: '', discount_type: 'percent', discount_value: 0,
    min_order_amount: null, applicable_categories: [], start_hour: null, end_hour: null,
    is_active: true, banner_color: '#FF6B00'
  });

  // Cloudinary'ye dosya yükleme fonksiyonu
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
        // Cloudinary URL'ini direkt kullan (artık CDN URL'i dönüyor)
        setFormData(prev => ({ ...prev, image: data.url }));
        toast.success('Resim Cloudinary\'ye yüklendi!');
      } else {
        const errorData = await response.json();
        toast.error(errorData.detail || 'Resim yüklenemedi');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Yükleme hatası');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadCombos();
    loadPromotions();
  }, []);

  // ==================== COMBO FONKSİYONLARI ====================
  
  const loadCombos = async () => {
    try {
      const token = localStorage.getItem('kasaburger_token');
      const response = await fetch(`${BACKEND_URL}/api/kiosk/combos/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCombos(data || []);
      }
    } catch (error) {
      console.error('Combo yükleme hatası:', error);
    }
  };

  const openComboDialog = (combo = null) => {
    if (combo) {
      setEditingCombo(combo);
      setComboForm({
        name: combo.name, description: combo.description || '',
        products: combo.products || [], original_price: combo.original_price || 0,
        combo_price: combo.combo_price || 0, discount_percent: combo.discount_percent || 0,
        image: combo.image || '', is_active: combo.is_active !== false,
        start_hour: combo.start_hour, end_hour: combo.end_hour
      });
    } else {
      setEditingCombo(null);
      setComboForm({
        name: '', description: '', products: [], original_price: 0, combo_price: 0,
        discount_percent: 0, image: '', is_active: true, start_hour: null, end_hour: null
      });
    }
    setComboDialogOpen(true);
  };

  const saveCombo = async () => {
    if (!comboForm.name.trim() || comboForm.products.length === 0) {
      toast.error('Combo adı ve en az 1 ürün gerekli');
      return;
    }
    try {
      const token = localStorage.getItem('kasaburger_token');
      const url = editingCombo 
        ? `${BACKEND_URL}/api/kiosk/combos/${editingCombo.id}`
        : `${BACKEND_URL}/api/kiosk/combos`;
      
      const response = await fetch(url, {
        method: editingCombo ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(comboForm)
      });
      
      if (response.ok) {
        toast.success(editingCombo ? 'Combo güncellendi!' : 'Combo oluşturuldu!');
        loadCombos();
        setComboDialogOpen(false);
      } else {
        toast.error('İşlem başarısız');
      }
    } catch (error) {
      toast.error('İşlem başarısız');
    }
  };

  const deleteCombo = async (comboId) => {
    if (!window.confirm('Bu combo menüyü silmek istediğinize emin misiniz?')) return;
    try {
      const token = localStorage.getItem('kasaburger_token');
      await fetch(`${BACKEND_URL}/api/kiosk/combos/${comboId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Combo silindi!');
      loadCombos();
    } catch (error) {
      toast.error('Silme başarısız');
    }
  };

  // ==================== PROMOSYON FONKSİYONLARI ====================
  
  const loadPromotions = async () => {
    try {
      const token = localStorage.getItem('kasaburger_token');
      const response = await fetch(`${BACKEND_URL}/api/kiosk/promotions/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPromotions(data || []);
      }
    } catch (error) {
      console.error('Promosyon yükleme hatası:', error);
    }
  };

  const openPromoDialog = (promo = null) => {
    if (promo) {
      setEditingPromo(promo);
      setPromoForm({
        title: promo.title, description: promo.description || '',
        discount_type: promo.discount_type || 'percent', discount_value: promo.discount_value || 0,
        min_order_amount: promo.min_order_amount, applicable_categories: promo.applicable_categories || [],
        start_hour: promo.start_hour, end_hour: promo.end_hour,
        is_active: promo.is_active !== false, banner_color: promo.banner_color || '#FF6B00'
      });
    } else {
      setEditingPromo(null);
      setPromoForm({
        title: '', description: '', discount_type: 'percent', discount_value: 0,
        min_order_amount: null, applicable_categories: [], start_hour: null, end_hour: null,
        is_active: true, banner_color: '#FF6B00'
      });
    }
    setPromoDialogOpen(true);
  };

  const savePromotion = async () => {
    if (!promoForm.title.trim()) {
      toast.error('Promosyon başlığı gerekli');
      return;
    }
    try {
      const token = localStorage.getItem('kasaburger_token');
      const url = editingPromo 
        ? `${BACKEND_URL}/api/kiosk/promotions/${editingPromo.id}`
        : `${BACKEND_URL}/api/kiosk/promotions`;
      
      const response = await fetch(url, {
        method: editingPromo ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(promoForm)
      });
      
      if (response.ok) {
        toast.success(editingPromo ? 'Promosyon güncellendi!' : 'Promosyon oluşturuldu!');
        loadPromotions();
        setPromoDialogOpen(false);
      } else {
        toast.error('İşlem başarısız');
      }
    } catch (error) {
      toast.error('İşlem başarısız');
    }
  };

  const deletePromotion = async (promoId) => {
    if (!window.confirm('Bu promosyonu silmek istediğinize emin misiniz?')) return;
    try {
      const token = localStorage.getItem('kasaburger_token');
      await fetch(`${BACKEND_URL}/api/kiosk/promotions/${promoId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Promosyon silindi!');
      loadPromotions();
    } catch (error) {
      toast.error('Silme başarısız');
    }
  };

  // ==================== KATEGORİ FONKSİYONLARI ====================
  
  const loadCategories = async () => {
    try {
      const token = localStorage.getItem('kasaburger_token');
      const response = await fetch(`${BACKEND_URL}/api/kiosk/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data.sort((a, b) => a.order - b.order));
      }
    } catch (error) {
      console.error('Kategori yükleme hatası:', error);
    }
  };

  const openCategoryDialog = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({ name: category.name, icon: category.icon, order: category.order || 0 });
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: '', icon: '📦', order: categories.length + 1 });
    }
    setCategoryDialogOpen(true);
  };

  const saveCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast.error('Kategori adı gerekli');
      return;
    }
    
    try {
      const token = localStorage.getItem('kasaburger_token');
      const url = editingCategory 
        ? `${BACKEND_URL}/api/kiosk/categories/${editingCategory.id}`
        : `${BACKEND_URL}/api/kiosk/categories`;
      
      const response = await fetch(url, {
        method: editingCategory ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: categoryForm.name,
          icon: categoryForm.icon,
          order: categoryForm.order,
          is_active: true
        })
      });
      
      if (response.ok) {
        toast.success(editingCategory ? 'Kategori güncellendi!' : 'Kategori oluşturuldu!');
        loadCategories();
        loadProducts(); // Ürünleri de yenile (kategori adı değişmiş olabilir)
        setCategoryDialogOpen(false);
      } else {
        const error = await response.json();
        toast.error(error.detail || 'İşlem başarısız');
      }
    } catch (error) {
      toast.error('İşlem başarısız');
    }
  };

  const deleteCategory = async (categoryId) => {
    if (!window.confirm('Bu kategoriyi silmek istediğinize emin misiniz?')) return;
    
    try {
      const token = localStorage.getItem('kasaburger_token');
      const response = await fetch(`${BACKEND_URL}/api/kiosk/categories/${categoryId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        toast.success('Kategori silindi!');
        loadCategories();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Silme başarısız');
      }
    } catch (error) {
      toast.error('Silme başarısız');
    }
  };

  const moveCategoryUp = async (index) => {
    if (index === 0) return;
    const newCategories = [...categories];
    [newCategories[index - 1], newCategories[index]] = [newCategories[index], newCategories[index - 1]];
    await updateCategoryOrder(newCategories);
  };

  const moveCategoryDown = async (index) => {
    if (index === categories.length - 1) return;
    const newCategories = [...categories];
    [newCategories[index], newCategories[index + 1]] = [newCategories[index + 1], newCategories[index]];
    await updateCategoryOrder(newCategories);
  };

  const updateCategoryOrder = async (newCategories) => {
    setCategories(newCategories);
    try {
      const token = localStorage.getItem('kasaburger_token');
      await fetch(`${BACKEND_URL}/api/kiosk/categories/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ category_ids: newCategories.map(c => c.id) })
      });
      toast.success('Sıralama güncellendi!');
    } catch (error) {
      toast.error('Sıralama güncellenemedi');
    }
  };

  // ==================== ÜRÜN FONKSİYONLARI ====================

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
    return categories.find(c => c.id === id || c.name === id)?.name || id;
  };
  
  const getCategoryIcon = (name) => {
    return categories.find(c => c.name === name)?.icon || '📦';
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
          <p className="text-muted-foreground">Self-servis kiosk ürünlerini ve kategorilerini yönetin</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <a href="/kiosk" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Kiosk'u Görüntüle
            </a>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Ürünler
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Kategoriler
          </TabsTrigger>
          <TabsTrigger value="combos" className="flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Menüler
          </TabsTrigger>
          <TabsTrigger value="promotions" className="flex items-center gap-2">
            <Percent className="h-4 w-4" />
            Kampanyalar
          </TabsTrigger>
        </TabsList>

        {/* ==================== KATEGORİ YÖNETİMİ TAB ==================== */}
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Kategori Yönetimi
              </CardTitle>
              <Button onClick={() => openCategoryDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Yeni Kategori
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Kategorilerin sırasını değiştirmek için ↑↓ oklarını kullanın. Kiosk ekranında bu sırayla görünecekler.
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Sıra</TableHead>
                    <TableHead className="w-16">İkon</TableHead>
                    <TableHead>Kategori Adı</TableHead>
                    <TableHead className="w-24">Ürün Sayısı</TableHead>
                    <TableHead className="w-32 text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category, index) => {
                    const productCount = products.filter(p => p.category === category.name).length;
                    return (
                      <TableRow key={category.id}>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6"
                              onClick={() => moveCategoryUp(index)}
                              disabled={index === 0}
                            >
                              ↑
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6"
                              onClick={() => moveCategoryDown(index)}
                              disabled={index === categories.length - 1}
                            >
                              ↓
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-2xl">{category.icon}</span>
                        </TableCell>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{productCount} ürün</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openCategoryDialog(category)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-destructive"
                              onClick={() => deleteCategory(category.id)}
                              disabled={productCount > 0}
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
              
              {categories.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Henüz kategori yok. "Yeni Kategori" butonuyla ekleyin.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Kategori Dialog */}
          <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCategory ? 'Kategori Düzenle' : 'Yeni Kategori'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Kategori Adı</Label>
                  <Input
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Örn: Et Burger"
                  />
                </div>
                <div>
                  <Label>İkon (Emoji)</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      value={categoryForm.icon}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, icon: e.target.value }))}
                      className="w-20 text-center text-2xl"
                    />
                    <div className="flex gap-1 flex-wrap">
                      {['🍔', '👑', '🍗', '🍟', '🥤', '🍫', '🌮', '🍕', '🥗', '🍰'].map(emoji => (
                        <Button 
                          key={emoji} 
                          variant="outline" 
                          size="sm"
                          type="button"
                          onClick={() => setCategoryForm(prev => ({ ...prev, icon: emoji }))}
                        >
                          {emoji}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>İptal</Button>
                  <Button onClick={saveCategory}>
                    <Save className="mr-2 h-4 w-4" />
                    Kaydet
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ==================== ÜRÜN YÖNETİMİ TAB ==================== */}
        <TabsContent value="products" className="space-y-4">
          <div className="flex gap-3 justify-end">
            <Button variant="destructive" onClick={() => seedProducts(true)} disabled={seeding} size="sm">
              {seeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Ürünleri Sıfırla
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
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.name}>
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

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map(cat => {
              const count = products.filter(p => p.category === cat.name).length;
              return (
                <Card 
                  key={cat.id} 
                  className={`cursor-pointer transition-colors ${selectedCategory === cat.name ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                  onClick={() => setSelectedCategory(selectedCategory === cat.name ? 'all' : cat.name)}
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
                        {getCategoryIcon(product.category)} {product.category}
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
    </TabsContent>

        {/* ==================== COMBO MENÜ YÖNETİMİ TAB ==================== */}
        <TabsContent value="combos" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Combo Menüler
              </CardTitle>
              <Button onClick={() => openComboDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Yeni Combo
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Combo menüler ile müşterilerinize indirimli fırsatlar sunun. Saat bazlı kampanyalar oluşturabilirsiniz.
              </p>
              <div className="grid gap-4">
                {combos.map(combo => (
                  <div key={combo.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    {combo.image && (
                      <img src={combo.image} alt={combo.name} className="w-20 h-20 object-cover rounded-lg" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{combo.name}</h4>
                        {combo.is_active ? (
                          <Badge className="bg-green-500">Aktif</Badge>
                        ) : (
                          <Badge variant="secondary">Pasif</Badge>
                        )}
                        {combo.start_hour !== null && combo.end_hour !== null && (
                          <Badge variant="outline">🕐 {combo.start_hour}:00-{combo.end_hour}:00</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{combo.description}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-muted-foreground line-through">₺{combo.original_price}</span>
                        <span className="text-green-600 font-bold">₺{combo.combo_price}</span>
                        <Badge className="bg-orange-500">%{combo.discount_percent} İndirim</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openComboDialog(combo)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteCombo(combo.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {combos.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Gift className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    Henüz combo menü yok. "Yeni Combo" butonuyla ekleyin.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Combo Dialog */}
          <Dialog open={comboDialogOpen} onOpenChange={setComboDialogOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingCombo ? 'Combo Düzenle' : 'Yeni Combo Menü'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                <div>
                  <Label>Combo Adı *</Label>
                  <Input value={comboForm.name} onChange={(e) => setComboForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Örn: Klasik Menü" />
                </div>
                <div>
                  <Label>Açıklama</Label>
                  <Input value={comboForm.description} onChange={(e) => setComboForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Örn: Burger + Patates + İçecek" />
                </div>
                <div>
                  <Label>Ürünler (Seçin)</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded p-2">
                    {products.map(p => (
                      <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted p-1 rounded">
                        <input
                          type="checkbox"
                          checked={comboForm.products.includes(p.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setComboForm(prev => ({ ...prev, products: [...prev.products, p.id], original_price: prev.original_price + p.price }));
                            } else {
                              setComboForm(prev => ({ ...prev, products: prev.products.filter(id => id !== p.id), original_price: prev.original_price - p.price }));
                            }
                          }}
                        />
                        {p.name} (₺{p.price})
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Seçili: {comboForm.products.length} ürün, Toplam: ₺{comboForm.original_price}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Orijinal Fiyat</Label>
                    <Input type="number" value={comboForm.original_price} onChange={(e) => setComboForm(prev => ({ ...prev, original_price: parseFloat(e.target.value) || 0 }))} />
                  </div>
                  <div>
                    <Label>Combo Fiyatı *</Label>
                    <Input type="number" value={comboForm.combo_price} onChange={(e) => {
                      const price = parseFloat(e.target.value) || 0;
                      const discount = comboForm.original_price > 0 ? Math.round((1 - price / comboForm.original_price) * 100) : 0;
                      setComboForm(prev => ({ ...prev, combo_price: price, discount_percent: discount }));
                    }} />
                  </div>
                </div>
                <div>
                  <Label>İndirim Oranı: %{comboForm.discount_percent}</Label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Başlangıç Saati (opsiyonel)</Label>
                    <Select value={comboForm.start_hour?.toString() || ''} onValueChange={(v) => setComboForm(prev => ({ ...prev, start_hour: v ? parseInt(v) : null }))}>
                      <SelectTrigger><SelectValue placeholder="Her zaman" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Her zaman</SelectItem>
                        {[...Array(24)].map((_, i) => <SelectItem key={i} value={i.toString()}>{i}:00</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Bitiş Saati</Label>
                    <Select value={comboForm.end_hour?.toString() || ''} onValueChange={(v) => setComboForm(prev => ({ ...prev, end_hour: v ? parseInt(v) : null }))}>
                      <SelectTrigger><SelectValue placeholder="Her zaman" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Her zaman</SelectItem>
                        {[...Array(24)].map((_, i) => <SelectItem key={i} value={i.toString()}>{i}:00</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Görsel URL</Label>
                  <Input value={comboForm.image} onChange={(e) => setComboForm(prev => ({ ...prev, image: e.target.value }))} placeholder="https://..." />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="combo-active" checked={comboForm.is_active} onChange={(e) => setComboForm(prev => ({ ...prev, is_active: e.target.checked }))} />
                  <Label htmlFor="combo-active">Aktif</Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setComboDialogOpen(false)}>İptal</Button>
                  <Button onClick={saveCombo}><Save className="mr-2 h-4 w-4" />Kaydet</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ==================== PROMOSYON YÖNETİMİ TAB ==================== */}
        <TabsContent value="promotions" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5" />
                Kampanyalar & Promosyonlar
              </CardTitle>
              <Button onClick={() => openPromoDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Yeni Kampanya
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Kiosk ekranında üst banner olarak gösterilecek kampanyalar. Saat bazlı veya minimum sipariş tutarı ile aktif olabilir.
              </p>
              <div className="grid gap-4">
                {promotions.map(promo => (
                  <div key={promo.id} className="flex items-center gap-4 p-4 border rounded-lg" style={{ borderLeftWidth: 4, borderLeftColor: promo.banner_color }}>
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl" style={{ backgroundColor: promo.banner_color }}>
                      {promo.discount_type === 'percent' ? '%' : '₺'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{promo.title}</h4>
                        {promo.is_active ? (
                          <Badge className="bg-green-500">Aktif</Badge>
                        ) : (
                          <Badge variant="secondary">Pasif</Badge>
                        )}
                        {promo.start_hour !== null && promo.end_hour !== null && (
                          <Badge variant="outline">🕐 {promo.start_hour}:00-{promo.end_hour}:00</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{promo.description}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <Badge>{promo.discount_type === 'percent' ? `%${promo.discount_value} İndirim` : `₺${promo.discount_value} İndirim`}</Badge>
                        {promo.min_order_amount && <span className="text-xs text-muted-foreground">Min: ₺{promo.min_order_amount}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openPromoDialog(promo)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deletePromotion(promo.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {promotions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Percent className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    Henüz kampanya yok. "Yeni Kampanya" butonuyla ekleyin.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Promosyon Dialog */}
          <Dialog open={promoDialogOpen} onOpenChange={setPromoDialogOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingPromo ? 'Kampanya Düzenle' : 'Yeni Kampanya'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                <div>
                  <Label>Kampanya Başlığı *</Label>
                  <Input value={promoForm.title} onChange={(e) => setPromoForm(prev => ({ ...prev, title: e.target.value }))} placeholder="Örn: Happy Hour! 🎉" />
                </div>
                <div>
                  <Label>Açıklama</Label>
                  <Input value={promoForm.description} onChange={(e) => setPromoForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Örn: 14:00-17:00 arası tüm burgerlerde %10 indirim" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>İndirim Tipi</Label>
                    <Select value={promoForm.discount_type} onValueChange={(v) => setPromoForm(prev => ({ ...prev, discount_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percent">Yüzde (%)</SelectItem>
                        <SelectItem value="fixed">Sabit (₺)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>İndirim Değeri</Label>
                    <Input type="number" value={promoForm.discount_value} onChange={(e) => setPromoForm(prev => ({ ...prev, discount_value: parseFloat(e.target.value) || 0 }))} />
                  </div>
                </div>
                <div>
                  <Label>Minimum Sipariş Tutarı (opsiyonel)</Label>
                  <Input type="number" value={promoForm.min_order_amount || ''} onChange={(e) => setPromoForm(prev => ({ ...prev, min_order_amount: e.target.value ? parseFloat(e.target.value) : null }))} placeholder="Örn: 200" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Başlangıç Saati</Label>
                    <Select value={promoForm.start_hour?.toString() || ''} onValueChange={(v) => setPromoForm(prev => ({ ...prev, start_hour: v ? parseInt(v) : null }))}>
                      <SelectTrigger><SelectValue placeholder="Her zaman" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Her zaman</SelectItem>
                        {[...Array(24)].map((_, i) => <SelectItem key={i} value={i.toString()}>{i}:00</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Bitiş Saati</Label>
                    <Select value={promoForm.end_hour?.toString() || ''} onValueChange={(v) => setPromoForm(prev => ({ ...prev, end_hour: v ? parseInt(v) : null }))}>
                      <SelectTrigger><SelectValue placeholder="Her zaman" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Her zaman</SelectItem>
                        {[...Array(24)].map((_, i) => <SelectItem key={i} value={i.toString()}>{i}:00</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Banner Rengi</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={promoForm.banner_color} onChange={(e) => setPromoForm(prev => ({ ...prev, banner_color: e.target.value }))} className="w-20 h-10 p-1" />
                    <Input value={promoForm.banner_color} onChange={(e) => setPromoForm(prev => ({ ...prev, banner_color: e.target.value }))} className="flex-1" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="promo-active" checked={promoForm.is_active} onChange={(e) => setPromoForm(prev => ({ ...prev, is_active: e.target.checked }))} />
                  <Label htmlFor="promo-active">Aktif</Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setPromoDialogOpen(false)}>İptal</Button>
                  <Button onClick={savePromotion}><Save className="mr-2 h-4 w-4" />Kaydet</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>
  </Tabs>
</div>
  );
};

export default KioskAdmin;
