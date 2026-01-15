import React, { useState, useEffect } from 'react';
import { dashboardAPI, ordersAPI, invoicesAPI, transactionsAPI } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Loader2, BarChart3, TrendingUp, TrendingDown, Package, Users, ShoppingCart, FileText } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, ordersRes, invoicesRes, transactionsRes] = await Promise.all([
        dashboardAPI.getStats(),
        ordersAPI.getAll(),
        invoicesAPI.getAll(),
        transactionsAPI.getAll(),
      ]);
      setStats(statsRes.data);
      setOrders(ordersRes.data);
      setInvoices(invoicesRes.data);
      setTransactions(transactionsRes.data);
    } catch (error) {
      console.error('Reports load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#f97316', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444'];

  // Process data for charts
  const getMonthlyData = () => {
    const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    const currentMonth = new Date().getMonth();
    const data = [];

    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const monthTransactions = transactions.filter(t => {
        const date = new Date(t.created_at);
        return date.getMonth() === monthIndex;
      });

      const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expense = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

      data.push({
        name: months[monthIndex],
        gelir: income,
        gider: expense,
        kar: income - expense,
      });
    }
    return data;
  };

  const getOrderStatusData = () => {
    const statusCounts = {
      pending: 0,
      processing: 0,
      delivered: 0,
      cancelled: 0,
    };

    orders.forEach(order => {
      if (statusCounts[order.status] !== undefined) {
        statusCounts[order.status]++;
      }
    });

    return [
      { name: 'Beklemede', value: statusCounts.pending, color: '#f59e0b' },
      { name: 'İşleniyor', value: statusCounts.processing, color: '#3b82f6' },
      { name: 'Teslim Edildi', value: statusCounts.delivered, color: '#10b981' },
      { name: 'İptal', value: statusCounts.cancelled, color: '#ef4444' },
    ].filter(item => item.value > 0);
  };

  const getExpenseByCategory = () => {
    const categoryTotals = {};

    transactions.filter(t => t.type === 'expense').forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

    return Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value,
    }));
  };

  const monthlyData = getMonthlyData();
  const orderStatusData = getOrderStatusData();
  const expenseData = getExpenseByCategory();

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="reports-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold">Raporlar</h1>
        <p className="text-muted-foreground">Detaylı iş analizleri ve grafikler</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-primary/20 flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Toplam Ürün</p>
                <p className="text-xl font-bold">{stats?.total_products || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-primary/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Aktif Bayi</p>
                <p className="text-xl font-bold">{stats?.total_dealers || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-primary/20 flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Toplam Sipariş</p>
                <p className="text-xl font-bold">{stats?.total_orders || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Net Kar</p>
                <p className={`text-xl font-bold ${stats?.net_profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatCurrency(stats?.net_profit || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="font-heading flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Aylık Gelir/Gider
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} />
                  <YAxis stroke="#a1a1aa" fontSize={12} tickFormatter={(value) => `₺${(value/1000).toFixed(0)}k`} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#18181b', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '0.3rem'
                    }}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Area type="monotone" dataKey="gelir" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="Gelir" />
                  <Area type="monotone" dataKey="gider" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} name="Gider" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Profit Chart */}
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="font-heading flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Aylık Kar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} />
                  <YAxis stroke="#a1a1aa" fontSize={12} tickFormatter={(value) => `₺${(value/1000).toFixed(0)}k`} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#18181b', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '0.3rem'
                    }}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Bar dataKey="kar" fill="#f97316" radius={[4, 4, 0, 0]} name="Net Kar" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status Pie Chart */}
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="font-heading flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Sipariş Durumu Dağılımı
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {orderStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={orderStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {orderStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#18181b', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '0.3rem'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Henüz sipariş verisi yok
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Expense Categories */}
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="font-heading flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-primary" />
              Gider Kategorileri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {expenseData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={expenseData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis type="number" stroke="#a1a1aa" fontSize={12} tickFormatter={(value) => formatCurrency(value)} />
                    <YAxis type="category" dataKey="name" stroke="#a1a1aa" fontSize={11} width={100} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#18181b', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '0.3rem'
                      }}
                      formatter={(value) => formatCurrency(value)}
                    />
                    <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} name="Tutar" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Henüz gider verisi yok
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary */}
      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle className="font-heading flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Finansal Özet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="p-4 rounded-md bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-xs font-mono uppercase tracking-widest text-emerald-400 mb-1">Toplam Gelir</p>
              <p className="text-2xl font-heading font-bold text-emerald-400">
                {formatCurrency(stats?.total_income || 0)}
              </p>
            </div>
            <div className="p-4 rounded-md bg-red-500/10 border border-red-500/20">
              <p className="text-xs font-mono uppercase tracking-widest text-red-400 mb-1">Toplam Gider</p>
              <p className="text-2xl font-heading font-bold text-red-400">
                {formatCurrency(stats?.total_expense || 0)}
              </p>
            </div>
            <div className="p-4 rounded-md bg-amber-500/10 border border-amber-500/20">
              <p className="text-xs font-mono uppercase tracking-widest text-amber-400 mb-1">Tahsilat Bekleyen</p>
              <p className="text-2xl font-heading font-bold text-amber-400">
                {formatCurrency(stats?.unpaid_invoices || 0)}
              </p>
            </div>
            <div className="p-4 rounded-md bg-primary/10 border border-primary/20">
              <p className="text-xs font-mono uppercase tracking-widest text-primary mb-1">Net Kar</p>
              <p className={`text-2xl font-heading font-bold ${(stats?.net_profit || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatCurrency(stats?.net_profit || 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
