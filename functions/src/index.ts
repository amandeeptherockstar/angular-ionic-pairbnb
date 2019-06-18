import * as functions from 'firebase-functions';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs'; // for copying file
import * as Busboy from 'busboy';
import * as uuid from 'uuid/v1';
import { Storage } from '@google-cloud/storage';

const storage = new Storage({
  projectId: 'pairbnb-ionic-course',
  keyFilename: 'pairbnb-ionic-course-firebase-adminsdk-ag4v4-7957e1a20c.json'
});

import * as cpp from 'child-process-promise';
const spawn = cpp.spawn;

import * as corsHelper from 'cors';
const cors = corsHelper({ origin: true });

// import * as adminFile from '../pairbnb-ionic-course-firebase-adminsdk-ag4v4-7957e1a20c.json';

// for implementing authenticated users can only access
import * as fbAdmin from 'firebase-admin';
fbAdmin.initializeApp({
  credential: fbAdmin.credential.cert(
    require('../key/pairbnb-ionic-course-firebase-adminsdk-ag4v4-7957e1a20c.json')
  )
});

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//

export const resizeImage = functions.storage.object().onFinalize(event => {
  const object = event;

  const filePath = object.name as string;
  const metadata = object.metadata;
  const bucket = object.bucket;

  // check if the file starts with "resized-", stop the function execution if it does,

  if (path.basename(filePath).startsWith('resized-')) {
    console.log('THE FILE IS ALREADY RENAMED');
    return Promise.resolve(null);
  }

  // make a reference to bucket to fetch the image from
  const bucketRef = storage.bucket(bucket);

  // create a temp location path on server where we will store the file
  const tempFileLocation = path.join(os.tmpdir(), path.basename(filePath));

  // download the file now in tempFileLocation *filePath = sourceFilePath, *destination = destinationFilePath
  return bucketRef
    .file(filePath)
    .download({
      destination: tempFileLocation
    })
    .then(() => {
      // generate the resized image using imageMagic which is a program stored on firebase
      // to invoke that program we need a special library named child-process-promise
      return spawn('convert', [
        tempFileLocation,
        '-resize',
        '500x500',
        tempFileLocation
      ]);
    })
    .then(() => {
      // upload the file back to the bucket from our tempFileLocation
      return bucketRef.upload(tempFileLocation, {
        destination: 'images/' + 'resized-' + path.basename(filePath),
        metadata: metadata
      });
    });
});

export const uploadFile = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    if (req.method !== 'POST') {
      return res.status(500).json({
        message: 'Method Not Allowed'
      });
    }

    if (
      !req.headers.authorization ||
      !req.headers.authorization.startsWith('Bearer ')
    ) {
      return res.status(401).json({
        message: 'Unauthorized Access!'
      });
    }

    const token = req.headers.authorization.replace('Bearer ', '');

    const busboy = new Busboy({
      headers: req.headers
    });

    let uploadData: {
      tempfilepath: string;
      filename: string;
      mimetype: string;
    };

    // listen for file event
    busboy.on(
      'file',
      (
        fieldname: string,
        file,
        filename: string,
        encoding: string,
        mimetype: string
      ) => {
        // random int for making files always unique
        const timeNow = new Date().getTime().toString();
        // prepare tempFilePath to store then file
        const tempFileLocation = path.join(os.tmpdir(), timeNow + filename);
        uploadData = {
          tempfilepath: tempFileLocation,
          filename: timeNow + filename,
          mimetype: mimetype
        };

        // save the file detected by busboy to temp location
        file.pipe(fs.createWriteStream(tempFileLocation));
      }
    );

    // listen for finish event
    busboy.on('finish', () => {
      const id = uuid();

      // create reference to the bucket
      const bucketRef = storage.bucket('pairbnb-ionic-course.appspot.com');

      // provide the token to the fbAdmin, so that we can authorized us as valid user
      return fbAdmin
        .auth()
        .verifyIdToken(token)
        .then(decodedToken => {
          // upload the data back to bucket
          return bucketRef.upload(uploadData.tempfilepath, {
            destination: 'images/' + uploadData.filename,
            metadata: {
              metadata: {
                contentType: uploadData.mimetype
              },
              firebaseStorageDownloadTokens: id
            }
          });
        })
        .then(() => {
          // get back the resized image url too
          return bucketRef
            .file('images/resized-' + uploadData.filename)
            .getSignedUrl({
              action: 'read',
              expires: '03-01-2500'
            });
        })
        .then((imageUrl: any) => {
          return res.status(200).json({
            message: 'It Worked',
            imageUrl: {
              small: imageUrl[0],
              small_fileName: uploadData.filename,
              normal:
                'https://firebasestorage.googleapis.com/v0/b/' +
                storage.bucket('pairbnb-ionic-course.appspot.com').name +
                '/o/' +
                encodeURIComponent('images/' + uploadData.filename) +
                '?alt=media&token=' +
                id,
              normal_fileName: 'resized-' + uploadData.filename
            }
          });
        })
        .catch(err => {
          console.log(err);
          return res.status(500).json({
            message: 'Something Went Wrong on Server!'
          });
        });
    });
    // starts the whole process
    return busboy.end(req.rawBody);
  });
});

export const deleteImage = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'DELETE') {
      return Promise.resolve(
        res.status(500).json({
          message: 'Not Allowed'
        })
      );
    }

    // check if the token exists ?
    if (
      !req.headers.authorization ||
      !req.headers.authorization.startsWith('Bearer ')
    ) {
      return res.status(401).json({
        message: 'Unauthorized Access!'
      });
    }

    // extract the token sent via auth header
    const token = req.headers.authorization.split(' ')[1];

    const normalFile = req.body.normal;
    const resizedFile = req.body.resized;
    console.log('NORMAL FILE ' + normalFile);
    console.log('RESIZED FILE ' + resizedFile);

    // verify the id token
    try {
      await fbAdmin.auth().verifyIdToken(token);
    } catch (e) {
      return res.status(401).json({
        message: 'Invalid Id Token!'
      });
    }

    // create bucket ref
    const bucketRef = storage.bucket('pairbnb-ionic-course.appspot.com');
    const normalFileRef = bucketRef.file('images/' + normalFile);
    const resizedFileRef = bucketRef.file('images/' + resizedFile);

    const normalFileExists = await normalFileRef.exists();
    const resizedFileExists = await resizedFileRef.exists();

    if (normalFileExists) {
      await normalFileRef.delete();
    }
    if (resizedFileExists) {
      await resizedFileRef.delete();
    }

    if (!resizedFileExists && !normalFileExists) {
      console.log('FILES WERE ALREADY DELTED');
      return Promise.resolve(
        res.status(500).json({
          message: 'Files were already Deleted'
        })
      );
    }

    console.log('FILES ARE DELETED');
    return Promise.resolve(
      res.status(200).json({
        message: 'Files Delted'
      })
    );
  });
});
