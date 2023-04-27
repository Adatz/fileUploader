import mongoose from "mongoose";

const File = new mongoose.Schema({
  name: { type: String, require: true},
  bucket: { type: String, require: true},
  url: { type: String, require: true},
})

const FileSchema = mongoose.model('File', File);

export default FileSchema;