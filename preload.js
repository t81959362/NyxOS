const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronBrowser', {
  newTab: (url) => ipcRenderer.invoke('browser-new-tab', url),
  switchTab: (id) => ipcRenderer.invoke('browser-switch-tab', id),
  closeTab: (id) => ipcRenderer.invoke('browser-close-tab', id),
  navigate: (id, url) => ipcRenderer.invoke('browser-navigate', { id, url }),
  back: (id) => ipcRenderer.invoke('browser-back', id),
  forward: (id) => ipcRenderer.invoke('browser-forward', id),
  reload: (id) => ipcRenderer.invoke('browser-reload', id),
});
