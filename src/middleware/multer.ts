export {};

const multer = require('multer');
const {BadRequestError} = require('../utils/expressError')

const storage = multer.memoryStorage()
const upload = multer({
  storage:storage,
  limits:{
    fileSize:250000, //max size in bytes
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

module.exports = readMultipart;