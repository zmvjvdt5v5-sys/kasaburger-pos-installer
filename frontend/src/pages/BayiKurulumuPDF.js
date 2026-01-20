import React from 'react';
import { Button } from '../components/ui/button';
import { Printer, Download, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function BayiKurulumuPDF() {
  const navigate = useNavigate();

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Print Controls - Hidden when printing */}
      <div className="print:hidden fixed top-4 right-4 z-50 flex gap-2">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Geri
        </Button>
        <Button onClick={handlePrint} className="bg-orange-500 hover:bg-orange-600">
          <Download className="h-4 w-4 mr-2" />
          PDF İndir / Yazdır
        </Button>
      </div>

      {/* Printable Content */}
      <div className="max-w-4xl mx-auto p-8 bg-white text-black print:p-4">
        
        {/* Cover Page */}
        <div className="text-center mb-12 print:mb-8 page-break-after">
          <div className="text-6xl mb-4">🍔</div>
          <h1 className="text-4xl font-bold text-orange-600 mb-2">KasaBurger</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Bayi Yönetim Sistemi</h2>
          <div className="w-32 h-1 bg-orange-500 mx-auto mb-6"></div>
          <h3 className="text-xl text-gray-600">Kurulum ve Kullanım Kılavuzu</h3>
          <p className="text-gray-500 mt-8">Versiyon 1.0 - Ocak 2026</p>
        </div>

        {/* Table of Contents */}
        <div className="mb-12 print:mb-8">
          <h2 className="text-2xl font-bold border-b-2 border-orange-500 pb-2 mb-4">İÇİNDEKİLER</h2>
          <ul className="space-y-2 text-lg">
            <li className="flex justify-between"><span>1. Sisteme Giriş</span><span>2</span></li>
            <li className="flex justify-between"><span>2. Sipariş Verme</span><span>3</span></li>
            <li className="flex justify-between"><span>3. Ödeme İşlemleri</span><span>4</span></li>
            <li className="flex justify-between"><span>4. Platform Entegrasyonu</span><span>5</span></li>
            <li className="flex justify-between"><span>5. POS Sistemi Kullanımı</span><span>6</span></li>
            <li className="flex justify-between"><span>6. Yazıcı Ayarları</span><span>7</span></li>
            <li className="flex justify-between"><span>7. Sık Sorulan Sorular</span><span>8</span></li>
          </ul>
        </div>

        {/* Section 1 */}
        <section className="mb-10 print:mb-6 page-break-before">
          <h2 className="text-2xl font-bold text-orange-600 border-b-2 border-orange-500 pb-2 mb-4">
            1. SİSTEME GİRİŞ
          </h2>
          
          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <p className="font-semibold">🌐 Giriş Adresi:</p>
            <code className="text-lg text-orange-600">https://burger-erp-1.preview.emergentagent.com/dealer-login</code>
          </div>

          <h3 className="text-lg font-semibold mt-4 mb-2">Adımlar:</h3>
          <ol className="list-decimal ml-6 space-y-2">
            <li>Web tarayıcınızı açın (Chrome, Firefox, Safari)</li>
            <li>Yukarıdaki adresi adres çubuğuna yazın</li>
            <li><strong>Bayi Kodu</strong> alanına size verilen kodu girin (örn: MEKGRUP)</li>
            <li><strong>Şifre</strong> alanına şifrenizi girin</li>
            <li><strong>"Giriş Yap"</strong> butonuna tıklayın</li>
          </ol>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
            <p className="font-semibold">⚠️ Önemli:</p>
            <p>Şifrenizi kimseyle paylaşmayın. Şifrenizi unuttuysanız merkez ile iletişime geçin.</p>
          </div>
        </section>

        {/* Section 2 */}
        <section className="mb-10 print:mb-6">
          <h2 className="text-2xl font-bold text-orange-600 border-b-2 border-orange-500 pb-2 mb-4">
            2. SİPARİŞ VERME
          </h2>

          <h3 className="text-lg font-semibold mb-2">Merkeze Sipariş Verme:</h3>
          <ol className="list-decimal ml-6 space-y-2">
            <li>Giriş yaptıktan sonra <strong>"Sipariş"</strong> sekmesine tıklayın</li>
            <li>Sol taraftan <strong>kategori</strong> seçin (Burger Köfteleri, Soslar, vb.)</li>
            <li>İstediğiniz ürüne tıklayın</li>
            <li><strong>Miktar</strong> belirleyin (+/- butonları ile)</li>
            <li><strong>"Sepete Ekle"</strong> butonuna tıklayın</li>
            <li>Tüm ürünleri ekledikten sonra <strong>"Sipariş Ver"</strong> butonuna tıklayın</li>
          </ol>

          <div className="bg-green-50 border-l-4 border-green-400 p-4 mt-4">
            <p className="font-semibold">✅ Sipariş Onayı:</p>
            <p>Siparişiniz başarıyla oluşturulduğunda yeşil bildirim göreceksiniz.</p>
          </div>
        </section>

        {/* Section 3 */}
        <section className="mb-10 print:mb-6 page-break-before">
          <h2 className="text-2xl font-bold text-orange-600 border-b-2 border-orange-500 pb-2 mb-4">
            3. ÖDEME İŞLEMLERİ
          </h2>

          <h3 className="text-lg font-semibold mb-2">Ödeme Yapma:</h3>
          <ol className="list-decimal ml-6 space-y-2">
            <li><strong>"Ödeme Yap"</strong> sekmesine gidin</li>
            <li>Ödeme yöntemini seçin:
              <ul className="list-disc ml-6 mt-1">
                <li><strong>Havale/EFT:</strong> Banka hesap bilgileri gösterilir</li>
                <li><strong>Kredi Kartı:</strong> Online ödeme yapabilirsiniz</li>
              </ul>
            </li>
            <li>Ödemek istediğiniz <strong>tutarı</strong> girin</li>
            <li><strong>"Ödeme Yap"</strong> butonuna tıklayın</li>
          </ol>

          <h3 className="text-lg font-semibold mt-6 mb-2">Ekstre Görüntüleme:</h3>
          <ol className="list-decimal ml-6 space-y-2">
            <li><strong>"Ekstre"</strong> sekmesine gidin</li>
            <li>Tarih aralığı seçin</li>
            <li>Tüm sipariş ve ödemelerinizi görün</li>
          </ol>
        </section>

        {/* Section 4 */}
        <section className="mb-10 print:mb-6">
          <h2 className="text-2xl font-bold text-orange-600 border-b-2 border-orange-500 pb-2 mb-4">
            4. PLATFORM ENTEGRASYONU
          </h2>

          <p className="mb-4">Yemeksepeti, Getir, Trendyol ve Migros siparişlerinizi otomatik almak için:</p>

          <h3 className="text-lg font-semibold mb-2">Kurulum Adımları:</h3>
          <ol className="list-decimal ml-6 space-y-3">
            <li><strong>"Platformlar"</strong> sekmesine gidin</li>
            <li>Bağlamak istediğiniz platformu seçin</li>
            <li>
              <strong>API Bilgilerini Alın:</strong>
              <ul className="list-disc ml-6 mt-1">
                <li>Platform panelinize giriş yapın (örn: restoran.yemeksepeti.com)</li>
                <li>Ayarlar → API Entegrasyonu bölümüne gidin</li>
                <li>API Key ve Secret bilgilerini kopyalayın</li>
              </ul>
            </li>
            <li>KasaBurger'a yapıştırın ve <strong>"Kaydet"</strong> butonuna tıklayın</li>
            <li>
              <strong>Webhook URL'yi Ekleyin:</strong>
              <ul className="list-disc ml-6 mt-1">
                <li>Sistem size otomatik bir URL verecek</li>
                <li>Bu URL'yi platform panelinizdeki "Webhook" alanına yapıştırın</li>
              </ul>
            </li>
            <li><strong>"Bağlantıyı Test Et"</strong> butonuna tıklayın</li>
          </ol>

          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-4">
            <p className="font-semibold">📱 Desteklenen Platformlar:</p>
            <p>🍽️ Yemeksepeti | 🛵 Getir Yemek | 🛒 Trendyol Yemek | 🏪 Migros Yemek</p>
          </div>
        </section>

        {/* Section 5 */}
        <section className="mb-10 print:mb-6 page-break-before">
          <h2 className="text-2xl font-bold text-orange-600 border-b-2 border-orange-500 pb-2 mb-4">
            5. POS SİSTEMİ KULLANIMI
          </h2>

          <h3 className="text-lg font-semibold mb-2">POS'a Erişim:</h3>
          <p className="mb-4">Ana menüden <strong>"Adisyon"</strong> linkine tıklayın</p>

          <h3 className="text-lg font-semibold mb-2">Masa Siparişi:</h3>
          <ol className="list-decimal ml-6 space-y-2">
            <li>Haritadan boş bir <strong>masa</strong> seçin</li>
            <li>Ürünleri sepete ekleyin</li>
            <li><strong>"Mutfağa Gönder"</strong> butonuna tıklayın</li>
            <li>Sipariş hazır olunca <strong>"Ödeme Al"</strong> butonuna tıklayın</li>
            <li>Ödeme yöntemini seçin ve onaylayın</li>
          </ol>

          <h3 className="text-lg font-semibold mt-4 mb-2">Paket Sipariş:</h3>
          <ol className="list-decimal ml-6 space-y-2">
            <li>Üst menüden <strong>"Paket"</strong> butonuna tıklayın</li>
            <li>Ürünleri ekleyin</li>
            <li>Müşteri bilgilerini girin</li>
            <li>Siparişi kaydedin</li>
          </ol>

          <h3 className="text-lg font-semibold mt-4 mb-2">Teslimat Siparişleri:</h3>
          <p>Platform siparişleri sağ panelde otomatik görünür. <strong>"Kabul"</strong> ile siparişi alın.</p>
        </section>

        {/* Section 6 */}
        <section className="mb-10 print:mb-6">
          <h2 className="text-2xl font-bold text-orange-600 border-b-2 border-orange-500 pb-2 mb-4">
            6. YAZICI AYARLARI (InPOS/ÖKC)
          </h2>

          <h3 className="text-lg font-semibold mb-2">Yazıcı Bağlantısı:</h3>
          <ol className="list-decimal ml-6 space-y-2">
            <li>POS ekranında <strong>⚙️ (Ayarlar)</strong> simgesine tıklayın</li>
            <li><strong>Yazıcı IP</strong> adresini girin (örn: 192.168.1.100)</li>
            <li><strong>Port</strong> numarasını girin (genellikle 9100)</li>
            <li><strong>"Kaydet"</strong> butonuna tıklayın</li>
            <li><strong>"Test Fişi"</strong> ile kontrol edin</li>
          </ol>

          <div className="bg-gray-100 p-4 rounded-lg mt-4">
            <p className="font-semibold">🖨️ Yazıcı IP Nasıl Bulunur:</p>
            <ol className="list-decimal ml-6 mt-2">
              <li>Yazıcının ayarlar menüsüne girin</li>
              <li>Ağ ayarları bölümünü bulun</li>
              <li>IP adresini not alın</li>
            </ol>
          </div>
        </section>

        {/* Section 7 */}
        <section className="mb-10 print:mb-6 page-break-before">
          <h2 className="text-2xl font-bold text-orange-600 border-b-2 border-orange-500 pb-2 mb-4">
            7. SIK SORULAN SORULAR
          </h2>

          <div className="space-y-4">
            <div className="border-l-4 border-orange-400 pl-4">
              <p className="font-semibold">❓ Şifremi unuttum, ne yapmalıyım?</p>
              <p className="text-gray-600">Merkez ile iletişime geçin. Yeni şifre oluşturulacaktır.</p>
            </div>

            <div className="border-l-4 border-orange-400 pl-4">
              <p className="font-semibold">❓ Sipariş verdim ama görünmüyor?</p>
              <p className="text-gray-600">Sayfayı yenileyin (F5 tuşu). Hala görünmüyorsa merkezi arayın.</p>
            </div>

            <div className="border-l-4 border-orange-400 pl-4">
              <p className="font-semibold">❓ Platform siparişleri gelmiyor?</p>
              <p className="text-gray-600">API key ve Webhook URL'nin doğru girildiğinden emin olun. Bağlantıyı test edin.</p>
            </div>

            <div className="border-l-4 border-orange-400 pl-4">
              <p className="font-semibold">❓ Yazıcıdan fiş çıkmıyor?</p>
              <p className="text-gray-600">1) Yazıcı açık mı kontrol edin. 2) IP adresini kontrol edin. 3) Test fişi deneyin.</p>
            </div>

            <div className="border-l-4 border-orange-400 pl-4">
              <p className="font-semibold">❓ Bakiyem yanlış görünüyor?</p>
              <p className="text-gray-600">Ekstre sekmesinden hareketlerinizi kontrol edin. Sorun devam ederse merkezi arayın.</p>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="mb-10 print:mb-6">
          <h2 className="text-2xl font-bold text-orange-600 border-b-2 border-orange-500 pb-2 mb-4">
            DESTEK İLETİŞİM
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-100 p-4 rounded-lg text-center">
              <p className="text-2xl mb-2">📞</p>
              <p className="font-semibold">Telefon</p>
              <p className="text-gray-600">[Telefon Numarası]</p>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg text-center">
              <p className="text-2xl mb-2">📧</p>
              <p className="font-semibold">E-posta</p>
              <p className="text-gray-600">[E-posta Adresi]</p>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg text-center">
              <p className="text-2xl mb-2">💬</p>
              <p className="font-semibold">WhatsApp</p>
              <p className="text-gray-600">[WhatsApp No]</p>
            </div>
          </div>

          <p className="text-center mt-4 text-gray-500">
            Çalışma Saatleri: Pazartesi - Cumartesi 09:00 - 22:00
          </p>
        </section>

        {/* Footer */}
        <div className="text-center border-t-2 border-gray-200 pt-4 mt-8">
          <p className="text-gray-500">© 2026 KasaBurger Yönetim Sistemi</p>
          <p className="text-gray-400 text-sm">Bu belge bayilerimiz için hazırlanmıştır.</p>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body { 
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .page-break-before { page-break-before: always; }
          .page-break-after { page-break-after: always; }
          .print\\:hidden { display: none !important; }
          .print\\:mb-6 { margin-bottom: 1.5rem !important; }
          .print\\:mb-8 { margin-bottom: 2rem !important; }
          .print\\:p-4 { padding: 1rem !important; }
        }
      `}</style>
    </>
  );
}
