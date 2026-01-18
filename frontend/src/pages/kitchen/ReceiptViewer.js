import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { toast } from 'sonner';
import { Download, Camera, Share2, X, Printer, QrCode } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import html2canvas from 'html2canvas';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export function ReceiptViewer({ orderId, open, onClose }) {
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const receiptRef = useRef(null);

  // Token
  const getToken = () => localStorage.getItem('kasaburger_token') || localStorage.getItem('dealer_token');

  // Fiş verilerini yükle
  useEffect(() => {
    if (open && orderId) {
      loadReceipt();
    }
  }, [open, orderId]);

  const loadReceipt = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const response = await fetch(`${BACKEND_URL}/api/kitchen/receipt/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setReceipt(data);
      } else {
        toast.error('Fiş yüklenemedi');
      }
    } catch (error) {
      toast.error('Fiş yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  // Ekran görüntüsü al
  const captureScreenshot = async () => {
    if (!receiptRef.current) return;
    
    try {
      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: '#ffffff',
        scale: 2
      });
      
      const link = document.createElement('a');
      link.download = `fis-${receipt?.queue_number || 'siparis'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast.success('Fiş kaydedildi!');
    } catch (error) {
      toast.error('Ekran görüntüsü alınamadı');
    }
  };

  // PDF olarak indir (basit HTML to PDF)
  const downloadPDF = async () => {
    if (!receiptRef.current) return;
    
    try {
      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: '#ffffff',
        scale: 2
      });
      
      // PDF oluştur (basit yöntem - canvas'ı PDF olarak kaydet)
      const imgData = canvas.toDataURL('image/png');
      
      // Yeni pencerede aç - kullanıcı oradan yazdırabilir/PDF yapabilir
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Fiş - ${receipt?.queue_number || 'Sipariş'}</title>
              <style>
                body { 
                  margin: 0; 
                  display: flex; 
                  justify-content: center; 
                  align-items: center; 
                  min-height: 100vh;
                  background: #f5f5f5;
                }
                img { 
                  max-width: 100%; 
                  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }
                @media print {
                  body { background: white; }
                  img { box-shadow: none; max-width: 80mm; }
                }
              </style>
            </head>
            <body>
              <img src="${imgData}" alt="Fiş" />
              <script>
                window.onload = function() {
                  window.print();
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
      
      toast.success('PDF hazırlandı!');
    } catch (error) {
      toast.error('PDF oluşturulamadı');
    }
  };

  // Paylaş (mobil için)
  const shareReceipt = async () => {
    if (!receiptRef.current || !navigator.share) {
      toast.error('Paylaşma desteklenmiyor');
      return;
    }
    
    try {
      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: '#ffffff',
        scale: 2
      });
      
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        
        const file = new File([blob], `fis-${receipt?.queue_number}.png`, { type: 'image/png' });
        
        await navigator.share({
          title: `Sipariş Fişi - ${receipt?.queue_number}`,
          files: [file]
        });
        
        toast.success('Paylaşıldı!');
      });
    } catch (error) {
      if (error.name !== 'AbortError') {
        toast.error('Paylaşılamadı');
      }
    }
  };

  // Para formatı
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount || 0);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Sipariş Fişi</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        ) : receipt ? (
          <div className="space-y-4">
            {/* Fiş Önizleme */}
            <div 
              ref={receiptRef}
              className="bg-white text-black p-6 rounded-lg font-mono text-sm"
              style={{ width: '280px', margin: '0 auto' }}
            >
              {/* Başlık */}
              <div className="text-center border-b-2 border-dashed border-gray-300 pb-4 mb-4">
                <h2 className="text-xl font-bold">KASA BURGER</h2>
                <p className="text-xs text-gray-500">Lezzetin Adresi</p>
              </div>
              
              {/* Sıra Numarası - Büyük */}
              <div className="text-center bg-gray-100 py-4 rounded-lg mb-4">
                <p className="text-xs text-gray-500 mb-1">SIRA NUMARANIZ</p>
                <p className="text-4xl font-bold text-orange-600">{receipt.queue_number}</p>
              </div>
              
              {/* Tarih/Saat */}
              <div className="flex justify-between text-xs text-gray-500 mb-4">
                <span>{new Date(receipt.created_at).toLocaleDateString('tr-TR')}</span>
                <span>{new Date(receipt.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              
              {/* Ürünler */}
              <div className="border-t border-dashed border-gray-300 pt-3">
                {(receipt.items || []).map((item, idx) => (
                  <div key={idx} className="flex justify-between py-1">
                    <span>
                      {item.quantity}x {(item.product_name || item.name || '').substring(0, 18)}
                    </span>
                    <span className="font-medium">
                      {formatCurrency((item.price || 0) * (item.quantity || 1))}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Toplam */}
              <div className="border-t-2 border-dashed border-gray-300 mt-3 pt-3">
                {receipt.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>İndirim</span>
                    <span>-{formatCurrency(receipt.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg">
                  <span>TOPLAM</span>
                  <span>{formatCurrency(receipt.total)}</span>
                </div>
              </div>
              
              {/* Not */}
              {receipt.notes && (
                <div className="mt-3 text-xs text-gray-500 border-t border-dashed pt-2">
                  Not: {receipt.notes}
                </div>
              )}
              
              {/* Footer */}
              <div className="text-center mt-6 pt-4 border-t border-dashed border-gray-300">
                <p className="text-xs text-gray-400">Siparişiniz hazır olduğunda</p>
                <p className="text-xs text-gray-400">numaranız ekranda görünecektir</p>
                <p className="font-bold text-sm mt-2">Afiyet Olsun! 🍔</p>
              </div>
            </div>
            
            {/* Aksiyon Butonları */}
            <div className="grid grid-cols-3 gap-2">
              <Button onClick={captureScreenshot} variant="outline" className="flex-col h-20">
                <Camera className="h-6 w-6 mb-1" />
                <span className="text-xs">Kaydet</span>
              </Button>
              <Button onClick={downloadPDF} variant="outline" className="flex-col h-20">
                <Download className="h-6 w-6 mb-1" />
                <span className="text-xs">PDF</span>
              </Button>
              {navigator.share && (
                <Button onClick={shareReceipt} variant="outline" className="flex-col h-20">
                  <Share2 className="h-6 w-6 mb-1" />
                  <span className="text-xs">Paylaş</span>
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-zinc-500">
            Fiş bulunamadı
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Standalone Receipt Page (Kiosk için)
export default function ReceiptPage() {
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const receiptRef = useRef(null);
  
  // URL'den order_id al
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('order_id');

  useEffect(() => {
    if (orderId) {
      loadReceipt();
    }
  }, [orderId]);

  const loadReceipt = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/kitchen/receipt/${orderId}`);
      if (response.ok) {
        const data = await response.json();
        setReceipt(data);
      }
    } catch (error) {
      console.error('Receipt load error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Otomatik screenshot
  const captureAndDownload = async () => {
    if (!receiptRef.current) return;
    
    try {
      const html2canvasModule = await import('html2canvas');
      const html2canvas = html2canvasModule.default;
      
      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: '#ffffff',
        scale: 2
      });
      
      const link = document.createElement('a');
      link.download = `fis-${receipt?.queue_number || 'siparis'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Screenshot error:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500"></div>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-2xl mb-4">Fiş bulunamadı</p>
          <Button onClick={() => window.history.back()}>Geri Dön</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      {/* Fiş */}
      <div 
        ref={receiptRef}
        className="bg-white text-black p-8 rounded-xl shadow-2xl font-mono"
        style={{ width: '320px' }}
      >
        {/* Başlık */}
        <div className="text-center border-b-2 border-dashed border-gray-300 pb-4 mb-4">
          <h2 className="text-2xl font-bold">🍔 KASA BURGER</h2>
          <p className="text-sm text-gray-500">Lezzetin Adresi</p>
        </div>
        
        {/* Sıra Numarası */}
        <div className="text-center bg-orange-100 py-6 rounded-xl mb-4">
          <p className="text-sm text-gray-600 mb-2">SIRA NUMARANIZ</p>
          <p className="text-5xl font-bold text-orange-600">{receipt.queue_number}</p>
        </div>
        
        {/* Tarih */}
        <div className="flex justify-between text-sm text-gray-500 mb-4">
          <span>{new Date(receipt.created_at).toLocaleDateString('tr-TR')}</span>
          <span>{new Date(receipt.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        
        {/* Ürünler */}
        <div className="border-t border-dashed border-gray-300 pt-4 space-y-2">
          {(receipt.items || []).map((item, idx) => (
            <div key={idx} className="flex justify-between">
              <span className="text-sm">
                {item.quantity}x {(item.product_name || item.name || '').substring(0, 20)}
              </span>
              <span className="font-medium">
                {formatCurrency((item.price || 0) * (item.quantity || 1))}
              </span>
            </div>
          ))}
        </div>
        
        {/* Toplam */}
        <div className="border-t-2 border-dashed border-gray-400 mt-4 pt-4">
          <div className="flex justify-between text-xl font-bold">
            <span>TOPLAM</span>
            <span>{formatCurrency(receipt.total)}</span>
          </div>
        </div>
        
        {/* Footer */}
        <div className="text-center mt-6 pt-4 border-t border-dashed text-gray-500">
          <p className="text-sm">Siparişiniz hazır olduğunda</p>
          <p className="text-sm">numaranız ekranda görünecektir</p>
          <p className="font-bold text-base mt-3">Afiyet Olsun! 🍔</p>
        </div>
      </div>
      
      {/* Butonlar */}
      <div className="flex gap-4 mt-8">
        <Button 
          onClick={captureAndDownload}
          className="bg-orange-500 hover:bg-orange-600 text-lg px-8 py-6 h-auto"
        >
          <Download className="h-6 w-6 mr-2" />
          Fişi İndir
        </Button>
        <Button 
          variant="outline"
          onClick={() => window.print()}
          className="text-lg px-8 py-6 h-auto"
        >
          <Printer className="h-6 w-6 mr-2" />
          Yazdır
        </Button>
      </div>
    </div>
  );
}
