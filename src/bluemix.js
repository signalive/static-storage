'use strict';

const S3 = require('./s3');
const Storage = require('ibm-cos-sdk');


class Bluemix extends S3 {
    constructor(configParams) {
        super(configParams);
        this.config = configParams;
        this.tmpFolderPath = configParams.staticstorage.tmpFolderPath.slice(1);
        this.bucketName = configParams.bluemix.bucketName;
        this.awsS3 = new Storage.S3({...configParams.bluemix});
    }
}

module.exports = Bluemix;
