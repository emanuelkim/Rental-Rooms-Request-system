const multer=require('multer')

const path=require('path')

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/uploads'); // Define the destination folder for uploaded images
    },
    filename: (req, file, cb) =>{
        
     
      cb(null, file.originalname); // Define the filename
     // cb(null,Date.now()+ ext)
    },
  });
  
  var upload=multer({
    storage:storage,
   
  })
  module.exports={upload};