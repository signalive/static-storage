'use strict';

const StaticStorage = require('../src')({
    'staticstorage': {
        "strategy": "s3",
        "rootPath": "../../public",
        "tmpFolderPath": "/tmp"
    },
    'aws': {
        "general": {
            region: '<region>',
            accessKeyId: '<access_key_id>',
            secretAccessKey: '<secret_access_key>' },
        "s3": {
            "bucket": "<bucket_name>"
        }
    }
});

StaticStorage.uploadToTmp('../demo/demo.txt', 'tempFileName.txt');
