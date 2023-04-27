import express from "express";
import * as dotenv from "dotenv";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import util from "util";

import FileSchema from "./mongoDB/models/file.js";
import connectDB from './mongoDB/connect.js'
import { uploadFileToS3, getFileStream, deleteFile } from "./s3.js";

const uploadFileToServer = multer({ dest: "uploads/" }); // UPLOAD TEMPORARY FILE TO SERVER 
const unlinkFileFromServer = util.promisify(fs.unlink); // DELETE TEMPORARY FILE FROM SERVER

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// RETRIEVE DATA RECORDS FROM MONGODB

app.get("/files", async (req, res) => {
  try {
    const properties = await FileSchema.find({}).limit(req.query._end)
    res.status(200).json(properties)
    console.log(properties)
  } catch (error) {
    res.status(500).json({message: error.message})
  }
});

// UPLOAD FILE FROM SERVER TO S3

app.post("/files", uploadFileToServer.single("file"), async (req, res) => {

  // CHECK FOR INVALID FILE TYPES
  if (
    req.file.mimetype !== 'image/jpeg' &&
    req.file.mimetype !== 'image/png' &&
    req.file.mimetype !== 'application/pdf' &&
    req.file.mimetype !== 'application/msword' &&
    req.file.mimetype !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
) {
    await unlinkFileFromServer(req.file.path); // delete the file from the server
    return res.status(400).send({ error: 'Invalid file type. Please upload a JPEG, PNG, PDF, DOC or DOCX file.' });
}

  // CHECK FOR FILE SIZE RESTRICTIONS
  if (req.file.size > 2000000) { // 2 MB
    await unlinkFileFromServer(req.file.path); // delete the file from the server
    return res.status(400).send({ error: 'File size exceeds limit of 1 MB.' });
  }

  const fileOnServer = req.file;
  console.log("file is:", fileOnServer.originalname);

  const uploadedFile = await uploadFileToS3(fileOnServer);

  
  console.log(uploadedFile);

  const fileStoredInDB = new FileSchema({
    name: fileOnServer.originalname,
    bucket: uploadedFile.Bucket,
    url: uploadedFile.Location
  })

  await fileStoredInDB.save()
  await unlinkFileFromServer(fileOnServer.path);

  res.send(`name: ${uploadedFile.Key}  url: ${uploadedFile.Location}` );
});



// DOWNLOAD FILE FROM S3
app.get("/files/:key", async (req, res) => {
  const key = req.params.key;
  const downloadedFile = await getFileStream(key);
  console.log(downloadedFile.Body)
  res.send(downloadedFile.Body)
});


// DELETE FILE FROM S3
app.delete("/files/:key", async(req, res) => {
  const key = req.params.key;
  try {
    await deleteFile(key);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Failed to delete file from S3 or Invalid Key" });
  } 

  // DELETE RECORD FROM MONGODB 
  try {
    const deletedFile = await FileSchema.findOneAndDelete({ name: key });
    console.log("Deleted file from MongoDB: ", deletedFile);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Failed to delete file from MongoDB" });
  }

  res.send("File deleted successfuly")
});

// home page

app.get("/", async (req, res) => {
  res.send("Hello");
});

const startServer = async () => {

  try {
    connectDB(process.env.MONGODB_URL)
    app.listen(8080, () => console.log("listening to port 8080"));

  } catch (error) {
    console.log(error)
  }
};

startServer();
