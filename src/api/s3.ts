import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { mockDeep } from 'jest-mock-extended';
import { BadRequestError } from "../utils/expressError";

const BUCKET_NAME = process.env.BUCKET_NAME;
const BUCKET_REGION = process.env.BUCKET_REGION;
const AWS_KEY = process.env.AWS_KEY;
const AWS_SECRET_KEY = process.env.AWS_SECRET_KEY;

let s3 = null;


/** Returns either an s3 instance or a mock of an s3 instance for testing */
function getS3(): S3Client {
  if (!s3) {

    if (process.env.NODE_ENV === 'test') {
      console.log("Loading mock s3 for testing");
      let mockS3 = mockDeep() as unknown as S3Client;
      s3 = mockS3;
    } else {
      s3 = new S3Client({
        credentials: {
          accessKeyId: AWS_KEY,
          secretAccessKey: AWS_SECRET_KEY,
        },
        region: BUCKET_REGION
      });
    }

  }
  return s3;
}

/** Accepts a file and the path for saving that file.
 * Saves the file to the indicated path in the parsley s3 bucket.
 *
 * Returns the response from the s3 server.
 */
async function uploadFile(file: any, path: string) {

  const params = {
    Bucket: BUCKET_NAME,
    Key: path,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  const command = new PutObjectCommand(params);
  const response = await getS3().send(command);
  return response;
}

/** Accepts a path to a file on the s3 server abdremoves that file.
 *
 * Returns the response from the s3 server.
 */
async function deleteFile(path: string) {

  const params = {
    Bucket: BUCKET_NAME,
    Key: path,
  };

  const command = new DeleteObjectCommand(params);
  console.log("command", command);
  const response = await getS3().send(command);
  console.log(response);
  return response;
}





export { uploadFile, deleteFile };