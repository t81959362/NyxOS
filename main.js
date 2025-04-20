const { app, BrowserWindow, BrowserView, ipcMain, session } = require('electron');
const path = require('path');
const fs = require('fs');
let adblockEnabled = true;
let adblockEngine = null;

// Adblock initialization
function initAdblock() {
  try {
    const adblockRust = require('adblock-rs');
    const filterSet = new adblockRust.FilterSet(false);
    const easylistPath = path.join(__dirname, 'data', 'easylist.txt');
    const easylistLines = fs.readFileSync(easylistPath, 'utf-8')
      .split('\n')
      .map(line => line.trim())
      .filter(line =>
        line &&
        !line.startsWith('!') &&
        !line.startsWith('[') &&
        /[\/\*\.\$\^\|]/.test(line)
      );
    for (const rule of easylistLines) {
      try {
        filterSet.addFilters([rule]);
      } catch (e) {
        // Skip invalid rule
      }
    }
    adblockEngine = new adblockRust.Engine(filterSet, true);
  } catch (e) {
    console.error('Failed to initialize adblock:', e);
    adblockEngine = null;
  }
}

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function setupAdblockWebRequest() {
  // Remove any previous listeners
  try { session.defaultSession.webRequest.onBeforeRequest(null); } catch {}
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    if (!adblockEnabled || !adblockEngine) return callback({});
    const { url, resourceType, referrer } = details;
    const type = resourceType || 'other';

    // Validate URL and referrer
    if (!isValidUrl(url)) return callback({});
    const safeReferrer = isValidUrl(referrer) ? referrer : '';

    let blocked = false;
    try {
      blocked = adblockEngine.check(url, safeReferrer, type);
    } catch (e) {
      console.warn('adblockEngine.check failed for', url, safeReferrer, type, e);
      blocked = false;
    }
    if (blocked) return callback({ cancel: true });
    return callback({});
  });
}


initAdblock();
app.whenReady().then(() => {
  setupAdblockWebRequest();
});

// IPC for adblock toggle
ipcMain.handle('adblock-toggle', () => {
  adblockEnabled = !adblockEnabled;
  return adblockEnabled;
});
ipcMain.handle('adblock-get-state', () => adblockEnabled);

let mainWindow;
let tabs = []; // { id, view, url }
let activeTabId = null;

function createMainWindow() {
  if (mainWindow) return;
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: path.join(__dirname, 'web', 'src', 'assets', 'Icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
    },
    title: 'NyxOS Electron',
  });
  mainWindow.loadFile(path.join(__dirname, 'web', 'dist', 'index.html'));
}

function createTab(url) {
  const view = new BrowserView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });
  view.webContents.loadURL(url);
  const id = Math.random().toString(36).slice(2);
  tabs.push({ id, view, url });
  attachTabOpenHandler({ id, view, url });
  setActiveTab(id);
  return id;
}

function setActiveTab(id) {
  const tab = tabs.find(t => t.id === id);
  if (!tab || !tab.view || tab.view.webContents.isDestroyed()) return;
  if (mainWindow.getBrowserView()) mainWindow.removeBrowserView(mainWindow.getBrowserView());
  mainWindow.setBrowserView(tab.view);
  tab.view.setBounds({ x: 0, y: 100, width: mainWindow.getBounds().width, height: mainWindow.getBounds().height - 100 });
  tab.view.setAutoResize({ width: true, height: true });
  activeTabId = id;
}

function closeTab(id) {
  const idx = tabs.findIndex(t => t.id === id);
  if (idx === -1) return;
  const [tab] = tabs.splice(idx, 1);
  if (tab && tab.view && !tab.view.webContents.isDestroyed()) {
    tab.view.webContents.destroy();
  }
  if (activeTabId === id) {
    if (tabs.length > 0) {
      setActiveTab(tabs[0].id);
    } else {
      // No tabs left, create a new default tab
      const newId = createTab('https://www.google.com/');
      setActiveTab(newId);
    }
  }
}

// Intercept all popups and open as new tabs
function attachTabOpenHandler(tab) {
  if (!tab || !tab.view || !tab.view.webContents) return;
  if (typeof tab.view.webContents.setWindowOpenHandler === 'function') {
    tab.view.webContents.setWindowOpenHandler(({ url }) => {
      createTab(url);
      return { action: 'deny' };
    });
  }
  tab.view.webContents.on('new-window', (event, url) => {
    event.preventDefault();
    createTab(url);
  });
}

app.whenReady().then(() => {
  createMainWindow();

  ipcMain.removeHandler('browser-new-tab');
  ipcMain.handle('browser-new-tab', (event, url) => createTab(url));
  ipcMain.removeHandler('browser-switch-tab');
  ipcMain.handle('browser-switch-tab', (event, id) => setActiveTab(id));
  ipcMain.removeHandler('browser-close-tab');
  ipcMain.handle('browser-close-tab', (event, id) => closeTab(id));
  ipcMain.removeHandler('browser-navigate');
  ipcMain.handle('browser-navigate', (event, { id, url }) => {
    const tab = tabs.find(t => t.id === id);
    if (tab && tab.view && !tab.view.webContents.isDestroyed()) {
      tab.view.webContents.loadURL(url);
    }
  });
  ipcMain.removeHandler('browser-back');
  ipcMain.handle('browser-back', (event, id) => {
    const tab = tabs.find(t => t.id === id);
    if (tab && tab.view.webContents.canGoBack()) tab.view.webContents.goBack();
  });
  ipcMain.removeHandler('browser-forward');
  ipcMain.handle('browser-forward', (event, id) => {
    const tab = tabs.find(t => t.id === id);
    if (tab && tab.view.webContents.canGoForward()) tab.view.webContents.goForward();
  });
  ipcMain.removeHandler('browser-reload');
  ipcMain.handle('browser-reload', (event, id) => {
    const tab = tabs.find(t => t.id === id);
    if (tab) tab.view.webContents.reload();
  });

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

function closeTab(id) {
  const idx = tabs.findIndex(t => t.id === id);
  if (idx === -1) return;
  const [tab] = tabs.splice(idx, 1);
  if (tab && tab.view && !tab.view.webContents.isDestroyed()) {
    tab.view.webContents.destroy();
  }
  if (activeTabId === id) {
    if (tabs.length > 0) {
      setActiveTab(tabs[0].id);
    } else {
      // No tabs left, create a new default tab
      const newId = createTab('https://www.google.com/');
      setActiveTab(newId);
    }
  }
}

app.whenReady().then(() => {
  createMainWindow();

  ipcMain.handle('browser-new-tab', (event, url) => {
    return createTab(url);
  });
  ipcMain.handle('browser-switch-tab', (event, id) => {
    const tab = tabs.find(t => t.id === id);
    if (tab && tab.view && !tab.view.webContents.isDestroyed()) {
      setActiveTab(id);
    }
  });
  ipcMain.handle('browser-close-tab', (event, id) => {
    closeTab(id);
  });
  ipcMain.handle('browser-navigate', (event, { id, url }) => {
    const tab = tabs.find(t => t.id === id);
    if (tab && tab.view && !tab.view.webContents.isDestroyed()) {
      tab.view.webContents.loadURL(url);
    }
  });
  ipcMain.handle('browser-back', (event, id) => {
    const tab = tabs.find(t => t.id === id);
    if (tab && tab.view.webContents.canGoBack()) tab.view.webContents.goBack();
  });
  ipcMain.handle('browser-forward', (event, id) => {
    const tab = tabs.find(t => t.id === id);
    if (tab && tab.view.webContents.canGoForward()) tab.view.webContents.goForward();
  });
  ipcMain.handle('browser-reload', (event, id) => {
    const tab = tabs.find(t => t.id === id);
    if (tab) tab.view.webContents.reload();
  });

  mainWindow.on('resize', () => {
    const tab = tabs.find(t => t.id === activeTabId);
    if (tab) {
      tab.view.setBounds({ x: 0, y: 100, width: mainWindow.getBounds().width, height: mainWindow.getBounds().height - 100 });
    }
  });

  // --- Prevent external Electron windows, open in tab instead ---
  function attachTabOpenHandler(tab) {
    if (!tab || !tab.view || !tab.view.webContents) return;
    // For Electron 13+ (setWindowOpenHandler)
    if (typeof tab.view.webContents.setWindowOpenHandler === 'function') {
      tab.view.webContents.setWindowOpenHandler(({ url }) => {
        createTab(url);
        return { action: 'deny' };
      });
    }
    // For older Electron versions (new-window event)
    tab.view.webContents.on('new-window', (event, url) => {
      event.preventDefault();
      createTab(url);
    });
  }

  // Patch createTab to always attach the handler
  const _originalCreateTab = createTab;
  createTab = function(url) {
    const id = _originalCreateTab(url);
    const tab = tabs.find(t => t.id === id);
    attachTabOpenHandler(tab);
    return id;
  };

  // Attach handler to existing tabs on startup
  tabs.forEach(tab => attachTabOpenHandler(tab));
});
