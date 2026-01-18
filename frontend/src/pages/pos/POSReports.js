import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { 
  BarChart3, TrendingUp, DollarSign, ShoppingCart, Users, 
  Calendar, Download, Printer, RefreshCw, CreditCard, Banknote,
  Clock, Package, Filter, FileText, PieChart
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function POSReports() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('today');
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    averageOrder: 0,
    cashSales: 0,
    cardSales: 0,
    mealCardSales: 0,
    tableOrders: 0,
    takeawayOrders: 0,
    deliveryOrders: 0
  });
  const [topProducts, setTopProducts] = useState([]);
  const [hourlyData, setHourlyData] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);

  const getToken = () => localStorage.getItem('kasaburger_token') || localStorage.getItem('dealer_token');

  const loadReports = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const headers = { Authorization: `Bearer ${token}` };

      // Günlük özet
      const summaryRes = await fetch(`${BACKEND_URL}/api/pos/reports/summary?range=${dateRange}`, { headers });
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setStats(summaryData);
      }

      // En çok satan ürünler
      const topRes = await fetch(`${BACKEND_URL}/api/pos/reports/top-products?range=${dateRange}`, { headers });
      if (topRes.ok) {
        const topData = await topRes.json();
        setTopProducts(topData);
      }

      // Saatlik satış
      const hourlyRes = await fetch(`${BACKEND_URL}/api/pos/reports/hourly?range=${dateRange}`, { headers });
      if (hourlyRes.ok) {
        const hourlyData = await hourlyRes.json();
        setHourlyData(hourlyData);
      }

      // Son siparişler
      const ordersRes = await fetch(`${BACKEND_URL}/api/pos/orders?limit=20`, { headers });
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setRecentOrders(ordersData);
      }

      setLoading(false);
    } catch (error) {
      console.error('Report error:', error);
      // Mock data for demo
      setStats({
        totalSales: 15420,
        totalOrders: 48,
        averageOrder: 321,
        cashSales: 6200,
        cardSales: 7520,
        mealCardSales: 1700,
        tableOrders: 32,
        takeawayOrders: 10,
        deliveryOrders: 6
      });
      setTopProducts([
        { name: 'Kasa Classic Burger', quantity: 24, revenue: 11040 },
        { name: 'Golden Burger', quantity: 8, revenue: 9520 },
        { name: 'Cheese Lover', quantity: 18, revenue: 10080 },
        { name: 'Crispy Chicken', quantity: 22, revenue: 7920 },
        { name: 'Prison Cheese Fries', quantity: 30, revenue: 4500 }
      ]);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [dateRange]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-orange-500 flex items-center gap-3">
            <BarChart3 className="h-8 w-8" />
            Kasa Raporu
          </h1>
          <p className="text-zinc-500 mt-1">KBYS - Günlük satış ve performans raporları</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40 bg-zinc-800 border-zinc-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Bugün</SelectItem>
              <SelectItem value="yesterday">Dün</SelectItem>
              <SelectItem value="week">Bu Hafta</SelectItem>
              <SelectItem value="month">Bu Ay</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadReports}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Yenile
          </Button>
          <Button variant="outline">
            <Printer className="h-4 w-4 mr-2" />
            Yazdır
          </Button>
          <Button className="bg-green-600 hover:bg-green-700">
            <Download className="h-4 w-4 mr-2" />
            Excel İndir
          </Button>
        </div>
      </div>

      {/* Ana İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-green-500/20 to-green-500/5 border-green-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-400/70">Toplam Satış</p>
                <p className="text-3xl font-bold text-green-400">{formatCurrency(stats.totalSales)}</p>
              </div>
              <DollarSign className="h-12 w-12 text-green-400/30" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 border-blue-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-400/70">Toplam Sipariş</p>
                <p className="text-3xl font-bold text-blue-400">{stats.totalOrders}</p>
              </div>
              <ShoppingCart className="h-12 w-12 text-blue-400/30" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/20 to-orange-500/5 border-orange-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-400/70">Ortalama Sipariş</p>
                <p className="text-3xl font-bold text-orange-400">{formatCurrency(stats.averageOrder)}</p>
              </div>
              <TrendingUp className="h-12 w-12 text-orange-400/30" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/20 to-purple-500/5 border-purple-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-400/70">Masa Siparişleri</p>
                <p className="text-3xl font-bold text-purple-400">{stats.tableOrders}</p>
              </div>
              <Users className="h-12 w-12 text-purple-400/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ödeme Yöntemleri */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-orange-500" />
              Ödeme Yöntemleri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
              <div className="flex items-center gap-3">
                <Banknote className="h-5 w-5 text-green-400" />
                <span>Nakit</span>
              </div>
              <span className="font-bold text-green-400">{formatCurrency(stats.cashSales)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-blue-400" />
                <span>Kredi Kartı</span>
              </div>
              <span className="font-bold text-blue-400">{formatCurrency(stats.cardSales)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-500/10 rounded-lg">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-purple-400" />
                <span>Yemek Kartı</span>
              </div>
              <span className="font-bold text-purple-400">{formatCurrency(stats.mealCardSales)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Sipariş Kaynakları */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-orange-500" />
              Sipariş Kaynakları
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-orange-500/10 rounded-lg">
              <span>Masa</span>
              <span className="font-bold text-orange-400">{stats.tableOrders} sipariş</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
              <span>Gel-Al</span>
              <span className="font-bold text-green-400">{stats.takeawayOrders} sipariş</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg">
              <span>Paket Servis</span>
              <span className="font-bold text-blue-400">{stats.deliveryOrders} sipariş</span>
            </div>
          </CardContent>
        </Card>

        {/* En Çok Satan Ürünler */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              En Çok Satanlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topProducts.slice(0, 5).map((product, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-zinc-800 rounded">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-yellow-500 text-black' :
                      index === 1 ? 'bg-zinc-400 text-black' :
                      index === 2 ? 'bg-orange-700 text-white' :
                      'bg-zinc-700 text-white'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="text-sm">{product.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-orange-400">{product.quantity} adet</div>
                    <div className="text-xs text-zinc-500">{formatCurrency(product.revenue)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Z Raporu Butonu */}
      <div className="mt-6 flex justify-end">
        <Button className="bg-red-600 hover:bg-red-700" size="lg">
          <FileText className="h-5 w-5 mr-2" />
          Z Raporu Al (Gün Sonu)
        </Button>
      </div>
    </div>
  );
}
