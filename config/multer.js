const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'public/productImages/');
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname);
    },
  });
  
  const bannerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/bannerImages/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    },
});

const bannerUpload = multer({ storage: bannerStorage });
  
  const upload = multer({ storage: storage });
  
  // Export the Multer instance
  module.exports = {
    upload: upload, // Your existing product image upload middleware
    bannerUpload: bannerUpload,
  }