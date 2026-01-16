import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Store, KeyRound, Loader2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const DealerLogin = () => {
  const [dealerCode, setDealerCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dealerCode || !password) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/dealer-portal/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealer_code: dealerCode, password }),
      });

      // Safely parse JSON response
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError);
        throw new Error('Sunucu yanıtı işlenemedi. Lütfen tekrar deneyin.');
      }
      
      if (!response.ok) {
        throw new Error(data.detail || 'Giriş başarısız');
      }

      localStorage.setItem('dealer_token', data.access_token);
      localStorage.setItem('dealer_info', JSON.stringify(data.dealer));
      toast.success('Giriş başarılı!');
      // Full page reload to ensure state is properly set
      setTimeout(() => {
        window.location.replace('/dealer');
      }, 500);
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1634737118699-8bbb06e3fa2a?crop=entropy&cs=srgb&fm=jpg&q=85')`,
        }}
      >
        <div className="absolute inset-0 bg-black/80" />
      </div>

      <Card className="w-full max-w-md relative z-10 bg-card/95 backdrop-blur-sm border-white/10">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-24 h-24">
            <img 
              src="https://customer-assets.emergentagent.com/job_kasaburger-pos/artifacts/oruytxht_b3459348-380a-4e05-8eb6-989bd31e2066.jpeg" 
              alt="KasaBurger Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <CardTitle className="text-3xl font-heading font-bold">Bayi Portalı</CardTitle>
            <CardDescription className="text-muted-foreground">
              Sipariş vermek için giriş yapın
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dealerCode">Bayi Kodu</Label>
              <div className="relative">
                <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="dealerCode"
                  type="text"
                  placeholder="BY-001"
                  value={dealerCode}
                  onChange={(e) => setDealerCode(e.target.value)}
                  className="pl-10 bg-input/50 border-input"
                  data-testid="dealer-login-code"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-input/50 border-input"
                  data-testid="dealer-login-password"
                />
              </div>
              <p className="text-xs text-muted-foreground">İlk girişte bayi kodunuzu şifre olarak kullanın</p>
            </div>
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
              disabled={loading}
              data-testid="dealer-login-submit"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Giriş yapılıyor...
                </>
              ) : (
                'Giriş Yap'
              )}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <a href="/login" className="text-sm text-muted-foreground hover:text-primary">
              Yönetici girişi için tıklayın
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DealerLogin;
