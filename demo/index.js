'use strict';

const util = require('util');
const StaticStorage = require('../src')({
    // 'staticstorage': {
    //     "strategy": "azurestorage",
    //     "tmpFolderPath": "/tmp"
    // },
    // 'staticstorage': {
    //     "strategy": "aws",
    //     "tmpFolderPath": "/tmp"
    // },
    // 'staticstorage': {
    //    "strategy": "local",
    //    "rootPath": "../preserved",
    //    "tmpFolderPath": "/tmp"
    // },
    // 'staticstorage': {
    //   "strategy": "gcloud",
    //   "tmpFolderPath": "/tmp"
    // },
    staticstorage: {
      strategy: 'minio',
      tmpFolderPath: '/tmp',
      rootPath: '/public'
    },
    strategySettings: {
      bluemix: {
        bucketName: '<bucket_name>',
        locationConstraint: 'us-standard',
        endpoint: 's3.eu-geo.objectstorage.softlayer.net',
        apiKeyId: '<api_key_id>',
        ibmAuthEndpoint: 'https://iam.ng.bluemix.net/oidc/token',
        serviceInstanceId: '<service_instance_id>',
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
      },
      'gcloud': {
          "projectId": "<project_id>",
          "bucketName": "<bucket_name>"
      },
      'minio': {
        "endPoint": "localhost",
        "port": "9000",
        "bucketName": "static",
        "accesskeyid": 'KT5KRrCqk62KSHu8',
        "secretaccesskey": 'sMelEcokbZcYbRWRjLKasMSO8j5qkFPt',
      }
    }
});

async function run() {
  // azure storage
  // await StaticStorage.upload('demo/demo.txt', 'tat/tempFileName.txt');            // Upload file
  // await StaticStorage.uploadToTmp('demo/demo.txt', 'tempFileName.txt');           // Upload file
  // await StaticStorage.downloadToLocalTmp('tmp/tempFileName.txt');                 // Read file
  // await StaticStorage.copy('tmp/tempFileName.txt', 'copy/tempFileName.txt');      // Move file
  // await StaticStorage.remove('copy/tempFileName.txt');                            // Remove file
  // await StaticStorage.remove('copy');
  // await StaticStorage.listFiles().then(response => console.log(response));
  // await StaticStorage.getFileSizeInBytes('hayret/festivest/2a1995449069b71b116b72b3061fbe14.jpg').then(response => console.log(response))
  // await StaticStorage.removeFolder('memo').then(response => console.log(response));
  // await StaticStorage.copy('hayret/festivest/2a1995449069b71b116b72b3061fbe14.jpg', 'memo/deneme.jpg').then(response => console.log(response));

  // s3
  // await StaticStorage.uploadToTmp('../demo/demo.txt', 'tempFileName.txt');        // Upload file
  //await StaticStorage.downloadToLocalTmp('tmp/tempFileName.txt');                  // Read file
  //await StaticStorage.move('tmp/tempFileName.txt', 'copy/tempFileName.txt');       // Move file
  //await StaticStorage.remove('copy/tempFileName.txt');                             // Remove file
  //await StaticStorage.remove('copy');

  // await StaticStorage.uploadToTmp('../demo/demo.txt', 'tempFileName.txt');        // Upload file
  // await StaticStorage.downloadToLocalTmp('tmp/tempFileName.txt');                 // Read file
  // await StaticStorage.move('tmp/tempFileName.txt', 'copy/tempFileName.txt');      // Move file
  // await StaticStorage.remove('copy/tempFileName.txt');                            // Remove file
  // await StaticStorage.remove('copy');

  // Google Cloud
  // await StaticStorage.move('demo.txt', 'tmp/demo2.txt');
  // await StaticStorage.copy('demo.txt', 'demo2.txt');
  // await StaticStorage.remove('demo.txt');
  // await StaticStorage.upload('demo.txt', 'test/demo.txt');
  // await StaticStorage.upload('demo.txt', 'demo.txt');
  // await StaticStorage.uploadToTmp('demo.txt', 'demo-2.txt');
  // await StaticStorage.removeFolder('tmp');
  // await StaticStorage.downloadToLocalTmp('demo2.txt');
  // await StaticStorage.getFileSizeInBytes('demo2.txt').then(a => console.log('a', a));

  // Bluemix
  // await StaticStorage.move('demo.txt', 'tmp/demo2.txt');
  // await StaticStorage.copy('demo.txt', 'demo2.txt');
  // await StaticStorage.remove('demo.txt');
  // await StaticStorage.upload('./demo.txt', 'test/demo.txt');
  // await StaticStorage.upload('demo.txt', 'demo.txt');
  // await StaticStorage.uploadToTmp('demo.txt', 'demo-2.txt');
  // await StaticStorage.removeFolder('test');
  // await StaticStorage.downloadToLocalTmp('demo2.txt');
  // await StaticStorage.getFileSizeInBytes('demo2.txt').then(a => console.log('a', a));


  // Minio
  await StaticStorage.listFiles().then(r => console.log(util.inspect(r.map(({Key}) => Key), {depth: 5, colors: true})));
  await StaticStorage.upload('demo.txt', 'demo.txt');
  await StaticStorage.copy('demo.txt', 'demo2.txt');
  await StaticStorage.move('demo.txt', 'tmp/demo2.txt');
  await StaticStorage.upload('./demo.txt', 'test/demo.txt');
  await StaticStorage.uploadToTmp('demo.txt', 'demo-2.txt');
  await StaticStorage.listFiles().then(r => console.log(util.inspect(r.map(({Key}) => Key), {depth: 5, colors: true})));
  await StaticStorage.removeFolder('test');
  await StaticStorage.downloadToLocalTmp('demo2.txt');
  await StaticStorage.downloadToLocalTmp('tmp/demo2.txt');
  await StaticStorage.getFileSizeInBytes('demo2.txt').then(size => console.log('Size is', size));
  await StaticStorage.remove('demo2.txt');
  await StaticStorage.remove('tmp/demo2.txt');
  await StaticStorage.remove('tmp/demo-2.txt');
  await StaticStorage.listFiles().then(r => console.log(util.inspect(r.map(({Key}) => Key), {depth: 5, colors: true})));

  // Local
  //await StaticStorage.upload('demo/demo.txt', 'memo/tempFileName.txt');            // Upload file
  //await StaticStorage.downloadToLocalTmp('/tmp/tempFileName.txt');                 // Read file
  //await StaticStorage.move('/tmp/tempFileName.txt', 'copy/tempFileName.txt');      // Move file
  //await StaticStorage.remove('../preserved/tempFileName.txt');                     // Remove file
  //await StaticStorage.remove('../preserved');                                      // Remove folder

  console.log('Demo test is completed with success');
}

run();