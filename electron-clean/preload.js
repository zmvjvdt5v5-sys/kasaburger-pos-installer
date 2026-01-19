const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  setSettings: (settings) => ipcRenderer.invoke('set-settings', settings),
  
  // Notifications
  showNotification: (title, body) => ipcRenderer.invoke('show-notification', { title, body }),
  
  // Printing
  printReceipt: (receiptData) => ipcRenderer.invoke('print-receipt', receiptData),
  
  // Cash drawer
  openCashDrawer: () => ipcRenderer.invoke('open-cash-drawer'),
  
  // Navigation events from main process
  onNavigate: (callback) => {
    ipcRenderer.on('navigate', (event, path) => callback(path));
  },
  
  // Action events from menu
  onAction: (callback) => {
    ipcRenderer.on('action', (event, action) => callback(action));
  },
  
  // App info
  getVersion: () => ipcRenderer.invoke('get-version'),
  
  // Platform detection
  platform: process.platform,
  isElectron: true
});

// Handle navigation from main menu
ipcRenderer.on('navigate', (event, path) => {
  window.postMessage({ type: 'electron-navigate', path }, '*');
});

// Handle actions from main menu
ipcRenderer.on('action', (event, action) => {
  window.postMessage({ type: 'electron-action', action }, '*');
});
