import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { 
  ChevronRight, ChevronLeft, CheckCircle, Circle, 
  Plug, Key, Webhook, Settings, Rocket, HelpCircle,
  ExternalLink, Copy, Play, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const PLATFORMS = {
  yemeksepeti: {
    name: 'Yemeksepeti',
    logo: '🍽️',
    color: 'bg-pink-500',
    borderColor: 'border-pink-500',
    steps: [
      {
        title: 'Yemeksepeti Paneline Giriş',
        description: 'Yemeksepeti restoran panelinize giriş yapın',
        action: 'https://restoran.yemeksepeti.com',
        actionLabel: 'Panele Git',
        fields: []
      },
      {
        title: 'API Bilgilerini Alın',
        description: 'Ayarlar → API Entegrasyonu bölümünden bilgileri kopyalayın',
        fields: [
          { key: 'api_key', label: 'API Key', placeholder: 'ys-xxxxx-xxxxx', required: true },
          { key: 'api_secret', label: 'API Secret', placeholder: 'Secret key...', type: 'password', required: true },
          { key: 'restaurant_id', label: 'Restoran ID', placeholder: 'rest_xxxxx', required: true }
        ]
      },
      {
        title: 'Webhook URL Ekleyin',
        description: 'Aşağıdaki URL\'yi Yemeksepeti panelinde Webhook bölümüne yapıştırın',
        webhookPath: '/api/delivery/webhook/yemeksepeti',
        fields: []
      },
      {
        title: 'Bağlantıyı Test Edin',
        description: 'Ayarları kaydedin ve bağlantıyı test edin',
        testable: true,
        fields: []
      }
    ]
  },
  getir: {
    name: 'Getir Yemek',
    logo: '🛵',
    color: 'bg-purple-500',
    borderColor: 'border-purple-500',
    steps: [
      {
        title: 'Getir İş Ortağı Paneli',
        description: 'Getir restoran panelinize giriş yapın',
        action: 'https://partner.getir.com',
        actionLabel: 'Panele Git',
        fields: []
      },
      {
        title: 'API Bilgilerini Alın',
        description: 'Entegrasyonlar → API Anahtarları bölümünden bilgileri alın',
        fields: [
          { key: 'api_key', label: 'API Key', placeholder: 'getir-api-xxxxx', required: true },
          { key: 'api_secret', label: 'API Secret', placeholder: 'Secret key...', type: 'password', required: true },
          { key: 'restaurant_id', label: 'Restoran ID', placeholder: 'restaurant_xxxxx', required: true }
        ]
      },
      {
        title: 'Webhook URL Ekleyin',
        description: 'Aşağıdaki URL\'yi Getir panelinde Webhook bölümüne yapıştırın',
        webhookPath: '/api/delivery/webhook/getir',
        fields: []
      },
      {
        title: 'Bağlantıyı Test Edin',
        description: 'Ayarları kaydedin ve bağlantıyı test edin',
        testable: true,
        fields: []
      }
    ]
  },
  trendyol: {
    name: 'Trendyol Yemek',
    logo: '🛒',
    color: 'bg-orange-500',
    borderColor: 'border-orange-500',
    steps: [
      {
        title: 'Trendyol Satıcı Paneli',
        description: 'Trendyol satıcı panelinize giriş yapın',
        action: 'https://partner.trendyol.com',
        actionLabel: 'Panele Git',
        fields: []
      },
      {
        title: 'API Bilgilerini Alın',
        description: 'Entegrasyonlar → API Yönetimi bölümünden bilgileri alın',
        fields: [
          { key: 'api_key', label: 'API Key', placeholder: 'ty-xxxxx', required: true },
          { key: 'api_secret', label: 'API Secret', placeholder: 'Secret key...', type: 'password', required: true },
          { key: 'supplier_id', label: 'Supplier ID', placeholder: 'supplier_xxxxx', required: true }
        ]
      },
      {
        title: 'Webhook URL Ekleyin',
        description: 'Aşağıdaki URL\'yi Trendyol panelinde Webhook bölümüne yapıştırın',
        webhookPath: '/api/delivery/webhook/trendyol',
        fields: []
      },
      {
        title: 'Bağlantıyı Test Edin',
        description: 'Ayarları kaydedin ve bağlantıyı test edin',
        testable: true,
        fields: []
      }
    ]
  },
  migros: {
    name: 'Migros Yemek',
    logo: '🏪',
    color: 'bg-orange-600',
    borderColor: 'border-orange-600',
    steps: [
      {
        title: 'Migros Partner Portal',
        description: 'Migros partner portalına giriş yapın',
        action: 'https://partner.migros.com.tr',
        actionLabel: 'Panele Git',
        fields: []
      },
      {
        title: 'API Bilgilerini Alın',
        description: 'API Ayarları bölümünden bilgileri alın',
        fields: [
          { key: 'api_key', label: 'API Key', placeholder: 'migros-api-xxxxx', required: true },
          { key: 'store_id', label: 'Store ID', placeholder: 'store_xxxxx', required: true }
        ]
      },
      {
        title: 'Webhook URL Ekleyin',
        description: 'Aşağıdaki URL\'yi Migros panelinde Webhook bölümüne yapıştırın',
        webhookPath: '/api/delivery/webhook/migros',
        fields: []
      },
      {
        title: 'Bağlantıyı Test Edin',
        description: 'Ayarları kaydedin ve bağlantıyı test edin',
        testable: true,
        fields: []
      }
    ]
  }
};

export default function PlatformSetupWizard({ isOpen, onClose, platform: initialPlatform }) {
  const [selectedPlatform, setSelectedPlatform] = useState(initialPlatform || null);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saving, setSaving] = useState(false);

  const platform = selectedPlatform ? PLATFORMS[selectedPlatform] : null;

  useEffect(() => {
    if (initialPlatform) {
      setSelectedPlatform(initialPlatform);
    }
  }, [initialPlatform]);

  const handleInputChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const getWebhookUrl = (webhookPath) => {
    const baseUrl = window.location.origin.includes('localhost') 
      ? BACKEND_URL 
      : window.location.origin;
    return `${baseUrl}${webhookPath}`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Kopyalandı!');
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      const token = localStorage.getItem('kasaburger_token') || localStorage.getItem('dealer_token');
      const response = await fetch(`${BACKEND_URL}/api/delivery/platforms/${selectedPlatform}/test`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const result = await response.json();
      setTestResult(result);
      
      if (result.success) {
        toast.success('Bağlantı başarılı!');
      } else {
        toast.error(result.error || 'Bağlantı başarısız');
      }
    } catch (error) {
      setTestResult({ success: false, error: 'Bağlantı hatası' });
      toast.error('Bağlantı hatası');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const token = localStorage.getItem('kasaburger_token') || localStorage.getItem('dealer_token');
      const response = await fetch(`${BACKEND_URL}/api/delivery/platforms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          platform: selectedPlatform,
          enabled: true,
          ...formData
        })
      });

      if (response.ok) {
        toast.success(`${platform?.name} başarıyla yapılandırıldı!`);
        onClose?.();
      } else {
        toast.error('Kayıt başarısız');
      }
    } catch (error) {
      toast.error('İşlem başarısız');
    } finally {
      setSaving(false);
    }
  };

  const nextStep = () => {
    // Gerekli alanları kontrol et
    const step = platform?.steps[currentStep];
    if (step?.fields?.length) {
      const missingRequired = step.fields.filter(f => f.required && !formData[f.key]);
      if (missingRequired.length) {
        toast.error(`Lütfen zorunlu alanları doldurun: ${missingRequired.map(f => f.label).join(', ')}`);
        return;
      }
    }
    
    if (currentStep < (platform?.steps?.length || 0) - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const resetWizard = () => {
    setSelectedPlatform(null);
    setCurrentStep(0);
    setFormData({});
    setTestResult(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose?.(); }}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plug className="h-5 w-5 text-orange-400" />
            Platform Kurulum Sihirbazı
          </DialogTitle>
        </DialogHeader>

        {/* Platform Selection */}
        {!selectedPlatform ? (
          <div className="space-y-4 py-4">
            <p className="text-center text-zinc-400">Kurmak istediğiniz platformu seçin:</p>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(PLATFORMS).map(([key, p]) => (
                <button
                  key={key}
                  onClick={() => setSelectedPlatform(key)}
                  className={`p-6 rounded-xl border-2 border-zinc-700 hover:${p.borderColor} bg-zinc-800/50 hover:bg-zinc-800 transition-all text-center`}
                >
                  <span className="text-4xl block mb-2">{p.logo}</span>
                  <span className="font-bold">{p.name}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-2 py-4">
              {platform?.steps.map((step, index) => (
                <React.Fragment key={index}>
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      index < currentStep 
                        ? 'bg-green-500' 
                        : index === currentStep 
                          ? platform.color 
                          : 'bg-zinc-700'
                    }`}
                  >
                    {index < currentStep ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-bold">{index + 1}</span>
                    )}
                  </div>
                  {index < platform.steps.length - 1 && (
                    <div className={`w-8 h-0.5 ${index < currentStep ? 'bg-green-500' : 'bg-zinc-700'}`} />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Current Step Content */}
            <div className="space-y-6 py-4">
              <div className="text-center">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${platform.color} text-white mb-4`}>
                  <span className="text-xl">{platform.logo}</span>
                  <span className="font-bold">{platform.name}</span>
                </div>
                <h3 className="text-xl font-bold mb-2">{platform.steps[currentStep]?.title}</h3>
                <p className="text-zinc-400">{platform.steps[currentStep]?.description}</p>
              </div>

              {/* Action Button (external link) */}
              {platform.steps[currentStep]?.action && (
                <div className="text-center">
                  <Button
                    onClick={() => window.open(platform.steps[currentStep].action, '_blank')}
                    className={platform.color}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {platform.steps[currentStep].actionLabel}
                  </Button>
                </div>
              )}

              {/* Form Fields */}
              {platform.steps[currentStep]?.fields?.length > 0 && (
                <div className="space-y-4 max-w-md mx-auto">
                  {platform.steps[currentStep].fields.map(field => (
                    <div key={field.key} className="space-y-2">
                      <Label>
                        {field.label}
                        {field.required && <span className="text-red-400 ml-1">*</span>}
                      </Label>
                      <Input
                        type={field.type || 'text'}
                        placeholder={field.placeholder}
                        value={formData[field.key] || ''}
                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                        className="bg-zinc-800 border-zinc-700"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Webhook URL */}
              {platform.steps[currentStep]?.webhookPath && (
                <div className="max-w-md mx-auto space-y-2">
                  <Label className="flex items-center gap-2">
                    <Webhook className="h-4 w-4" />
                    Webhook URL
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={getWebhookUrl(platform.steps[currentStep].webhookPath)}
                      readOnly
                      className="bg-zinc-800 border-zinc-700 font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(getWebhookUrl(platform.steps[currentStep].webhookPath))}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Test Button */}
              {platform.steps[currentStep]?.testable && (
                <div className="text-center space-y-4">
                  <Button
                    onClick={handleTest}
                    disabled={testing}
                    variant="outline"
                    size="lg"
                  >
                    {testing ? (
                      <span className="animate-spin mr-2">⏳</span>
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Bağlantıyı Test Et
                  </Button>
                  
                  {testResult && (
                    <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-500/20 border border-green-500/50' : 'bg-red-500/20 border border-red-500/50'}`}>
                      {testResult.success ? (
                        <div className="flex items-center justify-center gap-2 text-green-400">
                          <CheckCircle className="h-5 w-5" />
                          <span>Bağlantı Başarılı!</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2 text-red-400">
                          <AlertCircle className="h-5 w-5" />
                          <span>{testResult.error}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <DialogFooter className="flex justify-between">
              <div className="flex gap-2">
                <Button variant="outline" onClick={resetWizard}>
                  Platformu Değiştir
                </Button>
              </div>
              <div className="flex gap-2">
                {currentStep > 0 && (
                  <Button variant="outline" onClick={prevStep}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Geri
                  </Button>
                )}
                {currentStep < platform.steps.length - 1 ? (
                  <Button onClick={nextStep} className={platform.color}>
                    İleri
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSave} 
                    disabled={saving || !testResult?.success}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {saving ? (
                      <span className="animate-spin mr-2">⏳</span>
                    ) : (
                      <Rocket className="h-4 w-4 mr-2" />
                    )}
                    Tamamla
                  </Button>
                )}
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Quick wizard trigger button
export function PlatformWizardButton({ platform, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={className}
      >
        <Plug className="h-4 w-4 mr-1" />
        Kurulum Sihirbazı
      </Button>
      
      <PlatformSetupWizard
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        platform={platform}
      />
    </>
  );
}
