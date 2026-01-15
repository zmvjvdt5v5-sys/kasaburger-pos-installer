import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Smartphone, Download, Apple, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

const PWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches 
      || window.navigator.standalone 
      || document.referrer.includes('android-app://');
    setIsStandalone(isInStandaloneMode);

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);

    // Check if dismissed
    const wasDismissed = localStorage.getItem('pwa-install-dismissed');
    if (wasDismissed) {
      setDismissed(true);
    }

    // Listen for beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      setShowInstallDialog(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Don't show if already installed or dismissed
  if (isStandalone || dismissed) {
    return null;
  }

  // Don't show if no install option available
  if (!deferredPrompt && !isIOS) {
    return null;
  }

  return (
    <>
      <Card className="bg-gradient-to-r from-primary/20 to-orange-500/20 border-primary/30 relative">
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-2 right-2 h-6 w-6"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
        <CardHeader className="pb-2">
          <CardTitle className="font-heading flex items-center gap-2 text-lg">
            <Smartphone className="h-5 w-5 text-primary" />
            Mobil Uygulama
            <Badge className="bg-emerald-500 text-white ml-2">YENİ</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            KasaBurger'i telefonunuza indirin, her yerden sipariş takibi yapın!
          </p>
          <div className="flex gap-2">
            <Button 
              onClick={handleInstallClick}
              className="bg-primary hover:bg-primary/90"
            >
              <Download className="h-4 w-4 mr-2" />
              {isIOS ? 'Nasıl Yüklenir?' : 'Uygulamayı İndir'}
            </Button>
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Apple className="h-3 w-3" /> iPhone
            </span>
            <span className="flex items-center gap-1">
              <Smartphone className="h-3 w-3" /> Android
            </span>
          </div>
        </CardContent>
      </Card>

      {/* iOS Installation Instructions Dialog */}
      <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <Apple className="h-5 w-5" />
              iPhone'a Nasıl Yüklenir?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-md bg-background/50">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">1</div>
              <div>
                <p className="font-medium">Safari'de Paylaş butonuna tıklayın</p>
                <p className="text-sm text-muted-foreground">Ekranın altındaki paylaş ikonuna (kare ve yukarı ok) dokunun</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-md bg-background/50">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">2</div>
              <div>
                <p className="font-medium">"Ana Ekrana Ekle" seçin</p>
                <p className="text-sm text-muted-foreground">Menüyü aşağı kaydırın ve "Ana Ekrana Ekle" seçeneğini bulun</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-md bg-background/50">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">3</div>
              <div>
                <p className="font-medium">"Ekle" butonuna dokunun</p>
                <p className="text-sm text-muted-foreground">KasaBurger uygulaması ana ekranınıza eklenecek!</p>
              </div>
            </div>
          </div>
          <Button onClick={() => setShowInstallDialog(false)} className="w-full mt-4">
            Anladım
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PWAInstall;
