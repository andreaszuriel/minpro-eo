import multer from 'multer';

// In-memory storage
const storage = multer.memoryStorage();

// Configure multer options
export const upload = multer({
  storage,
  limits: {
    // Maximum file size 1 MB
    fileSize: 1 * 1024 * 1024, // 1MB
  },
  fileFilter: (req, file, cb) => {
    // Allow image types (jpg, jpeg, png) or pdf
    if (
      file.mimetype.startsWith('image/') ||
      file.mimetype === 'application/pdf'
    ) {
      cb(null, true);
    } else {
      // Cast the Error to any so that TypeScript accepts it.
      cb(new Error('Only JPG, JPEG, PNG and PDF files are allowed') as any, false);
    }
  },
});
