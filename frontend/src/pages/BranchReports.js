import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  BarChart3, TrendingUp, Calendar, Download, RefreshCw,
  ShoppingCart, DollarSign, Clock, Package, UtensilsCrossed,
  ArrowUp, ArrowDown
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

export default function BranchReports() {
  const [branchInfo, setBranchInfo] = useState(null);
  const [stats, setStats] = useState(null);
  const [dailyReport, setDailyReport] = useState(null);
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('kasaburger_token');
      const headers = { Authorization: `Bearer ${token}` };

      // Şube bilgisi
      const infoRes = await fetch(`${BACKEND_URL}/api/branch/info`);
      if (infoRes.ok) setBranchInfo(await infoRes.json());

      // İstatistikler
      const statsRes = await fetch(`${BACKEND_URL}/api/branch/stats`, { headers });
      if (statsRes.ok) setStats(await statsRes.json());

      // Günlük rapor
      const dailyRes = await fetch(`${BACKEND_URL}/api/branch/reports/daily?date=${selectedDate}`, { headers });
      if (dailyRes.ok) setDailyReport(await dailyRes.json());

      // Haftalık rapor
      const weeklyRes = await fetch(`${BACKEND_URL}/api/branch/reports/weekly`, { headers });
      if (weeklyRes.ok) setWeeklyReport(await weeklyRes.json());

    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      toast.error('Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount || 0);
  };

  const exportReport = () => {
    if (!dailyReport) return;
    
    const csvContent = [
      ['KasaBurger Günlük Rapor'],
      [`Şube: ${branchInfo?.branch_name || 'Bilinmiyor'}`],
      [`Tarih: ${dailyReport.date}`],
      [''],
      ['ÖZET'],
      ['Toplam Sipariş', dailyReport.summary.total_orders],
      ['Toplam Gelir', dailyReport.summary.total_revenue],
      ['Ortalama Sipariş', dailyReport.summary.avg_order_value.toFixed(2)],
      ['İptal Edilen', dailyReport.summary.cancelled_orders],
      [''],
      ['SERVİS TİPİ'],
      ['Paket', dailyReport.service_type_breakdown.paket],
      ['Masa', dailyReport.service_type_breakdown.masa],
      [''],
      ['EN ÇOK SATAN ÜRÜNLER'],
      ['Ürün', 'Adet', 'Gelir'],
      ...dailyReport.top_products.map(p => [p.name, p.quantity, p.revenue])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `rapor_${dailyReport.date}.csv`;
    link.click();
    toast.success('Rapor indirildi');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-orange-500">Şube Raporları</h1>
          <p className="text-zinc-400 mt-1">
            {branchInfo?.branch_name || 'Yükleniyor...'} • {branchInfo?.branch_id}
          </p>
        </div>
        <div className="flex gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
          />
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Yenile
          </Button>
          <Button onClick={exportReport} className="bg-green-600 hover:bg-green-700">
            <Download className="h-4 w-4 mr-2" />
            Rapor İndir
          </Button>
        </div>
      </div>

      {/* Özet Kartları */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 border-orange-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-300 text-sm">Bugün Sipariş</p>
                  <p className="text-4xl font-bold text-white mt-1">{stats.today.orders}</p>
                </div>
                <ShoppingCart className="h-10 w-10 text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/20 to-green-600/10 border-green-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-300 text-sm">Bugün Gelir</p>
                  <p className="text-3xl font-bold text-white mt-1">{formatCurrency(stats.today.revenue)}</p>
                </div>
                <DollarSign className="h-10 w-10 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-300 text-sm">Toplam Sipariş</p>
                  <p className="text-4xl font-bold text-white mt-1">{stats.total.orders}</p>
                </div>
                <BarChart3 className="h-10 w-10 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-purple-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-300 text-sm">Toplam Gelir</p>
                  <p className="text-3xl font-bold text-white mt-1">{formatCurrency(stats.total.revenue)}</p>
                </div>
                <TrendingUp className="h-10 w-10 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Haftalık Trend */}
        {weeklyReport && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-orange-500" />
                Son 7 Gün
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {weeklyReport.daily_stats.map((day, index) => {
                  const maxRevenue = Math.max(...weeklyReport.daily_stats.map(d => d.revenue));
                  const percentage = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
                  
                  return (
                    <div key={index} className="flex items-center gap-3">
                      <span className="w-10 text-zinc-400 text-sm">{day.day_name}</span>
                      <div className="flex-1 bg-zinc-800 rounded-full h-8 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                          style={{ width: `${Math.max(percentage, 10)}%` }}
                        >
                          <span className="text-xs font-bold text-white">{formatCurrency(day.revenue)}</span>
                        </div>
                      </div>
                      <span className="w-12 text-right text-zinc-400 text-sm">{day.orders} adet</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-between">
                <span className="text-zinc-400">Haftalık Toplam:</span>
                <span className="font-bold text-green-400">{formatCurrency(weeklyReport.totals.revenue)}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Servis Tipi Dağılımı */}
        {dailyReport && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                Servis Tipi Dağılımı
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-500/20 rounded-xl p-6 text-center">
                  <Package className="h-10 w-10 text-blue-400 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-white">{dailyReport.service_type_breakdown.paket}</p>
                  <p className="text-blue-300 text-sm">Paket Servis</p>
                </div>
                <div className="bg-green-500/20 rounded-xl p-6 text-center">
                  <UtensilsCrossed className="h-10 w-10 text-green-400 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-white">{dailyReport.service_type_breakdown.masa}</p>
                  <p className="text-green-300 text-sm">Masa Servisi</p>
                </div>
              </div>

              {/* Günlük Özet */}
              <div className="bg-zinc-800/50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Toplam Sipariş</span>
                  <span className="font-bold text-white">{dailyReport.summary.total_orders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Ortalama Sipariş</span>
                  <span className="font-bold text-white">{formatCurrency(dailyReport.summary.avg_order_value)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">İptal Edilen</span>
                  <span className="font-bold text-red-400">{dailyReport.summary.cancelled_orders}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* En Çok Satanlar */}
      {dailyReport && dailyReport.top_products.length > 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              En Çok Satan Ürünler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {dailyReport.top_products.slice(0, 10).map((product, index) => (
                <div 
                  key={index} 
                  className={`rounded-xl p-4 ${
                    index === 0 ? 'bg-gradient-to-br from-yellow-500/30 to-orange-500/20 border border-yellow-500/30' :
                    index === 1 ? 'bg-gradient-to-br from-zinc-400/20 to-zinc-500/10 border border-zinc-500/30' :
                    index === 2 ? 'bg-gradient-to-br from-amber-700/20 to-amber-800/10 border border-amber-700/30' :
                    'bg-zinc-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-yellow-500 text-black' :
                      index === 1 ? 'bg-zinc-400 text-black' :
                      index === 2 ? 'bg-amber-700 text-white' :
                      'bg-zinc-700 text-zinc-300'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium text-white truncate flex-1">{product.name}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-2xl font-bold text-white">{product.quantity}</p>
                      <p className="text-xs text-zinc-400">adet</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-400">{formatCurrency(product.revenue)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saatlik Dağılım */}
      {dailyReport && dailyReport.hourly_breakdown.length > 0 && (
        <Card className="bg-zinc-900 border-zinc-800 mt-6">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Saatlik Sipariş Dağılımı
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-40">
              {Array.from({ length: 24 }, (_, hour) => {
                const hourData = dailyReport.hourly_breakdown.find(h => h.hour === hour);
                const maxOrders = Math.max(...dailyReport.hourly_breakdown.map(h => h.orders), 1);
                const height = hourData ? (hourData.orders / maxOrders) * 100 : 0;
                
                return (
                  <div key={hour} className="flex-1 flex flex-col items-center">
                    <div 
                      className={`w-full rounded-t transition-all ${
                        hourData && hourData.orders > 0 ? 'bg-orange-500' : 'bg-zinc-800'
                      }`}
                      style={{ height: `${Math.max(height, 5)}%` }}
                      title={hourData ? `${hour}:00 - ${hourData.orders} sipariş` : `${hour}:00`}
                    />
                    <span className="text-[10px] text-zinc-500 mt-1">{hour}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
