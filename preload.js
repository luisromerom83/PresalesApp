const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    selectDirectory: () => ipcRenderer.invoke('select-directory'),
    saveFile: (directory, filename, data) => ipcRenderer.invoke('save-file', { directory, filename, data }),
    loadFile: (directory, filename) => ipcRenderer.invoke('load-file', { directory, filename }),
    getSettings: () => ipcRenderer.invoke('get-settings'),
    saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
    copyFileToDir: (sourcePath, destDir) => ipcRenderer.invoke('copy-file-to-dir', { sourcePath, destDir }),
    migrateFiles: (sourceDir, destDir) => ipcRenderer.invoke('migrate-files', { sourceDir, destDir }),
    openExternalUrl: (url) => ipcRenderer.invoke('open-external-url', url)
});
