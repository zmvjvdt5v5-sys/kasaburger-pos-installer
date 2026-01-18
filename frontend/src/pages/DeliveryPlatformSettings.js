import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { 
  Settings, Save, RefreshCw, CheckCircle, XCircle, 
  AlertCircle, Key, Building2, Webhook, Clock, Info
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

// Platform bilgileri
const PLATFORMS = [
  {
    id: 'yemeksepeti',
    name: 'Yemeksepeti',
    color: 'bg-pink-500',
    bgLight: 'bg-pink-500/10',
    borderColor: 'border-pink-500/30',
    textColor: 'text-pink-400',
    logo: '🍽️',
    description: 'Türkiye\'nin en büyük yemek sipariş platformu',
    fields: [
      { key: 'api_key', label: 'API Key', placeholder: 'ys-xxxxx-xxxxx', required: true },
      { key: 'api_secret', label: 'API Secret', placeholder: 'Secret key', type: 'password', required: true },
      { key: 'restaurant_id', label: 'Restoran ID', placeholder: 'rest_xxxxx', required: true },
      { key: 'supplier_id', label: 'Supplier ID', placeholder: 'sup_xxxxx', required: false }
    ],
    webhookPath: '/api/delivery/webhook/yemeksepeti',
    docUrl: 'https://developer.yemeksepeti.com'
  },
  {
    id: 'getir',
    name: 'Getir Yemek',
    color: 'bg-purple-500',
    bgLight: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    textColor: 'text-purple-400',
    logo: '🛵',
    description: 'Hızlı teslimat odaklı platform',
    fields: [
      { key: 'api_key', label: 'API Key', placeholder: 'getir-api-xxxxx', required: true },
      { key: 'api_secret', label: 'API Secret', placeholder: 'Secret key', type: 'password', required: true },
      { key: 'restaurant_id', label: 'Restoran ID', placeholder: 'restaurant_xxxxx', required: true }
    ],
    webhookPath: '/api/delivery/webhook/getir',
    docUrl: 'https://developers.getir.com'
  },
  {
    id: 'trendyol',
    name: 'Trendyol Yemek',
    color: 'bg-orange-500',
    bgLight: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    textColor: 'text-orange-400',
    logo: '🛒',
    description: 'Trendyol\'un yemek sipariş servisi',
    fields: [
      { key: 'api_key', label: 'API Key', placeholder: 'ty-xxxxx', required: true },
      { key: 'api_secret', label: 'API Secret', placeholder: 'Secret key', type: 'password', required: true },
      { key: 'supplier_id', label: 'Supplier ID', placeholder: 'supplier_xxxxx', required: true },
      { key: 'store_id', label: 'Store ID', placeholder: 'store_xxxxx', required: false }
    ],
    webhookPath: '/api/delivery/webhook/trendyol',
    docUrl: 'https://developers.trendyol.com'
  },
  {
    id: 'migros',
    name: 'Migros Yemek',
    color: 'bg-orange-600',
    bgLight: 'bg-orange-600/10',
    borderColor: 'border-orange-600/30',
    textColor: 'text-orange-300',
    logo: '🏪',
    description: 'Migros market\'in yemek platformu',
    fields: [
      { key: 'api_key', label: 'API Key', placeholder: 'migros-api-xxxxx', required: true },
      { key: 'store_id', label: 'Store ID', placeholder: 'store_xxxxx', required: true }
    ],
    webhookPath: '/api/delivery/webhook/migros',
    docUrl: 'https://partner.migros.com.tr'
  }
];

export default function DeliveryPlatformSettings() {
  const [platforms, setPlatforms] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [testing, setTesting] = useState({});
  const [activeTab, setActiveTab] = useState('yemeksepeti');

  useEffect(() => {
    loadPlatformSettings();
  }, []);

  const loadPlatformSettings = async () => {
    try {
      const token = localStorage.getItem('kasaburger_token');
      const response = await fetch(`${BACKEND_URL}/api/delivery/platforms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Array'i object'e çevir
        const platformsMap = {};
        data.forEach(p => {
          platformsMap[p.platform] = p;
        });
        setPlatforms(platformsMap);
      }
    } catch (error) {
      console.error('Platform ayarları yüklenemedi:', error);
      toast.error('Platform ayarları yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (platformId, field, value) => {
    setPlatforms(prev => ({
      ...prev,
      [platformId]: {
        ...prev[platformId],
        platform: platformId,
        [field]: value
      }
    }));
  };

  const handleSave = async (platformId) => {
    setSaving(prev => ({ ...prev, [platformId]: true }));
    
    try {
      const token = localStorage.getItem('kasaburger_token');
      const platformData = platforms[platformId] || { platform: platformId };
      
      const response = await fetch(`${BACKEND_URL}/api/delivery/platforms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          platform: platformId,
          enabled: platformData.enabled || false,
          api_key: platformData.api_key || null,
          api_secret: platformData.api_secret || null,
          restaurant_id: platformData.restaurant_id || null,
          supplier_id: platformData.supplier_id || null,
          store_id: platformData.store_id || null,
          webhook_secret: platformData.webhook_secret || null,
          auto_accept: platformData.auto_accept || false,
          default_prep_time: platformData.default_prep_time || 30
        })
      });

      if (response.ok) {
        toast.success(`${PLATFORMS.find(p => p.id === platformId)?.name} ayarları kaydedildi`);
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Kayıt başarısız');
      }
    } catch (error) {
      console.error('Kayıt hatası:', error);
      toast.error('Bağlantı hatası');
    } finally {
      setSaving(prev => ({ ...prev, [platformId]: false }));
    }
  };

  const handleTest = async (platformId) => {
    setTesting(prev => ({ ...prev, [platformId]: true }));
    
    try {
      const token = localStorage.getItem('kasaburger_token');
      const response = await fetch(`${BACKEND_URL}/api/delivery/platforms/${platformId}/test`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(`${PLATFORMS.find(p => p.id === platformId)?.name} bağlantısı başarılı! ${result.order_count || 0} sipariş mevcut.`);
      } else {
        toast.error(result.error || 'Bağlantı başarısız');
      }
    } catch (error) {
      console.error('Test hatası:', error);
      toast.error('Bağlantı testi başarısız');
    } finally {
      setTesting(prev => ({ ...prev, [platformId]: false }));
    }
  };

  const getWebhookUrl = (webhookPath) => {
    // Production URL'ini belirle
    const baseUrl = window.location.origin.includes('localhost') 
      ? BACKEND_URL 
      : window.location.origin;
    return `${baseUrl}${webhookPath}`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Panoya kopyalandı');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="delivery-platform-settings">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Platform Entegrasyonları</h1>
          <p className="text-muted-foreground">
            Yemek platformlarının API ayarlarını yapılandırın
          </p>
        </div>
        <Button variant="outline" onClick={loadPlatformSettings}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Yenile
        </Button>
      </div>

      {/* Info Banner */}
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-400 mt-0.5" />
            <div className="text-sm">
              <p className="text-blue-300 font-medium mb-1">Entegrasyon Kurulumu</p>
              <p className="text-blue-300/70">
                Her platformun yönetici panelinden API anahtarlarınızı alın ve aşağıdaki alanlara girin. 
                Webhook URL'lerini de platform panellerine eklemeyi unutmayın.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platform Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-6">
          {PLATFORMS.map(platform => {
            const config = platforms[platform.id] || {};
            const isEnabled = config.enabled;
            const hasCredentials = config.api_key;
            
            return (
              <TabsTrigger
                key={platform.id}
                value={platform.id}
                className="flex items-center gap-2"
                data-testid={`platform-tab-${platform.id}`}
              >
                <span className="text-lg">{platform.logo}</span>
                <span className="hidden sm:inline">{platform.name}</span>
                {isEnabled && hasCredentials && (
                  <CheckCircle className="h-3 w-3 text-green-400" />
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {PLATFORMS.map(platform => {
          const config = platforms[platform.id] || {};
          
          return (
            <TabsContent key={platform.id} value={platform.id}>
              <Card className={`${platform.bgLight} ${platform.borderColor} border`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg ${platform.color}`}>
                        <span className="text-2xl">{platform.logo}</span>
                      </div>
                      <div>
                        <CardTitle className={platform.textColor}>{platform.name}</CardTitle>
                        <CardDescription>{platform.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`${platform.id}-enabled`} className="text-sm text-muted-foreground">
                        Aktif
                      </Label>
                      <Switch
                        id={`${platform.id}-enabled`}
                        checked={config.enabled || false}
                        onCheckedChange={(checked) => handleInputChange(platform.id, 'enabled', checked)}
                        data-testid={`${platform.id}-enabled-switch`}
                      />
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* API Credentials */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Key className="h-4 w-4" />
                      API Kimlik Bilgileri
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {platform.fields.map(field => (
                        <div key={field.key} className="space-y-2">
                          <Label htmlFor={`${platform.id}-${field.key}`}>
                            {field.label}
                            {field.required && <span className="text-red-400 ml-1">*</span>}
                          </Label>
                          <Input
                            id={`${platform.id}-${field.key}`}
                            type={field.type || 'text'}
                            placeholder={field.placeholder}
                            value={config[field.key] || ''}
                            onChange={(e) => handleInputChange(platform.id, field.key, e.target.value)}
                            className="bg-background/50"
                            data-testid={`${platform.id}-${field.key}-input`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Webhook URL */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Webhook className="h-4 w-4" />
                      Webhook URL
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Bu URL'yi {platform.name} paneline ekleyin:
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          value={getWebhookUrl(platform.webhookPath)}
                          readOnly
                          className="bg-background/30 font-mono text-xs"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(getWebhookUrl(platform.webhookPath))}
                        >
                          Kopyala
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Settings */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Settings className="h-4 w-4" />
                      Ayarlar
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-background/30">
                        <div className="space-y-0.5">
                          <Label>Otomatik Kabul</Label>
                          <p className="text-xs text-muted-foreground">
                            Gelen siparişleri otomatik onayla
                          </p>
                        </div>
                        <Switch
                          checked={config.auto_accept || false}
                          onCheckedChange={(checked) => handleInputChange(platform.id, 'auto_accept', checked)}
                          data-testid={`${platform.id}-auto-accept-switch`}
                        />
                      </div>
                      
                      <div className="space-y-2 p-3 rounded-lg bg-background/30">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <Label>Varsayılan Hazırlık Süresi (dk)</Label>
                        </div>
                        <Input
                          type="number"
                          min="5"
                          max="120"
                          value={config.default_prep_time || 30}
                          onChange={(e) => handleInputChange(platform.id, 'default_prep_time', parseInt(e.target.value))}
                          className="bg-background/50"
                          data-testid={`${platform.id}-prep-time-input`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <Button
                      variant="outline"
                      onClick={() => handleTest(platform.id)}
                      disabled={testing[platform.id] || !config.api_key}
                      data-testid={`${platform.id}-test-btn`}
                    >
                      {testing[platform.id] ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Bağlantıyı Test Et
                    </Button>
                    
                    <Button
                      onClick={() => handleSave(platform.id)}
                      disabled={saving[platform.id]}
                      className={platform.color}
                      data-testid={`${platform.id}-save-btn`}
                    >
                      {saving[platform.id] ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Kaydet
                    </Button>
                  </div>

                  {/* Documentation Link */}
                  {platform.docUrl && (
                    <div className="text-center pt-2">
                      <a
                        href={platform.docUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-primary transition-colors"
                      >
                        {platform.name} API Dokümantasyonu →
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {PLATFORMS.map(platform => {
          const config = platforms[platform.id] || {};
          const isConfigured = config.enabled && config.api_key;
          
          return (
            <Card 
              key={platform.id}
              className={`cursor-pointer transition-all hover:scale-[1.02] ${
                isConfigured ? platform.borderColor : 'border-white/10'
              } border`}
              onClick={() => setActiveTab(platform.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{platform.logo}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{platform.name}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {isConfigured ? (
                        <>
                          <CheckCircle className="h-3 w-3 text-green-400" />
                          <span className="text-xs text-green-400">Aktif</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Yapılandırılmamış</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
