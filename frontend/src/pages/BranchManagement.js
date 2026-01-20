import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { 
  Building2, MapPin, Phone, Globe, Plus, RefreshCw, 
  TrendingUp, ShoppingCart, DollarSign, Activity,
  CheckCircle, XCircle, Clock, BarChart3, Trash2
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

export default function BranchManagement() {
  const [branches, setBranches] = useState([]);
  const [centralStats, setCentralStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newBranch, setNewBranch] = useState({
    name: '',
    address: '',
    phone: '',
    api_url: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('kasaburger_token');
      
      // Şubeleri yükle
      const branchesRes = await fetch(`${BACKEND_URL}/api/branches`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (branchesRes.ok) {
        const data = await branchesRes.json();
        setBranches(data);
      }

      // Merkezi dashboard verilerini yükle
      const dashboardRes = await fetch(`${BACKEND_URL}/api/central/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (dashboardRes.ok) {
        const data = await dashboardRes.json();
        setCentralStats(data);
      }
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const addBranch = async () => {
    if (!newBranch.name) {
      toast.error('Şube adı gerekli');
      return;
    }

    try {
      const token = localStorage.getItem('kasaburger_token');
      const response = await fetch(`${BACKEND_URL}/api/branches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newBranch)
      });

      if (response.ok) {
        const branch = await response.json();
        setBranches([...branches, branch]);
        setShowAddDialog(false);
        setNewBranch({ name: '', address: '', phone: '', api_url: '' });
        toast.success('Şube eklendi');
      } else {
        toast.error('Şube eklenemedi');
      }
    } catch (error) {
      toast.error('Hata oluştu');
    }
  };

  const deleteBranch = async (branchId) => {
    if (!window.confirm('Bu şubeyi silmek istediğinize emin misiniz?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('kasaburger_token');
      const response = await fetch(`${BACKEND_URL}/api/branches/${branchId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        toast.success('Şube silindi');
        setBranches(branches.filter(b => (b.id || b.branch_id) !== branchId));
        loadData();
      } else {
        toast.error('Şube silinemedi');
      }
    } catch (error) {
      toast.error('Hata oluştu');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount || 0);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-orange-500">Merkezi Yönetim</h1>
          <p className="text-zinc-400 mt-1">Tüm şubeleri tek panelden yönetin</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Yenile
          </Button>
          <Button onClick={() => setShowAddDialog(true)} className="bg-orange-500 hover:bg-orange-600">
            <Plus className="h-4 w-4 mr-2" />
            Yeni Şube
          </Button>
        </div>
      </div>

      {/* Özet Kartları */}
      {centralStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm">Toplam Şube</p>
                  <p className="text-3xl font-bold text-white mt-1">{centralStats.total_branches}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-blue-400" />
                </div>
              </div>
              <p className="text-green-400 text-sm mt-3">
                <CheckCircle className="h-4 w-4 inline mr-1" />
                {centralStats.online_branches} çevrimiçi
              </p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm">Bugünkü Siparişler</p>
                  <p className="text-3xl font-bold text-white mt-1">{centralStats.total_today_orders}</p>
                </div>
                <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                  <ShoppingCart className="h-6 w-6 text-orange-400" />
                </div>
              </div>
              <p className="text-zinc-400 text-sm mt-3">Tüm şubelerden</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm">Bugünkü Gelir</p>
                  <p className="text-3xl font-bold text-green-400 mt-1">
                    {formatCurrency(centralStats.total_today_revenue)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-400" />
                </div>
              </div>
              <p className="text-zinc-400 text-sm mt-3">Toplam ciro</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm">Ortalama / Şube</p>
                  <p className="text-3xl font-bold text-purple-400 mt-1">
                    {formatCurrency(centralStats.total_today_revenue / (centralStats.total_branches || 1))}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-purple-400" />
                </div>
              </div>
              <p className="text-zinc-400 text-sm mt-3">Günlük ortalama</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Şube Listesi */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-xl text-white flex items-center gap-2">
            <Building2 className="h-5 w-5 text-orange-500" />
            Şubeler
          </CardTitle>
        </CardHeader>
        <CardContent>
          {branches.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-16 w-16 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-400 text-lg">Henüz şube eklenmemiş</p>
              <p className="text-zinc-500 text-sm mt-1">Yeni şube ekleyerek başlayın</p>
              <Button 
                onClick={() => setShowAddDialog(true)} 
                className="mt-4 bg-orange-500 hover:bg-orange-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                İlk Şubeyi Ekle
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(centralStats?.branches || branches).map((branch) => (
                <div 
                  key={branch.id || branch.branch_id} 
                  className="bg-zinc-800/50 rounded-xl p-5 border border-zinc-700/50 hover:border-orange-500/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-white">{branch.name || branch.branch_name}</h3>
                      {branch.address && (
                        <p className="text-zinc-400 text-sm flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" /> {branch.address}
                        </p>
                      )}
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                      branch.is_online 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-zinc-700 text-zinc-400'
                    }`}>
                      {branch.is_online ? (
                        <><CheckCircle className="h-3 w-3" /> Çevrimiçi</>
                      ) : (
                        <><XCircle className="h-3 w-3" /> Çevrimdışı</>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-zinc-900/50 rounded-lg p-3">
                      <p className="text-zinc-500 text-xs">Bugün Sipariş</p>
                      <p className="text-xl font-bold text-white">{branch.today_orders || 0}</p>
                    </div>
                    <div className="bg-zinc-900/50 rounded-lg p-3">
                      <p className="text-zinc-500 text-xs">Bugün Gelir</p>
                      <p className="text-xl font-bold text-green-400">
                        {formatCurrency(branch.today_revenue || 0)}
                      </p>
                    </div>
                  </div>

                  {branch.last_sync && (
                    <p className="text-zinc-500 text-xs flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Son güncelleme: {new Date(branch.last_sync).toLocaleString('tr-TR')}
                    </p>
                  )}

                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1">
                      <BarChart3 className="h-4 w-4 mr-1" /> Raporlar
                    </Button>
                    {branch.api_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={branch.api_url} target="_blank" rel="noopener noreferrer">
                          <Globe className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-400 hover:text-red-300 hover:border-red-500"
                      onClick={() => deleteBranch(branch.id || branch.branch_id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Yeni Şube Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Building2 className="h-5 w-5 text-orange-500" />
              Yeni Şube Ekle
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm text-zinc-400 mb-2 block">Şube Adı *</label>
              <Input
                value={newBranch.name}
                onChange={(e) => setNewBranch({...newBranch, name: e.target.value})}
                placeholder="Örn: Ankara Kızılay"
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            <div>
              <label className="text-sm text-zinc-400 mb-2 block">Adres</label>
              <Input
                value={newBranch.address}
                onChange={(e) => setNewBranch({...newBranch, address: e.target.value})}
                placeholder="Şube adresi"
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            <div>
              <label className="text-sm text-zinc-400 mb-2 block">Telefon</label>
              <Input
                value={newBranch.phone}
                onChange={(e) => setNewBranch({...newBranch, phone: e.target.value})}
                placeholder="0312 XXX XX XX"
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            <div>
              <label className="text-sm text-zinc-400 mb-2 block">API URL (Şube sunucu adresi)</label>
              <Input
                value={newBranch.api_url}
                onChange={(e) => setNewBranch({...newBranch, api_url: e.target.value})}
                placeholder="https://sube1.kasaburger.net.tr"
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowAddDialog(false)}>
                İptal
              </Button>
              <Button className="flex-1 bg-orange-500 hover:bg-orange-600" onClick={addBranch}>
                Şube Ekle
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
