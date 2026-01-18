const { contextBridge, ipcRenderer } = require('electron');

// React uygulamasına güvenli API'ler sun
contextBridge.exposeInMainWorld('electronAPI', {
  // Uygulama bilgileri
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  
  // Yazıcı işlemleri
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  printReceipt: (options) => ipcRenderer.invoke('print-receipt', options),
  
  // Navigasyon
  onNavigate: (callback) => {
    ipcRenderer.on('navigate', (event, path) => callback(path));
  },
  
  // Platform kontrolü
  isElectron: true
});

// Konsol mesajı
console.log('KBYS Desktop - Preload script loaded');
