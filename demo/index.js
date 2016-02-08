'use strict';

const StaticStorage = require('../src')({
    'staticstorage': {
        "strategy": "s3",
        "rootPath": "../../public",
        "tmpFolderPath": "/tmp"
    },
    //'staticstorage': {
    //    "strategy": "local",
    //    "rootPath": "../preserved",
    //    "tmpFolderPath": "/tmp"
    //}
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

// s3
StaticStorage.uploadToTmp('../demo/demo.txt', 'tempFileName.txt');     // Upload file
//StaticStorage.readObject('tmp/tempFileName.txt');                    // Read file
//StaticStorage.move('tmp/tempFileName.txt', 'copy/tempFileName.txt'); // Move file
//StaticStorage.remove('copy/tempFileName.txt');                       // Remove file
//StaticStorage.remove('copy');                                        // Removes folder


// Local
//StaticStorage.upload('demo/demo.txt', 'memo/tempFileName.txt');           // Upload file
//StaticStorage.read('/tmp/tempFileName.txt');                              // Read file
//StaticStorage.move('/tmp/tempFileName.txt', 'copy/tempFileName.txt');     // Move file
//StaticStorage.remove('../preserved/tempFileName.txt');                    // Remove file
//StaticStorage.remove('../preserved');                                     // Remove folder
