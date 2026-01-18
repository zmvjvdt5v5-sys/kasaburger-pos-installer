const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const path = require('path');
const isDev = process.env.ELECTRON_DEV === 'true';

let mainWindow;

function createWindow() {
  // Ana pencere oluştur
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    icon: path.join(__dirname, 'logo192.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'default',
    backgroundColor: '#09090b', // zinc-950
    show: false
  });

  // Menü oluştur
  const menuTemplate = [
    {
      label: 'KBYS',
      submenu: [
        { label: 'Hakkında', click: () => showAbout() },
        { type: 'separator' },
        { label: 'Ayarlar', accelerator: 'CmdOrCtrl+,', click: () => mainWindow.webContents.send('navigate', '/settings') },
        { type: 'separator' },
        { label: 'Çıkış', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() }
      ]
    },
    {
      label: 'Düzen',
      submenu: [
        { label: 'Geri Al', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Yinele', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: 'Kes', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Kopyala', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Yapıştır', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: 'Tümünü Seç', accelerator: 'CmdOrCtrl+A', role: 'selectAll' }
      ]
    },
    {
      label: 'Görünüm',
      submenu: [
        { label: 'Yenile', accelerator: 'CmdOrCtrl+R', click: () => mainWindow.reload() },
        { label: 'Tam Ekran', accelerator: 'F11', click: () => mainWindow.setFullScreen(!mainWindow.isFullScreen()) },
        { type: 'separator' },
        { label: 'Yakınlaştır', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: 'Uzaklaştır', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { label: 'Varsayılan Boyut', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { type: 'separator' },
        { label: 'Geliştirici Araçları', accelerator: 'F12', click: () => mainWindow.webContents.toggleDevTools() }
      ]
    },
    {
      label: 'Modüller',
      submenu: [
        { label: 'Adisyon (POS)', accelerator: 'F1', click: () => mainWindow.webContents.send('navigate', '/dealer-portal/pos') },
        { label: 'Mutfak Ekranı', accelerator: 'F2', click: () => mainWindow.webContents.send('navigate', '/dealer-portal/kitchen') },
        { label: 'Kasa Raporu', accelerator: 'F3', click: () => mainWindow.webContents.send('navigate', '/dealer-portal/pos-reports') },
        { label: 'InPOS Ayarları', accelerator: 'F4', click: () => mainWindow.webContents.send('navigate', '/dealer-portal/inpos-settings') },
        { type: 'separator' },
        { label: 'Canlı Siparişler', accelerator: 'F5', click: () => mainWindow.webContents.send('navigate', '/dealer-portal/delivery-panel') },
        { label: 'Paket Servis', accelerator: 'F6', click: () => mainWindow.webContents.send('navigate', '/dealer-portal/delivery') }
      ]
    },
    {
      label: 'Yardım',
      submenu: [
        { label: 'Kullanım Kılavuzu', click: () => shell.openExternal('https://kasaburger.net.tr/yardim') },
        { label: 'Destek', click: () => shell.openExternal('https://kasaburger.net.tr/destek') },
        { type: 'separator' },
        { label: 'Hakkında', click: () => showAbout() }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  // URL yükle
  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../build/index.html')}`;

  mainWindow.loadURL(startUrl);

  // Hazır olunca göster
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Dev modda DevTools aç
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Pencere kapatıldığında
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Harici linkleri varsayılan tarayıcıda aç
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

function showAbout() {
  const { dialog } = require('electron');
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'KBYS Hakkında',
    message: 'KBYS - Kasa Burger Yönetim Sistemi',
    detail: `Versiyon: 1.0.0\n\nAdisyon/POS, Stok Yönetimi, Faturalama ve Raporlama Sistemi\n\n© 2026 Kasa Burger`,
    buttons: ['Tamam']
  });
}

// Uygulama hazır
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Tüm pencereler kapatıldığında
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-platform', () => {
  return process.platform;
});

// Yazıcı listesi
ipcMain.handle('get-printers', async () => {
  const printers = await mainWindow.webContents.getPrintersAsync();
  return printers;
});

// Yazdırma
ipcMain.handle('print-receipt', async (event, options) => {
  return new Promise((resolve, reject) => {
    mainWindow.webContents.print(options, (success, errorType) => {
      if (success) {
        resolve({ success: true });
      } else {
        reject({ success: false, error: errorType });
      }
    });
  });
});
