import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import {
  LayoutDashboard,
  Package,
  Boxes,
  FlaskConical,
  Factory,
  Users,
  ShoppingCart,
  FileText,
  CreditCard,
  Wallet,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChefHat,
  Megaphone,
  Monitor,
  Bell,
  Building2,
  TrendingUp,
  UtensilsCrossed,
  Printer,
  Plug
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/pos', label: 'Adisyon', icon: UtensilsCrossed },
  { path: '/mutfak', label: 'Mutfak Ekranı', icon: ChefHat },
  { path: '/salon-ekran', label: 'Salon Ekranı', icon: Monitor },
  { path: '/products', label: 'Ürünler', icon: Package },
  { path: '/materials', label: 'Hammaddeler', icon: Boxes },
  { path: '/recipes', label: 'Reçeteler', icon: FlaskConical, adminOnly: true },
  { path: '/production', label: 'Üretim', icon: Factory },
  { path: '/dealers', label: 'Bayiler', icon: Users, adminOnly: true },
  { path: '/orders', label: 'Siparişler', icon: ShoppingCart },
  { path: '/invoices', label: 'Faturalar', icon: FileText },
  { path: '/einvoice', label: 'E-Fatura/GİB', icon: FileText },
  { path: '/payments', label: 'Ödemeler', icon: CreditCard },
  { path: '/accounting', label: 'Muhasebe', icon: Wallet, adminOnly: true },
  { path: '/campaigns', label: 'Kampanyalar', icon: Megaphone },
  { path: '/kiosk-admin', label: 'Kiosk Ürünleri', icon: Monitor, adminOnly: true },
  { path: '/kiosk-orders', label: 'Kiosk Siparişleri', icon: Bell },
  { path: '/delivery-orders', label: 'Paket Servis', icon: Package },
  { path: '/delivery-panel', label: 'Canlı Siparişler', icon: Bell },
  { path: '/delivery-settings', label: 'Platform Entegrasyonları', icon: Plug, adminOnly: true },
  { path: '/branches', label: 'Şube Yönetimi', icon: Building2, adminOnly: true },
  { path: '/branch-reports', label: 'Şube Raporları', icon: TrendingUp, adminOnly: true },
  { path: '/reports', label: 'Raporlar', icon: BarChart3 },
  { path: '/settings', label: 'Ayarlar', icon: Settings },
];

// Bayilerin görebileceği modüller
const dealerNavItems = [
  { path: '/dealer-portal', label: 'Ana Sayfa', icon: LayoutDashboard },
  { path: '/dealer-portal/pos', label: 'Adisyon', icon: UtensilsCrossed },
  { path: '/dealer-portal/mutfak', label: 'Mutfak Ekranı', icon: ChefHat },
  { path: '/dealer-portal/pos-reports', label: 'Kasa Raporu', icon: BarChart3 },
  { path: '/dealer-portal/inpos-settings', label: 'InPOS / Yazar Kasa', icon: Printer },
  { path: '/dealer-portal/orders', label: 'Siparişlerim', icon: ShoppingCart },
  { path: '/dealer-portal/products', label: 'Ürün Kataloğu', icon: Package },
  { path: '/dealer-portal/invoices', label: 'Faturalarım', icon: FileText },
  { path: '/dealer-portal/payments', label: 'Ödemelerim', icon: CreditCard },
  { path: '/dealer-portal/campaigns', label: 'Kampanyalar', icon: Megaphone },
  { path: '/dealer-portal/kiosk-orders', label: 'Kiosk Siparişleri', icon: Monitor },
  { path: '/dealer-portal/delivery', label: 'Paket Servis', icon: Package },
  { path: '/dealer-portal/delivery-panel', label: 'Canlı Siparişler', icon: Bell },
  { path: '/dealer-portal/reports', label: 'Raporlarım', icon: BarChart3 },
  { path: '/dealer-portal/settings', label: 'Hesap Ayarları', icon: Settings },
];

const SUPER_ADMIN_EMAIL = 'admin@kasaburger.net.tr';

export const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Kullanıcı rolüne göre navigasyon menüsünü belirle
  const isDealer = user?.role === 'dealer';
  const isAdmin = user?.role === 'admin' || user?.email === SUPER_ADMIN_EMAIL;
  
  // Bayi ise dealer menüsünü, değilse admin menüsünü göster
  const currentNavItems = isDealer ? dealerNavItems : navItems;

  const handleLogout = () => {
    logout();
    navigate(isDealer ? '/dealer-login' : '/login');
  };

  return (
    <div className="min-h-screen bg-background grid-texture">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 glass border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              data-testid="mobile-menu-toggle"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div className="flex items-center gap-2">
              <img 
                src="https://customer-assets.emergentagent.com/job_kasaburger-pos/artifacts/oruytxht_b3459348-380a-4e05-8eb6-989bd31e2066.jpeg" 
                alt="KBYS"
                className="h-8 w-8 object-contain"
              />
              <span className="font-heading font-bold text-lg">KBYS</span>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-64 glass border-r border-white/10 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 flex-shrink-0">
                <img 
                  src="https://customer-assets.emergentagent.com/job_kasaburger-pos/artifacts/oruytxht_b3459348-380a-4e05-8eb6-989bd31e2066.jpeg" 
                  alt="KasaBurger Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="font-heading font-bold text-xl">KasaBurger</h1>
                <p className="text-xs text-muted-foreground">KBYS</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 py-4">
            <nav className="px-3 space-y-1">
              {currentNavItems
                .filter(item => !item.adminOnly || isAdmin)
                .map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    data-testid={`nav-${item.path.replace(/\//g, '-').slice(1)}`}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 ${
                      isActive
                        ? 'nav-link-active'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>

          {/* User Section */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isDealer ? 'bg-blue-500/20' : 'bg-primary/20'}`}>
                <span className={`text-sm font-bold ${isDealer ? 'text-blue-400' : 'text-primary'}`}>
                  {user?.name?.charAt(0).toUpperCase() || user?.dealer_name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name || user?.dealer_name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {isDealer ? `Bayi: ${user?.dealer_code || user?.code}` : user?.email}
                </p>
              </div>
            </div>
            {isDealer && (
              <div className="mb-3 px-2 py-1.5 bg-blue-500/10 rounded-md">
                <p className="text-xs text-blue-400 text-center">Bayi Portalı</p>
              </div>
            )}
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-destructive"
              onClick={handleLogout}
              data-testid="logout-btn"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Çıkış Yap
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
