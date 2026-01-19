// RewardsDialog Component - Ödüller
import React from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { ArrowLeft } from 'lucide-react';
import { BACKEND_URL, formatPrice } from './constants';
import { toast } from 'sonner';

export const RewardsDialog = ({ 
  open, 
  onOpenChange, 
  loyaltyMember, 
  setLoyaltyMember, 
  loyaltyRewards, 
  loyaltyPhone,
  addToCart,
  onBack 
}) => {
  const redeemReward = async (reward) => {
    if (!loyaltyMember || loyaltyMember.member.total_points < reward.points_required) {
      toast.error('Yetersiz puan!');
      return;
    }
    try {
      const res = await fetch(`${BACKEND_URL}/api/kiosk/loyalty/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: loyaltyPhone, reward_id: reward.id })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`${reward.name} ödülünüz sepete eklendi! 🎁`);
        // Add free product to cart
        if (reward.reward_type === 'free_product') {
          addToCart({
            id: `reward-${reward.id}`,
            name: `🎁 ${reward.name}`,
            price: 0,
            image: reward.image,
            note: `Ödül: ${reward.points_required} puan`
          }, `Ödül: ${reward.points_required} puan`);
        }
        // Refresh member data
        const memberRes = await fetch(`${BACKEND_URL}/api/kiosk/loyalty/member/lookup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: loyaltyPhone })
        });
        if (memberRes.ok) {
          setLoyaltyMember(await memberRes.json());
        }
        onOpenChange(false);
      } else {
        toast.error(data.detail || 'Ödül alınamadı');
      }
    } catch (error) {
      toast.error('Bağlantı hatası');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center justify-between">
            <span>🎁 Ödüllerim</span>
            {loyaltyMember && (
              <span className="text-lg font-normal bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded-full">
                {loyaltyMember.member.total_points} Puan
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-4">
          {loyaltyRewards.map((reward) => {
            const canRedeem = loyaltyMember && loyaltyMember.member.total_points >= reward.points_required;
            const pointsNeeded = reward.points_required - (loyaltyMember?.member.total_points || 0);
            
            return (
              <div 
                key={reward.id}
                className={`rounded-xl p-4 flex gap-4 ${
                  canRedeem ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-zinc-800/50 opacity-60'
                } transition-all`}
              >
                {reward.image && (
                  <img src={reward.image} alt={reward.name} className="w-20 h-20 object-cover rounded-lg flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{reward.name}</h3>
                  <p className="text-zinc-400 text-sm">{reward.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`font-bold ${canRedeem ? 'text-yellow-500' : 'text-zinc-500'}`}>
                      {reward.points_required} Puan
                    </span>
                    {canRedeem ? (
                      <Button 
                        size="sm" 
                        onClick={() => redeemReward(reward)}
                        className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700"
                      >
                        Kullan
                      </Button>
                    ) : (
                      <span className="text-xs text-zinc-500">
                        {pointsNeeded > 0 ? `${pointsNeeded} puan gerekli` : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          {loyaltyRewards.length === 0 && (
            <div className="text-center py-10 text-zinc-400">
              <span className="text-4xl block mb-3">🎁</span>
              Henüz ödül bulunmuyor
            </div>
          )}
          
          <Button variant="outline" className="w-full mt-4" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Geri
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RewardsDialog;
