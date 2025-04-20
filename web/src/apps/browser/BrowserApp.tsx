// TypeScript declaration for electronBrowser
// This should ideally be in a global.d.ts but is included here for lint suppression
interface ElectronBrowserAPI {
  newTab: (url: string) => Promise<string>;
  switchTab: (id: string) => Promise<void>;
  closeTab: (id: string) => Promise<void>;
  navigate: (id: string, url: string) => Promise<void>;
  back: (id: string) => Promise<void>;
  forward: (id: string) => Promise<void>;
  reload: (id: string) => Promise<void>;
}
declare global {
  interface Window {
    electronBrowser: ElectronBrowserAPI;
  }
}

import React, { useState, useEffect, useRef } from 'react';
import './BrowserApp.scss';
import NyxIcon from '../../assets/Nyxlogo.png';
import ArrowBackIcon from '../../assets/icons/arrow-back.svg';
import ArrowForwardIcon from '../../assets/icons/arrow-forward.svg';
import ReloadIcon from '../../assets/icons/reload.svg';
import HomeIcon from '../../assets/icons/home.svg';

const DEFAULT_HOME = 'https://www.google.com/';

interface Tab {
  id: string;
  url: string;
  title: string;
}

export const BrowserApp: React.FC = () => {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [address, setAddress] = useState(DEFAULT_HOME);
  const [mediaState, setMediaState] = useState<{ playing: boolean, volume: number }>({ playing: false, volume: 1 });

  // Listen for media messages from webview
  useEffect(() => {
    function handleMediaMessage(event: MessageEvent) {
      if (event.data && event.data.type === 'media-state') {
        setMediaState(state => ({ ...state, playing: event.data.state === 'playing' }));
      }
      if (event.data && event.data.type === 'media-volume') {
        setMediaState(state => ({ ...state, volume: event.data.volume }));
      }
    }
    window.addEventListener('message', handleMediaMessage);
    return () => window.removeEventListener('message', handleMediaMessage);
  }, []);

  // Prevent reset to homepage on drag/move
  // Remove any logic that sets address to DEFAULT_HOME except on explicit new tab/home


  // Open a new tab
  const handleNewTab = async (url?: string) => {
    const tabUrl = url || DEFAULT_HOME;
    const id = Math.random().toString(36).substr(2, 9);
    setTabs(t => [...t, { id, url: tabUrl, title: tabUrl }]);
    setActive(id);
    setAddress(tabUrl);
  };

  // Switch tab
  const handleSwitchTab = (id: string) => {
    setActive(id);
    const tab = tabs.find(t => t.id === id);
    if (tab) setAddress(tab.url);
  };

  // Close tab
  const handleCloseTab = (id: string) => {
    setTabs(t => {
      const idx = t.findIndex(tab => tab.id === id);
      const newTabs = t.filter(tab => tab.id !== id);
      if (active === id) {
        if (newTabs.length > 0) {
          const nextIdx = Math.max(0, idx - 1);
          setActive(newTabs[nextIdx].id);
          setAddress(newTabs[nextIdx].url);
        } else {
          // Last tab closed, open a new one
          const newId = Math.random().toString(36).slice(2);
          setActive(newId);
          setAddress(DEFAULT_HOME);
          return [{ id: newId, url: DEFAULT_HOME, title: 'New Tab' }];
        }
      }
      // If no tabs left, setActive to null (should not happen)
      if (newTabs.length === 0) setActive(null);
      return newTabs;
    });
  };

  // Navigate
  const handleNavigate = (url: string) => {
    if (active) {
      setTabs(t => t.map(tab => tab.id === active ? { ...tab, url } : tab));
      setAddress(url);
    }
  };

  // Address bar submit
  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleNavigate(address);
  };

  // Navigation controls
  // Store refs to all webviews
  const webviewRefs = useRef<{ [id: string]: any }>({});

  const handleBack = () => {
    if (active) {
      const webview = webviewRefs.current[active];
      if (webview) (webview as any).goBack();
    }
  };
  const handleForward = () => {
    if (active) {
      const webview = webviewRefs.current[active];
      if (webview) (webview as any).goForward();
    }
  };
  const handleReload = () => {
    if (active) {
      const webview = webviewRefs.current[active];
      if (webview) (webview as any).reload();
    }
  };


  // On first mount, open a home tab
  useEffect(() => {
    if (tabs.length === 0) handleNewTab(DEFAULT_HOME);
    // eslint-disable-next-line
  }, []);

  // Persist state to localStorage (tabs and active tab only)
  useEffect(() => {
    localStorage.setItem('os_browser_tabs', JSON.stringify(tabs));
  }, [tabs]);
  useEffect(() => {
    localStorage.setItem('os_browser_active', JSON.stringify(active));
  }, [active]);

  return (
    <div className="browser-app-root" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Chrome-like Tab Bar */}
      <div className="chrome-tabbar">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`chrome-tab${tab.id === active ? ' active' : ''}`}
            onClick={() => handleSwitchTab(tab.id)}
            title={tab.url}
          >
            {/* Favicon */}
            <img
              src={`https://www.google.com/s2/favicons?sz=32&domain_url=${encodeURIComponent(tab.url)}`}
              className="chrome-tab-favicon"
              alt="favicon"
              onError={e => (e.currentTarget.src = NyxIcon)}
            />
            <span className="chrome-tab-title">{tab.title && tab.title !== tab.url ? tab.title : tab.url.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/$/, '').split(/[/?#]/)[0]}</span>
            {/* To integrate Brave's adblock core, see comment at top of file */}
            <button
              className="chrome-tab-close"
              onClick={e => { e.stopPropagation(); handleCloseTab(tab.id); }}
              title="Close Tab"
            >
              ×
            </button>
          </div>
        ))}
        <button className="chrome-tab-add" title="New Tab" onClick={() => handleNewTab()}>+</button>
      </div>

      {/* Chrome-like Toolbar */}
      <div className="chrome-toolbar">
        <div className="chrome-toolbar-left">
          <button
            className="chrome-nav-btn"
            onClick={handleBack}
            disabled={!active}
            title="Back"
          >
            <img src={ArrowBackIcon} alt="Back" width={20} height={20} />
          </button>
          <button
            className="chrome-nav-btn"
            onClick={handleForward}
            disabled={!active}
            title="Forward"
          >
            <img src={ArrowForwardIcon} alt="Forward" width={20} height={20} />
          </button>
          <button
            className="chrome-nav-btn"
            onClick={handleReload}
            disabled={!active}
            title="Reload"
          >
            <img src={ReloadIcon} alt="Reload" width={20} height={20} />
          </button>
        </div>
        <form className="chrome-address-form" onSubmit={handleAddressSubmit}>
          <input
            className="chrome-address-bar"
            value={address}
            onChange={e => setAddress(e.target.value)}
            spellCheck={false}
            autoComplete="off"
            placeholder="Search Google or type a URL"
            aria-label="Address bar"
          />
        </form>
        <div className="chrome-toolbar-right">
          {/* Placeholder for future: profile, menu, extensions */}
        </div>
      </div>
      {/* The BrowserView content appears below this UI */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        {tabs.map(tab => (
          tab.id === active && (
            <webview
              key={tab.id}
              id={tab.id}
              ref={(el: HTMLWebViewElement | null) => {
                if (el) {
                  webviewRefs.current[tab.id] = el;
                  // Attach dom-ready event listener only once
                  el.addEventListener('dom-ready', (e: Event) => {
                    const webview = webviewRefs.current[tab.id];
                    if (webview) {
                      // Update tab title and url on navigation
                      webview.addEventListener('page-title-updated', (event: any) => {
                        setTabs(tabs => tabs.map(t => t.id === tab.id ? { ...t, title: event.title } : t));
                      });
                      webview.addEventListener('did-navigate', (event: any) => {
                        setTabs(tabs => tabs.map(t => t.id === tab.id ? { ...t, url: event.url } : t));
                      });
                      // Inject media listeners
                      webview.executeJavaScript(`
                        function notifyMediaState(state) {
                          window.parent.postMessage({ type: 'media-state', state }, '*');
                        }
                        function notifyVolume(volume) {
                          window.parent.postMessage({ type: 'media-volume', volume }, '*');
                        }
                        function updateListeners() {
                          const elems = [...document.querySelectorAll('audio,video')];
                          elems.forEach(el => {
                            el.onplay = () => notifyMediaState('playing');
                            el.onpause = () => notifyMediaState('paused');
                            el.onvolumechange = () => notifyVolume(el.volume);
                          });
                        }
                        updateListeners();
                        new MutationObserver(updateListeners).observe(document.body, { childList: true, subtree: true });
                      `);
                      // Inject basic adblock (uBlock Origin-like)
                      webview.executeJavaScript(`
                        // Remove common ad elements
                        const adSelectors = [
                          '[id*="ad" i]', '[class*="ad" i]', '[class*="ads" i]', '[class*="sponsor" i]', '[class*="banner" i]', '[class*="promo" i]',
                          'iframe[src*="ad" i]', 'iframe[src*="ads" i]', 'iframe[src*="doubleclick" i]', 'iframe[src*="googlesyndication" i]'
                        ];
                        function removeAds() {
                          adSelectors.forEach(sel => {
                            document.querySelectorAll(sel).forEach(el => el.remove());
                          });
                          // YouTube-specific: skip video ads
                          if (window.location.hostname.includes('youtube.com')) {
                            const skipBtn = document.querySelector('.ytp-ad-skip-button, .ytp-ad-overlay-close-button');
                            if (skipBtn) skipBtn.click();
                            document.querySelectorAll('.ad-showing, .ytp-ad-module').forEach(el => el.remove());
                          }
                        }
                        setInterval(removeAds, 1200);
                      `);
                      // Listen for set-volume messages from parent
                      window.addEventListener('message', (ev: MessageEvent) => {
                        if (ev.data && ev.data.type === 'set-media-volume') {
                          webview.executeJavaScript(`
                            [...document.querySelectorAll('audio,video')].forEach(el => { el.volume = ${ev.data.volume}; });
                          `);
                        }
                      });
                    }
                  });
                } else {
                  delete webviewRefs.current[tab.id];
                }
              }}
              src={tab.url}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', background: '#fff' }}
              allowpopups={true}
            />
          )
        ))}
      </div>
    </div>
  );
}

export default BrowserApp;
