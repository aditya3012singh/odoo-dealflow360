import { Router } from 'express';
import multer from 'multer';
import { UploadController } from './upload.controller.js';
import { authenticateJWT } from '../../api/middleware/auth.middleware.js';

const router = Router();

// Configure in-memory multer storage with 10MB limit and image file type validation
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type: Only images are allowed'));
    }
  },
});

// Protect upload routes so only logged in users (Admin / Sales Rep) can obtain upload signatures or upload assets
router.use(authenticateJWT);

// Route 1: Get signature for direct frontend browser -> Cloudinary upload
router.get('/cloudinary-sign', UploadController.getSignature);

// Route 2: Fallback server-side upload
router.post('/image', upload.single('file'), UploadController.uploadImage);

export default router;
