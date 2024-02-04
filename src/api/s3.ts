import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const BUCKET_NAME = process.env.BUCKET_NAME;
const BUCKET_REGION = process.env.BUCKET_REGION;
const AWS_KEY = process.env.AWS_KEY;
const AWS_SECRET_KEY = process.env.AWS_SECRET_KEY;

let s3:null|S3Client = null

/** Creates a single */
function getS3():S3Client{
  if (!s3){
    s3 = new S3Client({
      credentials:{
        accessKeyId:AWS_KEY,
        secretAccessKey:AWS_SECRET_KEY,
      },
      region: BUCKET_REGION
    })
  }
  return s3;
}

async function uploadFile(file:any, folder=""){

  const key = (
    folder.length
      ? `${folder + '/' + file.originalname}`
      : ""
  );

  const params = {
    Bucket:BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  }
  const command = new PutObjectCommand(params);

  const response = await getS3().send(command);
  return response;
}

module.exports = {uploadFile}