const fs = require('fs');
let baseConfig = require('./mygeotab-sygic-page/dist/config.json');
let driveConfig = require('./geotabdrive-sygic-addin/dist/config.json');
let openSygicConfig = require('./geotabdrive-start-sygic-addin/dist/config.json');
baseConfig.version = process.env.npm_package_version;
baseConfig.items.push(driveConfig.items[0]);
baseConfig.items.push(openSygicConfig.items[0]);
fs.writeFileSync('config.json', JSON.stringify(baseConfig, null, 2));
