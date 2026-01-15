import React, { useState, useEffect } from 'react';
import { recipesAPI, productsAPI, materialsAPI } from '../lib/api';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { toast } from 'sonner';
import { Plus, Trash2, FlaskConical, Loader2, X } from 'lucide-react';

const Recipes = () => {
  const [recipes, setRecipes] = useState([]);
  const [products, setProducts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    product_id: '',
    product_name: '',
    ingredients: [],
    yield_quantity: '',
    yield_unit: 'kg',
    notes: '',
  });
  const [currentIngredient, setCurrentIngredient] = useState({
    material_id: '',
    material_name: '',
    quantity: '',
    unit: 'kg',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [recipesRes, productsRes, materialsRes] = await Promise.all([
        recipesAPI.getAll(),
        productsAPI.getAll(),
        materialsAPI.getAll(),
      ]);
      setRecipes(recipesRes.data);
      setProducts(productsRes.data);
      setMaterials(materialsRes.data);
    } catch (error) {
      toast.error('Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleAddIngredient = () => {
    if (!currentIngredient.material_id || !currentIngredient.quantity) {
      toast.error('Hammadde ve miktar gerekli');
      return;
    }
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, { ...currentIngredient }],
    });
    setCurrentIngredient({ material_id: '', material_name: '', quantity: '', unit: 'kg' });
  };

  const handleRemoveIngredient = (index) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.product_id || formData.ingredients.length === 0 || !formData.yield_quantity) {
      toast.error('Lütfen ürün, malzemeler ve verim miktarını girin');
      return;
    }

    setSaving(true);
    try {
      await recipesAPI.create({
        ...formData,
        yield_quantity: parseFloat(formData.yield_quantity),
        ingredients: formData.ingredients.map(i => ({
          ...i,
          quantity: parseFloat(i.quantity),
        })),
      });
      toast.success('Reçete oluşturuldu');
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
    if (!window.confirm('Bu reçeteyi silmek istediğinize emin misiniz?')) return;

    try {
      await recipesAPI.delete(id);
      toast.success('Reçete silindi');
      loadData();
    } catch (error) {
      toast.error('Silme işlemi başarısız');
    }
  };

  const resetForm = () => {
    setFormData({
      product_id: '',
      product_name: '',
      ingredients: [],
      yield_quantity: '',
      yield_unit: 'kg',
      notes: '',
    });
    setCurrentIngredient({ material_id: '', material_name: '', quantity: '', unit: 'kg' });
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="recipes-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold">Reçeteler</h1>
          <p className="text-muted-foreground">Ürün reçetelerini yönetin</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground shadow-lg shadow-primary/20" data-testid="add-recipe-btn">
              <Plus className="h-4 w-4 mr-2" />
              Yeni Reçete
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-heading">Yeni Reçete</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ürün *</Label>
                  <Select
                    value={formData.product_id}
                    onValueChange={(value) => {
                      const prod = products.find(p => p.id === value);
                      setFormData({ ...formData, product_id: value, product_name: prod?.name || '' });
                    }}
                  >
                    <SelectTrigger className="bg-input/50" data-testid="recipe-product-select">
                      <SelectValue placeholder="Ürün seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>Verim Miktarı *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.yield_quantity}
                      onChange={(e) => setFormData({ ...formData, yield_quantity: e.target.value })}
                      className="bg-input/50"
                      data-testid="recipe-yield-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Birim</Label>
                    <Select value={formData.yield_unit} onValueChange={(value) => setFormData({ ...formData, yield_unit: value })}>
                      <SelectTrigger className="bg-input/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="adet">adet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Ingredients Section */}
              <div className="space-y-3">
                <Label>Malzemeler *</Label>
                <div className="p-4 rounded-md border border-border bg-background/50">
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    <Select
                      value={currentIngredient.material_id}
                      onValueChange={(value) => {
                        const mat = materials.find(m => m.id === value);
                        setCurrentIngredient({ ...currentIngredient, material_id: value, material_name: mat?.name || '', unit: mat?.unit || 'kg' });
                      }}
                    >
                      <SelectTrigger className="bg-input/50 col-span-2" data-testid="ingredient-material-select">
                        <SelectValue placeholder="Hammadde" />
                      </SelectTrigger>
                      <SelectContent>
                        {materials.map((m) => (
                          <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Miktar"
                      value={currentIngredient.quantity}
                      onChange={(e) => setCurrentIngredient({ ...currentIngredient, quantity: e.target.value })}
                      className="bg-input/50"
                      data-testid="ingredient-quantity-input"
                    />
                    <Button type="button" onClick={handleAddIngredient} className="bg-primary" data-testid="add-ingredient-btn">
                      Ekle
                    </Button>
                  </div>

                  {formData.ingredients.length > 0 && (
                    <div className="space-y-2">
                      {formData.ingredients.map((ing, index) => (
                        <div key={index} className="flex items-center justify-between p-2 rounded bg-muted/50">
                          <span className="text-sm">
                            {ing.material_name} - {ing.quantity} {ing.unit}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveIngredient(index)}
                            className="h-6 w-6 text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notlar</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Reçete notları..."
                  className="bg-input/50"
                  data-testid="recipe-notes-input"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => { setDialogOpen(false); resetForm(); }}>İptal</Button>
                <Button type="submit" className="bg-primary" disabled={saving} data-testid="recipe-save-btn">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Kaydet
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Recipes Grid */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : recipes.length === 0 ? (
        <Card className="bg-card border-border/50">
          <CardContent className="text-center py-12 text-muted-foreground">
            Henüz reçete eklenmemiş
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipes.map((recipe) => (
            <Card key={recipe.id} className="bg-card border-border/50 hover:border-primary/30 transition-colors" data-testid={`recipe-card-${recipe.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-primary/20 flex items-center justify-center">
                      <FlaskConical className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-heading">{recipe.product_name}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        Verim: {recipe.yield_quantity} {recipe.yield_unit}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(recipe.id)}
                    className="text-destructive hover:text-destructive h-8 w-8"
                    data-testid={`delete-recipe-${recipe.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Malzemeler</p>
                  <ul className="space-y-1">
                    {recipe.ingredients.map((ing, index) => (
                      <li key={index} className="text-sm flex justify-between">
                        <span>{ing.material_name}</span>
                        <span className="font-mono text-muted-foreground">{ing.quantity} {ing.unit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {recipe.notes && (
                  <p className="mt-3 text-sm text-muted-foreground border-t border-border/50 pt-3">
                    {recipe.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Recipes;
