import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Percent, Loader2, Save } from 'lucide-react';
import { BACKEND_URL } from './constants';

const DEFAULT_PROMO_FORM = {
  title: '',
  description: '',
  discount_type: 'percent',
  discount_value: 0,
  min_order_amount: null,
  banner_color: '#FF6B00',
  is_active: true,
  start_hour: null,
  end_hour: null
};

const BANNER_COLORS = [
  { value: '#FF6B00', label: 'Turuncu' },
  { value: '#22C55E', label: 'Yeşil' },
  { value: '#3B82F6', label: 'Mavi' },
  { value: '#EF4444', label: 'Kırmızı' },
  { value: '#8B5CF6', label: 'Mor' },
  { value: '#F59E0B', label: 'Sarı' }
];

export function PromotionManager({ promotions, setPromotions, onRefresh }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [saving, setSaving] = useState(false);
  const [promoForm, setPromoForm] = useState(DEFAULT_PROMO_FORM);

  const getToken = () => localStorage.getItem('kasaburger_token') || localStorage.getItem('dealer_token');

  const openPromoDialog = (promo = null) => {
    if (promo) {
      setEditingPromo(promo);
      setPromoForm({
        title: promo.title,
        description: promo.description || '',
        discount_type: promo.discount_type || 'percent',
        discount_value: promo.discount_value || 0,
        min_order_amount: promo.min_order_amount,
        banner_color: promo.banner_color || '#FF6B00',
        is_active: promo.is_active !== false,
        start_hour: promo.start_hour,
        end_hour: promo.end_hour
      });
    } else {
      setEditingPromo(null);
      setPromoForm(DEFAULT_PROMO_FORM);
    }
    setDialogOpen(true);
  };

  const savePromotion = async () => {
    if (!promoForm.title) {
      toast.error('Başlık gerekli');
      return;
    }

    setSaving(true);
    try {
      const token = getToken();
      const url = editingPromo 
        ? `${BACKEND_URL}/api/kiosk/promotions/${editingPromo.id}`
        : `${BACKEND_URL}/api/kiosk/promotions`;

      const response = await fetch(url, {
        method: editingPromo ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(promoForm)
      });

      if (response.ok) {
        toast.success(editingPromo ? 'Kampanya güncellendi' : 'Kampanya eklendi');
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

  const deletePromotion = async (promoId) => {
    if (!window.confirm('Bu kampanyayı silmek istediğinize emin misiniz?')) return;

    try {
      const token = getToken();
      const response = await fetch(`${BACKEND_URL}/api/kiosk/promotions/${promoId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success('Kampanya silindi');
        onRefresh();
      }
    } catch (error) {
      toast.error('Silme hatası');
    }
  };

  return (
    <>
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
              <div 
                key={promo.id} 
                className="flex items-center gap-4 p-4 border rounded-lg" 
                style={{ borderLeftWidth: 4, borderLeftColor: promo.banner_color }}
              >
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl font-bold" 
                  style={{ backgroundColor: promo.banner_color }}
                >
                  {promo.discount_type === 'percent' ? '%' : '₺'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
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
                    <Badge>
                      {promo.discount_type === 'percent' ? `%${promo.discount_value} İndirim` : `₺${promo.discount_value} İndirim`}
                    </Badge>
                    {promo.min_order_amount && (
                      <span className="text-xs text-muted-foreground">Min: ₺{promo.min_order_amount}</span>
                    )}
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

      {/* Promotion Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPromo ? 'Kampanya Düzenle' : 'Yeni Kampanya'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <Label>Kampanya Başlığı *</Label>
              <Input 
                value={promoForm.title} 
                onChange={(e) => setPromoForm(prev => ({ ...prev, title: e.target.value }))} 
                placeholder="Örn: Happy Hour! 🎉" 
              />
            </div>
            <div>
              <Label>Açıklama</Label>
              <Input 
                value={promoForm.description} 
                onChange={(e) => setPromoForm(prev => ({ ...prev, description: e.target.value }))} 
                placeholder="Örn: 14:00-17:00 arası tüm burgerlerde %10 indirim" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>İndirim Tipi</Label>
                <Select 
                  value={promoForm.discount_type} 
                  onValueChange={(v) => setPromoForm(prev => ({ ...prev, discount_type: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Yüzde (%)</SelectItem>
                    <SelectItem value="fixed">Sabit (₺)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>İndirim Değeri</Label>
                <Input 
                  type="number" 
                  value={promoForm.discount_value} 
                  onChange={(e) => setPromoForm(prev => ({ ...prev, discount_value: parseFloat(e.target.value) || 0 }))} 
                />
              </div>
            </div>
            <div>
              <Label>Minimum Sipariş Tutarı (Opsiyonel)</Label>
              <Input 
                type="number" 
                value={promoForm.min_order_amount || ''} 
                onChange={(e) => setPromoForm(prev => ({ ...prev, min_order_amount: e.target.value ? parseFloat(e.target.value) : null }))} 
                placeholder="Örn: 200" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Başlangıç Saati</Label>
                <Select 
                  value={promoForm.start_hour?.toString() || 'none'} 
                  onValueChange={(v) => setPromoForm(prev => ({ ...prev, start_hour: v === 'none' ? null : parseInt(v) }))}
                >
                  <SelectTrigger><SelectValue placeholder="Her Zaman" /></SelectTrigger>
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
                  value={promoForm.end_hour?.toString() || 'none'} 
                  onValueChange={(v) => setPromoForm(prev => ({ ...prev, end_hour: v === 'none' ? null : parseInt(v) }))}
                >
                  <SelectTrigger><SelectValue placeholder="Her Zaman" /></SelectTrigger>
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
              <Label>Banner Rengi</Label>
              <div className="flex gap-2 mt-2">
                {BANNER_COLORS.map(color => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setPromoForm(prev => ({ ...prev, banner_color: color.value }))}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      promoForm.banner_color === color.value 
                        ? 'border-primary scale-110' 
                        : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.label}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="promo-active"
                checked={promoForm.is_active}
                onChange={(e) => setPromoForm(prev => ({ ...prev, is_active: e.target.checked }))}
              />
              <Label htmlFor="promo-active">Aktif</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
            <Button onClick={savePromotion} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Kaydet
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
