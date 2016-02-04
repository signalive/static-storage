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

StaticStorage.uploadToTmp('../demo/demo.txt', 'tempFileName.txt');     // Upload file
//StaticStorage.readObject('tmp/tempFileName.txt');                    // Read file
//StaticStorage.move('tmp/tempFileName.txt', 'copy/tempFileName.txt'); // Move file
//StaticStorage.remove('copy/tempFileName.txt');                       // Remove file
//StaticStorage.remove('copy');                                        // Removes folder
