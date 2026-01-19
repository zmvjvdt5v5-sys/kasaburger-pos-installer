// CartPanel Component - Sepet
import React from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Plus, Minus, Trash2, ShoppingCart, ArrowLeft } from 'lucide-react';
import { formatPrice } from './constants';

export const CartDialog = ({ 
  open, 
  onOpenChange, 
  cart, 
  updateQuantity, 
  removeFromCart, 
  cartTotal,
  onCheckout 
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-3">
            <ShoppingCart className="h-6 w-6 text-orange-500" />
            Sepetim
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-3 py-4">
          {cart.length === 0 ? (
            <div className="text-center py-10 text-zinc-400">
              <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Sepetiniz boş</p>
            </div>
          ) : (
            cart.map((item, index) => (
              <div 
                key={`${item.id}-${index}`} 
                className="bg-zinc-800 rounded-xl p-4 flex gap-4"
              >
                {item.image && (
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-20 h-20 object-cover rounded-lg flex-shrink-0" 
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold truncate">{item.name}</h3>
                  {item.note && (
                    <p className="text-xs text-orange-400 mt-1 truncate">📝 {item.note}</p>
                  )}
                  <p className="text-orange-500 font-bold mt-1">{formatPrice(item.price)}</p>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 w-8 p-0"
                        onClick={() => updateQuantity(item.id, item.note, -1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-bold">{item.quantity}</span>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 w-8 p-0"
                        onClick={() => updateQuantity(item.id, item.note, 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                      onClick={() => removeFromCart(item.id, item.note)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {cart.length > 0 && (
          <div className="border-t border-zinc-800 pt-4 space-y-3">
            <div className="flex justify-between items-center text-xl">
              <span>Toplam</span>
              <span className="font-black text-orange-500">{formatPrice(cartTotal)}</span>
            </div>
            <Button 
              className="w-full py-6 text-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
              onClick={onCheckout}
            >
              Siparişi Tamamla
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => onOpenChange(false)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Alışverişe Devam Et
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CartDialog;
