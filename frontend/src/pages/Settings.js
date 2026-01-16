import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { 
  Settings as SettingsIcon, 
  User, 
  Building, 
  Bell, 
  Loader2, 
  MessageSquare, 
  Mail,
  Save,
  TestTube,
  Key,
  Eye,
  EyeOff,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  RefreshCw
} from 'lucide-react';
// axios removed - using fetch

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Settings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [testingSms, setTestingSms] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [companySettings, setCompanySettings] = useState({
    name: 'KasaBurger',
    address: '',
    phone: '',
    email: '',
    tax_number: '',
    tax_office: '',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    netgsm_usercode: '',
    netgsm_password: '',
    netgsm_header: '',
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_password: '',
    smtp_from: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [testPhone, setTestPhone] = useState('');
  const [testEmail, setTestEmailAddr] = useState('');

  const token = localStorage.getItem('kasaburger_token');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const fetchJson = (url) => fetch(url, { headers }).then(r => r.ok ? r.json() : null).catch(() => null);
      
      const [companyData, notificationData] = await Promise.all([
        fetchJson(`${API_URL}/api/settings/company`),
        fetchJson(`${API_URL}/api/settings/notifications`)
      ]);
      
      if (companyData) setCompanySettings(companyData);
      if (notificationData) setNotificationSettings(notificationData);
    } catch (error) {
      console.error('Settings load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCompany = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/settings/company`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(companySettings)
      });
      if (!response.ok) throw new Error('Failed');
      toast.success('Şirket bilgileri kaydedildi');
    } catch (error) {
      toast.error('Kaydetme başarısız');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSavingNotifications(true);
    try {
      const response = await fetch(`${API_URL}/api/settings/notifications`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationSettings)
      });
      if (!response.ok) throw new Error('Failed');
      toast.success('Bildirim ayarları kaydedildi');
    } catch (error) {
      toast.error('Kaydetme başarısız');
    } finally {
      setSavingNotifications(false);
    }
  };

  const handleTestSms = async () => {
    if (!testPhone) {
      toast.error('Test telefon numarası girin');
      return;
    }
    setTestingSms(true);
    try {
      const response = await fetch(`${API_URL}/api/test-sms`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: testPhone, message: 'KasaBurger test SMS mesajı' })
      });
      const data = await response.json();
      if (data.status === 'success') {
        toast.success('Test SMS gönderildi!');
      } else {
        toast.error(data.message || 'SMS gönderilemedi');
      }
    } catch (error) {
      toast.error('SMS test başarısız');
    } finally {
      setTestingSms(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      toast.error('Test email adresi girin');
      return;
    }
    setTestingEmail(true);
    try {
      const response = await fetch(`${API_URL}/api/test-email`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, subject: 'KasaBurger Test', body: 'Bu bir test emailidir.' })
      });
      const data = await response.json();
      if (data.status === 'success') {
        toast.success('Test email gönderildi!');
      } else {
        toast.error(data.message || 'Email gönderilemedi');
      }
    } catch (error) {
      toast.error('Email test başarısız');
    } finally {
      setTestingEmail(false);
    }
  };

  const handleChangePassword = async () => {
    // Validasyon
    if (!passwordForm.currentPassword) {
      toast.error('Mevcut şifrenizi girin');
      return;
    }
    if (!passwordForm.newPassword) {
      toast.error('Yeni şifrenizi girin');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Yeni şifre en az 6 karakter olmalı');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Yeni şifreler eşleşmiyor');
      return;
    }

    setSavingPassword(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/change-password`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: passwordForm.currentPassword, new_password: passwordForm.newPassword })
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed');
      }
      toast.success('Şifreniz başarıyla değiştirildi');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.message || 'Şifre değiştirilemedi');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="settings-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold">Ayarlar</h1>
        <p className="text-muted-foreground">Sistem ve hesap ayarlarını yönetin</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-card border border-border/50">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Şirket
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Bildirimler
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            Sistem
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <div className="grid gap-6">
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

            {/* Password Change Card */}
            <Card className="bg-card border-border/50">
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary" />
                  Şifre Değiştir
                </CardTitle>
                <CardDescription>Hesap şifrenizi güncelleyin</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Mevcut Şifre</Label>
                  <div className="relative">
                    <Input
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      placeholder="••••••••"
                      className="bg-input/50 pr-10"
                      data-testid="current-password-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Yeni Şifre</Label>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        placeholder="••••••••"
                        className="bg-input/50 pr-10"
                        data-testid="new-password-input"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">En az 6 karakter</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Yeni Şifre (Tekrar)</Label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        placeholder="••••••••"
                        className="bg-input/50 pr-10"
                        data-testid="confirm-password-input"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                <Separator className="my-4" />
                <div className="flex justify-end">
                  <Button 
                    onClick={handleChangePassword} 
                    className="bg-primary" 
                    disabled={savingPassword}
                    data-testid="change-password-btn"
                  >
                    {savingPassword ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Key className="h-4 w-4 mr-2" />}
                    Şifreyi Değiştir
                  </Button>
                </div>
                
                {/* Password Policy Info */}
                <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <h4 className="font-semibold text-blue-400 text-sm mb-2">Şifre Politikası</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>✓ En az 6 karakter</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Company Tab */}
        <TabsContent value="company">
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
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Kaydet
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <div className="grid gap-6">
            {/* SMS Settings - NetGSM */}
            <Card className="bg-card border-border/50">
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-green-500" />
                  SMS Ayarları (NetGSM)
                </CardTitle>
                <CardDescription>
                  Kampanya SMS bildirimleri için NetGSM hesap bilgilerinizi girin.
                  <a href="https://www.netgsm.com.tr" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
                    NetGSM'e Git
                  </a>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Kullanıcı Kodu</Label>
                    <Input
                      value={notificationSettings.netgsm_usercode}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, netgsm_usercode: e.target.value })}
                      placeholder="8501234567"
                      className="bg-input/50"
                      data-testid="netgsm-usercode"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Şifre</Label>
                    <Input
                      type="password"
                      value={notificationSettings.netgsm_password}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, netgsm_password: e.target.value })}
                      placeholder="••••••••"
                      className="bg-input/50"
                      data-testid="netgsm-password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Başlık (Header)</Label>
                    <Input
                      value={notificationSettings.netgsm_header}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, netgsm_header: e.target.value })}
                      placeholder="KASABURGER"
                      className="bg-input/50"
                      data-testid="netgsm-header"
                    />
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Test SMS Gönder</Label>
                    <Input
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      placeholder="5XX XXX XX XX"
                      className="bg-input/50 mt-1"
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handleTestSms} 
                    disabled={testingSms}
                    className="mt-5"
                  >
                    {testingSms ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube className="h-4 w-4 mr-1" />}
                    Test
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Email Settings - SMTP */}
            <Card className="bg-card border-border/50">
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2">
                  <Mail className="h-5 w-5 text-blue-500" />
                  Email Ayarları (SMTP)
                </CardTitle>
                <CardDescription>
                  Kampanya email bildirimleri için SMTP sunucu bilgilerinizi girin.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>SMTP Sunucu</Label>
                    <Input
                      value={notificationSettings.smtp_host}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, smtp_host: e.target.value })}
                      placeholder="smtp.gmail.com"
                      className="bg-input/50"
                      data-testid="smtp-host"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Port</Label>
                    <Input
                      type="number"
                      value={notificationSettings.smtp_port}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, smtp_port: parseInt(e.target.value) || 587 })}
                      placeholder="587"
                      className="bg-input/50"
                      data-testid="smtp-port"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Kullanıcı Adı</Label>
                    <Input
                      value={notificationSettings.smtp_user}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, smtp_user: e.target.value })}
                      placeholder="email@domain.com"
                      className="bg-input/50"
                      data-testid="smtp-user"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Şifre</Label>
                    <Input
                      type="password"
                      value={notificationSettings.smtp_password}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, smtp_password: e.target.value })}
                      placeholder="••••••••"
                      className="bg-input/50"
                      data-testid="smtp-password"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Gönderen Email Adresi</Label>
                  <Input
                    type="email"
                    value={notificationSettings.smtp_from}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, smtp_from: e.target.value })}
                    placeholder="noreply@kasaburger.com"
                    className="bg-input/50"
                    data-testid="smtp-from"
                  />
                </div>
                <Separator />
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Test Email Gönder</Label>
                    <Input
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmailAddr(e.target.value)}
                      placeholder="test@example.com"
                      className="bg-input/50 mt-1"
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handleTestEmail} 
                    disabled={testingEmail}
                    className="mt-5"
                  >
                    {testingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube className="h-4 w-4 mr-1" />}
                    Test
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button onClick={handleSaveNotifications} className="bg-primary" disabled={savingNotifications}>
                {savingNotifications ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Bildirim Ayarlarını Kaydet
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system">
          <div className="grid gap-6">
            {/* Security Status Card */}
            <Card className="bg-card border-border/50 border-green-500/30">
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-green-500" />
                  Güvenlik Durumu
                </CardTitle>
                <CardDescription>Sistem güvenlik önlemleri ve koruma durumu</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-center">
                    <Lock className="h-6 w-6 text-green-500 mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Rate Limiting</p>
                    <p className="text-sm font-bold text-green-500">Aktif</p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-center">
                    <ShieldAlert className="h-6 w-6 text-green-500 mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Brute Force</p>
                    <p className="text-sm font-bold text-green-500">Korumalı</p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-center">
                    <Shield className="h-6 w-6 text-green-500 mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">CORS</p>
                    <p className="text-sm font-bold text-green-500">Kısıtlı</p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-center">
                    <ShieldCheck className="h-6 w-6 text-green-500 mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">IP Engelleme</p>
                    <p className="text-sm font-bold text-green-500">Aktif</p>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="space-y-3 text-sm">
                  <h4 className="font-semibold text-muted-foreground">Güvenlik Ayarları</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">İstek Limiti</span>
                      <span className="font-mono">100/dakika</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Giriş Deneme Limiti</span>
                      <span className="font-mono">5 deneme</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Engelleme Süresi</span>
                      <span className="font-mono">5 dakika</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Toplu İstek Limiti</span>
                      <span className="font-mono">10/dakika</span>
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />
                
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <h4 className="font-semibold text-blue-400 mb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Koruma Özellikleri
                  </h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>✓ Başarısız giriş denemelerinde IP engelleme</li>
                    <li>✓ API isteklerinde rate limiting</li>
                    <li>✓ Toplu veri çekme sınırlaması</li>
                    <li>✓ Güvenlik header'ları (XSS, CSRF koruması)</li>
                    <li>✓ Sadece izin verilen domainlerden erişim</li>
                    <li>✓ Token tabanlı kimlik doğrulama</li>
                    <li>✓ Captcha doğrulama (başarısız girişlerde)</li>
                    <li>✓ 2FA (İki Faktörlü Doğrulama) desteği</li>
                    <li>✓ Güçlü şifre politikası</li>
                    <li>✓ Audit logging (işlem kayıtları)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* System Info Card */}
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
                    <span className="font-mono">1.0.4</span>
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
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Güvenlik</span>
                    <span className="font-mono text-green-500">Gelişmiş</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Captcha</span>
                    <span className="font-mono text-green-500">Aktif</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">2FA</span>
                    <span className="font-mono text-green-500">Destekleniyor</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Audit Log</span>
                    <span className="font-mono text-green-500">Aktif</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
