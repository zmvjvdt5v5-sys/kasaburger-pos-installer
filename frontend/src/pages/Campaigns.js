import React, { useState, useEffect } from 'react';
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
  DialogFooter,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { toast } from 'sonner';
import { 
  Plus, 
  Megaphone, 
  Trash2, 
  Send, 
  Loader2, 
  Mail, 
  MessageSquare,
  Percent,
  Tag,
  Bell,
  Calendar,
  Users
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    campaign_type: 'discount',
    discount_type: 'percent',
    discount_value: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    target_dealers: [],
    send_sms: false,
    send_email: false,
  });

  const token = localStorage.getItem('kasaburger_token');

  const loadData = async () => {
    try {
      const [campaignsRes, dealersRes] = await Promise.all([
        fetch(`${API_URL}/api/campaigns`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/dealers`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      if (campaignsRes.ok) setCampaigns(await campaignsRes.json());
      if (dealersRes.ok) setDealers(await dealersRes.json());
    } catch (error) {
      toast.error('Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      campaign_type: 'discount',
      discount_type: 'percent',
      discount_value: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      target_dealers: [],
      send_sms: false,
      send_email: false,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.end_date) {
      toast.error('Başlık ve bitiş tarihi gerekli');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          discount_value: formData.discount_value ? parseFloat(formData.discount_value) : null
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Kampanya oluşturuldu!');
        
        // Bildirim sonuçlarını göster
        if (data.notifications) {
          if (data.notifications.sms) {
            if (data.notifications.sms.status === 'success') {
              toast.success(`SMS: ${data.notifications.sms.sent}/${data.notifications.sms.total} gönderildi`);
            } else {
              toast.error(`SMS: ${data.notifications.sms.message}`);
            }
          }
          if (data.notifications.email) {
            if (data.notifications.email.status === 'success') {
              toast.success(`Email: ${data.notifications.email.sent}/${data.notifications.email.total} gönderildi`);
            } else {
              toast.error(`Email: ${data.notifications.email.message}`);
            }
          }
        }
        
        setDialogOpen(false);
        resetForm();
        loadData();
      } else {
        toast.error(data.detail || 'Kampanya oluşturulamadı');
      }
    } catch (error) {
      toast.error('Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu kampanyayı silmek istediğinizden emin misiniz?')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/campaigns/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        toast.success('Kampanya silindi');
        loadData();
      }
    } catch (error) {
      toast.error('Silme işlemi başarısız');
    }
  };

  const handleResend = async (campaign, type) => {
    setSending(true);
    try {
      const response = await fetch(`${API_URL}/api/campaigns/${campaign.id}/send?send_sms=${type === 'sms'}&send_email=${type === 'email'}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        const result = data[type];
        if (result?.status === 'success') {
          toast.success(`${type.toUpperCase()}: ${result.sent}/${result.total} gönderildi`);
        } else {
          toast.error(result?.message || 'Gönderim başarısız');
        }
        loadData();
      }
    } catch (error) {
      toast.error('Gönderim hatası');
    } finally {
      setSending(false);
    }
  };

  const getCampaignTypeIcon = (type) => {
    switch (type) {
      case 'discount': return <Percent className="h-5 w-5 text-green-500" />;
      case 'new_product': return <Tag className="h-5 w-5 text-blue-500" />;
      case 'announcement': return <Bell className="h-5 w-5 text-amber-500" />;
      default: return <Megaphone className="h-5 w-5" />;
    }
  };

  const getCampaignTypeText = (type) => {
    switch (type) {
      case 'discount': return 'İndirim';
      case 'new_product': return 'Yeni Ürün';
      case 'announcement': return 'Duyuru';
      default: return type;
    }
  };

  const toggleDealer = (dealerId) => {
    setFormData(prev => ({
      ...prev,
      target_dealers: prev.target_dealers.includes(dealerId)
        ? prev.target_dealers.filter(id => id !== dealerId)
        : [...prev.target_dealers, dealerId]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-heading">Kampanyalar</h1>
          <p className="text-muted-foreground">Kampanya oluştur ve bayilere bildir</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-primary" data-testid="add-campaign-btn">
          <Plus className="h-4 w-4 mr-2" />
          Yeni Kampanya
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Toplam Kampanya</p>
                <p className="text-2xl font-bold">{campaigns.length}</p>
              </div>
              <Megaphone className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">SMS Gönderildi</p>
                <p className="text-2xl font-bold">{campaigns.reduce((sum, c) => sum + (c.sms_count || 0), 0)}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Email Gönderildi</p>
                <p className="text-2xl font-bold">{campaigns.reduce((sum, c) => sum + (c.email_count || 0), 0)}</p>
              </div>
              <Mail className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      <div className="grid gap-4">
        {campaigns.length === 0 ? (
          <Card className="bg-card border-border/50">
            <CardContent className="p-8 text-center">
              <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Henüz kampanya oluşturulmamış</p>
            </CardContent>
          </Card>
        ) : (
          campaigns.map((campaign) => (
            <Card key={campaign.id} className="bg-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-background/50">
                      {getCampaignTypeIcon(campaign.campaign_type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{campaign.title}</h3>
                        <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">
                          {getCampaignTypeText(campaign.campaign_type)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{campaign.description}</p>
                      
                      {campaign.campaign_type === 'discount' && campaign.discount_value && (
                        <p className="text-lg font-bold text-green-500 mt-2">
                          {campaign.discount_type === 'percent' ? `%${campaign.discount_value}` : `${campaign.discount_value} TL`} İndirim
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {campaign.start_date?.slice(0, 10)} - {campaign.end_date?.slice(0, 10)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {campaign.target_dealers?.length > 0 ? `${campaign.target_dealers.length} Bayi` : 'Tüm Bayiler'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3 mt-3">
                        {campaign.sms_sent && (
                          <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400">
                            SMS: {campaign.sms_count} gönderildi
                          </span>
                        )}
                        {campaign.email_sent && (
                          <span className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-400">
                            Email: {campaign.email_count} gönderildi
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResend(campaign, 'sms')}
                      disabled={sending}
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      SMS
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResend(campaign, 'email')}
                      disabled={sending}
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      Email
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(campaign.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Campaign Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              Yeni Kampanya
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Kampanya Başlığı *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Örn: Yılbaşı İndirimi"
                  className="bg-input/50"
                />
              </div>
              
              <div className="col-span-2">
                <Label>Açıklama</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Kampanya detayları..."
                  className="bg-input/50"
                  rows={3}
                />
              </div>
              
              <div>
                <Label>Kampanya Türü</Label>
                <Select
                  value={formData.campaign_type}
                  onValueChange={(value) => setFormData({ ...formData, campaign_type: value })}
                >
                  <SelectTrigger className="bg-input/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discount">İndirim Kampanyası</SelectItem>
                    <SelectItem value="new_product">Yeni Ürün Duyurusu</SelectItem>
                    <SelectItem value="announcement">Genel Duyuru</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {formData.campaign_type === 'discount' && (
                <>
                  <div>
                    <Label>İndirim Türü</Label>
                    <Select
                      value={formData.discount_type}
                      onValueChange={(value) => setFormData({ ...formData, discount_type: value })}
                    >
                      <SelectTrigger className="bg-input/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percent">Yüzde (%)</SelectItem>
                        <SelectItem value="amount">Tutar (TL)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>İndirim Değeri</Label>
                    <Input
                      type="number"
                      value={formData.discount_value}
                      onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                      placeholder={formData.discount_type === 'percent' ? '10' : '50'}
                      className="bg-input/50"
                    />
                  </div>
                </>
              )}
              
              <div>
                <Label>Başlangıç Tarihi</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="bg-input/50"
                />
              </div>
              
              <div>
                <Label>Bitiş Tarihi *</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="bg-input/50"
                />
              </div>
              
              <div className="col-span-2">
                <Label className="mb-2 block">Hedef Bayiler</Label>
                <div className="border border-border rounded-lg p-3 max-h-40 overflow-y-auto bg-input/30">
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
                    <Checkbox
                      checked={formData.target_dealers.length === 0}
                      onCheckedChange={(checked) => {
                        if (checked) setFormData({ ...formData, target_dealers: [] });
                      }}
                    />
                    <span className="text-sm font-medium">Tüm Bayiler</span>
                  </div>
                  {dealers.map((dealer) => (
                    <div key={dealer.id} className="flex items-center gap-2 py-1">
                      <Checkbox
                        checked={formData.target_dealers.includes(dealer.id)}
                        onCheckedChange={() => toggleDealer(dealer.id)}
                      />
                      <span className="text-sm">{dealer.name} ({dealer.code})</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="col-span-2 border-t border-border pt-4">
                <Label className="mb-3 block">Bildirim Gönder</Label>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="send_sms"
                      checked={formData.send_sms}
                      onCheckedChange={(checked) => setFormData({ ...formData, send_sms: checked })}
                    />
                    <label htmlFor="send_sms" className="text-sm flex items-center gap-1 cursor-pointer">
                      <MessageSquare className="h-4 w-4 text-green-500" />
                      SMS Gönder
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="send_email"
                      checked={formData.send_email}
                      onCheckedChange={(checked) => setFormData({ ...formData, send_email: checked })}
                    />
                    <label htmlFor="send_email" className="text-sm flex items-center gap-1 cursor-pointer">
                      <Mail className="h-4 w-4 text-blue-500" />
                      Email Gönder
                    </label>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  SMS ve Email göndermek için Ayarlar sayfasından NetGSM ve SMTP yapılandırmasını yapın.
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                İptal
              </Button>
              <Button type="submit" disabled={saving} className="bg-primary">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                Oluştur ve Gönder
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Campaigns;
