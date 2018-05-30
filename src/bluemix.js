'use strict';

const S3 = require('./s3');
const Storage = require('ibm-cos-sdk');


class Bluemix extends S3 {
    init() {
        this.tmpFolderPath = this.config.staticstorage.tmpFolderPath.slice(1);
        this.bucketName = this.config.bluemix.bucketName;
        this.awsS3 = new Storage.S3({...this.config.bluemix});
    }
}

module.exports = Bluemix;
