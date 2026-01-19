import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  BookOpen, Monitor, ShoppingCart, CreditCard, Truck, Settings,
  HelpCircle, Phone, Mail, MessageCircle, ExternalLink, Play,
  CheckCircle, AlertCircle, Smartphone, Printer, Users, Key,
  Download, FileText
} from 'lucide-react';

export default function BayiRehber() {
  const sections = [
    {
      id: 'giris',
      title: '1. Sisteme Giriş',
      icon: Key,
      color: 'bg-blue-500',
      steps: [
        'Chrome, Firefox veya Safari tarayıcısını açın',
        'Adres çubuğuna şube giriş adresini yazın',
        'Bayi kodunuzu girin (örn: MEKGRUP)',
        'Şifrenizi girin ve "Giriş Yap" butonuna tıklayın'
      ]
    },
    {
      id: 'siparis',
      title: '2. Sipariş Verme',
      icon: ShoppingCart,
      color: 'bg-green-500',
      steps: [
        '"Sipariş" sekmesine gidin',
        'Kategorilerden ürün seçin',
        'Miktarı belirleyip sepete ekleyin',
        '"Sipariş Ver" butonuna tıklayın'
      ]
    },
    {
      id: 'odeme',
      title: '3. Ödeme Yapma',
      icon: CreditCard,
      color: 'bg-purple-500',
      steps: [
        '"Ödeme Yap" sekmesine gidin',
        'Ödeme yöntemini seçin (Havale/Kart)',
        'Tutarı girin',
        '"Ödeme Yap" butonuna tıklayın'
      ]
    },
    {
      id: 'platform',
      title: '4. Yemek Platformları',
      icon: Truck,
      color: 'bg-pink-500',
      steps: [
        '"Platformlar" sekmesine gidin',
        'Bağlamak istediğiniz platformu seçin',
        'Platform panelinden API bilgilerini alın',
        'Webhook URL\'yi platform paneline ekleyin',
        '"Bağlantıyı Test Et" ile kontrol edin'
      ]
    },
    {
      id: 'pos',
      title: '5. POS/Adisyon Kullanımı',
      icon: Monitor,
      color: 'bg-orange-500',
      steps: [
        'Menüden "Adisyon" linkine tıklayın',
        'Masa seçin veya "Paket" siparişi açın',
        'Ürünleri ekleyin',
        '"Mutfağa Gönder" ile siparişi iletin',
        '"Ödeme Al" ile hesabı kapatın'
      ]
    },
    {
      id: 'ayarlar',
      title: '6. Yazıcı/InPOS Ayarları',
      icon: Printer,
      color: 'bg-cyan-500',
      steps: [
        'POS ekranında ⚙️ simgesine tıklayın',
        'Yazıcı IP adresini girin (örn: 192.168.1.100)',
        'Port numarasını girin (genellikle 9100)',
        '"Test Fişi" ile kontrol edin'
      ]
    }
  ];

  const faqs = [
    { q: 'Şifremi unuttum?', a: 'Merkez ile iletişime geçin, yeni şifre oluşturulacak.' },
    { q: 'Platform siparişleri gelmiyor?', a: 'API key ve Webhook URL\'yi kontrol edin.' },
    { q: 'Yazıcıdan fiş çıkmıyor?', a: 'Yazıcı IP\'sini ve bağlantısını kontrol edin.' },
    { q: 'Sipariş görünmüyor?', a: 'Sayfayı yenileyin (F5 tuşu).' }
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-orange-500/20 rounded-full">
            <BookOpen className="h-8 w-8 text-orange-400" />
            <h1 className="text-3xl font-bold">Bayi Kullanım Rehberi</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            KasaBurger sistemini nasıl kullanacağınızı adım adım öğrenin
          </p>
        </div>

        {/* Quick Start Video Placeholder */}
        <Card className="bg-gradient-to-r from-orange-500/20 to-pink-500/20 border-orange-500/30">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Play className="h-10 w-10 text-orange-400" />
            </div>
            <h2 className="text-xl font-bold mb-2">Hızlı Başlangıç</h2>
            <p className="text-muted-foreground mb-4">
              Sistemi kullanmaya başlamak için aşağıdaki adımları takip edin
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              <Badge className="bg-blue-500">1. Giriş Yap</Badge>
              <Badge className="bg-green-500">2. Sipariş Ver</Badge>
              <Badge className="bg-purple-500">3. Ödeme Yap</Badge>
              <Badge className="bg-pink-500">4. Platformları Bağla</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map((section) => (
            <Card key={section.id} className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${section.color}`}>
                    <section.icon className="h-5 w-5 text-white" />
                  </div>
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2">
                  {section.steps.map((step, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <span className="text-sm text-muted-foreground">{step}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Platform Logos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Desteklenen Platformlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: 'Yemeksepeti', logo: '🍽️', color: 'bg-pink-500/20 border-pink-500/50' },
                { name: 'Getir Yemek', logo: '🛵', color: 'bg-purple-500/20 border-purple-500/50' },
                { name: 'Trendyol Yemek', logo: '🛒', color: 'bg-orange-500/20 border-orange-500/50' },
                { name: 'Migros Yemek', logo: '🏪', color: 'bg-orange-600/20 border-orange-600/50' }
              ].map((platform) => (
                <div key={platform.name} className={`p-4 rounded-xl border ${platform.color} text-center`}>
                  <span className="text-4xl block mb-2">{platform.logo}</span>
                  <span className="text-sm font-medium">{platform.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Sık Sorulan Sorular
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="p-4 bg-muted/50 rounded-lg">
                <p className="font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-400" />
                  {faq.q}
                </p>
                <p className="text-sm text-muted-foreground mt-1 ml-6">
                  <CheckCircle className="h-3 w-3 inline mr-1 text-green-400" />
                  {faq.a}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Support */}
        <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Destek İletişim
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="justify-start">
                <Phone className="h-4 w-4 mr-2" />
                Telefon ile Ara
              </Button>
              <Button variant="outline" className="justify-start">
                <Mail className="h-4 w-4 mr-2" />
                E-posta Gönder
              </Button>
              <Button variant="outline" className="justify-start">
                <MessageCircle className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>KasaBurger Yönetim Sistemi © 2026</p>
          <p>Bu rehber bayilerimizin sistemi daha kolay kullanabilmesi için hazırlanmıştır.</p>
        </div>
      </div>
    </div>
  );
}
