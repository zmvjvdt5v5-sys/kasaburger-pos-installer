const { app, BrowserWindow, ipcMain, Menu, Tray, shell, dialog, Notification } = require('electron');
const path = require('path');
const Store = require('electron-store');
const { autoUpdater } = require('electron-updater');

// Store for app settings
const store = new Store({
  defaults: {
    serverUrl: 'https://kbys-portal.preview.emergentagent.com',
    windowBounds: { width: 1400, height: 900 },
    autoUpdate: true,
    startMinimized: false,
    alwaysOnTop: false
  }
});

let mainWindow;
let tray;
let isQuitting = false;

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function createWindow() {
  const bounds = store.get('windowBounds');
  
  mainWindow = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    minWidth: 1024,
    minHeight: 768,
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    },
    show: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#1a1a1a',
      symbolColor: '#f97316',
      height: 32
    }
  });

  // Load the app
  const serverUrl = store.get('serverUrl');
  mainWindow.loadURL(serverUrl);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    if (!store.get('startMinimized')) {
      mainWindow.show();
    }
  });

  // Save window size on resize
  mainWindow.on('resize', () => {
    const { width, height } = mainWindow.getBounds();
    store.set('windowBounds', { width, height });
  });

  // Handle close to tray
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      
      if (process.platform === 'win32') {
        new Notification({
          title: 'KasaBurger POS',
          body: 'Uygulama arka planda çalışmaya devam ediyor',
          icon: path.join(__dirname, 'build', 'icon.png')
        }).show();
      }
    }
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // DevTools in development
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
}

function createTray() {
  const iconPath = path.join(__dirname, 'build', 'icon.png');
  tray = new Tray(iconPath);
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'KasaBurger POS',
      enabled: false,
      icon: iconPath
    },
    { type: 'separator' },
    {
      label: 'Aç',
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      }
    },
    {
      label: 'POS Sistemi',
      click: () => {
        mainWindow.show();
        mainWindow.webContents.send('navigate', '/pos');
      }
    },
    {
      label: 'Mutfak Ekranı',
      click: () => {
        mainWindow.show();
        mainWindow.webContents.send('navigate', '/kitchen-display');
      }
    },
    { type: 'separator' },
    {
      label: 'Güncellemeleri Kontrol Et',
      click: () => {
        autoUpdater.checkForUpdates();
      }
    },
    { type: 'separator' },
    {
      label: 'Çıkış',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('KasaBurger POS');
  tray.setContextMenu(contextMenu);
  
  tray.on('double-click', () => {
    mainWindow.show();
    mainWindow.focus();
  });
}

function createMenu() {
  const template = [
    {
      label: 'Dosya',
      submenu: [
        {
          label: 'Yeni Sipariş',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow.webContents.send('navigate', '/pos')
        },
        { type: 'separator' },
        {
          label: 'Ayarlar',
          accelerator: 'CmdOrCtrl+,',
          click: () => mainWindow.webContents.send('navigate', '/settings')
        },
        { type: 'separator' },
        {
          label: 'Çıkış',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            isQuitting = true;
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Görünüm',
      submenu: [
        {
          label: 'POS Sistemi',
          accelerator: 'F1',
          click: () => mainWindow.webContents.send('navigate', '/pos')
        },
        {
          label: 'Mutfak Ekranı',
          accelerator: 'F2',
          click: () => mainWindow.webContents.send('navigate', '/kitchen-display')
        },
        {
          label: 'Raporlar',
          accelerator: 'F3',
          click: () => mainWindow.webContents.send('navigate', '/pos-reports')
        },
        { type: 'separator' },
        {
          label: 'Tam Ekran',
          accelerator: 'F11',
          click: () => {
            mainWindow.setFullScreen(!mainWindow.isFullScreen());
          }
        },
        { type: 'separator' },
        { role: 'reload', label: 'Yenile' },
        { role: 'forceReload', label: 'Zorla Yenile' }
      ]
    },
    {
      label: 'İşlemler',
      submenu: [
        {
          label: 'Z Raporu Al',
          accelerator: 'CmdOrCtrl+Z',
          click: () => mainWindow.webContents.send('action', 'z-report')
        },
        {
          label: 'X Raporu Al',
          accelerator: 'CmdOrCtrl+X',
          click: () => mainWindow.webContents.send('action', 'x-report')
        },
        { type: 'separator' },
        {
          label: 'Kasa Aç',
          accelerator: 'CmdOrCtrl+K',
          click: () => mainWindow.webContents.send('action', 'open-drawer')
        },
        {
          label: 'Test Fişi',
          click: () => mainWindow.webContents.send('action', 'test-print')
        }
      ]
    },
    {
      label: 'Yardım',
      submenu: [
        {
          label: 'Hakkında',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'KasaBurger POS',
              message: 'KasaBurger Yönetim Sistemi',
              detail: `Versiyon: ${app.getVersion()}\n\nBurger franchise yönetim ve POS sistemi.\n\n© 2024 KasaBurger`
            });
          }
        },
        {
          label: 'Güncellemeleri Kontrol Et',
          click: () => autoUpdater.checkForUpdates()
        },
        { type: 'separator' },
        {
          label: 'Geliştirici Araçları',
          accelerator: 'CmdOrCtrl+Shift+I',
          click: () => mainWindow.webContents.toggleDevTools()
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Auto updater events
autoUpdater.on('update-available', () => {
  new Notification({
    title: 'Güncelleme Mevcut',
    body: 'Yeni bir güncelleme indiriliyor...',
    icon: path.join(__dirname, 'build', 'icon.png')
  }).show();
});

autoUpdater.on('update-downloaded', () => {
  const response = dialog.showMessageBoxSync(mainWindow, {
    type: 'info',
    buttons: ['Şimdi Yükle', 'Daha Sonra'],
    title: 'Güncelleme Hazır',
    message: 'Güncelleme indirildi. Uygulamayı yeniden başlatmak ister misiniz?'
  });
  
  if (response === 0) {
    isQuitting = true;
    autoUpdater.quitAndInstall();
  }
});

// IPC Handlers
ipcMain.handle('get-settings', () => {
  return {
    serverUrl: store.get('serverUrl'),
    autoUpdate: store.get('autoUpdate'),
    startMinimized: store.get('startMinimized'),
    alwaysOnTop: store.get('alwaysOnTop')
  };
});

ipcMain.handle('set-settings', (event, settings) => {
  Object.keys(settings).forEach(key => {
    store.set(key, settings[key]);
  });
  
  if (settings.alwaysOnTop !== undefined) {
    mainWindow.setAlwaysOnTop(settings.alwaysOnTop);
  }
  
  return true;
});

ipcMain.handle('show-notification', (event, { title, body }) => {
  new Notification({ title, body }).show();
});

ipcMain.handle('print-receipt', async (event, receiptData) => {
  // Implement receipt printing logic
  return { success: true };
});

ipcMain.handle('open-cash-drawer', async () => {
  // Implement cash drawer opening
  return { success: true };
});

// App lifecycle
app.whenReady().then(() => {
  createWindow();
  createTray();
  createMenu();
  
  // Check for updates
  if (store.get('autoUpdate')) {
    autoUpdater.checkForUpdatesAndNotify();
  }
  
  // Apply always on top setting
  mainWindow.setAlwaysOnTop(store.get('alwaysOnTop'));
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else {
    mainWindow.show();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
});
