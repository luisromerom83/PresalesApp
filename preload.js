const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    selectDirectory: () => ipcRenderer.invoke('select-directory'),
    saveFile: (directory, filename, data) => ipcRenderer.invoke('save-file', { directory, filename, data }),
    loadFile: (directory, filename) => ipcRenderer.invoke('load-file', { directory, filename }),
    getSettings: () => ipcRenderer.invoke('get-settings'),
    saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
    copyFileToDir: (sourcePath, destDir) => ipcRenderer.invoke('copy-file-to-dir', { sourcePath, destDir }),
    migrateFiles: (sourceDir, destDir) => ipcRenderer.invoke('migrate-files', { sourceDir, destDir }),
    openExternalUrl: (url) => ipcRenderer.invoke('open-external-url', url),
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    downloadUpdate: () => ipcRenderer.invoke('download-update'),
    installUpdate: () => ipcRenderer.invoke('install-update'),
    onUpdateAvailable: (callback) => ipcRenderer.on('update-available', (event, info) => callback(info)),
    onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', (event, info) => callback(info)),
    onUpdateProgress: (callback) => ipcRenderer.on('update-progress', (event, progress) => callback(progress)),
    onUpdateError: (callback) => ipcRenderer.on('update-error', (event, error) => callback(error)),
    checkDirectory: (dir) => ipcRenderer.invoke('check-directory', dir)
});
