// LoyaltyDialog Component - Sadakat Programı
import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { BACKEND_URL, formatPrice } from './constants';
import { toast } from 'sonner';

export const LoyaltyDialog = ({
  open,
  onOpenChange,
  loyaltyMember,
  setLoyaltyMember,
  loyaltyPhone,
  setLoyaltyPhone,
  loyaltyConfig,
  loyaltyRewards,
  onShowRewards,
  addToCart
}) => {
  const [referralInfo, setReferralInfo] = useState(null);
  const [referralInput, setReferralInput] = useState('');
  const [birthdayStatus, setBirthdayStatus] = useState(null);
  const [showBirthdayInput, setShowBirthdayInput] = useState(false);
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');

  const lookupLoyaltyMember = async () => {
    if (loyaltyPhone.length < 10) {
      toast.error('Geçerli bir telefon numarası girin');
      return;
    }
    try {
      const res = await fetch(`${BACKEND_URL}/api/kiosk/loyalty/member/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: loyaltyPhone })
      });
      const data = await res.json();
      if (res.ok) {
        setLoyaltyMember(data);
        if (data.is_new) {
          toast.success('Hoş geldiniz! 50 hoşgeldin puanı kazandınız! 🎉');
        } else {
          toast.success(`Tekrar hoş geldiniz! ${data.member.total_points} puanınız var.`);
        }
        checkBirthdayStatus(loyaltyPhone);
      }
    } catch (error) {
      toast.error('Bağlantı hatası');
    }
  };

  const checkBirthdayStatus = async (phone) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/kiosk/loyalty/member/${phone}/birthday-status`);
      if (res.ok) {
        const data = await res.json();
        setBirthdayStatus(data);
      }
    } catch (error) {
      console.error('Birthday status error:', error);
    }
  };

  const loadReferralCode = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/kiosk/loyalty/member/${loyaltyPhone}/referral-code`);
      if (res.ok) {
        const data = await res.json();
        setReferralInfo(data);
      }
    } catch (error) {
      toast.error('Referans kodu yüklenemedi');
    }
  };

  const applyReferralCode = async () => {
    if (!referralInput.trim()) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/kiosk/loyalty/member/apply-referral`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: loyaltyPhone, referral_code: referralInput })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Referans kodu uygulandı!');
        setReferralInput('');
        // Refresh member data
        const memberRes = await fetch(`${BACKEND_URL}/api/kiosk/loyalty/member/lookup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: loyaltyPhone })
        });
        if (memberRes.ok) {
          setLoyaltyMember(await memberRes.json());
        }
      } else {
        toast.error(data.detail || 'Referans kodu uygulanamadı');
      }
    } catch (error) {
      toast.error('Bağlantı hatası');
    }
  };

  const saveBirthday = async () => {
    if (!birthMonth || !birthDay) {
      toast.error('Lütfen ay ve gün seçin');
      return;
    }
    try {
      const res = await fetch(`${BACKEND_URL}/api/kiosk/loyalty/member/set-birthday`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: loyaltyPhone, birth_date: `${birthMonth}-${birthDay}` })
      });
      if (res.ok) {
        toast.success('Doğum günü kaydedildi! 🎂');
        setShowBirthdayInput(false);
        checkBirthdayStatus(loyaltyPhone);
      }
    } catch (error) {
      toast.error('Kayıt hatası');
    }
  };

  const claimBirthdayBonus = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/kiosk/loyalty/member/claim-birthday-bonus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: loyaltyPhone })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Doğum günü hediyeniz alındı! 🎂🎁');
        // Add free product to cart
        if (data.free_product_id) {
          addToCart({
            id: data.free_product_id,
            name: data.free_product_name,
            price: 0,
            image: '',
            note: '🎂 Doğum Günü Hediyesi'
          }, '🎂 Doğum Günü Hediyesi');
        }
        checkBirthdayStatus(loyaltyPhone);
        // Refresh member data
        const memberRes = await fetch(`${BACKEND_URL}/api/kiosk/loyalty/member/lookup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: loyaltyPhone })
        });
        if (memberRes.ok) {
          setLoyaltyMember(await memberRes.json());
        }
      } else {
        toast.error(data.detail || 'Bonus alınamadı');
      }
    } catch (error) {
      toast.error('Bağlantı hatası');
    }
  };

  const resetMember = () => {
    setLoyaltyMember(null);
    setLoyaltyPhone('');
    setReferralInfo(null);
    setBirthdayStatus(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-3">
            ⭐ Sadakat Programı
          </DialogTitle>
        </DialogHeader>
        
        {!loyaltyMember ? (
          <div className="space-y-4 py-4">
            <p className="text-zinc-400 text-center">
              Telefon numaranızı girerek puan kazanın ve ödüller kazanın!
            </p>
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Telefon Numarası</label>
              <Input
                type="tel"
                placeholder="05XX XXX XX XX"
                value={loyaltyPhone}
                onChange={(e) => setLoyaltyPhone(e.target.value.replace(/\D/g, ''))}
                className="bg-zinc-800 border-zinc-700 text-white text-center text-xl py-6"
                maxLength={11}
              />
            </div>
            <Button 
              onClick={lookupLoyaltyMember} 
              className="w-full py-6 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-lg"
              disabled={loyaltyPhone.length < 10}
            >
              Devam Et
            </Button>
            
            <div className="mt-4 pt-4 border-t border-zinc-800">
              <p className="text-sm text-zinc-400 mb-3">Üyelik Avantajları:</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-zinc-800 rounded-lg p-3 text-center">
                  <span className="text-2xl block mb-1">🎯</span>
                  <p>Her ₺1 = 1 Puan</p>
                </div>
                <div className="bg-zinc-800 rounded-lg p-3 text-center">
                  <span className="text-2xl block mb-1">🎁</span>
                  <p>Ücretsiz Ürünler</p>
                </div>
                <div className="bg-zinc-800 rounded-lg p-3 text-center">
                  <span className="text-2xl block mb-1">💎</span>
                  <p>VIP Seviyeler</p>
                </div>
                <div className="bg-zinc-800 rounded-lg p-3 text-center">
                  <span className="text-2xl block mb-1">🎉</span>
                  <p>Özel İndirimler</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Üye Kartı */}
            <div className={`rounded-2xl p-6 relative overflow-hidden ${
              loyaltyMember.member.tier === 'platinum' ? 'bg-gradient-to-br from-slate-800 to-slate-900' :
              loyaltyMember.member.tier === 'gold' ? 'bg-gradient-to-br from-yellow-600 to-amber-700' :
              loyaltyMember.member.tier === 'silver' ? 'bg-gradient-to-br from-slate-400 to-slate-600' :
              'bg-gradient-to-br from-orange-700 to-amber-900'
            }`}>
              <div className="absolute top-0 right-0 w-32 h-32 opacity-10 text-8xl">
                {loyaltyMember.tier_info?.icon || '🥉'}
              </div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl">{loyaltyMember.tier_info?.icon || '🥉'}</span>
                  <div>
                    <p className="font-bold text-lg">{loyaltyMember.member.name || 'Üye'}</p>
                    <p className="text-white/70 text-sm">{loyaltyMember.tier_info?.name || 'Bronz'} Üye</p>
                  </div>
                </div>
                <div className="text-center py-4">
                  <p className="text-sm text-white/70">Toplam Puan</p>
                  <p className="text-5xl font-black">{loyaltyMember.member.total_points}</p>
                </div>
                {loyaltyMember.next_tier && (
                  <div className="mt-2 bg-black/20 rounded-lg p-2 text-center text-sm">
                    {loyaltyMember.next_tier.icon} {loyaltyMember.next_tier.name} için {loyaltyMember.next_tier.points_needed} puan
                  </div>
                )}
              </div>
            </div>
            
            {/* İstatistikler */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-800 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-orange-500">{loyaltyMember.member.total_orders}</p>
                <p className="text-xs text-zinc-400">Sipariş</p>
              </div>
              <div className="bg-zinc-800 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-500">₺{loyaltyMember.member.total_spent?.toFixed(0) || 0}</p>
                <p className="text-xs text-zinc-400">Harcama</p>
              </div>
            </div>
            
            {/* Aksiyonlar */}
            <div className="space-y-2">
              <Button 
                onClick={() => { onOpenChange(false); onShowRewards(); }}
                className="w-full py-5 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-lg"
              >
                🎁 Ödüllerimi Gör ({loyaltyRewards.filter(r => loyaltyMember.member.total_points >= r.points_required).length} kullanılabilir)
              </Button>
              
              {/* Referans Sistemi */}
              <div className="border-t border-zinc-700 pt-3">
                <p className="text-sm text-zinc-400 mb-2">🤝 Arkadaşını Davet Et</p>
                {!referralInfo ? (
                  <Button variant="outline" className="w-full" onClick={loadReferralCode}>
                    Referans Kodumu Göster
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg p-3">
                      <p className="text-xs text-zinc-400 mb-1">Senin Referans Kodun:</p>
                      <p className="text-2xl font-black text-purple-400 tracking-wider">{referralInfo.referral_code}</p>
                      <p className="text-xs text-zinc-500 mt-1">
                        Arkadaşın bu kodu girerse ikiniz de <span className="text-green-400">{referralInfo.bonus_per_referral} puan</span> kazanırsınız!
                      </p>
                      {referralInfo.referral_count > 0 && (
                        <p className="text-xs text-purple-400 mt-2">
                          ✨ {referralInfo.referral_count} arkadaş davet ettiniz!
                        </p>
                      )}
                    </div>
                    
                    {!loyaltyMember.member.referred_by && (
                      <div className="bg-zinc-800 rounded-lg p-3">
                        <p className="text-xs text-zinc-400 mb-2">Referans kodun var mı?</p>
                        <div className="flex gap-2">
                          <Input
                            value={referralInput}
                            onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
                            placeholder="KBXXXX"
                            className="bg-zinc-700 border-zinc-600 text-white"
                            maxLength={10}
                          />
                          <Button onClick={applyReferralCode} disabled={!referralInput.trim()} className="bg-purple-500 hover:bg-purple-600">
                            Uygula
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Doğum Günü */}
              <div className="border-t border-zinc-700 pt-3">
                <p className="text-sm text-zinc-400 mb-2">🎂 Doğum Günü Hediyesi</p>
                
                {birthdayStatus?.is_birthday_today && birthdayStatus?.can_claim_bonus ? (
                  <div className="bg-gradient-to-r from-pink-500/20 to-yellow-500/20 border border-pink-500/30 rounded-lg p-4 text-center animate-pulse">
                    <span className="text-4xl block mb-2">🎂🎉🎁</span>
                    <p className="font-bold text-lg text-pink-400">Doğum Günün Kutlu Olsun!</p>
                    <p className="text-sm text-zinc-300 mt-1 mb-3">
                      Sana özel <span className="text-yellow-400 font-bold">200 puan</span> + <span className="text-green-400 font-bold">Ücretsiz Burger</span>!
                    </p>
                    <Button onClick={claimBirthdayBonus} className="bg-gradient-to-r from-pink-500 to-yellow-500 hover:from-pink-600 hover:to-yellow-600 text-black font-bold">
                      🎁 Hediyemi Al!
                    </Button>
                  </div>
                ) : birthdayStatus?.already_claimed_this_year ? (
                  <div className="bg-zinc-800 rounded-lg p-3 text-center">
                    <span className="text-2xl">✅</span>
                    <p className="text-sm text-zinc-400 mt-1">Bu yılki doğum günü hediyenizi aldınız!</p>
                  </div>
                ) : birthdayStatus?.has_birthday ? (
                  <div className="bg-zinc-800 rounded-lg p-3 text-center">
                    <p className="text-sm text-zinc-400">
                      Doğum gününüz: <span className="text-pink-400 font-bold">{birthdayStatus.birth_date?.split('-').reverse().join('.')}</span>
                    </p>
                  </div>
                ) : showBirthdayInput ? (
                  <div className="bg-zinc-800 rounded-lg p-3 space-y-2">
                    <p className="text-xs text-zinc-400">Doğum gününü kaydet, her yıl hediye kazan!</p>
                    <div className="flex gap-2">
                      <select value={birthMonth} onChange={(e) => setBirthMonth(e.target.value)} className="flex-1 bg-zinc-700 border-zinc-600 text-white rounded px-2 py-2">
                        <option value="">Ay</option>
                        {['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'].map((m, i) => (
                          <option key={i} value={String(i + 1).padStart(2, '0')}>{m}</option>
                        ))}
                      </select>
                      <select value={birthDay} onChange={(e) => setBirthDay(e.target.value)} className="flex-1 bg-zinc-700 border-zinc-600 text-white rounded px-2 py-2">
                        <option value="">Gün</option>
                        {[...Array(31)].map((_, i) => (
                          <option key={i} value={String(i + 1).padStart(2, '0')}>{i + 1}</option>
                        ))}
                      </select>
                      <Button onClick={saveBirthday} className="bg-pink-500 hover:bg-pink-600">Kaydet</Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="outline" className="w-full border-pink-500/30 text-pink-400 hover:bg-pink-500/10" onClick={() => setShowBirthdayInput(true)}>
                    🎂 Doğum Günümü Kaydet
                  </Button>
                )}
              </div>
              
              <Button variant="outline" className="w-full" onClick={resetMember}>
                Farklı Numara Gir
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LoyaltyDialog;
