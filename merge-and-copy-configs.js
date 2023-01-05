const fs = require('fs');
let baseConfig = require('./mygeotab-sygic-page/dist/config.json');
let driveConfig = require('./geotabdrive-sygic-addin/dist/config.json');
baseConfig.version = process.env.npm_package_version;
baseConfig.items.push(driveConfig.items[0]);

let dirPath = `./dist/${baseConfig.version}/`
fs.mkdirSync(dirPath, { recursive: true});
fs.writeFileSync(`${dirPath}/truck-settings-config.json`, JSON.stringify(baseConfig, null, 2));


let startSygicConfig = require('./geotabdrive-start-sygic-addin/dist/config.json');
fs.writeFileSync(`${dirPath}/start-sygic-config.json`, JSON.stringify(startSygicConfig, null, 2));
