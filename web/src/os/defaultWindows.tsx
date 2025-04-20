import React from 'react';
import { FileExplorer } from '../apps/file_explorer/FileExplorer';
import { TextEditor } from '../apps/text_editor/TextEditor';
import { Terminal } from '../apps/terminal/Terminal';
import { Settings } from '../apps/settings/Settings';
import { BrowserApp } from '../apps/browser/BrowserApp';
import PackageManager from '../apps/package-manager';

export const appStubs = [
  {
    id: 'explorer',
    title: 'File Explorer',
    icon: '🗂️',
    content: () => <FileExplorer />,
    width: 700,
    height: 520,
    top: 120,
    left: 420,
    zIndex: 10
  },
  {
    id: 'nyxnet',
    title: 'NyxNet',
    icon: '🌐',
    content: () => <BrowserApp />,
    width: 900,
    height: 600,
    top: 80,
    left: 80,
    zIndex: 10
  },
  {
    id: 'terminal',
    title: 'Terminal',
    icon: '🖥️',
    content: () => <Terminal />,
    width: 420,
    height: 260,
    top: 170,
    left: 320,
    zIndex: 10
  },
  {
    id: 'textedit',
    title: 'Text Editor',
    icon: '📝',
    content: () => <TextEditor />,
    width: 700,
    height: 520,
    top: 120,
    left: 420,
    zIndex: 10
  },
  {
    id: 'package-manager',
    title: 'Package Manager',
    icon: '📦',
    content: () => <PackageManager />,
    width: 700,
    height: 520,
    top: 120,
    left: 420,
    zIndex: 10
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: '⚙️',
    content: () => <Settings />,
    width: 350,
    height: 220,
    top: 220,
    left: 400,
    zIndex: 10
  }
];
