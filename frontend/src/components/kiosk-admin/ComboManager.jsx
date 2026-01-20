import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Gift, Loader2, Save } from 'lucide-react';
import { BACKEND_URL } from './constants';

const DEFAULT_COMBO_FORM = {
  name: '',
  description: '',
  products: [],
  original_price: 0,
  combo_price: 0,
  discount_percent: 0,
  image: '',
  is_active: true,
  start_hour: null,
  end_hour: null,
  gift_product_id: null
};

export function ComboManager({ combos, setCombos, products, onRefresh }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCombo, setEditingCombo] = useState(null);
  const [saving, setSaving] = useState(false);
  const [comboForm, setComboForm] = useState(DEFAULT_COMBO_FORM);

  const getToken = () => localStorage.getItem('kasaburger_token') || localStorage.getItem('dealer_token');

  const openComboDialog = (combo = null) => {
    if (combo) {
      setEditingCombo(combo);
      setComboForm({
        name: combo.name,
        description: combo.description || '',
        products: combo.products || [],
        original_price: combo.original_price || 0,
        combo_price: combo.combo_price || 0,
        discount_percent: combo.discount_percent || 0,
        image: combo.image || '',
        is_active: combo.is_active !== false,
        start_hour: combo.start_hour,
        end_hour: combo.end_hour,
        gift_product_id: combo.gift_product_id
      });
    } else {
      setEditingCombo(null);
      setComboForm(DEFAULT_COMBO_FORM);
    }
    setDialogOpen(true);
  };

  const saveCombo = async () => {
    if (!comboForm.name || comboForm.products.length === 0) {
      toast.error('Ad ve en az bir ürün gerekli');
      return;
    }

    setSaving(true);
    try {
      const token = getToken();
      const url = editingCombo 
        ? `${BACKEND_URL}/api/kiosk/combos/${editingCombo.id}`
        : `${BACKEND_URL}/api/kiosk/combos`;

      const response = await fetch(url, {
        method: editingCombo ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(comboForm)
      });

      if (response.ok) {
        toast.success(editingCombo ? 'Combo güncellendi' : 'Combo eklendi');
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

  const deleteCombo = async (comboId) => {
    if (!window.confirm('Bu combo\'yu silmek istediğinize emin misiniz?')) return;

    try {
      const token = getToken();
      const response = await fetch(`${BACKEND_URL}/api/kiosk/combos/${comboId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success('Combo silindi');
        onRefresh();
      }
    } catch (error) {
      toast.error('Silme hatası');
    }
  };

  const calculateDiscount = (original, combo) => {
    if (original <= 0) return 0;
    return Math.round(((original - combo) / original) * 100);
  };

  return (
    <>
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold">{combo.name}</h4>
                    {combo.is_active ? (
                      <Badge className="bg-green-500">Aktif</Badge>
                    ) : (
                      <Badge variant="secondary">Pasif</Badge>
                    )}
                    {combo.start_hour !== null && combo.end_hour !== null && (
                      <Badge variant="outline">🕐 {combo.start_hour}:00-{combo.end_hour}:00</Badge>
                    )}
                    {combo.gift_product_id && (
                      <Badge className="bg-pink-500">🎁 Hediye</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{combo.description}</p>
                  {combo.gift_product_id && (
                    <p className="text-sm text-pink-500 mt-1">+ {combo.gift_product_name}</p>
                  )}
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
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCombo ? 'Combo Düzenle' : 'Yeni Combo Menü'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <Label>Combo Adı *</Label>
              <Input 
                value={comboForm.name} 
                onChange={(e) => setComboForm(prev => ({ ...prev, name: e.target.value }))} 
                placeholder="Örn: Klasik Menü" 
              />
            </div>
            <div>
              <Label>Açıklama</Label>
              <Input 
                value={comboForm.description} 
                onChange={(e) => setComboForm(prev => ({ ...prev, description: e.target.value }))} 
                placeholder="Örn: Burger + Patates + İçecek" 
              />
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
                          setComboForm(prev => ({ 
                            ...prev, 
                            products: [...prev.products, p.id], 
                            original_price: prev.original_price + p.price 
                          }));
                        } else {
                          setComboForm(prev => ({ 
                            ...prev, 
                            products: prev.products.filter(id => id !== p.id), 
                            original_price: prev.original_price - p.price 
                          }));
                        }
                      }}
                    />
                    {p.name} (₺{p.price})
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Toplam Fiyat</Label>
                <Input value={`₺${comboForm.original_price}`} disabled className="bg-muted" />
              </div>
              <div>
                <Label>Combo Fiyat *</Label>
                <Input 
                  type="number" 
                  value={comboForm.combo_price} 
                  onChange={(e) => {
                    const newPrice = parseFloat(e.target.value) || 0;
                    setComboForm(prev => ({ 
                      ...prev, 
                      combo_price: newPrice,
                      discount_percent: calculateDiscount(prev.original_price, newPrice)
                    }));
                  }} 
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Başlangıç Saati (Opsiyonel)</Label>
                <Select 
                  value={comboForm.start_hour?.toString() || 'none'} 
                  onValueChange={(v) => setComboForm(prev => ({ ...prev, start_hour: v === 'none' ? null : parseInt(v) }))}
                >
                  <SelectTrigger><SelectValue placeholder="Seçin" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Her Zaman</SelectItem>
                    {[...Array(24)].map((_, i) => (
                      <SelectItem key={i} value={i.toString()}>{i}:00</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Bitiş Saati</Label>
                <Select 
                  value={comboForm.end_hour?.toString() || 'none'} 
                  onValueChange={(v) => setComboForm(prev => ({ ...prev, end_hour: v === 'none' ? null : parseInt(v) }))}
                >
                  <SelectTrigger><SelectValue placeholder="Seçin" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Her Zaman</SelectItem>
                    {[...Array(24)].map((_, i) => (
                      <SelectItem key={i} value={i.toString()}>{i}:00</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Hediye Ürün (Opsiyonel)</Label>
              <Select 
                value={comboForm.gift_product_id || 'none'} 
                onValueChange={(v) => setComboForm(prev => ({ ...prev, gift_product_id: v === 'none' ? null : v }))}
              >
                <SelectTrigger><SelectValue placeholder="Hediye yok" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Hediye yok</SelectItem>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>🎁 {p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Görsel URL</Label>
              <Input 
                value={comboForm.image} 
                onChange={(e) => setComboForm(prev => ({ ...prev, image: e.target.value }))} 
                placeholder="https://..." 
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="combo-active"
                checked={comboForm.is_active}
                onChange={(e) => setComboForm(prev => ({ ...prev, is_active: e.target.checked }))}
              />
              <Label htmlFor="combo-active">Aktif</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
            <Button onClick={saveCombo} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Kaydet
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
