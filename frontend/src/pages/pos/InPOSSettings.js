import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { toast } from 'sonner';
import { 
  Settings, Wifi, WifiOff, CreditCard, Banknote, 
  RefreshCw, CheckCircle, XCircle, Printer, FileText,
  Server, Plug, TestTube
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function InPOSSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [zReportLoading, setZReportLoading] = useState(false);
  const [status, setStatus] = useState({ connected: false, enabled: false });
  
  const [config, setConfig] = useState({
    enabled: false,
    ip_address: '192.168.1.100',
    port: 59000,
    timeout: 30,
    auto_print: true,
    payment_mappings: {
      cash: 1,
      card: 2,
      online: 7,
      sodexo: 3,
      multinet: 4,
      ticket: 5,
      setcard: 6
    }
  });

  const getToken = () => localStorage.getItem('kasaburger_token') || localStorage.getItem('dealer_token');

  const loadConfig = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const [configRes, statusRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/inpos/config`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${BACKEND_URL}/api/inpos/status`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (configRes.ok) {
        const data = await configRes.json();
        setConfig(prev => ({ ...prev, ...data }));
      }

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setStatus(statusData);
      }
    } catch (error) {
      console.error('Config load error:', error);
      toast.error('Ayarlar yüklenemedi');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = getToken();
      const res = await fetch(`${BACKEND_URL}/api/inpos/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(config)
      });

      if (res.ok) {
        toast.success('InPOS ayarları kaydedildi');
        loadConfig();
      } else {
        const error = await res.json();
        toast.error(error.detail || 'Kaydetme hatası');
      }
    } catch (error) {
      toast.error('Bağlantı hatası');
    }
    setSaving(false);
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const token = getToken();
      const res = await fetch(`${BACKEND_URL}/api/inpos/test`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      const result = await res.json();
      if (result.success) {
        toast.success(result.message);
        setStatus(prev => ({ ...prev, connected: true }));
      } else {
        toast.error(result.error);
        setStatus(prev => ({ ...prev, connected: false }));
      }
    } catch (error) {
      toast.error('Test başarısız');
    }
    setTesting(false);
  };

  const handleZReport = async () => {
    if (!confirm('Z Raporu almak istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      return;
    }
    
    setZReportLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${BACKEND_URL}/api/inpos/z-report`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const result = await res.json();
      if (result.success) {
        toast.success(`Z Raporu alındı - Z No: ${result.report?.z_no}`);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Z Raporu alınamadı');
    }
    setZReportLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-orange-500 flex items-center gap-3">
            <CreditCard className="h-8 w-8" />
            InPOS Entegrasyonu
          </h1>
          <p className="text-zinc-500 mt-1">KBYS - Yazar Kasa (ÖKC) entegrasyonu ayarları</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Durum Göstergesi */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            status.connected ? 'bg-green-500/20 border border-green-500/50' : 'bg-red-500/20 border border-red-500/50'
          }`}>
            {status.connected ? (
              <>
                <Wifi className="h-5 w-5 text-green-400" />
                <span className="text-green-400 font-medium">Bağlı</span>
              </>
            ) : (
              <>
                <WifiOff className="h-5 w-5 text-red-400" />
                <span className="text-red-400 font-medium">Bağlı Değil</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ana Ayarlar */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-orange-500" />
              Bağlantı Ayarları
            </CardTitle>
            <CardDescription>InPOS M530 cihaz bağlantı yapılandırması</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Aktif/Pasif */}
            <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Plug className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="font-medium">Entegrasyon Durumu</p>
                  <p className="text-sm text-zinc-500">InPOS entegrasyonunu aktifleştir</p>
                </div>
              </div>
              <Switch
                checked={config.enabled}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enabled: checked }))}
              />
            </div>

            {/* IP Adresi */}
            <div className="space-y-2">
              <Label htmlFor="ip">Cihaz IP Adresi</Label>
              <Input
                id="ip"
                value={config.ip_address}
                onChange={(e) => setConfig(prev => ({ ...prev, ip_address: e.target.value }))}
                placeholder="192.168.1.100"
                className="bg-zinc-800 border-zinc-700"
              />
            </div>

            {/* Port */}
            <div className="space-y-2">
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                type="number"
                value={config.port}
                onChange={(e) => setConfig(prev => ({ ...prev, port: parseInt(e.target.value) || 59000 }))}
                placeholder="59000"
                className="bg-zinc-800 border-zinc-700"
              />
              <p className="text-xs text-zinc-500">InPOS varsayılan portu: 59000</p>
            </div>

            {/* Timeout */}
            <div className="space-y-2">
              <Label htmlFor="timeout">Zaman Aşımı (saniye)</Label>
              <Input
                id="timeout"
                type="number"
                value={config.timeout}
                onChange={(e) => setConfig(prev => ({ ...prev, timeout: parseInt(e.target.value) || 30 }))}
                placeholder="30"
                className="bg-zinc-800 border-zinc-700"
              />
            </div>

            {/* Otomatik Yazdırma */}
            <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Printer className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="font-medium">Otomatik Fiş Yazdır</p>
                  <p className="text-sm text-zinc-500">Ödeme sonrası otomatik fiş çıkar</p>
                </div>
              </div>
              <Switch
                checked={config.auto_print}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, auto_print: checked }))}
              />
            </div>

            {/* Butonlar */}
            <div className="flex gap-3 pt-4">
              <Button 
                onClick={handleTest} 
                variant="outline" 
                disabled={testing}
                className="flex-1"
              >
                {testing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <TestTube className="h-4 w-4 mr-2" />
                )}
                Bağlantı Test
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                {saving ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Kaydet
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Ödeme Tanımları */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-orange-500" />
              Ödeme Tanım Eşleştirmeleri
            </CardTitle>
            <CardDescription>InPOS ödeme tipi kodlarını eşleştirin</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Nakit */}
            <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
              <div className="flex items-center gap-3">
                <Banknote className="h-5 w-5 text-green-400" />
                <span>Nakit</span>
              </div>
              <Input
                type="number"
                value={config.payment_mappings?.cash || 1}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  payment_mappings: { ...prev.payment_mappings, cash: parseInt(e.target.value) || 1 }
                }))}
                className="w-20 bg-zinc-800 border-zinc-700 text-center"
              />
            </div>

            {/* Kredi Kartı */}
            <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-blue-400" />
                <span>Kredi Kartı</span>
              </div>
              <Input
                type="number"
                value={config.payment_mappings?.card || 2}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  payment_mappings: { ...prev.payment_mappings, card: parseInt(e.target.value) || 2 }
                }))}
                className="w-20 bg-zinc-800 border-zinc-700 text-center"
              />
            </div>

            {/* Online Ödeme */}
            <div className="flex items-center justify-between p-3 bg-cyan-500/10 rounded-lg">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-cyan-400" />
                <span>Online Ödeme</span>
              </div>
              <Input
                type="number"
                value={config.payment_mappings?.online || 7}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  payment_mappings: { ...prev.payment_mappings, online: parseInt(e.target.value) || 7 }
                }))}
                className="w-20 bg-zinc-800 border-zinc-700 text-center"
              />
            </div>

            {/* Sodexo */}
            <div className="flex items-center justify-between p-3 bg-orange-500/10 rounded-lg">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-orange-400" />
                <span>Sodexo</span>
              </div>
              <Input
                type="number"
                value={config.payment_mappings?.sodexo || 3}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  payment_mappings: { ...prev.payment_mappings, sodexo: parseInt(e.target.value) || 3 }
                }))}
                className="w-20 bg-zinc-800 border-zinc-700 text-center"
              />
            </div>

            {/* Multinet */}
            <div className="flex items-center justify-between p-3 bg-purple-500/10 rounded-lg">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-purple-400" />
                <span>Multinet</span>
              </div>
              <Input
                type="number"
                value={config.payment_mappings?.multinet || 4}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  payment_mappings: { ...prev.payment_mappings, multinet: parseInt(e.target.value) || 4 }
                }))}
                className="w-20 bg-zinc-800 border-zinc-700 text-center"
              />
            </div>

            {/* Ticket */}
            <div className="flex items-center justify-between p-3 bg-pink-500/10 rounded-lg">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-pink-400" />
                <span>Ticket</span>
              </div>
              <Input
                type="number"
                value={config.payment_mappings?.ticket || 5}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  payment_mappings: { ...prev.payment_mappings, ticket: parseInt(e.target.value) || 5 }
                }))}
                className="w-20 bg-zinc-800 border-zinc-700 text-center"
              />
            </div>

            {/* SetCard */}
            <div className="flex items-center justify-between p-3 bg-cyan-500/10 rounded-lg">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-cyan-400" />
                <span>SetCard</span>
              </div>
              <Input
                type="number"
                value={config.payment_mappings?.setcard || 6}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  payment_mappings: { ...prev.payment_mappings, setcard: parseInt(e.target.value) || 6 }
                }))}
                className="w-20 bg-zinc-800 border-zinc-700 text-center"
              />
            </div>

            <p className="text-xs text-zinc-500 pt-2">
              Not: Ödeme tanım kodları InPOS cihazınızın ayarlarına göre değişebilir. 
              Cihazınızın kullanım kılavuzunu kontrol edin.
            </p>
          </CardContent>
        </Card>

        {/* Z Raporu */}
        <Card className="bg-zinc-900 border-zinc-800 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-orange-500" />
              Gün Sonu İşlemleri
            </CardTitle>
            <CardDescription>Z Raporu ve gün sonu kapanış işlemleri</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div>
                <h3 className="font-bold text-red-400 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Z Raporu Al
                </h3>
                <p className="text-sm text-zinc-400 mt-1">
                  Dikkat: Z raporu günün tüm satışlarını kapatır ve geri alınamaz. 
                  Bu işlemi sadece gün sonunda yapın.
                </p>
              </div>
              <Button 
                onClick={handleZReport}
                disabled={zReportLoading || !config.enabled || !status.connected}
                className="bg-red-600 hover:bg-red-700 whitespace-nowrap"
              >
                {zReportLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                Z Raporu Al
              </Button>
            </div>

            {/* Son İşlem Bilgisi */}
            {status.last_transaction && (
              <div className="mt-4 p-4 bg-zinc-800/50 rounded-lg">
                <p className="text-sm text-zinc-400">
                  <span className="text-zinc-500">Son İşlem:</span>{' '}
                  {new Date(status.last_transaction.created_at).toLocaleString('tr-TR')} - 
                  {' '}{status.last_transaction.amount?.toLocaleString('tr-TR')} TL ({status.last_transaction.method})
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
