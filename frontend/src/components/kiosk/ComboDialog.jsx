// ComboDialog Component - Menü Combolar
import React from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

export const ComboDialog = ({ open, onOpenChange, combos, onAddCombo }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl flex items-center gap-3">
            🎁 Fırsat Menüler
            <span className="text-base font-normal bg-green-500/20 text-green-400 px-3 py-1 rounded-full">
              Kombo Avantajı
            </span>
          </DialogTitle>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-6 py-4">
          {combos.map((combo) => (
            <div 
              key={combo.id} 
              className="bg-zinc-800 rounded-2xl overflow-hidden hover:ring-2 hover:ring-orange-500 transition-all"
            >
              <div className="relative h-48 group">
                <img 
                  src={combo.image || 'https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719627/kasaburger/products/lxmwj2opjfgpn5wfyvni.jpg'} 
                  alt={combo.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute top-3 right-3 bg-green-500 text-white font-bold px-3 py-1 rounded-full text-sm">
                  %{combo.discount_percent} İNDİRİM
                </div>
                {combo.start_hour && combo.end_hour && (
                  <div className="absolute top-3 left-3 bg-purple-500 text-white font-bold px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    🕐 {combo.start_hour}:00-{combo.end_hour}:00
                  </div>
                )}
                {combo.gift_product_id && (
                  <div className="absolute top-3 left-3 bg-pink-500 text-white font-bold px-3 py-1 rounded-full text-sm animate-pulse">
                    {combo.gift_message || '🎁 Hediye!'}
                  </div>
                )}
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="font-bold text-xl text-white">{combo.name}</h3>
                  <p className="text-zinc-300 text-sm">{combo.description}</p>
                </div>
              </div>
              <div className="p-4">
                {combo.gift_product_id && (
                  <div className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 rounded-lg p-2 mb-3 flex items-center gap-2">
                    <span className="text-2xl">🎁</span>
                    <div>
                      <p className="text-pink-400 font-bold text-sm">{combo.gift_message || 'Hediye Ürün!'}</p>
                      <p className="text-zinc-400 text-xs">{combo.gift_product_name}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-zinc-500 line-through text-lg">₺{combo.original_price}</span>
                    <span className="text-green-400 font-black text-2xl ml-2">₺{combo.combo_price}</span>
                  </div>
                  <span className="text-orange-400 font-bold">
                    ₺{combo.original_price - combo.combo_price} Kazanç
                  </span>
                </div>
                <Button 
                  onClick={() => onAddCombo(combo)}
                  className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-lg font-bold rounded-xl"
                >
                  {combo.gift_product_id ? 'Sepete Ekle + Hediye 🎁' : 'Sepete Ekle 🛒'}
                </Button>
              </div>
            </div>
          ))}
        </div>
        {combos.length === 0 && (
          <div className="text-center py-10 text-zinc-400">
            <span className="text-4xl block mb-3">🎁</span>
            Şu anda aktif menü fırsatı bulunmuyor
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ComboDialog;
