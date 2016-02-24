'use strict';

const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp-promise');
const debug = require('debug')('staticstore:local');
const rmdir = require('rimraf');


class local {
  constructor(configParams) {
      this.config = configParams;
      this.tmpFolderPath = configParams.staticstorage.tmpFolderPath;
      this.rootPath = configParams.staticstorage.rootPath;

      mkdirp(path.join(this.rootPath, this.tmpFolderPath));
  }

  /**
   * Adds slash if str params not has on first.
   * @param {String} str
   * @returns {string}
   * @private
   */
  addSlash_(str) {
      if (!str || str[0] == '/') return str;
      return '/' + str;
  }


  /**
   * Uploads a file from local fs to the cdn.
   * @param {string} src
   * @param {string} dst
   * @returns {Promise}
   */
  upload(src, dst) {
      return this.uploadToLocal(src, path.join(this.rootPath, dst));
  }


  /**
   * Uploads a file from local fs to the tmp folder of the cdn.
   * @param {string} src
   * @param {string} dst
   * @returns {Promise}
   */
  uploadToTmp(src, dst) {
      return this.uploadToLocal(src, path.join(this.rootPath, this.tmpFolderPath, dst));
  }


  /**
   * Generic upload method to upload a file to local.
   * @param {string} src
   * @param {Object} dst
   * @returns {Promise}
   */
  uploadToLocal(src, dst) {
      debug(`Uploading from "${src}" to "${dst}".`);
      const dstFolder = dst.slice(0, dst.lastIndexOf('/'));
      return mkdirp(dstFolder)
          .then(done => this.copy(src, dst));
  }


  /**
   * Generic download method.
   * @param {string} path
   * @returns {Promise}
   */
  downloadToLocalTmp(path) {
      return new Promise((resolve, reject) => {
          const tmpFileName = this.tmpFolderPath +
              this.addSlash_(new Date().getTime() + path.slice(path.lastIndexOf('.')));

          const readStream = fs.createReadStream(path);
          const writeStream = fs.createWriteStream(tmpFileName);

          readStream.on('open', () => {
              debug('Read stream is open, starting to pipe.');
              readStream.pipe(writeStream);
          });

          writeStream.on('error', err => {
              debug('An error occured.');
              reject(err);
          });

          writeStream.on('finish', () => {
              debug('Writing stream finished.');
              resolve(tmpFileName);
          });
      });
  }


  /**
   * Removes an existing file.
   * @param {string} removePath
   * @returns {Promise}
   */
  remove(removePath) {
      debug('Removing file at', removePath);
      return new Promise((resolve, reject) => {
          fs.lstat(removePath, (err, stats) => {
              if (err) return reject(err);

              if (stats.isDirectory()) {
                  debug('Removing folder "%s".', removePath);
                  rmdir(removePath, err => {
                      if (err) return reject(err);
                      resolve();
                  });
              } else {
                  debug('Removing file "%s".', removePath);
                  fs.unlink(removePath, err => {
                      if (err) return reject(err);
                      resolve();
                  });
              }
          });
      });
  }


  /**
   * Copies an existing file by absolute source and destination paths.
   * @param {string} src
   * @param {string} dst
   * @returns {Promise}
   */
  copy(src, dst) {
      debug('Copying file from %s to %s', src, dst);
      dst = this.rootPath + this.addSlash_(dst);
      const dstFolder = dst.slice(0, dst.lastIndexOf('/'));
      return mkdirp(dstFolder)
          .then(() => {
              return new Promise((resolve, reject) => {
                  var readStream = fs.createReadStream(src);
                  var writeStream = fs.createWriteStream(dst);

                  readStream.on('open', function() {
                      debug('Read stream is open, starting to pipe.');
                      readStream.pipe(writeStream);
                  });

                  writeStream.on('error', err => {
                      debug('An error occured.');
                      reject(err);
                  });

                  writeStream.on('finish', () => {
                      debug('Writing stream finished.');
                      resolve(src);
                  });
              });
          });
  }


  /**
   * Moves file.
   * @param {string} src
   * @param {string} dst
   * @returns {Promise}
   */
  move(src, dst) {
      return this.copy(src, dst)
          .then(() => this.remove(src));
  }
}


module.exports = local;
