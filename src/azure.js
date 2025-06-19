'use strict';

const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp-then');
const azure = require('azure-storage');
const debug = require('debug')('static-storage:azurestorage');


class AzureStorage {
    constructor(configParams) {
        this.config = configParams;
        this.tmpFolderPath = configParams.staticstorage.tmpFolderPath.slice(1);
        this.containerName = this.config.azure.containerName;
        this.blobService = azure.createBlobService(configParams.azure.accountName, configParams.azure.accountKey);
        this.checkContainer(this.containerName);
    }

    checkContainer(containerName) {
        return new Promise((resolve, reject) => {
            this.blobService
                .createContainerIfNotExists(containerName,
                {publicAccessLevel: 'blob'},
                (error, result, response) => {
                    if (error) return reject(err);
                    if (result)
                        debug(`Container ${containerName} was created`);
                    else
                        debug(`Found container ${containerName}`);
                    resolve();
                });
        });
    }


    /**
     * Uploads a file from local fs to the s3 bucket.
     * @param {string} src
     * @param {string} dst
     * @returns {Promise}
     */
    upload(src, dst) {
        return new Promise((resolve, reject) => {
            this.blobService.createBlockBlobFromLocalFile(
                this.containerName, dst, src,
                (err, result, response) => {
                    if (err)
                        return reject(err);
                    resolve();
            });
        });
    }


    /**
     * Uploads a file from local fs to the tmp folder in the s3 bucket.
     * @param {string} src
     * @param {string} dst
     * @returns {Promise}
     */
    uploadToTmp(src, dst) {
        return this.upload(src, path.join(this.tmpFolderPath, dst));
    }


    /**
     * Generic list method to list files of current s3 bucket.
     * @returns {Promise}
     */
    listFiles() {
        return this.listFiles_('');
    }


    listFiles_(folder) {
        let response = {
            Contents: []
        };

        // Promisify `listBlobsSegmented`
        const listObjects_ = (continuationToken) => {
            return new Promise((resolve, reject) => {
                this.blobService.listBlobsSegmentedWithPrefix(this.containerName, folder, continuationToken, (err, result) => {
                    if (err) return reject(err);
                    resolve(result);
                });
            });
        }

        // Recursive list method
        const list_ = (opt_continuationToken) => {
            return listObjects_(opt_continuationToken)
                .then(response_ => {
                    const {entries, continuationToken} = response_;
                    response.Contents = response.Contents.concat(entries);

                    if (continuationToken)
                        return list_(continuationToken);

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
                    new Date().getTime() + (Math.random() + 1).toString(36).substring(6) + downloadPath.slice(downloadPath.lastIndexOf('.')));

                this.blobService.getBlobToLocalFile(
                    this.containerName, downloadPath, tmpFileName,
                    (err, blob) => {
                        if (err) {
                            return reject(err);
                        } else {
                            resolve(tmpFileName)
                        }
                    });
            }));
    }


    /**
     * Removes an existing file.
     * @param {string} path
     * @returns {Promise}
     */
    remove(path) {
        debug(`Removing ${path} from container ${this.bucketName}.`);
        return new Promise((resolve, reject) => {
            this.blobService.deleteBlob(this.containerName, path, (err, data) => {
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
        return this
            .listFiles_(folderPath)
            .then(result =>
                Promise.all(result.Contents.map(blob => this.remove(blob.name))))
            .then(_ => undefined);
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
            const sourceUrl = this.getUrl_(src);
            this.blobService.startCopyBlob(sourceUrl, this.containerName, dst, (err, response) => {
                if (err) {
                    debug('Could not copy file.', err);
                    return reject(err);
                }
                debug(`File ${src} was copied to ${dst}.`);
                resolve(response);
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


    getProperties_(src) {
        return new Promise((resolve, reject) => {
            this.blobService
                .getBlobProperties(this.containerName, src, (err, properties) => {
                    if (err) return reject(err);
                    resolve(properties)
                });
        });
    }

    getUrl_(src) {
        const tokenStartDate = new Date();
        const tokenExpireDate = tokenStartDate.getMonth() == 11 ? new Date(tokenStartDate.getFullYear() + 1, 0, 1) : new Date(tokenStartDate.getFullYear(), tokenStartDate.getMonth() + 1, 1);

        const sharedAccessPolicy = {
          AccessPolicy: {
            Permissions: azure.BlobUtilities.SharedAccessPermissions.READ,
            Start: tokenStartDate,
            Expiry: tokenExpireDate
          },
        };

        const sasToken = this.blobService.generateSharedAccessSignature(this.containerName, src, sharedAccessPolicy);
        return this.blobService.getUrl(this.containerName, src, sasToken);
    }


    getFileSizeInBytes(src) {
        return this
            .getProperties_(src)
            .then(properties => parseInt(properties.contentLength, 10));
    }
}

module.exports = AzureStorage;
