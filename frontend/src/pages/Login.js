import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Mail, Lock, Loader2, Shield, RefreshCw, Store } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Direct login function using form submission in hidden iframe
const directLogin = (url, data) => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Bağlantı zaman aşımı'));
    }, 15000);

    // Create hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.name = 'loginFrame' + Date.now();
    document.body.appendChild(iframe);

    // Create form
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = url;
    form.target = iframe.name;
    form.style.display = 'none';

    // Add data as hidden inputs
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = data[key];
        form.appendChild(input);
      }
    });

    // Add JSON content type indicator
    const jsonInput = document.createElement('input');
    jsonInput.type = 'hidden';
    jsonInput.name = '_json';
    jsonInput.value = JSON.stringify(data);
    form.appendChild(jsonInput);

    document.body.appendChild(form);

    const cleanup = () => {
      clearTimeout(timeout);
      try {
        document.body.removeChild(form);
        document.body.removeChild(iframe);
      } catch(e) {}
    };

    // Also try XHR as backup
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.timeout = 10000;
    
    xhr.onload = function() {
      cleanup();
      try {
        const response = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(response);
        } else {
          reject(new Error(response.detail || 'Giriş başarısız'));
        }
      } catch(e) {
        reject(new Error('Sunucu yanıtı işlenemedi'));
      }
    };
    
    xhr.onerror = function() {
      cleanup();
      reject(new Error('Bağlantı hatası'));
    };
    
    xhr.ontimeout = function() {
      cleanup();
      reject(new Error('Bağlantı zaman aşımı'));
    };

    // Send XHR
    try {
      xhr.send(JSON.stringify(data));
    } catch(e) {
      cleanup();
      reject(new Error('İstek gönderilemedi'));
    }
  });
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captcha, setCaptcha] = useState(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFACode, setTwoFACode] = useState('');
  const [twoFAEmail, setTwoFAEmail] = useState('');

  // Suppress errors on mount
  useEffect(() => {
    const handler = (e) => {
      if (e.message && (e.message.includes('postMessage') || e.message.includes('cloned'))) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };
    window.addEventListener('error', handler, true);
    return () => window.removeEventListener('error', handler, true);
  }, []);

  const loadCaptcha = async () => {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', `${API_URL}/api/auth/captcha`, true);
      xhr.onload = function() {
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText);
          setCaptcha(data);
          setCaptchaAnswer('');
        }
      };
      xhr.send();
    } catch (error) {
      console.error('Captcha yüklenemedi');
    }
  };

  useEffect(() => {
    if (captchaRequired) {
      loadCaptcha();
    }
  }, [captchaRequired]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!email || !password) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }

    if (captchaRequired && !captchaAnswer) {
      toast.error('Lütfen güvenlik sorusunu cevaplayın');
      return;
    }

    setLoading(true);
    
    try {
      const loginData = {
        email: email,
        password: password,
        captcha_answer: captchaRequired ? parseInt(captchaAnswer) : null
      };

      const url = captchaRequired && captcha 
        ? `${API_URL}/api/auth/login?captcha_id=${captcha.captcha_id}`
        : `${API_URL}/api/auth/login`;

      const data = await directLogin(url, loginData);

      if (data.requires_2fa) {
        setRequires2FA(true);
        setTwoFAEmail(data.email || email);
        toast.info('2FA kodu email adresinize gönderildi');
        setLoading(false);
        return;
      }

      // Success - save and redirect
      localStorage.setItem('kasaburger_token', data.access_token);
      localStorage.setItem('kasaburger_user', JSON.stringify(data.user));
      toast.success('Giriş başarılı!');
      
      // Use location.replace for clean redirect
      setTimeout(() => {
        window.location.replace('/dashboard');
      }, 500);
      
    } catch (error) {
      console.error('Login error:', error);
      if (error.message && error.message.includes('Captcha')) {
        setCaptchaRequired(true);
        loadCaptcha();
      }
      toast.error(error.message || 'Giriş başarısız');
      setLoading(false);
    }
  };

  const handle2FASubmit = async (e) => {
    e.preventDefault();
    if (!twoFACode) {
      toast.error('Lütfen 2FA kodunu girin');
      return;
    }

    setLoading(true);
    try {
      const data = await directLogin(`${API_URL}/api/auth/verify-2fa`, { 
        email: twoFAEmail, 
        code: twoFACode 
      });

      localStorage.setItem('kasaburger_token', data.access_token);
      localStorage.setItem('kasaburger_user', JSON.stringify(data.user));
      toast.success('Giriş başarılı!');
      
      setTimeout(() => {
        window.location.replace('/dashboard');
      }, 500);
    } catch (error) {
      toast.error(error.message || '2FA doğrulaması başarısız');
      setLoading(false);
    }
  };

  if (requires2FA) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1634737118699-8bbb06e3fa2a?crop=entropy&cs=srgb&fm=jpg&q=85')` }}>
          <div className="absolute inset-0 bg-black/80" />
        </div>
        <Card className="w-full max-w-md relative z-10 bg-card/95 backdrop-blur-sm border-white/10">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-heading font-bold">2FA Doğrulama</CardTitle>
              <CardDescription>Email adresinize gönderilen 6 haneli kodu girin</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handle2FASubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="2fa-code">Doğrulama Kodu</Label>
                <Input id="2fa-code" type="text" maxLength={6} placeholder="123456" value={twoFACode} onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ''))} className="text-center text-2xl tracking-widest" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Shield className="h-4 w-4 mr-2" />}
                Doğrula
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={() => { setRequires2FA(false); setTwoFACode(''); }}>
                Geri Dön
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1634737118699-8bbb06e3fa2a?crop=entropy&cs=srgb&fm=jpg&q=85')` }}>
        <div className="absolute inset-0 bg-black/80" />
      </div>
      <Card className="w-full max-w-md relative z-10 bg-card/95 backdrop-blur-sm border-white/10">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-24 h-24">
            <img src="https://customer-assets.emergentagent.com/job_kasaburger-pos/artifacts/oruytxht_b3459348-380a-4e05-8eb6-989bd31e2066.jpeg" alt="KasaBurger Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <CardTitle className="text-3xl font-heading font-bold">KasaBurger</CardTitle>
            <CardDescription>Yönetim Paneli</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="admin@kasaburger.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" data-testid="login-email" autoComplete="email" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" data-testid="login-password" autoComplete="current-password" />
              </div>
            </div>

            {captchaRequired && captcha && (
              <div className="space-y-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <div className="flex items-center justify-between">
                  <Label className="text-amber-400 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Güvenlik Doğrulaması
                  </Label>
                  <Button type="button" variant="ghost" size="sm" onClick={loadCaptcha} className="h-6 px-2">
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </div>
                <div className="text-center p-2 bg-card rounded font-mono text-lg">{captcha.question}</div>
                <Input type="number" placeholder="Cevabı yazın" value={captchaAnswer} onChange={(e) => setCaptchaAnswer(e.target.value)} className="text-center" />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading} data-testid="login-submit">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Giriş Yap
            </Button>
          </form>
          <div className="mt-6 pt-4 border-t border-white/10 text-center">
            <p className="text-xs text-muted-foreground mb-2">Bayi misiniz?</p>
            <Link to="/dealer-login" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-colors font-medium" data-testid="dealer-link">
              <Store className="h-4 w-4" />
              Bayi Girişi
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
