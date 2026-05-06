#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');
const archiver = require('archiver');

const DEST_DIR = path.join(__dirname, '../dist');

const extractExtensionData = () => {
  const extPackageJson = require('../package.json');

  return {
    name: extPackageJson.name,
    version: extPackageJson.version
  }
};

const makeDestDirIfNotExists = () => {
  if(!fs.existsSync(DEST_DIR)) {
    fs.mkdirSync(DEST_DIR);
  }
}

const buildZip = (src, outputFile) => {
  console.info(`Building ${path.basename(outputFile)}...`);

  const archive = archiver('zip', { zlib: { level: 9 }});
  const stream = fs.createWriteStream(outputFile);
  
  return new Promise((resolve, reject) => {
    archive
      .directory(src, false)
      .on('error', err => reject(err))
      .pipe(stream);

    stream.on('close', () => resolve());
    archive.finalize();
  });
};

const main = () => {
  const {name, version} = extractExtensionData();
  const zipFilename = `${name}-v${version}.zip`;
  const tempZipPath = path.join(os.tmpdir(), zipFilename);
  const finalZipPath = path.join(DEST_DIR, zipFilename);

  makeDestDirIfNotExists();

  if (fs.existsSync(tempZipPath)) {
    fs.unlinkSync(tempZipPath);
  }

  if (fs.existsSync(finalZipPath)) {
    fs.unlinkSync(finalZipPath);
  }

  buildZip(DEST_DIR, tempZipPath)
    .then(() => {
      fs.renameSync(tempZipPath, finalZipPath);
      console.info('OK');
    })
    .catch(console.err); 
};

main();
