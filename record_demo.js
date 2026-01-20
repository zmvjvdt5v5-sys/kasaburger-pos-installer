/**
 * KasaBurger - Sipariş Akışı Video Kaydı
 * Mutfak ekranı ve salon ekranı demo
 */
const { chromium } = require('playwright');
const path = require('path');

const BASE_URL = 'https://multi-branch-pos-7.preview.emergentagent.com';

async function recordDemo() {
    console.log('🎬 Video kaydı başlıyor...');
    
    // Browser'ı başlat
    const browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    // Video kayıt klasörü
    const videoDir = '/app/videos';
    
    // Context with video recording
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        recordVideo: {
            dir: videoDir,
            size: { width: 1920, height: 1080 }
        }
    });
    
    const page = await context.newPage();
    
    try {
        // ========== BÖLÜM 1: Login ==========
        console.log('1️⃣ Login yapılıyor...');
        await page.goto(`${BASE_URL}/login`);
        await page.waitForTimeout(2000);
        
        await page.fill('input[type="email"]', 'admin@kasaburger.net.tr');
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
        
        // ========== BÖLÜM 2: POS'ta Sipariş Oluştur ==========
        console.log('2️⃣ POS\'a gidiliyor...');
        await page.goto(`${BASE_URL}/pos`);
        await page.waitForTimeout(3000);
        
        // Gel-Al butonu (paket sipariş)
        console.log('3️⃣ Paket sipariş oluşturuluyor...');
        const gelAlBtn = await page.$('button:has-text("Gel-Al")');
        if (gelAlBtn) {
            await gelAlBtn.click();
            await page.waitForTimeout(1500);
        }
        
        // Ürün ekle (ilk ürüne tıkla)
        const productCard = await page.$('[data-testid*="product"]');
        if (productCard) {
            await productCard.click();
            await page.waitForTimeout(1000);
            await productCard.click(); // 2 adet
            await page.waitForTimeout(1000);
        }
        
        // Sipariş gönder butonu
        const sendBtn = await page.$('button:has-text("Mutfağa Gönder")');
        if (sendBtn) {
            await sendBtn.click();
            await page.waitForTimeout(2000);
        }
        
        // ========== BÖLÜM 3: Mutfak Ekranı ==========
        console.log('4️⃣ Mutfak ekranına gidiliyor...');
        await page.goto(`${BASE_URL}/mutfak`);
        await page.waitForTimeout(3000);
        
        // Ekranı göster
        await page.waitForTimeout(2000);
        
        // "Hazırla" butonuna tıkla
        console.log('5️⃣ Sipariş hazırlanıyor...');
        const hazirlaBtn = await page.$('button:has-text("Hazırla")');
        if (hazirlaBtn) {
            await hazirlaBtn.click();
            await page.waitForTimeout(2000);
        }
        
        // "Hazır" butonuna tıkla
        console.log('6️⃣ Sipariş hazır işaretleniyor...');
        const hazirBtn = await page.$('button:has-text("Hazır")');
        if (hazirBtn) {
            await hazirBtn.click();
            await page.waitForTimeout(2000);
        }
        
        // ========== BÖLÜM 4: Salon Ekranı ==========
        console.log('7️⃣ Salon ekranına gidiliyor...');
        await page.goto(`${BASE_URL}/salon-ekran`);
        await page.waitForTimeout(5000);
        
        // Hazır siparişi göster
        console.log('8️⃣ Salon ekranı kaydediliyor...');
        await page.waitForTimeout(3000);
        
        console.log('✅ Demo tamamlandı!');
        
    } catch (error) {
        console.error('❌ Hata:', error.message);
    }
    
    // Video'yu kaydet
    await page.close();
    await context.close();
    
    // Video dosyasını bul
    const fs = require('fs');
    const videos = fs.readdirSync(videoDir);
    const videoFile = videos.find(f => f.endsWith('.webm'));
    
    if (videoFile) {
        const videoPath = path.join(videoDir, videoFile);
        const finalPath = '/app/frontend/public/demo-siparis-akisi.webm';
        fs.renameSync(videoPath, finalPath);
        console.log(`🎬 Video kaydedildi: ${finalPath}`);
    }
    
    await browser.close();
}

recordDemo().catch(console.error);
