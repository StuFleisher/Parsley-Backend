export {};

import multer from 'multer';
import { BadRequestError } from '../utils/expressError';

const storage = multer.memoryStorage()
const upload = multer({
  storage:storage,
  limits:{
    fileSize:25000000, //max size in bytes 25mb
  },
  fileFilter: function(req:any,file:any,cb:any){
    if (file.mimetype.startsWith('image/')) {
      cb(null, true); // Accept the file
    } else {
        cb(
          new BadRequestError('Not an image! Please upload only images.'),
          false
        ); // Reject the file
    }
  }
})

function readMultipart(fieldName:string){
  return upload.single(`${fieldName}`);
}

export default readMultipart;