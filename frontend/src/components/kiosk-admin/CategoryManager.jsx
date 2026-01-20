import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Layers, Loader2, Save } from 'lucide-react';
import { BACKEND_URL, EMOJI_OPTIONS } from './constants';

export function CategoryManager({ categories, setCategories, products, onRefresh }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [saving, setSaving] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: '', icon: '📦', order: 0 });

  const getToken = () => localStorage.getItem('kasaburger_token') || localStorage.getItem('dealer_token');

  const openCategoryDialog = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        icon: category.icon || '📦',
        order: category.order || 0
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: '', icon: '📦', order: categories.length });
    }
    setDialogOpen(true);
  };

  const saveCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast.error('Kategori adı gerekli');
      return;
    }

    setSaving(true);
    try {
      const token = getToken();
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
          order: categoryForm.order
        })
      });

      if (response.ok) {
        toast.success(editingCategory ? 'Kategori güncellendi' : 'Kategori eklendi');
        setDialogOpen(false);
        onRefresh();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Hata oluştu');
      }
    } catch (error) {
      toast.error('Bağlantı hatası');
    }
    setSaving(false);
  };

  const deleteCategory = async (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    const productCount = products.filter(p => p.category === category?.name).length;
    
    if (productCount > 0) {
      toast.error('Bu kategoride ürün var, önce ürünleri silin veya taşıyın');
      return;
    }

    if (!window.confirm('Bu kategoriyi silmek istediğinize emin misiniz?')) return;

    try {
      const token = getToken();
      const response = await fetch(`${BACKEND_URL}/api/kiosk/categories/${categoryId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success('Kategori silindi');
        onRefresh();
      }
    } catch (error) {
      toast.error('Silme hatası');
    }
  };

  const moveCategoryUp = async (index) => {
    if (index === 0) return;
    const newCategories = [...categories];
    [newCategories[index - 1], newCategories[index]] = [newCategories[index], newCategories[index - 1]];
    await updateCategoryOrders(newCategories);
  };

  const moveCategoryDown = async (index) => {
    if (index === categories.length - 1) return;
    const newCategories = [...categories];
    [newCategories[index], newCategories[index + 1]] = [newCategories[index + 1], newCategories[index]];
    await updateCategoryOrders(newCategories);
  };

  const updateCategoryOrders = async (newCategories) => {
    try {
      const token = getToken();
      const updates = newCategories.map((cat, idx) => ({
        id: cat.id,
        order: idx
      }));

      await fetch(`${BACKEND_URL}/api/kiosk/categories/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ categories: updates })
      });

      setCategories(newCategories);
      toast.success('Sıralama güncellendi');
    } catch (error) {
      toast.error('Sıralama hatası');
    }
  };

  return (
    <>
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

      {/* Category Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Kategori Düzenle' : 'Yeni Kategori'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Kategori Adı</Label>
              <Input
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                placeholder="Örn: Burgerler"
              />
            </div>
            <div className="space-y-2">
              <Label>İkon</Label>
              <div className="flex flex-wrap gap-2">
                {EMOJI_OPTIONS.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setCategoryForm({...categoryForm, icon: emoji})}
                    className={`text-2xl p-2 rounded-lg border-2 transition-all ${
                      categoryForm.icon === emoji 
                        ? 'border-primary bg-primary/10' 
                        : 'border-transparent hover:border-muted'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
            <Button onClick={saveCategory} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Kaydet
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
