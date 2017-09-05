'use strict';

const StaticStorage = require('../src')({
    // 'staticstorage': {
    //     "strategy": "azurestorage",
    //     "tmpFolderPath": "/tmp"
    // },
    // 'staticstorage': {
    //     "strategy": "s3",
    //     "tmpFolderPath": "/tmp"
    // },
    'staticstorage': {
       "strategy": "local",
       "rootPath": "../preserved",
       "tmpFolderPath": "/tmp"
    },
    'aws': {
        "general": {
            "region": "<region>",
            "accessKeyId": "<access_key_id>",
            "secretAccessKey": "<secret_access_key>"
        },
        "s3": {
            "bucket": "<bucket_name>"
        }
    },
    'azure': {
        "accountName": "<account_name>",
        "accountKey": "<account_key>",
        "containerName": "<container_name>"
    }
});

// azure storage
// StaticStorage.upload('demo/demo.txt', 'tat/tempFileName.txt');           // Upload file
// StaticStorage.uploadToTmp('demo/demo.txt', 'tempFileName.txt');        // Upload file
// StaticStorage.downloadToLocalTmp('tmp/tempFileName.txt');                 // Read file
// StaticStorage.copy('tmp/tempFileName.txt', 'copy/tempFileName.txt');      // Move file
// StaticStorage.remove('copy/tempFileName.txt');                            // Remove file
// StaticStorage.remove('copy');
// StaticStorage.listFiles().then(response => console.log(response));
// StaticStorage.getFileSizeInBytes('hayret/festivest/2a1995449069b71b116b72b3061fbe14.jpg').then(response => console.log(response))
// StaticStorage.removeFolder('memo').then(response => console.log(response));
StaticStorage.copy('hayret/festivest/2a1995449069b71b116b72b3061fbe14.jpg', 'memo/deneme.jpg').then(response => console.log(response));
// s3
// StaticStorage.uploadToTmp('../demo/demo.txt', 'tempFileName.txt');        // Upload file
//StaticStorage.downloadToLocalTmp('tmp/tempFileName.txt');                 // Read file
//StaticStorage.move('tmp/tempFileName.txt', 'copy/tempFileName.txt');      // Move file
//StaticStorage.remove('copy/tempFileName.txt');                            // Remove file
//StaticStorage.remove('copy');                                             // Removes folder


// Local
//StaticStorage.upload('demo/demo.txt', 'memo/tempFileName.txt');           // Upload file
//StaticStorage.downloadToLocalTmp('/tmp/tempFileName.txt');                // Read file
//StaticStorage.move('/tmp/tempFileName.txt', 'copy/tempFileName.txt');     // Move file
//StaticStorage.remove('../preserved/tempFileName.txt');                    // Remove file
//StaticStorage.remove('../preserved');                                     // Remove folder
