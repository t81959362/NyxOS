# NyxOS Electron

This is the Electron desktop version of NyxOS, your modern React/TypeScript-based browser OS.


## How to run

1. Copy your existing `web` folder (with build, src, public, etc.) into this directory.

2. Install dependencies:

   ```sh
   npm install
   ```

3. Build the React app:

   ```sh
   npm run build
   ```

4. Start Electron:

   ```sh
   npm start
   ```


The app will launch as a native desktop window with full access to Electron APIs.


## Features

- All features of your web OS
- Can launch external URLs in new windows/tabs
- Ready for further native integrations


---

 
**Note:** For security, Electron windows use context isolation and no node integration in the renderer. Use the `electronAPI` bridge for native features.
