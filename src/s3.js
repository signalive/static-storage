'use strict';

const fs = require('fs');
const awsSdk = require('aws-sdk');
const debug = require('debug')('staticstorage:s3');

class s3 {
  constructor(configParams) {
    this.config = configParams;
    this.tmpFolderPath = configParams.staticstorage.tmpFolderPath;
    this.bucketName = configParams.aws.s3.bucket;
    awsSdk.config.update(configParams.aws.general);
    this.awsS3 = new awsSdk.S3();
  }

  /**
   * Uploads a file from local fs to the s3 bucket.
   * @param {string} src
   * @param {string} dst
   * @returns {Promise}
   */
  upload(src, dst) {
      return this.uploadToS3(src, {
          Bucket: this.bucketName,
          Key: dst,
          ACL: 'public-read'
      });
  }


  /**
   * Uploads a file from local fs to the tmp folder in the s3 bucket.
   * @param {string} src
   * @param {string} dst
   * @returns {Promise}
   */
  uploadToTmp(src, dst) {
      return this.uploadToS3(src, {
          Bucket: this.bucketName,
          Key: this.tmpFolderPath + '/' + dst,
          ACL: 'public-read'
      });
  }

  /**
   * Generic list method to list files of current s3 bucket.
   * @returns {Promise}
   */
  listBucketObjects() {
      return new Promise((resolve, reject) => {
          this.awsS3.listObjects({ Bucket: this.bucketName }, (err, data) => {
              if (err) {
                  debug('S3 listing failed.', err);
                  return reject(err);
              }

              debug('S3 listing succeeded:');
              resolve(data);
          });
      });
  }


  /**
   * Generic upload method to upload a file from the local fs to the s3 bucket.
   * @param {string} file
   * @param {Object} params
   * @returns {Promise}
   */
  uploadToS3(file, params) {
      return new Promise((resolve, reject) => {
          debug('Uploading from local "%s" to bucket named "s3" as "%s".', file, this.bucketName);
          const readStream = fs.createReadStream(file);
          readStream.on('open', () => {
              debug('Started to read input and upload to s3.');

              params.Body = readStream;
              this.awsS3.putObject(params, (err, data) => {
                  if (err) {
                      debug('S3 upload failed.', err);
                      return reject(err);
                  }

                  debug('S3 upload succeeded.');
                  resolve(data);
              });
          });
      });
  }


  /**
   * Removes an existing file.
   * @param {string} path
   * @returns {Promise}
   */
  remove(path) {
      debug('Removing from bucket named "s3" as "%s".', this.bucketName, path);
      return new Promise((resolve, reject) => {
          var params = {
              Bucket: bucketName,
              Key: path
          };

          debug('Started to read input and upload to s3.');
          this.awsS3.deleteObject(params, (err, data) => {
              if (err) {
                  debug('Could not delete file: ' + path, err);
                  return reject(err);
              }

              debug('File deleted: ' + path);
              resolve();
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
      return new Promise((resolve, reject) => {
          debug('Copying file ' + src + ' to ' + dst + '.');
          this.awsS3.copyObject({
              Bucket: this.bucketName,
              copySource: src,
              Key: dst,
              ACL: 'public-read'
          }, (err, data) => {
              if (err) {
                  debug('Could not copy file.', err);
                  return reject(err);
              }

              debug('File copied.');
              resolve();
          });
      });
  }


  /**
   * Moves file.
   * @param {string} from
   * @param {string} to
   * @returns {Promise}
   */
  move(src, dst) {
      return this.copy(src, dst)
          .then(() => this.remove(src));
  }
}

module.exports = s3;
