// DesktopShortcut type inlined locally
export interface DesktopShortcut {
  id: string;
  name: string;
  icon: string;
  app: string;
}

export const desktopShortcuts: DesktopShortcut[] = [
  {
    id: 'explorer',
    name: 'File Explorer',
    icon: '🗂️',
    app: 'explorer',
  },
  {
    id: 'nyxnet',
    name: 'NyxNet',
    icon: '🌐',
    app: 'nyxnet',
  },
  {
    id: 'terminal',
    name: 'Terminal',
    icon: '🖥️',
    app: 'terminal',
  },
  {
    id: 'textedit',
    name: 'Text Editor',
    icon: '📝',
    app: 'textedit',
  },
  {
    id: 'package-manager',
    name: 'Package Manager',
    icon: '📦',
    app: 'package-manager',
  },
  {
    id: 'settings',
    name: 'Settings',
    icon: '⚙️',
    app: 'settings',
  },
];
