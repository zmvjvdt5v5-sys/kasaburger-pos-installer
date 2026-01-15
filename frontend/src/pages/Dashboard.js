import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../lib/api';
import { formatCurrency, getStatusColor, getStatusText } from '../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import PWAInstall from '../components/PWAInstall';
import axios from 'axios';
import {
  Package,
  Users,
  ShoppingCart,
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Factory,
  FileText,
  Bell,
  AlertCircle,
  Clock
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color = 'primary' }) => (
  <Card className="stat-card bg-card border-border/50">
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">
            {title}
          </p>
          <p className="text-2xl font-heading font-bold">{value}</p>
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
              {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-md bg-${color}/10 flex items-center justify-center`}>
          <Icon className={`h-6 w-6 text-${color}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    loadStats();
    loadNotifications();
  }, []);

  const loadStats = async () => {
    try {
      const response = await dashboardAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Dashboard stats error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data);
    } catch (error) {
      console.error('Notifications error:', error);
    }
  };

  const COLORS = ['#f97316', '#10b981', '#3b82f6', '#8b5cf6'];

  const pieData = stats ? [
    { name: 'Gelir', value: stats.total_income || 0 },
    { name: 'Gider', value: stats.total_expense || 0 },
  ] : [];

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="dashboard-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Sipariş portalı genel durumu</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="animate-fade-in stagger-1">
          <StatCard
            title="Toplam Ürün"
            value={stats?.total_products || 0}
            icon={Package}
            color="primary"
          />
        </div>
        <div className="animate-fade-in stagger-2">
          <StatCard
            title="Aktif Bayi"
            value={stats?.total_dealers || 0}
            icon={Users}
            color="primary"
          />
        </div>
        <div className="animate-fade-in stagger-3">
          <StatCard
            title="Bekleyen Sipariş"
            value={stats?.pending_orders || 0}
            icon={ShoppingCart}
            color="primary"
          />
        </div>
        <div className="animate-fade-in stagger-4">
          <StatCard
            title="Toplam Gelir"
            value={formatCurrency(stats?.total_revenue || 0)}
            icon={Wallet}
            trend="up"
            trendValue="+12.5%"
            color="primary"
          />
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="animate-fade-in stagger-1">
          <StatCard
            title="Ödenmemiş Fatura"
            value={formatCurrency(stats?.unpaid_invoices || 0)}
            icon={FileText}
            color="primary"
          />
        </div>
        <div className="animate-fade-in stagger-2">
          <StatCard
            title="Net Kar"
            value={formatCurrency(stats?.net_profit || 0)}
            icon={TrendingUp}
            trend={stats?.net_profit >= 0 ? 'up' : 'down'}
            color="primary"
          />
        </div>
        <div className="animate-fade-in stagger-3">
          <StatCard
            title="Planlanan Üretim"
            value={stats?.planned_production || 0}
            icon={Factory}
            color="primary"
          />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 bg-card border-border/50">
          <CardHeader>
            <CardTitle className="font-heading">Gelir/Gider Özeti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[
                  { name: 'Oca', gelir: 4000, gider: 2400 },
                  { name: 'Şub', gelir: 3000, gider: 1398 },
                  { name: 'Mar', gelir: 2000, gider: 9800 },
                  { name: 'Nis', gelir: 2780, gider: 3908 },
                  { name: 'May', gelir: 1890, gider: 4800 },
                  { name: 'Haz', gelir: 2390, gider: 3800 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} />
                  <YAxis stroke="#a1a1aa" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#18181b', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '0.3rem'
                    }}
                  />
                  <Area type="monotone" dataKey="gelir" stackId="1" stroke="#f97316" fill="#f97316" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="gider" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="font-heading">Gelir Dağılımı</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#18181b', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '0.3rem'
                    }}
                    formatter={(value) => formatCurrency(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#f97316]" />
                <span className="text-sm text-muted-foreground">Gelir</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#10b981]" />
                <span className="text-sm text-muted-foreground">Gider</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notifications */}
        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-heading flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Bildirimler
              {notifications.length > 0 && (
                <Badge className="bg-primary text-white ml-2">{notifications.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notifications.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {notifications.slice(0, 10).map((notif, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 p-3 rounded-md border ${
                      notif.severity === 'error' 
                        ? 'bg-red-500/10 border-red-500/20' 
                        : notif.severity === 'warning'
                        ? 'bg-amber-500/10 border-amber-500/20'
                        : 'bg-blue-500/10 border-blue-500/20'
                    }`}
                  >
                    {notif.severity === 'error' ? (
                      <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                    ) : notif.severity === 'warning' ? (
                      <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                    ) : (
                      <Clock className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{notif.title}</p>
                      <p className="text-xs text-muted-foreground">{notif.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Bildirim yok - Her şey yolunda! ✓
              </p>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-heading flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Düşük Stok Uyarıları
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.low_stock_materials?.length > 0 ? (
              <div className="space-y-3">
                {stats.low_stock_materials.slice(0, 5).map((material) => (
                  <div
                    key={material.id}
                    className="flex items-center justify-between p-3 rounded-md bg-amber-500/10 border border-amber-500/20"
                  >
                    <div>
                      <p className="font-medium">{material.name}</p>
                      <p className="text-xs text-muted-foreground">Kod: {material.code}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-amber-400">
                        {material.stock_quantity} {material.unit}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Min: {material.min_stock} {material.unit}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Düşük stok uyarısı yok
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle className="font-heading">Son Siparişler</CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.recent_orders?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {stats.recent_orders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 rounded-md bg-white/5 border border-white/10 table-row-hover"
                >
                  <div>
                    <p className="font-mono text-sm">{order.order_number}</p>
                    <p className="text-sm text-muted-foreground">{order.dealer_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono">{formatCurrency(order.total)}</p>
                    <Badge className={getStatusColor(order.status)}>
                      {getStatusText(order.status)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Henüz sipariş yok
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
