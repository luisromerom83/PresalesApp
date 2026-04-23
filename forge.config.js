const path = require('path');

module.exports = {
    packagerConfig: {
        asar: true,
        executableName: 'presales',
    },
    rebuildConfig: {},
    makers: [
        {
            name: '@electron-forge/maker-squirrel',
            config: {
                name: "PresalesConfigManager",
            },
        },
        {
            name: '@electron-forge/maker-rpm',
            config: {},
        }
    ],
    plugins: [
        {
            name: '@electron-forge/plugin-auto-unpack-natives',
            config: {},
        }
    ],
};
