import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Smartphone, Download, Apple, X, Share2 } from 'lucide-react';
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
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches 
      || window.navigator.standalone 
      || document.referrer.includes('android-app://');
    setIsStandalone(isInStandaloneMode);

    // Check device type
    const userAgent = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));

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
    } else {
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
              Uygulamayı İndir
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

      {/* Installation Instructions Dialog */}
      <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              Mobil Uygulamayı İndirin
            </DialogTitle>
          </DialogHeader>
          
          {/* iOS Instructions */}
          <div className="space-y-4">
            <div className="p-3 rounded-md bg-background/50 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Apple className="h-5 w-5" />
                <span className="font-medium">iPhone / iPad</span>
              </div>
              <ol className="text-sm text-muted-foreground space-y-2 ml-7">
                <li>1. Safari'de bu sayfayı açın</li>
                <li>2. <Share2 className="h-3 w-3 inline" /> Paylaş butonuna dokunun</li>
                <li>3. "Ana Ekrana Ekle" seçin</li>
                <li>4. "Ekle" butonuna dokunun</li>
              </ol>
            </div>

            <div className="p-3 rounded-md bg-background/50 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="h-5 w-5 text-emerald-500" />
                <span className="font-medium">Android</span>
              </div>
              <ol className="text-sm text-muted-foreground space-y-2 ml-7">
                <li>1. Chrome'da bu sayfayı açın</li>
                <li>2. Sağ üstteki ⋮ menüye dokunun</li>
                <li>3. "Uygulamayı yükle" veya "Ana ekrana ekle" seçin</li>
                <li>4. "Yükle" butonuna dokunun</li>
              </ol>
            </div>

            <div className="text-center p-3 bg-primary/10 rounded-md">
              <p className="text-sm font-medium text-primary">Şu anki URL:</p>
              <p className="text-xs text-muted-foreground mt-1 font-mono">
                {window.location.origin}
              </p>
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
