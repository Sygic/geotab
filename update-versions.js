const fs = require('fs');

function updateFile(file) {
    let content = require(file);
    content.version = process.env.npm_package_version;
    fs.writeFileSync(file, JSON.stringify(content, null, 2));
}

updateFile('./mygeotab-sygic-page/package.json');
updateFile('./geotabdrive-sygic-addin/package.json');
updateFile('./geotabdrive-start-sygic-addin/package.json');
