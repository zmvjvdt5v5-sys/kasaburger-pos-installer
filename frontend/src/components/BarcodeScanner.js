import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Camera, X, QrCode, Barcode, RefreshCw } from 'lucide-react';

export default function BarcodeScanner({ open, onClose, onScan, title = "Barkod/QR Kod Tara" }) {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const codeReaderRef = useRef(null);

  useEffect(() => {
    if (open) {
      initScanner();
    }
    return () => {
      stopScanner();
    };
  }, [open]);

  const initScanner = async () => {
    try {
      setError(null);
      setScanning(true);
      
      // Get available video devices
      const videoDevices = await BrowserMultiFormatReader.listVideoInputDevices();
      setDevices(videoDevices);
      
      if (videoDevices.length === 0) {
        setError('Kamera bulunamadı');
        setScanning(false);
        return;
      }

      // Prefer back camera on mobile
      const backCamera = videoDevices.find(d => 
        d.label.toLowerCase().includes('back') || 
        d.label.toLowerCase().includes('arka')
      );
      const deviceToUse = backCamera || videoDevices[0];
      setSelectedDevice(deviceToUse.deviceId);
      
      await startScanning(deviceToUse.deviceId);
    } catch (err) {
      console.error('Scanner init error:', err);
      setError('Kamera başlatılamadı: ' + err.message);
      setScanning(false);
    }
  };

  const startScanning = async (deviceId) => {
    try {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }

      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;

      await codeReader.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result, err) => {
          if (result) {
            const code = result.getText();
            setLastResult(code);
            
            // Vibrate on success (mobile)
            if (navigator.vibrate) {
              navigator.vibrate(200);
            }
            
            // Call onScan callback
            if (onScan) {
              onScan(code, result.getBarcodeFormat().toString());
            }
          }
        }
      );
    } catch (err) {
      console.error('Scanning error:', err);
      setError('Tarama hatası: ' + err.message);
    }
  };

  const stopScanner = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
      codeReaderRef.current = null;
    }
    setScanning(false);
  };

  const switchCamera = async () => {
    if (devices.length < 2) return;
    
    const currentIndex = devices.findIndex(d => d.deviceId === selectedDevice);
    const nextIndex = (currentIndex + 1) % devices.length;
    const nextDevice = devices[nextIndex];
    
    setSelectedDevice(nextDevice.deviceId);
    await startScanning(nextDevice.deviceId);
  };

  const handleClose = () => {
    stopScanner();
    setLastResult(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-orange-500" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          {/* Video Preview */}
          <div className="relative aspect-square bg-black">
            <video 
              ref={videoRef} 
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            
            {/* Scanning Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Corner markers */}
              <div className="absolute top-8 left-8 w-16 h-16 border-l-4 border-t-4 border-orange-500 rounded-tl-lg" />
              <div className="absolute top-8 right-8 w-16 h-16 border-r-4 border-t-4 border-orange-500 rounded-tr-lg" />
              <div className="absolute bottom-8 left-8 w-16 h-16 border-l-4 border-b-4 border-orange-500 rounded-bl-lg" />
              <div className="absolute bottom-8 right-8 w-16 h-16 border-r-4 border-b-4 border-orange-500 rounded-br-lg" />
              
              {/* Scanning line animation */}
              {scanning && (
                <div className="absolute left-8 right-8 h-0.5 bg-orange-500 animate-scan" 
                     style={{ top: '50%', boxShadow: '0 0 10px #f97316' }} />
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <div className="text-center p-4">
                  <Camera className="h-12 w-12 text-red-500 mx-auto mb-2" />
                  <p className="text-red-400">{error}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={initScanner}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" /> Tekrar Dene
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="p-4 space-y-3">
            {/* Last Result */}
            {lastResult && (
              <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3">
                <p className="text-xs text-green-400 mb-1">Son Okunan Kod:</p>
                <p className="font-mono text-lg text-white break-all">{lastResult}</p>
              </div>
            )}

            {/* Camera Switch */}
            {devices.length > 1 && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={switchCamera}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Kamera Değiştir ({devices.findIndex(d => d.deviceId === selectedDevice) + 1}/{devices.length})
              </Button>
            )}

            {/* Instructions */}
            <div className="text-center text-zinc-400 text-sm">
              <div className="flex items-center justify-center gap-4">
                <span className="flex items-center gap-1">
                  <Barcode className="h-4 w-4" /> Barkod
                </span>
                <span className="flex items-center gap-1">
                  <QrCode className="h-4 w-4" /> QR Kod
                </span>
              </div>
              <p className="mt-1">Kodu çerçeve içine getirin</p>
            </div>
          </div>
        </div>
      </DialogContent>

      <style jsx global>{`
        @keyframes scan {
          0%, 100% { top: 20%; }
          50% { top: 80%; }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
      `}</style>
    </Dialog>
  );
}
