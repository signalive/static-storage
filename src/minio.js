const minio = require('minio')
const path = require('path');
const mkdirp = require('mkdirp-then');
const debug = require('debug')('static-storage:gcloud');
const MimeDetector = require('mime-types');
MimeDetector.types.gz = 'application/x-gzip';

class Minio {
    constructor(configParams) {
        this.config = configParams;
        this.tmpFolderPath = this.config.staticstorage.tmpFolderPath.slice(1);
        this.bucketName = this.config.minio.bucketName;

        this.minio =  new minio.Client({
            endPoint: this.config.minio.endPoint,
            port: parseInt(this.config.minio.port, 10),
            accessKey: this.config.minio.accessKeyId,
            secretKey: this.config.minio.secretAccessKey,
            useSSL: false
        });

        this.createBucketIfNotExists();
    }


    /**
     * Create bucket on initialization.
     * @return {Promise}
     */
     async createBucketIfNotExists() {
        debug(`Checking if bucket exists: ${this.bucketName}`);

        const exists = await this.minio.bucketExists(this.bucketName);
        if (!exists) {
            console.log(`Bucket ${this.bucketName} does not exist, will create one`);
            await this.minio.makeBucket(this.bucketName, 'eu-west-1');
        }
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
    async upload(src, dst) {
        debug(`Uploading from local ${src} to bucket ${this.bucketName}.`);

        const stats = await this.minio.fPutObject(this.bucketName, dst, src, {
            'Content-Type': MimeDetector.contentType(path.extname(src)) || 'application/octet-stream'
        });

        return stats;
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
    listFiles(prefix = '') {
        return new Promise((resolve, reject) => {
            const list = [];
            const stream = this.minio.listObjects(this.bucketName, prefix, true);

            stream.on('error', function(err) {
                console.log('Error while listing files', err);
                reject(err);
            });

            stream.on('data', function(obj) {
                list.push(obj);
            });

            stream.on('end', function () {
                resolve({
                  Contents: list.map(obj => ({Key: obj.name}))
                });
            });
        });
    }


    /**
     * Generic download method.
     * @param {string} downloadPath
     * @returns {Promise}
     */
    async downloadToLocalTmp(downloadPath) {
        await mkdirp(path.join('./', this.tmpFolderPath));

        const tmpFileName = path.join('./', this.tmpFolderPath,
            new Date().getTime() + downloadPath.slice(downloadPath.lastIndexOf('.')));
        await this.minio.fGetObject(this.bucketName, downloadPath, tmpFileName);

        return tmpFileName;
    }


    /**
     * Removes an existing file.
     * @param {string} path
     * @returns {Promise}
     */
    async remove(path) {
        debug(`Removing ${path} from bucket ${this.bucketName}.`);
        await this.minio.removeObject(this.bucketName, path);
    }


    /**
     * Removes entire folder and its subfolders
     * @param  {string} folderPath
     * @return {Promise}
     */
    async removeFolder(folderPath) {
        debug(`Removing folder at ${folderPath}`);
        const {Contents: files} = await this.listFiles(folderPath);
        await this.minio.removeObjects(this.bucketName, files.map(({Key}) => Key));
    }


    /**
     * Copies an existing file to a new location.
     * @param {string} src
     * @param {string} dst
     * @returns {Promise}
     */
    async copy(src, dst) {
        debug(`Copying file ${src} to ${dst}.`);
        await this.minio.copyObject(this.bucketName, dst, path.join(this.bucketName, src));
    }


    /**
     * Moves file.
     * @param {string} src Path of source file.
     * @param {string} dst Path of distance file.
     * @returns {Promise}
     */
    async move(src, dst) {
        await this.copy(src, dst);
        await this.remove(src);
    }


    async stats_(src) {
        const stats = await this.minio.statObject(this.bucketName, src);
        return stats;
    }


    async getFileSizeInBytes(src) {
        const metadata = await this.stats_(src);
        return parseInt(metadata.size, 10);
    }
}

module.exports = Minio;