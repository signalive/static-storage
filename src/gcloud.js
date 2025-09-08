'use strict';

const path = require('path');
const mkdirp = require('mkdirp-then');
const { Storage } = require('@google-cloud/storage');
const debug = require('debug')('static-storage:gcloud');


class GCloud {
    constructor(configParams) {
        this.config = configParams;
        this.tmpFolderPath = configParams.staticstorage.tmpFolderPath.slice(1);
        this.bucketName = configParams.gcloud.bucketName;
        this.instance = new Storage({
          projectId: configParams.gcloud.projectId
        });
        this.checkContainer();
    }


    /**
     * Create bucket on initialization.
     * @return {Promise}
     */
    checkContainer() {
        debug(`Checking if bucket exists: ${this.bucketName}`);
        return this.instance
            .getBuckets()
            .then(buckets => {
                return buckets[0] && buckets[0].filter(b => b.name === this.bucketName).length;
            })
            .then(bucketExists => {
                if (!bucketExists) {
                    debug(`Creating bucket: ${this.bucketName}`);
                    return this.instance.createBucket(this.bucketName);
                }

                debug(`Bucket already exists ${this.bucketName}`);
            });
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
     * Uploads a file from local fs to the google cloud bucket.
     * @param {string} src
     * @param {string} dst
     * @returns {Promise}
     */
    upload(src, dst) {
        return this.instance
            .bucket(this.bucketName)
            .upload(src, {
                destination: this.addSlash_(dst)
            })
            .then(response => {
                debug(`Upload finished for ${src}`);
                return response[0];
            });
    }


    /**
     * Uploads a file from local fs to the tmp folder in the google cloud bucket.
     * @param {string} src
     * @param {string} dst
     * @returns {Promise}
     */
    uploadToTmp(src, dst) {
        return this.instance
            .bucket(this.bucketName)
            .upload(src, {
                destination: this.tmpFolderPath + this.addSlash_(dst)
            })
            .then(response => {
                debug(`Upload finished for ${src} to ${this.tmpFolderPath + this.addSlash_(dst)}`);
                return response[0];
            });
    }


    /**
     * Generic list method to list files of current google cloud bucket.
     * @returns {Promise}
     */
    listFiles(prefix = '') {
        return this.instance
          .bucket(this.bucketName)
          .getFiles({prefix})
          .then(files => ({ Contents: files[0].map(f => ({ Key: f.name }))}));
    }


    /**
     * Generic download method.
     * @param {string} downloadPath
     * @returns {Promise}
     */
    downloadToLocalTmp(downloadPath) {
        return mkdirp(path.join('./', this.tmpFolderPath))
            .then(() => {
                const tmpFileName = path.join('./', this.tmpFolderPath,
                    new Date().getTime() + (Math.random() + 1).toString(36).substring(6) + downloadPath.slice(downloadPath.lastIndexOf('.')));

                return this.instance
                    .bucket(this.bucketName)
                    .file(downloadPath)
                    .download({ destination: tmpFileName })
                    .then(() => {
                        debug(`File ${downloadPath} downloaded to ${tmpFileName}`);
                        return tmpFileName;
                    })
            });
    }


    /**
     * Removes an existing file.
     * @param {string} path
     * @returns {Promise}
     */
    remove(path) {
        debug(`Removing ${path} from bucket ${this.bucketName}.`);
        return this.instance
            .bucket(this.bucketName)
            .file(path)
            .delete()
            .then(response => {
                debug(`Successfully deleted ${path} from ${this.bucketName}`);
                return response;
            });
    }


    /**
     * Removes entire folder and its subfolders
     * @param  {string} folderPath
     * @return {Promise}
     */
    removeFolder(folderPath) {
        debug(`Removing folder at ${folderPath}`);
        return this.instance
            .bucket(this.bucketName)
            .getFiles({ prefix: `${folderPath}/` })
            .then(files => {
                const filesToDelete = files[0].map(f => this.remove(f.name));
                debug(`Deleting ${filesToDelete.length} files from ${folderPath}`);
                return Promise.all(filesToDelete);
            });
    }


    /**
     * Copies an existing file to a new location.
     * @param {string} src
     * @param {string} dst
     * @returns {Promise}
     */
    copy(src, dst) {
        debug(`Copying ${src} to ${dst}`);

        const file = this.instance.bucket(this.bucketName).file(dst);

        return this.instance
            .bucket(this.bucketName)
            .file(src)
            .copy(file);
    }


    /**
     * Moves an existing file to a new location.
     * @param  {string} src
     * @param  {string} dst
     * @return {Promise}
     */
    move(src, dst) {
        debug(`Moving ${src} to ${dst}`);

        return this.instance
            .bucket(this.bucketName)
            .file(src)
            .move(dst);
    }


    getFileSizeInBytes(src) {
        debug(`Getting file size for ${src}`);

        return this.instance
            .bucket(this.bucketName)
            .file(src)
            .getMetadata()
            .then(metadata => parseInt(metadata[0].size, 10));
    }
}

module.exports = GCloud;
