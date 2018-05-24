'use strict';

const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp-then');
const awsSdk = require('aws-sdk');
const debug = require('debug')('static-storage:s3');
const MimeDetector = require('mime-types');
MimeDetector.types.gz = 'application/x-gzip';


class s3 {
    constructor(configParams) {
        this.config = configParams;
        this.tmpFolderPath = configParams.staticstorage.tmpFolderPath.slice(1);
        this.bucketName = configParams.aws.s3.bucket;
        awsSdk.config.update(configParams.aws.general);
        this.awsS3 = new awsSdk.S3();
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
            Key: this.tmpFolderPath + this.addSlash_(dst),
            ACL: 'public-read'
        });
    }


    /**
     * Generic list method to list files of current s3 bucket.
     * @returns {Promise}
     */
    listFiles() {
        const MAX_KEYS_COUNT = 1000;
        let response = null;

        // Promisify `awsS3.listObjects`
        const listObjects_ = (options) => {
            return new Promise((resolve, reject) => {
                this.awsS3.listObjects(options, (err, data) => {
                    if (err) return reject(err);
                    resolve(data);
                });
            });
        }

        // Recursive list method
        const list_ = (opt_marker) => {
            const options = {
                Bucket: this.bucketName,
                MaxKeys: MAX_KEYS_COUNT,
                Marker: opt_marker || ''
            };

            return listObjects_(options)
                .then((response_) => {
                    if (!response)
                        response = response_;

                    const contents = response_.Contents;
                    response.Contents = response.Contents.concat(contents);

                    if (contents.length == MAX_KEYS_COUNT) {
                        const lastContent = contents[contents.length - 1];
                        return list_(lastContent.Key);
                    }

                    return response;
                });
        }

        return list_();
    }


    /**
     * Generic download method.
     * @param {string} downloadPath
     * @returns {Promise}
     */
    downloadToLocalTmp(downloadPath) {
        return mkdirp(path.join('./', this.tmpFolderPath))
            .then(() => new Promise((resolve, reject) => {
                const tmpFileName = path.join('./', this.tmpFolderPath,
                    new Date().getTime() + downloadPath.slice(downloadPath.lastIndexOf('.')));

                const params = {
                    Bucket: this.bucketName,
                    Key: downloadPath
                };
                const writeStream = fs.createWriteStream(tmpFileName);
                const readStream = this.awsS3.getObject(params).createReadStream();

                readStream.pipe(writeStream);

                readStream.on('error', err => {
                    debug('An error occured trying to read.');
                    reject(err);
                });

                writeStream.on('error', err => {
                    debug('An error occured.');
                    reject(err);
                });

                writeStream.on('finish', () => {
                    debug('Writing stream finished.');
                    resolve(tmpFileName);
                });
            }));
    }


    /**
     * Generic upload method to upload a file from the local fs to the s3 bucket.
     * @param {string} file
     * @param {Object} params
     * @returns {Promise}
     */
    uploadToS3(file, params) {
        return new Promise((resolve, reject) => {
            debug(`Uploading from local ${file} to bucket ${this.bucketName}.`);
            debug(`Params:`, params);
            const readStream = fs.createReadStream(file);

            readStream.on('error', err => {
                debug('An error occured trying to read.');
                reject(err);
            });

            readStream.on('open', () => {
                debug('Started to read input and upload to s3.');

                params.Body = readStream;
                params.ContentType = MimeDetector.lookup(path.extname(file)) || 'application/octet-stream';

                this.awsS3.putObject(params, (err, data) => {
                    if (err) {
                        debug('S3 upload failed.', err);
                        return reject(err);
                    }

                    debug('S3 upload succeeded.', data);
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
        debug(`Removing ${path} from bucket ${this.bucketName}.`);
        return new Promise((resolve, reject) => {
            const params = {
                Bucket: this.bucketName,
                Key: path
            };

            debug('Started to read input and upload to s3.');
            this.awsS3.deleteObject(params, (err, data) => {
                if (err) {
                    debug(`Could not delete file: ${path}`, err);
                    return reject(err);
                }

                debug(`File deleted: ${path}`);
                resolve();
            });
        });
    }


    /**
     * Removes entire folder and its subfolders
     * @param  {string} folderPath
     * @return {Promise}
     */
    removeFolder(folderPath) {
        debug(`Removing folder at ${folderPath}`);
        return new Promise((resolve, reject) => {
            this.awsS3.listObjects({
                Bucket: this.bucketName,
                Prefix: folderPath
            }, (err, data) => {
                if (err) {
                    debug('S3 listing failed.', err);
                    return reject(err);
                }

                if (data.Contents.length == 0) resolve();

                this.awsS3.deleteObjects({
                    Bucket: this.bucketName,
                    Delete: {
                        Objects: data.Contents.map(obj => ({Key: obj.Key}))
                    }
                }, err => {
                    if (err) return reject(err);

                    debug(`Successfully removed folder at ${folderPath}`);
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
        return new Promise((resolve, reject) => {
            debug(`Copying file ${src} to ${dst}.`);
            this.awsS3.copyObject({
                Bucket: this.bucketName,
                CopySource: this.bucketName + this.addSlash_(src),
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
     * @param {string} src Path of source file.
     * @param {string} dst Path of distance file.
     * @returns {Promise}
     */
    move(src, dst) {
        return this
            .copy(src, dst)
            .then(() => this.remove(src));
    }


    stats_(src) {
        const params = {
            Bucket: this.bucketName,
            Key: src
        };

        return new Promise((resolve, reject) => this.awsS3.headObject(params, (err, stats) => {
            if (err) reject(err);
            else resolve(stats);
        }));
    }


    getFileSizeInBytes(src) {
        return this
            .stats_(src)
            .then(metadata => parseInt(metadata.ContentLength, 10));
    }
}

module.exports = s3;
