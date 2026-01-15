import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { toast } from 'sonner';
import { Settings as SettingsIcon, User, Building, Shield, Bell, Palette, Loader2 } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Settings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companySettings, setCompanySettings] = useState({
    name: 'KasaBurger İmalathanesi',
    address: '',
    phone: '',
    email: '',
    tax_number: '',
    tax_office: '',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const token = localStorage.getItem('kasaburger_token');
      const response = await axios.get(`${API_URL}/api/settings/company`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCompanySettings(response.data);
    } catch (error) {
      console.error('Settings load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCompany = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('kasaburger_token');
      await axios.put(`${API_URL}/api/settings/company`, companySettings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Şirket bilgileri kaydedildi');
    } catch (error) {
      toast.error('Kaydetme başarısız');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="settings-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold">Ayarlar</h1>
        <p className="text-muted-foreground">Sistem ve hesap ayarlarını yönetin</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <Card className="bg-card border-border/50">
            <CardContent className="p-4">
              <nav className="space-y-1">
                {[
                  { icon: User, label: 'Profil', active: true },
                  { icon: Building, label: 'Şirket Bilgileri', active: false },
                  { icon: Shield, label: 'Güvenlik', active: false },
                  { icon: Bell, label: 'Bildirimler', active: false },
                  { icon: Palette, label: 'Görünüm', active: false },
                ].map((item, index) => (
                  <button
                    key={index}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-left ${
                      item.active
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Section */}
          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Profil Bilgileri
              </CardTitle>
              <CardDescription>Hesap bilgilerinizi görüntüleyin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg">{user?.name}</h3>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <p className="text-xs text-muted-foreground capitalize mt-1">
                    Rol: {user?.role === 'admin' ? 'Yönetici' : 'Kullanıcı'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Company Settings */}
          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" />
                Şirket Bilgileri
              </CardTitle>
              <CardDescription>Faturalarda görünecek şirket bilgileri</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Şirket Adı</Label>
                  <Input
                    value={companySettings.name}
                    onChange={(e) => setCompanySettings({ ...companySettings, name: e.target.value })}
                    className="bg-input/50"
                    data-testid="company-name-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefon</Label>
                  <Input
                    value={companySettings.phone}
                    onChange={(e) => setCompanySettings({ ...companySettings, phone: e.target.value })}
                    placeholder="0212 123 4567"
                    className="bg-input/50"
                    data-testid="company-phone-input"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>E-posta</Label>
                <Input
                  type="email"
                  value={companySettings.email}
                  onChange={(e) => setCompanySettings({ ...companySettings, email: e.target.value })}
                  placeholder="info@kasaburger.com"
                  className="bg-input/50"
                  data-testid="company-email-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Adres</Label>
                <Input
                  value={companySettings.address}
                  onChange={(e) => setCompanySettings({ ...companySettings, address: e.target.value })}
                  placeholder="Şirket adresi"
                  className="bg-input/50"
                  data-testid="company-address-input"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Vergi No</Label>
                  <Input
                    value={companySettings.tax_number}
                    onChange={(e) => setCompanySettings({ ...companySettings, tax_number: e.target.value })}
                    placeholder="1234567890"
                    className="bg-input/50"
                    data-testid="company-tax-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vergi Dairesi</Label>
                  <Input
                    value={companySettings.tax_office}
                    onChange={(e) => setCompanySettings({ ...companySettings, tax_office: e.target.value })}
                    placeholder="Kadıköy"
                    className="bg-input/50"
                    data-testid="company-tax-office-input"
                  />
                </div>
              </div>
              <Separator className="my-4" />
              <div className="flex justify-end">
                <Button onClick={handleSaveCompany} className="bg-primary" disabled={saving} data-testid="save-company-btn">
                  {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Kaydet
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* System Info */}
          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2">
                <SettingsIcon className="h-5 w-5 text-primary" />
                Sistem Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Versiyon</span>
                  <span className="font-mono">1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Veritabanı</span>
                  <span className="font-mono">MongoDB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">API</span>
                  <span className="font-mono">FastAPI</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Frontend</span>
                  <span className="font-mono">React</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
