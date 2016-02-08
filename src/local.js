'use strict';

const fs = require('fs');
const mkdirp = require('mkdirp-promise');
const debug = require('debug')('staticstore:local');
const rmdir = require('rimraf');

class local {
  constructor(configParams) {
      this.config = configParams;
      this.tmpFolderPath = configParams.staticstorage.tmpFolderPath;
      this.rootPath = configParams.staticstorage.rootPath;
  }

  addSlash(str) {
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
      return this.uploadToLocal(src, this.rootPath + this.addSlash(dst));
  }


  /**
   * Uploads a file from local fs to the tmp folder of the cdn.
   * @param {string} src
   * @param {string} dst
   * @returns {Promise}
   */
  uploadToTmp(src, dst) {
      return this.uploadToLocal(src, this.tmpFolderPath + this.addSlash(dst));
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
   * Generic read method to read file.
   * @param {string} path
   * @returns {Promise}
   */
  read(path) {
      return new Promise((resolve, reject) => {

          fs.readFile(path, function (err,data) {
              if (err) {
                  debug('An error occured.');
                  return reject(err);
              }

              debug('File read succeeded:');
              resolve(data);
          });

      });
  }


  /**
   * Removes an existing file.
   * @param {string} path
   * @returns {Promise}
   */
  remove(path) {
      return new Promise((resolve, reject) => {
          path = this.rootPath + this.addSlash(path);

          fs.lstat(path, (err, stats) => {
              if (err) return reject(err);

              if (stats.isDirectory()) {
                  debug('Removing folder "%s".', path);
                  rmdir(path, err => {
                      if (err) return reject(err);
                      resolve();
                  });
              } else {
                  debug('Removing file "%s".', path);
                  fs.unlink(path, err => {
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
      dst = this.rootPath + this.addSlash(dst);
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
