const fs = require('fs');
let baseConfig = require('./mygeotab-sygic-page/dist/config.json');
let driveConfig = require('./geotabdrive-sygic-addin/dist/config.json');
let startSygicConfig = require('./geotabdrive-start-sygic-addin/dist/config.json');

// combine mygeotab-sygic-page and geotabdrive-sygic-addin
baseConfig.items.push(driveConfig.items[0]);

// store to respective version folders
let releaseDirPath = `./dist/${process.env.npm_package_version}/`
let latestDirPath = `./dist/latest/`
fs.mkdirSync(releaseDirPath, { recursive: true});

let combinedConfigString = JSON.stringify(baseConfig, null, 2);
let startSygicString = JSON.stringify(startSygicConfig, null, 2);

fs.writeFileSync(`${releaseDirPath}/truck-settings-config.json`, combinedConfigString);
fs.writeFileSync(`${releaseDirPath}/start-sygic-config.json`, startSygicString);

// store @latest
console.log(process.env.npm_package_version)
combinedConfigString = combinedConfigString.replaceAll(process.env.npm_package_version, "latest")
console.log(combinedConfigString)
startSygicString = startSygicString.replaceAll(process.env.npm_package_version, "latest")
fs.writeFileSync(`${latestDirPath}/truck-settings-config.json`, combinedConfigString);
fs.writeFileSync(`${latestDirPath}/start-sygic-config.json`, startSygicString);

