'use strict';

const fs = require('fs');
const mkdirp = require('mkdirp-promise');
const debug = require('debug')('staticstore:local');

class local {
  constructor(configParams) {
      this.config = configParams;
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
      return this.uploadToLocal(src, config.rootPath + this.addSlash(dst));
  }


  /**
   * Uploads a file from local fs to the tmp folder of the cdn.
   * @param {string} src
   * @param {string} dst
   * @returns {Promise}
   */
  uploadToTmp(src, dst) {
      return this.uploadToLocal(src, config.rootPath + tmpFolderPath + this.addSlash(dst));
  }


  /**
   * Generic upload method to upload a file from the local fs to cdn.
   * @param {string} file
   * @param {Object} params
   * @returns {Promise}
   */
  uploadToLocal(src, dst) {
      debug(`Uploading from "${src}" to "${dst}".`);
      const dstFolder = dst.slice(0, dst.lastIndexOf('/'));
      return mkdirp(dstFolder)
          .then(done => copy_(src, dst));
  }


  /**
   * Removes an existing file.
   * @param {string} path
   * @returns {Promise}
   */
  remove(path) {
      return new Promise((resolve, reject) => {
          fs.unlink(config.rootPath + this.addSlash(path), err => {
              if (err) return reject(err);
              resolve();
          });
      });
  }


  /**
   * Copies an existing file by absolute source and destination paths.
   * @param {string} src
   * @param {string} dst
   * @returns {Promise}
   */
  copy_(src, dst) {
      debug(`Copying file from ${src} to ${dst}`);
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
                      resolve();
                  });
              });
          });
  }


  /**
   * Copies an existing file to a new location.
   * @param {string} src
   * @param {string} dst
   * @returns {Promise}
   */
  copy(src, dst) {
      return this.copy_(config.rootPath + this.addSlash(src), config.rootPath + this.addSlash(dst));
  }


  /**
   * Moves file.
   * @param {string} from
   * @param {string} to
   * @returns {Promise}
   */
  move(src, dst) {
      return copy(src, dst)
          .then(() => remove(src));
  }
}


module.exports = local;
