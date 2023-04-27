import AWS from 'aws-sdk';
import * as dotenv from 'dotenv';
import fs from 'fs';
import shortid from 'shortid';

dotenv.config()

const bucket = process.env.AWS_BUCKET_NAME
const region = process.env.AWS_BUCKET_REGION
const accessKeyId = process.env.AWS_ACCESS_KEY
const secretAccessKey = process.env.AWS_SECRET_KEY

const s3 = new AWS.S3({
  region,
  accessKeyId,
  secretAccessKey
})

// upload file to s3
export const uploadFileToS3 = async (file) => {
  const fileStream = fs.createReadStream(file.path)
  // generate short link
  const shortLink = shortid.generate()

  const params = {
    Bucket: bucket,
    Body: fileStream,
    Key: shortLink,
  }

  const fileOnS3 = await s3.upload(params).promise()
  return fileOnS3;
}

// download a file from s3
export const getFileStream = async(fileKey) => {
  
  const params = {
    Key: fileKey,
    Bucket: bucket,
  }
  const downloadingFile = s3.getObject(params).promise()
  return downloadingFile
  // return s3.getObject(params).createReadStream()
}

// delete a file from s3 
export const deleteFile = async(fileKey) => {
  
  const params = {
    Key: fileKey,
    Bucket: bucket,
  }
  const deletingFile = s3.deleteObject(params).promise()
  return deletingFile
}