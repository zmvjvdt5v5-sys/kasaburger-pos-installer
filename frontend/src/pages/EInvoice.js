import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { 
  FileText, Plus, Send, Download, X, RefreshCw, Settings,
  Building2, User, Search, CheckCircle, AlertCircle, Clock
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function EInvoice() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(null);
  const [filter, setFilter] = useState({ status: '', type: '' });
  
  const [newInvoice, setNewInvoice] = useState({
    invoice_type: 'SATIS',
    document_type: 'E_ARSIV',
    scenario: 'TEMELFATURA',
    currency: 'TRY',
    customer: {
      tax_number: '',
      tc_number: '',
      company_name: '',
      first_name: '',
      last_name: '',
      tax_office: '',
      address: '',
      city: '',
      phone: '',
      email: ''
    },
    items: [{ name: '', quantity: 1, unit: 'ADET', unit_price: 0, vat_rate: 10 }],
    notes: ''
  });

  const getToken = () => localStorage.getItem('kasaburger_token') || localStorage.getItem('dealer_token');

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const params = new URLSearchParams();
      if (filter.status) params.append('status', filter.status);
      if (filter.type) params.append('document_type', filter.type);
      
      const res = await fetch(`${BACKEND_URL}/api/einvoice/list?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      }
    } catch (error) {
      console.error('Load error:', error);
    }
    setLoading(false);
  };

  const loadSettings = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${BACKEND_URL}/api/einvoice/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Settings error:', error);
    }
  };

  useEffect(() => {
    loadInvoices();
    loadSettings();
  }, [filter]);

  const handleCreateInvoice = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${BACKEND_URL}/api/einvoice/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newInvoice)
      });

      if (res.ok) {
        toast.success('Fatura oluşturuldu');
        setShowCreate(false);
        loadInvoices();
        setNewInvoice({
          invoice_type: 'SATIS',
          document_type: 'E_ARSIV',
          scenario: 'TEMELFATURA',
          currency: 'TRY',
          customer: { tax_number: '', tc_number: '', company_name: '', first_name: '', last_name: '', tax_office: '', address: '', city: '', phone: '', email: '' },
          items: [{ name: '', quantity: 1, unit: 'ADET', unit_price: 0, vat_rate: 10 }],
          notes: ''
        });
      } else {
        const error = await res.json();
        toast.error(error.detail || 'Fatura oluşturulamadı');
      }
    } catch (error) {
      toast.error('Bağlantı hatası');
    }
  };

  const handleSendInvoice = async (invoiceId) => {
    try {
      const token = getToken();
      const res = await fetch(`${BACKEND_URL}/api/einvoice/${invoiceId}/send`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      const result = await res.json();
      if (result.success) {
        toast.success(result.message);
        loadInvoices();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Gönderim hatası');
    }
  };

  const handleDownloadXML = async (invoiceId) => {
    try {
      const token = getToken();
      const res = await fetch(`${BACKEND_URL}/api/einvoice/${invoiceId}/xml`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${invoiceId}.xml`;
        a.click();
      }
    } catch (error) {
      toast.error('İndirme hatası');
    }
  };

  const addItem = () => {
    setNewInvoice(prev => ({
      ...prev,
      items: [...prev.items, { name: '', quantity: 1, unit: 'ADET', unit_price: 0, vat_rate: 10 }]
    }));
  };

  const updateItem = (index, field, value) => {
    setNewInvoice(prev => ({
      ...prev,
      items: prev.items.map((item, i) => i === index ? { ...item, [field]: value } : item)
    }));
  };

  const removeItem = (index) => {
    if (newInvoice.items.length > 1) {
      setNewInvoice(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const calculateTotal = () => {
    return newInvoice.items.reduce((sum, item) => {
      const lineTotal = item.quantity * item.unit_price;
      const vat = lineTotal * item.vat_rate / 100;
      return sum + lineTotal + vat;
    }, 0);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: { color: 'bg-gray-500', icon: Clock, text: 'Taslak' },
      sent: { color: 'bg-blue-500', icon: Send, text: 'Gönderildi' },
      approved: { color: 'bg-green-500', icon: CheckCircle, text: 'Onaylandı' },
      rejected: { color: 'bg-red-500', icon: AlertCircle, text: 'Reddedildi' },
      cancelled: { color: 'bg-gray-600', icon: X, text: 'İptal' }
    };
    const badge = badges[status] || badges.draft;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${badge.color} text-white`}>
        <Icon className="h-3 w-3" />
        {badge.text}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-orange-500 flex items-center gap-3">
            <FileText className="h-8 w-8" />
            E-Fatura / E-Arşiv
          </h1>
          <p className="text-zinc-500 mt-1">GİB Elektronik Fatura Yönetimi</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setShowSettings(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Ayarlar
          </Button>
          <Button onClick={() => setShowCreate(true)} className="bg-orange-600 hover:bg-orange-700">
            <Plus className="h-4 w-4 mr-2" />
            Yeni Fatura
          </Button>
        </div>
      </div>

      {/* Uyarı - Ayarlar yapılmamışsa */}
      {settings && !settings.configured && (
        <Card className="bg-yellow-500/10 border-yellow-500/30 mb-6">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            <span>E-Fatura ayarları yapılandırılmamış. Fatura oluşturmak için önce ayarları tamamlayın.</span>
            <Button size="sm" variant="outline" onClick={() => setShowSettings(true)}>
              Ayarlara Git
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filtreler */}
      <div className="flex gap-4 mb-6">
        <Select value={filter.status} onValueChange={(v) => setFilter(prev => ({ ...prev, status: v }))}>
          <SelectTrigger className="w-40 bg-zinc-800 border-zinc-700">
            <SelectValue placeholder="Durum" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tümü</SelectItem>
            <SelectItem value="draft">Taslak</SelectItem>
            <SelectItem value="sent">Gönderildi</SelectItem>
            <SelectItem value="approved">Onaylandı</SelectItem>
            <SelectItem value="cancelled">İptal</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filter.type} onValueChange={(v) => setFilter(prev => ({ ...prev, type: v }))}>
          <SelectTrigger className="w-40 bg-zinc-800 border-zinc-700">
            <SelectValue placeholder="Tür" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tümü</SelectItem>
            <SelectItem value="E_FATURA">e-Fatura</SelectItem>
            <SelectItem value="E_ARSIV">e-Arşiv</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={loadInvoices}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Fatura Listesi */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="bg-zinc-800">
              <tr>
                <th className="text-left p-4">Fatura No</th>
                <th className="text-left p-4">Tür</th>
                <th className="text-left p-4">Müşteri</th>
                <th className="text-left p-4">Tutar</th>
                <th className="text-left p-4">Durum</th>
                <th className="text-left p-4">Tarih</th>
                <th className="text-left p-4">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-zinc-500">Yükleniyor...</td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-zinc-500">Henüz fatura yok</td></tr>
              ) : invoices.map(inv => (
                <tr key={inv.id} className="border-t border-zinc-800 hover:bg-zinc-800/50">
                  <td className="p-4 font-mono text-sm">{inv.invoice_number}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs ${inv.document_type === 'E_FATURA' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                      {inv.document_type === 'E_FATURA' ? 'e-Fatura' : 'e-Arşiv'}
                    </span>
                  </td>
                  <td className="p-4">{inv.customer_name}</td>
                  <td className="p-4 font-bold">{formatCurrency(inv.total)}</td>
                  <td className="p-4">{getStatusBadge(inv.status)}</td>
                  <td className="p-4 text-sm text-zinc-400">{new Date(inv.created_at).toLocaleDateString('tr-TR')}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      {inv.status === 'draft' && (
                        <Button size="sm" variant="outline" onClick={() => handleSendInvoice(inv.id)}>
                          <Send className="h-3 w-3" />
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => handleDownloadXML(inv.id)}>
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Yeni Fatura Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni Fatura Oluştur</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Fatura Türü */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Belge Türü</Label>
                <Select value={newInvoice.document_type} onValueChange={(v) => setNewInvoice(prev => ({ ...prev, document_type: v }))}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="E_ARSIV">e-Arşiv (Bireysel)</SelectItem>
                    <SelectItem value="E_FATURA">e-Fatura (Kurumsal)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Fatura Türü</Label>
                <Select value={newInvoice.invoice_type} onValueChange={(v) => setNewInvoice(prev => ({ ...prev, invoice_type: v }))}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SATIS">Satış</SelectItem>
                    <SelectItem value="IADE">İade</SelectItem>
                    <SelectItem value="TEVKIFAT">Tevkifatlı</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Senaryo</Label>
                <Select value={newInvoice.scenario} onValueChange={(v) => setNewInvoice(prev => ({ ...prev, scenario: v }))}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TEMELFATURA">Temel Fatura</SelectItem>
                    <SelectItem value="TICARIFATURA">Ticari Fatura</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Müşteri Bilgileri */}
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  {newInvoice.document_type === 'E_FATURA' ? <Building2 className="h-5 w-5" /> : <User className="h-5 w-5" />}
                  Müşteri Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {newInvoice.document_type === 'E_FATURA' ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>VKN (Vergi No)</Label>
                        <Input
                          value={newInvoice.customer.tax_number}
                          onChange={(e) => setNewInvoice(prev => ({ ...prev, customer: { ...prev.customer, tax_number: e.target.value } }))}
                          placeholder="1234567890"
                          className="bg-zinc-800 border-zinc-700"
                        />
                      </div>
                      <div>
                        <Label>Vergi Dairesi</Label>
                        <Input
                          value={newInvoice.customer.tax_office}
                          onChange={(e) => setNewInvoice(prev => ({ ...prev, customer: { ...prev.customer, tax_office: e.target.value } }))}
                          placeholder="Kadıköy"
                          className="bg-zinc-800 border-zinc-700"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Firma Adı</Label>
                      <Input
                        value={newInvoice.customer.company_name}
                        onChange={(e) => setNewInvoice(prev => ({ ...prev, customer: { ...prev.customer, company_name: e.target.value } }))}
                        placeholder="ABC Ltd. Şti."
                        className="bg-zinc-800 border-zinc-700"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>TC Kimlik No</Label>
                        <Input
                          value={newInvoice.customer.tc_number}
                          onChange={(e) => setNewInvoice(prev => ({ ...prev, customer: { ...prev.customer, tc_number: e.target.value } }))}
                          placeholder="12345678901"
                          className="bg-zinc-800 border-zinc-700"
                        />
                      </div>
                      <div>
                        <Label>Ad</Label>
                        <Input
                          value={newInvoice.customer.first_name}
                          onChange={(e) => setNewInvoice(prev => ({ ...prev, customer: { ...prev.customer, first_name: e.target.value } }))}
                          className="bg-zinc-800 border-zinc-700"
                        />
                      </div>
                      <div>
                        <Label>Soyad</Label>
                        <Input
                          value={newInvoice.customer.last_name}
                          onChange={(e) => setNewInvoice(prev => ({ ...prev, customer: { ...prev.customer, last_name: e.target.value } }))}
                          className="bg-zinc-800 border-zinc-700"
                        />
                      </div>
                    </div>
                  </>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Adres</Label>
                    <Input
                      value={newInvoice.customer.address}
                      onChange={(e) => setNewInvoice(prev => ({ ...prev, customer: { ...prev.customer, address: e.target.value } }))}
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </div>
                  <div>
                    <Label>Şehir</Label>
                    <Input
                      value={newInvoice.customer.city}
                      onChange={(e) => setNewInvoice(prev => ({ ...prev, customer: { ...prev.customer, city: e.target.value } }))}
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Fatura Kalemleri */}
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Fatura Kalemleri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {newInvoice.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-6 gap-2 items-end">
                    <div className="col-span-2">
                      <Label className="text-xs">Ürün/Hizmet</Label>
                      <Input
                        value={item.name}
                        onChange={(e) => updateItem(index, 'name', e.target.value)}
                        className="bg-zinc-800 border-zinc-700"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Miktar</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className="bg-zinc-800 border-zinc-700"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Birim Fiyat</Label>
                      <Input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        className="bg-zinc-800 border-zinc-700"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">KDV %</Label>
                      <Select value={String(item.vat_rate)} onValueChange={(v) => updateItem(index, 'vat_rate', parseFloat(v))}>
                        <SelectTrigger className="bg-zinc-800 border-zinc-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">%0</SelectItem>
                          <SelectItem value="1">%1</SelectItem>
                          <SelectItem value="10">%10</SelectItem>
                          <SelectItem value="20">%20</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeItem(index)} className="text-red-400">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-1" /> Kalem Ekle
                </Button>
              </CardContent>
            </Card>

            {/* Toplam */}
            <div className="flex justify-end">
              <div className="text-right">
                <p className="text-zinc-400">Toplam (KDV Dahil)</p>
                <p className="text-3xl font-bold text-orange-500">{formatCurrency(calculateTotal())}</p>
              </div>
            </div>

            {/* Butonlar */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowCreate(false)}>İptal</Button>
              <Button onClick={handleCreateInvoice} className="bg-orange-600 hover:bg-orange-700">
                <FileText className="h-4 w-4 mr-2" />
                Fatura Oluştur
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ayarlar Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>E-Fatura Ayarları</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-zinc-400 text-sm">
              E-Fatura ayarları admin panelinden yapılandırılabilir. 
              GİB entegrasyonu için özel entegratör (NES, IZIBIZ, Logo, Foriba) bilgileri gereklidir.
            </p>
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardContent className="p-4">
                <p className="text-sm"><strong>Entegratör:</strong> {settings?.integrator || 'Manuel'}</p>
                <p className="text-sm"><strong>Firma:</strong> {settings?.company_name || '-'}</p>
                <p className="text-sm"><strong>VKN:</strong> {settings?.tax_number || '-'}</p>
                <p className="text-sm"><strong>Fatura Serisi:</strong> {settings?.invoice_series || 'GIB'}</p>
              </CardContent>
            </Card>
            <Button variant="outline" className="w-full" onClick={() => setShowSettings(false)}>
              Kapat
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
