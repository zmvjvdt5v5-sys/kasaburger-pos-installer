// KioskAdmin v3.0 - Refactored: 2026-01-20
// Component'ler: CategoryManager, ProductManager, ComboManager, PromotionManager

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  CategoryManager, 
  ProductManager, 
  ComboManager, 
  PromotionManager,
  BACKEND_URL 
} from '../components/kiosk-admin';

export default function KioskAdmin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data States
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [combos, setCombos] = useState([]);
  const [promotions, setPromotions] = useState([]);

  const getToken = () => localStorage.getItem('kasaburger_token') || localStorage.getItem('dealer_token');

  // Load all data
  const loadData = useCallback(async () => {
    try {
      const token = getToken();
      const headers = { Authorization: `Bearer ${token}` };

      const [catRes, prodRes, comboRes, promoRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/kiosk/categories`, { headers }),
        fetch(`${BACKEND_URL}/api/kiosk/products`, { headers }),
        fetch(`${BACKEND_URL}/api/kiosk/combos`, { headers }),
        fetch(`${BACKEND_URL}/api/kiosk/promotions`, { headers })
      ]);

      if (catRes.ok) {
        const data = await catRes.json();
        setCategories(data.sort((a, b) => (a.order || 0) - (b.order || 0)));
      }
      if (prodRes.ok) setProducts(await prodRes.json());
      if (comboRes.ok) setCombos(await comboRes.json());
      if (promoRes.ok) setPromotions(await promoRes.json());
    } catch (error) {
      console.error('Load error:', error);
      toast.error('Veri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Kiosk Yönetimi</h1>
              <p className="text-sm text-muted-foreground">
                {categories.length} Kategori • {products.length} Ürün • {combos.length} Combo • {promotions.length} Kampanya
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Yenile
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="categories" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
            <TabsTrigger value="categories">Kategoriler</TabsTrigger>
            <TabsTrigger value="products">Ürünler</TabsTrigger>
            <TabsTrigger value="combos">Combolar</TabsTrigger>
            <TabsTrigger value="promotions">Kampanyalar</TabsTrigger>
          </TabsList>

          {/* Categories Tab */}
          <TabsContent value="categories">
            <CategoryManager 
              categories={categories}
              setCategories={setCategories}
              products={products}
              onRefresh={loadData}
            />
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products">
            <ProductManager 
              products={products}
              setProducts={setProducts}
              categories={categories}
              onRefresh={loadData}
            />
          </TabsContent>

          {/* Combos Tab */}
          <TabsContent value="combos">
            <ComboManager 
              combos={combos}
              setCombos={setCombos}
              products={products}
              onRefresh={loadData}
            />
          </TabsContent>

          {/* Promotions Tab */}
          <TabsContent value="promotions">
            <PromotionManager 
              promotions={promotions}
              setPromotions={setPromotions}
              onRefresh={loadData}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
